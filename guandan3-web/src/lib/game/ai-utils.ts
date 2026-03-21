import { Card } from '@/lib/store/game'
import { getCardValue } from './rules'

export function sortCards(cards: Card[], levelRank: number): Card[] {
  return [...cards].sort((a, b) => {
    const valueA = getCardValue(a, levelRank)
    const valueB = getCardValue(b, levelRank)
    if (valueA !== valueB) return valueB - valueA
    const suitOrder = { 'S': 4, 'H': 3, 'C': 2, 'D': 1, 'J': 0 }
    return suitOrder[b.suit] - suitOrder[a.suit]
  })
}

export function filterSafeCards(cards: Card[], levelRank: number): Card[] {
  return cards.filter(card => card.val !== levelRank && card.suit !== 'J')
}

export function countStrongCards(cards: Card[], levelRank: number): number {
  return cards.filter(card => {
    const value = getCardValue(card, levelRank)
    return value >= 11 && card.suit !== 'J'
  }).length
}

export function calculateHandStrength(cardCount: number, playedValue: number, playedType: string): number {
  let strength = 0
  
  strength += cardCount * 10
  
  strength += playedValue * 2
  
  const typeBonus: Record<string, number> = {
    'single': 1,
    'pair': 2,
    'triple': 3,
    'bomb': 8,
    'straight': 4,
    'fullHouse': 5,
    'sequencePair': 6,
    'sequenceTriple': 7,
    'sequenceTripleWithWing': 9,
    'quadWithTwo': 10
  }
  
  strength += typeBonus[playedType] || 0
  
  return strength
}

export function analyzeCardDistribution(cards: Card[], levelRank: number): {
  suitCounts: Record<string, number>
  valueCounts: Record<number, number>
  hasJokers: boolean
  strongCards: number
  weakCards: number
} {
  const suitCounts: Record<string, number> = { 'S': 0, 'H': 0, 'C': 0, 'D': 0, 'J': 0 }
  const valueCounts: Record<number, number> = {}
  let hasJokers = false
  let strongCards = 0
  let weakCards = 0
  
  cards.forEach(card => {
    suitCounts[card.suit]++
    const value = getCardValue(card, levelRank)
    valueCounts[value] = (valueCounts[value] || 0) + 1
    
    if (card.suit === 'J') {
      hasJokers = true
    } else if (value >= 11) {
      strongCards++
    } else if (value <= 5) {
      weakCards++
    }
  })
  
  return { suitCounts, valueCounts, hasJokers, strongCards, weakCards }
}

export function estimateMovesToClear(cards: Card[], levelRank: number): number {
  const safeCards = filterSafeCards(cards, levelRank)
  const strongCardsCount = countStrongCards(cards, levelRank)
  
  let estimatedMoves = 0
  
  estimatedMoves += Math.floor(safeCards.length / 2)
  
  estimatedMoves += Math.floor(strongCardsCount / 3)
  
  const distribution = analyzeCardDistribution(cards, levelRank)
  const maxSuitCount = Math.max(...Object.values(distribution.suitCounts))
  if (maxSuitCount >= 5) {
    estimatedMoves += 2
  }
  
  return Math.max(1, estimatedMoves)
}

export function calculateControlScore(
  cardCount: number,
  strongCards: number,
  hasJokers: boolean,
  levelRank: number
): number {
  let score = 0
  
  score += cardCount * 5
  
  score += strongCards * 8
  
  if (hasJokers) {
    score += 15
  }
  
  const safeCards = cardCount - (strongCards + (hasJokers ? 2 : 0))
  score += safeCards * 3
  
  return score
}

export function assessRisk(
  moveCards: Card[],
  handCards: Card[],
  levelRank: number,
  isLeading: boolean
): number {
  let risk = 0
  
  const moveValue = moveCards.reduce((sum, card) => sum + getCardValue(card, levelRank), 0)
  const handValue = handCards.reduce((sum, card) => sum + getCardValue(card, levelRank), 0)
  
  if (!isLeading && moveValue > handValue * 0.7) {
    risk += 30
  }
  
  const moveStrongCards = moveCards.filter(card => getCardValue(card, levelRank) >= 11).length
  if (moveStrongCards > moveCards.length * 0.6) {
    risk += 20
  }
  
  const remainingStrongCards = handCards.filter(card => 
    getCardValue(card, levelRank) >= 11 && !moveCards.includes(card)
  ).length
  
  if (remainingStrongCards < 2) {
    risk += 25
  }
  
  return Math.min(100, risk)
}
