/**
 * AI 边界情况测试
 *
 * 测试AI在各种边界情况下的行为，找出潜在问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics } from '@/lib/game/ai';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI边界情况测试 - 寻找潜在问题', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  it('问题1：AI手牌全是大牌时领牌策略', () => {
    // 手牌：只有大牌（J、Q、K、A）
    const hand = [
      createCard(1, 11), // J
      createCard(2, 12), // Q
      createCard(3, 13), // K
      createCard(4, 14), // A
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌全是大牌:', hand.map(c => c.val));
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该出牌，即使是J
    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();
    expect(move.cards!.length).toBeGreaterThan(0);

    // 验证AI选择了最小的牌（J）
    expect(move.cards![0].val).toBe(11);
  });

  it('问题2：AI跟牌时需要压过大牌的决策', () => {
    // 手牌：只有中牌，需要压过Q
    const hand = [
      createCard(1, 13), // K
      createCard(2, 14), // A
    ];

    const lastPlay = [createCard(100, 12)]; // 上家出了Q

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('手牌:', hand.map(c => c.val));
    console.log('上家出牌:', lastPlay[0].val);
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该用K或A压过
    expect(move.type).toBe('play');
    expect(move.cards![0].val).toBeGreaterThan(12);
  });

  it('问题3：AI手牌全是炸弹时的决策', () => {
    // 手牌：两个炸弹（4张7 + 4张8）
    const hand = [
      createCard(1, 7),
      createCard(2, 7),
      createCard(3, 7),
      createCard(4, 7),
      createCard(5, 8),
      createCard(6, 8),
      createCard(7, 8),
      createCard(8, 8),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌全是炸弹');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该出牌
    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();

    // 应该出4张炸弹，而不是3张或更少
    expect(move.cards!.length).toBe(4);
  });

  it('问题4：AI跟牌时只能用炸弹压过的决策', () => {
    // 手牌：只有单张和炸弹
    const hand = [
      createCard(1, 3), // 单张
      createCard(2, 4),
      createCard(3, 5),
      createCard(4, 5),
      createCard(5, 5),
      createCard(6, 5), // 炸弹5
    ];

    // 上家出了K（13）
    const lastPlay = [createCard(100, 13)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('手牌有单张和炸弹');
    console.log('上家出牌:', lastPlay[0].val);
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该用炸弹压过K（炸弹可以压过任何非炸弹牌型）
    // 或者用单张5（但5<13无法压过，所以应该用炸弹）
    expect(move.type).toBe('play');

    // 如果出炸弹，4张牌是正确的
    // 如果出单张，牌值必须>13
    if (move.cards!.length === 4) {
      // 炸弹，正确
      console.log('AI正确使用炸弹压过单张K');
    } else if (move.cards!.length === 1) {
      // 单张必须大于13
      expect(move.cards![0].val).toBeGreaterThan(13);
    }
  });

  it('问题5：AI接近出完牌时的策略', () => {
    // 手牌：只剩3张牌
    const hand = [
      createCard(1, 5),
      createCard(2, 8),
      createCard(3, 12),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌只剩3张:', hand.map(c => c.val));
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该出牌
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBeGreaterThan(0);

    // 应该优先出多张牌（如果有的话）或最小的单张
    const cardValue = move.cards![0].val;
    expect(cardValue).toBeLessThanOrEqual(12);
  });

  it('问题6：AI跟牌时所有牌都太小无法压过', () => {
    // 手牌：只有小牌
    const hand = [
      createCard(1, 3),
      createCard(2, 4),
      createCard(3, 5),
    ];

    // 上家出了A（14）
    const lastPlay = [createCard(100, 14)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('手牌都是小牌:', hand.map(c => c.val));
    console.log('上家出牌:', lastPlay[0].val);
    console.log('AI选择:', move.type);

    // AI应该pass（或者如果有炸弹则用炸弹）
    if (hand.every(c => c.val <= 14)) {
      expect(move.type).toBe('pass');
    }
  });

  it('问题7：AI有多个炸弹时的选择', () => {
    // 手牌：两个炸弹（4张7和4张8）
    const hand = [
      createCard(1, 7),
      createCard(2, 7),
      createCard(3, 7),
      createCard(4, 7),
      createCard(5, 8),
      createCard(6, 8),
      createCard(7, 8),
      createCard(8, 8),
    ];

    // 上家出了小单张
    const lastPlay = [createCard(100, 3)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('手牌有两个炸弹');
    console.log('上家出牌:', lastPlay[0].val);
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该用最小的能压过的牌（不应该是炸弹，除非必要）
    if (move.type === 'play' && move.cards!.length === 4) {
      // 如果出炸弹，说明AI判断需要用炸弹
      console.log('AI选择用炸弹压单张');
    }
  });

  it('问题8：AI领牌时有顺子时的选择', () => {
    // 手牌：包含顺子（3、4、5、6、7）和单张
    const hand = [
      createCard(1, 3),
      createCard(2, 4),
      createCard(3, 5),
      createCard(4, 6),
      createCard(5, 7),
      createCard(6, 14), // A
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌包含顺子');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI应该出牌
    expect(move.type).toBe('play');

    // 检查是否识别并优先出顺子（5张）
    const analysis = analyzeMove(move.cards!, 2);
    console.log('牌型分析:', analysis?.type);

    // 顺子加分，AI应该倾向于出顺子
    if (move.cards!.length >= 5) {
      console.log('AI选择出顺子或长牌型');
    }
  });

  it('问题9：AI有对子和单张时的优先级', () => {
    // 手牌：对子6 + 单张3
    const hand = [
      createCard(1, 3),  // 单张
      createCard(2, 6),  // 对子
      createCard(3, 6),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌有对子和单张');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI可以选择出单张或对子，两者都是合法的
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBeGreaterThanOrEqual(1);
  });

  it('问题10：AI跟牌时对子vs单张的选择', () => {
    // 手牌：有对子和单张都能压过上家
    const hand = [
      createCard(1, 5),  // 单张（能压过）
      createCard(2, 6),  // 对子
      createCard(3, 6),
    ];

    // 上家出了单张4
    const lastPlay = [createCard(100, 4)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('手牌有对子和单张都能压过');
    console.log('上家出牌:', lastPlay[0].val);
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    // AI可以选择单张或对子
    // 对子加分更多，但单张更省牌
    expect(move.type).toBe('play');
  });

  it('问题11：AI手牌只有1张时的策略', () => {
    const hand = [createCard(1, 7)];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌只有1张');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该出这唯一的牌
    expect(move.type).toBe('play');
    expect(move.cards![0].val).toBe(7);
  });

  it('问题12：AI跟牌时手牌只有1张且无法压过', () => {
    const hand = [createCard(1, 3)];

    // 上家出了A
    const lastPlay = [createCard(100, 14)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('手牌只有1张且无法压过');
    console.log('AI选择:', move.type);

    // AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题13：AI有大小王时的决策', () => {
    // 手牌：包含大小王
    const hand = [
      createCard(1, 100, 'J'), // 小王
      createCard(2, 200, 'J'), // 大王
      createCard(3, 5),
      createCard(4, 8),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('手牌包含大小王');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该出牌
    expect(move.type).toBe('play');

    // 检查是否正确识别大小王
    const hasJoker = move.cards?.some(c => c.suit === 'J');
    console.log('出牌包含王:', hasJoker);
  });

  it('问题14：AI跟炸弹时的决策', () => {
    // 手牌：只有更大的炸弹能压过
    const hand = [
      createCard(1, 8),
      createCard(2, 8),
      createCard(3, 8),
      createCard(4, 8),
      createCard(5, 9),
      createCard(6, 9),
      createCard(7, 9),
      createCard(8, 9),
    ];

    // 上家出了炸弹7（4张）
    const lastPlay = [
      createCard(100, 7),
      createCard(101, 7),
      createCard(102, 7),
      createCard(103, 7),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('上家出了炸弹7');
    console.log('AI手牌有炸弹8');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该用炸弹8压过
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(4);
  });

  it('问题15：AI跟炸弹时炸弹更大但张数更多', () => {
    // 手牌：5张9的炸弹（理论上可能）
    const hand = [
      createCard(1, 9),
      createCard(2, 9),
      createCard(3, 9),
      createCard(4, 9),
      createCard(5, 9),
    ];

    // 上家出了炸弹7（4张）
    const lastPlay = [
      createCard(100, 7),
      createCard(101, 7),
      createCard(102, 7),
      createCard(103, 7),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('上家出了炸弹7（4张）');
    console.log('AI手牌有5张9');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI应该用5张9压过（如果支持）或pass
    if (move.type === 'play') {
      console.log('AI选择出牌');
    } else {
      console.log('AI选择pass（可能不支持5张炸弹）');
    }
  });
});
