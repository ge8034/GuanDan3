import { useState, useEffect } from 'react'
import { useRoomStore } from '@/lib/store/room'
import { useGameStore } from '@/lib/store/game'

export function useRoomData(roomId: string, authReady: boolean) {
  const [roomLoaded, setRoomLoaded] = useState(false)
  const fetchRoom = useRoomStore(s => s.fetchRoom)
  const fetchGame = useGameStore(s => s.fetchGame)
  const currentRoom = useRoomStore(s => s.currentRoom)

  useEffect(() => {
    // 只在客户端且认证就绪时执行数据获取
    if (typeof window === 'undefined' || !roomId || !authReady) {
      console.log('[useRoomData] Skipping fetch:', {
        isClient: typeof window !== 'undefined',
        roomId,
        authReady
      })
      return
    }

    let active = true
    setRoomLoaded(false)

    console.log('[useRoomData] Client-side fetching room:', roomId)
    ;(async () => {
      try {
        await Promise.all([fetchRoom(roomId), fetchGame(roomId)])
        console.log('[useRoomData] Fetch complete')
      } catch (e) {
        console.error('[useRoomData] Fetch error:', e)
      } finally {
        if (active) {
          setRoomLoaded(true)
          console.log('[useRoomData] Set roomLoaded=true')
        }
      }
    })()

    return () => { active = false }
  }, [roomId, authReady, fetchRoom, fetchGame])

  return { roomLoaded }
}
