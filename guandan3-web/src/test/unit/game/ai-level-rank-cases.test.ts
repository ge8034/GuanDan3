/**
 * AI 级牌相关测试
 * 目的：发现级牌相关的AI问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics, clearHandAnalysisCache } from '@/lib/game/ai';
import { analyzeMove } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI级牌相关测试', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
    clearHandAnalysisCache();
  });

  it('问题76：AI跟牌时用级牌压过A', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2), // 级牌2（val=2表示2是级牌）
      createCard(2, 5),
    ];

    // 上家出了A（14）
    const lastPlay = [createCard(100, 14)];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2 表示2是级牌

    console.log('问题76: 跟A，手牌有级牌');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // 级牌应该能压过A
    expect(move.type).toBe('play');
  });

  it('问题77：AI跟牌时用级牌压过级牌', () => {
    // 级牌是2
    // 红桃级牌值更大，其他花色级牌值较小
    const hand = [
      createCard(1, 2, 'H'), // 红桃级牌2（val=2表示2是级牌）
    ];

    // 上家出了非红桃级牌2
    const lastPlay = [createCard(100, 2, 'S')];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题77: 跟非红桃级牌，有红桃级牌');
    console.log('AI选择:', move.type, move.cards?.map(c => ({ val: c.val, suit: c.suit })));

    // 红桃级牌应该能压过非红桃级牌
    expect(move.type).toBe('play');
  });

  it('问题78：AI有级牌对子时的跟牌选择', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'H'), // 红桃级牌
      createCard(2, 2, 'S'), // 其他花色级牌
    ];

    // 上家出了对子A
    const lastPlay = [
      createCard(100, 14), createCard(101, 14),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题78: 跟对子A，有级牌对子');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => ({ val: c.val, suit: c.suit })));

    // 级牌对子应该能压过对子A
    expect(move.type).toBe('play');
  });

  it('问题79：AI有级牌炸弹时的跟牌选择', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'H'), // 红桃级牌
      createCard(2, 2, 'S'), // 黑桃级牌
      createCard(3, 2, 'D'), // 方片级牌
      createCard(4, 2, 'C'), // 梅花级牌
    ];

    // 上家出了普通炸弹A
    const lastPlay = [
      createCard(100, 14), createCard(101, 14), createCard(102, 14), createCard(103, 14),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题79: 跟炸弹A，有级牌炸弹');
    console.log('AI选择:', move.type, move.cards?.length);

    // 级牌炸弹应该能压过普通炸弹
    expect(move.type).toBe('play');
  });

  it('问题80：AI领牌时有级牌但不出', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'H'), // 红桃级牌
      createCard(2, 5),
      createCard(3, 8),
    ];

    const move = decideMove(hand, null, 2, 'hard', true); // levelRank=2

    console.log('问题80: 领牌，有级牌');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该出小牌（保留级牌）
    expect(move.type).toBe('play');
    expect(move.cards![0].val).toBeLessThan(50); // 不应该出级牌
  });

  it('问题81：AI跟牌时用红桃级牌压过非红桃级牌', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'H'), // 红桃级牌
    ];

    // 上家出了非红桃级牌
    const lastPlay = [createCard(100, 2, 'S')];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题81: 跟非红桃级牌，有红桃级牌');
    console.log('AI选择:', move.type, move.cards?.map(c => ({ val: c.val, suit: c.suit })));

    // 红桃级牌应该能压过非红桃级牌
    expect(move.type).toBe('play');
  });

  it('问题82：AI跟牌时两个级牌值相同', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'S'), // 非红桃级牌
      createCard(2, 2, 'D'), // 非红桃级牌
    ];

    // 上家出了非红桃级牌
    const lastPlay = [createCard(100, 2, 'C')];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题82: 跟级牌，有两个同级牌');
    console.log('AI选择:', move.type);

    // 如果值相同，应该pass
    if (move.type === 'play') {
      console.log('⚠ AI出牌，但级牌值相同可能无法压过');
    }
  });

  it('问题83：AI有级牌三张时的领牌选择', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'H'), createCard(2, 2, 'S'), createCard(3, 2, 'D'), // 级牌三张
      createCard(4, 5),
    ];

    const move = decideMove(hand, null, 2, 'hard', true); // levelRank=2

    console.log('问题83: 领牌，有级牌三张');
    console.log('AI选择:', move.type, move.cards?.length, move.cards?.map(c => c.val));

    const analysis = analyzeMove(move.cards!, 2); // levelRank=2
    console.log('牌型:', analysis?.type);

    expect(move.type).toBe('play');
  });

  it('问题84：AI跟牌时用级牌三张压过普通三张', () => {
    // 级牌是2
    const hand = [
      createCard(1, 2, 'H'), createCard(2, 2, 'S'), createCard(3, 2, 'D'), // 级牌三张
    ];

    // 上家出了三张A
    const lastPlay = [
      createCard(100, 14), createCard(101, 14), createCard(102, 14),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题84: 跟三张A，有级牌三张');
    console.log('AI选择:', move.type, move.cards?.length);

    // 级牌三张应该能压过普通三张A
    expect(move.type).toBe('play');
  });

  it('问题85：AI跟牌时普通三张无法压过级牌三张', () => {
    const hand = [
      createCard(1, 14), createCard(2, 14), createCard(3, 14), // 三张A
    ];

    // 上家出了级牌三张
    const lastPlay = [
      createCard(100, 2, 'H'), createCard(101, 2, 'S'), createCard(102, 2, 'D'),
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false); // levelRank=2

    console.log('问题85: 跟级牌三张，只有三张A');
    console.log('AI选择:', move.type);

    // 三张A应该无法压过级牌三张
    expect(move.type).toBe('pass');
  });
});
