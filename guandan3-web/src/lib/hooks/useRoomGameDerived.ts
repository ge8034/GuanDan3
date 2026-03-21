import { useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { useAuthStore } from '@/lib/store/auth'
import { useGameStore } from '@/lib/store/game'
import { useRoomStore } from '@/lib/store/room'
import {
  getIsMyTurn,
  getIsOwner,
  getMemberBySeat,
  getMemberByUid,
  getMemberOnline,
  getRankTitle,
  getSeatTextFromMember,
} from '@/lib/game/room/selectors'

export const useRoomGameDerived = () => {
  const userId = useAuthStore(s => s.user?.id ?? null)
  const { currentRoom, members } = useRoomStore(useShallow(s => ({ currentRoom: s.currentRoom, members: s.members })))
  const { gameStatus, currentSeat, rankings } = useGameStore(
    useShallow(s => ({ gameStatus: s.status, currentSeat: s.currentSeat, rankings: s.rankings }))
  )

  const myMember = useMemo(() => getMemberByUid(members, userId), [members, userId])
  const mySeat = myMember?.seat_no ?? 0
  const seatText = useMemo(() => getSeatTextFromMember(myMember), [myMember])
  const isOwner = useMemo(() => getIsOwner(currentRoom, userId), [currentRoom, userId])
  const isMyTurn = useMemo(() => getIsMyTurn(gameStatus, currentSeat, mySeat), [gameStatus, currentSeat, mySeat])

  const getRankTitleForSeat = useCallback((seatNo: number) => getRankTitle(rankings, seatNo), [rankings])
  const getMemberForSeat = useCallback((seatNo: number) => getMemberBySeat(members, seatNo), [members])
  const isOnline = useCallback((seatNo: number) => {
    const member = getMemberBySeat(members, seatNo)
    return member ? getMemberOnline(member) : false
  }, [members])

  const currentPlayerType = useMemo(
    () => getMemberBySeat(members, currentSeat)?.member_type ?? '未知',
    [members, currentSeat]
  )

  return {
    userId,
    currentRoom,
    members,
    gameStatus,
    currentSeat,
    rankings,
    myMember,
    mySeat,
    seatText,
    isOwner,
    isMyTurn,
    currentPlayerType,
    getRankTitle: getRankTitleForSeat,
    getMemberBySeat: getMemberForSeat,
    isOnline,
  }
}
