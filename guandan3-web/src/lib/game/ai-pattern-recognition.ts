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

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
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

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
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

  cards.forEach((card) => {
    if (card.suit !== 'J') {
      const value = getCardValue(card, levelRank);
      if (!valueMap.has(value)) {
        valueMap.set(value, []);
      }
      valueMap.get(value)!.push(card);
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
  const valueMap = new Map<number, Card[]>();

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
  });

  const sortedValues = Array.from(valueMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedValues.length - 4; i++) {
    const straightValues = sortedValues.slice(i, i + 5);
    if (straightValues[4] - straightValues[0] === 4) {
      const lists = straightValues.map((v) => valueMap.get(v)!).filter(Boolean);
      const combinations = generateCartesianProduct(lists);
      straights.push(...combinations);
    }
  }

  return straights;
}

export function findFullHouses(cards: Card[], levelRank: number): Card[][] {
  const fullHouses: Card[][] = [];
  const valueMap = new Map<number, Card[]>();

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
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
  const valueMap = new Map<number, Card[]>();

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
  });

  const sortedValues = Array.from(valueMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedValues.length - 2; i++) {
    const sequenceValues = sortedValues.slice(i, i + 3);
    if (sequenceValues[2] - sequenceValues[0] === 2) {
      const perValuePairs = sequenceValues.map((v) =>
        generateCombinations(valueMap.get(v) || [], 2)
      );
      if (perValuePairs.some((x) => x.length === 0)) continue;
      const combinations = generateCartesianProduct(perValuePairs);
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
  const valueMap = new Map<number, Card[]>();

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
  });

  const sortedValues = Array.from(valueMap.keys()).sort((a, b) => a - b);

  for (let i = 0; i < sortedValues.length - 2; i++) {
    const sequenceValues = sortedValues.slice(i, i + 3);
    if (sequenceValues[2] - sequenceValues[0] === 2) {
      const perValueTriples = sequenceValues.map((v) =>
        generateCombinations(valueMap.get(v) || [], 3)
      );
      if (perValueTriples.some((x) => x.length === 0)) continue;
      const combinations = generateCartesianProduct(perValueTriples);
      sequenceTriples.push(...combinations.map((group) => group.flat()));
    }
  }

  return sequenceTriples;
}

export function findQuadWithTwo(cards: Card[], levelRank: number): Card[][] {
  const quadsWithTwo: Card[][] = [];
  const valueMap = new Map<number, Card[]>();

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
  });

  const quads = Array.from(valueMap.entries())
    .filter(([_, cards]) => cards.length >= 4)
    .map(([value, cards]) => ({ value, cards }));

  quads.forEach((quad) => {
    const remainingCards = cards.filter(
      (card) => getCardValue(card, levelRank) !== quad.value
    );

    const wingCombinations = generateCombinations(remainingCards, 2);
    const quadCombinations = generateCombinations(quad.cards, 4);

    quadCombinations.forEach((quadCombo) => {
      wingCombinations.forEach((wingCombo) => {
        quadsWithTwo.push([...quadCombo, ...wingCombo]);
      });
    });
  });

  return quadsWithTwo;
}

export function findSequenceTriplesWithWings(
  cards: Card[],
  levelRank: number
): Card[][] {
  const results: Card[][] = [];
  const valueMap = new Map<number, Card[]>();

  cards.forEach((card) => {
    const value = getCardValue(card, levelRank);
    if (!valueMap.has(value)) {
      valueMap.set(value, []);
    }
    valueMap.get(value)!.push(card);
  });

  const sortedValues = Array.from(valueMap.keys()).sort((a, b) => a - b);

  // 查找至少2组连续的三张
  for (let i = 0; i < sortedValues.length - 1; i++) {
    for (let j = i + 1; j < sortedValues.length; j++) {
      // 检查是否连续
      if (sortedValues[j] - sortedValues[i] !== j - i) continue;

      // 检查每个值是否至少有3张牌
      const tripleValues = sortedValues.slice(i, j + 1);
      const allHaveTriples = tripleValues.every(
        (v) => valueMap.has(v) && (valueMap.get(v) || []).length >= 3
      );

      if (!allHaveTriples) continue;

      // 生成所有三张组合
      const tripleGroups = tripleValues.map((v) =>
        generateCombinations(valueMap.get(v) || [], 3)
      );
      const tripleCombos = generateCartesianProduct(tripleGroups).map((group) =>
        group.flat()
      );

      // 生成翅膀（单牌或对子）
      const usedCardIds = new Set<number>();
      tripleCombos.forEach((combo) =>
        combo.forEach((c) => usedCardIds.add(c.id))
      );

      const remainingCards = cards.filter((c) => !usedCardIds.has(c.id));

      // 带单牌翅膀 - 翅膀数量等于三张组数
      if (remainingCards.length >= tripleValues.length) {
        const wingCombos = generateCombinations(
          remainingCards,
          tripleValues.length
        );
        wingCombos.forEach((wing) => {
          tripleCombos.forEach((triple) => {
            results.push([...triple, ...wing]);
          });
        });
      }

      // 带对子翅膀 - 翅膀数量等于三张组数 * 2
      if (remainingCards.length >= tripleValues.length * 2) {
        const wingCombos = generateCombinations(
          remainingCards,
          tripleValues.length * 2
        );
        wingCombos.forEach((wing) => {
          tripleCombos.forEach((triple) => {
            results.push([...triple, ...wing]);
          });
        });
      }
    }
  }

  return results;
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
    quadWithTwo: findQuadWithTwo(cards, levelRank),
    sequenceTriplesWithWings: findSequenceTriplesWithWings(cards, levelRank),
  };
}
