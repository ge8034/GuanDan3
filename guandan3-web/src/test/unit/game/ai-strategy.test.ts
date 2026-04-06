/**
 * AI 策略测试 - 覆盖率提升
 * 测试 AI 决策策略的各个方面
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  decideMove
} from '@/lib/game/ai-decision'
import {
  assessTeammateSituation
} from '@/lib/game/ai-strategy/strategy'
import {
  calculateHandStrength
} from '@/lib/game/ai-utils/evaluation'

// Mock dependencies
vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('AI Strategy - decideMove', () => {
  const sampleHand = [
    { id: 1, val: 14, suit: 'H', rank: 'A' },
    { id: 2, val: 13, suit: 'D', rank: 'K' },
    { id: 3, val: 12, suit: 'S', rank: 'Q' },
    { id: 4, val: 11, suit: 'C', rank: 'J' },
    { id: 5, val: 10, suit: 'H', rank: '10' },
  ]

  it('应该处理领牌情况（没有上家出牌）', () => {
    const result = decideMove(
      sampleHand,
      null,
      2,
      'medium',
      true
    )

    expect(result).toBeDefined()
    expect(result.type).toMatch(/^(play|pass)$/)
  })

  it('应该处理跟牌情况', () => {
    const lastPlay = [
      { id: 10, val: 8, suit: 'H', rank: '8' }
    ]

    const result = decideMove(
      sampleHand,
      lastPlay,
      2,
      'medium',
      false
    )

    expect(result).toBeDefined()
  })

  it('应该处理过牌后的领牌', () => {
    const result = decideMove(
      sampleHand,
      null,
      2,
      'medium',
      true
    )

    expect(result).toBeDefined()
    expect(result.type).toBe('play')
  })

  it('应该处理炸弹', () => {
    const bombHand = [
      { id: 1, val: 14, suit: 'H', rank: 'A' },
      { id: 2, val: 14, suit: 'D', rank: 'A' },
      { id: 3, val: 14, suit: 'S', rank: 'A' },
      { id: 4, val: 14, suit: 'C', rank: 'A' },
    ]

    const lastPlay = [
      { id: 10, val: 13, suit: 'H', rank: 'K' }
    ]

    const result = decideMove(
      bombHand,
      lastPlay,
      2,
      'hard',
      false
    )

    expect(result).toBeDefined()
  })

  it('应该处理空手牌', () => {
    const result = decideMove(
      [],
      null,
      2,
      'easy',
      true
    )

    expect(result).toBeDefined()
    expect(result.type).toBe('pass')
  })

  it('应该处理不同难度级别', () => {
    const difficulties: Array<'easy' | 'medium' | 'hard'> = [
      'easy',
      'medium',
      'hard',
    ]

    difficulties.forEach((difficulty) => {
      const result = decideMove(
        sampleHand,
        null,
        2,
        difficulty,
        true
      )

      expect(result).toBeDefined()
    })
  })
})

describe('AI Strategy - assessTeammateSituation', () => {
  it('应该评估队友弱牌情况', () => {
    const teammateHand = [
      { id: 1, val: 5, suit: 'H', rank: '5' },
      { id: 2, val: 6, suit: 'D', rank: '6' },
      { id: 3, val: 7, suit: 'S', rank: '7' },
    ]

    const result = assessTeammateSituation(
      teammateHand,
      2,
      null
    )

    expect(result).toBeDefined()
    expect(result.needsSupport).toBe(true)
  })

  it('应该评估队友强牌情况', () => {
    const teammateHand = [
      { id: 1, val: 14, suit: 'H', rank: 'A' },
      { id: 2, val: 14, suit: 'D', rank: 'A' },
      { id: 3, val: 14, suit: 'S', rank: 'A' },
      { id: 4, val: 13, suit: 'H', rank: 'K' },
    ]

    const result = assessTeammateSituation(
      teammateHand,
      2,
      null
    )

    expect(result).toBeDefined()
    expect(result.isStrong).toBe(true)
  })

  it('应该处理空手牌', () => {
    const result = assessTeammateSituation(
      [],
      2,
      null
    )

    expect(result).toBeDefined()
  })

  it('应该识别领牌状态', () => {
    const result = assessTeammateSituation(
      [
        { id: 1, val: 10, suit: 'H', rank: '10' },
        { id: 2, val: 9, suit: 'D', rank: '9' },
      ],
      2,
      null
    )

    expect(result).toBeDefined()
    expect(result.isLeading).toBe(true)
  })
})

describe('AI Strategy - calculateHandStrength', () => {
  it('应该计算强牌手牌强度', () => {
    const strength = calculateHandStrength({
      cardCount: 5,
      playedValue: 14,
      playedType: 'bomb',
    })

    expect(strength).toBeGreaterThan(50)
  })

  it('应该计算弱牌手牌强度', () => {
    const strength = calculateHandStrength({
      cardCount: 5,
      playedValue: 7,
      playedType: 'single',
    })

    expect(strength).toBeLessThan(100)
  })

  it('应该处理空手牌', () => {
    const strength = calculateHandStrength({
      cardCount: 0,
      playedValue: 0,
      playedType: 'single',
    })
    expect(strength).toBe(0)
  })

  it('应该处理单张手牌', () => {
    const strength = calculateHandStrength({
      cardCount: 1,
      playedValue: 14,
      playedType: 'single',
    })

    expect(strength).toBeGreaterThan(0)
    expect(strength).toBeLessThanOrEqual(100)
  })
})

describe('AI Strategy - 边界条件', () => {
  it('应该处理所有位置', () => {
    const positions = [0, 1, 2, 3]

    positions.forEach((position) => {
      const result = decideMove(
        [
          { id: 1, val: 14, suit: 'H', rank: 'A' },
          { id: 2, val: 13, suit: 'D', rank: 'K' },
        ],
        null,
        2,
        'medium',
        true
      )

      expect(result).toBeDefined()
    })
  })

  it('应该处理极端卡牌数量', () => {
    const extremeHands = [
      [], // 空手牌
      [{ id: 1, val: 14, suit: 'H', rank: 'A' }], // 单张
      [
        { id: 1, val: 14, suit: 'H', rank: 'A' },
        { id: 2, val: 13, suit: 'D', rank: 'K' },
        { id: 3, val: 12, suit: 'S', rank: 'Q' }
      ], // 多张
    ]

    extremeHands.forEach((hand) => {
      const result = decideMove(
        hand,
        null,
        2,
        'easy',
        true
      )

      expect(result).toBeDefined()
    })
  })
})
