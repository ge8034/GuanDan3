import { Card } from '@/lib/store/game';
import {
  TYPE_BONUS,
  STRONG_CARD_THRESHOLD,
  createCardValueCache,
  getCardValueWithCache,
} from './common';

// ============================================================================
// 类型定义
// ============================================================================

/** 手牌强度计算参数 */
export interface HandStrengthParams {
  cardCount: number;
  playedValue: number;
  playedType: string;
}

/** 控制分数参数 */
export interface ControlScoreParams {
  cardCount: number;
  strongCards: number;
  hasJokers: boolean;
  levelRank: number;
}

// ============================================================================
// 评估函数
// ============================================================================

/**
 * 计算手牌强度
 *
 * 综合评估打出的一手牌的强度，考虑卡牌数量、牌值和牌型。
 *
 * @param params - 手牌强度参数
 * @returns 强度分数
 */
export function calculateHandStrength({
  cardCount,
  playedValue,
  playedType,
}: HandStrengthParams): number {
  if (cardCount === 0) return 0;
  const strength = cardCount * 10 + playedValue * 2;
  return strength + (TYPE_BONUS[playedType] || 0);
}

/**
 * 计算控制分数
 *
 * 评估手牌对局面的控制能力，分数越高表示控制力越强。
 *
 * @param params - 控制分数参数
 * @returns 控制分数
 */
export function calculateControlScore({
  cardCount,
  strongCards,
  hasJokers,
}: ControlScoreParams): number {
  const score =
    cardCount * 5 +
    strongCards * 8 +
    (hasJokers ? 15 : 0);

  const safeCards = cardCount - (strongCards + (hasJokers ? 2 : 0));
  return score + safeCards * 3;
}

/**
 * 评估出牌风险
 *
 * 评估打出某手牌的风险，考虑牌值、剩余强牌等因素。
 * 使用缓存优化重复计算。
 *
 * @param moveCards - 要打出的卡牌
 * @param handCards - 剩余手牌
 * @param levelRank - 当前级牌点数
 * @param isLeading - 是否领出
 * @returns 风险分数 (0-100)
 */
export function assessRisk(
  moveCards: Card[],
  handCards: Card[],
  levelRank: number,
  isLeading: boolean
): number {
  const moveCache = createCardValueCache(moveCards, levelRank);
  const handCache = createCardValueCache(handCards, levelRank);

  // 计算出牌和手牌的总值
  const moveValue = moveCards.reduce(
    (sum, card) => sum + getCardValueWithCache(card, moveCache),
    0
  );
  const handValue = handCards.reduce(
    (sum, card) => sum + getCardValueWithCache(card, handCache),
    0
  );

  let risk = 0;

  // 非领出时，出大牌风险高
  if (!isLeading && moveValue > handValue * 0.7) {
    risk += 30;
  }

  // 计算出牌中的强牌比例
  const moveStrongCards = moveCards.filter((card) => {
    const value = getCardValueWithCache(card, moveCache);
    return value >= STRONG_CARD_THRESHOLD;
  }).length;

  if (moveStrongCards > moveCards.length * 0.6) {
    risk += 20;
  }

  // 计算剩余强牌数量
  const moveCardIds = new Set(moveCards.map((c) => c.id));
  const remainingStrongCards = handCards.filter((card) => {
    const value = getCardValueWithCache(card, handCache);
    return value >= STRONG_CARD_THRESHOLD && !moveCardIds.has(card.id);
  }).length;

  if (remainingStrongCards < 2) {
    risk += 25;
  }

  return Math.min(100, risk);
}
