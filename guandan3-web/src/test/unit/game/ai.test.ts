import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearPerformanceMetrics,
  decideMove,
  analyzeHand,
} from '@/lib/game/ai';
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

  it('级牌为2时，AI能识别并出对2（红桃2+黑桃2）', () => {
    // 级牌=2，红桃2(逢人配) + 黑桃2 = 有效对子
    const hand = [
      c({ id: 1, suit: 'H', rank: '2', val: 2 }), // 红桃2
      c({ id: 2, suit: 'S', rank: '2', val: 2 }), // 黑桃2
    ];

    // 先检查 analyzeHand 是否能识别对子
    const analysis = analyzeHand(hand, 2);
    expect(analysis.pairs.length).toBeGreaterThan(0);
    expect(analysis.pairs[0]).toHaveLength(2);

    const move = decideMove(hand, null, 2, 'hard', true);
    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(2);
  });

  it('级牌为2时，AI能识别三张2（可能选择对子或其他牌型）', () => {
    // 级牌=2，红桃2 + 黑桃2 + 方块2 = 有效三张
    // AI可能选择出对子、三张或单张，取决于策略
    const hand = [
      c({ id: 1, suit: 'H', rank: '2', val: 2 }), // 红桃2
      c({ id: 2, suit: 'S', rank: '2', val: 2 }), // 黑桃2
      c({ id: 3, suit: 'D', rank: '2', val: 2 }), // 方块2
    ];

    // 先检查 analyzeHand 是否能识别三张
    const analysis = analyzeHand(hand, 2);
    expect(analysis.triples.length).toBeGreaterThan(0);

    const move = decideMove(hand, null, 2, 'hard', true);
    expect(move.type).toBe('play');
    // AI可以选择出对子、三张或单张，都是合理的
    expect(move.cards!.length).toBeGreaterThanOrEqual(2);
    expect(move.cards!.length).toBeLessThanOrEqual(3);
  });

  it('级牌为2时，AI能识别四张2炸弹（可能选择其他牌型）', () => {
    // 级牌=2，四张2 = 级牌炸弹
    // AI可能选择出三张、对子等，保留炸弹
    const hand = [
      c({ id: 1, suit: 'H', rank: '2', val: 2 }), // 红桃2
      c({ id: 2, suit: 'S', rank: '2', val: 2 }), // 黑桃2
      c({ id: 3, suit: 'D', rank: '2', val: 2 }), // 方块2
      c({ id: 4, suit: 'C', rank: '2', val: 2 }), // 梅花2
    ];

    // 先检查 analyzeHand 是否能识别炸弹
    const analysis = analyzeHand(hand, 2);
    expect(analysis.bombs.length).toBeGreaterThan(0);

    const move = decideMove(hand, null, 2, 'hard', true);
    expect(move.type).toBe('play');
    // AI可以选择出三张、对子等，保留炸弹是合理的策略
    expect(move.cards!.length).toBeGreaterThanOrEqual(2);
    expect(move.cards!.length).toBeLessThanOrEqual(4);
  });

  it('级牌为A时，AI能识别并出对A（红桃A+黑桃A）', () => {
    // 级牌=A（val=14），红桃A + 黑桃A = 有效对子
    const hand = [
      c({ id: 1, suit: 'H', rank: 'A', val: 14 }), // 红桃A（级牌）
      c({ id: 2, suit: 'S', rank: 'A', val: 14 }), // 黑桃A（级牌）
    ];
    const move = decideMove(hand, null, 14, 'hard', true);
    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(2);
  });
});
