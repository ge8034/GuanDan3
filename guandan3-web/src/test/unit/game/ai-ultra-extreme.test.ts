/**
 * AI 超极端边界情况测试 Phase 9
 * 目的：寻找深层次的AI问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics, clearHandAnalysisCache } from '@/lib/game/ai';
import { analyzeHand } from '@/lib/game/ai-pattern-recognition';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

const createCardWithRank = (id: number, val: number, suit: string, rank: string): Card => ({
  id,
  suit,
  rank,
  val,
});

describe('AI超极端边界情况测试 Phase 9', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
  });

  it('问题161：AI跟牌时手牌分析结果与实际不符', () => {
    // 检查analyzeHand是否正确识别所有牌型
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8), // 炸弹
      createCard(5, 3), createCard(6, 4), // 单张
    ];

    const analysis = analyzeHand(hand, 2);

    console.log('问题161: 手牌分析验证');
    console.log('手牌:', hand.map(c => c.val));
    console.log('单张数:', analysis.singles.length);
    console.log('对子数:', analysis.pairs.length);
    console.log('三张数:', analysis.triples.length);
    console.log('炸弹数:', analysis.bombs.length);

    // 应该有1个炸弹
    expect(analysis.bombs.length).toBeGreaterThanOrEqual(1);
  });

  it('问题162：AI跟牌时canBeat判断错误', () => {
    // 测试canBeat函数的边界情况
    const hand = [createCard(1, 14)]; // A
    const lastPlay = [createCard(100, 14)]; // A

    const move = analyzeMove(hand, 2);
    const lastMove = analyzeMove(lastPlay, 2);

    console.log('问题162: canBeat边界测试');
    console.log('A vs A:', move, lastMove);

    if (move && lastMove) {
      const canBeatResult = canBeat(move, lastMove);
      console.log('canBeat(A, A):', canBeatResult);
      // A不能压过A（必须更大）
      expect(canBeatResult).toBe(false);
    }
  });

  it('问题163：AI跟牌时上家出对子，AI有相同值的对子', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), // 对子8
    ];

    // 上家出了对子8
    const lastPlay = [
      createCard(100, 8), createCard(101, 8),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题163: 跟对子8，手牌有对子8');
    console.log('AI选择:', move.type);

    // 对子8不能压过对子8，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题164：AI跟牌时上家出三张，AI有相同值的三张', () => {
    const hand = [
      createCard(1, 9), createCard(2, 9), createCard(3, 9), // 三张9
    ];

    // 上家出了三张9
    const lastPlay = [
      createCard(100, 9), createCard(101, 9), createCard(102, 9),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题164: 跟三张9，手牌有三张9');
    console.log('AI选择:', move.type);

    // 三张9不能压过三张9，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题165：AI跟牌时上家出炸弹，AI有相同值的炸弹', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7), // 炸弹7
    ];

    // 上家出了炸弹7
    const lastPlay = [
      createCard(100, 7), createCard(101, 7), createCard(102, 7), createCard(103, 7),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题165: 跟炸弹7，手牌有炸弹7');
    console.log('AI选择:', move.type);

    // 炸弹7不能压过炸弹7，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题166：AI跟牌时手牌有顺子但长度不够', () => {
    const hand = [
      createCard(1, 5), createCard(2, 6), createCard(3, 7), createCard(4, 8), // 只有4张
    ];

    // 上家出了顺子3-4-5-6-7
    const lastPlay = [
      createCard(100, 3), createCard(101, 4), createCard(102, 5),
      createCard(103, 6), createCard(104, 7),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题166: 跟顺子3-7，手牌只有4张连续');
    console.log('AI选择:', move.type);

    // 4张不是有效顺子，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题167：AI跟牌时手牌有顺子但值太小', () => {
    const hand = [
      createCard(1, 3), createCard(2, 4), createCard(3, 5), createCard(4, 6), createCard(5, 7),
    ];

    // 上家出了顺子4-5-6-7-8
    const lastPlay = [
      createCard(100, 4), createCard(101, 5), createCard(102, 6),
      createCard(103, 7), createCard(104, 8),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题167: 跟顺子4-8，手牌顺子3-7');
    console.log('AI选择:', move.type);

    // 3-7小于4-8，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题168：AI跟牌时手牌有连对但长度不够', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7),
      createCard(3, 8), createCard(4, 8), // 只有2连对
    ];

    // 上家出了连对4-4-5-5-6-6（3连对）
    const lastPlay = [
      createCard(100, 4), createCard(101, 4),
      createCard(102, 5), createCard(103, 5),
      createCard(104, 6), createCard(105, 6),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题168: 跟3连对，手牌只有2连对');
    console.log('AI选择:', move.type);

    // 2连对不能压过3连对，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题169：AI跟牌时手牌有飞机但长度不够', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6),
      createCard(4, 7), createCard(5, 7), createCard(6, 7), // 2连飞机
    ];

    // 上家出了3连飞机4-5-6
    const lastPlay = [
      createCard(100, 4), createCard(101, 4), createCard(102, 4),
      createCard(103, 5), createCard(104, 5), createCard(105, 5),
      createCard(106, 6), createCard(107, 6), createCard(108, 6),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题169: 跟3连飞机，手牌只有2连飞机');
    console.log('AI选择:', move.type);

    // 2连飞机不能压过3连飞机，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题170：AI跟牌时用炸弹压过三带二', () => {
    const hand = [
      createCard(1, 6), createCard(2, 6), createCard(3, 6), createCard(4, 6), // 炸弹
    ];

    // 上家出了三带二
    const lastPlay = [
      createCard(100, 5), createCard(101, 5), createCard(102, 5),
      createCard(103, 2), createCard(104, 2),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题170: 跟三带二，有炸弹');
    console.log('AI选择:', move.type);

    // 炸弹可以压过三带二
    expect(move.type).toBe('play');
  });

  it('问题171：AI跟牌时用炸弹压过顺子', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹
    ];

    // 上家出了顺子3-4-5-6-7
    const lastPlay = [
      createCard(100, 3), createCard(101, 4), createCard(102, 5),
      createCard(103, 6), createCard(104, 7),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题171: 跟顺子，有炸弹');
    console.log('AI选择:', move.type);

    // 炸弹可以压过顺子
    expect(move.type).toBe('play');
  });

  it('问题172：AI领牌时手牌有多个炸弹', () => {
    const hand = [
      createCard(1, 4), createCard(2, 4), createCard(3, 4), createCard(4, 4),
      createCard(5, 5), createCard(6, 5), createCard(7, 5), createCard(8, 5),
      createCard(9, 6), createCard(10, 6), createCard(11, 6), createCard(12, 6),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('问题172: 领牌，有多个炸弹');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该出最小的炸弹
    expect(move.type).toBe('play');
    if (move.cards && move.cards.length === 4) {
      expect(move.cards[0].val).toBe(4);
    }
  });

  it('问题173：AI跟牌时手牌只剩炸弹，必须出', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7),
    ];

    // 上家出了K
    const lastPlay = [createCard(100, 13)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题173: 跟K，只剩炸弹');
    console.log('AI选择:', move.type);

    // 必须用炸弹压过
    expect(move.type).toBe('play');
  });

  it('问题174：AI跟牌时手牌只剩炸弹但比上家小', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),
    ];

    // 上家出了炸弹6
    const lastPlay = [
      createCard(100, 6), createCard(101, 6), createCard(102, 6), createCard(103, 6),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题174: 跟炸弹6，只剩炸弹5');
    console.log('AI选择:', move.type);

    // 炸弹5不能压过炸弹6，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题175：AI领牌时手牌有四张相同但不够炸弹', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), createCard(4, 8),
      createCard(5, 3),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('问题175: 领牌，有四张相同但还有单张');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI可以选择出单张或炸弹
    expect(move.type).toBe('play');
  });

  it('问题176：AI跟牌时需要拆对子出单张', () => {
    const hand = [
      createCard(1, 9), createCard(2, 9), // 对子9
    ];

    // 上家出了8
    const lastPlay = [createCard(100, 8)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题176: 跟单张8，只有对子9');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI需要拆对子出单张
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(1);
  });

  it('问题177：AI跟牌时需要拆三张出单张', () => {
    const hand = [
      createCard(1, 10), createCard(2, 10), createCard(3, 10), // 三张10
    ];

    // 上家出了9
    const lastPlay = [createCard(100, 9)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题177: 跟单张9，只有三张10');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI需要拆三张出单张
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(1);
  });

  it('问题178：AI跟牌时需要拆炸弹出单张', () => {
    const hand = [
      createCard(1, 11), createCard(2, 11), createCard(3, 11), createCard(4, 11), // 炸弹11
    ];

    // 上家出了10
    const lastPlay = [createCard(100, 10)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题178: 跟单张10，只有炸弹11');
    console.log('AI选择:', move.type, move.cards?.length);

    // AI需要拆炸弹出单张
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(1);
  });

  it('问题179：AI跟牌时上家出三带二，AI只有三张', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8), // 三张8
    ];

    // 上家出了三带二
    const lastPlay = [
      createCard(100, 5), createCard(101, 5), createCard(102, 5),
      createCard(103, 2), createCard(104, 2),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题179: 跟三带二，只有三张');
    console.log('AI选择:', move.type);

    // 三张不能压过三带二，AI应该pass
    expect(move.type).toBe('pass');
  });

  it('问题180：AI跟牌时上家出三带二，AI只有对子', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), // 对子7
    ];

    // 上家出了三带二
    const lastPlay = [
      createCard(100, 5), createCard(101, 5), createCard(102, 5),
      createCard(103, 2), createCard(104, 2),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('问题180: 跟三带二，只有对子');
    console.log('AI选择:', move.type);

    // 对子不能压过三带二，AI应该pass
    expect(move.type).toBe('pass');
  });
});
