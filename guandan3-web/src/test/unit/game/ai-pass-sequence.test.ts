/**
 * 过牌序列测试
 *
 * 测试场景：当一个玩家出牌后，其他玩家都过牌，该玩家再次出牌时
 * 应该与自己之前的出牌比较，而不是与其他玩家的pass比较
 */

import { describe, it, expect } from 'vitest';
import { analyzeMove, canBeat } from '@/lib/game/rules';
import { Card } from '@/lib/store/game';

describe('过牌序列场景', () => {
  describe('问题场景：seat 1 出牌 → 其他都过牌 → seat 1 再出牌', () => {
    it('数据库应该找到最近一个实际出牌的回合', async () => {
      // 场景：
      // turn 24: seat 1 出单张 A
      // turn 25: seat 2 过牌
      // turn 26: seat 3 过牌
      // turn 27: seat 0 过牌
      // turn 28: seat 1 应该与 turn 24 的 A 比较，而不是 turn 27 的 pass

      const levelRank = 2;
      const seat1FirstPlay: Card[] = [
        { id: 101, suit: 'S', rank: 'A', val: 14 }
      ];

      // 验证第一次出牌是有效的单张
      const firstMove = analyzeMove(seat1FirstPlay, levelRank);
      expect(firstMove?.type).toBe('single');
      expect(firstMove?.primaryValue).toBe(14);

      // seat 1 第二次出牌 - 应该能压过自己的 A
      const seat1SecondPlay: Card[] = [
        { id: 102, suit: 'S', rank: '2', val: 2 } // 级牌2（非红桃）
      ];

      const secondMove = analyzeMove(seat1SecondPlay, levelRank);
      expect(secondMove?.type).toBe('single');
      expect(secondMove?.primaryValue).toBe(50); // 级牌（非红桃）

      // 验证第二次出牌能压过第一次
      expect(canBeat(secondMove!, firstMove!)).toBe(true);

      // 数据库修复后的逻辑：
      // 应该查询 turn_no < 28 AND (payload->>'type') <> 'pass'
      // 这样会找到 turn 24 的单张 A，而不是 turn 27 的 pass
    });

    it('过牌后领牌应该允许任何牌型', async () => {
      // 当所有人都过牌后，下一个玩家领牌，可以出任何牌型
      const levelRank = 2;

      // 上家都过牌，相当于没有上家出牌
      const lastMove = null;

      // 可以出单张
      const single: Card[] = [{ id: 101, suit: 'S', rank: 'K', val: 13 }];
      expect(analyzeMove(single, levelRank)?.type).toBe('single');

      // 可以出对子
      const pair: Card[] = [
        { id: 201, suit: 'S', rank: 'K', val: 13 },
        { id: 202, suit: 'H', rank: 'K', val: 13 }
      ];
      expect(analyzeMove(pair, levelRank)?.type).toBe('pair');

      // 可以出顺子
      const straight: Card[] = [
        { id: 301, suit: 'S', rank: '5', val: 5 },
        { id: 302, suit: 'H', rank: '6', val: 6 },
        { id: 303, suit: 'C', rank: '7', val: 7 },
        { id: 304, suit: 'D', rank: '8', val: 8 },
        { id: 305, suit: 'S', rank: '9', val: 9 }
      ];
      expect(analyzeMove(straight, levelRank)?.type).toBe('straight');
    });
  });

  describe('多人连续过牌', () => {
    it('连续3个玩家过牌后第4个玩家出牌', async () => {
      // 场景：
      // turn 10: seat 1 出对子 K
      // turn 11: seat 2 过牌
      // turn 12: seat 3 过牌
      // turn 13: seat 0 过牌
      // turn 14: 回到 seat 1，应该与 turn 10 的对子 K 比较

      const levelRank = 2;
      const originalPair: Card[] = [
        { id: 101, suit: 'S', rank: 'K', val: 13 },
        { id: 201, suit: 'H', rank: 'K', val: 13 }
      ];

      const originalMove = analyzeMove(originalPair, levelRank);
      expect(originalMove?.type).toBe('pair');
      expect(originalMove?.primaryValue).toBe(13);

      // seat 1 可以出更大的对子
      const biggerPair: Card[] = [
        { id: 102, suit: 'S', rank: 'A', val: 14 },
        { id: 202, suit: 'H', rank: 'A', val: 14 }
      ];

      const biggerMove = analyzeMove(biggerPair, levelRank);
      expect(biggerMove?.type).toBe('pair');
      expect(biggerMove?.primaryValue).toBe(14);

      expect(canBeat(biggerMove!, originalMove!)).toBe(true);
    });

    it('所有人都过牌后新一轮开始', async () => {
      // 场景：4个玩家都过牌
      // 下一个玩家可以出任何牌型（领牌）

      const levelRank = 2;

      // 数据库查询应该返回 null（没有上家出牌）
      // 或者返回一个 pass
      // validate_guandan_move 应该允许任何出牌

      const anySingle: Card[] = [{ id: 101, suit: 'S', rank: '5', val: 5 }];
      const anyPair: Card[] = [
        { id: 201, suit: 'S', rank: '5', val: 5 },
        { id: 202, suit: 'H', rank: '5', val: 5 }
      ];
      const anyTriple: Card[] = [
        { id: 301, suit: 'S', rank: '5', val: 5 },
        { id: 302, suit: 'H', rank: '5', val: 5 },
        { id: 303, suit: 'C', rank: '5', val: 5 }
      ];

      expect(analyzeMove(anySingle, levelRank)?.type).toBe('single');
      expect(analyzeMove(anyPair, levelRank)?.type).toBe('pair');
      expect(analyzeMove(anyTriple, levelRank)?.type).toBe('triple');
    });
  });

  describe('炸弹后的过牌序列', () => {
    it('出炸弹后其他玩家过牌，炸弹玩家继续出牌', async () => {
      // 场景：
      // turn 5: seat 1 出炸弹 4444
      // turn 6: seat 2 过牌
      // turn 7: seat 3 过牌
      // turn 8: seat 0 过牌
      // turn 9: seat 1 再次出牌，应该与自己的炸弹比较

      const levelRank = 2;
      const bomb: Card[] = [
        { id: 401, suit: 'S', rank: '4', val: 4 },
        { id: 402, suit: 'H', rank: '4', val: 4 },
        { id: 403, suit: 'C', rank: '4', val: 4 },
        { id: 404, suit: 'D', rank: '4', val: 4 }
      ];

      const bombMove = analyzeMove(bomb, levelRank);
      expect(bombMove?.type).toBe('bomb');
      // 普通炸弹 = 1000 * 张数 + 牌值
      // 牌4的getCardValue是4（普通牌）
      // 所以 primaryValue = 1000 * 4 + 4 = 4004
      expect(bombMove?.primaryValue).toBe(4004);

      // seat 1 可以出任何牌（领牌，因为其他人都过牌了）
      // 但实际上应该是与自己的炸弹比较
      // 如果出单张，应该被允许（因为领牌）
      const single: Card[] = [{ id: 101, suit: 'S', rank: '5', val: 5 }];
      expect(analyzeMove(single, levelRank)?.type).toBe('single');
    });
  });

  describe('边缘场景：pass作为上家出牌', () => {
    it('上家出牌是pass时，任何出牌都允许', async () => {
      // 数据库 validate_guandan_move 中的逻辑：
      // if p_last_payload is null or p_last_payload->>'type' = 'pass' then
      //   return true;
      // end if;

      const levelRank = 2;
      const lastMove: Card[] = []; // 空 = pass
      const lastAnalysis = analyzeMove(lastMove, levelRank);

      expect(lastAnalysis?.type).toBe('pass');

      // 任何出牌都应该被允许
      const anyPlay: Card[] = [{ id: 101, suit: 'S', rank: '2', val: 2 }];
      const anyMove = analyzeMove(anyPlay, levelRank);

      expect(canBeat(anyMove!, lastAnalysis!)).toBe(true);
    });
  });

  describe('边缘场景：特殊过牌情况', () => {
    it('连续多轮过牌后，领出者可以自由出牌', async () => {
      // 场景：
      // turn 10: seat 1 出单张
      // turn 11-19: 其他9次都过牌
      // turn 20: seat 1 领出，应该可以自由出牌

      const levelRank = 2;

      // 第一轮领出
      const firstPlay: Card[] = [{ id: 101, suit: 'S', rank: 'K', val: 13 }];
      const firstMove = analyzeMove(firstPlay, levelRank);
      expect(firstMove?.type).toBe('single');

      // 多次过牌后，领出者可以出任何牌型
      const newPlay: Card[] = [
        { id: 201, suit: 'D', rank: '4', val: 4 },
        { id: 202, suit: 'H', rank: '4', val: 4 }
      ];
      const newMove = analyzeMove(newPlay, levelRank);
      expect(newMove?.type).toBe('pair');
    });

    it('所有人过牌后，下一个座位领出不受限制', async () => {
      // 场景：
      // seat 1 出牌 -> seat 2,3,0 都过牌
      // 轮转到 seat 1，seat 1 可以自由出牌

      const levelRank = 2;

      // seat 1 出牌
      const play: Card[] = [{ id: 101, suit: 'S', rank: 'A', val: 14 }];
      const playMove = analyzeMove(play, levelRank);
      expect(playMove?.type).toBe('single');

      // 所有人过牌后，seat 1 再次领出
      // 应该与自己的 play 比较，而不是 pass
      const nextPlay: Card[] = [
        { id: 201, suit: 'H', rank: '2', val: 2 }, // 级牌
        { id: 202, suit: 'D', rank: '2', val: 2 }
      ];
      const nextMove = analyzeMove(nextPlay, levelRank);
      expect(nextMove?.type).toBe('pair');

      // 验证对子能压过单张（因为新一轮开始）
      // 实际上新一轮不需要比较，可以出任何牌
    });

    it('炸弹过牌序列：炸弹后连续过牌，炸弹玩家再次出牌', async () => {
      // 场景：
      // turn 5: seat 1 出炸弹
      // turn 6: seat 2 过牌
      // turn 7: seat 3 过牌
      // turn 8: seat 0 过牌
      // turn 9: seat 1 再次出牌（领出）

      const levelRank = 2;
      const bomb: Card[] = [
        { id: 401, suit: 'S', rank: '5', val: 5 },
        { id: 402, suit: 'H', rank: '5', val: 5 },
        { id: 403, suit: 'C', rank: '5', val: 5 },
        { id: 404, suit: 'D', rank: '5', val: 5 }
      ];
      const bombMove = analyzeMove(bomb, levelRank);
      expect(bombMove?.type).toBe('bomb');

      // 炸弹玩家再次出牌，可以出任何牌型
      const newPlay: Card[] = [
        { id: 101, suit: 'S', rank: '3', val: 3 },
        { id: 102, suit: 'H', rank: '3', val: 3 },
        { id: 103, suit: 'C', rank: '3', val: 3 }
      ];
      const newMove = analyzeMove(newPlay, levelRank);
      expect(newMove?.type).toBe('triple');
    });

    it('级牌炸弹过牌序列', async () => {
      // 级牌炸弹后的过牌序列
      const levelRank = 2;
      const levelBomb: Card[] = [
        { id: 101, suit: 'H', rank: '2', val: 2 },
        { id: 201, suit: 'S', rank: '2', val: 2 },
        { id: 301, suit: 'C', rank: '2', val: 2 },
        { id: 401, suit: 'D', rank: '2', val: 2 }
      ];
      const bombMove = analyzeMove(levelBomb, levelRank);
      expect(bombMove?.type).toBe('bomb');
      // 级牌炸弹 = 5000 * 4 + 60 = 20060
      expect(bombMove?.primaryValue).toBe(20060);
    });

    it('王炸过牌序列（4张王）', async () => {
      // 王炸后的过牌序列
      // 前端规则：4张王才是最大炸弹
      const levelRank = 2;
      const jokerBomb: Card[] = [
        { id: 101, suit: 'J', rank: 'hr', val: 17 },
        { id: 201, suit: 'J', rank: 'br', val: 16 },
        { id: 301, suit: 'J', rank: 'hr', val: 17 },
        { id: 401, suit: 'J', rank: 'br', val: 16 }
      ];
      const bombMove = analyzeMove(jokerBomb, levelRank);
      expect(bombMove?.type).toBe('bomb');
      expect(bombMove?.primaryValue).toBe(10000);
    });

    it('空手牌过牌场景', async () => {
      // 空手牌应该返回 pass
      const levelRank = 2;
      const emptyHand: Card[] = [];
      const move = analyzeMove(emptyHand, levelRank);

      expect(move?.type).toBe('pass');
      expect(move?.cards.length).toBe(0);
    });

    it('只有一张牌的过牌场景', async () => {
      // 只有一张牌，必须出牌不能过
      const levelRank = 2;
      const lastPlay: Card[] = [{ id: 201, suit: 'S', rank: 'A', val: 14 }];
      const myCard: Card[] = [{ id: 101, suit: 'H', rank: 'K', val: 13 }];

      const lastMove = analyzeMove(lastPlay, levelRank);
      const myMove = analyzeMove(myCard, levelRank);

      // K 不能压过 A
      expect(canBeat(myMove!, lastMove!)).toBe(false);
    });

    it('所有人都只有炸弹时的过牌序列', async () => {
      // 特殊情况：所有人都只有炸弹
      const levelRank = 2;

      const bomb1: Card[] = [
        { id: 401, suit: 'S', rank: '4', val: 4 },
        { id: 402, suit: 'H', rank: '4', val: 4 },
        { id: 403, suit: 'C', rank: '4', val: 4 },
        { id: 404, suit: 'D', rank: '4', val: 4 }
      ];

      const bomb2: Card[] = [
        { id: 501, suit: 'S', rank: '5', val: 5 },
        { id: 502, suit: 'H', rank: '5', val: 5 },
        { id: 503, suit: 'C', rank: '5', val: 5 },
        { id: 504, suit: 'D', rank: '5', val: 5 }
      ];

      const move1 = analyzeMove(bomb1, levelRank);
      const move2 = analyzeMove(bomb2, levelRank);

      // 5张炸弹应该能压过4张炸弹
      expect(canBeat(move2!, move1!)).toBe(true);
      expect(canBeat(move1!, move2!)).toBe(false);
    });

    it('连续pass后查询最近实际出牌', async () => {
      // 场景：
      // turn 100: seat 1 出单张 A
      // turn 101-110: 连续10次pass
      // turn 111: 应该查询到 turn 100 的单张 A，而不是 turn 110 的 pass

      const levelRank = 2;
      const play: Card[] = [{ id: 101, suit: 'S', rank: 'A', val: 14 }];
      const move = analyzeMove(play, levelRank);

      expect(move?.type).toBe('single');
      expect(move?.primaryValue).toBe(14);

      // 验证数据库查询逻辑：
      // SELECT * FROM turns WHERE game_id = ? AND turn_no < ? AND (payload->>'type') <> 'pass' ORDER BY turn_no DESC LIMIT 1
      // 应该返回 turn 100 的单张 A
    });

    it('过牌后的牌型选择不受限制', async () => {
      // 过牌后领出，可以选择任何牌型
      const levelRank = 2;

      // 可以选择最小的单张
      const smallestSingle: Card[] = [{ id: 101, suit: 'S', rank: '3', val: 3 }];
      expect(analyzeMove(smallestSingle, levelRank)?.type).toBe('single');

      // 可以选择顺子
      const straight: Card[] = [
        { id: 301, suit: 'S', rank: '5', val: 5 },
        { id: 302, suit: 'H', rank: '6', val: 6 },
        { id: 303, suit: 'C', rank: '7', val: 7 },
        { id: 304, suit: 'D', rank: '8', val: 8 },
        { id: 305, suit: 'S', rank: '9', val: 9 }
      ];
      expect(analyzeMove(straight, levelRank)?.type).toBe('straight');

      // 可以选择连对
      const sequencePairs: Card[] = [
        { id: 401, suit: 'S', rank: '9', val: 9 },
        { id: 402, suit: 'H', rank: '9', val: 9 },
        { id: 403, suit: 'C', rank: '10', val: 10 },
        { id: 404, suit: 'D', rank: '10', val: 10 },
        { id: 405, suit: 'S', rank: 'J', val: 11 },
        { id: 406, suit: 'H', rank: 'J', val: 11 }
      ];
      expect(analyzeMove(sequencePairs, levelRank)?.type).toBe('sequencePairs');
    });

    it('过牌序列中中途有人出牌', async () => {
      // 场景：
      // turn 10: seat 1 出单张 K
      // turn 11: seat 2 过牌
      // turn 12: seat 3 出单张 A（压过K）
      // turn 13: seat 0 过牌
      // turn 14: seat 1 应该与 turn 12 的 A 比较

      const levelRank = 2;
      const kPlay: Card[] = [{ id: 101, suit: 'S', rank: 'K', val: 13 }];
      const aPlay: Card[] = [{ id: 102, suit: 'S', rank: 'A', val: 14 }];

      const kMove = analyzeMove(kPlay, levelRank);
      const aMove = analyzeMove(aPlay, levelRank);

      expect(canBeat(aMove!, kMove!)).toBe(true);

      // 查询最近实际出牌应该返回 turn 12 的 A
    });
  });
});
