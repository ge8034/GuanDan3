import { beforeEach, describe, expect, it } from 'vitest'
import type { Card } from '@/lib/store/game'
import { clearPerformanceMetrics } from '@/lib/game/ai'
import * as strategy from '@/lib/game/ai-strategy'

const c = (card: Partial<Card>): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...card,
})

describe('AI Cooperation Strategy', () => {
  beforeEach(() => {
    clearPerformanceMetrics()
  })

  it('needsSupport 时优先采用支援出牌', () => {
    const hand: Card[] = [
      c({ id: 1, suit: 'S', rank: '7', val: 7 }),
      c({ id: 2, suit: 'H', rank: '7', val: 7 }),
      c({ id: 3, suit: 'D', rank: '7', val: 7 }),
      c({ id: 4, suit: 'C', rank: '7', val: 7 }),
      c({ id: 5, suit: 'J', rank: 'hr', val: 0 }),
    ]

    const lastPlay: Card[] = [c({ id: 10, suit: 'S', rank: '9', val: 9 })]

    const teammateSituation = {
      isLeading: false,
      isStrong: false,
      needsSupport: true,
      canLead: true,
    }

    const move = strategy.findOptimalMove(hand, lastPlay, 2, 'hard', false, teammateSituation)

    expect(move.type).toBe('play')
    expect(move.cards?.length).toBe(4)
    expect(move.cards?.every(x => x.val === 7)).toBe(true)
  })

  it('needsSupport=false 时不走支援逻辑', () => {
    const hand: Card[] = [
      c({ id: 1, suit: 'S', rank: '7', val: 7 }),
      c({ id: 2, suit: 'H', rank: '7', val: 7 }),
      c({ id: 3, suit: 'D', rank: '7', val: 7 }),
      c({ id: 4, suit: 'C', rank: '7', val: 7 }),
      c({ id: 5, suit: 'J', rank: 'hr', val: 0 }),
    ]
    const lastPlay: Card[] = [c({ id: 10, suit: 'C', rank: '9', val: 9 })]

    const teammateSituation = {
      isLeading: false,
      isStrong: false,
      needsSupport: false,
      canLead: true,
    }
    const move = strategy.findOptimalMove(hand, lastPlay, 2, 'hard', false, teammateSituation)
    expect(move.type).toBe('play')
    expect(move.cards?.length).toBe(1)
    expect(move.cards?.[0].suit).toBe('J')
  })
})
