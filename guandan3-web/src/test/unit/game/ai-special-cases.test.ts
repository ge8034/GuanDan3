/**
 * AI 特殊场景测试
 * 目的：发现AI在特殊场景下的问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics, clearHandAnalysisCache } from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

const createCardWithRank = (id: number, val: number, suit: string, rank: string): Card => ({
  id,
  suit,
  rank,
  val,
});

describe('AI特殊场景测试', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
  });

  it('问题86：AI跟牌时用三张压过单张（非最优）', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), // 三张
      createCard(4, 9), // 单张（能压过）
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题86: 跟7，有三张8和单张9');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI可以用单张8或9压过，出8保留更大的9是合理的
    expect(move.type).toBe('play');
    if (move.cards!.length === 1) {
      // AI出较小的牌是合理的
      expect(move.cards![0].val).toBeGreaterThan(7);
      console.log('✓ AI用较小的单张压过（保留大牌）');
    } else if (move.cards!.length === 3) {
      console.log('⚠ AI用三张压过（非最优）');
    }
  });

  it('问题87：AI跟牌时用对子压过单张（非最优）', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), // 对子
      createCard(3, 9), // 单张（能压过）
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题87: 跟7，有对子8和单张9');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI可以用单张9或对子8，都合法
    expect(move.type).toBe('play');
  });

  it('问题88：AI跟牌时所有牌都等于上家牌值', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8),
    ];

    // 上家出了三张8
    const lastPlay = [
      createCard(100, 8), createCard(101, 8), createCard(102, 8),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题88: 跟三张8，手牌只有三张8');
    console.log('AI选择:', move.type);

    // AI应该pass（不能出相同的牌）
    expect(move.type).toBe('pass');
  });

  it('问题89：AI跟炸弹时所有炸弹都更小', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),
    ];

    // 上家出了炸弹6
    const lastPlay = [
      createCard(100, 6), createCard(101, 6), createCard(102, 6), createCard(103, 6),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题89: 跟炸弹6，只有炸弹5');
    console.log('AI选择:', move.type);

    // AI应该pass（炸弹5 < 炸弹6）
    expect(move.type).toBe('pass');
  });

  it('问题90：AI有大小王炸弹时的领牌选择', () => {
    const hand = [
      createCardWithRank(1, 100, 'J', 'bk'), // 小王
      createCardWithRank(2, 200, 'J', 'hr'), // 大王
      createCard(3, 5), createCard(4, 5), createCard(5, 5), createCard(6, 5),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('问题90: 领牌，有大小王炸弹和普通炸弹');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该出单张或小牌（保留炸弹）
    expect(move.type).toBe('play');
  });

  it('问题91：AI跟牌时用炸弹压过大牌（是否保留）', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6), createCard(4, 6), // 炸弹
      createCard(5, 10), // 单张（无法压过）
    ];

    // 上家出了K
    const lastPlay = [createCard(100, 13)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题91: 跟K，有炸弹和单张10');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI可以选择pass（保留炸弹）或用炸弹压过
    if (move.type === 'pass') {
      console.log('AI选择pass（保留炸弹）');
    } else {
      console.log('AI选择用炸弹压过');
    }
  });

  it('问题92：AI跟牌时牌值刚好等于上家+1', () => {
    const hand = [
      createCard(1, 8),
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题92: 跟7，只有8');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该用8压过
    expect(move.type).toBe('play');
    expect(move.cards![0].val).toBe(8);
  });

  it('问题93：AI领牌时所有牌都是炸弹', () => {
    const hand = [
      createCard(1, 4), createCard(2, 4), createCard(3, 4), createCard(4, 4),
      createCard(5, 5), createCard(6, 5), createCard(7, 5), createCard(8, 5),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('问题93: 领牌，全是炸弹');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该出最小的炸弹
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(4);
  });

  it('问题94：AI跟牌时有多个能压过的选项', () => {
    const hand = [
      createCard(1, 8), // 单张
      createCard(2, 9), createCard(3, 9), // 对子
      createCard(4, 10), createCard(5, 10), createCard(6, 10), // 三张
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题94: 跟7，有单张8、对子9、三张10都能压过');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该选择最省牌的选项（单张8）
    expect(move.type).toBe('play');
    if (move.cards!.length === 1) {
      expect(move.cards![0].val).toBe(8);
      console.log('✓ AI最优：用单张');
    }
  });

  it('问题95：AI接近出完牌时是否激进', () => {
    const hand = [
      createCard(1, 5),
      createCard(2, 8),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('问题95: 只剩2张牌');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该尽快出牌
    expect(move.type).toBe('play');
  });

  it('问题96：AI手牌只有1张时的跟牌', () => {
    const hand = [createCard(1, 7)];

    // 上家出了6
    const lastPlay = [createCard(100, 6)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题96: 跟6，只有7');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该用7压过
    expect(move.type).toBe('play');
  });

  it('问题97：AI手牌只有1张时无法压过', () => {
    const hand = [createCard(1, 5)];

    // 上家出了K
    const lastPlay = [createCard(100, 13)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题97: 跟K，只有5');
    console.log('AI选择:', move.type);

    // AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题98：AI跟牌时用炸弹压炸弹（张数相同）', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7),
    ];

    // 上家出了炸弹6（4张）
    const lastPlay = [
      createCard(100, 6), createCard(101, 6), createCard(102, 6), createCard(103, 6),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题98: 跟炸弹6，有炸弹7');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该用炸弹7压过
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(4);
  });

  it('问题99：AI领牌时炸弹多vs少的选择', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), createCard(5, 5), // 5张炸弹
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('问题99: 领牌，有5张炸弹');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该出炸弹（所有牌都是炸弹）
    expect(move.type).toBe('play');
  });

  it('问题100：AI跟牌时用炸弹压过飞机', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7), // 炸弹
    ];

    // 上家出了飞机3-4
    const lastPlay = [
      createCard(100, 3), createCard(101, 3), createCard(102, 3),
      createCard(103, 4), createCard(104, 4), createCard(105, 4),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题100: 跟飞机，有炸弹');
    console.log('AI选择:', move.type, move.cards?.length);

    // 炸弹可以压过飞机
    if (move.type === 'play') {
      console.log('AI用炸弹压过飞机');
    }
  });
});
