import { create } from 'zustand'
import { supabase } from '@/lib/supabase/client'

export interface Card {
  suit: 'H' | 'D' | 'C' | 'S' | 'J'
  rank: string
  val: number
  id: number
}

interface GameState {
  gameId: string | null
  status: 'deal' | 'playing' | 'finished'
  turnNo: number
  currentSeat: number
  myHand: Card[]
  lastAction: {
    seatNo: number
    type: 'play' | 'pass'
    cards?: Card[]
  } | null
  scores: Record<string, number>
  counts: number[] // Remaining cards per seat
  rankings: number[] // Finishing order [seatNo, seatNo, ...]
  
  setGame: (data: Partial<GameState>) => void
  updateHand: (cards: Card[]) => void
  playTurn: (cards: Card[]) => Promise<void>
  fetchGame: (roomId: string) => Promise<void>
  subscribeGame: (roomId: string) => () => void
  startGame: (roomId: string) => Promise<void>
  submitTurn: (type: 'play' | 'pass', cards?: Card[]) => Promise<any>
  getAIHand: (seatNo: number) => Promise<Card[]>
  fetchLastTrickPlay: () => Promise<{ type: 'play' | 'pass', cards?: Card[], seatNo: number } | null>
  fetchTurnsSince: (gameId: string, fromTurnNo: number) => Promise<Array<{ turn_no: number, seat_no: number, payload: any }>>
}

export const useGameStore = create<GameState>((set, get) => ({
  gameId: null,
  status: 'deal',
  turnNo: 0,
  currentSeat: 0,
  myHand: [],
  lastAction: null,
  scores: {},
  counts: [27, 27, 27, 27],
  rankings: [],

  setGame: (data) => set((state) => ({ ...state, ...data })),
  updateHand: (cards) => set({ myHand: cards }),
  
  getAIHand: async (seatNo) => {
    const { gameId } = get()
    if (!gameId) return []
    const { data, error } = await supabase.rpc('get_ai_hand', {
      p_game_id: gameId,
      p_seat_no: seatNo
    })
    if (error) {
      console.error('getAIHand error:', error)
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

    if (!turns || turns.length === 0) return null

    // Check consecutive passes
    let consecutivePasses = 0
    for (const turn of turns) {
      if (turn.payload.type === 'pass') {
        consecutivePasses++
      } else {
        // Found a play
        // If 3 passes followed this play, then this play is "beaten" by passes.
        // Also if the last play was made by the current player (me), it means everyone else passed.
        const { currentSeat } = get()
        if (consecutivePasses >= 3 || turn.seat_no === currentSeat) {
          return null
        }
        return { 
          type: turn.payload.type, 
          cards: turn.payload.cards, 
          seatNo: turn.seat_no 
        }
      }
    }
    // All fetched turns are passes
    if (consecutivePasses >= 3) return null
    
    return null 
  },

  fetchTurnsSince: async (gameId, fromTurnNo) => {
    const { data, error } = await supabase.rpc('get_turns_since', {
      p_game_id: gameId,
      p_from_turn_no: fromTurnNo
    })
    if (error) {
      if ((error as any)?.code === 'PGRST202') return []
      console.error('Fetch turns since error:', error)
      throw error
    }
    return (data as any[]) || []
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
    if (state.currentSeat === 0 && type === 'play') { 
       set((s) => ({
        myHand: s.myHand.filter(c => !cards.some(pc => pc.suit === c.suit && pc.rank === c.rank)),
      }))
    }

    const { data, error } = await supabase.rpc('submit_turn', {
      p_game_id: state.gameId,
      p_action_id: crypto.randomUUID(),
      p_expected_turn_no: state.turnNo,
      p_payload: { type, cards }
    })

    if (error) {
      console.error('Submit turn failed detailed:', JSON.stringify(error, null, 2))
      // Rollback optimistic update
      if (state.currentSeat === 0 && type === 'play') {
        set({ myHand: previousHand })
      }
      
      // If error is turn_no_mismatch, it means our local state is stale.
      // We should NOT retry blindly, but refresh state.
      if (error.code === 'P0001' && error.message.includes('turn_no_mismatch')) {
         console.warn('Turn mismatch detected! Fetching fresh game state...')
         const { data: freshGame } = await supabase
          .from('games')
          .select('*')
          .eq('id', state.gameId)
          .single()
        
        if (freshGame) {
          console.log('State refreshed:', freshGame.turn_no, freshGame.current_seat)
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
    // 1. Fetch active game
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('room_id', roomId)
      .in('status', ['playing', 'finished']) // Also fetch finished games
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    
    if (gameError) {
      console.error('Fetch game error:', gameError)
      return
    }
    
    if (!game) {
      set({ status: 'deal', gameId: null })
      return
    }

    const counts = (game.state_public as any)?.counts || [27, 27, 27, 27]
    const rankings = (game.state_public as any)?.rankings || []
    set({ 
      gameId: game.id,
      status: game.status as any,
      turnNo: game.turn_no,
      currentSeat: game.current_seat,
      counts,
      rankings
    })

    // 2. Fetch my hand
    const { data: hands, error: handsError } = await supabase
      .from('game_hands')
      .select('hand')
      .eq('game_id', game.id)
    
    if (handsError) {
      console.error('Fetch hands error:', handsError)
    } else if (hands && hands.length > 0) {
      // Cast JSONB to Card[]
      const myHand = hands[0].hand as unknown as Card[]
      // Sort hand
      myHand.sort((a, b) => {
        if (a.val !== b.val) return b.val - a.val
        return a.suit.localeCompare(b.suit)
      })
      set({ myHand })
    }

    // 3. Fetch last action
    const lastAction = await get().fetchLastTrickPlay()
    set({ lastAction })
  },

  subscribeGame: (roomId) => {
    // Subscribe to games table for turn updates
    const gameChannel = supabase
      .channel(`game-room:${roomId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'games', filter: `room_id=eq.${roomId}` },
        async (payload) => {
          console.log('[Store] Game Update Payload:', payload) // Add this log
          const newGame = payload.new as any
          const counts = newGame.state_public?.counts || [27, 27, 27, 27]
          const rankings = newGame.state_public?.rankings || []

          console.log('[Store] Game Update:', newGame.status, rankings)

          const previousTurnNo = get().turnNo
          const previousGameId = get().gameId
          const previousRankingsLen = get().rankings?.length || 0

          set(() => ({
            gameId: newGame.id,
            status: newGame.status,
            turnNo: newGame.turn_no,
            currentSeat: newGame.current_seat,
            counts,
            rankings
          }))
          // Also refetch hand if game just started
          if (payload.eventType === 'INSERT' || (payload.eventType === 'UPDATE' && (payload.old as any)?.status !== 'playing')) {
             get().fetchGame(roomId)
          }

          // If rankings changed (someone finished), we might want to refresh state more aggressively or just trust the payload
          if (rankings.length > previousRankingsLen) {
             console.log('[Store] Rankings updated, forcing refresh')
             get().fetchGame(roomId)
          }

          if (newGame.id && (previousGameId === newGame.id) && typeof previousTurnNo === 'number') {
            const gap = (newGame.turn_no as number) - previousTurnNo
            if (gap > 1) {
              try {
                await get().fetchTurnsSince(newGame.id, previousTurnNo)
              } catch {
              }
            }
          }

          if (newGame.id && payload.eventType === 'UPDATE' && (newGame.turn_no as number) !== previousTurnNo) {
            const lastAction = await get().fetchLastTrickPlay()
            set({ lastAction })
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'turns' },
        async (payload) => {
           // When a new turn is inserted, update last action
           // We need to verify if this turn belongs to current game
           const newTurn = payload.new as any
           const { gameId } = get()
           if (newTurn.game_id === gameId) {
              // Refresh last action
              const lastAction = await get().fetchLastTrickPlay()
              set({ lastAction })
           }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(gameChannel)
    }
  },

  startGame: async (roomId) => {
    const { error } = await supabase.rpc('start_game', { p_room_id: roomId })
    if (error) {
      console.error('Start game failed:', error)
      throw error
    }
    // Optimistic update or wait for subscription
    await get().fetchGame(roomId)
  }
}))
