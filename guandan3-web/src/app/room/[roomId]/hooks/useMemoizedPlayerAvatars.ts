/**
 * 玩家头像信息计算 Hook
 *
 * 根据当前玩家座位和其他成员信息，计算其他位置玩家的头像数据
 */

import { useMemo } from 'react'
import type { RoomMember } from '@/lib/store/room'

interface MemoizedPlayerAvatar {
  position: 'left' | 'right' | 'opposite'
  seat: number
  member?: RoomMember
  isCurrentTurn: boolean
  cardCount: number
  memberType: 'human' | 'ai'
  rankTitle: string
  isReady: boolean
  isOnline: boolean
}

interface UseMemoizedPlayerAvatarsOptions {
  mySeat: number
  currentSeat: number
  counts: Record<number, number>
  members: RoomMember[]
  isOnline: (seat: number) => boolean
  getRankTitle: (seat: number) => string
}

export function useMemoizedPlayerAvatars({
  mySeat,
  currentSeat,
  counts,
  members,
  isOnline,
  getRankTitle,
}: UseMemoizedPlayerAvatarsOptions): MemoizedPlayerAvatar[] {
  return useMemo(() => {
    // 计算其他玩家的相对位置
    // 对面位置：(mySeat + 2) % 4
    // 左侧位置：(mySeat + 3) % 4（上家）
    // 右侧位置：(mySeat + 1) % 4（下家）
    const seats = [
      { seat: (mySeat + 2) % 4, position: 'opposite' },
      { seat: (mySeat + 3) % 4, position: 'left' },
      { seat: (mySeat + 1) % 4, position: 'right' },
    ] as const

    return seats.map(({ seat, position }) => {
      const member = members.find((m) => m.seat_no === seat)
      return {
        seat,
        position,
        member,
        isCurrentTurn: currentSeat === seat,
        cardCount: counts[seat] ?? 27,
        memberType: member?.member_type ?? 'ai',
        isReady: member?.ready ?? false,
        isOnline: isOnline(seat),
        rankTitle: getRankTitle(seat),
      }
    })
  }, [mySeat, currentSeat, counts, members, isOnline, getRankTitle])
}

export type { MemoizedPlayerAvatar }
