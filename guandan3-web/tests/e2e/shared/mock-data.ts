/**
 * E2E测试共享mock数据
 */

import type { MockCard } from './types'

/**
 * 标准测试手牌 - 27张牌（掼蛋标准手牌数量）
 * 按照花色和点数排序
 */
export const MOCK_HAND_CARDS: readonly MockCard[] = [
  // 黑桃 (Spades)
  { id: 1, suit: 'S', rank: 'A', val: 14 },
  { id: 2, suit: 'S', rank: 'K', val: 13 },
  { id: 3, suit: 'S', rank: 'Q', val: 12 },
  { id: 4, suit: 'S', rank: 'J', val: 11 },
  { id: 5, suit: 'S', rank: '10', val: 10 },
  { id: 6, suit: 'S', rank: '9', val: 9 },
  { id: 7, suit: 'S', rank: '8', val: 8 },
  { id: 8, suit: 'S', rank: '7', val: 7 },
  { id: 9, suit: 'S', rank: '6', val: 6 },
  { id: 10, suit: 'S', rank: '5', val: 5 },
  { id: 11, suit: 'S', rank: '4', val: 4 },
  { id: 12, suit: 'S', rank: '3', val: 3 },
  { id: 13, suit: 'S', rank: '2', val: 2 },

  // 红桃 (Hearts)
  { id: 14, suit: 'H', rank: 'A', val: 14 },
  { id: 15, suit: 'H', rank: 'K', val: 13 },
  { id: 16, suit: 'H', rank: 'Q', val: 12 },
  { id: 17, suit: 'H', rank: 'J', val: 11 },
  { id: 18, suit: 'H', rank: '10', val: 10 },
  { id: 19, suit: 'H', rank: '9', val: 9 },
  { id: 20, suit: 'H', rank: '8', val: 8 },
  { id: 21, suit: 'H', rank: '7', val: 7 },
  { id: 22, suit: 'H', rank: '6', val: 6 },
  { id: 23, suit: 'H', rank: '5', val: 5 },
  { id: 24, suit: 'H', rank: '4', val: 4 },
  { id: 25, suit: 'H', rank: '3', val: 3 },
  { id: 26, suit: 'H', rank: '2', val: 2 },

  // 方块 (Diamonds) - 补足27张
  { id: 27, suit: 'D', rank: 'A', val: 14 },
] as const

/**
 * 创建mock手牌的深拷贝
 */
export function createMockHandCards(): MockCard[] {
  return MOCK_HAND_CARDS.map(card => ({ ...card }))
}

/**
 * 从手牌中移除指定的牌
 */
export function removeCardsFromHand(hand: MockCard[], playedCards: MockCard[]): MockCard[] {
  const result = [...hand]

  for (const playedCard of playedCards) {
    const index = result.findIndex(c => c.id === playedCard.id)
    if (index !== -1) {
      result.splice(index, 1)
    }
  }

  return result
}
