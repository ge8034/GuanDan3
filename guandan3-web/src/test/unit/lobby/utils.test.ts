import { describe, it, expect } from 'vitest'
import { modeLabel, typeLabel, sortRooms } from '@/lib/utils/lobby'

describe('lobby utils', () => {
  it('modeLabel maps known modes', () => {
    expect(modeLabel('pvp4')).toBe('4人对战')
    expect(modeLabel('pve1v3')).toBe('练习房')
    expect(modeLabel('other')).toBe('other')
  })

  it('typeLabel maps known types', () => {
    expect(typeLabel('classic')).toBe('经典')
    expect(typeLabel('ext')).toBe('ext')
  })

  it('sortRooms orders by joinable, then online count, then created_at desc', () => {
    const mk = (id: string, count: number, online: number, ts: number) => ({
      id,
      created_at: new Date(ts).toISOString(),
      room_members: Array.from({ length: count }).map((_, i) => ({ online: i < online }))
    })
    const rooms = [
      mk('A', 4, 2, 1000), // full
      mk('B', 2, 0, 2000), // joinable, 0 online
      mk('C', 3, 2, 1500), // joinable, 2 online
      mk('D', 3, 2, 3000), // joinable, 2 online, newer
    ]
    const sorted = sortRooms(rooms)
    // joinable first: D, C, B (0 online), then A (full)
    expect(sorted.map(r => r.id)).toEqual(['D', 'C', 'B', 'A'])
  })
})
