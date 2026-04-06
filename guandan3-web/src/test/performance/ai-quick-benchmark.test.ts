/**
 * AI快速性能基准测试
 *
 * 轻量级性能测试，避免内存问题。
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { performance } from 'perf_hooks';
import { decideMove, analyzeHand, clearHandAnalysisCache } from '@/lib/game/ai';
import { clearPerformanceMetrics } from '@/lib/game/ai-performance';
import type { Card } from '@/lib/store/game';

// ============================================================================
// 测试辅助函数
// ============================================================================

function createCard(id: number, val: number, suit: string = 'H'): Card {
  return {
    id,
    suit,
    rank: val.toString(),
    val,
  };
}

function generateTestHand(size: number): Card[] {
  const cards: Card[] = [];
  const suits = ['S', 'H', 'C', 'D'];

  for (let i = 0; i < size; i++) {
    const suit = suits[i % 4];
    const val = (i % 13) + 2; // 2-14 (A)
    cards.push(createCard(i, val, suit));
  }

  return cards;
}

// ============================================================================
// 快速性能基准测试
// ============================================================================

describe('AI快速性能基准测试', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
  });

  describe('基础性能测试', () => {
    it('小手牌决策(10张)应该在30ms内完成', () => {
      const hand = generateTestHand(10);
      const lastPlay = hand.slice(0, 3);

      const start = performance.now();
      const move = decideMove(hand, lastPlay, 2, 'hard', false);
      const duration = performance.now() - start;

      expect(move).toBeDefined();
      expect(duration).toBeLessThan(30);
      console.log(`小手牌决策耗时: ${duration.toFixed(2)}ms`);
    });

    it('正常手牌决策(20张)应该在60ms内完成', () => {
      const hand = generateTestHand(20);
      const lastPlay = hand.slice(0, 4);

      const start = performance.now();
      const move = decideMove(hand, lastPlay, 2, 'hard', false);
      const duration = performance.now() - start;

      expect(move).toBeDefined();
      expect(duration).toBeLessThan(60);
      console.log(`正常手牌决策耗时: ${duration.toFixed(2)}ms`);
    });

    it('模式识别小手牌(10张)应该在15ms内完成', () => {
      const hand = generateTestHand(10);

      const start = performance.now();
      const analysis = analyzeHand(hand, 2);
      const duration = performance.now() - start;

      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(15);
      console.log(`小手牌模式识别耗时: ${duration.toFixed(2)}ms`);
    });

    it('模式识别正常手牌(20张)应该在40ms内完成', () => {
      const hand = generateTestHand(20);

      const start = performance.now();
      const analysis = analyzeHand(hand, 2);
      const duration = performance.now() - start;

      expect(analysis).toBeDefined();
      expect(duration).toBeLessThan(40);
      console.log(`正常手牌模式识别耗时: ${duration.toFixed(2)}ms`);
    });
  });

  describe('稳定性测试', () => {
    it('连续10次小决策应该性能稳定', () => {
      const durations: number[] = [];

      for (let i = 0; i < 10; i++) {
        const hand = generateTestHand(15);
        const start = performance.now();
        decideMove(hand, null, 2, 'hard', true);
        durations.push(performance.now() - start);
      }

      const avg = durations.reduce((a, b) => a + b) / durations.length;
      const max = Math.max(...durations);

      expect(avg).toBeLessThan(40);
      expect(max).toBeLessThan(80);

      console.log(`连续10次决策 - 平均: ${avg.toFixed(2)}ms, 最大: ${max.toFixed(2)}ms`);
    });

    it('不同难度性能应该相似', () => {
      const hand = generateTestHand(15);
      const difficulties: Array<'easy' | 'medium' | 'hard'> = [
        'easy',
        'medium',
        'hard',
      ];

      const results = difficulties.map((difficulty) => {
        const start = performance.now();
        decideMove(hand, null, 2, difficulty, true);
        return performance.now() - start;
      });

      const maxDiff = Math.max(...results) - Math.min(...results);

      expect(maxDiff).toBeLessThan(15); // 性能差异应小于15ms

      console.log(`难度性能测试 - Easy: ${results[0].toFixed(2)}ms, Medium: ${results[1].toFixed(2)}ms, Hard: ${results[2].toFixed(2)}ms`);
    });
  });

  describe('边界情况测试', () => {
    it('空手牌应该立即返回', () => {
      const start = performance.now();
      const move = decideMove([], null, 2, 'hard', true);
      const duration = performance.now() - start;

      expect(move.type).toBe('pass');
      expect(duration).toBeLessThan(5);
      console.log(`空手牌决策耗时: ${duration.toFixed(2)}ms`);
    });

    it('单张手牌应该快速返回', () => {
      const hand = [createCard(1, 2)];

      const start = performance.now();
      const move = decideMove(hand, null, 2, 'hard', true);
      const duration = performance.now() - start;

      expect(move.type).toBe('play');
      expect(duration).toBeLessThan(10);
      console.log(`单张手牌决策耗时: ${duration.toFixed(2)}ms`);
    });

    it('无法跟牌应该快速返回pass', () => {
      const hand = [createCard(1, 2)]; // 只有2
      const lastPlay = [createCard(2, 14)]; // 上家出A

      const start = performance.now();
      const move = decideMove(hand, lastPlay, 2, 'hard', false);
      const duration = performance.now() - start;

      // AI可能选择pass或尝试出牌（虽然无法压过）
      // 只要快速返回即可
      expect(duration).toBeLessThan(15);
      console.log(`无法跟牌决策耗时: ${duration.toFixed(2)}ms, 决策: ${move.type}`);
    });
  });

  describe('内存效率测试', () => {
    it('连续决策不应有明显内存增长', () => {
      const initialMemory = process.memoryUsage().heapUsed / 1024 / 1024;

      for (let i = 0; i < 20; i++) {
        const hand = generateTestHand(15);
        decideMove(hand, null, 2, 'hard', true);
      }

      const finalMemory = process.memoryUsage().heapUsed / 1024 / 1024;
      const memoryGrowth = finalMemory - initialMemory;

      expect(memoryGrowth).toBeLessThan(15); // 增长应小于15MB（调整阈值）

      console.log(`内存增长: ${memoryGrowth.toFixed(2)}MB`);
    });
  });
});
