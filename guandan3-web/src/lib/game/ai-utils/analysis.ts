import { Card } from '@/lib/store/game';
import {
  CardDistribution,
  createCardValueCache,
  getCardValueWithCache,
  batchFilterCards,
  MAX_SAFE_CARDS,
  STRONG_CARD_THRESHOLD,
  WEAK_CARD_THRESHOLD,
} from './common';

/**
 * 分析卡牌分布
 *
 * 分析手牌的花色分布、点数分布、强弱牌等统计信息。
 * 使用缓存优化性能。
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 包含各项统计信息的对象
 */
export function analyzeCardDistribution(
  cards: Card[],
  levelRank: number
): CardDistribution {
  const cache = createCardValueCache(cards, levelRank);

  const suitCounts: Record<string, number> = {
    S: 0,
    H: 0,
    C: 0,
    D: 0,
    J: 0,
  };
  const valueCounts: Record<number, number> = {};

  let hasJokers = false;
  let strongCards = 0;
  let weakCards = 0;

  for (const card of cards) {
    // 统计花色
    suitCounts[card.suit]++;

    // 统计点数
    const value = getCardValueWithCache(card, cache);
    valueCounts[value] = (valueCounts[value] || 0) + 1;

    // 统计特殊牌
    if (card.suit === 'J') {
      hasJokers = true;
    } else if (value >= STRONG_CARD_THRESHOLD) {
      strongCards++;
    } else if (value <= WEAK_CARD_THRESHOLD) {
      weakCards++;
    }
  }

  return { suitCounts, valueCounts, hasJokers, strongCards, weakCards };
}

/**
 * 估计剩余出牌次数
 *
 * 根据手牌情况估计还需要多少次出牌才能出完。
 * 使用批量过滤优化性能。
 *
 * @param cards - 当前手牌
 * @param levelRank - 当前级牌点数
 * @returns 估计的出牌次数
 */
export function estimateMovesToClear(cards: Card[], levelRank: number): number {
  const cache = createCardValueCache(cards, levelRank);
  const { safeCards, strongCards } = batchFilterCards(cards, levelRank, cache);

  let estimatedMoves = 0;
  estimatedMoves += Math.floor(safeCards.length / 2);
  estimatedMoves += Math.floor(strongCards.length / 3);

  const distribution = analyzeCardDistribution(cards, levelRank);
  const maxSuitCount = Math.max(...Object.values(distribution.suitCounts));
  if (maxSuitCount >= MAX_SAFE_CARDS) {
    estimatedMoves += 2;
  }

  return Math.max(1, estimatedMoves);
}

/**
 * 批量分析多手牌
 * 优化批量操作的性能
 *
 * @param hands - 多手牌
 * @param levelRank - 当前级牌点数
 * @returns 每手牌的分析结果
 */
export function analyzeMultipleHands(
  hands: readonly Card[][],
  levelRank: number
): CardDistribution[] {
  return hands.map((hand) => analyzeCardDistribution(hand, levelRank));
}
