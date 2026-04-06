import { describe, it, expect } from 'vitest';
import {
  sortCards,
  filterSafeCards,
  countStrongCards,
  analyzeCardDistribution,
  estimateMovesToClear,
  calculateHandStrength,
  calculateControlScore,
  assessRisk
} from '@/lib/game/ai-utils';

describe('ai-utils 重构验证', () => {
  const mockCards = [
    { id: 1, suit: 'H' as const, rank: 'A', val: 14 },
    { id: 2, suit: 'S' as const, rank: 'K', val: 13 },
    { id: 3, suit: 'D' as const, rank: 'Q', val: 12 },
    { id: 4, suit: 'C' as const, rank: 'J', val: 11 },
    { id: 5, suit: 'H' as const, rank: '7', val: 7 }
  ];

  it('应该能够排序卡牌', () => {
    const sorted = sortCards(mockCards, 10);
    expect(sorted).toHaveLength(5);
    expect(sorted[0].val).toBe(14);
  });

  it('应该能够过滤安全卡牌', () => {
    const safe = filterSafeCards(mockCards, 10);
    expect(safe).toHaveLength(5);
  });

  it('应该能够统计强牌', () => {
    const count = countStrongCards(mockCards, 10);
    expect(count).toBeGreaterThan(0);
  });

  it('应该能够分析卡牌分布', () => {
    const dist = analyzeCardDistribution(mockCards, 10);
    expect(dist).toBeDefined();
    expect(dist.suitCounts).toBeDefined();
    expect(dist.valueCounts).toBeDefined();
  });

  it('应该能够估计出牌次数', () => {
    const moves = estimateMovesToClear(mockCards, 10);
    expect(moves).toBeGreaterThan(0);
  });

  it('应该能够计算手牌强度', () => {
    const strength = calculateHandStrength({
      cardCount: 5,
      playedValue: 14,
      playedType: 'single'
    });
    expect(strength).toBeGreaterThan(0);
  });

  it('应该能够计算控制分数', () => {
    const score = calculateControlScore({
      cardCount: 5,
      strongCards: 4,
      hasJokers: false,
      levelRank: 10
    });
    expect(score).toBeGreaterThan(0);
  });

  it('应该能够评估风险', () => {
    const risk = assessRisk(
      [mockCards[0]],
      mockCards.slice(1),
      10,
      true
    );
    expect(risk).toBeGreaterThanOrEqual(0);
    expect(risk).toBeLessThanOrEqual(100);
  });
});
