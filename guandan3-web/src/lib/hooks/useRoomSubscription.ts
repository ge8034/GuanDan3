import { useEffect, useState } from 'react'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'
import { devLog } from '@/lib/utils/devLog'

export type SubscriptionStatus = 'CONNECTING' | 'SUBSCRIBED' | 'CLOSED' | 'CHANNEL_ERROR' | 'TIMED_OUT'

interface UseRoomSubscriptionResult {
  status: SubscriptionStatus
  roomStatus: SubscriptionStatus
  gameStatus: SubscriptionStatus
  isHealthy: boolean
  error: string | null
}

export function useRoomSubscription(roomId: string): UseRoomSubscriptionResult {
  const [roomStatus, setRoomStatus] = useState<SubscriptionStatus>('CONNECTING')
  const [gameStatus, setGameStatus] = useState<SubscriptionStatus>('CONNECTING')
  const [error, setError] = useState<string | null>(null)

  const subscribeRoom = useRoomStore(s => s.subscribeRoom)
  const subscribeGame = useGameStore(s => s.subscribeGame)

  useEffect(() => {
    if (!roomId) return

    devLog('[useRoomSubscription] Subscribing to room:', roomId)
    // eslint-disable-next-line
    setRoomStatus('CONNECTING')
    setGameStatus('CONNECTING')
    setError(null)

    const cleanupRoom = subscribeRoom(roomId, {
      onStatus: ({ status }) => {
        const s = status as SubscriptionStatus
        setRoomStatus(prev => {
          // If we are already errored, don't overwrite with closed unless it's a new attempt
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

    return () => {
      devLog('[useRoomSubscription] Cleaning up subscriptions')
      cleanupRoom()
      cleanupGame()
    }
  }, [roomId, subscribeRoom, subscribeGame])

  const isHealthy = roomStatus === 'SUBSCRIBED' && gameStatus === 'SUBSCRIBED'
  
  // Aggregate status priority: ERROR > TIMED_OUT > CONNECTING > CLOSED > SUBSCRIBED
  let status: SubscriptionStatus = 'SUBSCRIBED'
  if (roomStatus === 'CHANNEL_ERROR' || gameStatus === 'CHANNEL_ERROR') status = 'CHANNEL_ERROR'
  else if (roomStatus === 'TIMED_OUT' || gameStatus === 'TIMED_OUT') status = 'TIMED_OUT'
  else if (roomStatus === 'CONNECTING' || gameStatus === 'CONNECTING') status = 'CONNECTING'
  else if (roomStatus === 'CLOSED' || gameStatus === 'CLOSED') status = 'CLOSED'

  return { status, roomStatus, gameStatus, isHealthy, error }
}
