import { describe, expect, it } from 'vitest'
import {
  canResistTribute,
  shouldResistTribute,
  findBestTributeCard,
  findBestReturnCard,
  calculateTribute,
  calculateTeamTribute,
  applyTribute,
  validateTributeCard,
  validateReturnCard,
  getTributePairs,
  analyzeResistCapability,
  calculateTributeAdvantage
} from '@/lib/game/tributeRules'
import type { Card } from '@/lib/store/game'

const createCard = (id: string, suit: any, rank: string, val: number): Card => ({
  id,
  suit,
  rank,
  val,
  isJoker: false,
  isLevel: false,
  image: ''
} as any)

describe('Tribute Rules', () => {
  const levelRank = 2

  describe('canResistTribute', () => {
    it('should return true when hand has both jokers', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('c3', 'H', '3', 3)
      ]
      
      expect(canResistTribute(hand)).toBe(true)
    })

    it('should return false when hand has no jokers', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      expect(canResistTribute(hand)).toBe(false)
    })

    it('should return false when hand has only one joker', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      expect(canResistTribute(hand)).toBe(false)
    })
  })

  describe('shouldResistTribute', () => {
    it('should return false when cannot resist', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      expect(shouldResistTribute(hand, levelRank)).toBe(false)
    })

    it('should return true when only has jokers', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100)
      ]
      
      expect(shouldResistTribute(hand, levelRank)).toBe(true)
    })

    it('should return true when best tribute card is A or higher', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('cA', 'H', 'A', 14),
        createCard('c3', 'D', '3', 3)
      ]
      
      expect(shouldResistTribute(hand, levelRank)).toBe(true)
    })

    it('should return true when has 3+ high cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('cK', 'H', 'K', 13),
        createCard('cQ', 'D', 'Q', 12),
        createCard('cJ', 'C', 'J', 11),
        createCard('c3', 'S', '3', 3)
      ]
      
      expect(shouldResistTribute(hand, levelRank)).toBe(true)
    })

    it('should return false when has only low cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      expect(shouldResistTribute(hand, levelRank)).toBe(false)
    })

    it('should return true when all non-joker cards are level cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('c2', 'H', '2', 2),
        createCard('c2', 'D', '2', 2)
      ]
      
      expect(shouldResistTribute(hand, levelRank)).toBe(true)
    })
  })

  describe('findBestTributeCard', () => {
    it('should return largest card in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('cA', 'D', 'A', 14),
        createCard('cK', 'C', 'K', 13)
      ]
      
      const tributeCard = findBestTributeCard(hand, levelRank)
      
      expect(tributeCard).not.toBeNull()
      expect(tributeCard?.val).toBe(14) // Should return A (largest)
    })

    it('should return null when hand is empty', () => {
      const hand: Card[] = []
      
      const tributeCard = findBestTributeCard(hand, levelRank)
      
      expect(tributeCard).toBeNull()
    })

    it('should skip level cards and jokers', () => {
      const hand = [
        createCard('c2', 'H', '2', 2), // Level card, should be skipped
        createCard('c3', 'D', '3', 3), // Normal card, value 3
        createCard('c4', 'C', '4', 4),  // Normal card, value 4
        createCard('j1', 'J', 'hr', 200) // Joker, should be skipped
      ]
      
      const tributeCard = findBestTributeCard(hand, levelRank)
      
      expect(tributeCard).not.toBeNull()
      expect(tributeCard?.val).toBe(4) // Should pick 4 (largest valid card), not level card or joker
    })

    it('should return null when all cards are level cards or jokers', () => {
      const hand = [
        createCard('c2', 'H', '2', 2), // Level card
        createCard('c2', 'D', '2', 2), // Level card
        createCard('j1', 'J', 'hr', 200), // Joker
        createCard('j2', 'J', 'hb', 100)  // Joker
      ]
      
      const tributeCard = findBestTributeCard(hand, levelRank)
      
      expect(tributeCard).toBeNull()
    })
  })

  describe('findBestReturnCard', () => {
    it('should return smallest card in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('cA', 'D', 'A', 14),
        createCard('cK', 'C', 'K', 13)
      ]
      
      const returnCard = findBestReturnCard(hand, levelRank, null, null)
      
      expect(returnCard).not.toBeNull()
      expect(returnCard?.val).toBe(3)
    })

    it('should exclude specified card from selection', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      const excludeCard = hand[0]
      const returnCard = findBestReturnCard(hand, levelRank, excludeCard, null)
      
      expect(returnCard).not.toBeNull()
      expect(returnCard?.id).not.toBe(excludeCard.id)
      expect(returnCard?.val).toBe(4) // Should pick 4, not 3
    })

    it('should return null when hand is empty', () => {
      const hand: Card[] = []
      
      const returnCard = findBestReturnCard(hand, levelRank, null, null)
      
      expect(returnCard).toBeNull()
    })
  })

  describe('calculateTribute', () => {
    it('should calculate normal tribute when loser cannot resist', () => {
      const winnerHand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const loserHand = [
        createCard('c5', 'C', '5', 5),
        createCard('c6', 'S', '6', 6)
      ]
      
      const result = calculateTribute(0, 1, winnerHand, loserHand, levelRank)
      
      expect(result.canResist).toBe(false)
      expect(result.tributeCard).not.toBeNull()
      expect(result.returnCard).not.toBeNull()
      expect(result.tributeCard?.val).toBe(6) // Should return 6 (largest)
      expect(result.returnCard?.val).toBe(3)
    })

    it('should allow resist when loser has both jokers and high cards', () => {
      const winnerHand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const loserHand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('cA', 'H', 'A', 14),
        createCard('c5', 'C', '5', 5)
      ]
      
      const result = calculateTribute(0, 1, winnerHand, loserHand, levelRank)
      
      expect(result.canResist).toBe(true)
      expect(result.tributeCard).toBeNull()
      expect(result.returnCard).toBeNull()
      expect(result.reason).toContain('抗贡')
    })

    it('should not resist when loser has both jokers but only low cards', () => {
      const winnerHand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const loserHand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('c3', 'C', '3', 3),
        createCard('c4', 'S', '4', 4),
        createCard('c5', 'D', '5', 5)
      ]
      
      const result = calculateTribute(0, 1, winnerHand, loserHand, levelRank)
      
      expect(result.canResist).toBe(false)
      expect(result.tributeCard).not.toBeNull()
      expect(result.returnCard).not.toBeNull()
      expect(result.reason).toContain('进贡')
    })

    it('should handle empty hands', () => {
      const winnerHand: Card[] = []
      const loserHand: Card[] = []
      
      const result = calculateTribute(0, 1, winnerHand, loserHand, levelRank)
      
      expect(result.canResist).toBe(false)
      expect(result.tributeCard).toBeNull()
      expect(result.returnCard).toBeNull()
    })
  })

  describe('calculateTeamTribute', () => {
    it('should calculate tribute for losing team', () => {
      const winnerHands = {
        0: [createCard('c3', 'H', '3', 3)],
        2: [createCard('c4', 'D', '4', 4)]
      }
      
      const loserHands = {
        1: [createCard('c5', 'C', '5', 5)],
        3: [createCard('c6', 'S', '6', 6)]
      }
      
      const result = calculateTeamTribute(0, 1, winnerHands, loserHands, levelRank)
      
      expect(result.isTributePhase).toBe(true)
      expect(result.tributeFrom).toEqual([1, 3])
      expect(result.tributeTo).toEqual([0, 2])
      expect(result.resistTribute).toEqual([])
    })

    it('should handle resist in losing team', () => {
      const winnerHands = {
        0: [createCard('c3', 'H', '3', 3)],
        2: [createCard('c4', 'D', '4', 4)]
      }
      
      const loserHands = {
        1: [
          createCard('j1', 'J', 'hr', 200),
          createCard('j2', 'J', 'hb', 100),
          createCard('cA', 'H', 'A', 14),
          createCard('c5', 'C', '5', 5)
        ],
        3: [createCard('c6', 'S', '6', 6)]
      }
      
      const result = calculateTeamTribute(0, 1, winnerHands, loserHands, levelRank)
      
      expect(result.isTributePhase).toBe(true)
      expect(result.tributeFrom).toEqual([3])
      expect(result.tributeTo).toEqual([0, 2])
      expect(result.resistTribute).toEqual([1])
    })
  })

  describe('applyTribute', () => {
    it('should remove tribute card and add return card', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      const tributeCard = hand[1]
      const returnCard = createCard('c6', 'S', '6', 6)
      
      const newHand = applyTribute(hand, tributeCard, returnCard)
      
      expect(newHand.length).toBe(3)
      expect(newHand.find(c => c.id === tributeCard.id)).toBeUndefined()
      expect(newHand.find(c => c.id === returnCard.id)).toBeDefined()
    })

    it('should handle null return card', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const tributeCard = hand[0]
      const returnCard = null
      
      const newHand = applyTribute(hand, tributeCard, returnCard)
      
      expect(newHand.length).toBe(1)
      expect(newHand.find(c => c.id === tributeCard.id)).toBeUndefined()
    })

    it('should handle tribute card not in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const tributeCard = createCard('c5', 'C', '5', 5)
      const returnCard = null
      
      const newHand = applyTribute(hand, tributeCard, returnCard)
      
      expect(newHand.length).toBe(2)
      expect(newHand.find(c => c.id === tributeCard.id)).toBeUndefined()
    })
  })

  describe('validateTributeCard', () => {
    it('should validate card in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const card = hand[0]
      const result = validateTributeCard(card, hand, levelRank)
      
      expect(result.valid).toBe(true)
    })

    it('should reject card not in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const card = createCard('c5', 'C', '5', 5)
      const result = validateTributeCard(card, hand, levelRank)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('不在手中')
    })

    it('should reject level card', () => {
      const hand = [
        createCard('c2', 'H', '2', 2), // Level card
        createCard('c3', 'D', '3', 3)
      ]
      
      const card = hand[0]
      const result = validateTributeCard(card, hand, levelRank)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('级牌')
    })

    it('should reject joker', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('c3', 'H', '3', 3)
      ]
      
      const card = hand[0]
      const result = validateTributeCard(card, hand, levelRank)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('不能进贡王')
    })
  })

  describe('validateReturnCard', () => {
    it('should validate card in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const card = hand[0]
      const result = validateReturnCard(card, hand, levelRank, null)
      
      expect(result.valid).toBe(true)
    })

    it('should reject card not in hand', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const card = createCard('c5', 'C', '5', 5)
      const result = validateReturnCard(card, hand, levelRank, null)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('不在手中')
    })

    it('should exclude specified card from validation', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      const excludeCard = hand[0]
      const card = hand[0]
      const result = validateReturnCard(card, hand, levelRank, excludeCard)
      
      expect(result.valid).toBe(false)
      expect(result.reason).toContain('不在手中')
    })
  })

  describe('getTributePairs', () => {
    it('should pair tribute from and to seats based on rankings', () => {
      const tributeFrom = [1, 3]
      const tributeTo = [0, 2]
      const rankings = [1, 3, 0, 2] // Seat 1 is first, 3 is second, 0 is third, 2 is fourth
      
      const pairs = getTributePairs(tributeFrom, tributeTo, rankings)
      
      expect(pairs).toHaveLength(2)
      expect(pairs[0]).toEqual({ from: 1, to: 0 }) // First loser (1) pairs with first winner (0)
      expect(pairs[1]).toEqual({ from: 3, to: 2 }) // Second loser (3) pairs with second winner (2)
    })

    it('should handle unequal numbers of from and to seats', () => {
      const tributeFrom = [1]
      const tributeTo = [0, 2]
      const rankings = [1, 0, 2, 3]
      
      const pairs = getTributePairs(tributeFrom, tributeTo, rankings)
      
      expect(pairs).toHaveLength(1)
      expect(pairs[0]).toEqual({ from: 1, to: 0 })
    })

    it('should return empty array when no tribute from seats', () => {
      const tributeFrom: number[] = []
      const tributeTo = [0, 2]
      const rankings = [0, 1, 2, 3]
      
      const pairs = getTributePairs(tributeFrom, tributeTo, rankings)
      
      expect(pairs).toHaveLength(0)
    })

    it('should return empty array when no tribute to seats', () => {
      const tributeFrom = [1, 3]
      const tributeTo: number[] = []
      const rankings = [0, 1, 2, 3]
      
      const pairs = getTributePairs(tributeFrom, tributeTo, rankings)
      
      expect(pairs).toHaveLength(0)
    })

    it('should handle unsorted input arrays', () => {
      const tributeFrom = [3, 1]
      const tributeTo = [2, 0]
      const rankings = [1, 3, 0, 2]
      
      const pairs = getTributePairs(tributeFrom, tributeTo, rankings)
      
      expect(pairs).toHaveLength(2)
      expect(pairs[0]).toEqual({ from: 1, to: 0 })
      expect(pairs[1]).toEqual({ from: 3, to: 2 })
    })
  })

  describe('analyzeResistCapability', () => {
    it('should return cannot resist when no jokers', () => {
      const hand = [
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(false)
      expect(result.strategy).toBe('defensive')
      expect(result.reason).toContain('没有双王')
    })

    it('should return must resist when only has jokers', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(true)
      expect(result.strategy).toBe('aggressive')
      expect(result.reason).toContain('只有双王')
    })

    it('should return must resist when all non-joker cards are level cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('c2', 'H', '2', 2),
        createCard('c2', 'D', '2', 2)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(true)
      expect(result.strategy).toBe('aggressive')
      expect(result.reason).toContain('都是级牌')
    })

    it('should return aggressive resist when best tribute card is A or higher', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('cA', 'H', 'A', 14),
        createCard('c3', 'D', '3', 3)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(true)
      expect(result.strategy).toBe('aggressive')
      expect(result.reason).toContain('A或更大')
    })

    it('should return balanced resist when has 3+ high cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('cK', 'H', 'K', 13),
        createCard('cQ', 'D', 'Q', 12),
        createCard('cJ', 'C', 'J', 11),
        createCard('c3', 'S', '3', 3)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(true)
      expect(result.strategy).toBe('balanced')
      expect(result.reason).toContain('3张以上大牌')
    })

    it('should return balanced resist when has 2+ very high cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('cK', 'H', 'K', 13),
        createCard('cQ', 'D', 'Q', 12),
        createCard('c3', 'C', '3', 3)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(true)
      expect(result.strategy).toBe('balanced')
      expect(result.reason).toContain('2张以上大牌')
    })

    it('should return defensive when has only low cards', () => {
      const hand = [
        createCard('j1', 'J', 'hr', 200),
        createCard('j2', 'J', 'hb', 100),
        createCard('c3', 'H', '3', 3),
        createCard('c4', 'D', '4', 4),
        createCard('c5', 'C', '5', 5)
      ]
      
      const result = analyzeResistCapability(hand, levelRank)
      
      expect(result.canResist).toBe(false)
      expect(result.strategy).toBe('defensive')
      expect(result.reason).toContain('牌力不足')
    })
  })

  describe('calculateTributeAdvantage', () => {
    it('should calculate large advantage for returner', () => {
      const tributeCard = createCard('c3', 'H', '3', 3)
      const returnCard = createCard('cK', 'D', 'K', 13)
      
      const result = calculateTributeAdvantage(tributeCard, returnCard, levelRank)
      
      expect(result.advantage).toBe(10)
      expect(result.description).toBe('还贡方大优')
    })

    it('should calculate small advantage for returner', () => {
      const tributeCard = createCard('c5', 'H', '5', 5)
      const returnCard = createCard('c9', 'D', '9', 9)
      
      const result = calculateTributeAdvantage(tributeCard, returnCard, levelRank)
      
      expect(result.advantage).toBe(4)
      expect(result.description).toBe('还贡方小优')
    })

    it('should calculate balanced situation', () => {
      const tributeCard = createCard('c7', 'H', '7', 7)
      const returnCard = createCard('c8', 'D', '8', 8)
      
      const result = calculateTributeAdvantage(tributeCard, returnCard, levelRank)
      
      expect(result.advantage).toBe(1)
      expect(result.description).toBe('双方平衡')
    })

    it('should calculate small advantage for tributer', () => {
      const tributeCard = createCard('cK', 'H', 'K', 13)
      const returnCard = createCard('c9', 'D', '9', 9)
      
      const result = calculateTributeAdvantage(tributeCard, returnCard, levelRank)
      
      expect(result.advantage).toBe(-4)
      expect(result.description).toBe('进贡方小优')
    })

    it('should calculate large advantage for tributer', () => {
      const tributeCard = createCard('cA', 'H', 'A', 14)
      const returnCard = createCard('c5', 'D', '5', 5)
      
      const result = calculateTributeAdvantage(tributeCard, returnCard, levelRank)
      
      expect(result.advantage).toBe(-9)
      expect(result.description).toBe('进贡方大优')
    })
  })
})