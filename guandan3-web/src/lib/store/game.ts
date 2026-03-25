import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'
import { throttle } from '@/lib/utils/throttle'
import { devError, devLog, devWarn, isDev } from '@/lib/utils/devLog'
import { realtimeOptimizer } from '@/lib/performance/realtime-optimizer'

export interface Card {
  suit: 'H' | 'D' | 'C' | 'S' | 'J'
  rank: string
  val: number
  id: number
}

type TurnRow = { turn_no: number; seat_no: number; payload: any }
type LastAction = { seatNo: number; type: 'play' | 'pass'; cards?: Card[] } | null

const normalizeRecentTurns = (turns: TurnRow[]) => {
  const dedup = new Map<number, TurnRow>()
  for (const t of turns) {
    if (typeof t.turn_no !== 'number') continue
    if (!dedup.has(t.turn_no)) dedup.set(t.turn_no, t)
  }
  return Array.from(dedup.values()).sort((a, b) => b.turn_no - a.turn_no).slice(0, 4)
}

const computeLastActionFromRecentTurns = (recentTurns: TurnRow[], currentSeat: number): LastAction => {
  let consecutivePasses = 0
  for (const t of recentTurns) {
    if (t.payload?.type === 'pass') {
      consecutivePasses++
      continue
    }
    if (t.payload?.type === 'play') {
      if (consecutivePasses >= 3 || t.seat_no === currentSeat) return null
      return { type: 'play', cards: t.payload.cards, seatNo: t.seat_no }
    }
  }
  return null
}

interface GameState {
  gameId: string | null
  status: 'deal' | 'playing' | 'paused' | 'finished'
  turnNo: number
  currentSeat: number
  levelRank: number
  recentTurns: TurnRow[]
  myHand: Card[]
  lastAction: LastAction
  scores: Record<string, number>
  counts: number[] // Remaining cards per seat
  rankings: number[] // Finishing order [seatNo, seatNo, ...]
  
  // Pause state
  pausedBy: string | null
  pausedAt: string | null
  pauseReason: string | null
  
  // Tribute state
  tributePhase: boolean
  tributeFrom: number[] // Seats that need to tribute
  tributeTo: number[] // Seats that receive tribute
  resistTribute: number[] // Seats that resist tribute
  tributeCards: Record<number, Card[]> // Cards to tribute per seat
  returnCards: Record<number, Card[]> // Cards to return per seat
  
  setGame: (data: Partial<GameState>) => void
  resetGame: () => void
  updateHand: (cards: Card[]) => void
  playTurn: (cards: Card[]) => Promise<void>
  fetchGame: (roomId: string) => Promise<void>
  subscribeGame: (roomId: string, options?: { onStatus?: (status: string) => void }) => () => void
  startGame: (roomId: string) => Promise<void>
  submitTurn: (type: 'play' | 'pass', cards?: Card[]) => Promise<any>
  getAIHand: (seatNo: number) => Promise<Card[]>
  fetchLastTrickPlay: () => Promise<{ type: 'play' | 'pass', cards?: Card[], seatNo: number } | null>
  fetchTurnsSince: (gameId: string, fromTurnNo: number) => Promise<TurnRow[]>
  calculateTribute: () => Promise<void>
  submitTribute: (tributeCard: Card) => Promise<void>
  submitReturn: (returnCard: Card) => Promise<void>
  pauseGame: (reason?: string) => Promise<void>
  resumeGame: () => Promise<void>
}

export const useGameStore = create<GameState>((set, get) => ({
  gameId: null,
  status: 'deal',
  turnNo: 0,
  currentSeat: 0,
  levelRank: 2,
  recentTurns: [],
  myHand: [],
  lastAction: null,
  scores: {},
  counts: [27, 27, 27, 27],
  rankings: [],
  
  // Pause state
  pausedBy: null,
  pausedAt: null,
  pauseReason: null,
  
  // Tribute state
  tributePhase: false,
  tributeFrom: [],
  tributeTo: [],
  resistTribute: [],
  tributeCards: {},
  returnCards: {},

  setGame: (data) => set((state) => ({ ...state, ...data })),
  resetGame: () =>
    set({
      gameId: null,
      status: 'deal',
      turnNo: 0,
      currentSeat: 0,
      levelRank: 2,
      recentTurns: [],
      myHand: [],
      lastAction: null,
      scores: {},
      counts: [27, 27, 27, 27],
      rankings: [],
      pausedBy: null,
      pausedAt: null,
      pauseReason: null,
      tributePhase: false,
      tributeFrom: [],
      tributeTo: [],
      resistTribute: [],
      tributeCards: {},
      returnCards: {},
    }),
  updateHand: (cards) => set({ myHand: cards }),
  
  getAIHand: async (seatNo) => {
    const { gameId } = get()
    if (!gameId) return []
    const { data, error } = await supabase.rpc('get_ai_hand', {
      p_game_id: gameId,
      p_seat_no: seatNo
    })
    if (error) {
      devError('getAIHand error:', error)
      return []
    }
    // Cast JSONB to Card[]
    return (data as unknown as Card[]) || []
  },

  fetchLastTrickPlay: async () => {
    const { gameId } = get()
    if (!gameId) return null
    
    // Fetch last 4 turns
    const { data: turns } = await supabase
      .from('turns')
      .select('payload, seat_no, turn_no')
      .eq('game_id', gameId)
      .order('turn_no', { ascending: false })
      .limit(4)

    const normalized = ((turns as any[]) || []).map(t => ({
      turn_no: t.turn_no,
      seat_no: t.seat_no,
      payload: t.payload,
    })) as TurnRow[]
    const nextRecent = normalizeRecentTurns(normalized)
    set({ recentTurns: nextRecent })
    return computeLastActionFromRecentTurns(nextRecent, get().currentSeat)
  },

  fetchTurnsSince: async (gameId, fromTurnNo) => {
    const { data, error } = await supabase.rpc('get_turns_since', {
      p_game_id: gameId,
      p_from_turn_no: fromTurnNo
    })
    if (error) {
      if ((error as any)?.code === 'PGRST202') return []
      devError('Fetch turns since error:', error)
      throw error
    }
    const turns = (data as any[]) || []
    if (turns.length > 0 && get().gameId === gameId) {
      const current = get().recentTurns || []
      const nextRecent = normalizeRecentTurns([...(turns as TurnRow[]), ...current])
      set({ recentTurns: nextRecent, lastAction: computeLastActionFromRecentTurns(nextRecent, get().currentSeat) })
    }
    return turns
  },

  playTurn: async (cards) => {
    // Legacy method, redirect to submitTurn
    await get().submitTurn('play', cards)
  },

  submitTurn: async (type, cards = []) => {
    const state = get()
    if (!state.gameId) return { error: 'No game ID' }

    // Save previous state for rollback
    const previousHand = state.myHand

    // Optimistic update for self
    // Only update if it is a 'play' action with cards
    const shouldOptimisticUpdate =
      type === 'play' &&
      cards.length > 0 &&
      state.myHand.length > 0 &&
      cards.every(pc => state.myHand.some(c => c.id === pc.id))
      
    if (shouldOptimisticUpdate) {
      set((s) => ({
        myHand: s.myHand.filter(c => !cards.some(pc => pc.id === c.id)),
      }))
    }

    const { data, error } = await supabase.rpc('submit_turn', {
      p_game_id: state.gameId,
      p_action_id: crypto.randomUUID(),
      p_expected_turn_no: state.turnNo,
      p_payload: { type, cards }
    })

    if (error) {
      // Rollback optimistic update FIRST
      if (shouldOptimisticUpdate) {
        set({ myHand: previousHand })
      }

      const isTurnNoMismatch = error.code === 'P0001' && error.message.includes('turn_no_mismatch')
      const isNotYourTurn = error.code === 'P0001' && error.message.includes('not_your_turn')
      devError('Submit turn failed detailed:', JSON.stringify(error, null, 2))
      if (!isDev() && !isTurnNoMismatch && !isNotYourTurn) {
        console.error('Submit turn failed:', error)
      }
      
      // If error is turn_no_mismatch, it means our local state is stale.
      // We should NOT retry blindly, but refresh state.
      if (isTurnNoMismatch) {
         devWarn('Turn mismatch detected! Fetching fresh game state...')
         const { data: freshGame } = await supabase
          .from('games')
          .select('id,room_id,status,turn_no,current_seat,state_public')
          .eq('id', state.gameId)
          .single()
        
        if (freshGame) {
          if (isDev()) devLog('State refreshed:', freshGame.turn_no, freshGame.current_seat)
          set({
            turnNo: freshGame.turn_no,
            currentSeat: freshGame.current_seat,
            status: freshGame.status
          })
          return { error: error, refreshed: true, newState: freshGame }
        }
      }
      return { error }
    } else {
       // Success, update local state from RPC return
       if (data && data.length > 0) {
          const result = data[0]
          
          set((s) => ({
             turnNo: result.turn_no,
             currentSeat: result.current_seat,
             status: result.status, // Also update status (playing -> finished)
             rankings: result.rankings || s.rankings
          }))
       }
       return { data }
    }
  },

  fetchGame: async (roomId) => {
    if (isDev()) devLog('[fetchGame] Called for room:', roomId)
    // 1. Fetch active game
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id,room_id,status,turn_no,current_seat,state_public,state_private')
      .eq('room_id', roomId)
      .in('status', ['playing', 'paused', 'finished'])

    const game = games && games.length > 0 ? games[0] : null
    const gameError = gamesError

    if (isDev()) devLog('[fetchGame] Game query result:', { hasGame: !!game, gameError })

    if (gameError) {
      devError('Fetch game error:', gameError)
      return
    }

    if (!game) {
      if (isDev()) devLog('[fetchGame] No game found, resetting')
      get().resetGame()
      return
    }

    const counts = (game.state_public as any)?.counts || [27, 27, 27, 27]
    const rankings = (game.state_public as any)?.rankings || []
    const levelRank = (game.state_public as any)?.levelRank || 2
    set({
      gameId: game.id,
      status: game.status as any,
      turnNo: game.turn_no,
      currentSeat: game.current_seat,
      levelRank,
      counts,
      rankings,
      pausedBy: null,
      pausedAt: null,
      pauseReason: null
    })

    // 2. Fetch my hand - get user's seat_no first
    const { data: { user } } = await supabase.auth.getUser()
    let mySeatNo: number | undefined
    let myUid: string | undefined

    if (user?.id) {
      myUid = user.id
      // Get my seat from room_members
      const { data: memberData } = await supabase
        .from('room_members')
        .select('seat_no')
        .eq('room_id', roomId)
        .eq('uid', user.id)
        .maybeSingle()

      mySeatNo = memberData?.seat_no
    }

    // Try to get hand from state_private first (primary source)
    const statePrivate = game.state_private as any
    let myHand: Card[] | null = null

    // 回退：如果没有找到座位号，尝试使用第一个可用座位（练习模式）
    if (mySeatNo === undefined && statePrivate?.hands) {
      // 明确的座位选择优先级：优先座位0（练习模式默认）
      mySeatNo = statePrivate.hands['0'] ? 0
        : statePrivate.hands['1'] ? 1
        : statePrivate.hands['2'] ? 2
        : statePrivate.hands['3'] ? 3
        : undefined;
      if (mySeatNo !== undefined) {
        if (isDev()) devLog('[fetchGame] Using fallback seat_no:', mySeatNo)
      }
    }

    if (statePrivate?.hands && mySeatNo !== undefined) {
      const handData = statePrivate.hands[String(mySeatNo)] || statePrivate.hands[mySeatNo]
      if (handData && Array.isArray(handData)) {
        myHand = handData as Card[]
        if (isDev()) devLog('[fetchGame] Got hand from state_private:', { cardsCount: myHand.length, seatNo: mySeatNo })
      }
    }

    // Fallback: try game_hands table
    if (!myHand && myUid) {
      const { data: hands } = await supabase
        .from('game_hands')
        .select('hand')
        .eq('game_id', game.id)
        .eq('uid', myUid)
        .maybeSingle()

      if (hands?.hand) {
        myHand = hands.hand as Card[]
        if (isDev()) devLog('[fetchGame] Got hand from game_hands table:', { cardsCount: myHand.length, seatNo: mySeatNo })
      }
    }

    if (myHand) {
      // 使用 toSorted 创建新的排序数组，遵循不可变性原则
      const sortedHand = myHand.toSorted((a, b) => {
        if (a.val !== b.val) return b.val - a.val
        return b.suit.localeCompare(a.suit) // 统一降序排序
      })
      set({ myHand: sortedHand })
    } else {
      if (isDev()) devLog('[fetchGame] No hand data found for seatNo:', mySeatNo, 'state_private:', statePrivate)
    }

    // 3. Fetch last action
    const lastAction = await get().fetchLastTrickPlay()
    set({ lastAction })
  },

  subscribeGame: (roomId, options) => {
    const fetchGameThrottled = throttle(() => {
      get().fetchGame(roomId).catch((err) => {
        devError('[fetchGameThrottled] Error:', err)
      })
    }, 350)
    let turnsChannel: any = null
    let turnsGameId: string | null = null

    const gameConnectionId = `game:${roomId}`
    const turnsConnectionId = `turns:${roomId}`

    const ensureTurnsChannel = (nextGameId: string | null) => {
      if (!nextGameId) return
      if (turnsGameId === nextGameId && turnsChannel) return
      if (turnsChannel) {
        supabase.removeChannel(turnsChannel)
        turnsChannel = null
        turnsGameId = null
        realtimeOptimizer.updateConnectionStatus(turnsConnectionId, 'disconnected')
      }

      turnsGameId = nextGameId
      turnsChannel = supabase
        .channel(`turns-game:${nextGameId}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'turns', filter: `game_id=eq.${nextGameId}` }, async (payload) => {
          const startTime = performance.now()
          const newTurn = payload.new as any
          const incoming = {
            turn_no: newTurn.turn_no as number,
            seat_no: newTurn.seat_no as number,
            payload: newTurn.payload,
          }
          if (typeof incoming.turn_no === 'number') {
            const current = get().recentTurns || []
            const nextRecent = normalizeRecentTurns([incoming, ...current])
            set({ recentTurns: nextRecent, lastAction: computeLastActionFromRecentTurns(nextRecent, get().currentSeat) })
          } else {
            const lastAction = await get().fetchLastTrickPlay()
            set({ lastAction })
          }
          const latency = performance.now() - startTime
          realtimeOptimizer.recordMessage(turnsConnectionId, latency)
        })
        .subscribe((status: any) => {
          const statusStr = String(status)
          if (statusStr === 'SUBSCRIBED') {
            realtimeOptimizer.updateConnectionStatus(turnsConnectionId, 'connected')
          } else if (statusStr === 'CLOSED' || statusStr === 'CHANNEL_ERROR') {
            realtimeOptimizer.updateConnectionStatus(turnsConnectionId, statusStr.toLowerCase() as any)
          }
          options?.onStatus?.(statusStr)
        })
    }

    // Subscribe to games table for turn updates
    const gameChannel = supabase
      .channel(`game-room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          const startTime = performance.now()
          if (isDev()) devLog('[Store] Game Update Payload:', payload)
          const newGame = payload.new as any
          const counts = newGame.state_public?.counts || [27, 27, 27, 27]
          const rankings = newGame.state_public?.rankings || []
          const levelRank = newGame.state_public?.levelRank || 2

          if (isDev()) devLog('[Store] Game Update:', newGame.status, rankings)

          const previousTurnNo = get().turnNo
          const previousGameId = get().gameId
          const previousRankingsLen = get().rankings?.length || 0

          set(() => ({
            gameId: newGame.id,
            status: newGame.status,
            turnNo: newGame.turn_no,
            currentSeat: newGame.current_seat,
            levelRank,
            counts,
            rankings
          }))
          if (newGame.id && previousGameId !== newGame.id) {
            set({ recentTurns: [], lastAction: null })
          }
          ensureTurnsChannel(newGame.id || null)
          // Also refetch hand if game just started
          if (isDev()) devLog('[Store] Event type:', payload.eventType, 'Checking fetch condition')
          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && (payload.old as any)?.status !== 'playing')) {
             if (isDev()) devLog('[Store] Calling fetchGameThrottled')
             fetchGameThrottled()
          } else {
             if (isDev()) devLog('[Store] Skip fetchGameThrottled - condition not met')
          }

          // If rankings changed (someone finished), we might want to refresh state more aggressively or just trust the payload
          if (rankings.length > previousRankingsLen) {
             if (isDev()) devLog('[Store] Rankings updated, forcing refresh')
             fetchGameThrottled()
          }

          if (newGame.id && (previousGameId === newGame.id) && typeof previousTurnNo === 'number') {
            const gap = (newGame.turn_no as number) - previousTurnNo
            if (gap > 1) {
              try {
                const turns = await get().fetchTurnsSince(newGame.id, previousTurnNo)
                if (!turns || turns.length === 0) {
                  const lastAction = await get().fetchLastTrickPlay()
                  set({ lastAction })
                }
              } catch {
              }
            }
          }
          const latency = performance.now() - startTime
          realtimeOptimizer.recordMessage(gameConnectionId, latency)
        }
      )
      .subscribe((status: any) => {
        const statusStr = String(status)
        if (statusStr === 'SUBSCRIBED') {
          realtimeOptimizer.updateConnectionStatus(gameConnectionId, 'connected')
        } else if (statusStr === 'CLOSED' || statusStr === 'CHANNEL_ERROR') {
          realtimeOptimizer.updateConnectionStatus(gameConnectionId, statusStr.toLowerCase() as any)
        }
        options?.onStatus?.(statusStr)
      })

    // Register connections with optimizer
    realtimeOptimizer.registerConnection(gameConnectionId, `game:${roomId}`)
    realtimeOptimizer.registerConnection(turnsConnectionId, `turns:${roomId}`)

    ensureTurnsChannel(get().gameId)

    return () => {
      fetchGameThrottled.cancel()
      supabase.removeChannel(gameChannel)
      if (turnsChannel) supabase.removeChannel(turnsChannel)
      realtimeOptimizer.updateConnectionStatus(gameConnectionId, 'disconnected')
      realtimeOptimizer.updateConnectionStatus(turnsConnectionId, 'disconnected')
    }
  },

  startGame: async (roomId) => {
    const { error } = await supabase.rpc('start_game', { p_room_id: roomId })
    if (error) {
      devError('Start game failed:', error)
      throw error
    }
    // Optimistic update or wait for subscription
    await get().fetchGame(roomId)
  },

  calculateTribute: async () => {
    const state = get()
    if (!state.gameId || state.rankings.length === 0) return

    const { rankings, levelRank } = state
    
    // Determine winning and losing teams
    const winningTeam = rankings[0] % 2
    const losingTeam = 1 - winningTeam

    // Fetch all hands
    const winnerHands: Record<number, Card[]> = {}
    const loserHands: Record<number, Card[]> = {}

    for (let seat = 0; seat < 4; seat++) {
      const team = seat % 2
      const hand = await get().getAIHand(seat)
      
      if (team === winningTeam) {
        winnerHands[seat] = hand
      } else {
        loserHands[seat] = hand
      }
    }

    // Calculate tribute using tribute rules
    const { calculateTeamTribute } = await import('@/lib/game/tributeRules')
    const tributeState = calculateTeamTribute(winningTeam, losingTeam, winnerHands, loserHands, levelRank)

    set({
      tributePhase: true,
      tributeFrom: tributeState.tributeFrom,
      tributeTo: tributeState.tributeTo,
      resistTribute: tributeState.resistTribute,
      tributeCards: {},
      returnCards: {}
    })
  },

  submitTribute: async (tributeCard: Card) => {
    const state = get()
    if (!state.gameId) return

    const { error } = await supabase.rpc('submit_tribute', {
      p_game_id: state.gameId,
      p_tribute_card: tributeCard
    })

    if (error) {
      devError('Submit tribute failed:', error)
      throw error
    }

    // Update local state
    const newHand = state.myHand.filter(c => c.id !== tributeCard.id)
    set({ myHand: newHand })
  },

  submitReturn: async (returnCard: Card) => {
    const state = get()
    if (!state.gameId) return

    const { error } = await supabase.rpc('submit_return', {
      p_game_id: state.gameId,
      p_return_card: returnCard
    })

    if (error) {
      devError('Submit return failed:', error)
      throw error
    }

    // Update local state
    const newHand = [...state.myHand, returnCard]
    set({ myHand: newHand })
  },

  pauseGame: async (reason = '') => {
    const state = get()
    if (!state.gameId) {
      devError('Cannot pause game: No game ID')
      return
    }

    if (state.status !== 'playing') {
      devError('Cannot pause game: Game is not in playing status')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      devError('Cannot pause game: User not authenticated')
      return
    }

    const { error } = await supabase.rpc('pause_game', {
      p_game_id: state.gameId,
      p_uid: user.id,
      p_reason: reason
    })

    if (error) {
      devError('Pause game failed:', error)
      throw error
    }

    // Update local state
    set({
      status: 'paused',
      pausedBy: user.id,
      pausedAt: new Date().toISOString(),
      pauseReason: reason
    })
  },

  resumeGame: async () => {
    const state = get()
    if (!state.gameId) {
      devError('Cannot resume game: No game ID')
      return
    }

    if (state.status !== 'paused') {
      devError('Cannot resume game: Game is not in paused status')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      devError('Cannot resume game: User not authenticated')
      return
    }

    const { error } = await supabase.rpc('resume_game', {
      p_game_id: state.gameId,
      p_uid: user.id
    })

    if (error) {
      devError('Resume game failed:', error)
      throw error
    }

    // Update local state
    set({
      status: 'playing',
      pausedBy: null,
      pausedAt: null,
      pauseReason: null
    })
  }
}))
