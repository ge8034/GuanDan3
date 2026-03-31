import { Card } from '@/lib/store/game';
import { getCardValue } from './rules';

/**
 * 对卡牌进行排序
 *
 * 按照掼蛋规则对卡牌排序：先按牌值（大到小），牌值相同时按花色排序。
 *
 * @param cards - 要排序的卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 排序后的卡牌数组
 *
 * @example
 * ```ts
 * const sorted = sortCards(hand, 15)
 * // 返回: [大王, 小王, 红桃级牌, ..., 方片2]
 * ```
 */
export function sortCards(cards: Card[], levelRank: number): Card[] {
  return [...cards].sort((a, b) => {
    const valueA = getCardValue(a, levelRank);
    const valueB = getCardValue(b, levelRank);
    if (valueA !== valueB) return valueB - valueA;
    const suitOrder = { S: 4, H: 3, C: 2, D: 1, J: 0 };
    return suitOrder[b.suit] - suitOrder[a.suit];
  });
}

/**
 * 过滤安全卡牌
 *
 * 返回不包含级牌和王牌的卡牌，这些牌通常比较"安全"可以打出。
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 过滤后的卡牌数组
 *
 * @example
 * ```ts
 * const safe = filterSafeCards(hand, 15)
 * // 返回不包含级牌(15)和王牌的牌
 * ```
 */
export function filterSafeCards(cards: Card[], levelRank: number): Card[] {
  return cards.filter((card) => card.val !== levelRank && card.suit !== 'J');
}

/**
 * 统计强牌数量
 *
 * 计算手牌中强牌（J 以上）的数量，不包括王牌。
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 强牌数量
 *
 * @example
 * ```ts
 * const count = countStrongCards(hand, 15)
 * // 返回手牌中 J、Q、K、A 的数量
 * ```
 */
export function countStrongCards(cards: Card[], levelRank: number): number {
  return cards.filter((card) => {
    const value = getCardValue(card, levelRank);
    return value >= 11 && card.suit !== 'J';
  }).length;
}

/**
 * 计算手牌强度
 *
 * 综合评估打出的一手牌的强度，考虑卡牌数量、牌值和牌型。
 *
 * @param cardCount - 打出的卡牌数量
 * @param playedValue - 打出的牌值
 * @param playedType - 打出的牌型
 * @returns 强度分数
 *
 * @example
 * ```ts
 * const strength = calculateHandStrength(4, 100, 'bomb')
 * // 炸弹获得额外加成
 * ```
 */
export function calculateHandStrength(
  cardCount: number,
  playedValue: number,
  playedType: string
): number {
  let strength = 0;

  strength += cardCount * 10;
  strength += playedValue * 2;

  const typeBonus: Record<string, number> = {
    single: 1,
    pair: 2,
    triple: 3,
    bomb: 8,
    straight: 4,
    fullHouse: 5,
    sequencePair: 6,
    sequenceTriple: 7,
    sequenceTripleWithWing: 9,
  };

  strength += typeBonus[playedType] || 0;

  return strength;
}

/**
 * 分析卡牌分布
 *
 * 分析手牌的花色分布、点数分布、强弱牌等统计信息。
 *
 * @param cards - 卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 包含各项统计信息的对象
 *
 * @example
 * ```ts
 * const analysis = analyzeCardDistribution(hand, 15)
 * console.log(analysis.suitCounts)  // { S: 5, H: 3, ... }
 * console.log(analysis.hasJokers)   // true/false
 * console.log(analysis.strongCards) // 强牌数量
 * ```
 */
export function analyzeCardDistribution(
  cards: Card[],
  levelRank: number
): {
  suitCounts: Record<string, number>;
  valueCounts: Record<number, number>;
  hasJokers: boolean;
  strongCards: number;
  weakCards: number;
} {
  const suitCounts: Record<string, number> = { S: 0, H: 0, C: 0, D: 0, J: 0 };
  const valueCounts: Record<number, number> = {};
  let hasJokers = false;
  let strongCards = 0;
  let weakCards = 0;

  cards.forEach((card) => {
    suitCounts[card.suit]++;
    const value = getCardValue(card, levelRank);
    valueCounts[value] = (valueCounts[value] || 0) + 1;

    if (card.suit === 'J') {
      hasJokers = true;
    } else if (value >= 11) {
      strongCards++;
    } else if (value <= 5) {
      weakCards++;
    }
  });

  return { suitCounts, valueCounts, hasJokers, strongCards, weakCards };
}

/**
 * 估计剩余出牌次数
 *
 * 根据手牌情况估计还需要多少次出牌才能出完。
 *
 * @param cards - 当前手牌
 * @param levelRank - 当前级牌点数
 * @returns 估计的出牌次数
 *
 * @example
 * ```ts
 * const moves = estimateMovesToClear(hand, 15)
 * // 返回估计还需要出牌的次数
 * ```
 */
export function estimateMovesToClear(cards: Card[], levelRank: number): number {
  const safeCards = filterSafeCards(cards, levelRank);
  const strongCardsCount = countStrongCards(cards, levelRank);

  let estimatedMoves = 0;

  estimatedMoves += Math.floor(safeCards.length / 2);
  estimatedMoves += Math.floor(strongCardsCount / 3);

  const distribution = analyzeCardDistribution(cards, levelRank);
  const maxSuitCount = Math.max(...Object.values(distribution.suitCounts));
  if (maxSuitCount >= 5) {
    estimatedMoves += 2;
  }

  return Math.max(1, estimatedMoves);
}

/**
 * 计算控制分数
 *
 * 评估手牌对局面的控制能力，分数越高表示控制力越强。
 *
 * @param cardCount - 手牌数量
 * @param strongCards - 强牌数量
 * @param hasJokers - 是否有王牌
 * @param levelRank - 当前级牌点数
 * @returns 控制分数
 *
 * @example
 * ```ts
 * const score = calculateControlScore(hand.length, strongCount, hasJokers, 15)
 * // 分数越高表示控制力越强
 * ```
 */
export function calculateControlScore(
  cardCount: number,
  strongCards: number,
  hasJokers: boolean,
  levelRank: number
): number {
  let score = 0;

  score += cardCount * 5;
  score += strongCards * 8;

  if (hasJokers) {
    score += 15;
  }

  const safeCards = cardCount - (strongCards + (hasJokers ? 2 : 0));
  score += safeCards * 3;

  return score;
}

/**
 * 评估出牌风险
 *
 * 评估打出某手牌的风险，考虑牌值、剩余强牌等因素。
 *
 * @param moveCards - 要打出的卡牌
 * @param handCards - 剩余手牌
 * @param levelRank - 当前级牌点数
 * @param isLeading - 是否领出
 * @returns 风险分数 (0-100)
 *
 * @example
 * ```ts
 * const risk = assessRisk(move, remainingHand, 15, false)
 * // 风险越高表示越危险
 * ```
 */
export function assessRisk(
  moveCards: Card[],
  handCards: Card[],
  levelRank: number,
  isLeading: boolean
): number {
  let risk = 0;

  const moveValue = moveCards.reduce(
    (sum, card) => sum + getCardValue(card, levelRank),
    0
  );
  const handValue = handCards.reduce(
    (sum, card) => sum + getCardValue(card, levelRank),
    0
  );

  if (!isLeading && moveValue > handValue * 0.7) {
    risk += 30;
  }

  const moveStrongCards = moveCards.filter(
    (card) => getCardValue(card, levelRank) >= 11
  ).length;
  if (moveStrongCards > moveCards.length * 0.6) {
    risk += 20;
  }

  const remainingStrongCards = handCards.filter(
    (card) => getCardValue(card, levelRank) >= 11 && !moveCards.includes(card)
  ).length;

  if (remainingStrongCards < 2) {
    risk += 25;
  }

  return Math.min(100, risk);
}
