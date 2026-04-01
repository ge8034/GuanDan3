/**
 * AI 新问题发现测试
 *
 * 基于深度分析结果，进一步测试AI可能存在的问题
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

describe('AI新问题发现测试', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  /**
   * 问题K：级牌为2时，AI优先出对子2而不是其他单张
   * 级牌对子应该有额外加分，因为级牌>普通牌
   */
  it('问题K：级牌对子2 vs 普通单张的优先级', () => {
    const hand = [
      createCard(1, 2, 'S'),  // 级牌2（黑桃）
      createCard(2, 2, 'H'),  // 级牌2（红桃，逢人配）
      createCard(3, 10),     // 普通单张10
    ];

    // 评估对子2
    const pairMove = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const singleMove = { type: 'play' as const, cards: [hand[2]] };

    const pairEval = evaluateMove(pairMove, hand, null, 2, 'hard', true);
    const singleEval = evaluateMove(singleMove, hand, null, 2, 'hard', true);

    console.log('\n=== 问题K：级牌对子2 vs 普通单张10 ===');
    console.log('对子2评分:', pairEval.score, '推理:', pairEval.reasoning);
    console.log('单张10评分:', singleEval.score, '推理:', singleEval.reasoning);

    // 级牌对子应该优先出，因为：
    // 1. 对子加分(50)
    // 2. 多张牌加分(30)
    // 3. 级牌主值高(60)
    if (pairEval.score > singleEval.score) {
      console.log('✓ 正确：对子2评分更高');
    } else {
      console.log('⚠️ 问题K：单张10评分比对子2高，AI可能错误选择');
    }

    // 实际决策
    const move = decideMove(hand, null, 2, 'hard', true);
    console.log('AI实际选择:', move.type, move.cards?.map(c => `val=${c.val},suit=${c.suit}`));
  });

  /**
   * 问题L：AI跟牌时，有能压过的牌但评分不够时选择Pass
   */
  it('问题L：跟牌时Pass vs 出牌的评分', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8),  // 炸弹8
      createCard(5, 9),  // 单张9
    ];

    const lastPlay = [createCard(100, 7)];  // 上家出单张7

    // 评估各选项
    const bombMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2], hand[3]] };
    const singleMove = { type: 'play' as const, cards: [hand[4]] };
    const passMove = { type: 'pass' as const };

    const bombEval = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);
    const singleEval = evaluateMove(singleMove, hand, lastPlay, 2, 'hard', false);
    const passEval = evaluateMove(passMove, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题L：跟牌时Pass vs 出牌 ===');
    console.log('炸弹评分:', bombEval.score);
    console.log('单张9评分:', singleEval.score);
    console.log('Pass评分:', passEval.score);

    // 单张9能压过7，且评分应该最高
    expect(singleEval.score).toBeGreaterThan(0);

    // 炸弹应该被大幅扣分（压小牌保留炸弹）
    expect(bombEval.score).toBeLessThan(singleEval.score);

    console.log('✓ 单张评分 > 炸弹评分，AI正确选择出单张');
  });

  /**
   * 问题M：AI有炸弹和能压过的普通牌时的选择
   */
  it('问题M：炸弹+普通牌跟牌时的选择', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5
      createCard(5, 9),  // 单张9
    ];

    const lastPlay = [createCard(100, 8)];  // 上家出单张8

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题M：有炸弹和能压过的普通牌 ===');
    console.log('手牌: 炸弹5 + 单张9');
    console.log('上家出牌: 8');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该选择出单张9，而不是炸弹
    expect(move.type).toBe('play');
    if (move.cards!.length === 1) {
      expect(move.cards![0].val).toBe(9);
      console.log('✓ 正确：AI用单张压过，保留炸弹');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题M：AI使用炸弹压单张，浪费炸弹');
    }
  });

  /**
   * 问题N：AI领牌时，有炸弹和对子时的选择
   */
  it('问题N：领牌时炸弹vs对子的优先级', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7),  // 炸弹7
      createCard(5, 8), createCard(6, 8),  // 对子8
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题N：领牌时炸弹vs对子 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 领牌时应该优先出对子（保留炸弹）
    if (move.cards!.length === 2) {
      console.log('✓ 正确：AI选择出对子，保留炸弹');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题N：AI领牌时出炸弹，应该保留炸弹到最后');
    }
  });

  /**
   * 问题O：AI接近出完时，有炸弹和单张的选择
   */
  it('问题O：接近出完时炸弹vs单张', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6), createCard(4, 6),  // 炸弹6
      createCard(5, 7),  // 单张7
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题O：接近出完时(5张)炸弹vs单张 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 接近出完时，应该出单张7，然后炸弹6一次性出完
    // 而不是出炸弹6（剩单张7需要再一轮）
    if (move.cards!.length === 1) {
      console.log('✓ 正确：AI出单张，保留炸弹一次性出完');
    } else if (move.cards!.length === 4) {
      console.log('⚠️ 问题O：AI出炸弹后剩单张，需要多一轮出完');
    }
  });

  /**
   * 问题P：AI跟炸弹时的决策
   */
  it('问题P：跟炸弹时的决策', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8),  // 炸弹8
      createCard(5, 9), createCard(6, 9), createCard(7, 9), createCard(8, 9),  // 炸弹9
    ];

    const lastPlay = [
      createCard(100, 7), createCard(101, 7), createCard(102, 7), createCard(103, 7),  // 上家出炸弹7
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题P：跟炸弹时的决策 ===');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该用最小的能压过的炸弹（炸弹8）
    if (move.type === 'play') {
      expect(move.cards![0].val).toBe(8);
      console.log('✓ 正确：AI用炸弹8压过炸弹7');
    }
  });

  /**
   * 问题Q：AI手牌只有炸弹时的决策
   */
  it('问题Q：手牌只有炸弹时的领牌决策', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7),  // 炸弹7
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题Q：手牌只有炸弹 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 手牌只有炸弹时，AI应该出炸弹（获取控制权）
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(4);
    console.log('✓ 正确：手牌只有炸弹时出炸弹');
  });

  /**
   * 问题R：AI有多个炸弹时的领牌选择
   */
  it('问题R：有多个炸弹时的领牌选择', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5（小）
      createCard(5, 10), createCard(6, 10), createCard(7, 10), createCard(8, 10),  // 炸弹10（大）
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题R：有多个炸弹时的领牌选择 ===');
    console.log('AI选择:', move.cards?.map(c => c.val));

    // AI应该出小炸弹5（保留大炸弹10）
    if (move.cards && move.cards[0].val === 5) {
      console.log('✓ 正确：AI出小炸弹，保留大炸弹');
    } else if (move.cards && move.cards[0].val === 10) {
      console.log('⚠️ 问题R：AI出大炸弹，应该出小炸弹');
    }
  });

  /**
   * 问题S：AI跟牌时，所有牌都太小无法压过，但有炸弹
   */
  it('问题S：所有普通牌太小，有炸弹时的决策', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5
      createCard(5, 6),  // 单张6
    ];

    const lastPlay = [createCard(100, 13)];  // 上家出K（13）

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题S：所有牌太小但有炸弹 ===');
    console.log('手牌: 炸弹5 + 单张6');
    console.log('上家出牌: K(13)');
    console.log('AI选择:', move.type, move.cards?.length, '张');

    // 单张6无法压过K，必须用炸弹或Pass
    // 根据炸弹保留策略，可能选择Pass
    if (move.type === 'pass') {
      console.log('✓ AI选择Pass（保留炸弹）');
    } else if (move.type === 'play' && move.cards!.length === 4) {
      console.log('✓ AI使用炸弹压过（合理，因为没有其他选择）');
    } else if (move.type === 'play' && move.cards!.length === 1) {
      console.log('⚠️ 问题S：AI出单张6无法压过K');
    }
  });

  /**
   * 问题T：AI有大小王时的出牌策略
   */
  it('问题T：有大小王时的出牌策略', () => {
    const hand = [
      createCard(1, 100, 'J'),  // 小王
      createCard(2, 200, 'J'),  // 大王
      createCard(3, 5),  // 单张5
      createCard(4, 6),  // 单张6
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题T：有大小王时的出牌 ===');
    console.log('AI选择:', move.type, move.cards?.map(c => `val=${c.val},suit=${c.suit}`));

    // AI应该优先出普通牌，保留王牌
    if (move.cards && move.cards.some(c => c.suit === 'J')) {
      console.log('⚠️ 问题T：AI出王牌，应该保留王牌到最后');
    } else {
      console.log('✓ 正确：AI出普通牌，保留王牌');
    }
  });
});
