/**
 * AI 深度分析测试
 *
 * 深入分析AI代码中可能存在的问题
 */

import { describe, expect, it, beforeEach } from 'vitest';
import { decideMove, clearPerformanceMetrics } from '@/lib/game/ai';
import { analyzeMove, canBeat, getCardValue } from '@/lib/game/rules';
import { evaluateMove } from '@/lib/game/ai-strategy';
import { assessRisk } from '@/lib/game/ai-utils';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI深度分析测试 - 发现潜在问题', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  /**
   * 问题1：assessRisk 函数使用 includes 检查剩余强牌
   * includes 使用引用相等性，对于相同值的不同牌无法正确处理
   */
  it('问题1：assessRisk 函数的 includes 引用问题', () => {
    const hand = [
      createCard(1, 14),  // A (强牌)
      createCard(2, 14),  // A (强牌，不同的card对象)
      createCard(3, 5),   // 5
    ];

    const moveCards = [createCard(1, 14)];  // 打出一张A

    // 注意：这里的 moveCards 使用了新的 card 对象，与 hand 中的对象引用不同
    // assessRisk 使用 !moveCards.includes(card) 来检查剩余强牌
    // 这可能导致问题：因为 hand[0] 和 moveCards[0] 是不同的对象引用

    const risk = assessRisk(moveCards, hand, 2, false);

    console.log('\n=== 问题1：assessRisk includes 引用问题 ===');
    console.log('手牌:', hand.map(c => `id=${c.id},val=${c.val}`));
    console.log('出牌:', moveCards.map(c => `id=${c.id},val=${c.val}`));
    console.log('风险分数:', risk);

    // 预期：打出一张A后，剩余还有一张A，剩余强牌应该 >= 2
    // 但由于 includes 使用引用相等性，可能无法正确识别
    const remainingStrongCards = hand.filter(
      (card) => getCardValue(card, 2) >= 11 && !moveCards.includes(card)
    ).length;

    console.log('剩余强牌数（使用includes）:', remainingStrongCards);

    // 这显示了一个潜在问题：如果 moveCards 包含的是新创建的 card 对象
    // includes 无法正确匹配，导致剩余强牌计算错误
  });

  /**
   * 问题2：顺子规则限制 v !== 15 && v !== 17
   * 这阻止了某些有效的顺子
   */
  it('问题2：顺子规则对15和17的限制', () => {
    // 测试包含15的顺子（如果有）
    const handWith15 = [
      createCard(1, 11),  // J
      createCard(2, 12),  // Q
      createCard(3, 13),  // K
      createCard(4, 14),  // A
      createCard(5, 15),  // 15 (可能是级牌或特殊牌)
    ];

    const analysis15 = analyzeMove(handWith15, 2);
    console.log('\n=== 问题2：顺子包含15 ===');
    console.log('牌值:', handWith15.map(c => c.val));
    console.log('分析结果:', analysis15?.type || 'null');
    console.log('说明：如果15被限制，顺子无法识别');

    // 正常的顺子（不包含15和17）
    const normalStraight = [
      createCard(1, 9),
      createCard(2, 10),
      createCard(3, 11),
      createCard(4, 12),
      createCard(5, 13),
    ];

    const analysisNormal = analyzeMove(normalStraight, 2);
    console.log('\n=== 问题2：正常顺子 ===');
    console.log('牌值:', normalStraight.map(c => c.val));
    console.log('分析结果:', analysisNormal?.type || 'null');

    expect(analysisNormal?.type).toBe('straight');
  });

  /**
   * 问题3：级牌炸弹 vs 普通炸弹的 primaryValue 比较
   * 级牌炸弹 = 5000 * 张数 + 主值
   * 普通炸弹 = 1000 * 张数 + 主值
   * 这可能导致级牌炸弹永远比普通炸弹大（即使级牌本身很小）
   */
  it('问题3：级牌炸弹与普通炸弹的比较', () => {
    const levelRank = 2;

    // 级牌炸弹（4张2）
    const levelBomb = [
      createCard(1, 2, 'S'),
      createCard(2, 2, 'H'),
      createCard(3, 2, 'C'),
      createCard(4, 2, 'D'),
    ];

    // 普通炸弹（4张A）
    const normalBomb = [
      createCard(5, 14, 'S'),
      createCard(6, 14, 'H'),
      createCard(7, 14, 'C'),
      createCard(8, 14, 'D'),
    ];

    const levelAnalysis = analyzeMove(levelBomb, levelRank);
    const normalAnalysis = analyzeMove(normalBomb, levelRank);

    console.log('\n=== 问题3：级牌炸弹 vs 普通炸弹 ===');
    console.log('级牌炸弹（4张2）:', levelAnalysis);
    console.log('普通炸弹（4张A）:', normalAnalysis);

    if (levelAnalysis && normalAnalysis) {
      console.log('级牌炸弹 primaryValue:', levelAnalysis.primaryValue);
      console.log('普通炸弹 primaryValue:', normalAnalysis.primaryValue);
      console.log('级牌炸弹能压过普通炸弹?', canBeat(levelAnalysis, normalAnalysis));

      // 问题：级牌炸弹的 primaryValue = 5000 * 4 + 50/60 = 20050+
      // 普通炸弹的 primaryValue = 1000 * 4 + 14 = 4014
      // 所以级牌炸弹永远比普通炸弹大，即使2 < A

      // 这在掼蛋规则中是正确的（级牌炸弹 > 普通炸弹 > 级牌）
      // 但需要确认这是预期行为
    }
  });

  /**
   * 问题4：级牌为2时，AI出牌策略
   */
  it('问题4：级牌为2时的出牌策略', () => {
    const hand = [
      createCard(1, 2, 'S'),  // 级牌2
      createCard(2, 2, 'H'),  // 级牌2（红桃，逢人配）
      createCard(3, 3),
      createCard(4, 4),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题4：级牌为2时的出牌 ===');
    console.log('手牌:', hand.map(c => `val=${c.val},suit=${c.suit}`));
    console.log('AI选择:', move.type, move.cards?.map(c => `val=${c.val},suit=${c.suit}`));

    // AI应该优先出对子2（因为对子有加分）
    if (move.type === 'play') {
      const analysis = analyzeMove(move.cards!, 2);
      console.log('牌型分析:', analysis?.type);
    }
  });

  /**
   * 问题5：炸弹评分的边界条件
   */
  it('问题5：炸弹评分边界条件', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7),  // 炸弹7
      createCard(5, 8),  // 单张8
    ];

    const lastPlay = [createCard(100, 3)];  // 上家出小单张

    // 测试炸弹选项的评分
    const bombMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2], hand[3]] };
    const singleMove = { type: 'play' as const, cards: [hand[4]] };

    const bombEval = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);
    const singleEval = evaluateMove(singleMove, hand, lastPlay, 2, 'hard', false);
    const passEval = evaluateMove({ type: 'pass' }, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题5：炸弹评分边界条件 ===');
    console.log('炸弹评分:', bombEval.score, '推理:', bombEval.reasoning);
    console.log('单张评分:', singleEval.score, '推理:', singleEval.reasoning);
    console.log('Pass评分:', passEval.score, '推理:', passEval.reasoning);

    // 根据炸弹保留策略，上家出小牌时炸弹应该被大幅扣分
    // 预期：单张评分 > 炸弹评分
    if (singleEval.score > bombEval.score) {
      console.log('✓ 正确：AI应该选择出单张而不是炸弹');
    } else {
      console.log('⚠️ 问题：炸弹评分比单张高，AI可能错误出炸弹');
    }
  });

  /**
   * 问题6：三张vs对子的评分
   */
  it('问题6：三张vs对子的评分比较', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5),  // 三张5
      createCard(4, 6), createCard(5, 6),  // 对子6
    ];

    const tripleMove = { type: 'play' as const, cards: [hand[0], hand[1], hand[2]] };
    const pairMove = { type: 'play' as const, cards: [hand[3], hand[4]] };

    const tripleEval = evaluateMove(tripleMove, hand, null, 2, 'hard', true);
    const pairEval = evaluateMove(pairMove, hand, null, 2, 'hard', true);

    console.log('\n=== 问题6：三张vs对子评分 ===');
    console.log('三张评分:', tripleEval.score, '推理:', tripleEval.reasoning);
    console.log('对子评分:', pairEval.score, '推理:', pairEval.reasoning);

    // 领牌时：三张(80分) > 对子(50分)
    // 但对子能更快出完（剩下3张 vs 剩下2张）
    console.log('策略：三张评分更高是正确的（出更多牌）');
  });

  /**
   * 问题7：接近出完时的策略
   */
  it('问题7：剩余2张是对子时的策略', () => {
    const hand = [
      createCard(1, 7), createCard(2, 7),  // 对子7
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题7：剩余2张是对子 ===');
    console.log('AI选择:', move.type, move.cards?.map(c => c.val));

    // AI应该一起出对子（快速清手）
    expect(move.type).toBe('play');
    expect(move.cards!.length).toBe(2);
  });

  /**
   * 问题8：跟牌时炸弹压单张的惩罚
   */
  it('问题8：炸弹压单张的惩罚机制', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5),  // 炸弹5
    ];

    const lastPlay = [createCard(100, 7)];  // 上家出单张7

    const bombMove = { type: 'play' as const, cards: hand };
    const bombEval = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题8：炸弹压单张惩罚 ===');
    console.log('炸弹评分:', bombEval.score);
    console.log('推理:', bombEval.reasoning);

    // 检查推理中是否包含 "Bomb vs single - save for later"
    if (bombEval.reasoning.includes('Bomb vs single')) {
      console.log('✓ 正确：炸弹压单张有额外惩罚');
    } else {
      console.log('⚠️ 问题：炸弹压单张没有额外惩罚');
    }
  });

  /**
   * 问题9：级牌对子的 primaryValue
   */
  it('问题9：级牌对子的 primaryValue 计算', () => {
    const levelRank = 2;

    const levelPair = [
      createCard(1, 2, 'S'),  // 黑桃2
      createCard(2, 2, 'H'),  // 红桃2（逢人配）
    ];

    const analysis = analyzeMove(levelPair, levelRank);

    console.log('\n=== 问题9：级牌对子 primaryValue ===');
    console.log('级牌对子:', levelPair.map(c => `${c.suit}${c.val}`));
    console.log('分析结果:', analysis);

    if (analysis) {
      console.log('primaryValue:', analysis.primaryValue);
      console.log('说明：级牌对子应该使用最大值（红桃级牌的值）');

      // 级牌对子的 primaryValue 应该是 60（红桃级牌的值）
      // 而不是 50（其他花色级牌的值）
      expect(analysis.primaryValue).toBe(60);
    }
  });

  /**
   * 问题10：AI在只有单张时的决策
   */
  it('问题10：AI在只有多张单张时的决策', () => {
    const hand = [
      createCard(1, 3),
      createCard(2, 5),
      createCard(3, 8),
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题10：只有单张时的决策 ===');
    console.log('手牌:', hand.map(c => c.val));
    console.log('AI选择:', move.cards?.map(c => c.val));

    // AI应该出最小的单张
    expect(move.cards![0].val).toBe(3);
  });
});
