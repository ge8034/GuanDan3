/**
 * 问题E详细分析：领牌时炸弹 vs 三张的策略选择
 */

import { describe, expect, it } from 'vitest';
import { evaluateMove } from '@/lib/game/ai-strategy';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('问题E详细分析', () => {
  it('炸弹7 vs 三张5的评分对比', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7), // 炸弹7
      createCard(5, 5), createCard(6, 5), createCard(7, 5), // 三张5
    ];

    // 测试炸弹选项
    const bombMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2], hand[3]] };
    const bombEvaluation = evaluateMove(bombMove, hand, null, 2, 'hard', true);

    // 测试三张选项
    const tripleMove = { type: 'play' as const, cards: [hand[4], hand[5], hand[6]] };
    const tripleEvaluation = evaluateMove(tripleMove, hand, null, 2, 'hard', true);

    console.log('\n=== 问题E：炸弹7 vs 三张5（领牌）===');
    console.log('炸弹评分:', bombEvaluation.score);
    console.log('炸弹推理:', bombEvaluation.reasoning);
    console.log('三张评分:', tripleEvaluation.score);
    console.log('三张推理:', tripleEvaluation.reasoning);

    console.log('\n策略分析:');
    console.log('- 出炸弹7：剩余3张（三张5），需要再一轮出完');
    console.log('- 出三张5：剩余4张（炸弹7），可以一次性出完');
    console.log('- 从快速出牌角度，三张5是更好的选择');

    if (tripleEvaluation.score > bombEvaluation.score) {
      console.log('✓ 三张评分更高，AI选择出三张是合理的');
    } else {
      console.log('⚠️ 炸弹评分更高，AI应该出炸弹');
    }
  });
});
