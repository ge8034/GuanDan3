import { useState, useEffect } from 'react'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'

export function useRoomData(roomId: string, authReady: boolean) {
  const [roomLoaded, setRoomLoaded] = useState(false)
  const fetchRoom = useRoomStore(s => s.fetchRoom)
  const fetchGame = useGameStore(s => s.fetchGame)

  useEffect(() => {
    if (!roomId || !authReady) return
    let active = true
    setRoomLoaded(false)

    ;(async () => {
      try {
        await Promise.all([fetchRoom(roomId), fetchGame(roomId)])
      } catch (e) {
        // ignore
      } finally {
        if (active) setRoomLoaded(true)
      }
    })()

    return () => { active = false }
  }, [roomId, authReady, fetchRoom, fetchGame])

  return { roomLoaded }
}
