import { describe, it, expect } from 'vitest'
import { AdvancedPatternRecognizer } from '@/lib/game/advancedPatternRecognizer'
import { Card } from '@/lib/store/game'

describe('Advanced Pattern Recognizer', () => {
  const createCard = (suit: 'H' | 'D' | 'C' | 'S' | 'J', rank: string, val: number): Card => ({
    id: Math.random(),
    suit,
    rank,
    val
  })

  describe('Basic Pattern Recognition', () => {
    it('should recognize single card', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [createCard('S', '3', 3)]
      const result = recognizer.analyzeCards(cards)
      
      expect(result.patterns).toHaveLength(1)
      expect(result.bestPattern?.type).toBe('single')
      expect(result.bestPattern?.primaryValue).toBe(3)
    })

    it('should recognize pair', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3)
      ]
      const result = recognizer.analyzeCards(cards)
      
      expect(result.patterns.length).toBeGreaterThan(0)
      const pairPattern = result.patterns.find(p => p.type === 'pair')
      expect(pairPattern).toBeDefined()
      expect(pairPattern?.primaryValue).toBe(3)
    })

    it('should recognize triple', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3)
      ]
      const result = recognizer.analyzeCards(cards)
      
      expect(result.patterns.length).toBeGreaterThan(0)
      const triplePattern = result.patterns.find(p => p.type === 'triple')
      expect(triplePattern).toBeDefined()
      expect(triplePattern?.primaryValue).toBe(3)
    })
  })

  describe('Advanced Pattern Recognition', () => {
    it('should recognize fullhouse (三带二)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('S', '4', 4),
        createCard('H', '4', 4)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const fullhousePattern = result.patterns.find(p => p.type === 'fullhouse')
      expect(fullhousePattern).toBeDefined()
      expect(fullhousePattern?.primaryValue).toBe(3)
      expect(fullhousePattern?.secondaryValue).toBe(4)
    })

    it('should recognize straight (顺子)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '4', 4),
        createCard('D', '5', 5),
        createCard('S', '6', 6),
        createCard('H', '7', 7)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const straightPattern = result.patterns.find(p => p.type === 'straight')
      expect(straightPattern).toBeDefined()
      expect(straightPattern?.primaryValue).toBe(7)
    })

    it('should recognize sequence pairs (连对)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '4', 4),
        createCard('S', '4', 4)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const seqPairsPattern = result.patterns.find(p => p.type === 'sequencePairs')
      expect(seqPairsPattern).toBeDefined()
      expect(seqPairsPattern?.primaryValue).toBe(4)
    })

    it('should recognize sequence triples (飞机)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('S', '4', 4),
        createCard('H', '4', 4),
        createCard('D', '4', 4)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const seqTriplesPattern = result.patterns.find(p => p.type === 'sequenceTriples')
      expect(seqTriplesPattern).toBeDefined()
      expect(seqTriplesPattern?.primaryValue).toBe(4)
    })

    it('should recognize sequence triples with wings (飞机带翅膀)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('S', '4', 4),
        createCard('H', '4', 4),
        createCard('D', '4', 4),
        createCard('S', '5', 5),
        createCard('H', '6', 6)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const seqTriplesWingsPattern = result.patterns.find(p => p.type === 'sequenceTriplesWithWings')
      expect(seqTriplesWingsPattern).toBeDefined()
      expect(seqTriplesWingsPattern?.primaryValue).toBe(4)
    })
  })

  describe('Bomb Recognition', () => {
    it('should recognize 4-card bomb', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const bombPattern = result.patterns.find(p => p.type === 'bomb')
      expect(bombPattern).toBeDefined()
      expect(bombPattern?.primaryValue).toBeGreaterThan(1000)
    })

    it('should recognize 5-card bomb', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3),
        createCard('S', '3', 3)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const bombPattern = result.patterns.find(p => p.type === 'bomb')
      expect(bombPattern).toBeDefined()
      expect(bombPattern?.primaryValue).toBeGreaterThan(2000)
    })

    it('should recognize rocket (王炸)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('J', 'hr', 15),
        createCard('J', 'bk', 14)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const rocketPattern = result.patterns.find(p => p.type === 'rocket')
      expect(rocketPattern).toBeDefined()
      expect(rocketPattern?.primaryValue).toBe(10000)
    })

    it('should recognize bomb with two (四带二)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3),
        createCard('S', '4', 4),
        createCard('H', '5', 5)
      ]
      const result = recognizer.analyzeCards(cards)
      
      const bombWithTwoPattern = result.patterns.find(p => p.type === 'bombWithTwo')
      expect(bombWithTwoPattern).toBeDefined()
      expect(bombWithTwoPattern?.primaryValue).toBeGreaterThan(1000)
    })
  })

  describe('Wild Card (逢人配) Recognition', () => {
    it('should identify wild cards (红桃级牌)', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('H', '2', 2), // 红桃2，级牌
        createCard('S', '3', 3),
        createCard('H', '3', 3)
      ]
      const result = recognizer.analyzeCards(cards)
      
      expect(result.hasWildCardPotential).toBe(true)
      expect(result.wildCards.length).toBe(1)
    })

    it('should generate wild card combinations', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('H', '2', 2), // 红桃2，级牌
        createCard('S', '3', 3),
        createCard('H', '4', 4)
      ]
      const result = recognizer.analyzeCards(cards)
      
      expect(result.wildCardCombinations.length).toBeGreaterThan(0)
    })
  })

  describe('Pattern Strength Calculation', () => {
    it('should calculate higher strength for bombs', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      
      const bombCards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3)
      ]
      const singleCards = [createCard('S', '3', 3)]
      
      const bombAnalysis = recognizer.analyzeCards(bombCards)
      const singleAnalysis = recognizer.analyzeCards(singleCards)
      
      const bombStrength = recognizer.calculatePatternStrength(bombAnalysis.bestPattern!)
      const singleStrength = recognizer.calculatePatternStrength(singleAnalysis.bestPattern!)
      
      expect(bombStrength).toBeGreaterThan(singleStrength)
    })

    it('should calculate higher strength for rocket than regular bomb', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      
      const rocketCards = [
        createCard('J', 'hr', 15),
        createCard('J', 'bk', 14)
      ]
      const bombCards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3)
      ]
      
      const rocketAnalysis = recognizer.analyzeCards(rocketCards)
      const bombAnalysis = recognizer.analyzeCards(bombCards)
      
      const rocketStrength = recognizer.calculatePatternStrength(rocketAnalysis.bestPattern!)
      const bombStrength = recognizer.calculatePatternStrength(bombAnalysis.bestPattern!)
      
      expect(rocketStrength).toBeGreaterThan(bombStrength)
    })
  })

  describe('Best Move Selection', () => {
    it('should select best pattern without target', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3)
      ]
      
      const bestMove = recognizer.findBestMove(cards)
      expect(bestMove?.type).toBe('bomb')
    })

    it('should find move that beats target pattern', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '4', 4),
        createCard('H', '4', 4),
        createCard('D', '4', 4),
        createCard('C', '4', 4)
      ]
      
      const targetPattern = { type: 'bomb', primaryValue: 4003, cardCount: 4 }
      const bestMove = recognizer.findBestMove(cards, targetPattern)
      
      expect(bestMove).toBeDefined()
      expect(bestMove?.primaryValue).toBeGreaterThan(targetPattern.primaryValue)
    })

    it('should return null when cannot beat target', () => {
      const recognizer = new AdvancedPatternRecognizer(2)
      const cards = [
        createCard('S', '3', 3),
        createCard('H', '3', 3),
        createCard('D', '3', 3),
        createCard('C', '3', 3)
      ]
      
      const targetPattern = { type: 'bomb', primaryValue: 4004, cardCount: 4 }
      const bestMove = recognizer.findBestMove(cards, targetPattern)
      
      expect(bestMove).toBeNull()
    })
  })
})