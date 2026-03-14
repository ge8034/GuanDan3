import { describe, expect, it } from 'vitest'
import type { RoomMember } from '@/lib/store/room'
import {
  getIsMyTurn,
  getIsOwner,
  getMemberBySeat,
  getMemberByUid,
  getMemberOnline,
  getRankTitle,
  getSeatTextFromMember,
} from '@/lib/game/room/selectors'

describe('game/room selectors', () => {
  it('getIsOwner根据room.owner_uid判断', () => {
    expect(getIsOwner(null, 'u1')).toBe(false)
    expect(getIsOwner({ id: 'r', owner_uid: 'u1', status: 'open', mode: 'pvp4', type: 'classic' }, 'u1')).toBe(true)
    expect(getIsOwner({ id: 'r', owner_uid: 'u1', status: 'open', mode: 'pvp4', type: 'classic' }, 'u2')).toBe(false)
  })

  it('getMemberByUid与getMemberBySeat可正确定位成员', () => {
    const members: RoomMember[] = [
      { uid: 'u1', seat_no: 0, ready: false, member_type: 'human', online: true },
      { uid: null, seat_no: 2, ready: true, member_type: 'ai' },
    ]
    expect(getMemberByUid(members, null)).toBeUndefined()
    expect(getMemberByUid(members, 'u1')?.seat_no).toBe(0)
    expect(getMemberByUid(members, 'missing')).toBeUndefined()
    expect(getMemberBySeat(members, 2)?.member_type).toBe('ai')
    expect(getMemberBySeat(members, 3)).toBeUndefined()
  })

  it('getSeatTextFromMember输出seat_no或?', () => {
    expect(getSeatTextFromMember(undefined)).toBe('?')
    expect(getSeatTextFromMember({ uid: 'u1', seat_no: 3, ready: false, member_type: 'human' })).toBe('3')
  })

  it('getIsMyTurn在playing且座位匹配时为true', () => {
    expect(getIsMyTurn('deal', 1, 1)).toBe(false)
    expect(getIsMyTurn('playing', 1, 2)).toBe(false)
    expect(getIsMyTurn('playing', 2, 2)).toBe(true)
  })

  it('getRankTitle按排名返回对应称号', () => {
    const rankings = [2, 0, 3, 1]
    expect(getRankTitle(rankings, 2)).toBe('👑 头游')
    expect(getRankTitle(rankings, 0)).toBe('🥈 二游')
    expect(getRankTitle(rankings, 3)).toBe('🥉 三游')
    expect(getRankTitle(rankings, 1)).toBe('🥔 末游')
    expect(getRankTitle(rankings, 9)).toBe(null)
  })

  it('getMemberOnline对ai始终为true，对human按online默认true', () => {
    expect(getMemberOnline(undefined)).toBe(true)
    expect(getMemberOnline({ uid: null, seat_no: 1, ready: false, member_type: 'ai', online: false })).toBe(true)
    expect(getMemberOnline({ uid: 'u1', seat_no: 1, ready: false, member_type: 'human', online: false })).toBe(false)
    expect(getMemberOnline({ uid: 'u1', seat_no: 1, ready: false, member_type: 'human' })).toBe(true)
  })
})
