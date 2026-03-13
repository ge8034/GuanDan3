
import { Card } from '@/lib/store/game'

export type HandType = 'single' | 'pair' | 'triple' | 'bomb' | 'pass'

export interface Move {
  type: HandType
  cards: Card[]
  primaryValue: number // Used for comparison
}

// Get the effective value of a card in GuanDan
// levelRank: The rank of the current level (e.g. 2 for level 2). 
// Note: In strict GuanDan, level card rank depends on suit (Heart > others).
export function getCardValue(card: Card, levelRank: number): number {
  // Jokers
  if (card.suit === 'J') {
    return card.rank === 'hr' ? 200 : 100 // Red Joker > Black Joker
  }

  // Level Card (e.g. if playing 2, then 2 is higher than A)
  // We need to know the 'val' corresponding to levelRank.
  // Assuming levelRank is 2..14 (A=14).
  // If card.val == levelRank, it is a level card.
  if (card.val === levelRank) {
    return card.suit === 'H' ? 50 : 40 // Heart Level > Other Level
  }

  // Normal Cards
  // 2 is usually lowest in standard poker, but in GuanDan 2 is level card?
  // If level is NOT 2, then 2 is smallest (unless specific rule).
  // Let's assume standard ordering: 2,3,4...A.
  // But usually A is high.
  // Let's stick to card.val for now (2..14).
  return card.val
}

// Analyze a set of cards to determine its type
export function analyzeMove(cards: Card[], levelRank: number): Move | null {
  if (cards.length === 0) return { type: 'pass', cards: [], primaryValue: 0 }

  const values = cards.map(c => getCardValue(c, levelRank)).sort((a, b) => a - b)
  const uniqueValues = Array.from(new Set(values))

  // Single
  if (cards.length === 1) {
    return { type: 'single', cards, primaryValue: values[0] }
  }

  // Pair
  if (cards.length === 2 && uniqueValues.length === 1) {
    return { type: 'pair', cards, primaryValue: values[0] }
  }

  // Triple
  if (cards.length === 3 && uniqueValues.length === 1) {
    return { type: 'triple', cards, primaryValue: values[0] }
  }

  // Bomb (4+ cards of same rank)
  if (cards.length >= 4 && uniqueValues.length === 1) {
    // Bomb value depends on count (5 > 4) and rank.
    // We can use a large base for bomb count.
    // e.g. 4-bomb base 1000, 5-bomb base 2000...
    return { type: 'bomb', cards, primaryValue: 1000 * cards.length + values[0] }
  }

  // TODO: Straight, Full House, Plate, etc.
  return null
}

// Check if move A beats move B
export function canBeat(moveA: Move, moveB: Move): boolean {
  if (moveA.type === 'pass') return false
  if (moveB.type === 'pass') return true // Any move beats pass? No, pass is skipping.

  // Bomb beats non-bomb
  if (moveA.type === 'bomb' && moveB.type !== 'bomb') return true
  if (moveA.type !== 'bomb' && moveB.type === 'bomb') return false

  // Same type comparison
  if (moveA.type === moveB.type) {
    if (moveA.type === 'bomb') {
      // Compare bomb count first, then value (simplified)
      // Our primaryValue for bomb already encodes count.
      return moveA.primaryValue > moveB.primaryValue
    }
    // Must have same number of cards for non-bombs (usually)
    if (moveA.cards.length !== moveB.cards.length) return false
    return moveA.primaryValue > moveB.primaryValue
  }

  return false
}
