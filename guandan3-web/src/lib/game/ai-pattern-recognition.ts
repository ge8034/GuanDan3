import { Card } from '@/lib/store/game';
import { getCardValue } from './rules';
import { HandAnalysis } from './ai-types';

export function findSingles(cards: Card[], levelRank: number): Card[][] {
  const singles: Card[][] = [];
  const used = new Set<number>();

  cards.forEach((card) => {
    if (!used.has(card.id)) {
      used.add(card.id);
      singles.push([card]);
    }
  });

  return singles;
}

export function findPairs(cards: Card[], levelRank: number): Card[][] {
  const pairs: Card[][] = [];
  const valueMap = new Map<number, Card[]>();

  // 使用原始 val 值分组（级牌对子：红桃级牌+其他花色级牌=有效对子）
  cards.forEach((card) => {
    const val = card.val;
    if (!valueMap.has(val)) {
      valueMap.set(val, []);
    }
    valueMap.get(val)!.push(card);
  });

  valueMap.forEach((cardsWithSameValue) => {
    for (let i = 0; i < cardsWithSameValue.length - 1; i++) {
      for (let j = i + 1; j < cardsWithSameValue.length; j++) {
        pairs.push([cardsWithSameValue[i], cardsWithSameValue[j]]);
      }
    }
  });

  return pairs;
}

export function findTriples(cards: Card[], levelRank: number): Card[][] {
  const triples: Card[][] = [];
  const valueMap = new Map<number, Card[]>();

  // 使用原始 val 值分组（级牌三张：红桃级牌+其他两张级牌=有效三张）
  cards.forEach((card) => {
    const val = card.val;
    if (!valueMap.has(val)) {
      valueMap.set(val, []);
    }
    valueMap.get(val)!.push(card);
  });

  valueMap.forEach((cardsWithSameValue) => {
    if (cardsWithSameValue.length >= 3) {
      for (let i = 0; i < cardsWithSameValue.length - 2; i++) {
        for (let j = i + 1; j < cardsWithSameValue.length - 1; j++) {
          for (let k = j + 1; k < cardsWithSameValue.length; k++) {
            triples.push([
              cardsWithSameValue[i],
              cardsWithSameValue[j],
              cardsWithSameValue[k],
            ]);
          }
        }
      }
    }
  });

  return triples;
}

export function findBombs(cards: Card[], levelRank: number): Card[][] {
  const bombs: Card[][] = [];
  const valueMap = new Map<number, Card[]>();
  const jokers = cards.filter((c) => c.suit === 'J');

  // 使用原始 val 值分组（级牌炸弹：所有级牌=有效炸弹）
  cards.forEach((card) => {
    if (card.suit !== 'J') {
      const val = card.val;
      if (!valueMap.has(val)) {
        valueMap.set(val, []);
      }
      valueMap.get(val)!.push(card);
    }
  });

  valueMap.forEach((cardsWithSameValue) => {
    if (cardsWithSameValue.length >= 4) {
      for (let size = 4; size <= cardsWithSameValue.length; size++) {
        bombs.push(...generateCombinations(cardsWithSameValue, size));
      }
    }
  });

  if (jokers.length >= 2) {
    bombs.push(jokers);
  }

  return bombs;
}

export function findStraights(cards: Card[], levelRank: number): Card[][] {
  const straights: Card[][] = [];
  const valMap = new Map<number, Card[]>();

  // 使用原始 val 建立映射（顺子连续性基于原始值）
  cards.forEach((card) => {
    const val = card.val;
    if (!valMap.has(val)) {
      valMap.set(val, []);
    }
    valMap.get(val)!.push(card);
  });

  const sortedVals = Array.from(valMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedVals.length - 4; i++) {
    const straightVals = sortedVals.slice(i, i + 5);
    if (straightVals[4] - straightVals[0] === 4) {
      const lists = straightVals.map((v) => valMap.get(v)!).filter(Boolean);
      const combinations = generateCartesianProduct(lists);
      straights.push(...combinations);
    }
  }

  return straights;
}

export function findFullHouses(cards: Card[], levelRank: number): Card[][] {
  const fullHouses: Card[][] = [];
  const valueMap = new Map<number, Card[]>();

  // 使用原始 val 值分组（三带二）
  cards.forEach((card) => {
    const val = card.val;
    if (!valueMap.has(val)) {
      valueMap.set(val, []);
    }
    valueMap.get(val)!.push(card);
  });

  const triples = Array.from(valueMap.entries())
    .filter(([_, cards]) => cards.length >= 3)
    .map(([value, cards]) => ({ value, cards }));

  const pairs = Array.from(valueMap.entries())
    .filter(([_, cards]) => cards.length >= 2)
    .map(([value, cards]) => ({ value, cards }));

  triples.forEach((triple) => {
    pairs.forEach((pair) => {
      if (triple.value !== pair.value) {
        const tripleCombinations = generateCombinations(triple.cards, 3);
        const pairCombinations = generateCombinations(pair.cards, 2);

        tripleCombinations.forEach((tripleCombo) => {
          pairCombinations.forEach((pairCombo) => {
            fullHouses.push([...tripleCombo, ...pairCombo]);
          });
        });
      }
    });
  });

  return fullHouses;
}

export function findSequencePairs(cards: Card[], levelRank: number): Card[][] {
  const sequencePairs: Card[][] = [];
  const valMap = new Map<number, Card[]>();

  // 使用原始 val 建立映射（连对连续性基于原始值）
  cards.forEach((card) => {
    const val = card.val;
    if (!valMap.has(val)) {
      valMap.set(val, []);
    }
    valMap.get(val)!.push(card);
  });

  const sortedVals = Array.from(valMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedVals.length - 2; i++) {
    const sequenceVals = sortedVals.slice(i, i + 3);
    if (sequenceVals[2] - sequenceVals[0] === 2) {
      const perValPairs = sequenceVals.map((v) =>
        generateCombinations(valMap.get(v) || [], 2)
      );
      if (perValPairs.some((x) => x.length === 0)) continue;
      const combinations = generateCartesianProduct(perValPairs);
      sequencePairs.push(...combinations.map((group) => group.flat()));
    }
  }

  return sequencePairs;
}

export function findSequenceTriples(
  cards: Card[],
  levelRank: number
): Card[][] {
  const sequenceTriples: Card[][] = [];
  const valMap = new Map<number, Card[]>();

  // 使用原始 val 建立映射（飞机连续性基于原始值）
  cards.forEach((card) => {
    const val = card.val;
    if (!valMap.has(val)) {
      valMap.set(val, []);
    }
    valMap.get(val)!.push(card);
  });

  const sortedVals = Array.from(valMap.keys()).sort((a, b) => a - b);

  // 飞机需要至少2个连续的三张
  for (let i = 0; i < sortedVals.length - 1; i++) {
    // 检查当前值和下一个值是否连续（相差1）
    if (sortedVals[i + 1] - sortedVals[i] === 1) {
      // 检查两个值是否都至少有3张牌
      if (valMap.get(sortedVals[i])!.length >= 3 &&
          valMap.get(sortedVals[i + 1])!.length >= 3) {
        // 生成这两个连续三张的组合
        const perValTriples = [
          generateCombinations(valMap.get(sortedVals[i]) || [], 3),
          generateCombinations(valMap.get(sortedVals[i + 1]) || [], 3),
        ];
        if (perValTriples.some((x) => x.length === 0)) continue;
        const combinations = generateCartesianProduct(perValTriples);
        sequenceTriples.push(...combinations.map((group) => group.flat()));
      }
    }

    // 如果有3个连续的值，也可以生成3连的飞机
    if (i + 2 < sortedVals.length &&
        sortedVals[i + 2] - sortedVals[i] === 2) {
      const sequenceVals = sortedVals.slice(i, i + 3);
      // 检查每个值是否都至少有3张牌
      const allHaveThree = sequenceVals.every(v =>
        valMap.get(v) && valMap.get(v)!.length >= 3
      );
      if (allHaveThree) {
        const perValTriples = sequenceVals.map((v) =>
          generateCombinations(valMap.get(v) || [], 3)
        );
        if (perValTriples.some((x) => x.length === 0)) continue;
        const combinations = generateCartesianProduct(perValTriples);
        sequenceTriples.push(...combinations.map((group) => group.flat()));
      }
    }
  }

  return sequenceTriples;
}

function generateCombinations<T>(items: T[], size: number): T[][] {
  if (size === 0) return [[]];
  if (size > items.length) return [];

  const result: T[][] = [];

  function combine(start: number, combo: T[]) {
    if (combo.length === size) {
      result.push([...combo]);
      return;
    }

    for (let i = start; i < items.length; i++) {
      combo.push(items[i]);
      combine(i + 1, combo);
      combo.pop();
    }
  }

  combine(0, []);
  return result;
}

function generateCartesianProduct<T>(lists: T[][]): T[][] {
  if (lists.length === 0) return [[]];
  return lists.reduce<T[][]>(
    (acc, list) => acc.flatMap((a) => list.map((item) => [...a, item])),
    [[]]
  );
}

export function analyzeHand(cards: Card[], levelRank: number): HandAnalysis {
  return {
    singles: findSingles(cards, levelRank),
    pairs: findPairs(cards, levelRank),
    triples: findTriples(cards, levelRank),
    bombs: findBombs(cards, levelRank),
    straights: findStraights(cards, levelRank),
    sequencePairs: findSequencePairs(cards, levelRank),
    sequenceTriples: findSequenceTriples(cards, levelRank),
    fullHouses: findFullHouses(cards, levelRank),
  };
}
