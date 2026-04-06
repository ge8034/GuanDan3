/**
 * AI 领牌偏好测试
 *
 * 测试AI在领牌时的出牌偏好
 * 验证AI是否优先出小牌而非大牌
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics, clearHandAnalysisCache } from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number): Card => ({
  id,
  suit: 'H',
  rank: String(val),
  val,
});

describe('AI领牌偏好测试', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
  });
  it('AI领牌时应优先出小牌而非大牌', () => {
    // 手牌：包含小牌（3、4）和大牌（14=A）
    const hand = [
      createCard(1, 3),   // 最小牌
      createCard(2, 4),   // 小牌
      createCard(3, 5),   // 中等牌
      createCard(4, 14),  // A（大牌）
    ];

    console.log('手牌:', hand.map(c => c.val));

    const move = decideMove(hand, null, 2, 'hard', true);

    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();
    expect(move.cards!.length).toBeGreaterThan(0);

    const cardValue = move.cards![0].val;
    console.log('AI选择的牌值:', cardValue);

    // AI应该选择较小的牌，而不是A（14）
    expect(cardValue).toBeLessThan(14);
    expect(cardValue).toBeLessThan(10); // 至少不应该选择太大的牌
  });

  it('AI手牌只有炸弹时也应该出牌', () => {
    // 手牌只有炸弹4张7
    const hand = [
      createCard(1, 7),
      createCard(2, 7),
      createCard(3, 7),
      createCard(4, 7),
    ];

    console.log('手牌:', hand.map(c => c.val));

    const move = decideMove(hand, null, 2, 'hard', true);

    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();

    // 应该出4张炸弹，而不是只出3张
    expect(move.cards!.length).toBe(4);
    console.log('AI出牌数量:', move.cards!.length);
  });

  it('AI在有多张单牌时应选择最小的单张', () => {
    const hand = [
      createCard(1, 3),   // 最小
      createCard(2, 8),   // 中等
      createCard(3, 12),  // Q
      createCard(4, 14),  // A（最大）
    ];

    console.log('手牌:', hand.map(c => c.val));

    const move = decideMove(hand, null, 2, 'hard', true);

    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(1);

    const cardValue = move.cards![0].val;
    console.log('AI选择的牌值:', cardValue);

    // 应该选择3（最小的）
    expect(cardValue).toBe(3);
  });

  it('AI在有对子和单张时应优先出对子', () => {
    const hand = [
      createCard(1, 5),   // 单张
      createCard(2, 6),   // 对子
      createCard(3, 6),
      createCard(4, 14),  // A（单张）
    ];

    console.log('手牌:', hand.map(c => c.val));

    const move = decideMove(hand, null, 2, 'hard', true);

    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();

    const cardValues = move.cards!.map(c => c.val).sort((a, b) => a - b);
    console.log('AI选择的牌值:', cardValues);

    // 应该选择对子（2张）而不是单张，因为对子有额外加分
    expect(move.cards!.length).toBe(2);
    expect(cardValues[0]).toBe(6); // 对子值
  });

  it('AI在三张和单张间应优先出三张', () => {
    const hand = [
      createCard(1, 5),   // 三张
      createCard(2, 5),
      createCard(3, 5),
      createCard(4, 14),  // A（单张）
    ];

    console.log('手牌:', hand.map(c => c => c.val));

    const move = decideMove(hand, null, 2, 'hard', true);

    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();

    console.log('AI出牌数量:', move.cards!.length);
    console.log('AI选择的牌值:', move.cards!.map(c => c.val));

    // 应该选择三张（3张），因为三张有额外加分（80分）
    expect(move.cards!.length).toBe(3);
  });

  it('调试：检查所有可能的出牌选项', () => {
    const hand = [
      createCard(1, 3),   // 单张：3
      createCard(2, 4),   // 单张：4
      createCard(3, 5),   // 单张：5
      createCard(4, 14),  // 单张：A
    ];

    console.log('\n=== 调试：检查AI的所有可能选项 ===');
    console.log('手牌:', hand.map(c => c.val));

    // 检查单张选项
    for (const card of hand) {
      const move = decideMove([card], null, 2, 'hard', true);
      console.log(`单张 ${card.val}: type=${move.type}, cards=${move.cards?.length}, val=${move.cards?.[0]?.val}`);
    }

    // 检查完整手牌的决策
    const fullMove = decideMove(hand, null, 2, 'hard', true);
    console.log(`完整决策: type=${fullMove.type}, cards=${fullMove.cards?.length}`);
    console.log(`选择的牌: ${fullMove.cards?.map(c => c.val).join(',')}`);
  });
});
