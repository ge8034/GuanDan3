
import { Card } from '@/lib/store/game'
import { getCardValue } from './rules'

// Simplified AI Logic for GuanDan
// Prioritizes getting rid of cards.
// Does NOT plan ahead (yet).

interface AIMove {
  type: 'play' | 'pass'
  cards?: Card[]
}

// Helper to sort cards by value (using rules)
function sortCards(cards: Card[], levelRank: number): Card[] {
  return [...cards].sort((a, b) => getCardValue(a, levelRank) - getCardValue(b, levelRank))
}

// Helper to find combinations
function findSingles(cards: Card[], levelRank: number): Card[][] {
  return sortCards(cards, levelRank).map(c => [c])
}

function findPairs(cards: Card[], levelRank: number): Card[][] {
  const sorted = sortCards(cards, levelRank)
  const pairs: Card[][] = []
  for (let i = 0; i < sorted.length - 1; i++) {
    // Check if values are same (including level cards logic)
    // Note: getCardValue returns effective value.
    if (getCardValue(sorted[i], levelRank) === getCardValue(sorted[i+1], levelRank)) {
      pairs.push([sorted[i], sorted[i+1]])
      i++ // Skip next card
    }
  }
  return pairs
}

function findTriples(cards: Card[], levelRank: number): Card[][] {
  const sorted = sortCards(cards, levelRank)
  const triples: Card[][] = []
  for (let i = 0; i < sorted.length - 2; i++) {
    const v1 = getCardValue(sorted[i], levelRank)
    const v2 = getCardValue(sorted[i+1], levelRank)
    const v3 = getCardValue(sorted[i+2], levelRank)
    
    if (v1 === v2 && v2 === v3) {
      triples.push([sorted[i], sorted[i+1], sorted[i+2]])
      i += 2
    }
  }
  return triples
}

function findBombs(cards: Card[], levelRank: number): Card[][] {
  const sorted = sortCards(cards, levelRank)
  const bombs: Card[][] = []
  if (sorted.length === 0) return []
  
  let currentGroup: Card[] = [sorted[0]]
  
  for (let i = 1; i < sorted.length; i++) {
    const v1 = getCardValue(sorted[i], levelRank)
    const v2 = getCardValue(sorted[i-1], levelRank)
    
    if (v1 === v2) {
      currentGroup.push(sorted[i])
    } else {
      if (currentGroup.length >= 4) {
        bombs.push([...currentGroup])
      }
      currentGroup = [sorted[i]]
    }
  }
  if (currentGroup.length >= 4) {
    bombs.push([...currentGroup])
  }
  return bombs
}

export function decideMove(
  myHand: Card[],
  lastAction: { type: 'play' | 'pass', cards?: Card[], seatNo?: number } | null,
  currentLevel: number = 2
): AIMove {
  if (myHand.length === 0) return { type: 'pass' }

  // 1. Leading (Free Play)
  if (!lastAction || lastAction.type === 'pass' || !lastAction.cards) {
    // Lead smallest single
    const singles = findSingles(myHand, currentLevel)
    return { type: 'play', cards: singles[0] }
  }

  // 2. Following (Must Beat)
  const targetCards = lastAction.cards
  const targetCount = targetCards.length
  // Get effective value of target
  // We assume target cards are valid combination, so use first card value
  const targetVal = getCardValue(targetCards[0], currentLevel)
  
  // Analyze target type
  let targetType = 'single'
  if (targetCount === 2) targetType = 'pair'
  if (targetCount === 3) targetType = 'triple'
  if (targetCount >= 4) targetType = 'bomb'

  // Try to find a beating move
  if (targetType === 'single') {
    const singles = findSingles(myHand, currentLevel)
    const valid = singles.find(s => getCardValue(s[0], currentLevel) > targetVal)
    if (valid) return { type: 'play', cards: valid }
  }
  
  if (targetType === 'pair') {
    const pairs = findPairs(myHand, currentLevel)
    const valid = pairs.find(p => getCardValue(p[0], currentLevel) > targetVal)
    if (valid) return { type: 'play', cards: valid }
  }

  if (targetType === 'triple') {
    const triples = findTriples(myHand, currentLevel)
    const valid = triples.find(t => getCardValue(t[0], currentLevel) > targetVal)
    if (valid) return { type: 'play', cards: valid }
  }

  if (targetType === 'bomb') {
    const bombs = findBombs(myHand, currentLevel)
    // Beat if more cards OR same count + higher value
    const valid = bombs.find(b => {
      if (b.length > targetCount) return true
      const bVal = getCardValue(b[0], currentLevel)
      if (b.length === targetCount && bVal > targetVal) return true
      return false
    })
    if (valid) return { type: 'play', cards: valid }
  }

  // If cannot beat with same type, try Bomb (bombs beat everything except higher bombs)
  if (targetType !== 'bomb') {
    const bombs = findBombs(myHand, currentLevel)
    if (bombs.length > 0) return { type: 'play', cards: bombs[0] } // Play smallest bomb
  }

  // No move found
  return { type: 'pass' }
}
