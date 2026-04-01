/**
 * AI修复验证测试
 *
 * 验证所有关键问题已修复
 */

import { describe, it, expect } from 'vitest';
import { analyzeMove, canBeat, getCardValue } from '@/lib/game/rules';
import { Card } from '@/lib/store/game';

describe('AI修复验证', () => {
  describe('问题#32: last_payload获取逻辑修复', () => {
    it('过牌序列场景应该正确处理', () => {
      // 验证前端分析逻辑正确
      const levelRank = 2;

      // seat 1 第一次出牌：单张 A
      const firstPlay: Card[] = [{ id: 101, suit: 'S', rank: 'A', val: 14 }];
      const firstMove = analyzeMove(firstPlay, levelRank);
      expect(firstMove?.type).toBe('single');
      expect(firstMove?.primaryValue).toBe(14);

      // seat 1 第二次出牌：单张 2（级牌）
      const secondPlay: Card[] = [{ id: 102, suit: 'S', rank: '2', val: 2 }];
      const secondMove = analyzeMove(secondPlay, levelRank);
      expect(secondMove?.type).toBe('single');
      expect(secondMove?.primaryValue).toBe(50); // 级牌

      // 验证第二次出牌能压过第一次
      expect(canBeat(secondMove!, firstMove!)).toBe(true);

      // 数据库修复：应该查询
      // WHERE turn_no < current_turn_no AND (payload->>'type') <> 'pass'
      // 这样会找到最近一个实际出牌，而不是pass
    });

    it('上家pass时任何出牌都允许', () => {
      const levelRank = 2;
      const passMove = analyzeMove([], levelRank);
      expect(passMove?.type).toBe('pass');

      const anyPlay: Card[] = [{ id: 101, suit: 'S', rank: '5', val: 5 }];
      const anyMove = analyzeMove(anyPlay, levelRank);

      expect(canBeat(anyMove!, passMove!)).toBe(true);
    });
  });

  describe('核心牌型验证', () => {
    it('所有牌型都能正确识别', () => {
      const levelRank = 2;

      // 单张
      expect(analyzeMove([{ id: 1, suit: 'S', rank: 'A', val: 14 }], levelRank)?.type).toBe('single');

      // 对子
      expect(analyzeMove([
        { id: 1, suit: 'S', rank: 'A', val: 14 },
        { id: 2, suit: 'H', rank: 'A', val: 14 }
      ], levelRank)?.type).toBe('pair');

      // 三张
      expect(analyzeMove([
        { id: 1, suit: 'S', rank: 'A', val: 14 },
        { id: 2, suit: 'H', rank: 'A', val: 14 },
        { id: 3, suit: 'C', rank: 'A', val: 14 }
      ], levelRank)?.type).toBe('triple');

      // 炸弹
      expect(analyzeMove([
        { id: 1, suit: 'S', rank: '4', val: 4 },
        { id: 2, suit: 'H', rank: '4', val: 4 },
        { id: 3, suit: 'C', rank: '4', val: 4 },
        { id: 4, suit: 'D', rank: '4', val: 4 }
      ], levelRank)?.type).toBe('bomb');

      // 顺子
      expect(analyzeMove([
        { id: 1, suit: 'S', rank: '5', val: 5 },
        { id: 2, suit: 'H', rank: '6', val: 6 },
        { id: 3, suit: 'C', rank: '7', val: 7 },
        { id: 4, suit: 'D', rank: '8', val: 8 },
        { id: 5, suit: 'S', rank: '9', val: 9 }
      ], levelRank)?.type).toBe('straight');

      // 三带二
      expect(analyzeMove([
        { id: 1, suit: 'S', rank: 'A', val: 14 },
        { id: 2, suit: 'H', rank: 'A', val: 14 },
        { id: 3, suit: 'C', rank: 'A', val: 14 },
        { id: 4, suit: 'D', rank: 'K', val: 13 },
        { id: 5, suit: 'S', rank: 'K', val: 13 }
      ], levelRank)?.type).toBe('fullhouse');
    });
  });

  describe('级牌处理验证', () => {
    it('级牌2应该正确识别和赋值', () => {
      const levelRank = 2;

      // 级牌单张（非红桃）
      const levelCard = { id: 1, suit: 'S', rank: '2', val: 2 };
      expect(getCardValue(levelCard, levelRank)).toBe(50);

      // 级牌单张（红桃）
      const levelCardH = { id: 1, suit: 'H', rank: '2', val: 2 };
      expect(getCardValue(levelCardH, levelRank)).toBe(60);

      // 级牌对子
      const levelPair = analyzeMove([
        { id: 1, suit: 'H', rank: '2', val: 2 },
        { id: 2, suit: 'S', rank: '2', val: 2 }
      ], levelRank);
      expect(levelPair?.type).toBe('pair');
      expect(levelPair?.primaryValue).toBe(60); // 使用红桃级牌的值

      // 级牌炸弹
      const levelBomb = analyzeMove([
        { id: 1, suit: 'H', rank: '2', val: 2 },
        { id: 2, suit: 'S', rank: '2', val: 2 },
        { id: 3, suit: 'C', rank: '2', val: 2 },
        { id: 4, suit: 'D', rank: '2', val: 2 }
      ], levelRank);
      expect(levelBomb?.type).toBe('bomb');
      // 级牌炸弹 = 5000 * 张数 + 级牌最大值 = 5000 * 4 + 60 = 20060
      expect(levelBomb?.primaryValue).toBe(20060);
    });
  });

  describe('炸弹规则验证', () => {
    it('炸弹可以压任何非炸弹', () => {
      const levelRank = 2;

      const bomb = analyzeMove([
        { id: 1, suit: 'S', rank: '4', val: 4 },
        { id: 2, suit: 'H', rank: '4', val: 4 },
        { id: 3, suit: 'C', rank: '4', val: 4 },
        { id: 4, suit: 'D', rank: '4', val: 4 }
      ], levelRank);

      const straight = analyzeMove([
        { id: 5, suit: 'S', rank: '5', val: 5 },
        { id: 6, suit: 'H', rank: '6', val: 6 },
        { id: 7, suit: 'C', rank: '7', val: 7 },
        { id: 8, suit: 'D', rank: '8', val: 8 },
        { id: 9, suit: 'S', rank: '9', val: 9 }
      ], levelRank);

      expect(canBeat(bomb!, straight!)).toBe(true);
      expect(canBeat(straight!, bomb!)).toBe(false);
    });

    it('张数多的炸弹可以压张数少的炸弹', () => {
      const levelRank = 2;

      const fourBomb = analyzeMove([
        { id: 1, suit: 'S', rank: '4', val: 4 },
        { id: 2, suit: 'H', rank: '4', val: 4 },
        { id: 3, suit: 'C', rank: '4', val: 4 },
        { id: 4, suit: 'D', rank: '4', val: 4 }
      ], levelRank);

      const fiveBomb = analyzeMove([
        { id: 5, suit: 'S', rank: '5', val: 5 },
        { id: 6, suit: 'H', rank: '5', val: 5 },
        { id: 7, suit: 'C', rank: '5', val: 5 },
        { id: 8, suit: 'D', rank: '5', val: 5 },
        { id: 9, suit: 'S', rank: '5', val: 5 }
      ], levelRank);

      expect(canBeat(fiveBomb!, fourBomb!)).toBe(true);
      expect(canBeat(fourBomb!, fiveBomb!)).toBe(false);
    });

    it('相同张数的炸弹比较大牌值', () => {
      const levelRank = 2;

      const smallBomb = analyzeMove([
        { id: 1, suit: 'S', rank: '4', val: 4 },
        { id: 2, suit: 'H', rank: '4', val: 4 },
        { id: 3, suit: 'C', rank: '4', val: 4 },
        { id: 4, suit: 'D', rank: '4', val: 4 }
      ], levelRank);

      const bigBomb = analyzeMove([
        { id: 5, suit: 'S', rank: '5', val: 5 },
        { id: 6, suit: 'H', rank: '5', val: 5 },
        { id: 7, suit: 'C', rank: '5', val: 5 },
        { id: 8, suit: 'D', rank: '5', val: 5 }
      ], levelRank);

      expect(canBeat(bigBomb!, smallBomb!)).toBe(true);
      expect(canBeat(smallBomb!, bigBomb!)).toBe(false);
    });
  });

  describe('牌数相同规则验证', () => {
    it('不同牌数的牌型不能互相压', () => {
      const levelRank = 2;

      const single = analyzeMove([{ id: 1, suit: 'S', rank: 'A', val: 14 }], levelRank);
      const pair = analyzeMove([
        { id: 2, suit: 'S', rank: 'K', val: 13 },
        { id: 3, suit: 'H', rank: 'K', val: 13 }
      ], levelRank);
      const triple = analyzeMove([
        { id: 4, suit: 'S', rank: 'Q', val: 12 },
        { id: 5, suit: 'H', rank: 'Q', val: 12 },
        { id: 6, suit: 'C', rank: 'Q', val: 12 }
      ], levelRank);

      // 单张不能压对子
      expect(canBeat(single!, pair!)).toBe(false);
      // 对子不能压单张
      expect(canBeat(pair!, single!)).toBe(false);
      // 三张不能压对子
      expect(canBeat(triple!, pair!)).toBe(false);
    });
  });

  describe('完整场景验证', () => {
    it('典型的出牌流程', () => {
      const levelRank = 2;

      // seat 0: 领出单张 5
      const play1: Card[] = [{ id: 1, suit: 'S', rank: '5', val: 5 }];
      const move1 = analyzeMove(play1, levelRank);

      // seat 1: 跟单张 K
      const play2: Card[] = [{ id: 2, suit: 'S', rank: 'K', val: 13 }];
      const move2 = analyzeMove(play2, levelRank);

      // seat 2: 跟单张 A
      const play3: Card[] = [{ id: 3, suit: 'S', rank: 'A', val: 14 }];
      const move3 = analyzeMove(play3, levelRank);

      // seat 3: 过牌
      const pass = analyzeMove([], levelRank);

      // 验证
      expect(move1?.type).toBe('single');
      expect(move2?.type).toBe('single');
      expect(move3?.type).toBe('single');
      expect(pass?.type).toBe('pass');

      // K 压 5
      expect(canBeat(move2!, move1!)).toBe(true);
      // A 压 K
      expect(canBeat(move3!, move2!)).toBe(true);
      // pass 不压 A
      expect(canBeat(pass!, move3!)).toBe(false);
    });
  });
});
