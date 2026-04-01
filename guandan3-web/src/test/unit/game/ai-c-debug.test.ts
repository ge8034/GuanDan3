/**
 * 问题C详细调试
 */

import { describe, expect, it } from 'vitest';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import { analyzeHand } from '@/lib/game/ai-pattern-recognition';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('问题C详细调试', () => {
  it('分析炸弹5的手牌组合', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹5
    ];

    const analysis = analyzeHand(hand, 2);

    console.log('\n=== 炸弹5的手牌分析 ===');
    console.log('单张数量:', analysis.singles.length);
    console.log('对子数量:', analysis.pairs.length);
    console.log('三张数量:', analysis.triples.length);
    console.log('炸弹数量:', analysis.bombs.length);

    console.log('\n炸弹组合:');
    analysis.bombs.forEach(bomb => {
      const move = analyzeMove(bomb, 2);
      console.log(`  ${bomb.map(c => c.val).join(',')} -> ${move?.type}, primaryValue=${move?.primaryValue}`);
    });

    // 上家出顺子（掼蛋规则：顺子最少5张）
    const lastPlay = [
      createCard(100, 3), createCard(101, 4), createCard(102, 5), createCard(103, 6), createCard(104, 7),
    ];
    const lastMove = analyzeMove(lastPlay, 2);

    console.log('\n上家顺子34567:', lastMove);

    console.log('\n检查哪些组合能压过顺子:');
    analysis.bombs.forEach(bomb => {
      const move = analyzeMove(bomb, 2);
      if (move) {
        const can = canBeat(move, lastMove!);
        console.log(`  炸弹${bomb.map(c => c.val).join(',')}: ${can}`);
      }
    });

    analysis.pairs.forEach(pair => {
      const move = analyzeMove(pair, 2);
      if (move) {
        const can = canBeat(move, lastMove!);
        console.log(`  对子${pair.map(c => c.val).join(',')}: ${can}`);
      }
    });
  });
});
