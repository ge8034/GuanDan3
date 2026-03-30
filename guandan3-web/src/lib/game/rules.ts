import { Card } from '@/lib/store/game';

export type HandType =
  | 'single'
  | 'pair'
  | 'triple'
  | 'straight'
  | 'sequencePairs'
  | 'sequenceTriples'
  | 'sequenceTriplesWithWings'
  | 'fullhouse'
  | 'bomb'
  | 'pass';

export interface Move {
  type: HandType;
  cards: Card[];
  primaryValue: number; // Used for comparison
}

// Get the effective value of a card in GuanDan
// levelRank: The rank of the current level (e.g. 2 for level 2).
// Note: In strict GuanDan, level card rank depends on suit (Heart > others).
export function getCardValue(card: Card, levelRank: number): number {
  // Jokers
  if (card.suit === 'J') {
    return card.rank === 'hr' ? 200 : 100; // Red Joker > Black Joker
  }

  // Level Card (e.g. if playing 2, then 2 is higher than A)
  // We need to know the 'val' corresponding to levelRank.
  // Assuming levelRank is 2..14 (A=14).
  // If card.val == levelRank, it is a level card.
  if (card.val === levelRank) {
    return card.suit === 'H' ? 50 : 40; // Heart Level > Other Level
  }

  // Normal Cards
  // 2 is usually lowest in standard poker, but in GuanDan 2 is level card?
  // If level is NOT 2, then 2 is smallest (unless specific rule).
  // Let's assume standard ordering: 2,3,4...A.
  // But usually A is high.
  // Let's stick to card.val for now (2..14).
  return card.val;
}

// Analyze a set of cards to determine its type
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

  // Single
  if (cards.length === 1) {
    return { type: 'single', cards, primaryValue: values[0] };
  }

  // Pair
  if (cards.length === 2 && uniqueValues.length === 1) {
    return { type: 'pair', cards, primaryValue: values[0] };
  }

  // Triple
  if (cards.length === 3 && uniqueValues.length === 1) {
    return { type: 'triple', cards, primaryValue: values[0] };
  }

  // Bomb (4+ cards of same rank)
  if (cards.length >= 4 && uniqueValues.length === 1) {
    // Bomb value depends on count (5 > 4) and rank.
    // We can use a large base for bomb count.
    // e.g. 4-bomb base 1000, 5-bomb base 2000...
    return {
      type: 'bomb',
      cards,
      primaryValue: 1000 * cards.length + values[0],
    };
  }

  // 王炸 - 四张王牌组成的炸弹，最大的炸弹
  if (cards.length === 4 && hasJoker && uniqueRanks.length >= 2) {
    // 王炸是最大的炸弹，使用特殊的高值
    return { type: 'bomb', cards, primaryValue: 10000 };
  }

  // 统计每个值的数量
  const counts: Record<number, number> = {};
  for (const v of rawVals) counts[v] = (counts[v] || 0) + 1;
  const countEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]); // 按数量降序

  // Fullhouse (三带二) - 5张牌：3张相同 + 2张相同
  if (cards.length === 5 && countEntries.length === 2) {
    const [entry1, entry2] = countEntries;
    if (entry1[1] === 3 && entry2[1] === 2) {
      // 三张的值作为主值
      const tripleValue = Number(entry1[0]);
      return { type: 'fullhouse', cards, primaryValue: tripleValue };
    }
  }

  // 四带二（炸弹变体）- 6张牌：4张相同 + 2张单牌
  if (cards.length === 6 && countEntries.length >= 2) {
    const maxCount = Math.max(...Object.values(counts));
    if (maxCount === 4) {
      // 找到四张的值作为主值
      const quadValue = Number(
        Object.keys(counts).find((k) => counts[Number(k)] === 4)
      );
      // 四带二归类为炸弹类型，但用张数区分
      return { type: 'bomb', cards, primaryValue: 1000 * 4 + quadValue };
    }
  }

  if (!hasJoker && !hasLevel) {
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

    if (cards.length >= 4 && cards.length % 2 === 0) {
      const counts: Record<number, number> = {};
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1;
      if (Object.values(counts).every((c) => c === 2)) {
        const pairVals = Object.keys(counts)
          .map((v) => Number(v))
          .sort((a, b) => a - b);
        let isSeq = true;
        for (let i = 1; i < pairVals.length; i++) {
          if (pairVals[i] !== pairVals[i - 1] + 1) {
            isSeq = false;
            break;
          }
        }
        if (isSeq) {
          return {
            type: 'sequencePairs',
            cards,
            primaryValue: pairVals[pairVals.length - 1],
          };
        }
      }
    }

    // Sequence Triples (飞机) - 2+ consecutive triples (最多6张)
    if (cards.length >= 6 && cards.length % 3 === 0) {
      const counts: Record<number, number> = {};
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1;
      const tripleVals = Object.keys(counts)
        .map((v) => Number(v))
        .filter((v) => counts[v] === 3)
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

    // 飞机带翅膀 - 连续三张 + 翅膀
    // 翅膀可以是单牌或对子
    if (cards.length >= 8) {
      const counts: Record<number, number> = {};
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1;
      const tripleVals = Object.keys(counts)
        .map((v) => Number(v))
        .filter((v) => counts[v] === 3)
        .sort((a, b) => a - b);

      // 检查是否有至少2个连续的三张
      if (tripleVals.length >= 2) {
        let isSeq = true;
        for (let i = 1; i < tripleVals.length; i++) {
          if (tripleVals[i] !== tripleVals[i - 1] + 1) {
            isSeq = false;
            break;
          }
        }

        if (isSeq) {
          const tripleCount = tripleVals.length;
          const wingCardCount = cards.length - tripleCount * 3;

          // 翅膀数量必须等于三张组数（带单牌）或2倍三张组数（带对子）
          if (
            wingCardCount === tripleCount ||
            wingCardCount === tripleCount * 2
          ) {
            return {
              type: 'sequenceTriplesWithWings',
              cards,
              primaryValue: tripleVals[tripleVals.length - 1],
            };
          }
        }
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
      // 炸弹：张数多的大，或张数相同时主值大
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
