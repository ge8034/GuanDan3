import { Card } from '@/lib/store/game'
import { JOKER_VALUES, LEVEL_CARD_VALUES, BOMB_VALUES, HAND_LENGTHS } from './rules-constants'

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
 * 卡牌值统计接口
 *
 * 用于存储和分析卡牌值的出现次数
 */
interface CardValueCounts {
  /** 原始值（val）出现次数映射 */
  counts: Record<number, number>
  /** 唯一原始值数组 */
  uniqueValues: number[]
  /** 排序后的原始值数组 */
  sortedValues: number[]
}

/**
 * 统计卡牌值出现次数
 *
 * @param rawVals - 原始卡牌值数组
 * @returns 卡牌值统计对象
 * 
 * @example
 * \`\`\`ts
 * countCardValues([3, 3, 5, 5, 5])
 * // 返回 { counts: { 3: 2, 5: 3 }, uniqueValues: [3, 5], sortedValues: [3, 3, 5, 5, 5] }
 * \`\`\`
 */
function countCardValues(rawVals: number[]): CardValueCounts {
  const counts: Record<number, number> = {}
  for (const v of rawVals) {
    counts[v] = (counts[v] || 0) + 1
  }
  const uniqueValues = Array.from(new Set(rawVals))
  const sortedValues = [...rawVals].sort((a, b) => a - b)
  
  return { counts, uniqueValues, sortedValues }
}

/**
 * 检查数组是否为连续序列
 *
 * @param values - 已排序的数值数组
 * @returns 是否为连续序列
 */
function isConsecutive(values: number[]): boolean {
  for (let i = 1; i < values.length; i++) {
    if (values[i] !== values[i - 1] + 1) {
      return false
    }
  }
  return true
}

/**
 * 判断是否为有效顺子
 *
 * @param uniqueRawVals - 唯一原始值数组（已排序）
 * @param rawVals - 原始值数组（已排序）
 * @param cardCount - 总卡牌数
 * @returns 是否为有效顺子
 */
function isValidStraight(uniqueRawVals: number[], rawVals: number[], cardCount: number): boolean {
  if (cardCount < HAND_LENGTHS.MIN_STRAIGHT) return false
  if (cardCount > HAND_LENGTHS.MAX_STRAIGHT) return false
  if (uniqueRawVals.length !== cardCount) return false
  
  // 处理 2 (15) 的逻辑：在顺子中 2 < 3
  // 将 15 映射为 2 进行连续性检查
  const normalizedVals = uniqueRawVals.map(v => v === 15 ? 2 : v).sort((a, b) => a - b)
  if (!isConsecutive(normalizedVals)) return false

  // 顺子不能包含王
  return rawVals.every((v) => v !== 17)
}

/**
 * 判断是否为有效连对
 *
 * @param counts - 原始值统计对象
 * @param cardCount - 总卡牌数
 * @returns 连对的最大值，无效返回 null
 */
function getSequencePairsMaxValue(counts: CardValueCounts, cardCount: number): number | null {
  if (cardCount < HAND_LENGTHS.MIN_SEQUENCE_PAIRS * 2 || cardCount % 2 !== 0) {
    return null
  }
  
  // 找出所有出现2次的值
  const pairVals = counts.uniqueValues
    .filter((v) => counts.counts[v] === 2)
    .sort((a, b) => a - b)
  
  if (pairVals.length < HAND_LENGTHS.MIN_SEQUENCE_PAIRS || pairVals.length * 2 !== cardCount) {
    return null
  }
  
  if (!isConsecutive(pairVals)) {
    return null
  }
  
  return pairVals[pairVals.length - 1]
}

/**
 * 判断是否为有效连三（飞机不带翅膀）
 *
 * @param counts - 原始值统计对象
 * @param cardCount - 总卡牌数
 * @returns 连三的最大值，无效返回 null
 */
function getSequenceTriplesMaxValue(counts: CardValueCounts, cardCount: number): number | null {
  if (cardCount < HAND_LENGTHS.MIN_SEQUENCE_TRIPLES * 3 || cardCount % 3 !== 0) {
    return null
  }
  
  // 找出所有出现3次的值
  const tripleVals = counts.uniqueValues
    .filter((v) => counts.counts[v] === 3)
    .sort((a, b) => a - b)
  
  if (tripleVals.length < HAND_LENGTHS.MIN_SEQUENCE_TRIPLES || tripleVals.length * 3 !== cardCount) {
    return null
  }
  
  if (!isConsecutive(tripleVals)) {
    return null
  }
  
  return tripleVals[tripleVals.length - 1]
}

/**
 * 判断是否为有效三带二
 *
 * 规则：三张相同点数 + 两张对子（两张任意牌必须是对子）
 *
 * @param counts - 原始值统计对象
 * @param cards - 卡牌数组
 * @param levelRank - 级牌点数
 * @returns 三带二的主值，无效返回 null
 */
function getFullHousePrimaryValue(counts: CardValueCounts, cards: Card[], levelRank: number): number | null {
  const countValues = Object.values(counts.counts)

  // 必须恰好有3张相同和2张相同（两张必须是对子，不能是两张不同的单牌）
  if (!countValues.includes(3) || !countValues.includes(2) || countValues.length !== 2) {
    return null
  }
  
  // 找到三张的值
  const tripleVal = counts.uniqueValues.find((v) => counts.counts[v] === 3)
  if (tripleVal === undefined) return null
  
  const tripleCards = cards.filter((c) => c.val === tripleVal)
  return getCardValue(tripleCards[0], levelRank)
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
 * \`\`\`ts
 * getCardValue({ suit: 'J', rank: 'hr', val: 17 }, 15) // 返回 200（红王）
 * getCardValue({ suit: 'H', rank: '15', val: 15 }, 15) // 返回 60（红桃级牌）
 * getCardValue({ suit: 'S', rank: 'A', val: 14 }, 15)   // 返回 14（普通A）
 * \`\`\`
 */
export function getCardValue(card: Card, levelRank: number): number {
  // 大小王
  if (card.suit === 'J') {
    return card.rank === 'hr' ? JOKER_VALUES.RED : JOKER_VALUES.BLACK
  }

  // 级牌 - 大于A（掼蛋核心规则）
  if (card.val === levelRank) {
    // 红桃级牌逢人配，值最大
    return card.suit === 'H' ? LEVEL_CARD_VALUES.RED_LEVEL : LEVEL_CARD_VALUES.NORMAL
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
 * \`\`\`ts
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
 * \`\`\`
 *
 * @remarks
 * 牌型识别规则：
 * - 单张：1 张牌
 * - 对子：2 张相同点数的牌
 * - 三张：3 张相同点数的牌
 * - 顺子：5 张及以上连续点数的牌
 * - 连对：3 对及以上连续点数的对子
 * - 连三：2 个及以上连续点的三张
 * - 三带二：1 个三张 + 1 个对子（两张必须是对子）
 * - 炸弹：4 张相同点数 或 4 张王
 */
export function analyzeMove(cards: Card[], levelRank: number): Move | null {
  if (cards.length === 0) {
    return { type: 'pass', cards: [], primaryValue: 0 }
  }

  // 提前计算常用数据
  const rawVals = cards.map((c) => c.val)
  const counts = countCardValues(rawVals)
  const values = cards.map((c) => getCardValue(c, levelRank)).sort((a, b) => a - b)
  const hasJoker = cards.some((c) => c.suit === 'J')
  const hasLevel = cards.some((c) => c.val === levelRank)
  const uniqueRawValsCount = counts.uniqueValues.length

  // ========== 单张 ==========
  if (cards.length === 1) {
    return { type: 'single', cards, primaryValue: values[0] }
  }

  // ========== 对子 ==========
  if (cards.length === 2 && uniqueRawValsCount === 1) {
    // 级牌对子使用最大值（逢人配的红桃级牌）
    const primaryValue = rawVals[0] === levelRank
      ? values[values.length - 1]
      : values[0]
    return { type: 'pair', cards, primaryValue }
  }

  // ========== 三张 ==========
  if (cards.length === 3 && uniqueRawValsCount === 1) {
    // 级牌三张使用最大值（逢人配的红桃级牌）
    const primaryValue = rawVals[0] === levelRank
      ? values[values.length - 1]
      : values[0]
    return { type: 'triple', cards, primaryValue }
  }

  // ========== 炸弹检测 ==========
  // 王炸：两张大王 + 两张小王（4张王牌组合，掼蛋规则：4张王=最大炸弹）
  if (cards.length === 4 && hasJoker && cards.every(c => c.suit === 'J')) {
    return { type: 'bomb', cards, primaryValue: BOMB_VALUES.JOKER_BOMB }
  }
  
  // 级牌炸弹（优先于普通炸弹检查）
  if (cards.length >= 4 && hasLevel && uniqueRawValsCount === 1) {
    const primaryValue = BOMB_VALUES.LEVEL_BASE * cards.length + values[values.length - 1]
    return { type: 'bomb', cards, primaryValue }
  }
  
  // 普通炸弹（4张及以上相同）
  if (cards.length >= 4 && uniqueRawValsCount === 1) {
    const primaryValue = BOMB_VALUES.NORMAL_BASE * cards.length + values[values.length - 1]
    return { type: 'bomb', cards, primaryValue }
  }

  // ========== 三带二 ==========
  if (cards.length === 5) {
    const primaryValue = getFullHousePrimaryValue(counts, cards, levelRank)
    if (primaryValue !== null) {
      return { type: 'fullhouse', cards, primaryValue }
    }
  }

  // ========== 连对 ==========
  const sequencePairsMaxValue = getSequencePairsMaxValue(counts, cards.length)
  if (sequencePairsMaxValue !== null) {
    return { type: 'sequencePairs', cards, primaryValue: sequencePairsMaxValue }
  }

  // ========== 连三（飞机不带翅膀）==========
  const sequenceTriplesMaxValue = getSequenceTriplesMaxValue(counts, cards.length)
  if (sequenceTriplesMaxValue !== null) {
    return { type: 'sequenceTriples', cards, primaryValue: sequenceTriplesMaxValue }
  }

  // ========== 顺子 ==========
  if (!hasJoker && isValidStraight(counts.uniqueValues, counts.sortedValues, cards.length)) {
    // 顺子的primaryValue使用最大牌的原始值，不使用级牌特殊值
    return { 
      type: 'straight', 
      cards, 
      primaryValue: counts.sortedValues[counts.sortedValues.length - 1] 
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
 * \`\`\`ts
 * const myPair = { type: 'pair', cards: [...], primaryValue: 15 }
 * const theirPair = { type: 'pair', cards: [...], primaryValue: 14 }
 * canBeat(myPair, theirPair) // 返回 true（15 对子压 14 对子）
 *
 * const myBomb = { type: 'bomb', cards: [...], primaryValue: 50 }
 * const theirStraight = { type: 'straight', cards: [...], primaryValue: 14 }
 * canBeat(myBomb, theirStraight) // 返回 true（炸弹压顺子）
 * \`\`\`
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
