import { beforeEach, describe, expect, it } from 'vitest'
import { clearPerformanceMetrics, decideMove } from '@/lib/game/ai'
import type { Card } from '@/lib/store/game'

let nextId = 1
const c = (rank: string, val: number): Card => ({
  suit: 'H',
  rank,
  val,
  id: nextId++,
})

describe('ai.decideMove (Advanced)', () => {
  beforeEach(() => {
    clearPerformanceMetrics()
    nextId = 1
  })

  it('跟顺子：应能识别并压制顺子', () => {
    // Hand: 3, 4, 5, 6, 7
    const hand = [
      c('3', 3), c('4', 4), c('5', 5), c('6', 6), c('7', 7)
    ]
    // Last: 2, 3, 4, 5, 6
    const lastCards = [
      c('2', 2), c('3', 3), c('4', 4), c('5', 5), c('6', 6)
    ]
    
    const move = decideMove(hand, lastCards, 10, 'hard', false)
    
    expect(move.type).toBe('play')
    expect(move.cards?.length).toBe(5)
    expect(move.cards?.map(x => x.val).slice().sort((a, b) => a - b)).toEqual([3, 4, 5, 6, 7])
  })

  it('跟三带二：应能识别并压制三带二', () => {
    // Hand: 3,3,3, 4,4
    const hand = [
      c('3', 3), c('3', 3), c('3', 3),
      c('4', 4), c('4', 4)
    ]
    // Last: 2,2,2, 3,3
    const lastCards = [
      c('2', 2), c('2', 2), c('2', 2),
      c('3', 3), c('3', 3)
    ]
    
    const move = decideMove(hand, lastCards, 10, 'hard', false)
    
    expect(move.type).toBe('play')
    expect(move.cards?.length).toBe(5)
    expect(move.cards?.filter(x => x.val === 3).length).toBe(3)
    expect(move.cards?.filter(x => x.val === 4).length).toBe(2)
  })

  it('跟连对：应能识别并压制连对', () => {
    // Hand: 4,4, 5,5, 6,6
    const hand = [
      c('4', 4), c('4', 4),
      c('5', 5), c('5', 5),
      c('6', 6), c('6', 6)
    ]
    // Last: 3,3, 4,4, 5,5
    const lastCards = [
      c('3', 3), c('3', 3),
      c('4', 4), c('4', 4),
      c('5', 5), c('5', 5)
    ]
    
    const move = decideMove(hand, lastCards, 10, 'hard', false)
    
    expect(move.type).toBe('play')
    expect(move.cards?.length).toBe(6)
    expect(move.cards?.map(x => x.val).slice().sort((a, b) => a - b)).toEqual([4, 4, 5, 5, 6, 6])
  })

  it('跟飞机：应能识别并压制飞机', () => {
    const hand = [
      c('3', 3), c('3', 3), c('3', 3),
      c('4', 4), c('4', 4), c('4', 4),
      c('5', 5), c('5', 5), c('5', 5),
    ]
    const lastCards = [
      c('2', 2), c('2', 2), c('2', 2),
      c('3', 3), c('3', 3), c('3', 3),
      c('4', 4), c('4', 4), c('4', 4),
    ]

    const move = decideMove(hand, lastCards, 10, 'hard', false)

    expect(move.type).toBe('play')
    expect(move.cards?.length).toBe(9)
    expect(move.cards?.filter(x => x.val === 5).length).toBe(3)
  })
})
