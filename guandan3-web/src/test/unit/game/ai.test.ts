import { beforeEach, describe, expect, it } from 'vitest';
import { clearPerformanceMetrics, decideMove } from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

const c = (card: Partial<Card>): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...card,
});

describe('ai.decideMove', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  it('空手牌返回pass', () => {
    expect(decideMove([], null, 2, 'medium', true)).toEqual({ type: 'pass' });
  });

  it('领牌且仅一张牌时必出该牌', () => {
    const hand = [c({ id: 2, suit: 'D', rank: '3', val: 3 })];
    const move = decideMove(hand, null, 2, 'hard', true);
    expect(move.type).toBe('play');
    expect(move.cards?.map((x) => x.id)).toEqual([2]);
  });

  it('跟单张时选择能压过的最小单张', () => {
    const hand = [
      c({ id: 1, suit: 'D', rank: '4', val: 4 }),
      c({ id: 2, suit: 'S', rank: '9', val: 9 }),
    ];
    const move = decideMove(
      hand,
      [c({ id: 3, suit: 'C', rank: '5', val: 5 })],
      2,
      'hard',
      false
    );
    expect(move.type).toBe('play');
    expect(move.cards?.map((x) => x.id)).toEqual([2]);
  });

  it('无法跟牌时优先用炸弹压制非炸弹', () => {
    const hand = [
      c({ id: 1, suit: 'S', rank: '7', val: 7 }),
      c({ id: 2, suit: 'D', rank: '7', val: 7 }),
      c({ id: 3, suit: 'C', rank: '7', val: 7 }),
      c({ id: 4, suit: 'H', rank: '7', val: 7 }),
    ];
    const move = decideMove(
      hand,
      [c({ id: 9, suit: 'C', rank: 'A', val: 14 })],
      2,
      'hard',
      false
    );
    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(4);
  });

  it('跟炸弹时可用更大张数的炸弹压制', () => {
    const hand = [
      c({ id: 1, suit: 'S', rank: '8', val: 8 }),
      c({ id: 2, suit: 'D', rank: '8', val: 8 }),
      c({ id: 3, suit: 'C', rank: '8', val: 8 }),
      c({ id: 4, suit: 'H', rank: '8', val: 8 }),
      c({ id: 5, suit: 'S', rank: '8', val: 8 }),
    ];
    const move = decideMove(
      hand,
      [
        c({ id: 9, suit: 'S', rank: '7', val: 7 }),
        c({ id: 10, suit: 'D', rank: '7', val: 7 }),
        c({ id: 11, suit: 'C', rank: '7', val: 7 }),
        c({ id: 12, suit: 'H', rank: '7', val: 7 }),
      ],
      2,
      'hard',
      false
    );
    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(5);
  });

  it('跟对子时选择能压过的最小对子，否则pass', () => {
    const hand = [
      c({ id: 1, suit: 'S', rank: '6', val: 6 }),
      c({ id: 2, suit: 'D', rank: '6', val: 6 }),
    ];
    const ok = decideMove(
      hand,
      [
        c({ id: 9, suit: 'S', rank: '5', val: 5 }),
        c({ id: 10, suit: 'D', rank: '5', val: 5 }),
      ],
      2,
      'hard',
      false
    );
    expect(ok.type).toBe('play');
    expect(ok.cards?.length).toBe(2);

    const no = decideMove(
      hand,
      [
        c({ id: 11, suit: 'S', rank: '7', val: 7 }),
        c({ id: 12, suit: 'D', rank: '7', val: 7 }),
      ],
      2,
      'hard',
      false
    );
    expect(no.type).toBe('pass');
  });

  it('跟三张时选择能压过的最小三张，否则pass', () => {
    const hand = [
      c({ id: 1, suit: 'S', rank: '6', val: 6 }),
      c({ id: 2, suit: 'D', rank: '6', val: 6 }),
      c({ id: 3, suit: 'C', rank: '6', val: 6 }),
    ];
    const ok = decideMove(
      hand,
      [
        c({ id: 9, suit: 'S', rank: '5', val: 5 }),
        c({ id: 10, suit: 'D', rank: '5', val: 5 }),
        c({ id: 11, suit: 'C', rank: '5', val: 5 }),
      ],
      2,
      'hard',
      false
    );
    expect(ok.type).toBe('play');
    expect(ok.cards?.length).toBe(3);

    const no = decideMove(
      hand,
      [
        c({ id: 12, suit: 'S', rank: '7', val: 7 }),
        c({ id: 13, suit: 'D', rank: '7', val: 7 }),
        c({ id: 14, suit: 'C', rank: '7', val: 7 }),
      ],
      2,
      'hard',
      false
    );
    expect(no.type).toBe('pass');
  });

  it('跟炸弹时同张数可比较点数，否则pass', () => {
    const hand = [
      c({ id: 1, suit: 'S', rank: '9', val: 9 }),
      c({ id: 2, suit: 'D', rank: '9', val: 9 }),
      c({ id: 3, suit: 'C', rank: '9', val: 9 }),
      c({ id: 4, suit: 'H', rank: '9', val: 9 }),
    ];
    const ok = decideMove(
      hand,
      [
        c({ id: 9, suit: 'S', rank: '8', val: 8 }),
        c({ id: 10, suit: 'D', rank: '8', val: 8 }),
        c({ id: 11, suit: 'C', rank: '8', val: 8 }),
        c({ id: 12, suit: 'H', rank: '8', val: 8 }),
      ],
      2,
      'hard',
      false
    );
    expect(ok.type).toBe('play');
    expect(ok.cards?.length).toBe(4);

    const no = decideMove(
      hand,
      [
        c({ id: 13, suit: 'S', rank: '10', val: 10 }),
        c({ id: 14, suit: 'D', rank: '10', val: 10 }),
        c({ id: 15, suit: 'C', rank: '10', val: 10 }),
        c({ id: 16, suit: 'H', rank: '10', val: 10 }),
      ],
      2,
      'hard',
      false
    );
    expect(no.type).toBe('pass');
  });

  it('包含大小王时可正常出牌', () => {
    const hand = [c({ id: 1, suit: 'J', rank: 'hr', val: 0 })];
    const move = decideMove(hand, null, 2, 'hard', true);
    expect(move.type).toBe('play');
    expect(move.cards?.[0].suit).toBe('J');
  });

  it('包含级牌时可正常出牌', () => {
    const hand = [c({ id: 1, suit: 'H', rank: '2', val: 2 })];
    const move = decideMove(hand, null, 2, 'hard', true);
    expect(move.type).toBe('play');
    expect(move.cards?.[0].val).toBe(2);
  });
});
