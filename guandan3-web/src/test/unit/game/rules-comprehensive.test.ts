/**
 * 掼蛋规则全面验证测试
 *
 * 确保只有符合掼蛋规则的牌型被识别为有效，
 * 所有规则以外的牌型都应该返回 null
 */

import { describe, expect, it } from 'vitest';
import { analyzeMove } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const c = (card: Partial<Card>): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...card,
});

describe('掼蛋规则全面验证 - 确保规则外牌型皆为无效', () => {
  const levelRank = 7; // 级牌设为7，避免与测试牌冲突

  describe('应该有效的牌型', () => {
    it('单张', () => {
      const result = analyzeMove(
        [c({ suit: 'S', rank: '5', val: 5, id: 1 })],
        levelRank
      );
      expect(result?.type).toBe('single');
    });

    it('对子', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '5', val: 5, id: 2 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('pair');
    });

    it('三张', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '5', val: 5, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('triple');
    });

    it('三带二', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '5', val: 5, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '3', val: 3, id: 4 }),
          c({ suit: 'S', rank: '3', val: 3, id: 5 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('fullhouse');
    });

    it('顺子（5张连续单牌）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '4', val: 4, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '6', val: 6, id: 4 }),
          c({ suit: 'S', rank: '7', val: 7, id: 5 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('straight');
    });

    it('连对（3连对）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '4', val: 4, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
          c({ suit: 'S', rank: '5', val: 5, id: 5 }),
          c({ suit: 'D', rank: '5', val: 5, id: 6 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('sequencePairs');
    });

    it('飞机（连续三张，不带翅膀）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '3', val: 3, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
          c({ suit: 'S', rank: '4', val: 4, id: 5 }),
          c({ suit: 'D', rank: '4', val: 4, id: 6 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('sequenceTriples');
    });

    it('炸弹（4张相同）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '5', val: 5, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '5', val: 5, id: 4 }),
        ],
        levelRank
      );
      expect(result?.type).toBe('bomb');
    });
  });

  describe('应该无效的牌型 - 规则以外皆为无效', () => {
    it('无效：三张K+三张A+4张单牌（翅膀数量不对）', () => {
      // 三张K(13) + 三张A(14) 是连续的，构成飞机
      // 但4张单牌不是2张单牌，也不是2个对子
      const result = analyzeMove(
        [
          // 三张K
          c({ suit: 'S', rank: 'K', val: 13, id: 1 }),
          c({ suit: 'D', rank: 'K', val: 13, id: 2 }),
          c({ suit: 'C', rank: 'K', val: 13, id: 3 }),
          // 三张A
          c({ suit: 'H', rank: 'A', val: 14, id: 4 }),
          c({ suit: 'S', rank: 'A', val: 14, id: 5 }),
          c({ suit: 'D', rank: 'A', val: 14, id: 6 }),
          // 4张单牌 - 不是有效翅膀
          c({ suit: 'C', rank: '6', val: 6, id: 7 }),
          c({ suit: 'H', rank: '3', val: 3, id: 8 }),
          c({ suit: 'S', rank: '8', val: 8, id: 9 }),
          c({ suit: 'D', rank: '4', val: 4, id: 10 }),
        ],
        levelRank
      );
      // 应该返回null，因为这是无效牌型
      expect(result).toBeNull();
    });

    it('无效：两张不同牌', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '6', val: 6, id: 2 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：三张不同牌', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '6', val: 6, id: 2 }),
          c({ suit: 'C', rank: '7', val: 7, id: 3 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：4张不连续的单牌（不是顺子）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '4', val: 4, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '7', val: 7, id: 4 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：含王的顺子', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '4', val: 4, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '6', val: 6, id: 4 }),
          c({ suit: 'J', rank: 'sb', val: 100, id: 5 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：2连对（最少3连对）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '4', val: 4, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：不连续的连对', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '4', val: 4, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
          c({ suit: 'S', rank: '5', val: 5, id: 5 }),
          c({ suit: 'D', rank: '5', val: 5, id: 6 }),
          c({ suit: 'C', rank: '7', val: 7, id: 7 }),
          c({ suit: 'H', rank: '7', val: 7, id: 8 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：不连续的三张（不是飞机）', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '3', val: 3, id: 3 }),
          c({ suit: 'H', rank: '5', val: 5, id: 4 }),
          c({ suit: 'S', rank: '5', val: 5, id: 5 }),
          c({ suit: 'D', rank: '5', val: 5, id: 6 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：飞机翅膀数量不对（3张单牌应该是2张）', () => {
      const result = analyzeMove(
        [
          // 两个连续三张
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '3', val: 3, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
          c({ suit: 'S', rank: '4', val: 4, id: 5 }),
          c({ suit: 'D', rank: '4', val: 4, id: 6 }),
          // 3张单牌翅膀 - 应该是2张
          c({ suit: 'C', rank: '6', val: 6, id: 7 }),
          c({ suit: 'H', rank: '8', val: 8, id: 8 }),
          c({ suit: 'S', rank: '9', val: 9, id: 9 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：飞机带对子翅膀但翅膀不是对子', () => {
      const result = analyzeMove(
        [
          // 两个连续三张
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '3', val: 3, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
          c({ suit: 'S', rank: '4', val: 4, id: 5 }),
          c({ suit: 'D', rank: '4', val: 4, id: 6 }),
          // 4张翅膀但不是2个对子
          c({ suit: 'C', rank: '6', val: 6, id: 7 }),
          c({ suit: 'H', rank: '6', val: 6, id: 8 }),
          c({ suit: 'S', rank: '8', val: 8, id: 9 }),
          c({ suit: 'D', rank: '9', val: 9, id: 10 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：飞机带对子翅膀但翅膀数量不对（3张）', () => {
      const result = analyzeMove(
        [
          // 两个连续三张
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '3', val: 3, id: 2 }),
          c({ suit: 'C', rank: '3', val: 3, id: 3 }),
          c({ suit: 'H', rank: '4', val: 4, id: 4 }),
          c({ suit: 'S', rank: '4', val: 4, id: 5 }),
          c({ suit: 'D', rank: '4', val: 4, id: 6 }),
          // 只有3张翅膀，应该是4张（2个对子）
          c({ suit: 'C', rank: '6', val: 6, id: 7 }),
          c({ suit: 'H', rank: '6', val: 6, id: 8 }),
          c({ suit: 'S', rank: '8', val: 8, id: 9 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：三带二但不是三张+对子', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '5', val: 5, id: 1 }),
          c({ suit: 'D', rank: '5', val: 5, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '3', val: 3, id: 4 }),
          c({ suit: 'S', rank: '4', val: 4, id: 5 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });

    it('无效：少于5张的顺子', () => {
      const result = analyzeMove(
        [
          c({ suit: 'S', rank: '3', val: 3, id: 1 }),
          c({ suit: 'D', rank: '4', val: 4, id: 2 }),
          c({ suit: 'C', rank: '5', val: 5, id: 3 }),
          c({ suit: 'H', rank: '6', val: 6, id: 4 }),
        ],
        levelRank
      );
      expect(result).toBeNull();
    });
  });
});
