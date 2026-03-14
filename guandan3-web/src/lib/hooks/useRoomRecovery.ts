import { useEffect, useRef } from 'react'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'

export function useRoomRecovery(
  roomId: string,
  authReady: boolean,
  roomLoaded: boolean,
  isMember: boolean,
  myHandLength: number
) {
  const fetchRoom = useRoomStore(s => s.fetchRoom)
  const fetchGame = useGameStore(s => s.fetchGame)
  const gameStatus = useGameStore(s => s.status)

  const recoverAttemptCountRef = useRef(0)
  const recoverInFlightRef = useRef(false)

  useEffect(() => {
    if (!roomId || !authReady || !roomLoaded) return
    if (gameStatus !== 'playing') return
    if (!isMember) return
    if (myHandLength > 0) return
    if (recoverInFlightRef.current) return
    if (recoverAttemptCountRef.current >= 2) return

    recoverAttemptCountRef.current += 1
    recoverInFlightRef.current = true

    const timer = setTimeout(async () => {
      try {
        await fetchRoom(roomId)
        await fetchGame(roomId)
      } finally {
        recoverInFlightRef.current = false
      }
    }, recoverAttemptCountRef.current === 1 ? 800 : 2000)

    return () => clearTimeout(timer)
  }, [roomId, authReady, roomLoaded, gameStatus, isMember, myHandLength, fetchRoom, fetchGame])
}
