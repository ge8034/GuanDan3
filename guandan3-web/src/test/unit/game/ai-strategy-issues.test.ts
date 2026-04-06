/**
 * AI策略问题测试
 * 目的：寻找AI策略层面的潜在问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics } from '@/lib/game/ai';
import { analyzeHand } from '@/lib/game/ai-pattern-recognition';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI策略问题检查', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  it('策略1：AI不应该用炸弹压过小牌', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹5
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('策略1: 跟7，只有炸弹5');
    console.log('AI选择:', move.type);

    // AI应该pass（保留炸弹）
    // 但如果AI选择用炸弹压过，这不是最优策略
    if (move.type === 'play') {
      console.log('⚠ 问题：AI用炸弹压过小牌（应保留炸弹）');
    } else {
      console.log('✓ AI选择pass（保留炸弹）');
    }
  });

  it('策略2：AI应该优先出小牌而不是大牌', () => {
    const hand = [
      createCard(1, 14), // A（大牌）
      createCard(2, 6), // 6（小牌）
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('策略2: 领牌，有A和6');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该出6（保留A）
    if (move.type === 'play' && move.cards && move.cards[0].val === 6) {
      console.log('✓ AI出小牌');
    } else if (move.type === 'play' && move.cards && move.cards[0].val === 14) {
      console.log('⚠ 问题：AI出大牌而非小牌');
    }
  });

  it('策略3：AI应该优先出多张牌而非单张', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), // 对子
      createCard(3, 6), // 单张
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('策略3: 领牌，有对子和单张');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该出对子（多张牌）
    if (move.type === 'play' && move.cards && move.cards.length === 2) {
      console.log('✓ AI出对子');
    } else if (move.type === 'play' && move.cards && move.cards.length === 1) {
      console.log('⚠ 问题：AI出单张而非对子');
    }
  });

  it('策略4：AI接近出完时应该激进', () => {
    const hand = [
      createCard(1, 10),
      createCard(2, 11),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('策略4: 领牌，只剩2张');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该尽快出牌
    expect(move.type).toBe('play');
  });

  it('策略5：AI跟牌时用最小能压过的牌', () => {
    const hand = [
      createCard(1, 8), // 能压过
      createCard(2, 9), createCard(3, 9), // 对子9（能压过）
      createCard(4, 10), createCard(5, 10), createCard(6, 10), // 三张10（能压过）
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('策略5: 跟7，有单张8、对子9、三张10');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该选择最省牌的选项（单张8）
    if (move.type === 'play' && move.cards && move.cards.length === 1) {
      console.log('✓ AI用单张');
    } else {
      console.log('⚠ 问题：AI没有选择最省牌的选项');
    }
  });

  it('策略6：AI应该避免拆炸弹', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7), // 炸弹7
      createCard(5, 8), // 单张
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('策略6: 领牌，有炸弹和单张');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该出单张（不拆炸弹）
    if (move.type === 'play' && move.cards && move.cards.length === 1) {
      console.log('✓ AI不拆炸弹');
    } else if (move.type === 'play' && move.cards && move.cards.length === 4) {
      console.log('⚠ 问题：AI拆炸弹领出（应保留）');
    }
  });

  it('策略7：AI跟牌时如果必须拆炸弹，考虑是否值得', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8), // 炸弹8
    ];

    // 上家出了K
    const lastPlay = [createCard(100, 13)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('策略7: 跟K，只有炸弹8');
    console.log('AI选择:', move.type);

    // AI可以选择pass或用炸弹压过
    // 这取决于AI的策略设定
    if (move.type === 'pass') {
      console.log('AI选择pass（保守策略）');
    } else {
      console.log('AI选择用炸弹压过（激进策略）');
    }
  });

  it('策略8：AI领牌时应该出对子而非三张', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6), // 三张
      createCard(4, 7), createCard(5, 7), // 对子
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('策略8: 领牌，有三张和对子');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI可能出三张（因为+80加分）
    if (move.type === 'play' && move.cards && move.cards.length === 3) {
      console.log('AI出三张（高加分策略）');
    } else if (move.type === 'play' && move.cards && move.cards.length === 2) {
      console.log('AI出对子（保守策略）');
    }
  });

  it('策略9：AI应该避免用大牌压过小牌', () => {
    const hand = [
      createCard(1, 14), // A
      createCard(2, 8), // 8
    ];

    // 上家出了7
    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('策略9: 跟7，有A和8');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该用8压过（保留A）
    if (move.type === 'play' && move.cards && move.cards[0].val === 8) {
      console.log('✓ AI用较小的牌压过');
    } else if (move.type === 'play' && move.cards && move.cards[0].val === 14) {
      console.log('⚠ 问题：AI用大牌压过小牌');
    }
  });

  it('策略10：AI应该根据对手手牌调整策略', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹
      createCard(5, 10), // 单张
    ];

    // 上家出了K
    const lastPlay = [createCard(100, 13)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('策略10: 跟K，有炸弹和单张10');
    console.log('AI选择:', move.type);

    // 如果对手手牌少，AI应该考虑用炸弹压过
    // 如果对手手牌多，AI应该保留炸弹
    if (move.type === 'pass') {
      console.log('AI选择pass（保留炸弹）');
    } else {
      console.log('AI选择出牌');
    }
  });
});
