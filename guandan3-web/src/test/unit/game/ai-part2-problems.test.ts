/**
 * AI 问题发现 Part 2
 *
 * 继续寻找更多AI问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics } from '@/lib/game/ai';
import { analyzeMove, canBeat, getCardValue } from '@/lib/game/rules';
import { evaluateMove } from '@/lib/game/ai-strategy';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI问题发现 Part 2', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  /**
   * 问题AA：AI跟牌时，有炸弹和能压过的牌时的选择
   */
  it('问题AA：跟牌时炸弹vs能压过的普通牌', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5
      createCard(5, 8),  // 单张8
    ];

    const lastPlay = [createCard(100, 7)];  // 上家出单张7

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题AA：跟牌时炸弹vs普通牌 ===');
    console.log('手牌: 炸弹5 + 单张8');
    console.log('上家出牌: 7');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // 单张8能压过7，应该用单张而不是炸弹
    expect(move.type).toBe('play');
    if (move.cards!.length === 1) {
      expect(move.cards![0].val).toBe(8);
      console.log('✓ 正确：用单张压过，保留炸弹');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题AA：用炸弹压单张，浪费炸弹');
    }
  });

  /**
   * 问题AB：AI领牌时，有炸弹和对子时的选择
   */
  it('问题AB：领牌时炸弹vs对子', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6), createCard(4, 6),  // 炸弹6
      createCard(5, 7), createCard(6, 7),  // 对子7
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题AB：领牌时炸弹vs对子 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 应该出对子而不是炸弹
    if (move.cards!.length === 2) {
      console.log('✓ 正确：出对子，保留炸弹');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题AB：出炸弹，应该保留炸弹');
    }
  });

  /**
   * 问题AC：AI接近出完时，有炸弹和三张的选择
   */
  it('问题AC：接近出完时炸弹vs三张', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5
      createCard(5, 6), createCard(6, 6), createCard(7, 6),  // 三张6
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题AC：接近出完时(7张)炸弹vs三张 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 出三张6：剩炸弹5（一次出完）
    // 出炸弹5：剩三张6（一次出完）
    // 两者都是一次出完，应该出三张（更快出完更多牌）
    if (move.cards!.length === 3) {
      console.log('✓ 正确：出三张，保留炸弹');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题AC：出炸弹，应该出三张');
    }
  });

  /**
   * 问题AD：AI跟牌时，所有牌都太大但有小炸弹
   */
  it('问题AD：所有牌太大但有小炸弹', () => {
    const hand = [
      createCard(1, 3), createCard(2, 3), createCard(3, 3), createCard(4, 3),  // 小炸弹3
      createCard(5, 14),  // A
    ];

    const lastPlay = [createCard(100, 7)];  // 上家出单张7

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题AD：所有牌太大但有小炸弹 ===');
    console.log('手牌: 小炸弹3 + A');
    console.log('上家出牌: 7');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // AI可以选择用A压过，用炸弹压过，或拆炸弹出单张
    if (move.type === 'play') {
      if (move.cards && move.cards.length === 1) {
        // 单张：应该是A或拆炸弹的一张
        console.log(`AI出单张: ${move.cards[0].val}`);
      } else if (move.cards && move.cards.length === 4) {
        console.log('⚠️ 问题AD：用小炸弹压单张，浪费炸弹');
      }
    }
    // 只检查AI能做出决策，不限定具体牌值
    expect(move.type).toBe('play');
  });

  /**
   * 问题AE：AI领牌时，有多个对子的选择
   */
  it('问题AE：有多个对子时的选择', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5),  // 对子5
      createCard(3, 10), createCard(4, 10),  // 对子10
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题AE：有多个对子时的选择 ===');
    console.log('AI选择:', move.cards?.map(c => c.val));

    // 应该出小对子（对子5）
    if (move.cards && move.cards[0].val === 5) {
      console.log('✓ 正确：出小对子');
    } else if (move.cards && move.cards[0].val === 10) {
      console.log('⚠️ 问题AE：出大对子，应该出小对子');
    }
  });

  /**
   * 问题AF：AI领牌时，有顺子和单张的选择
   */
  it('问题AF：有顺子时的选择', () => {
    const hand = [
      createCard(1, 3), createCard(2, 4), createCard(3, 5),
      createCard(4, 6), createCard(5, 7),  // 顺子34567
      createCard(6, 10),  // 单张10
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题AF：有顺子时的选择 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 应该优先出顺子（出更多牌）
    if (move.cards && move.cards.length >= 5) {
      console.log('✓ 正确：出顺子，快速出牌');
    } else {
      console.log('⚠️ 问题AF：出单张，应该出顺子');
    }
  });

  /**
   * 问题AG：AI跟牌时，有对子能压过但单张也行
   */
  it('问题AG：跟牌时对子vs单张都能压过', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8),  // 对子8
      createCard(3, 9),  // 单张9
    ];

    const lastPlay = [createCard(100, 5), createCard(101, 5)];  // 上家出对子5

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题AG：跟牌时对子vs单张都能压过 ===');
    console.log('上家出牌: 对子5');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 必须用对子压对子
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(2);
    console.log('✓ 正确：用对子压对子');
  });

  /**
   * 问题AH：AI跟牌时，只有炸弹能压过
   */
  it('问题AH：只有炸弹能压过时的决策', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5
      createCard(5, 6),  // 单张6（太小）
    ];

    const lastPlay = [createCard(100, 14)];  // 上家出A

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题AH：只有炸弹能压过 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 单张6无法压过A，必须用炸弹或Pass
    if (move.type === 'pass') {
      console.log('✓ AI选择Pass（保留炸弹）');
    } else if (move.type === 'play' && move.cards!.length === 4) {
      console.log('✓ AI使用炸弹压过（因为没有其他选择）');
    }
  });

  /**
   * 问题AI：AI领牌时，有连对和普通对子的选择
   */
  it('问题AI：有连对时的选择', () => {
    const hand = [
      createCard(1, 3), createCard(2, 3),
      createCard(3, 4), createCard(4, 4),
      createCard(5, 5), createCard(6, 5),  // 连对334455
      createCard(7, 10), createCard(8, 10),  // 普通对子10
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题AI：有连对时的选择 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 应该优先出连对（出更多牌）
    if (move.cards && move.cards.length >= 6) {
      console.log('✓ 正确：出连对，快速出牌');
    } else if (move.cards && move.cards.length === 2) {
      console.log('⚠️ 问题AI：出普通对子，应该出连对');
    }
  });

  /**
   * 问题AJ：AI跟炸弹时，有多个炸弹的选择
   */
  it('问题AJ：跟炸弹时有多个炸弹', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8),  // 炸弹8
      createCard(5, 9), createCard(6, 9), createCard(7, 9), createCard(8, 9),  // 炸弹9
    ];

    const lastPlay = [
      createCard(100, 5), createCard(101, 5), createCard(102, 5), createCard(103, 5),  // 上家出炸弹5
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题AJ：跟炸弹时有多个炸弹 ===');
    console.log('AI选择:', move.cards?.map(c => c.val));

    // 应该用最小的能压过的炸弹（炸弹8）
    if (move.cards && move.cards[0].val === 8) {
      console.log('✓ 正确：用小炸弹压过');
    } else if (move.cards && move.cards[0].val === 9) {
      console.log('⚠️ 问题AJ：用大炸弹，应该用小炸弹');
    }
  });
});
