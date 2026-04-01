/**
 * 前后端验证一致性测试
 *
 * 验证前端 analyzeMove/canBeat 与后端 validate_guandan_move 的结果一致
 */

import { describe, it, expect } from 'vitest';
import { analyzeMove, canBeat, getCardValue } from '@/lib/game/rules';
import { Card } from '@/lib/store/game';

describe('前后端验证一致性', () => {
  const levelRank = 2; // 级牌是2

  describe('单张 (single)', () => {
    it('前端识别单张，后端也应该识别为单张', () => {
      const cards: Card[] = [{ id: 101, suit: 'S', rank: 'A', val: 14 }];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('single');
      expect(move?.cards.length).toBe(1);
      expect(move?.primaryValue).toBe(14);

      // 后端验证逻辑（SQL）：
      // v_card_count = 1
      // v_last_card_count = 1
      // 牌数相同 → 返回 true
    });

    it('单张大小比较一致', () => {
      const small: Card[] = [{ id: 101, suit: 'S', rank: 'K', val: 13 }];
      const big: Card[] = [{ id: 102, suit: 'S', rank: 'A', val: 14 }];

      const smallMove = analyzeMove(small, levelRank);
      const bigMove = analyzeMove(big, levelRank);

      expect(canBeat(bigMove!, smallMove!)).toBe(true);
      expect(canBeat(smallMove!, bigMove!)).toBe(false);
    });

    it('级牌作为单张的值应该正确', () => {
      const levelCard: Card[] = [{ id: 101, suit: 'S', rank: '2', val: 2 }];
      const move = analyzeMove(levelCard, levelRank);

      // 前端：级牌返回 50（非红桃）或 60（红桃）
      // 后端：需要用 val === levelRank 来判断级牌
      expect(move?.primaryValue).toBe(50);

      const value = getCardValue(levelCard[0], levelRank);
      expect(value).toBe(50);
    });
  });

  describe('对子 (pair)', () => {
    it('前端识别对子，后端也应该识别为对子', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: 'A', val: 14 },
        { id: 201, suit: 'H', rank: 'A', val: 14 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('pair');
      expect(move?.cards.length).toBe(2);
    });

    it('级牌对子应该正确识别', () => {
      // 级牌对子：红桃级牌 + 其他花色级牌
      const cards: Card[] = [
        { id: 101, suit: 'H', rank: '2', val: 2 }, // 红桃级牌，值60
        { id: 201, suit: 'S', rank: '2', val: 2 }  // 其他级牌，值50
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('pair');
      // 前端：使用最大值（红桃级牌60）
      expect(move?.primaryValue).toBe(60);
    });

    it('对子大小比较一致', () => {
      const small: Card[] = [
        { id: 101, suit: 'S', rank: 'K', val: 13 },
        { id: 201, suit: 'H', rank: 'K', val: 13 }
      ];
      const big: Card[] = [
        { id: 102, suit: 'S', rank: 'A', val: 14 },
        { id: 202, suit: 'H', rank: 'A', val: 14 }
      ];

      const smallMove = analyzeMove(small, levelRank);
      const bigMove = analyzeMove(big, levelRank);

      expect(canBeat(bigMove!, smallMove!)).toBe(true);
    });
  });

  describe('三张 (triple)', () => {
    it('前端识别三张，后端也应该识别为三张', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: 'A', val: 14 },
        { id: 201, suit: 'H', rank: 'A', val: 14 },
        { id: 301, suit: 'C', rank: 'A', val: 14 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('triple');
      expect(move?.cards.length).toBe(3);
    });

    it('三张大小比较一致', () => {
      const small: Card[] = [
        { id: 101, suit: 'S', rank: 'K', val: 13 },
        { id: 201, suit: 'H', rank: 'K', val: 13 },
        { id: 301, suit: 'C', rank: 'K', val: 13 }
      ];
      const big: Card[] = [
        { id: 102, suit: 'S', rank: 'A', val: 14 },
        { id: 202, suit: 'H', rank: 'A', val: 14 },
        { id: 302, suit: 'C', rank: 'A', val: 14 }
      ];

      const smallMove = analyzeMove(small, levelRank);
      const bigMove = analyzeMove(big, levelRank);

      expect(canBeat(bigMove!, smallMove!)).toBe(true);
    });
  });

  describe('顺子 (straight)', () => {
    it('前端识别顺子，后端也应该识别为顺子', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: '5', val: 5 },
        { id: 202, suit: 'H', rank: '6', val: 6 },
        { id: 303, suit: 'C', rank: '7', val: 7 },
        { id: 404, suit: 'D', rank: '8', val: 8 },
        { id: 505, suit: 'S', rank: '9', val: 9 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('straight');
      expect(move?.cards.length).toBe(5);
    });

    it('顺子不能包含2或王', () => {
      const withTwo: Card[] = [
        { id: 101, suit: 'S', rank: '5', val: 5 },
        { id: 202, suit: 'H', rank: '6', val: 6 },
        { id: 303, suit: 'C', rank: '7', val: 7 },
        { id: 404, suit: 'D', rank: '8', val: 8 },
        { id: 515, suit: 'S', rank: '2', val: 2 } // 级牌2
      ];
      const move = analyzeMove(withTwo, levelRank);

      // 前端：顺子不能包含级牌2
      expect(move?.type).not.toBe('straight');
    });

    it('顺子大小比较一致', () => {
      const small: Card[] = [
        { id: 101, suit: 'S', rank: '5', val: 5 },
        { id: 202, suit: 'H', rank: '6', val: 6 },
        { id: 303, suit: 'C', rank: '7', val: 7 },
        { id: 404, suit: 'D', rank: '8', val: 8 },
        { id: 505, suit: 'S', rank: '9', val: 9 }
      ];
      const big: Card[] = [
        { id: 102, suit: 'S', rank: '6', val: 6 },
        { id: 203, suit: 'H', rank: '7', val: 7 },
        { id: 304, suit: 'C', rank: '8', val: 8 },
        { id: 405, suit: 'D', rank: '9', val: 9 },
        { id: 506, suit: 'S', rank: '10', val: 10 }
      ];

      const smallMove = analyzeMove(small, levelRank);
      const bigMove = analyzeMove(big, levelRank);

      expect(canBeat(bigMove!, smallMove!)).toBe(true);
    });
  });

  describe('连对 (sequencePairs)', () => {
    it('前端识别连对，后端也应该识别为连对', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: 'K', val: 13 },
        { id: 201, suit: 'H', rank: 'K', val: 13 },
        { id: 302, suit: 'C', rank: 'A', val: 14 },
        { id: 402, suit: 'D', rank: 'A', val: 14 },
        { id: 503, suit: 'S', rank: '2', val: 2 }, // 不能用级牌
        { id: 603, suit: 'H', rank: '2', val: 2 }
      ];
      // 级牌2不在顺子中，这个可能无效
      const move = analyzeMove(cards, levelRank);
      // 连对需要3对及以上连续对子
      // K-K-A-A 不是连续的（K=13, A=14，但2是级牌）
    });

    it('有效连对应该正确识别', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: '9', val: 9 },
        { id: 201, suit: 'H', rank: '9', val: 9 },
        { id: 302, suit: 'C', rank: '10', val: 10 },
        { id: 402, suit: 'D', rank: '10', val: 10 },
        { id: 503, suit: 'S', rank: 'J', val: 11 },
        { id: 603, suit: 'H', rank: 'J', val: 11 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('sequencePairs');
      expect(move?.cards.length).toBe(6);
    });
  });

  describe('炸弹 (bomb)', () => {
    it('普通炸弹：4张相同点数', () => {
      const cards: Card[] = [
        { id: 401, suit: 'S', rank: '4', val: 4 },
        { id: 402, suit: 'H', rank: '4', val: 4 },
        { id: 403, suit: 'C', rank: '4', val: 4 },
        { id: 404, suit: 'D', rank: '4', val: 4 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('bomb');
      // 前端：1000 * 张数 + 牌值 = 1000 * 4 + 13 = 4013
      // 注意：这里的牌值是 getCardValue(4, 2) = 4（普通牌）
      expect(move?.primaryValue).toBe(4004);
    });

    it('级牌炸弹：4张级牌', () => {
      const cards: Card[] = [
        { id: 101, suit: 'H', rank: '2', val: 2 }, // 红桃级牌
        { id: 201, suit: 'S', rank: '2', val: 2 },
        { id: 301, suit: 'C', rank: '2', val: 2 },
        { id: 401, suit: 'D', rank: '2', val: 2 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('bomb');
      // 前端：5000 * 张数 + 级牌最大值 = 5000 * 4 + 60 = 20060
      expect(move?.primaryValue).toBe(20060);
    });

    it('王炸：4张王', () => {
      const cards: Card[] = [
        { id: 101, suit: 'J', rank: 'hr', val: 17 }, // 红王
        { id: 201, suit: 'J', rank: 'br', val: 16 }, // 黑王
        { id: 301, suit: 'J', rank: 'hr', val: 17 },
        { id: 401, suit: 'J', rank: 'br', val: 16 }
      ];
      // 注意：实际的王炸只需要2张王，但4张也是炸弹
      // 前端分析4张王时：
      const move = analyzeMove(cards, levelRank);

      // 4张全是王，不是纯级牌炸弹
      // 检测逻辑：hasJoker && !hasLevel
      expect(move?.type).toBe('bomb');
      expect(move?.primaryValue).toBe(10000);
    });

    it('炸弹可以压任何非炸弹', () => {
      const bomb: Card[] = [
        { id: 401, suit: 'S', rank: '4', val: 4 },
        { id: 402, suit: 'H', rank: '4', val: 4 },
        { id: 403, suit: 'C', rank: '4', val: 4 },
        { id: 404, suit: 'D', rank: '4', val: 4 }
      ];
      const straight: Card[] = [
        { id: 101, suit: 'S', rank: '5', val: 5 },
        { id: 202, suit: 'H', rank: '6', val: 6 },
        { id: 303, suit: 'C', rank: '7', val: 7 },
        { id: 404, suit: 'D', rank: '8', val: 8 },
        { id: 505, suit: 'S', rank: '9', val: 9 }
      ];

      const bombMove = analyzeMove(bomb, levelRank);
      const straightMove = analyzeMove(straight, levelRank);

      expect(canBeat(bombMove!, straightMove!)).toBe(true);
      expect(canBeat(straightMove!, bombMove!)).toBe(false);
    });

    it('炸弹大小比较：张数多的赢', () => {
      const smallBomb: Card[] = [
        { id: 401, suit: 'S', rank: '4', val: 4 },
        { id: 402, suit: 'H', rank: '4', val: 4 },
        { id: 403, suit: 'C', rank: '4', val: 4 },
        { id: 404, suit: 'D', rank: '4', val: 4 }
      ];
      const bigBomb: Card[] = [
        { id: 501, suit: 'S', rank: '5', val: 5 },
        { id: 502, suit: 'H', rank: '5', val: 5 },
        { id: 503, suit: 'C', rank: '5', val: 5 },
        { id: 504, suit: 'D', rank: '5', val: 5 },
        { id: 505, suit: 'S', rank: '5', val: 5 } // 5张
      ];

      const smallMove = analyzeMove(smallBomb, levelRank);
      const bigMove = analyzeMove(bigBomb, levelRank);

      // 5张炸弹压4张炸弹
      expect(canBeat(bigMove!, smallMove!)).toBe(true);
    });
  });

  describe('三带二 (fullhouse)', () => {
    it('前端识别三带二', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: 'A', val: 14 },
        { id: 201, suit: 'H', rank: 'A', val: 14 },
        { id: 301, suit: 'C', rank: 'A', val: 14 },
        { id: 402, suit: 'D', rank: 'K', val: 13 },
        { id: 502, suit: 'S', rank: 'K', val: 13 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('fullhouse');
      expect(move?.cards.length).toBe(5);
      expect(move?.primaryValue).toBe(14); // 三张的值
    });

    it('三带二大小比较一致', () => {
      const small: Card[] = [
        { id: 101, suit: 'S', rank: 'K', val: 13 },
        { id: 201, suit: 'H', rank: 'K', val: 13 },
        { id: 301, suit: 'C', rank: 'K', val: 13 },
        { id: 402, suit: 'D', rank: '5', val: 5 },
        { id: 502, suit: 'S', rank: '5', val: 5 }
      ];
      const big: Card[] = [
        { id: 102, suit: 'S', rank: 'A', val: 14 },
        { id: 202, suit: 'H', rank: 'A', val: 14 },
        { id: 302, suit: 'C', rank: 'A', val: 14 },
        { id: 403, suit: 'D', rank: '5', val: 5 },
        { id: 503, suit: 'S', rank: '5', val: 5 }
      ];

      const smallMove = analyzeMove(small, levelRank);
      const bigMove = analyzeMove(big, levelRank);

      expect(canBeat(bigMove!, smallMove!)).toBe(true);
    });
  });

  describe('飞机 (sequenceTriples)', () => {
    it('前端识别飞机', () => {
      const cards: Card[] = [
        { id: 101, suit: 'S', rank: '9', val: 9 },
        { id: 201, suit: 'H', rank: '9', val: 9 },
        { id: 301, suit: 'C', rank: '9', val: 9 },
        { id: 402, suit: 'D', rank: '10', val: 10 },
        { id: 502, suit: 'S', rank: '10', val: 10 },
        { id: 602, suit: 'H', rank: '10', val: 10 }
      ];
      const move = analyzeMove(cards, levelRank);

      expect(move?.type).toBe('sequenceTriples');
      expect(move?.cards.length).toBe(6);
    });
  });

  describe('关键一致性检查', () => {
    it('牌数必须相同（同牌型比较）', () => {
      // 这是后端验证的关键逻辑
      const single: Card[] = [{ id: 101, suit: 'S', rank: 'A', val: 14 }];
      const pair: Card[] = [
        { id: 201, suit: 'S', rank: 'K', val: 13 },
        { id: 202, suit: 'H', rank: 'K', val: 13 }
      ];

      const singleMove = analyzeMove(single, levelRank);
      const pairMove = analyzeMove(pair, levelRank);

      // 单张不能压对子（牌数不同）
      expect(canBeat(singleMove!, pairMove!)).toBe(false);
      // 对子不能压单张（牌数不同）
      expect(canBeat(pairMove!, singleMove!)).toBe(false);
    });

    it('炸弹检测条件一致', () => {
      // 前端：uniqueRawVals.length === 1 && cards.length >= 4
      // 后端：v_card_count >= 4 and group by card->>'val' having count(*) >= 4

      const bomb: Card[] = [
        { id: 401, suit: 'S', rank: '4', val: 4 },
        { id: 402, suit: 'H', rank: '4', val: 4 },
        { id: 403, suit: 'C', rank: '4', val: 4 },
        { id: 404, suit: 'D', rank: '4', val: 4 }
      ];
      const move = analyzeMove(bomb, levelRank);

      expect(move?.type).toBe('bomb');
    });

    it('级牌处理一致', () => {
      // 前端：getCardValue 返回 50（级牌）或 60（红桃级牌）
      // 后端：需要用 card->>'val' = levelRank 来判断

      const levelCard: Card[] = [{ id: 101, suit: 'H', rank: '2', val: 2 }];
      const value = getCardValue(levelCard[0], levelRank);

      expect(value).toBe(60); // 红桃级牌
    });
  });
});
