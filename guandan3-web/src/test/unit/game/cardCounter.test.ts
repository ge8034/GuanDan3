import { describe, expect, it, beforeEach } from 'vitest'
import { CardCounter } from '@/lib/game/cardCounter'
import type { Card } from '@/lib/store/game'

const c = (rank: string, val: number, suit: 'H'|'S'|'D'|'C'|'J' = 'H'): Card => ({
  suit,
  rank,
  val,
  id: Math.random(),
})

describe('CardCounter', () => {
  let counter: CardCounter

  beforeEach(() => {
    counter = new CardCounter(2) // Level 2
  })

  it('初始化时应包含完整的两副牌', () => {
    // 2-14 (A) * 8 = 13 * 8 = 104
    // Jokers: 4
    // Total: 108
    expect(counter.getRemainingCount(3)).toBe(8)
    expect(counter.getRemainingCount(14)).toBe(8) // A
    expect(counter.getBigJokerCount()).toBe(2)
    expect(counter.getSmallJokerCount()).toBe(2)
  })

  it('记录出牌后剩余数量应减少', () => {
    const played = [
      c('3', 3), c('3', 3), // Two 3s
      c('A', 14), // One A
    ]
    counter.recordPlayedCards(played)
    
    expect(counter.getRemainingCount(3)).toBe(6)
    expect(counter.getRemainingCount(14)).toBe(7)
    expect(counter.getRemainingCount(4)).toBe(8) // Unaffected
  })

  it('记录大小王', () => {
    const played = [
      c('hr', 200, 'J'), // Big Joker
      c('br', 100, 'J'), // Small Joker
    ]
    counter.recordPlayedCards(played)
    
    expect(counter.getBigJokerCount()).toBe(1)
    expect(counter.getSmallJokerCount()).toBe(1)
  })

  it('记录级牌', () => {
    // Level is 2
    const played = [
      c('2', 2), c('2', 2)
    ]
    counter.recordPlayedCards(played)
    
    expect(counter.getLevelCardCount()).toBe(6)
  })
})
