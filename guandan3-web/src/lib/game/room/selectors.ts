import type { Room, RoomMember } from '@/lib/store/room'

export const getIsOwner = (room: Room | null, userId: string | null | undefined) => room?.owner_uid === userId

export const getMemberByUid = (members: RoomMember[], userId: string | null | undefined) =>
  members.find(m => !!userId && m.uid === userId)

export const getMemberBySeat = (members: RoomMember[], seatNo: number) => members.find(m => m.seat_no === seatNo)

export const getSeatTextFromMember = (member: RoomMember | undefined) => String(member?.seat_no ?? '?')

export const getIsMyTurn = (gameStatus: string, currentSeat: number, mySeat: number) =>
  gameStatus === 'playing' && currentSeat === mySeat

export const getRankTitle = (rankings: number[], seatNo: number) => {
  const index = rankings.indexOf(seatNo)
  if (index === 0) return '👑 头游'
  if (index === 1) return '🥈 二游'
  if (index === 2) return '🥉 三游'
  if (index === 3) return '🥔 末游'
  return null
}

export const getMemberOnline = (member: RoomMember | undefined) =>
  member?.member_type === 'ai' ? true : (member?.online ?? true)
