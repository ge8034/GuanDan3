import { Card } from '@/lib/store/game';
import { getCardValue } from '../rules';

// ============================================================================
// 常量定义
// ============================================================================

/** 花色优先级顺序 */
export const SUIT_ORDER: Record<string, number> = {
  S: 4, // 黑桃
  H: 3, // 红桃
  C: 2, // 梅花
  D: 1, // 方片
  J: 0, // Joker
} as const;

/** 牌型加成系数 */
export const TYPE_BONUS: Readonly<Record<string, number>> = {
  single: 1,
  pair: 2,
  triple: 3,
  bomb: 8,
  straight: 4,
  fullHouse: 5,
  sequencePair: 6,
  sequenceTriple: 7,
  sequenceTripleWithWing: 9,
} as const;

/** 强牌阈值 */
export const STRONG_CARD_THRESHOLD = 11;

/** 弱牌阈值 */
export const WEAK_CARD_THRESHOLD = 5;

/** 最大安全牌数 */
export const MAX_SAFE_CARDS = 5;

// ============================================================================
// 类型定义
// ============================================================================

/** 卡牌值缓存映射 */
export type CardValueCache = Map<number, number>;

/** 卡牌分布分析结果 */
export interface CardDistribution {
  /** 花色计数 */
  suitCounts: Record<string, number>;
  /** 点数计数 */
  valueCounts: Record<number, number>;
  /** 是否有王牌 */
  hasJokers: boolean;
  /** 强牌数量 */
  strongCards: number;
  /** 弱牌数量 */
  weakCards: number;
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 创建卡牌值缓存
 * 批量计算并缓存卡牌值，避免重复计算
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 卡牌值缓存映射
 */
export function createCardValueCache(
  cards: Card[],
  levelRank: number
): CardValueCache {
  const cache = new Map<number, number>();
  for (const card of cards) {
    if (!cache.has(card.id)) {
      cache.set(card.id, getCardValue(card, levelRank));
    }
  }
  return cache;
}

/**
 * 获取卡牌值（带缓存）
 */
export function getCardValueWithCache(
  card: Card,
  cache: CardValueCache
): number {
  return cache.get(card.id) ?? 0;
}

/**
 * 批量过滤卡牌（单次遍历）
 * 一次性完成多个过滤条件，减少遍历次数
 */
export function batchFilterCards(
  cards: Card[],
  levelRank: number,
  cache: CardValueCache
): {
  safeCards: Card[];
  strongCards: Card[];
  weakCards: Card[];
} {
  const safeCards: Card[] = [];
  const strongCards: Card[] = [];
  const weakCards: Card[] = [];

  for (const card of cards) {
    const value = getCardValueWithCache(card, cache);

    // 安全牌：非级牌、非王牌
    if (card.val !== levelRank && card.suit !== 'J') {
      safeCards.push(card);
    }

    // 强牌：J及以上（非王牌）
    if (value >= STRONG_CARD_THRESHOLD && card.suit !== 'J') {
      strongCards.push(card);
    }
    // 弱牌：5及以下
    else if (value <= WEAK_CARD_THRESHOLD) {
      weakCards.push(card);
    }
  }

  return { safeCards, strongCards, weakCards };
}
