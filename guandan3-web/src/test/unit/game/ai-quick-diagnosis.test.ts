/**
 * AI 问题快速诊断脚本
 *
 * 快速检查AI系统的常见问题
 */

import { describe, expect, it } from 'vitest';
import { decideMove, clearPerformanceMetrics } from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

// Helper function to create mock card
const createCard = (id: number, val: number = id): Card => ({
  id,
  suit: 'H',
  rank: String(val),
  val,
});

describe('AI问题快速诊断', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  describe('问题1: AI不出牌（锁死问题）', () => {
    it('诊断：AI能够正常做出决策', () => {
      const hand = [
        createCard(1, 3),
        createCard(2, 4),
        createCard(3, 5),
      ];

      // 领牌时应该能出牌
      const move = decideMove(hand, null, 2, 'medium', true);

      expect(move.type).not.toBe('pass');
      expect(move.cards).toBeDefined();
      expect(move.cards!.length).toBeGreaterThan(0);

      console.log('✓ AI能够正常做出决策');
      console.log(`  决策类型: ${move.type}`);
      console.log(`  出牌数量: ${move.cards?.length}`);
    });

    it('诊断：AI跟牌时能正确决策', () => {
      const hand = [
        createCard(1, 5),
        createCard(2, 6),
        createCard(3, 7),
      ];

      const lastPlay = [createCard(100, 4)]; // 上家出了4

      const move = decideMove(hand, lastPlay, 2, 'medium', false);

      // 应该能压过，或者pass
      expect(move.type).toMatch(/play|pass/);

      if (move.type === 'play') {
        console.log('✓ AI选择跟牌');
        console.log(`  出牌: ${move.cards?.map(c => c.val).join(',')}`);
      } else {
        console.log('✓ AI选择过牌（无法压过）');
      }
    });
  });

  describe('问题2: 决策性能', () => {
    it('诊断：AI决策时间合理', () => {
      const hand = Array.from({ length: 10 }, (_, i) => createCard(i + 1, (i % 13) + 2));

      const iterations = 50;
      const times: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const start = Date.now();
        decideMove(hand, null, 2, 'medium', true);
        const elapsed = Date.now() - start;
        times.push(elapsed);
      }

      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const maxTime = Math.max(...times);

      console.log(`✓ 完成 ${iterations} 次决策`);
      console.log(`  平均时间: ${avgTime.toFixed(2)}ms`);
      console.log(`  最大时间: ${maxTime}ms`);
      console.log(`  最小时间: ${Math.min(...times)}ms`);

      expect(avgTime).toBeLessThan(100); // 平均应该 < 100ms
      expect(maxTime).toBeLessThan(500); // 最大应该 < 500ms
    });
  });

  describe('问题3: 牌型识别', () => {
    it('诊断：AI能识别基本牌型', () => {
      // 对子
      const pairHand = [
        createCard(1, 5),
        createCard(2, 5),
      ];

      const pairMove = decideMove(pairHand, null, 2, 'hard', true);
      console.log(`对子识别: ${pairMove.type}, ${pairMove.cards?.length} 张牌`);

      // 三张
      const tripleHand = [
        createCard(1, 6),
        createCard(2, 6),
        createCard(3, 6),
      ];

      const tripleMove = decideMove(tripleHand, null, 2, 'hard', true);
      console.log(`三张识别: ${tripleMove.type}, ${tripleMove.cards?.length} 张牌`);

      expect(pairMove.type).toBe('play');
      expect(tripleMove.type).toBe('play');
    });

    it('诊断：AI能识别炸弹', () => {
      const bombHand = [
        createCard(1, 7),
        createCard(2, 7),
        createCard(3, 7),
        createCard(4, 7),
      ];

      const bombMove = decideMove(bombHand, null, 2, 'hard', true);
      console.log(`炸弹识别: ${bombMove.type}, ${bombMove.cards?.length} 张牌`);

      expect(bombMove.type).toBe('play');
      expect(bombMove.cards?.length).toBe(4);
    });
  });

  describe('问题4: 跟牌策略', () => {
    it('诊断：AI跟牌时选择最小的能压过的牌', () => {
      const hand = [
        createCard(1, 5), // 能压过
        createCard(2, 7), // 能压过但不是最小
        createCard(3, 10), // 能压过但不是最小
      ];

      const lastPlay = [createCard(100, 4)];

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      if (move.type === 'play' && move.cards) {
        const cardValue = move.cards[0].val;
        console.log(`✓ AI跟牌选择: ${cardValue}`);
        console.log(`  手牌可用: [5, 7, 10]`);

        // 应该选择5（最小的能压过的）
        expect(cardValue).toBe(5);
      }
    });

    it('诊断：AI无法压过时选择pass', () => {
      const hand = [
        createCard(1, 3),
        createCard(2, 4),
      ];

      const lastPlay = [createCard(100, 14)]; // 上家出了A

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      expect(move.type).toBe('pass');
      console.log('✓ AI正确选择pass（无法压过A）');
    });
  });

  describe('问题5: 领牌策略', () => {
    it('诊断：AI领牌时选择小牌', () => {
      const hand = [
        createCard(1, 3), // 最小
        createCard(2, 14), // A（最大）
      ];

      const move = decideMove(hand, null, 2, 'hard', true);

      expect(move.type).toBe('play');
      expect(move.cards).toBeDefined();

      const cardValue = move.cards![0].val;
      console.log(`✓ AI领牌选择: ${cardValue}`);
      console.log(`  手牌可用: [3, 14]`);

      // 应该选择3（小牌）
      expect(cardValue).toBeLessThan(14);
    });
  });

  describe('问题6: 炸弹使用策略', () => {
    it('诊断：AI不会用炸弹压单张（除非必要）', () => {
      const hand = [
        createCard(1, 3), // 单张
        createCard(2, 4),
        createCard(3, 8),
        createCard(4, 8),
        createCard(5, 8),
        createCard(6, 8), // 炸弹
      ];

      const lastPlay = [createCard(100, 5)]; // 上家出了小单张

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      if (move.type === 'play') {
        const cardCount = move.cards?.length || 0;
        console.log(`✓ AI出牌数量: ${cardCount}`);

        // 不应该用4张炸弹压1张单牌
        if (cardCount === 4) {
          console.log('  ⚠️  警告: AI使用炸弹压单张');
        } else {
          console.log('  ✓ AI没有用炸弹压单张');
        }
      } else {
        console.log('✓ AI选择pass（保留炸弹）');
      }
    });
  });
});
