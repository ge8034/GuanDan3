/**
 * AI评分相同时的选择调试
 */

import { describe, expect, it } from 'vitest';
import { decideMove } from '@/lib/game/ai-decision';
import type { Card } from '@/lib/store/game';

const createCard = (id: number, val: number, suit: string = 'H'): Card => ({
  id,
  suit,
  rank: String(val),
  val,
});

describe('AI评分相同时的选择', () => {
  it('问题A详细调试：炸弹4跟单张7 - 查看decideMove的输出', () => {
    const hand = [
      createCard(1, 4), createCard(2, 4), createCard(3, 4), createCard(4, 4), // 炸弹4
    ];
    const lastPlay = [createCard(100, 7)]; // 单张7

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题A：炸弹4跟单张7 ===');
    console.log('AI选择:', move.type);
    if (move.type === 'play') {
      console.log('出的牌:', move.cards?.map(c => c.val).join(','));
    }
  });

  it('问题C详细调试：炸弹5跟顺子 - 查看decideMove的输出', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹5
    ];
    const lastPlay = [
      createCard(100, 3), createCard(101, 4), createCard(102, 5), createCard(103, 6), createCard(104, 7), // 顺子34567
    ];

    const move = decideMove(hand, lastPlay, 2, 'hard', false);

    console.log('\n=== 问题C：炸弹5跟顺子34567 ===');
    console.log('AI选择:', move.type);
    if (move.type === 'play') {
      console.log('出的牌:', move.cards?.map(c => c.val).join(','));
    }
  });

  it('问题D详细调试：领牌时有对子5和单张8', () => {
    const hand = [
      createCard(1, 5), createCard(2, 5), // 对子5
      createCard(3, 8), // 单张8
    ];

    const move = decideMove(hand, null, 2, 'hard', true);

    console.log('\n=== 问题D：领牌，有对子5和单张8 ===');
    console.log('AI选择:', move.type, move.cards?.length, '张');
    if (move.type === 'play') {
      console.log('出的牌:', move.cards?.map(c => c.val).join(','));
    }
  });
});
