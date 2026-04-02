import { Card } from '@/lib/store/game';
import { getCardValue } from '../rules';
import { SUIT_ORDER } from './common';

/**
 * 对卡牌进行排序
 *
 * 按照掼蛋规则对卡牌排序：先按牌值（大到小），牌值相同时按花色排序。
 *
 * @param cards - 要排序的卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 排序后的卡牌数组
 */
export function sortCards(cards: Card[], levelRank: number): Card[] {
  return [...cards].sort((a, b) => {
    const valueA = getCardValue(a, levelRank);
    const valueB = getCardValue(b, levelRank);
    if (valueA !== valueB) return valueB - valueA;
    return SUIT_ORDER[b.suit] - SUIT_ORDER[a.suit];
  });
}
