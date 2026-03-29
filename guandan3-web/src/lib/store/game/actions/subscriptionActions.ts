import { supabase } from '@/lib/supabase/client'
import { devError, devLog, isDev } from '@/lib/utils/devLog'
import { throttle } from '@/lib/utils/throttle'
import { realtimeOptimizer } from '@/lib/performance/realtime-optimizer'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { GameState } from '../types'
import { normalizeRecentTurns, computeLastActionFromRecentTurns } from '../utils/normalizers'
import type { TurnRow, TurnPayload } from '../types'

/**
 * 订阅游戏实时更新
 */
export function subscribeGame(
  this: GameState,
  roomId: string,
  options?: { onStatus?: (status: string) => void }
): () => void {
  const state = this

  // 节流的 fetchGame
  const fetchGameThrottled = throttle(() => {
    state.fetchGame(roomId).catch((err) => {
      devError('[fetchGameThrottled] Error:', err)
    })
  }, 350)

  let turnsChannel: RealtimeChannel | null = null
  let turnsGameId: string | null = null

  const gameConnectionId = `game:${roomId}`
  const turnsConnectionId = `turns:${roomId}`

  // 确保 turns 订阅频道
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
        const newTurn = payload.new as Record<string, unknown>
        const incoming: TurnRow = {
          turn_no: typeof newTurn.turn_no === 'number' ? newTurn.turn_no : 0,
          seat_no: typeof newTurn.seat_no === 'number' ? newTurn.seat_no : 0,
          payload: newTurn.payload as TurnPayload,
        }
        if (typeof incoming.turn_no === 'number') {
          const current = state.recentTurns || []
          const nextRecent = normalizeRecentTurns([incoming, ...current])
          state.setGame({
            recentTurns: nextRecent,
            lastAction: computeLastActionFromRecentTurns(nextRecent, state.currentSeat)
          })
        } else {
          const lastAction = await state.fetchLastTrickPlay()
          state.setGame({ lastAction })
        }
        const latency = performance.now() - startTime
        realtimeOptimizer.recordMessage(turnsConnectionId, latency)
      })
      .subscribe((status) => {
        const statusStr = String(status)
        if (statusStr === 'SUBSCRIBED') {
          realtimeOptimizer.updateConnectionStatus(turnsConnectionId, 'connected')
        } else if (statusStr === 'CLOSED' || statusStr === 'CHANNEL_ERROR') {
          realtimeOptimizer.updateConnectionStatus(turnsConnectionId, 'disconnected')
        }
        options?.onStatus?.(statusStr)
      })
  }

  // 订阅 games 表
  const gameChannel = supabase
    .channel(`game-room:${roomId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'games', filter: `room_id=eq.${roomId}` },
      async (payload) => {
        const startTime = performance.now()
        if (isDev()) devLog('[Store] Game Update Payload:', payload)

        const newGame = payload.new as Record<string, unknown>
        const statePublic = newGame.state_public as Record<string, unknown> | undefined
        const counts = (statePublic?.counts as number[]) || [27, 27, 27, 27]
        const rankings = (statePublic?.rankings as number[]) || []
        const levelRank = (statePublic?.levelRank as number) || 2

        if (isDev()) devLog('[Store] Game Update:', newGame.status, rankings)

        const previousTurnNo = state.turnNo
        const previousGameId = state.gameId
        const previousRankingsLen = state.rankings?.length || 0

        if (isDev()) devLog('[Store] 更新状态:', {
          currentSeat: newGame.current_seat,
          turnNo: newGame.turn_no,
          status: newGame.status
        })

        state.setGame({
          gameId: newGame.id as string,
          status: newGame.status as 'deal' | 'playing' | 'paused' | 'finished',
          turnNo: newGame.turn_no as number,
          currentSeat: newGame.current_seat as number,
          levelRank,
          counts,
          rankings
        })

        if (newGame.id && previousGameId !== newGame.id) {
          state.setGame({ recentTurns: [], lastAction: null })
        }

        ensureTurnsChannel((newGame.id as string) || null)

        // 游戏开始时重新获取
        if (isDev()) devLog('[Store] Event type:', payload.eventType, 'Checking fetch condition')
        const oldGame = payload.old as Record<string, unknown> | undefined
        if (payload.eventType === 'INSERT' ||
            (payload.eventType === 'UPDATE' && (oldGame?.status as string) !== 'playing')) {
          if (isDev()) devLog('[Store] Calling fetchGameThrottled')
          fetchGameThrottled()
        } else {
          if (isDev()) devLog('[Store] Skip fetchGameThrottled - condition not met')
        }

        // 排名变化时强制刷新
        if (rankings.length > previousRankingsLen) {
          if (isDev()) devLog('[Store] Rankings updated, forcing refresh')
          fetchGameThrottled()
        }

        // 检测回合跳跃
        if (newGame.id && (previousGameId === newGame.id) && typeof previousTurnNo === 'number') {
          const gap = (newGame.turn_no as number) - previousTurnNo
          if (gap > 1) {
            try {
              const turns = await state.fetchTurnsSince(String(newGame.id), previousTurnNo)
              if (!turns || turns.length === 0) {
                const lastAction = await state.fetchLastTrickPlay()
                state.setGame({ lastAction })
              }
            } catch {
              // 忽略错误
            }
          }
        }

        const latency = performance.now() - startTime
        realtimeOptimizer.recordMessage(gameConnectionId, latency)
      }
    )
    .subscribe((status) => {
      const statusStr = String(status)
      if (statusStr === 'SUBSCRIBED') {
        realtimeOptimizer.updateConnectionStatus(gameConnectionId, 'connected')
      } else if (statusStr === 'CLOSED' || statusStr === 'CHANNEL_ERROR') {
        realtimeOptimizer.updateConnectionStatus(gameConnectionId, 'disconnected')
      }
      options?.onStatus?.(statusStr)
    })

  // 注册连接
  realtimeOptimizer.registerConnection(gameConnectionId, `game:${roomId}`)
  realtimeOptimizer.registerConnection(turnsConnectionId, `turns:${roomId}`)

  ensureTurnsChannel(state.gameId)

  // 返回清理函数
  return () => {
    fetchGameThrottled.cancel()
    supabase.removeChannel(gameChannel)
    if (turnsChannel) supabase.removeChannel(turnsChannel)
    realtimeOptimizer.updateConnectionStatus(gameConnectionId, 'disconnected')
    realtimeOptimizer.updateConnectionStatus(turnsConnectionId, 'disconnected')
  }
}
