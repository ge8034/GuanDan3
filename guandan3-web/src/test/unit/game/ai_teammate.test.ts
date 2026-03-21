import { beforeEach, describe, expect, it } from 'vitest'
import { assessTeammateSituation, clearPerformanceMetrics } from '@/lib/game/ai'
import type { Card } from '@/lib/store/game'

const c = (card: Partial<Card>): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...card,
})

describe('ai.assessTeammateSituation', () => {
  beforeEach(() => {
    clearPerformanceMetrics()
  })

  it('弱牌过多时 needsSupport=true', () => {
    const teammateCards: Card[] = [
      c({ id: 1, suit: 'S', rank: '3', val: 3 }),
      c({ id: 2, suit: 'H', rank: '3', val: 3 }),
      c({ id: 3, suit: 'D', rank: '3', val: 3 }),
      c({ id: 4, suit: 'C', rank: '4', val: 4 }),
      c({ id: 5, suit: 'S', rank: '4', val: 4 }),
      c({ id: 6, suit: 'H', rank: '5', val: 5 }),
    ]

    const situation = assessTeammateSituation(teammateCards, 2, [c({ id: 9, suit: 'S', rank: '9', val: 9 })])

    expect(situation.needsSupport).toBe(true)
    expect(situation.isLeading).toBe(false)
    expect(situation.canLead).toBe(true)
  })

  it('强牌较多时 isStrong=true 且 needsSupport=false', () => {
    const teammateCards: Card[] = [
      c({ id: 1, suit: 'S', rank: 'J', val: 11 }),
      c({ id: 2, suit: 'H', rank: 'Q', val: 12 }),
      c({ id: 3, suit: 'D', rank: 'K', val: 13 }),
      c({ id: 4, suit: 'C', rank: 'A', val: 14 }),
      c({ id: 5, suit: 'S', rank: 'J', val: 11 }),
      c({ id: 6, suit: 'H', rank: 'Q', val: 12 }),
      c({ id: 7, suit: 'D', rank: 'K', val: 13 }),
      c({ id: 8, suit: 'C', rank: 'A', val: 14 }),
    ]

    const situation = assessTeammateSituation(teammateCards, 2, [c({ id: 9, suit: 'S', rank: '9', val: 9 })])

    expect(situation.isStrong).toBe(true)
    expect(situation.needsSupport).toBe(false)
    expect(situation.isLeading).toBe(false)
    expect(situation.canLead).toBe(true)
  })

  it('lastPlay=null 时 isLeading=true', () => {
    const teammateCards: Card[] = [
      c({ id: 1, suit: 'S', rank: '7', val: 7 }),
      c({ id: 2, suit: 'H', rank: '8', val: 8 }),
    ]

    const situation = assessTeammateSituation(teammateCards, 2, null)

    expect(situation.isLeading).toBe(true)
    expect(situation.canLead).toBe(true)
  })
})
