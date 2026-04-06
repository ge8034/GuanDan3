import { Card } from '@/lib/store/game'
import { analyzeMove, canBeat } from '@/lib/game/rules'

export function getCardType(cards: number[]): string | null {
  if (!cards || cards.length === 0) return null

  const rankMap: Record<number, string> = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: 'S', 17: 'B'
  }

  const cardObjects: Card[] = cards.map(id => ({
    id,
    suit: ['S', 'H', 'C', 'D'][Math.floor(id / 100)] as any,
    val: id % 100,
    rank: rankMap[id % 100] || '2'
  }))

  const move = analyzeMove(cardObjects, 2)
  return move?.type || null
}

export function getCardTypeStrength(type: string): number {
  const strengthMap: Record<string, number> = {
    'single': 1,
    'pair': 2,
    'triple': 3,
    'straight': 4,
    'sequencePairs': 5,
    'sequenceTriples': 6,
    'sequenceTriplesWithWings': 7,
    'fullhouse': 8,
    'bomb': 10,
    'pass': 0
  }
  return strengthMap[type] || 0
}

export { canBeat }
