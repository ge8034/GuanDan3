/**
 * AI 评分系统分析测试
 *
 * 分析AI评分函数中的问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { evaluateMove } from '@/lib/game/ai-strategy';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI评分系统分析测试', () => {
  /**
   * 问题K深入分析：领牌时primaryValue bonus的问题
   *
   * 当前公式：score += 500 - actualValue * 5
   * 问题：actualValue越大，bonus越小
   * 这导致级牌对子的评分反而比普通单张低
   */
  it('问题K深入分析：primaryValue bonus计算问题', () => {
    const hand = [
      createCard(1, 2, 'S'),  // 级牌2
      createCard(2, 2, 'H'),  // 级牌2（红桃）
      createCard(3, 10),     // 普通单张10
    ];

    const levelRank = 2;

    // 级牌对子2
    const pair2Move = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const pair2Eval = evaluateMove(pair2Move, hand, null, levelRank, 'hard', true);

    // 普通单张10
    const single10Move = { type: 'play' as const, cards: [hand[2]] };
    const single10Eval = evaluateMove(single10Move, hand, null, levelRank, 'hard', true);

    console.log('\n=== 问题K深入分析 ===');
    console.log('级牌对子2评分:', pair2Eval.score);
    console.log('级牌对子2推理:', pair2Eval.reasoning);
    console.log('普通单张10评分:', single10Eval.score);
    console.log('普通单张10推理:', single10Eval.reasoning);

    // 分析评分差异
    const pairBonusMatch = pair2Eval.reasoning.match(/Primary value bonus: ([\-\d.]+)/);
    const singleBonusMatch = single10Eval.reasoning.match(/Primary value bonus: ([\-\d.]+)/);

    if (pairBonusMatch && singleBonusMatch) {
      const pairBonus = parseFloat(pairBonusMatch[1]);
      const singleBonus = parseFloat(singleBonusMatch[1]);

      console.log('\n评分分析:');
      console.log(`级牌对子2的primaryValue bonus: ${pairBonus}`);
      console.log(`普通单张10的primaryValue bonus: ${singleBonus}`);
      console.log(`差异: ${singleBonus - pairBonus}`);

      // 问题：级牌的主值是60，所以bonus = 500 - 60*5 = 200
      // 单张10的主值是10，所以bonus = 500 - 10*5 = 450
      // 级牌bonus反而更低！
    }

    // 领牌时，对子应该优先于单张，因为：
    // 1. 对子bonus: +50
    // 2. 多张牌bonus: +30 vs +15
    // 3. 快速出牌（剩下1张 vs 剩下2张）

    // 但当前评分系统中，primaryValue bonus的差异(450-200=250)抵消了对子bonus

    console.log('\n问题根源:');
    console.log('公式: score += 500 - actualValue * 5');
    console.log('- 对子2: actualValue=60, bonus=200');
    console.log('- 单张10: actualValue=10, bonus=450');
    console.log('- 级牌bonus反而更低，这是问题！');
  });

  /**
   * 问题U：不同级牌时的评分一致性
   */
  it('问题U：不同级牌时的评分一致性', () => {
    const hand2 = [
      createCard(1, 2, 'S'), createCard(2, 2, 'H'),
      createCard(3, 5),
    ];

    const hand14 = [
      createCard(1, 14, 'S'), createCard(2, 14, 'H'),
      createCard(3, 5),
    ];

    // 级牌2时的对子2
    const pair2Eval_level2 = evaluateMove(
      { type: 'play' as const, cards: [hand2[0], hand2[1]] },
      hand2, null, 2, 'hard', true
    );

    // 级牌A时的对子A
    const pair14Eval_level14 = evaluateMove(
      { type: 'play' as const, cards: [hand14[0], hand14[1]] },
      hand14, null, 14, 'hard', true
    );

    console.log('\n=== 问题U：不同级牌时的评分 ===');
    console.log('级牌2时，对子2评分:', pair2Eval_level2.score);
    console.log('级牌A时，对子A评分:', pair14Eval_level14.score);

    // 级牌不同，评分应该相似（都是级牌对子）
    // 但由于primaryValue不同，评分会有差异
  });

  /**
   * 问题V：同张数不同牌值的评分
   */
  it('问题V：同张数不同牌值的评分对比', () => {
    const hand = [
      createCard(1, 3), createCard(2, 3),  // 对子3
      createCard(3, 14), createCard(4, 14),  // 对子A
      createCard(5, 7),  // 单张7
    ];

    const pair3Move = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const pair14Move = { type: 'play' as const, cards: [hand[2], hand[3]] };
    const single7Move = { type: 'play' as const, cards: [hand[4]] };

    const pair3Eval = evaluateMove(pair3Move, hand, null, 2, 'hard', true);
    const pair14Eval = evaluateMove(pair14Move, hand, null, 2, 'hard', true);
    const single7Eval = evaluateMove(single7Move, hand, null, 2, 'hard', true);

    console.log('\n=== 问题V：同张数不同牌值的评分 ===');
    console.log('对子3评分:', pair3Eval.score);
    console.log('对子A评分:', pair14Eval.score);
    console.log('单张7评分:', single7Eval.score);

    // 领牌时：小牌bonus更高（500 - val*5）
    // 对子3: 500 - 3*5 = 485
    // 对子A: 500 - 14*5 = 430
    // 单张7: 500 - 7*5 = 465

    // 加上对子bonus(50)和牌数bonus后:
    // 对子3: 485 + 50 + 30 = 565
    // 对子A: 430 + 50 + 30 = 510
    // 单张7: 465 + 15 = 480

    // 评分: 对子3 > 对子A > 单张7
    // 这是正确的，因为领牌时应该出小牌

    console.log('✓ 小牌评分更高，领牌时出小牌是正确的');
  });

  /**
   * 问题W：跟牌时的评分一致性
   */
  it('问题W：跟牌时的评分一致性', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5),  // 对子5
      createCard(3, 8), createCard(4, 8),  // 对子8
    ];

    const lastPlay = [createCard(100, 4), createCard(101, 4)];  // 上家出对子4

    const pair5Move = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const pair8Move = { type: 'play' as const, cards: [hand[2], hand[3]] };

    const pair5Eval = evaluateMove(pair5Move, hand, lastPlay, 2, 'hard', false);
    const pair8Eval = evaluateMove(pair8Move, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题W：跟牌时的评分 ===');
    console.log('对子5评分:', pair5Eval.score);
    console.log('对子8评分:', pair8Eval.score);

    // 跟牌时：应该用最小的能压过的牌
    // 对子5能压过对子4，应该优先选择
    // 评分: 对子5 > 对子8（因为actualValue更小，bonus更高）

    if (pair5Eval.score > pair8Eval.score) {
      console.log('✓ 对子5评分更高，AI会正确选择对子5');
    } else {
      console.log('⚠️ 问题W：对子8评分更高，AI可能错误选择');
    }
  });

  /**
   * 问题X：级牌对子的特殊处理
   */
  it('问题X：级牌对子vs普通对子的评分', () => {
    const hand = [
      createCard(1, 2, 'S'), createCard(2, 2, 'H'),  // 级牌对子2
      createCard(3, 10), createCard(4, 10),  // 普通对子10
    ];

    const levelRank = 2;

    const levelPair2Move = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const normalPair10Move = { type: 'play' as const, cards: [hand[2], hand[3]] };

    const levelPair2Eval = evaluateMove(levelPair2Move, hand, null, levelRank, 'hard', true);
    const normalPair10Eval = evaluateMove(normalPair10Move, hand, null, levelRank, 'hard', true);

    console.log('\n=== 问题X：级牌对子vs普通对子 ===');
    console.log('级牌对子2评分:', levelPair2Eval.score);
    console.log('普通对子10评分:', normalPair10Eval.score);

    // 级牌对子2应该有额外优势（级牌 > 普通牌）
    // 但当前评分系统中：
    // - 级牌对子2: actualValue=60, bonus=200
    // - 普通对子10: actualValue=10, bonus=450
    // 级牌bonus反而更低！

    // 这导致了问题K：级牌对子评分低于普通单张

    if (levelPair2Eval.score > normalPair10Eval.score) {
      console.log('✓ 级牌对子评分更高，正确');
    } else {
      console.log('⚠️ 问题X：普通对子评分更高，级牌对子没有优势');
    }
  });

  /**
   * 问题Y：级牌在掼蛋中的特殊地位
   */
  it('问题Y：级牌在掼蛋中的特殊地位分析', () => {
    console.log('\n=== 问题Y：级牌在掼蛋中的特殊地位 ===');
    console.log('掼蛋规则：');
    console.log('- 级牌 > A > K > Q > J > 10 > ... > 2');
    console.log('- 红桃级牌是"逢人配"，可以当任何牌使用');
    console.log('- 级牌炸弹 > 普通炸弹');
    console.log('');
    console.log('AI评分系统应该体现级牌的特殊地位：');
    console.log('1. 级牌对子应该有额外加分');
    console.log('2. 级牌三张应该有额外加分');
    console.log('3. 级牌炸弹应该有额外加分');
    console.log('');
    console.log('当前问题：');
    console.log('primaryValue bonus公式 (500 - actualValue*5) 对级牌不利');
    console.log('- 级牌actualValue=50/60，bonus很低(200/250)');
    console.log('- 普通牌actualValue=2-14，bonus较高(430-490)');
    console.log('');
    console.log('建议修复：');
    console.log('1. 为级牌牌型添加额外加分');
    console.log('2. 或者修改primaryValue bonus公式');
  });

  /**
   * 问题Z：AI决策与掼蛋策略的一致性
   */
  it('问题Z：AI决策与掼蛋策略的一致性检查', () => {
    const hand = [
      createCard(1, 2, 'S'), createCard(2, 2, 'H'),  // 级牌对子2
      createCard(3, 10),  // 普通单张10
    ];

    const levelRank = 2;

    // 分析出牌类型
    const levelPair2Move = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const single10Move = { type: 'play' as const, cards: [hand[2]] };

    const levelPair2Eval = evaluateMove(levelPair2Move, hand, null, levelRank, 'hard', true);
    const single10Eval = evaluateMove(single10Move, hand, null, levelRank, 'hard', true);

    console.log('\n=== 问题Z：AI决策与掼蛋策略一致性 ===');
    console.log('掼蛋策略：领牌时应该出对子而不是单张');
    console.log('- 出对子2：剩1张，需要再1轮出完');
    console.log('- 出单张10：剩对子2，需要再1轮出完（对子一次出完）');
    console.log('');
    console.log('两者都需要2轮出完，但对子2有优势：');
    console.log('1. 级牌对子是强牌，其他玩家难以压过');
    console.log('2. 出级牌对子可以获取控制权');
    console.log('');
    console.log('当前AI评分：');
    console.log('- 对子2:', levelPair2Eval.score);
    console.log('- 单张10:', single10Eval.score);
    console.log('');

    if (levelPair2Eval.score > single10Eval.score) {
      console.log('✓ AI优先出级牌对子，符合掼蛋策略');
    } else {
      console.log('⚠️ 问题Z：AI优先出单张，不符合掼蛋策略');
      console.log('   原因：级牌primaryValue高导致bonus低');
    }
  });
});
