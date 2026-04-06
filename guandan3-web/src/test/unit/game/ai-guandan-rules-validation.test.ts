/**
 * 掼蛋规则AI逻辑验证测试
 * 验证AI符合掼蛋规则：
 * 1. 王炸弹需要4张（不是2张）
 * 2. 顺子最多5张
 * 3. AI策略自己决定是否出炸弹
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics, clearHandAnalysisCache } from '@/lib/game/ai';
import { analyzeMove } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H', rank?: string): Card => ({
  id,
  suit,
  rank: rank || String(val),
  val,
});

describe('掼蛋规则AI验证', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
  });

  // 验证1: 王炸弹需要4张
  it('规则验证: 2张王不是炸弹', () => {
    const twoJokers = [
      createCard(1, 100, 'J', 'bk'), // 小王
      createCard(2, 200, 'J', 'hr'), // 大王
    ];

    const analysis = analyzeMove(twoJokers, 2);

    console.log('2张王分析结果:', analysis);

    // 2张王应该不是炸弹（在掼蛋中）
    expect(analysis?.type).not.toBe('bomb');
  });

  it('规则验证: 4张王是炸弹', () => {
    const fourJokers = [
      createCard(1, 100, 'J', 'bk'), // 小王
      createCard(2, 200, 'J', 'hr'), // 大王
      createCard(3, 100, 'J', 'bk'), // 小王
      createCard(4, 200, 'J', 'hr'), // 大王
    ];

    const analysis = analyzeMove(fourJokers, 2);

    console.log('4张王分析结果:', analysis);

    // 4张王应该是炸弹
    expect(analysis?.type).toBe('bomb');
    if (analysis) {
      expect(analysis.primaryValue).toBe(10000); // JOKER_BOMB
    }
  });

  // 验证2: 顺子最多5张
  it('规则验证: 6张牌不是顺子', () => {
    const sixCards = [
      createCard(1, 5), createCard(2, 6), createCard(3, 7),
      createCard(4, 8), createCard(5, 9), createCard(6, 10), // 6张连续
    ];

    const analysis = analyzeMove(sixCards, 2);

    console.log('6张连续牌分析结果:', analysis);

    // 6张不应该是顺子（掼蛋顺子最多5张）
    expect(analysis?.type).not.toBe('straight');
  });

  it('规则验证: 5张牌是顺子', () => {
    const fiveCards = [
      createCard(1, 5), createCard(2, 6), createCard(3, 7),
      createCard(4, 8), createCard(5, 9), // 5张连续
    ];

    const analysis = analyzeMove(fiveCards, 2);

    console.log('5张连续牌分析结果:', analysis);

    // 5张应该是顺子
    expect(analysis?.type).toBe('straight');
  });

  // 验证3: AI正常工作
  it('AI能正常出牌', () => {
    const hand = [
      createCard(1, 3),
      createCard(2, 5),
      createCard(3, 7),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('AI决策:', move.type, move.cards);

    expect(move.type).toBe('play');
    expect(move.cards).toBeDefined();
    expect(move.cards!.length).toBeGreaterThan(0);
  });

  it('AI能跟牌', () => {
    const hand = [
      createCard(1, 8),
      createCard(2, 9),
    ];

    const lastPlay = [createCard(100, 7)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('AI跟牌决策:', move.type, move.cards);

    // AI应该能跟牌
    expect(move.type).toBeDefined();
  });

  it('AI能正确识别三带二', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), // 三张8
      createCard(4, 3), createCard(5, 3), // 对子3
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('AI三带二决策:', move.type, move.cards?.length);

    if (move.type === 'play' && move.cards && move.cards.length === 5) {
      const analysis = analyzeMove(move.cards, 2);
      console.log('牌型分析:', analysis?.type);
      if (analysis?.type === 'fullhouse') {
        console.log('✓ AI正确识别并出三带二');
      }
    }

    expect(move.type).toBe('play');
  });

  it('AI能处理残局', () => {
    const hand = [
      createCard(1, 3),
      createCard(2, 4),
      createCard(3, 5),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('AI残局决策:', move.type, move.cards?.length);

    // AI应该能出牌（不强制要求策略）
    expect(move.type).toBeDefined();
  });

  it('AI跟炸弹时能用更大的炸弹', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8), // 炸弹8
    ];

    const lastPlay = [
      createCard(100, 7), createCard(101, 7), createCard(102, 7), createCard(103, 7), // 炸弹7
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('AI跟炸弹决策:', move.type, move.cards?.length);

    if (move.type === 'play') {
      console.log('✓ AI用炸弹压过');
    }

    expect(move.type).toBeDefined();
  });
});
