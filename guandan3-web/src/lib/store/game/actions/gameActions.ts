import { supabase } from '@/lib/supabase/client'
import { devError, devLog, devWarn, isDev } from '@/lib/utils/devLog'
import type { GameState, Card, GameRow, LastAction } from '../types'
import type { TurnRow } from '../types'
import { normalizeRecentTurns, computeLastActionFromRecentTurns } from '../utils/normalizers'

/**
 * 游戏数据获取动作
 */
export async function fetchGame(this: GameState, roomId: string): Promise<void> {
  if (isDev()) devLog('[fetchGame] Called for room:', roomId)

  // 1. 获取活跃游戏
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id,room_id,status,turn_no,current_seat,state_public,state_private')
    .eq('room_id', roomId)
    .in('status', ['playing', 'paused', 'finished'])

  const game = games && games.length > 0 ? games[0] : null

  if (isDev()) devLog('[fetchGame] Game query result:', { hasGame: !!game, gameError: gamesError })

  if (gamesError) {
    devError('Fetch game error:', gamesError)
    return
  }

  if (!game) {
    if (isDev()) devLog('[fetchGame] No game found, resetting')
    this.resetGame()
    return
  }

  const statePublic = game.state_public as { counts?: number[]; rankings?: number[]; levelRank?: number } | undefined
  const counts = statePublic?.counts || [27, 27, 27, 27]
  const rankings = statePublic?.rankings || []
  const levelRank = statePublic?.levelRank || 2

  // 更新基础游戏状态
  this.setGame({
    gameId: game.id,
    status: game.status as 'deal' | 'playing' | 'paused' | 'finished',
    turnNo: game.turn_no,
    currentSeat: game.current_seat,
    levelRank,
    counts,
    rankings,
    pausedBy: null,
    pausedAt: null,
    pauseReason: null
  })

  // 2. 获取玩家手牌
  await fetchPlayerHand.call(this, game.id, roomId, game.state_private)

  // 3. 获取最后一个出牌动作
  const lastAction = await this.fetchLastTrickPlay()
  this.setGame({ lastAction })
}

/**
 * 获取玩家手牌
 */
async function fetchPlayerHand(this: GameState, gameId: string, roomId: string, statePrivate: GameRow['state_private']): Promise<void> {
  // 获取用户座位号
  const { data: { user } } = await supabase.auth.getUser()
  let mySeatNo: number | undefined
  let myUid: string | undefined

  if (user?.id) {
    myUid = user.id
    const { data: memberData } = await supabase
      .from('room_members')
      .select('seat_no')
      .eq('room_id', roomId)
      .eq('uid', user.id)
      .maybeSingle()
    mySeatNo = memberData?.seat_no
  }

  let myHand: Card[] | null = null

  if (isDev()) {
    devLog('[fetchGame] Hand lookup:', {
      hasStatePrivate: !!statePrivate,
      hasHandsInStatePrivate: !!statePrivate?.hands,
      handsKeys: statePrivate?.hands ? Object.keys(statePrivate.hands) : [],
      mySeatNo,
      myUid
    })
  }

  // 练习模式回退：使用第一个可用座位
  if (mySeatNo === undefined && statePrivate?.hands) {
    mySeatNo = statePrivate.hands['0'] ? 0
      : statePrivate.hands['1'] ? 1
      : statePrivate.hands['2'] ? 2
      : statePrivate.hands['3'] ? 3
      : undefined
    if (mySeatNo !== undefined && isDev()) {
      devLog('[fetchGame] Using fallback seat_no:', mySeatNo)
    }
  }

  // 从 state_private 获取手牌
  if (statePrivate?.hands && mySeatNo !== undefined) {
    const handData = statePrivate.hands[String(mySeatNo)] || statePrivate.hands[mySeatNo]
    if (handData && Array.isArray(handData)) {
      myHand = handData as Card[]
      if (isDev()) devLog('[fetchGame] Got hand from state_private:', { cardsCount: myHand.length, seatNo: mySeatNo })
    }
  }

  // 回退：从 game_hands 表获取
  if (!myHand && mySeatNo !== undefined) {
    if (isDev()) devLog('[fetchGame] Querying game_hands table:', { gameId, seatNo: mySeatNo })

    const { data: hands, error: handsError } = await supabase
      .from('game_hands')
      .select('hand')
      .eq('game_id', gameId)
      .eq('seat_no', mySeatNo)
      .maybeSingle()

    if (isDev()) {
      devLog('[fetchGame] game_hands query result:', {
        hasData: !!hands,
        hasHand: !!hands?.hand,
        handLength: hands?.hand ? JSON.stringify(hands.hand).length : 0,
        error: handsError
      })
    }

    if (handsError) {
      devError('[fetchGame] game_hands query error:', handsError)
    } else if (hands?.hand) {
      let handData = hands.hand
      if (typeof handData === 'string') {
        if (isDev()) devLog('[fetchGame] hand 是字符串，正在解析...', { stringLength: handData.length })
        try {
          handData = JSON.parse(handData)
          if (isDev()) devLog('[fetchGame] hand 解析成功', { isArray: Array.isArray(handData), length: handData?.length })
        } catch (e) {
          devError('[fetchGame] hand 解析失败:', e)
          handData = null
        }
      }
      if (Array.isArray(handData)) {
        myHand = handData as Card[]
        if (isDev()) devLog('[fetchGame] Got hand from game_hands table:', { cardsCount: myHand.length, seatNo: mySeatNo })
      }
    }
  }

  if (myHand) {
    const sortedHand = myHand.toSorted((a, b) => {
      if (a.val !== b.val) return b.val - a.val
      return b.suit.localeCompare(a.suit)
    })
    if (isDev()) devLog('[fetchGame] 准备更新 myHand:', { cardsCount: sortedHand.length, sample: sortedHand[0] })
    this.updateHand(sortedHand)
    if (isDev()) devLog('[fetchGame] myHand 已更新')
  } else {
    if (isDev()) devLog('[fetchGame] No hand data found for seatNo:', mySeatNo, 'state_private:', statePrivate)
  }
}

/**
 * 开始游戏
 */
export async function startGame(this: GameState, roomId: string): Promise<void> {
  const { error } = await supabase.rpc('start_game', { p_room_id: roomId })
  if (error) {
    devError('Start game failed:', error)
    throw error
  }
  await this.fetchGame(roomId)
}

/**
 * 获取 AI 手牌
 */
export async function getAIHand(this: GameState, seatNo: number): Promise<Card[]> {
  const { gameId } = this
  if (!gameId) return []

  const { data, error } = await supabase.rpc('get_ai_hand', {
    p_game_id: gameId,
    p_seat_no: seatNo
  })

  if (error) {
    devError('getAIHand error:', error)
    return []
  }

  return (data as unknown as Card[]) || []
}

/**
 * 获取最后一个出牌动作
 */
export async function fetchLastTrickPlay(this: GameState): Promise<LastAction> {
  const { gameId, currentSeat } = this
  if (!gameId) return null

  const { data: turns } = await supabase
    .from('turns')
    .select('payload, seat_no, turn_no')
    .eq('game_id', gameId)
    .order('turn_no', { ascending: false })
    .limit(4)

  const normalized = Array.isArray(turns) ? turns.map(t => ({
    turn_no: typeof t.turn_no === 'number' ? t.turn_no : 0,
    seat_no: typeof t.seat_no === 'number' ? t.seat_no : 0,
    payload: t.payload as { type: 'play' | 'pass'; cards?: Card[] },
  })) : []

  const nextRecent = normalizeRecentTurns(normalized)
  this.setGame({ recentTurns: nextRecent })
  return computeLastActionFromRecentTurns(nextRecent, currentSeat)
}

/**
 * 获取指定回合之后的回合记录
 */
export async function fetchTurnsSince(this: GameState, gameId: string, fromTurnNo: number): Promise<TurnRow[]> {
  const { data, error } = await supabase.rpc('get_turns_since', {
    p_game_id: gameId,
    p_from_turn_no: fromTurnNo
  })

  if (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'PGRST202') return []
    devError('Fetch turns since error:', error)
    throw error
  }

  const turns = Array.isArray(data) ? data as TurnRow[] : []

  if (turns.length > 0 && this.gameId === gameId) {
    const current = this.recentTurns || []
    const nextRecent = normalizeRecentTurns([...turns, ...current])
    this.setGame({
      recentTurns: nextRecent,
      lastAction: computeLastActionFromRecentTurns(nextRecent, this.currentSeat)
    })
  }

  return turns
}
