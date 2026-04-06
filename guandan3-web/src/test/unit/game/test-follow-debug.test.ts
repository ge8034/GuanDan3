/**
 * 调试：AI跟牌时有其他能压过的牌但选择pass
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { clearPerformanceMetrics } from '@/lib/game/ai';
import { analyzeHand } from '@/lib/game/ai-pattern-recognition';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import { decideMove } from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('DEBUG: AI跟牌问题', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  it('调试问题101：跟三张8，手牌有三张8和单张9', () => {
    const hand = [
      createCard(1, 8), createCard(2, 8), createCard(3, 8),
      createCard(4, 9),
    ];

    const lastPlay = [
      createCard(100, 8), createCard(101, 8), createCard(102, 8),
    ];

    console.log('\n=== 问题101分析 ===');
    console.log('AI手牌:', hand.map(c => c.val));
    console.log('上家出牌:', lastPlay.map(c => c.val));

    // 分析手牌
    const analysis = analyzeHand(hand, 2);
    console.log('\n手牌分析:');
    console.log('- 单张:', analysis.singles.map(s => s.map(c => c.val).join(',')));
    console.log('- 对子:', analysis.pairs.map(p => p.map(c => c.val).join(',')));
    console.log('- 三张:', analysis.triples.map(t => t.map(c => c.val).join(',')));

    // 分析上家出牌
    const lastMove = analyzeMove(lastPlay, 2);
    console.log('\n上家牌型:', lastMove);

    // 检查单张9能否压过三张8
    const single9Move = analyzeMove([hand[3]], 2);
    console.log('\n单张9牌型:', single9Move);
    if (single9Move && lastMove) {
      const canBeatResult = canBeat(single9Move, lastMove);
      console.log('canBeat(单张9, 三张8):', canBeatResult);
    }

    const move = decideMove(hand, lastPlay, 2, 'hard', false);
    console.log('\nAI决策:', move.type, move.cards);

    // 分析为什么AI选择pass
    console.log('\n=== 问题分析 ===');
    if (move.type === 'pass') {
      console.log('⚠ AI选择pass，但有单张9能压过');
      console.log('   可能原因：AI没有考虑单张选项');
    }
  });

  it('调试问题113：跟对子7，手牌有对子7和单张9', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7),
      createCard(3, 9),
    ];

    const lastPlay = [
      createCard(100, 7), createCard(101, 7),
    ];

    console.log('\n=== 问题113分析 ===');
    console.log('AI手牌:', hand.map(c => c.val));
    console.log('上家出牌:', lastPlay.map(c => c.val));

    // 分析手牌
    const analysis = analyzeHand(hand, 2);
    console.log('\n手牌分析:');
    console.log('- 单张:', analysis.singles.map(s => s.map(c => c.val).join(',')));
    console.log('- 对子:', analysis.pairs.map(p => p.map(c => c.val).join(',')));

    // 分析上家出牌
    const lastMove = analyzeMove(lastPlay, 2);
    console.log('\n上家牌型:', lastMove);

    // 检查单张9能否压过对子7
    const single9Move = analyzeMove([hand[2]], 2);
    console.log('\n单张9牌型:', single9Move);
    if (single9Move && lastMove) {
      const canBeatResult = canBeat(single9Move, lastMove);
      console.log('canBeat(单张9, 对子7):', canBeatResult);
    }

    const move = decideMove(hand, lastPlay, 2, 'hard', false);
    console.log('\nAI决策:', move.type, move.cards);

    console.log('\n=== 问题分析 ===');
    if (move.type === 'pass') {
      console.log('⚠ AI选择pass，但有单张9能压过');
      console.log('   这是一个AI问题！');
    }
  });
});
