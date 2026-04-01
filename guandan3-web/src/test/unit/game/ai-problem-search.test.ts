/**
 * AI问题系统性搜索测试
 * 目的：通过大量场景测试找出AI的问题
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

describe('AI问题系统性搜索', () => {
  // 问题集：炸弹相关
  describe('炸弹使用策略问题', () => {
    it('问题A：AI用炸弹4压过单张7', () => {
      const hand = [
        createCard(1, 4), createCard(2, 4), createCard(3, 4), createCard(4, 4), // 炸弹4
      ];
      const lastPlay = [createCard(100, 7)]; // 单张7

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      console.log('问题A: 跟7，只有炸弹4');
      console.log('AI选择:', move.type);

      if (move.type === 'play') {
        console.log('⚠️ 问题A：AI用炸弹压过单张小牌');
      } else {
        console.log('✓ AI选择pass');
      }
    });

    it('问题B：AI用炸弹3压过对子2', () => {
      const hand = [
        createCard(1, 3), createCard(2, 3), createCard(3, 3), createCard(4, 3), // 炸弹3
      ];
      const lastPlay = [
        createCard(100, 2), createCard(101, 2), // 对子2
      ];

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      console.log('问题B: 跟对子2，只有炸弹3');
      console.log('AI选择:', move.type);

      if (move.type === 'play') {
        console.log('⚠️ 问题B：AI用炸弹压过小对子');
      }
    });

    it('问题C：AI用炸弹压过顺子', () => {
      const hand = [
        createCard(1, 5), createCard(2, 5), createCard(3, 5), createCard(4, 5), // 炸弹5
      ];
      const lastPlay = [
        createCard(100, 3), createCard(101, 4), createCard(102, 5), createCard(103, 6), createCard(104, 7), // 顺子34567（掼蛋规则：顺子最少5张）
      ];

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      console.log('问题C: 跟顺子，只有炸弹5');
      console.log('AI选择:', move.type);

      if (move.type === 'play') {
        console.log('⚠️ 问题C：AI用炸弹压过顺子');
      }
    });
  });

  // 问题集：领牌策略
  describe('领牌策略问题', () => {
    it('问题D：AI领牌时出单张而非对子', () => {
      const hand = [
        createCard(1, 5), createCard(2, 5), // 对子
        createCard(3, 8), // 单张
      ];
      const move = decideMove(hand, null, 2, 'hard', true);

      console.log('问题D: 领牌，有对子5和单张8');
      console.log('AI选择:', move.type, move.cards?.length);

      if (move.type === 'play' && move.cards && move.cards.length === 1) {
        console.log('⚠️ 问题D：AI出单张而非对子');
      }
    });

    it('问题E：AI领牌时出三张而非炸弹', () => {
      const hand = [
        createCard(1, 7), createCard(2, 7), createCard(3, 7), createCard(4, 7), // 炸弹7
        createCard(5, 5), createCard(6, 5), createCard(5, 5), // 三张5
      ];
      const move = decideMove(hand, null, 2, 'hard', true);

      console.log('问题E: 领牌，有炸弹7和三张5');
      console.log('AI选择:', move.type, move.cards?.length);

      if (move.type === 'play' && move.cards && move.cards.length === 3) {
        console.log('⚠️ 问题E：AI出三张而非炸弹');
      }
    });

    it('问题F：AI领牌时应该优先出长牌', () => {
      const hand = [
        createCard(1, 3), createCard(2, 4), createCard(3, 5), createCard(4, 6), // 4张可组成顺子?不连续
        createCard(5, 7), createCard(6, 7), // 对子7
      ];
      const move = decideMove(hand, null, 2, 'hard', true);

      console.log('问题F: 领牌，多张牌组合');
      console.log('AI选择:', move.type, move.cards?.length);
    });
  });

  // 问题集：跟牌策略
  describe('跟牌策略问题', () => {
    it('问题G：AI跟牌时用三张压过单张', () => {
      const hand = [
        createCard(1, 7), createCard(2, 7), createCard(3, 7), // 三张
        createCard(4, 8), // 单张
      ];
      const lastPlay = [createCard(100, 5)]; // 单张5

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      console.log('问题G: 跟单张5，有三张7和单张8');
      console.log('AI选择:', move.type, move.cards?.length);

      if (move.type === 'play' && move.cards && move.cards.length === 3) {
        console.log('⚠️ 问题G：AI用三张压过单张（非最优）');
      }
    });

    it('问题H：AI跟牌时用对子压过单张', () => {
      const hand = [
        createCard(1, 6), createCard(2, 6), // 对子
        createCard(3, 7), // 单张
      ];
      const lastPlay = [createCard(100, 5)]; // 单张5

      const move = decideMove(hand, lastPlay, 2, 'hard', false);

      console.log('问题H: 跟单张5，有对子6和单张7');
      console.log('AI选择:', move.type, move.cards?.length);

      if (move.type === 'play' && move.cards && move.cards.length === 2) {
        console.log('⚠️ 问题H：AI用对子压过单张（非最优）');
      }
    });
  });

  // 问题集：残局策略
  describe('残局策略问题', () => {
    it('问题I：AI剩2张时应该一起出而不是分两次出', () => {
      const hand = [
        createCard(1, 8),
        createCard(2, 8),
      ];
      const move = decideMove(hand, null, 2, 'hard', true);

      console.log('问题I: 领牌，剩2张是对子');
      console.log('AI选择:', move.type, move.cards?.length);

      if (move.type === 'play' && move.cards && move.cards.length === 1) {
        console.log('⚠️ 问题I：AI剩2张时出单张（应一起出完）');
      }
    });

    it('问题J：AI剩3张是炸弹时应该一起出', () => {
      const hand = [
        createCard(1, 5), createCard(2, 5), createCard(3, 5), // 炸弹
      ];
      const move = decideMove(hand, null, 2, 'hard', true);

      console.log('问题J: 领牌，只剩炸弹');
      console.log('AI选择:', move.type, move.cards?.length);

      if (move.type === 'pass') {
        console.log('⚠️ 问题J：AI剩炸弹时选择pass');
      }
    });
  });
});
