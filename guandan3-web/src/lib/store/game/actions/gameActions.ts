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
  // 注意：需要包含 'deal' 状态以支持练习模式的初始状态
  // 使用 or() 代替 in() 避免400错误
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id,room_id,status,turn_no,current_seat,state_public,state_private,paused_by,paused_at,pause_reason')
    .eq('room_id', roomId)
    .or('status.in.(deal,playing,paused,finished)')

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
  // 注意：status 直接使用 API 返回的值，不进行类型转换
  this.setGame({
    gameId: game.id,
    status: game.status as 'deal' | 'playing' | 'paused' | 'finished',
    turnNo: game.turn_no,
    currentSeat: game.current_seat,
    levelRank,
    counts,
    rankings,
    pausedBy: (game as any).paused_by || null,
    pausedAt: (game as any).paused_at || null,
    pauseReason: (game as any).pause_reason || null
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
      statePrivateKeys: statePrivate ? Object.keys(statePrivate) : [],
      mySeatNo,
      myUid
    })
  }

  // 检测 state_private 的结构
  // 新结构：{"0": [...], "1": [...], ...}
  // 旧结构：{"hands": {"0": [...], ...}}
  const isNewStructure = statePrivate && !statePrivate.hands && Object.keys(statePrivate).some(k => ['0', '1', '2', '3'].includes(k))

  // 练习模式回退：使用第一个可用座位
  if (mySeatNo === undefined) {
    if (isNewStructure) {
      // 新结构：直接从 state_private 读取
      mySeatNo = statePrivate['0'] ? 0
        : statePrivate['1'] ? 1
        : statePrivate['2'] ? 2
        : statePrivate['3'] ? 3
        : undefined
    } else if (statePrivate?.hands) {
      // 旧结构：从 state_private.hands 读取
      mySeatNo = statePrivate.hands['0'] ? 0
        : statePrivate.hands['1'] ? 1
        : statePrivate.hands['2'] ? 2
        : statePrivate.hands['3'] ? 3
        : undefined
    }
    if (mySeatNo !== undefined && isDev()) {
      devLog('[fetchGame] Using fallback seat_no:', mySeatNo)
    }
  }

  // 从 state_private 获取手牌
  if (mySeatNo !== undefined) {
    let handData: unknown = null

    if (isNewStructure) {
      // 新结构：直接从 state_private 读取
      handData = statePrivate[String(mySeatNo)] || statePrivate[mySeatNo]
      if (isDev()) devLog('[fetchGame] Using new state_private structure')
    } else if (statePrivate?.hands) {
      // 旧结构：从 state_private.hands 读取
      handData = statePrivate.hands[String(mySeatNo)] || statePrivate.hands[mySeatNo]
      if (isDev()) devLog('[fetchGame] Using old state_private.hands structure')
    }

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
    if (isDev()) {
      devLog('[fetchGame] No hand data found for seatNo:', mySeatNo, 'state_private keys:', statePrivate ? Object.keys(statePrivate) : 'null')
    }
  }
}

/**
 * 开始游戏
 * 修复问题#11: 游戏启动失败时自动清理旧游戏
 */
export async function startGame(this: GameState, roomId: string): Promise<void> {
  // 修复问题#11: 先检查是否有playing状态的游戏，如果有则先结束它
  const { data: existingGames } = await supabase
    .from('games')
    .select('id')
    .eq('room_id', roomId)
    .or('status.in.(playing,deal,paused)')
    .limit(1)

  if (existingGames && existingGames.length > 0) {
    devLog('[startGame] 发现进行中的游戏，先结束它:', existingGames[0].id)

    // 结束旧游戏
    const { error: endError } = await supabase
      .from('games')
      .update({ status: 'finished' })
      .eq('id', existingGames[0].id)

    if (endError) {
      devWarn('[startGame] 结束旧游戏失败:', endError)
    } else {
      devLog('[startGame] 已结束旧游戏')
    }
  }

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

  // 验证参数
  if (!gameId) {
    devLog('[getAIHand] gameId 为空，跳过')
    return []
  }

  if (seatNo < 0 || seatNo > 3) {
    devWarn('[getAIHand] 座位号无效:', seatNo)
    return []
  }

  devLog('[getAIHand] 调用 RPC:', { gameId, seatNo })

  const { data, error } = await supabase.rpc('get_ai_hand', {
    p_game_id: gameId,
    p_seat_no: seatNo
  })

  // 修复问题#13: RPC成功时直接返回
  if (!error && data) {
    return (data as unknown as Card[]) || []
  }

  // RPC失败时，尝试fallback从game_hands表读取
  devError('[getAIHand] RPC 错误:', {
    error,
    gameId,
    seatNo,
    message: error.message,
    details: error.details,
    hint: error.hint
  })

  // fallback: 从 game_hands 表读取
  devLog('[getAIHand] RPC失败，尝试从game_hands表读取...')
  const { data: hands, error: handsError } = await supabase
    .from('game_hands')
    .select('hand')
    .eq('game_id', gameId)
    .eq('seat_no', seatNo)
    .maybeSingle()

  if (handsError) {
    devError('[getAIHand] game_hands查询也失败:', handsError)
    return []
  }

  if (hands?.hand) {
    let handData = hands.hand
    if (typeof handData === 'string') {
      try {
        handData = JSON.parse(handData)
      } catch (e) {
        devError('[getAIHand] hand解析失败:', e)
        return []
      }
    }
    if (Array.isArray(handData)) {
      devLog('[getAIHand] 从game_hands表成功获取手牌:', { cardsCount: handData.length })
      return handData as Card[]
    }
  }

  devLog('[getAIHand] 所有fallback都失败，尝试state_public')

  // 最后的fallback：从state_public读取手牌
  try {
    const { data: game } = await supabase
      .from('games')
      .select('state_public')
      .eq('id', gameId)
      .single();

    if (game?.state_public && typeof game.state_public === 'object') {
      const state = game.state_public as any;
      if (state.hands && state.hands[seatNo]) {
        const fallbackHand = state.hands[seatNo];
        if (Array.isArray(fallbackHand) && fallbackHand.length > 0) {
          devLog('[getAIHand] 从state_public成功获取手牌:', { cardsCount: fallbackHand.length })
          return fallbackHand as Card[];
        }
      }
    }
  } catch (e) {
    devError('[getAIHand] state_public fallback失败:', e);
  }

  return []
}

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
