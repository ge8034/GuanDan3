/**
 * AI 深度问题搜索 Part 3
 *
 * 继续寻找更多AI问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics } from '@/lib/game/ai';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import { evaluateMove } from '@/lib/game/ai-strategy';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI深度问题搜索 Part 3', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  /**
   * 问题BA：级牌炸弹 vs 级牌对子的优先级
   */
  it('问题BA：领牌时级牌炸弹vs级牌对子', () => {
    const hand = [
      createCard(1, 2, 'S'), createCard(2, 2, 'H'), createCard(3, 2, 'C'), createCard(4, 2, 'D'),  // 级牌炸弹2
      createCard(5, 10), createCard(6, 10),  // 普通对子10
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题BA：级牌炸弹vs普通对子 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 应该出普通对子而不是级牌炸弹
    if (move.cards!.length === 2) {
      console.log('✓ 正确：出对子，保留炸弹');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题BA：出炸弹，应该保留炸弹');
    }
  });

  /**
   * 问题BB：AI跟牌时，有级牌炸弹和普通炸弹的选择
   */
  it('问题BB：跟炸弹时级牌炸弹vs普通炸弹', () => {
    const hand = [
      createCard(1, 2, 'S'), createCard(2, 2, 'H'), createCard(3, 2, 'C'), createCard(4, 2, 'D'),  // 级牌炸弹2
      createCard(5, 8), createCard(6, 8), createCard(7, 8), createCard(8, 8),  // 普通炸弹8
    ];

    const lastPlay = [
      createCard(100, 5), createCard(101, 5), createCard(102, 5), createCard(103, 5),  // 炸弹5
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题BB：跟炸弹时级牌炸弹vs普通炸弹 ===');
    console.log('AI选择:', move.cards?.map(c => c.val));

    // 级牌炸弹2能压过炸弹5，普通炸弹8也能压过
    // 应该用最小的能压过的炸弹（普通炸弹8）
    // 但级牌炸弹2虽然值小，但因为是级牌炸弹所以主值更高(20060)
    if (move.cards && move.cards[0].val === 2) {
      console.log('✓ 用级牌炸弹2压过（级牌炸弹 > 普通炸弹）');
    } else if (move.cards && move.cards[0].val === 8) {
      console.log('⚠️ 问题BB：用普通炸弹8，级牌炸弹2更强');
    }
  });

  /**
   * 问题BC：AI有大小王炸弹时的选择
   */
  it('问题BC：有大小王炸弹时的选择', () => {
    const hand = [
      createCard(1, 100, 'J'), createCard(2, 200, 'J'),  // 大小王炸弹（最大）
      createCard(3, 7), createCard(4, 7), createCard(5, 7), createCard(6, 7),  // 炸弹7
    ];

    const lastPlay = [
      createCard(100, 5), createCard(101, 5), createCard(102, 5), createCard(103, 5),  // 炸弹5
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题BC：有大小王炸弹时的选择 ===');
    console.log('AI选择:', move.cards?.map(c => `val=${c.val},suit=${c.suit}`));

    // 应该用最小的能压过的炸弹（炸弹7）
    // 大小王炸弹是最大的，应该保留到最后
    if (move.cards && move.cards.some(c => c.suit === 'J')) {
      console.log('⚠️ 问题BC：用大小王炸弹，应该保留');
    } else if (move.cards && move.cards[0].val === 7) {
      console.log('✓ 正确：用小炸弹，保留大小王');
    }
  });

  /**
   * 问题BD：AI领牌时，有三带二和三张的选择
   */
  it('问题BD：有三带二时的选择', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5),  // 三张5
      createCard(4, 6), createCard(5, 6),  // 对子6
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题BD：有三带二时的选择 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 应该出三带二（5张）而不是三张（3张）
    if (move.cards && move.cards.length === 5) {
      console.log('✓ 正确：出三带二，快速出牌');
    } else if (move.cards && move.cards.length === 3) {
      console.log('⚠️ 问题BD：出三张，应该出三带二');
    }
  });

  /**
   * 问题BE：AI跟牌时，有三带二能压过的选择
   */
  it('问题BE：跟牌时三带二的选择', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7),  // 三张7
      createCard(4, 5), createCard(5, 5),  // 对子5
    ];

    const lastPlay = [
      createCard(100, 3), createCard(101, 3), createCard(102, 3),  // 上家出三张3
      createCard(103, 5), createCard(104, 5),  // 上家带对子5
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题BE：跟牌时三带二 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 上家出三带二(3+5)，我们有三张7+对子5
    // 需要用三张7压三张3，对子5和对子5相同
    // 应该能出三带二(7+5)压过
    if (move.type === 'play' && move.cards!.length === 5) {
      console.log('✓ 正确：出三带二压过');
    } else if (move.type === 'pass') {
      console.log('⚠️ 问题BE：Pass，但有三带二能压过');
    }
  });

  /**
   * 问题BF：AI领牌时，有飞机和普通牌型的选择
   */
  it('问题BF：有飞机时的选择', () => {
    const hand = [
      createCard(1, 3), createCard(2, 3), createCard(3, 3),
      createCard(4, 4), createCard(5, 4), createCard(6, 4),  // 飞机3344
      createCard(7, 10),  // 单张10
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题BF：有飞机时的选择 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 应该优先出飞机（6张）而不是单张
    if (move.cards && move.cards.length >= 6) {
      console.log('✓ 正确：出飞机，快速出牌');
    } else {
      console.log('⚠️ 问题BF：出其他牌型，应该出飞机');
    }
  });

  /**
   * 问题BG：AI跟牌时，所有牌都相同值的选择
   */
  it('问题BG：所有牌都相同值时的选择', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7),  // 炸弹7
    ];

    // 上家出单张6
    const lastPlay = [createCard(100, 6)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题BG：所有牌都相同值 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 手牌只有炸弹7，可以选择：
    // 1. 出炸弹压过（获取控制权）
    // 2. Pass（保留炸弹，但失去控制权）
    // 两种选择都有道理，取决于策略
    if (move.type === 'play') {
      console.log('AI选择出炸弹（获取控制权）');
    } else {
      console.log('AI选择Pass（保留炸弹）');
    }
  });

  /**
   * 问题BH：AI领牌时，剩余2张是单张时的选择
   */
  it('问题BH：剩余2张是单张时的选择', () => {
    const hand = [
      createCard(1, 5), createCard(2, 8),  // 两张单张
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题BH：剩余2张是单张 ===');
    console.log('AI选择:', move.cards?.map(c => c.val));

    // 应该出最小的单张（5）
    expect(move.cards![0].val).toBe(5);
    console.log('✓ 正确：出小单张');
  });

  /**
   * 问题BI：AI跟牌时，有炸弹和Pass的权衡
   */
  it('问题BI：炸弹vs Pass的评分权衡', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6), createCard(4, 6),  // 炸弹6
    ];

    const lastPlay = [createCard(100, 5)];  // 上家出小单张5

    const bombMove = { type: 'play' as const, cards: hand };
    const passMove = { type: 'pass' as const };

    const bombEval = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);
    const passEval = evaluateMove(passMove, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题BI：炸弹vs Pass评分 ===');
    console.log('炸弹评分:', bombEval.score);
    console.log('Pass评分:', passEval.score);

    // 炸弹应该被扣分（压小牌保留炸弹）
    if (bombEval.score === 0) {
      console.log('✓ 炸弹评分被扣至0，AI会选择Pass');
    } else if (bombEval.score > 0) {
      console.log('⚠️ 炸弹评分>0，AI可能选择出炸弹');
    }
  });

  /**
   * 问题BJ：AI跟牌时，有多个能压过的牌型的选择
   */
  it('问题BJ：有多个能压过的牌型时的选择', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7),  // 对子7
      createCard(3, 8),  // 单张8
    ];

    const lastPlay = [createCard(100, 5)];  // 上家出单张5

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题BJ：有多个能压过的牌型 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 单张8能压过单张5
    // 对子7无法压过单张5（牌型不同）
    // 所以只能出单张8
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(1);
    console.log('✓ 正确：用单张压过');
  });
});
