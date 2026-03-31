import { Card } from '@/lib/store/game'

/**
 * 牌型类型
 *
 * 掼蛋游戏支持的所有牌型
 */
export type HandType =
  | 'single'        /** 单张 */
  | 'pair'          /** 对子 */
  | 'triple'        /** 三张 */
  | 'straight'      /** 顺子 */
  | 'sequencePairs' /** 连对（飞机带翅膀） */
  | 'sequenceTriples' /** 连三（飞机不带翅膀） */
  | 'fullhouse'     /** 三带二 */
  | 'bomb'          /** 炸弹 */
  | 'pass'           /** 过/pass */

/**
 * 出牌动作
 */
export interface Move {
  /** 牌型 */
  type: HandType
  /** 出牌的卡牌 */
  cards: Card[]
  /** 主要值（用于比较大小） */
  primaryValue: number
}

/**
 * 获取卡牌在掼蛋规则中的有效值
 *
 * 根据掼蛋规则计算卡牌的强度值：
 * - 大小王：红王 200，黑王 100
 * - 级牌：红桃 60（逢人配），其他 50
 * - 普通牌：A=14, K=13, ..., 2=2
 *
 * @param card - 卡牌对象
 * @param levelRank - 当前级牌点数
 * @returns 卡牌有效值
 *
 * @example
 * ```ts
 * getCardValue({ suit: 'J', rank: 'hr', val: 17 }, 15) // 返回 200（红王）
 * getCardValue({ suit: 'H', rank: '15', val: 15 }, 15) // 返回 60（红桃级牌）
 * getCardValue({ suit: 'S', rank: 'A', val: 14 }, 15)   // 返回 14（普通A）
 * ```
 */
export function getCardValue(card: Card, levelRank: number): number {
  // 大小王
  if (card.suit === 'J') {
    return card.rank === 'hr' ? 200 : 100
  }

  // 级牌 - 大于A（掼蛋核心规则）
  if (card.val === levelRank) {
    // 红桃级牌逢人配，值最大
    return card.suit === 'H' ? 60 : 50
  }

  // 普通牌：A=14, K=13, ..., 2=2
  return card.val
}

/**
 * 分析出牌类型
 *
 * 根据掼蛋规则识别牌型并计算主要值。
 * 支持的牌型：单张、对子、三张、顺子、连对、连三、三带二、炸弹
 *
 * @param cards - 要分析的卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 出牌动作对象，无效牌型返回 null
 *
 * @example
 * ```ts
 * // 单张
 * analyzeMove([{ id: 101, val: 14, suit: 'S', rank: 'A' }], 15)
 * // 返回 { type: 'single', cards: [...], primaryValue: 14 }
 *
 * // 对子
 * analyzeMove([
 *   { id: 101, val: 14, suit: 'S', rank: 'A' },
 *   { id: 201, val: 14, suit: 'H', rank: 'A' }
 * ], 15)
 * // 返回 { type: 'pair', cards: [...], primaryValue: 14 }
 *
 * // 炸弹
 * analyzeMove([
 *   { id: 115, val: 15, suit: 'S', rank: '15' },
 *   { id: 215, val: 15, suit: 'H', rank: '15' },
 *   { id: 315, val: 15, suit: 'C', rank: '15' },
 *   { id: 415, val: 15, suit: 'D', rank: '15' }
 * ], 15)
 * // 返回 { type: 'bomb', cards: [...], primaryValue: 50 }
 * ```
 *
 * @remarks
 * 牌型识别规则：
 * - 单张：1 张牌
 * - 对子：2 张相同点数的牌
 * - 三张：3 张相同点数的牌
 * - 顺子：5 张及以上连续点数的牌
 * - 连对：3 对及以上连续点数的对子
 * - 连三：2 个及以上连续点的三张
 * - 三带二：1 个三张 + 1 个对子
 * - 炸弹：4 张相同点数 或 4 张王
 */
export function analyzeMove(cards: Card[], levelRank: number): Move | null {
  if (cards.length === 0) return { type: 'pass', cards: [], primaryValue: 0 }

  const values = cards
    .map((c) => getCardValue(c, levelRank))
    .sort((a, b) => a - b)
  const uniqueValues = Array.from(new Set(values))
  const rawVals = cards.map((c) => c.val).sort((a, b) => a - b)
  const uniqueRawVals = Array.from(new Set(rawVals))
  const ranks = cards.map((c) => c.rank)
  const uniqueRanks = Array.from(new Set(ranks))
  const hasJoker = cards.some((c) => c.suit === 'J')
  const hasLevel = cards.some((c) => c.val === levelRank)

  // ========== 单张 ==========
  if (cards.length === 1) {
    return { type: 'single', cards, primaryValue: values[0] }
  }

  // ========== 对子 ==========
  // 使用原始值判断是否相同（级牌对子：红桃级牌+其他花色级牌=有效对子）
  if (cards.length === 2 && uniqueRawVals.length === 1) {
    // 级牌对子使用最大值（逢人配的红桃级牌）
    const isLevelPair = rawVals[0] === levelRank
    const primaryValue = isLevelPair ? values[values.length - 1] : values[0]
    return { type: 'pair', cards, primaryValue }
  }

  // ========== 三张 ==========
  // 使用原始值判断是否相同
  if (cards.length === 3 && uniqueRawVals.length === 1) {
    // 级牌三张使用最大值（逢人配的红桃级牌）
    const isLevelTriple = rawVals[0] === levelRank
    const primaryValue = isLevelTriple ? values[values.length - 1] : values[0]
    return { type: 'triple', cards, primaryValue }
  }

  // ========== 炸弹检测（4张王，最大炸弹）==========
  if (cards.length === 4 && hasJoker && !hasLevel) {
    return { type: 'bomb', cards, primaryValue: 300 }
  }

  // 炸弹检测（4张相同）
  if (cards.length === 4 && uniqueRawVals.length === 1) {
    const primaryValue = values[values.length - 1]
    return { type: 'bomb', cards, primaryValue }
  }

  // 炸弹检测（级牌炸弹：4张级牌，红桃级牌+其他花色级牌+其他两张级牌）
  if (cards.length === 4 && hasLevel && uniqueRawVals.length === 1) {
    // 级牌炸弹使用红桃级牌的值
    const primaryValue = values[values.length - 1]
    return { type: 'bomb', cards, primaryValue }
  }

  // ========== 顺子（5张及以上连续，不能包含2和王）==========
  if (cards.length >= 5 && !hasJoker && !hasLevel) {
    const isSeq = uniqueRawVals.every((v, i) => i === 0 || v === rawVals[i - 1] + 1)
    const noTwoOrBigTwo = rawVals.every((v) => v !== 15 && v !== 17)
    if (isSeq && noTwoOrBigTwo) {
      return { type: 'straight', cards, primaryValue: values[values.length - 1] }
    }
  }

  // ========== 三带二（3张相同+2张相同）==========
  if (cards.length === 5) {
    const counts: Record<number, number> = {}
    for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
    const countValues = Object.values(counts)

    if (countValues.includes(3) && countValues.includes(2)) {
      const tripleVal = Object.keys(counts).find((v) => counts[Number(v)] === 3)
      if (tripleVal) {
        const tripleCards = cards.filter((c) => c.val === Number(tripleVal))
        return {
          type: 'fullhouse',
          cards,
          primaryValue: getCardValue(tripleCards[0], levelRank),
        }
      }
    }
  }

  // ========== 连对（飞机带翅膀）==========
  if (cards.length >= 6 && cards.length % 2 === 0) {
    const pairCounts: Record<number, number> = {}
    for (const v of rawVals) pairCounts[v] = (pairCounts[v] || 0) + 1
    const pairVals = Object.keys(pairCounts)
      .map((v) => Number(v))
      .filter((v) => pairCounts[v] === 2)
      .sort((a, b) => a - b)

    if (pairVals.length >= 3 && pairVals.length * 2 === cards.length) {
      let isSeq = true
      for (let i = 1; i < pairVals.length; i++) {
        if (pairVals[i] !== pairVals[i - 1] + 1) {
          isSeq = false
          break
        }
      }
      if (isSeq) {
        return {
          type: 'sequencePairs',
          cards,
          primaryValue: pairVals[pairVals.length - 1],
        }
      }
    }
  }

  // ========== 飞机（连续三张，不带翅膀）==========
  if (cards.length >= 6 && cards.length % 3 === 0) {
    const tripleCounts: Record<number, number> = {}
    for (const v of rawVals) tripleCounts[v] = (tripleCounts[v] || 0) + 1
    const tripleVals = Object.keys(tripleCounts)
      .map((v) => Number(v))
      .filter((v) => tripleCounts[v] === 3)
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
        return {
          type: 'sequenceTriples',
          cards,
          primaryValue: tripleVals[tripleVals.length - 1],
        }
      }
    }
  }

  return null
}

/**
 * 判断出牌 A 是否能压过出牌 B
 *
 * 根据掼蛋规则比较两个出牌的大小：
 * - 炸弹可以压任何非炸弹牌型
 * - 同牌型必须张数相同且主值更大
 * - 更大的炸弹可以压更小的炸弹
 *
 * @param moveA - 要打出的牌
 * @param moveB - 对比的牌（上家打出的牌）
 * @returns 是否可以压过
 *
 * @example
 * ```ts
 * const myPair = { type: 'pair', cards: [...], primaryValue: 15 }
 * const theirPair = { type: 'pair', cards: [...], primaryValue: 14 }
 * canBeat(myPair, theirPair) // 返回 true（15 对子压 14 对子）
 *
 * const myBomb = { type: 'bomb', cards: [...], primaryValue: 50 }
 * const theirStraight = { type: 'straight', cards: [...], primaryValue: 14 }
 * canBeat(myBomb, theirStraight) // 返回 true（炸弹压顺子）
 * ```
 */
export function canBeat(moveA: Move, moveB: Move): boolean {
  if (moveA.type === 'pass') return false
  if (moveB.type === 'pass') return true

  // 炸弹压非炸弹
  if (moveA.type === 'bomb' && moveB.type !== 'bomb') return true
  if (moveA.type !== 'bomb' && moveB.type === 'bomb') return false

  // 同牌型比较
  if (moveA.type === moveB.type) {
    if (moveA.type === 'bomb') {
      // 炸弹：直接比较 primaryValue
      return moveA.primaryValue > moveB.primaryValue
    }
    // 非炸弹：必须张数相同且主值更大
    return (
      moveA.cards.length === moveB.cards.length &&
      moveA.primaryValue > moveB.primaryValue
    )
  }

  return false
}

/**
 * 分析出牌（别名函数）
 *
 * @param cards - 要分析的卡牌数组
 * @param levelRank - 当前级牌点数
 * @returns 出牌动作对象
 */
export function analyze(cards: Card[], levelRank: number): Move | null {
  return analyzeMove(cards, levelRank)
}
