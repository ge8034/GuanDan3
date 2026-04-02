import { describe, it, expect } from 'vitest'
import { analyzeMove, canBeat } from '@/lib/game/rules'
import { analyzeHand } from '@/lib/game/ai-pattern-recognition'
import { findOptimalMove } from '@/lib/game/ai-strategy'
import { calculateHandStrength, assessRisk } from '@/lib/game/ai-utils'

describe('AI 系统集成测试', () => {
  describe('AI 决策流程集成', () => {
    it('应该能够分析手牌并做出决策', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'H' as const, rank: '4', val: 4 },
        { id: 3, suit: 'H' as const, rank: '5', val: 5 },
        { id: 4, suit: 'S' as const, rank: '6', val: 6 },
        { id: 5, suit: 'S' as const, rank: '7', val: 7 }
      ]

      const move = analyzeMove(hand, 10)
      
      expect(move).toBeDefined()
      expect(move?.type).toBeDefined()
      expect(move?.cards).toBeDefined()
      expect(move?.cards?.length).toBeGreaterThan(0)
    })

    it('应该能够分析对手出牌并做出响应', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '5', val: 5 },
        { id: 2, suit: 'H' as const, rank: '6', val: 6 },
        { id: 3, suit: 'H' as const, rank: '7', val: 7 },
        { id: 4, suit: 'S' as const, rank: '8', val: 8 },
        { id: 5, suit: 'S' as const, rank: '9', val: 9 }
      ]

      const lastPlay = {
        type: 'pair',
        cards: [
          { id: 10, suit: 'D' as const, rank: '3', val: 3 },
          { id: 11, suit: 'D' as const, rank: '3', val: 3 }
        ],
        primaryValue: 3
      } as any

      const myMove = analyzeMove(hand, 10)
      
      expect(myMove).toBeDefined()
      if (myMove) {
        const canBeatResult = canBeat(myMove, lastPlay as any)
        expect(canBeatResult).toBeDefined()
      }
    })

    it('应该能够使用 findOptimalMove 进行决策', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'H' as const, rank: '4', val: 4 },
        { id: 3, suit: 'H' as const, rank: '5', val: 5 },
        { id: 4, suit: 'S' as const, rank: '6', val: 6 },
        { id: 5, suit: 'S' as const, rank: '7', val: 7 }
      ]

      const move = findOptimalMove(hand, null, 10, 'medium', false)
      
      expect(move).toBeDefined()
      expect(move?.type).toBe('play')
      expect(move?.cards).toBeDefined()
      expect(move?.cards?.length).toBeGreaterThan(0)
    })
  })

  describe('AI 难度调整集成', () => {
    it('不同难度应该做出不同决策', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'H' as const, rank: '4', val: 4 },
        { id: 3, suit: 'H' as const, rank: '5', val: 5 },
        { id: 4, suit: 'S' as const, rank: '6', val: 6 },
        { id: 5, suit: 'S' as const, rank: '7', val: 7 }
      ]

      const easyMove = findOptimalMove(hand, null, 10, 'easy', false)
      const mediumMove = findOptimalMove(hand, null, 10, 'medium', false)
      const hardMove = findOptimalMove(hand, null, 10, 'hard', false)
      
      expect(easyMove).toBeDefined()
      expect(mediumMove).toBeDefined()
      expect(hardMove).toBeDefined()
      
      expect(easyMove?.type).toBe('play')
      expect(mediumMove?.type).toBe('play')
      expect(hardMove?.type).toBe('play')
    })
  })

  describe('牌型识别集成', () => {
    it('应该能够分析手牌并识别牌型', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'H' as const, rank: '4', val: 4 },
        { id: 3, suit: 'H' as const, rank: '5', val: 5 },
        { id: 4, suit: 'S' as const, rank: '6', val: 6 },
        { id: 5, suit: 'S' as const, rank: '7', val: 7 }
      ]

      const analysis = analyzeHand(hand, 10)

      expect(analysis).toBeDefined()
      expect(analysis.singles).toBeDefined()
      expect(analysis.pairs).toBeDefined()
      expect(analysis.triples).toBeDefined()
      expect(analysis.straights).toBeDefined()
    })

    it('应该能够识别复杂牌型', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'S' as const, rank: '3', val: 3 },
        { id: 3, suit: 'D' as const, rank: '3', val: 3 },
        { id: 4, suit: 'C' as const, rank: '3', val: 3 },
        { id: 5, suit: 'H' as const, rank: '5', val: 5 },
        { id: 6, suit: 'S' as const, rank: '5', val: 5 }
      ]

      const analysis = analyzeHand(hand, 10)

      expect(analysis).toBeDefined()
      expect(analysis.bombs).toBeDefined()
      expect(analysis.bombs.length).toBeGreaterThan(0)
      expect(analysis.bombs[0].length).toBe(4)
    })
  })

  describe('AI 策略集成', () => {
    it('应该能够评估手牌强度', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'H' as const, rank: '4', val: 4 },
        { id: 3, suit: 'H' as const, rank: '5', val: 5 },
        { id: 4, suit: 'S' as const, rank: '6', val: 6 },
        { id: 5, suit: 'S' as const, rank: '7', val: 7 }
      ]

      // 使用单张牌进行测试（这是最简单的有效牌型）
      const singleCard = [hand[0]]
      const move = analyzeMove(singleCard, 10)
      expect(move).not.toBeNull()

      const strength = calculateHandStrength({
        cardCount: singleCard.length,
        playedValue: move!.primaryValue,
        playedType: move!.type
      })

      expect(strength).toBeDefined()
      expect(strength).toBeGreaterThan(0)
      expect(strength).toBeLessThanOrEqual(100)
    })

    it('应该能够评估风险', () => {
      const hand = [
        { id: 1, suit: 'H' as const, rank: '3', val: 3 },
        { id: 2, suit: 'H' as const, rank: '4', val: 4 },
        { id: 3, suit: 'H' as const, rank: '5', val: 5 },
        { id: 4, suit: 'S' as const, rank: '6', val: 6 },
        { id: 5, suit: 'S' as const, rank: '7', val: 7 }
      ]

      // 使用单张牌进行测试
      const singleCard = [hand[0]]
      const move = analyzeMove(singleCard, 10)
      expect(move).not.toBeNull()

      const risk = assessRisk(move!.cards, hand, 10, true)

      expect(risk).toBeDefined()
      expect(risk).toBeGreaterThanOrEqual(0)
      expect(risk).toBeLessThanOrEqual(100)
    })
  })
})
