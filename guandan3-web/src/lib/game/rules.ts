
import { Card } from '@/lib/store/game'

export type HandType = 'single' | 'pair' | 'triple' | 'straight' | 'sequencePairs' | 'sequenceTriples' | 'sequenceTriplesWithWings' | 'fullhouse' | 'bomb' | 'pass'

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
  const rawVals = cards.map(c => c.val).sort((a, b) => a - b)
  const uniqueRawVals = Array.from(new Set(rawVals))
  const hasJoker = cards.some(c => c.suit === 'J')
  const hasLevel = cards.some(c => c.val === levelRank)

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

  // 王炸 - 双王炸弹，最大的炸弹
  if (cards.length === 2 && hasJoker && uniqueValues.length === 2) {
    // 王炸是最大的炸弹，使用特殊的高值
    return { type: 'bomb', cards, primaryValue: 10000 }
  }

  // 四带二 - 四张相同牌带两张单牌或一对
  if (cards.length === 6 && !hasJoker && !hasLevel) {
    const counts: Record<number, number> = {}
    for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
    
    // 找到四张的牌
    const quadVals = Object.keys(counts)
      .map(v => Number(v))
      .filter(v => counts[v] === 4)
    
    if (quadVals.length === 1) {
      // 剩余两张可以是单牌或一对
      const remainingVals = Object.keys(counts)
        .map(v => Number(v))
        .filter(v => counts[v] !== 4)
      
      if (remainingVals.length === 2 || (remainingVals.length === 1 && counts[remainingVals[0]] === 2)) {
        return { type: 'bomb', cards, primaryValue: 1000 * 4 + quadVals[0] }
      }
    }
  }

  if (!hasJoker && !hasLevel) {
    if (cards.length === 5 && uniqueRawVals.length === 2) {
      const countsByVal = uniqueRawVals
        .map(v => ({ v, c: rawVals.filter(x => x === v).length }))
        .sort((a, b) => b.c - a.c)
      if (countsByVal[0].c === 3 && countsByVal[1].c === 2) {
        return { type: 'fullhouse', cards, primaryValue: countsByVal[0].v }
      }
    }

    if (cards.length >= 5 && uniqueRawVals.length === cards.length) {
      let isStraight = true
      for (let i = 1; i < rawVals.length; i++) {
        if (rawVals[i] !== rawVals[i - 1] + 1) {
          isStraight = false
          break
        }
      }
      if (isStraight) {
        return { type: 'straight', cards, primaryValue: rawVals[rawVals.length - 1] }
      }
    }

    if (cards.length >= 4 && cards.length % 2 === 0) {
      const counts: Record<number, number> = {}
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
      if (Object.values(counts).every(c => c === 2)) {
        const pairVals = Object.keys(counts)
          .map(v => Number(v))
          .sort((a, b) => a - b)
        let isSeq = true
        for (let i = 1; i < pairVals.length; i++) {
          if (pairVals[i] !== pairVals[i - 1] + 1) {
            isSeq = false
            break
          }
        }
        if (isSeq) {
          return { type: 'sequencePairs', cards, primaryValue: pairVals[pairVals.length - 1] }
        }
      }
    }

    // Sequence Triples (飞机) - 2+ consecutive triples
    if (cards.length >= 6 && cards.length % 3 === 0) {
      const counts: Record<number, number> = {}
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
      const tripleVals = Object.keys(counts)
        .map(v => Number(v))
        .filter(v => counts[v] === 3)
        .sort((a, b) => a - b)
      
      if (tripleVals.length >= 2 && tripleVals.length * 3 === cards.length) {
        let isSeq = true
        for (let i = 1; i < tripleVals.length; i++) {
          if (tripleVals[i] !== tripleVals[i - 1] + 1) {
            isSeq = false
            break
          }
        }
        if (isSeq) {
          return { type: 'sequenceTriples', cards, primaryValue: tripleVals[tripleVals.length - 1] }
        }
      }
    }

    // Sequence Triples with Wings (飞机带翅膀)
    // Format: 2+ consecutive triples + same number of wings (singles or pairs)
    if (cards.length >= 8) {
      const counts: Record<number, number> = {}
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
      const tripleVals = Object.keys(counts)
        .map(v => Number(v))
        .filter(v => counts[v] === 3)
        .sort((a, b) => a - b)
      
      if (tripleVals.length >= 2) {
        let isSeq = true
        for (let i = 1; i < tripleVals.length; i++) {
          if (tripleVals[i] !== tripleVals[i - 1] + 1) {
            isSeq = false
            break
          }
        }
        
        if (isSeq) {
          const tripleCount = tripleVals.length
          const expectedWings = tripleCount
          const actualWings = cards.length - tripleCount * 3
          
          // Wings can be singles or pairs
          if (actualWings === expectedWings || actualWings === expectedWings * 2) {
            // Check if wings are valid (not part of triples)
            const wingVals = Object.keys(counts)
              .map(v => Number(v))
              .filter(v => counts[v] !== 3)
            
            // For singles: each wing should be a single card
            // For pairs: each wing should be a pair
            if (actualWings === expectedWings) {
              // Singles wings
              if (wingVals.length === expectedWings) {
                return { type: 'sequenceTriplesWithWings', cards, primaryValue: tripleVals[tripleVals.length - 1] }
              }
            } else if (actualWings === expectedWings * 2) {
              // Pairs wings
              const pairWings = wingVals.filter(v => counts[v] === 2)
              if (pairWings.length === expectedWings) {
                return { type: 'sequenceTriplesWithWings', cards, primaryValue: tripleVals[tripleVals.length - 1] }
              }
            }
          }
        }
      }
    }
  }

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

// Analyze a set of cards to determine its type (alias for analyzeMove)
export function analyze(cards: Card[], levelRank: number): Move | null {
  return analyzeMove(cards, levelRank)
}
