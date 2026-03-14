import { useEffect } from 'react'
import { useRoomStore } from '@/lib/store/room'

export function useRoomHeartbeat(
  roomId: string,
  authReady: boolean,
  roomLoaded: boolean,
  isMember: boolean,
  isOwner: boolean
) {
  const heartbeatRoomMember = useRoomStore(s => s.heartbeatRoomMember)
  const sweepOfflineMembers = useRoomStore(s => s.sweepOfflineMembers)

  useEffect(() => {
    if (!roomId || !authReady || !roomLoaded) return
    if (!isMember) return

    heartbeatRoomMember(roomId).catch(() => {})
    const heartbeatTimer = setInterval(() => {
      heartbeatRoomMember(roomId).catch(() => {})
    }, 5000)

    const sweepTimer = isOwner
      ? setInterval(() => {
          sweepOfflineMembers(roomId, 15).catch(() => {})
        }, 7000)
      : null

    return () => {
      clearInterval(heartbeatTimer)
      if (sweepTimer) clearInterval(sweepTimer)
    }
  }, [roomId, authReady, roomLoaded, isMember, isOwner, heartbeatRoomMember, sweepOfflineMembers])
}
