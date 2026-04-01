/**
 * AI 问题BD/BF分析：三带二/飞机评分问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { evaluateMove } from '@/lib/game/ai-strategy';
import { analyzeMove } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI问题BD/BF详细分析', () => {
  /**
   * 问题BD深入分析：三张vs三带二的评分
   */
  it('问题BD详细分析：三张vs三带二评分对比', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5),  // 三张5
      createCard(4, 6), createCard(5, 6),  // 对子6
    ];

    // 三张5
    const tripleMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2]] };
    // 三带二(5+6)
    const fullHouseMove = { type: 'play' as const, cards: hand };

    const tripleEval = evaluateMove(tripleMove, hand, null, 2, 'hard', true);
    const fullHouseEval = evaluateMove(fullHouseMove, hand, null, 2, 'hard', true);

    console.log('\n=== 问题BD详细分析：三张vs三带二 ===');
    console.log('三张5评分:', tripleEval.score);
    console.log('三张5推理:', tripleEval.reasoning);
    console.log('三带二(5+6)评分:', fullHouseEval.score);
    console.log('三带二推理:', fullHouseEval.reasoning);

    // 分析评分差异：
    // 三张5：500-25+80+45-25=575（约）
    // 三带二：500-25+75-25=525（约）

    // 问题：三带二的bonus不够高
    // 三张bonus(80) > 三带二bonus(75)

    if (tripleEval.score > fullHouseEval.score) {
      console.log('⚠️ 问题BD：三张评分更高，AI选择三张而不是三带二');
      console.log('   原因：三张bonus(80) > 三带二bonus(75)');
      console.log('   影响：出3张剩2张，需要2轮；出三带二直接出5张');
      console.log('   建议：增加三带二bonus或减少三张bonus');
    } else {
      console.log('✓ 三带二评分更高，AI正确选择');
    }
  });

  /**
   * 问题BF深入分析：三张vs飞机的评分
   */
  it('问题BF详细分析：三张vs飞机评分对比', () => {
    const hand = [
      createCard(1, 3), createCard(2, 3), createCard(3, 3),
      createCard(4, 4), createCard(5, 4), createCard(6, 4),  // 飞机3344
      createCard(7, 10),  // 单张10
    ];

    // 飞机3344
    const planeMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2], hand[3], hand[4], hand[5]] };
    // 三张3
    const tripleMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2]] };

    const planeEval = evaluateMove(planeMove, hand, null, 2, 'hard', true);
    const tripleEval = evaluateMove(tripleMove, hand, null, 2, 'hard', true);

    console.log('\n=== 问题BF详细分析：三张vs飞机 ===');
    console.log('飞机(6张)评分:', planeEval.score);
    console.log('飞机推理:', planeEval.reasoning);
    console.log('三张(3张)评分:', tripleEval.score);
    console.log('三张推理:', tripleEval.reasoning);

    // 飞机应该有更高评分，因为出6张比出3张快得多
    if (planeEval.score > tripleEval.score) {
      console.log('✓ 飞机评分更高，AI正确选择');
    } else {
      console.log('⚠️ 问题BF：三张评分更高，AI选择三张而不是飞机');
      console.log('   建议：增加长牌型（飞机、连对等）的bonus');
    }
  });

  /**
   * 问题BD/BF修复后的预期行为
   */
  it('问题BD/BF修复后的预期评分', () => {
    console.log('\n=== 修复建议 ===');
    console.log('1. 三带二应该比三张有更高评分');
    console.log('   - 三带二一次出5张，剩下0张');
    console.log('   - 三张一次出3张，剩下对子需要再一轮');
    console.log('   - 建议：三带二bonus = 100（高于三张的80）');
    console.log('');
    console.log('2. 飞机应该比三张有更高评分');
    console.log('   - 飞机一次出6张');
    console.log('   - 三张一次出3张');
    console.log('   - 建议：飞机bonus = 150（远高于三张的80）');
  });

  /**
   * 验证当前评分系统的其他问题
   */
  it('验证当前评分系统', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5),  // 三张5
      createCard(4, 6), createCard(5, 6),  // 对子6
    ];

    // 评估各种牌型
    const triple5Move = { type: 'play' as const, cards: [hand[0], hand[1], hand[2]] };
    const pair6Move = { type: 'play' as const, cards: [hand[3], hand[4]] };
    const fullHouseMove = { type: 'play' as const, cards: hand };

    const triple5Eval = evaluateMove(triple5Move, hand, null, 2, 'hard', true);
    const pair6Eval = evaluateMove(pair6Move, hand, null, 2, 'hard', true);
    const fullHouseEval = evaluateMove(fullHouseMove, hand, null, 2, 'hard', true);

    console.log('\n=== 当前评分系统 ===');
    console.log('三张5:', triple5Eval.score);
    console.log('对子6:', pair6Eval.score);
    console.log('三带二(5+6):', fullHouseEval.score);

    // 理想评分排序：三带二 > 三张 > 对子
    // 当前实际排序可能是：三张 > 对子 > 三带二（或类似）
  });
});
