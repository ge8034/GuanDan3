import { beforeEach, describe, expect, it } from 'vitest';
import { clearPerformanceMetrics, decideMove, clearHandAnalysisCache } from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

let nextId = 1;
const c = (rank: string, val: number): Card => ({
  suit: 'H',
  rank,
  val,
  id: nextId++,
});

describe('ai.decideMove (Advanced)', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
    nextId = 1;
  });

  it('跟顺子：应能识别并压制顺子', () => {
    // Hand: 3, 4, 5, 6, 7
    const hand = [c('3', 3), c('4', 4), c('5', 5), c('6', 6), c('7', 7)];
    // Last: 3, 4, 5, 6, 7 (有效的顺子，不含2)
    const lastCards = [c('3', 3), c('4', 4), c('5', 5), c('6', 6), c('7', 7)];

    const move = decideMove(hand, lastCards, 10, 'hard', false);

    // 手牌和上家一样大，无法压制，应该pass或尝试用炸弹
    // 但我们手牌没有更大的牌或炸弹，所以应该pass
    // 实际上，这个测试需要调整，因为手牌无法压制上家
    // 让我们用更大的顺子作为上家出牌

    // Last: 2, 3, 4, 5, 6 (在级牌=2时是有效的顺子)
    const lastCardsWith2 = [
      c('2', 2),
      c('3', 3),
      c('4', 4),
      c('5', 5),
      c('6', 6),
    ];

    const move2 = decideMove(hand, lastCardsWith2, 2, 'hard', false);

    expect(move2.type).toBe('play');
    expect(move2.cards?.length).toBe(5);
    expect(
      move2.cards
        ?.map((x) => x.val)
        .slice()
        .sort((a, b) => a - b)
    ).toEqual([3, 4, 5, 6, 7]);
  });

  it('跟三带二：应能识别并压制三带二', () => {
    // Hand: 3,3,3, 4,4
    const hand = [c('3', 3), c('3', 3), c('3', 3), c('4', 4), c('4', 4)];
    // Last: 2,2,2, 3,3
    const lastCards = [c('2', 2), c('2', 2), c('2', 2), c('3', 3), c('3', 3)];

    const move = decideMove(hand, lastCards, 10, 'hard', false);

    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(5);
    expect(move.cards?.filter((x) => x.val === 3).length).toBe(3);
    expect(move.cards?.filter((x) => x.val === 4).length).toBe(2);
  });

  it('跟连对：应能识别并压制连对', () => {
    // Hand: 4,4, 5,5, 6,6
    const hand = [
      c('4', 4),
      c('4', 4),
      c('5', 5),
      c('5', 5),
      c('6', 6),
      c('6', 6),
    ];
    // Last: 3,3, 4,4, 5,5
    const lastCards = [
      c('3', 3),
      c('3', 3),
      c('4', 4),
      c('4', 4),
      c('5', 5),
      c('5', 5),
    ];

    const move = decideMove(hand, lastCards, 10, 'hard', false);

    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(6);
    expect(
      move.cards
        ?.map((x) => x.val)
        .slice()
        .sort((a, b) => a - b)
    ).toEqual([4, 4, 5, 5, 6, 6]);
  });

  it('跟飞机：应能识别并压制飞机', () => {
    const hand = [
      c('3', 3),
      c('3', 3),
      c('3', 3),
      c('4', 4),
      c('4', 4),
      c('4', 4),
      c('5', 5),
      c('5', 5),
      c('5', 5),
    ];
    const lastCards = [
      c('2', 2),
      c('2', 2),
      c('2', 2),
      c('3', 3),
      c('3', 3),
      c('3', 3),
      c('4', 4),
      c('4', 4),
      c('4', 4),
    ];

    const move = decideMove(hand, lastCards, 10, 'hard', false);

    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(9);
    expect(move.cards?.filter((x) => x.val === 5).length).toBe(3);
  });
});
