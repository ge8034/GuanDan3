/**
 * AI炸弹策略调试测试
 * 目的：详细分析炸弹保留策略为什么不生效
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

describe('AI炸弹策略调试', () => {
  it('问题A调试：炸弹4跟单张7的评分分析', () => {
    const hand = [
      createCard(1, 4), createCard(2, 4), createCard(3, 4), createCard(4, 4), // 炸弹4
    ];
    const lastPlay = [createCard(100, 7)]; // 单张7

    // 测试炸弹选项
    const bombMove = { type: 'play' as const, cards: hand };
    const bombEvaluation = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题A：炸弹4跟单张7 ===');
    console.log('炸弹评分:', bombEvaluation.score);
    console.log('炸弹推理:', bombEvaluation.reasoning);

    // 测试pass选项
    const passMove = { type: 'pass' as const };
    const passEvaluation = evaluateMove(passMove, hand, lastPlay, 2, 'hard', false);

    console.log('Pass评分:', passEvaluation.score);
    console.log('Pass推理:', passEvaluation.reasoning);

    console.log('结论:');
    if (bombEvaluation.score > passEvaluation.score) {
      console.log('⚠️ 炸弹评分高于Pass，AI会选择出炸弹！');
    } else {
      console.log('✓ Pass评分高于或等于炸弹，AI会选择Pass');
    }
  });

  it('问题B调试：炸弹3跟对子2的评分分析', () => {
    const hand = [
      createCard(1, 3), createCard(2, 3), createCard(3, 3), createCard(4, 3), // 炸弹3
    ];
    const lastPlay = [
      createCard(100, 2), createCard(101, 2), // 对子2
    ];

    const bombMove = { type: 'play' as const, cards: hand };
    const bombEvaluation = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);

    const passMove = { type: 'pass' as const };
    const passEvaluation = evaluateMove(passMove, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题B：炸弹3跟对子2 ===');
    console.log('炸弹评分:', bombEvaluation.score);
    console.log('炸弹推理:', bombEvaluation.reasoning);
    console.log('Pass评分:', passEvaluation.score);

    if (bombEvaluation.score > passEvaluation.score) {
      console.log('⚠️ 炸弹评分高于Pass，AI会选择出炸弹！');
    } else {
      console.log('✓ Pass评分高于或等于炸弹，AI会选择Pass');
    }
  });

  it('问题C调试：炸弹5跟顺子的评分分析', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹5
    ];
    const lastPlay = [
      createCard(100, 3), createCard(101, 4), createCard(102, 5), createCard(103, 6), createCard(104, 7), // 顺子34567
    ];

    const bombMove = { type: 'play' as const, cards: hand };
    const bombEvaluation = evaluateMove(bombMove, hand, lastPlay, 2, 'hard', false);

    const passMove = { type: 'pass' as const };
    const passEvaluation = evaluateMove(passMove, hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题C：炸弹5跟顺子34567 ===');
    console.log('炸弹评分:', bombEvaluation.score);
    console.log('炸弹推理:', bombEvaluation.reasoning);
    console.log('Pass评分:', passEvaluation.score);

    if (bombEvaluation.score > passEvaluation.score) {
      console.log('⚠️ 炸弹评分高于Pass，AI会选择出炸弹！');
    } else {
      console.log('✓ Pass评分高于或等于炸弹，AI会选择Pass');
    }
  });

  it('问题D调试：领牌时单张vs对子的评分分析', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), // 对子5
      createCard(3, 8), // 单张8
    ];

    // 测试对子选项
    const pairMove = { type: 'play' as const, cards: [hand[0], hand[1]] };
    const pairEvaluation = evaluateMove(pairMove, hand, null, 2, 'hard', true);

    // 测试单张选项
    const singleMove = { type: 'play' as const, cards: [hand[2]] };
    const singleEvaluation = evaluateMove(singleMove, hand, null, 2, 'hard', true);

    console.log('\n=== 问题D：领牌时对子5 vs 单张8 ===');
    console.log('对子评分:', pairEvaluation.score);
    console.log('对子推理:', pairEvaluation.reasoning);
    console.log('单张评分:', singleEvaluation.score);
    console.log('单张推理:', singleEvaluation.reasoning);

    if (singleEvaluation.score > pairEvaluation.score) {
      console.log('⚠️ 单张评分高于对子，AI会选择出单张！');
    } else {
      console.log('✓ 对子评分高于单张，AI会选择出对子');
    }
  });

  it('问题E调试：领牌时三张vs炸弹的评分分析', () => {
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

    console.log('\n=== 问题E：领牌时炸弹7 vs 三张5 ===');
    console.log('炸弹评分:', bombEvaluation.score);
    console.log('炸弹推理:', bombEvaluation.reasoning);
    console.log('三张评分:', tripleEvaluation.score);
    console.log('三张推理:', tripleEvaluation.reasoning);

    if (tripleEvaluation.score > bombEvaluation.score) {
      console.log('⚠️ 三张评分高于炸弹，AI会选择出三张！');
    } else {
      console.log('✓ 炸弹评分高于三张，AI会选择出炸弹');
    }
  });
});
