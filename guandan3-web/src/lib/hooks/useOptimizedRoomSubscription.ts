import { useEffect, useState, useCallback, useRef } from 'react'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'
import { webSocketOptimizer } from '@/lib/performance/websocket-optimizer'
import { devLog } from '@/lib/utils/devLog'

export type SubscriptionStatus = 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT'

interface UseOptimizedRoomSubscriptionResult {
  status: SubscriptionStatus
  roomStatus: SubscriptionStatus
  gameStatus: SubscriptionStatus
  isHealthy: boolean
  error: string | null
  compressionStats: {
    averageRatio: number
    averageTime: number
    totalSavings: number
    messageCount: number
  }
  queueStats: Array<{
    channel: string
    messageCount: number
    size: number
    age: number
  }>
}

interface OptimizedSubscriptionOptions {
  enableCompression?: boolean
  enableBatching?: boolean
  compressionThreshold?: number
}

export function useOptimizedRoomSubscription(
  roomId: string,
  options: OptimizedSubscriptionOptions = {}
): UseOptimizedRoomSubscriptionResult {
  const {
    enableCompression = true,
    enableBatching = true,
    compressionThreshold = 1024
  } = options

  const [roomStatus, setRoomStatus] = useState<SubscriptionStatus>(() => 'CONNECTING')
  const [gameStatus, setGameStatus] = useState<SubscriptionStatus>(() => 'CONNECTING')
  const [error, setError] = useState<string | null>(() => null)
  const [compressionStats, setCompressionStats] = useState(webSocketOptimizer.getCompressionStats())
  const [queueStats, setQueueStats] = useState(webSocketOptimizer.getQueueStats())

  const subscribeRoom = useRoomStore(s => s.subscribeRoom)
  const subscribeGame = useGameStore(s => s.subscribeGame)

  const statsIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const optimizeMessage = useCallback(async (message: any, channel: string) => {
    const optimizedPayload = webSocketOptimizer.optimizePayload(message)

    if (enableCompression) {
      const payloadSize = JSON.stringify(optimizedPayload).length
      if (payloadSize >= compressionThreshold) {
        try {
          const { compressed, stats } = await webSocketOptimizer.compressMessage(optimizedPayload)
          return { compressed, optimized: true, stats }
        } catch (error) {
          devLog('[useOptimizedRoomSubscription] Compression failed:', error)
          return { data: optimizedPayload, optimized: false }
        }
      }
    }

    if (enableBatching) {
      await webSocketOptimizer.batchMessage(channel, optimizedPayload)
      return { batched: true }
    }

    return { data: optimizedPayload, optimized: false }
  }, [enableCompression, enableBatching, compressionThreshold])

  useEffect(() => {
    if (!roomId) return

    devLog('[useOptimizedRoomSubscription] Subscribing to room:', roomId)

    const cleanupRoom = subscribeRoom(roomId, {
      onStatus: ({ status }) => {
        const s = status as SubscriptionStatus
        setRoomStatus(prev => {
          if (prev === 'CHANNEL_ERROR' && s === 'CLOSED') return prev
          return s
        })
        if (s === 'CHANNEL_ERROR') setError('Room connection error')
      }
    })

    const cleanupGame = subscribeGame(roomId, {
      onStatus: (status) => {
        const s = status as SubscriptionStatus
        setGameStatus(prev => {
          if (prev === 'CHANNEL_ERROR' && s === 'CLOSED') return prev
          return s
        })
        if (s === 'CHANNEL_ERROR') setError('Game connection error')
      }
    })

    statsIntervalRef.current = setInterval(() => {
      setCompressionStats(webSocketOptimizer.getCompressionStats())
      setQueueStats(webSocketOptimizer.getQueueStats())
    }, 2000)

    return () => {
      devLog('[useOptimizedRoomSubscription] Cleaning up subscriptions')
      if (statsIntervalRef.current) {
        clearInterval(statsIntervalRef.current)
      }
      webSocketOptimizer.clearQueue(`room:${roomId}`)
      webSocketOptimizer.clearQueue(`game:${roomId}`)
      cleanupRoom()
      cleanupGame()
    }
  }, [roomId, subscribeRoom, subscribeGame])

  const isHealthy = roomStatus === 'SUBSCRIBED' && gameStatus === 'SUBSCRIBED'

  let status: SubscriptionStatus = 'SUBSCRIBED'
  if (roomStatus === 'CHANNEL_ERROR' || gameStatus === 'CHANNEL_ERROR') status = 'CHANNEL_ERROR'
  else if (roomStatus === 'TIMED_OUT' || gameStatus === 'TIMED_OUT') status = 'TIMED_OUT'
  else if (roomStatus === 'CONNECTING' || gameStatus === 'CONNECTING') status = 'CONNECTING'
  else if (roomStatus === 'CLOSED' || gameStatus === 'CLOSED') status = 'CLOSED'

  return {
    status,
    roomStatus,
    gameStatus,
    isHealthy,
    error,
    compressionStats,
    queueStats
  }
}

export function useWebSocketOptimizer() {
  const clearQueue = useCallback((channel?: string) => {
    webSocketOptimizer.clearQueue(channel)
  }, [])

  const getCompressionStats = useCallback(() => {
    return webSocketOptimizer.getCompressionStats()
  }, [])

  const getQueueStats = useCallback(() => {
    return webSocketOptimizer.getQueueStats()
  }, [])

  const reset = useCallback(() => {
    webSocketOptimizer.reset()
  }, [])

  return {
    clearQueue,
    getCompressionStats,
    getQueueStats,
    reset
  }
}
