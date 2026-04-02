import { Card } from '@/lib/store/game';
import { getCardValue } from '../rules';
import { STRONG_CARD_THRESHOLD } from './common';

/**
 * 过滤安全卡牌
 *
 * 返回不包含级牌和王牌的卡牌，这些牌通常比较"安全"可以打出。
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 过滤后的卡牌数组
 */
export function filterSafeCards(cards: Card[], levelRank: number): Card[] {
  return cards.filter(
    (card) => card.val !== levelRank && card.suit !== 'J'
  );
}

/**
 * 统计强牌数量
 *
 * 计算手牌中强牌（J 以上）的数量，不包括王牌。
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 强牌数量
 */
export function countStrongCards(cards: Card[], levelRank: number): number {
  return cards.filter((card) => {
    const value = getCardValue(card, levelRank);
    return value >= STRONG_CARD_THRESHOLD && card.suit !== 'J';
  }).length;
}
