import { Card } from '@/lib/store/game';
import { HandAnalysis } from './ai-types';

// ============================================================================
// 常量定义
// ============================================================================

/** 最小顺子长度 */
const MIN_STRAIGHT_LENGTH = 5;

/** 最小连对长度 */
const MIN_SEQUENCE_PAIR_LENGTH = 3;

/** 最小飞机长度 */
const MIN_SEQUENCE_TRIPLE_LENGTH = 2;

/** 炸弹最小张数 */
const MIN_BOMB_SIZE = 4;

// ============================================================================
// 类型定义
// ============================================================================

/** 卡牌值映射表（按原始val值分组） */
type ValueMap = Map<number, Card[]>;

/** 卡牌组 */
type CardGroup = readonly Card[];

/** 组合生成器结果类型 */
type Combinations<T> = readonly T[][];

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 构建值映射表
 * 将卡牌按原始val值分组，用于后续模式识别
 *
 * @param cards - 卡牌数组
 * @returns 值映射表
 */
function buildValueMap(cards: readonly Card[]): ValueMap {
  const map = new Map<number, Card[]>();

  for (const card of cards) {
    const val = card.val;
    if (!map.has(val)) {
      map.set(val, []);
    }
    map.get(val)!.push(card);
  }

  return map;
}

/**
 * 生成组合（迭代实现，避免递归栈溢出）
 *
 * @param items - 项目数组
 * @param size - 组合大小
 * @returns 所有可能的组合
 */
function* generateCombinations<T>(
  items: readonly T[],
  size: number
): Generator<T[]> {
  if (size === 0) {
    yield [];
    return;
  }
  if (size > items.length) {
    return;
  }

  const indices = Array.from({ length: size }, (_, i) => i);

  while (true) {
    yield indices.map((i) => items[i]);

    // 找到第一个可以递增的索引
    let i = size - 1;
    while (i >= 0 && indices[i] === items.length - size + i) {
      i--;
    }

    if (i < 0) break;

    indices[i]++;
    for (let j = i + 1; j < size; j++) {
      indices[j] = indices[j - 1] + 1;
    }
  }
}

/**
 * 生成笛卡尔积（迭代实现）
 *
 * @param lists - 数组列表
 * @returns 笛卡尔积结果
 */
function* generateCartesianProduct<T>(
  lists: readonly T[][]
): Generator<T[]> {
  if (lists.length === 0) {
    yield [];
    return;
  }

  const result: T[] = [];
  const maxIndices = lists.map((list) => list.length - 1);
  const indices = new Array(lists.length).fill(0);

  while (true) {
    yield lists.flatMap((list, i) => list[indices[i]]);

    // 找到第一个可以递增的索引
    let i = lists.length - 1;
    while (i >= 0 && indices[i] >= maxIndices[i]) {
      i--;
    }

    if (i < 0) break;

    indices[i]++;
    for (let j = i + 1; j < lists.length; j++) {
      indices[j] = 0;
    }
  }
}

/**
 * 检查连续性
 *
 * @param sorted - 已排序的数值数组
 * @param expectedLength - 期望的连续长度
 * @returns 是否连续
 */
function checkConsecutive(
  sorted: readonly number[],
  expectedLength: number
): boolean {
  if (sorted.length < expectedLength) return false;
  return sorted[expectedLength - 1] - sorted[0] === expectedLength - 1;
}

// ============================================================================
// 模式识别函数
// ============================================================================

/**
 * 查找单张
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有单张组合
 */
export function findSingles(cards: Card[], _levelRank?: number): Card[][] {
  const used = new Set<number>();
  const singles: Card[][] = [];

  for (const card of cards) {
    if (!used.has(card.id)) {
      used.add(card.id);
      singles.push([card]);
    }
  }

  return singles;
}

/**
 * 查找对子
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有对子组合
 */
export function findPairs(cards: Card[], _levelRank?: number): Card[][] {
  const pairs: Card[][] = [];
  const valueMap = buildValueMap(cards);

  for (const [_, cardsWithSameValue] of valueMap) {
    if (cardsWithSameValue.length >= 2) {
      for (const combo of generateCombinations(cardsWithSameValue, 2)) {
        pairs.push([...combo]);
      }
    }
  }

  return pairs;
}

/**
 * 查找三张
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有三张组合
 */
export function findTriples(cards: Card[], _levelRank?: number): Card[][] {
  const triples: Card[][] = [];
  const valueMap = buildValueMap(cards);

  for (const [_, cardsWithSameValue] of valueMap) {
    if (cardsWithSameValue.length >= 3) {
      for (const combo of generateCombinations(cardsWithSameValue, 3)) {
        triples.push([...combo]);
      }
    }
  }

  return triples;
}

/**
 * 查找炸弹
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有炸弹组合
 */
export function findBombs(cards: Card[], _levelRank?: number): Card[][] {
  const bombs: Card[][] = [];
  const valueMap = buildValueMap(cards);

  // 普通炸弹（4张或更多相同点数）
  for (const [_, cardsWithSameValue] of valueMap) {
    if (cardsWithSameValue.length >= MIN_BOMB_SIZE) {
      for (let size = MIN_BOMB_SIZE; size <= cardsWithSameValue.length; size++) {
        for (const combo of generateCombinations(cardsWithSameValue, size)) {
          bombs.push([...combo]);
        }
      }
    }
  }

  // 王牌炸弹
  const jokers = cards.filter((c) => c.suit === 'J');
  if (jokers.length >= 2) {
    bombs.push(jokers);
  }

  return bombs;
}

/**
 * 查找顺子
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有顺子组合
 */
export function findStraights(cards: Card[], _levelRank?: number): Card[][] {
  const straights: Card[][] = [];
  const valueMap = buildValueMap(cards);

  const sortedVals = Array.from(valueMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i <= sortedVals.length - MIN_STRAIGHT_LENGTH; i++) {
    const window = sortedVals.slice(i, i + MIN_STRAIGHT_LENGTH);

    if (checkConsecutive(window, MIN_STRAIGHT_LENGTH)) {
      const lists = window
        .map((v) => valueMap.get(v))
        .filter((list): list is Card[] => list !== undefined);

      for (const combo of generateCartesianProduct(lists)) {
        straights.push([...combo]);
      }
    }
  }

  return straights;
}

/**
 * 查找三带二（葫芦）
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有三带二组合
 */
export function findFullHouses(cards: Card[], _levelRank?: number): Card[][] {
  const fullHouses: Card[][] = [];
  const valueMap = buildValueMap(cards);

  // 分离三张和对子
  const tripleEntries: Array<[number, Card[]]> = [];
  const pairEntries: Array<[number, Card[]]> = [];

  for (const [value, cardsWithSameValue] of valueMap) {
    if (cardsWithSameValue.length >= 3) {
      tripleEntries.push([value, cardsWithSameValue]);
    }
    if (cardsWithSameValue.length >= 2) {
      pairEntries.push([value, cardsWithSameValue]);
    }
  }

  // 生成所有三带二组合
  for (const [tripleValue, tripleCards] of tripleEntries) {
    for (const tripleCombo of generateCombinations(tripleCards, 3)) {
      for (const [pairValue, pairCards] of pairEntries) {
        if (pairValue !== tripleValue) {
          for (const pairCombo of generateCombinations(pairCards, 2)) {
            fullHouses.push([...tripleCombo, ...pairCombo]);
          }
        }
      }
    }
  }

  return fullHouses;
}

/**
 * 查找连对
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有连对组合
 */
export function findSequencePairs(cards: Card[], _levelRank?: number): Card[][] {
  const sequencePairs: Card[][] = [];
  const valueMap = buildValueMap(cards);

  const sortedVals = Array.from(valueMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i <= sortedVals.length - MIN_SEQUENCE_PAIR_LENGTH; i++) {
    const window = sortedVals.slice(i, i + MIN_SEQUENCE_PAIR_LENGTH);

    if (checkConsecutive(window, MIN_SEQUENCE_PAIR_LENGTH)) {
      const perValPairs = window
        .map((v) => {
          const cards = valueMap.get(v);
          return cards && cards.length >= 2
            ? Array.from(generateCombinations(cards, 2))
            : [];
        })
        .filter((combos) => combos.length > 0);

      if (perValPairs.length === MIN_SEQUENCE_PAIR_LENGTH) {
        for (const combo of generateCartesianProduct(perValPairs)) {
          sequencePairs.push(combo.flat());
        }
      }
    }
  }

  return sequencePairs;
}

/**
 * 查找飞机（连续三张）
 *
 * @param cards - 卡牌数组
 * @param _levelRank - 级牌点数（保持API兼容性，未使用）
 * @returns 所有飞机组合
 */
export function findSequenceTriples(cards: Card[], _levelRank?: number): Card[][] {
  const sequenceTriples: Card[][] = [];
  const valueMap = buildValueMap(cards);

  const sortedVals = Array.from(valueMap.keys()).sort((a, b) => a - b);

  // 查找所有连续的三张组
  for (let start = 0; start < sortedVals.length; start++) {
    const sequences: Card[][] = [];

    // 查找从start开始的连续序列
    for (let len = MIN_SEQUENCE_TRIPLE_LENGTH; len <= sortedVals.length - start; len++) {
      const window = sortedVals.slice(start, start + len);

      // 检查是否连续
      if (!checkConsecutive(window, len)) break;

      // 检查每个值是否都有至少3张牌
      const allHaveThree = window.every(
        (v) => valueMap.get(v) && valueMap.get(v)!.length >= 3
      );

      if (!allHaveThree) continue;

      // 生成这个序列的所有组合
      const perValTriples = window
        .map((v) => {
          const cards = valueMap.get(v);
          return cards ? Array.from(generateCombinations(cards, 3)) : [];
        })
        .filter((combos) => combos.length > 0);

      if (perValTriples.length === len) {
        for (const combo of generateCartesianProduct(perValTriples)) {
          sequenceTriples.push(combo.flat());
        }
      }
    }
  }

  return sequenceTriples;
}

/**
 * 分析手牌的所有可能牌型
 * 这是主要的入口函数，调用所有牌型识别函数
 *
 * @param cards - 卡牌数组
 * @returns 手牌分析结果
 */
export function analyzeHand(cards: Card[], levelRank: number): HandAnalysis {
  return {
    singles: findSingles(cards),
    pairs: findPairs(cards),
    triples: findTriples(cards),
    bombs: findBombs(cards),
    straights: findStraights(cards),
    sequencePairs: findSequencePairs(cards),
    sequenceTriples: findSequenceTriples(cards),
    fullHouses: findFullHouses(cards),
  };
}

/**
 * 查找所有可打败指定牌型的牌
 * 优化的查找函数，避免重复计算
 *
 * @param hand - 手牌
 * @param target - 目标牌型
 * @param levelRank - 级牌点数
 * @returns 可打败的牌型列表
 */
export function findBeatableMoves(
  hand: readonly Card[],
  target: readonly Card[],
  levelRank: number
): readonly Card[][] {
  const analysis = analyzeHand([...hand], levelRank);
  const targetLength = target.length;

  // 根据目标牌型筛选可能的打败牌型
  const possibleMoves: Card[][] = [];

  // 炸弹可以打败任何牌
  possibleMoves.push(...analysis.bombs);

  // 相同长度的牌型可以尝试打败
  switch (targetLength) {
    case 1:
      possibleMoves.push(...analysis.singles);
      break;
    case 2:
      possibleMoves.push(...analysis.pairs);
      break;
    case 3:
      possibleMoves.push(...analysis.triples);
      break;
    case 5:
      possibleMoves.push(...analysis.fullHouses, ...analysis.straights);
      break;
    default:
      // 长牌型
      if (targetLength >= MIN_STRAIGHT_LENGTH) {
        possibleMoves.push(...analysis.straights);
      }
      if (targetLength % 2 === 0 && targetLength >= MIN_SEQUENCE_PAIR_LENGTH * 2) {
        possibleMoves.push(...analysis.sequencePairs);
      }
      if (targetLength % 3 === 0 && targetLength >= MIN_SEQUENCE_TRIPLE_LENGTH * 3) {
        possibleMoves.push(...analysis.sequenceTriples);
      }
      break;
  }

  return possibleMoves;
}
