import { Card } from '@/lib/store/game';

export type HandType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'straight'
  | 'sequencePairs'
  | 'sequenceTriples'
  | 'fullhouse'
  | 'bomb'
  | 'pass';

export interface Move {
  type: HandType;
  cards: Card[];
  primaryValue: number; // Used for comparison
}

// Get the effective value of a card in GuanDan
// 掼蛋规则：
// 1. 大小王：红王200，黑王100
// 2. 级牌：红桃级牌60，其他级牌50（大于A=14）
// 3. 普通牌：A=14, K=13, ..., 2=2（当2不是级牌时）
export function getCardValue(card: Card, levelRank: number): number {
  // 大小王
  if (card.suit === 'J') {
    return card.rank === 'hr' ? 200 : 100;
  }

  // 级牌 - 大于A（掼蛋核心规则）
  if (card.val === levelRank) {
    // 红桃级牌逢人配，值最大
    return card.suit === 'H' ? 60 : 50;
  }

  // 普通牌：A=14, K=13, ..., 2=2
  return card.val;
}

// Analyze a set of cards to determine its type
// 掼蛋牌型识别和分析
export function analyzeMove(cards: Card[], levelRank: number): Move | null {
  if (cards.length === 0) return { type: 'pass', cards: [], primaryValue: 0 };

  const values = cards
    .map((c) => getCardValue(c, levelRank))
    .sort((a, b) => a - b);
  const uniqueValues = Array.from(new Set(values));
  const rawVals = cards.map((c) => c.val).sort((a, b) => a - b);
  const uniqueRawVals = Array.from(new Set(rawVals));
  const ranks = cards.map((c) => c.rank);
  const uniqueRanks = Array.from(new Set(ranks));
  const hasJoker = cards.some((c) => c.suit === 'J');
  const hasLevel = cards.some((c) => c.val === levelRank);

  // ========== 单张 ==========
  if (cards.length === 1) {
    return { type: 'single', cards, primaryValue: values[0] };
  }

  // ========== 对子 ==========
  // 使用原始值判断是否相同（级牌对子：红桃级牌+其他花色级牌=有效对子）
  if (cards.length === 2 && uniqueRawVals.length === 1) {
    // 级牌对子使用最大值（逢人配的红桃级牌）
    const isLevelPair = rawVals[0] === levelRank;
    const primaryValue = isLevelPair ? values[values.length - 1] : values[0];
    return { type: 'pair', cards, primaryValue };
  }

  // ========== 三张 ==========
  // 使用原始值判断是否相同
  if (cards.length === 3 && uniqueRawVals.length === 1) {
    // 级牌三张使用最大值（逢人配的红桃级牌）
    const isLevelTriple = rawVals[0] === levelRank;
    const primaryValue = isLevelTriple ? values[values.length - 1] : values[0];
    return { type: 'triple', cards, primaryValue };
  }

  // ========== 王炸检测（4张王，最大炸弹）==========
  if (cards.length === 4 && cards.every((c) => c.suit === 'J')) {
    return { type: 'bomb', cards, primaryValue: 10000 };
  }

  // ========== 统计每个值的数量 ==========
  const counts: Record<number, number> = {};
  for (const v of rawVals) counts[v] = (counts[v] || 0) + 1;
  const countEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  // ========== 炸弹（4+张相同）==========
  // 使用原始值判断是否相同（级牌炸弹：所有级牌=有效炸弹）
  if (cards.length >= 4 && uniqueRawVals.length === 1) {
    const isLevelBomb = cards.some((c) => c.val === levelRank);
    // 级牌炸弹加成：5000 * 张数 + 主值
    // 普通炸弹：1000 * 张数 + 主值
    const bombBase = isLevelBomb ? 5000 : 1000;
    // 级牌炸弹使用最大值（逢人配的红桃级牌）
    const mainValue = isLevelBomb ? values[values.length - 1] : values[0];
    return {
      type: 'bomb',
      cards,
      primaryValue: bombBase * cards.length + mainValue,
    };
  }

  // ========== 三带二（富余）- 5张牌 ==========
  if (cards.length === 5 && countEntries.length === 2) {
    const [entry1, entry2] = countEntries;
    if (entry1[1] === 3 && entry2[1] === 2) {
      return { type: 'fullhouse', cards, primaryValue: values[0] };
    }
  }

  // ========== 顺子和连对（可以含2，2是最小的；但不能含王）==========
  if (!hasJoker) {
    // 顺子（5张以上连续单牌）
    if (cards.length >= 5 && uniqueRawVals.length === cards.length) {
      let isStraight = true;
      for (let i = 1; i < rawVals.length; i++) {
        if (rawVals[i] !== rawVals[i - 1] + 1) {
          isStraight = false;
          break;
        }
      }
      if (isStraight) {
        return {
          type: 'straight',
          cards,
          primaryValue: rawVals[rawVals.length - 1],
        };
      }
    }

    // 连对（3连对以上）
    if (cards.length >= 6 && cards.length % 2 === 0) {
      const pairCounts: Record<number, number> = {};
      for (const v of rawVals) pairCounts[v] = (pairCounts[v] || 0) + 1;
      if (Object.values(pairCounts).every((c) => c === 2)) {
        const pairVals = Object.keys(pairCounts)
          .map((v) => Number(v))
          .sort((a, b) => a - b);
        let isSeq = true;
        for (let i = 1; i < pairVals.length; i++) {
          if (pairVals[i] !== pairVals[i - 1] + 1) {
            isSeq = false;
            break;
          }
        }
        if (isSeq && pairVals.length >= 3) {
          return {
            type: 'sequencePairs',
            cards,
            primaryValue: pairVals[pairVals.length - 1],
          };
        }
      }
    }
  }

  // ========== 飞机（连续三张，不带翅膀）==========
  if (cards.length >= 6 && cards.length % 3 === 0) {
    const tripleCounts: Record<number, number> = {};
    for (const v of rawVals) tripleCounts[v] = (tripleCounts[v] || 0) + 1;
    const tripleVals = Object.keys(tripleCounts)
      .map((v) => Number(v))
      .filter((v) => tripleCounts[v] === 3)
      .sort((a, b) => a - b);

    if (tripleVals.length >= 2 && tripleVals.length * 3 === cards.length) {
      let isSeq = true;
      for (let i = 1; i < tripleVals.length; i++) {
        if (tripleVals[i] !== tripleVals[i - 1] + 1) {
          isSeq = false;
          break;
        }
      }
      if (isSeq) {
        return {
          type: 'sequenceTriples',
          cards,
          primaryValue: tripleVals[tripleVals.length - 1],
        };
      }
    }
  }

  return null;
}

// Check if move A beats move B
// 掼蛋规则：
// 1. 炸弹可以压任何非炸弹牌型
// 2. 同牌型必须张数相同（炸弹除外）且主值更大
// 3. 更大的炸弹可以压更小的炸弹
export function canBeat(moveA: Move, moveB: Move): boolean {
  if (moveA.type === 'pass') return false;
  if (moveB.type === 'pass') return true;

  // 炸弹压非炸弹
  if (moveA.type === 'bomb' && moveB.type !== 'bomb') return true;
  if (moveA.type !== 'bomb' && moveB.type === 'bomb') return false;

  // 同牌型比较
  if (moveA.type === moveB.type) {
    if (moveA.type === 'bomb') {
      // 炸弹：直接比较primaryValue
      return moveA.primaryValue > moveB.primaryValue;
    }
    // 非炸弹：必须张数相同且主值更大
    return (
      moveA.cards.length === moveB.cards.length &&
      moveA.primaryValue > moveB.primaryValue
    );
  }

  return false;
}

// Analyze a set of cards to determine its type (alias for analyzeMove)
export function analyze(cards: Card[], levelRank: number): Move | null {
  return analyzeMove(cards, levelRank);
}
