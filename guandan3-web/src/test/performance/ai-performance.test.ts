/**
 * AI性能基准测试
 *
 * 测试AI决策逻辑的性能指标，确保在合理时间内完成决策。
 */

import { beforeEach, describe, expect, it } from 'vitest';
import { performance } from 'perf_hooks';
import { decideMove, analyzeHand } from '@/lib/game/ai';
import { clearPerformanceMetrics, getPerformanceStats } from '@/lib/game/ai-performance';
import type { Card } from '@/lib/store/game';

// ============================================================================
// 测试辅助函数
// ============================================================================

/**
 * 生成测试用卡牌
 */
function createCard(id: number, val: number, suit: string = 'H'): Card {
  return {
    id,
    suit,
    rank: val.toString(),
    val,
  };
}

/**
 * 生成测试手牌
 */
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

/**
 * 生成测试出牌
 */
function generateTestPlay(size: number): Card[] {
  const cards: Card[] = [];

  for (let i = 0; i < size; i++) {
    const val = (i % 10) + 2;
    cards.push(createCard(1000 + i, val));
  }

  return cards;
}

/**
 * 性能测试辅助函数
 */
function measurePerformance<T>(
  fn: () => T,
  maxDuration: number
): { result: T; duration: number } {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  if (duration > maxDuration) {
    console.warn(
      `性能警告: 操作耗时 ${duration.toFixed(2)}ms，超过阈值 ${maxDuration}ms`
    );
  }

  return { result, duration };
}

// ============================================================================
// 性能基准测试
// ============================================================================

describe('AI性能基准测试', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  describe('决策时间测试', () => {
    it('小手牌场景(10张)应该在50ms内完成决策', () => {
      const hand = generateTestHand(10);
      const lastPlay = generateTestPlay(3);

      const { duration } = measurePerformance(
        () => decideMove(hand, lastPlay, 2, 'hard', false),
        50
      );

      expect(duration).toBeLessThan(50);
    });

    it('正常手牌场景(27张)应该在100ms内完成决策', () => {
      const hand = generateTestHand(27);
      const lastPlay = generateTestPlay(5);

      const { duration } = measurePerformance(
        () => decideMove(hand, lastPlay, 2, 'hard', false),
        100
      );

      expect(duration).toBeLessThan(100);
    });

    it('大手牌场景(54张)应该在200ms内完成决策', () => {
      const hand = generateTestHand(54);
      const lastPlay = generateTestPlay(5);

      const { duration } = measurePerformance(
        () => decideMove(hand, lastPlay, 2, 'hard', false),
        200
      );

      expect(duration).toBeLessThan(200);
    });

    it('领牌场景应该在50ms内完成决策', () => {
      const hand = generateTestHand(27);

      const { duration } = measurePerformance(
        () => decideMove(hand, null, 2, 'hard', true),
        50
      );

      expect(duration).toBeLessThan(50);
    });

    it('跟牌场景应该在100ms内完成决策', () => {
      const hand = generateTestHand(27);
      const lastPlay = generateTestPlay(4);

      const { duration } = measurePerformance(
        () => decideMove(hand, lastPlay, 2, 'hard', false),
        100
      );

      expect(duration).toBeLessThan(100);
    });
  });

  describe('模式识别性能测试', () => {
    it('小手牌模式识别应该在20ms内完成', () => {
      const hand = generateTestHand(10);

      const { duration } = measurePerformance(
        () => analyzeHand(hand, 2),
        20
      );

      expect(duration).toBeLessThan(20);
    });

    it('正常手牌模式识别应该在50ms内完成', () => {
      const hand = generateTestHand(27);

      const { duration } = measurePerformance(
        () => analyzeHand(hand, 2),
        50
      );

      expect(duration).toBeLessThan(50);
    });

    it('大手牌模式识别应该在100ms内完成', () => {
      const hand = generateTestHand(54);

      const { duration } = measurePerformance(
        () => analyzeHand(hand, 2),
        100
      );

      expect(duration).toBeLessThan(100);
    });

    it('模式识别结果应该包含所有牌型', () => {
      const hand = generateTestHand(27);
      const result = analyzeHand(hand, 2);

      expect(result.singles).toBeDefined();
      expect(result.pairs).toBeDefined();
      expect(result.triples).toBeDefined();
      expect(result.bombs).toBeDefined();
      expect(result.straights).toBeDefined();
      expect(result.sequencePairs).toBeDefined();
      expect(result.sequenceTriples).toBeDefined();
      expect(result.fullHouses).toBeDefined();
    });

    it('模式识别不应该产生空结果', () => {
      const hand = generateTestHand(27);
      const result = analyzeHand(hand, 2);

      // 至少应该有单张和对子
      expect(result.singles.length).toBeGreaterThan(0);
      expect(result.pairs.length).toBeGreaterThanOrEqual(0);
      expect(result.triples.length).toBeGreaterThanOrEqual(0);
      expect(result.bombs.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('并发性能测试', () => {
    it('连续10次决策不应该有性能下降', () => {
      const durations: number[] = [];

      for (let i = 0; i < 10; i++) {
        const hand = generateTestHand(27);
        const { duration } = measurePerformance(
          () => decideMove(hand, null, 2, 'hard', true),
          100
        );
        durations.push(duration);
      }

      // 检查性能是否稳定（最后5次的平均时间不应比前5次慢20%以上）
      const firstHalf = durations.slice(0, 5);
      const secondHalf = durations.slice(5);
      const firstAvg =
        firstHalf.reduce((sum, d) => sum + d, 0) / firstHalf.length;
      const secondAvg =
        secondHalf.reduce((sum, d) => sum + d, 0) / secondHalf.length;

      expect(secondAvg).toBeLessThan(firstAvg * 1.2);
    });

    it('连续100次决策平均时间应该在合理范围内', () => {
      const durations: number[] = [];

      for (let i = 0; i < 100; i++) {
        const hand = generateTestHand(27);
        const start = performance.now();
        decideMove(hand, null, 2, 'hard', true);
        durations.push(performance.now() - start);
      }

      const avgDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const p99Duration = durations.sort((a, b) => a - b)[98]; // 99th percentile

      expect(avgDuration).toBeLessThan(80);
      expect(maxDuration).toBeLessThan(200);
      expect(p99Duration).toBeLessThan(150);
    });
  });

  describe('内存性能测试', () => {
    it('连续100次决策不应该有明显的内存泄漏', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < 100; i++) {
        const hand = generateTestHand(27);
        decideMove(hand, null, 2, 'hard', true);
      }

      // 强制垃圾回收（如果可用）
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease =
        (finalMemory - initialMemory) / 1024 / 1024;

      expect(memoryIncrease).toBeLessThan(10); // 小于10MB
    });

    it('性能指标存储不应该无限增长', () => {
      // 模拟1000次决策
      for (let i = 0; i < 1000; i++) {
        const hand = generateTestHand(27);
        decideMove(hand, null, 2, 'hard', true);
      }

      const stats = getPerformanceStats();

      // 验证指标数量被限制
      expect(stats.totalDecisions).toBeLessThanOrEqual(1000);
    });

    it('清理性能指标后应该释放内存', () => {
      // 生成一些指标
      for (let i = 0; i < 100; i++) {
        const hand = generateTestHand(27);
        decideMove(hand, null, 2, 'hard', true);
      }

      const statsBefore = getPerformanceStats();
      expect(statsBefore.totalDecisions).toBeGreaterThan(0);

      // 清理指标
      clearPerformanceMetrics();

      const statsAfter = getPerformanceStats();
      expect(statsAfter.totalDecisions).toBe(0);
    });
  });

  describe('边界情况性能测试', () => {
    it('空手牌应该立即返回', () => {
      const { duration } = measurePerformance(
        () => decideMove([], null, 2, 'hard', true),
        5
      );

      expect(duration).toBeLessThan(5);
    });

    it('单张手牌应该立即返回', () => {
      const hand = [createCard(1, 2)];

      const { duration } = measurePerformance(
        () => decideMove(hand, null, 2, 'hard', true),
        10
      );

      expect(duration).toBeLessThan(10);
    });

    it('无法跟牌的情况应该快速返回pass', () => {
      const hand = [createCard(1, 2)];
      const lastPlay = [createCard(2, 14)]; // A

      const { duration, result } = measurePerformance(
        () => decideMove(hand, lastPlay, 2, 'hard', false),
        20
      );

      expect(duration).toBeLessThan(20);
      expect(result.type).toBe('pass');
    });

    it('只有炸弹的手牌应该在合理时间内完成', () => {
      // 4张相同的牌（炸弹）
      const hand = [
        createCard(1, 7),
        createCard(2, 7),
        createCard(3, 7),
        createCard(4, 7),
      ];

      const { duration } = measurePerformance(
        () => decideMove(hand, null, 2, 'hard', true),
        50
      );

      expect(duration).toBeLessThan(50);
    });
  });

  describe('性能指标记录测试', () => {
    it('性能指标应该正确记录决策时间', () => {
      const hand = generateTestHand(27);
      decideMove(hand, null, 2, 'hard', true);

      const stats = getPerformanceStats();

      expect(stats.totalDecisions).toBe(1);
      expect(stats.averageDecisionTime).toBeGreaterThan(0);
      expect(stats.leadDecisions).toBe(1);
    });

    it('性能指标应该正确区分领牌和跟牌', () => {
      const hand = generateTestHand(27);

      // 领牌
      decideMove(hand, null, 2, 'hard', true);

      // 跟牌
      const lastPlay = generateTestPlay(3);
      decideMove(hand, lastPlay, 2, 'hard', false);

      const stats = getPerformanceStats();

      expect(stats.leadDecisions).toBe(1);
      expect(stats.followDecisions).toBe(1);
    });

    it('性能指标应该正确记录pass决策', () => {
      const hand = [createCard(1, 2)];
      const lastPlay = [createCard(2, 14)];

      decideMove(hand, lastPlay, 2, 'hard', false);

      const stats = getPerformanceStats();

      expect(stats.passDecisions).toBe(1);
    });

    it('性能指标应该正确计算平均时间', () => {
      const hand = generateTestHand(27);

      // 连续决策
      for (let i = 0; i < 5; i++) {
        decideMove(hand, null, 2, 'hard', true);
      }

      const stats = getPerformanceStats();

      expect(stats.totalDecisions).toBe(5);
      expect(stats.averageDecisionTime).toBeGreaterThan(0);
      expect(stats.averageDecisionTime).toBeLessThan(1000); // 不应该太长
    });
  });

  describe('难度级别性能测试', () => {
    it('不同难度级别的性能应该相似', () => {
      const hand = generateTestHand(27);
      const difficulties: Array<'easy' | 'medium' | 'hard'> = [
        'easy',
        'medium',
        'hard',
      ];

      const durations: Record<string, number> = {};

      for (const difficulty of difficulties) {
        const { duration } = measurePerformance(
          () => decideMove(hand, null, 2, difficulty, true),
          100
        );
        durations[difficulty] = duration;
      }

      // 所有难度级别的性能差异应该小于20ms
      const maxDiff = Math.max(...Object.values(durations)) -
                      Math.min(...Object.values(durations));

      expect(maxDiff).toBeLessThan(20);
    });
  });

  describe('压力测试', () => {
    it('大量并发决策不应该导致性能崩溃', () => {
      const durations: number[] = [];

      for (let i = 0; i < 50; i++) {
        const hand = generateTestHand(27);
        const start = performance.now();
        decideMove(hand, null, 2, 'hard', true);
        durations.push(performance.now() - start);
      }

      const avgDuration =
        durations.reduce((sum, d) => sum + d, 0) / durations.length;
      const maxDuration = Math.max(...durations);

      expect(avgDuration).toBeLessThan(100);
      expect(maxDuration).toBeLessThan(300);
    });

    it('极多张牌的场景应该在合理时间内完成', () => {
      const hand = generateTestHand(54);

      const { duration } = measurePerformance(
        () => decideMove(hand, null, 2, 'hard', true),
        300
      );

      expect(duration).toBeLessThan(300);
    });
  });
});
