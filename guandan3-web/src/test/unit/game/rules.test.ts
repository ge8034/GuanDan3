import { describe, expect, it } from 'vitest';
import { analyze, analyzeMove, canBeat, getCardValue } from '@/lib/game/rules';
import type { Card } from '@/lib/store/game';

const c = (card: Partial<Card>): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...card,
});

describe('rules', () => {
  it('getCardValue：大小王、级牌与普通牌', () => {
    expect(getCardValue(c({ suit: 'J', rank: 'hr', val: 30 }), 2)).toBe(200);
    expect(getCardValue(c({ suit: 'J', rank: 'sb', val: 20 }), 2)).toBe(100);
    expect(getCardValue(c({ suit: 'H', rank: '2', val: 2 }), 2)).toBe(60); // 红桃级牌逢人配
    expect(getCardValue(c({ suit: 'S', rank: '2', val: 2 }), 2)).toBe(50); // 级牌大于A
    expect(getCardValue(c({ suit: 'S', rank: 'A', val: 14 }), 2)).toBe(14);
  });

  it('analyzeMove：pass/single/pair/triple/straight/sequencePairs/fullhouse/bomb/invalid', () => {
    expect(analyzeMove([], 2)).toEqual({
      type: 'pass',
      cards: [],
      primaryValue: 0,
    });

    const single = analyzeMove([c({ id: 1, suit: 'S', rank: '5', val: 5 })], 2);
    expect(single?.type).toBe('single');

    const pair = analyzeMove(
      [
        c({ id: 2, suit: 'S', rank: '7', val: 7 }),
        c({ id: 3, suit: 'D', rank: '7', val: 7 }),
      ],
      2
    );
    expect(pair?.type).toBe('pair');

    const triple = analyzeMove(
      [
        c({ id: 4, suit: 'S', rank: '9', val: 9 }),
        c({ id: 5, suit: 'D', rank: '9', val: 9 }),
        c({ id: 6, suit: 'C', rank: '9', val: 9 }),
      ],
      2
    );
    expect(triple?.type).toBe('triple');

    const bomb4 = analyzeMove(
      [
        c({ id: 7, suit: 'S', rank: 'K', val: 13 }),
        c({ id: 8, suit: 'D', rank: 'K', val: 13 }),
        c({ id: 9, suit: 'C', rank: 'K', val: 13 }),
        c({ id: 10, suit: 'H', rank: 'K', val: 13 }),
      ],
      2
    );
    expect(bomb4?.type).toBe('bomb');

    const straight = analyzeMove(
      [
        c({ id: 20, suit: 'S', rank: '5', val: 5 }),
        c({ id: 21, suit: 'D', rank: '6', val: 6 }),
        c({ id: 22, suit: 'C', rank: '7', val: 7 }),
        c({ id: 23, suit: 'H', rank: '8', val: 8 }),
        c({ id: 24, suit: 'S', rank: '9', val: 9 }),
      ],
      2
    );
    expect(straight?.type).toBe('straight');

    const seqPairs = analyzeMove(
      [
        c({ id: 30, suit: 'S', rank: '4', val: 4 }),
        c({ id: 31, suit: 'D', rank: '4', val: 4 }),
        c({ id: 32, suit: 'S', rank: '5', val: 5 }),
        c({ id: 33, suit: 'D', rank: '5', val: 5 }),
        c({ id: 34, suit: 'S', rank: '6', val: 6 }),
        c({ id: 35, suit: 'D', rank: '6', val: 6 }),
      ],
      2
    );
    expect(seqPairs?.type).toBe('sequencePairs');

    const fullhouse = analyzeMove(
      [
        c({ id: 40, suit: 'S', rank: '7', val: 7 }),
        c({ id: 41, suit: 'D', rank: '7', val: 7 }),
        c({ id: 42, suit: 'C', rank: '7', val: 7 }),
        c({ id: 43, suit: 'S', rank: '9', val: 9 }),
        c({ id: 44, suit: 'D', rank: '9', val: 9 }),
      ],
      2
    );
    expect(fullhouse?.type).toBe('fullhouse');

    const invalid = analyzeMove(
      [
        c({ id: 11, suit: 'S', rank: '3', val: 3 }),
        c({ id: 12, suit: 'D', rank: '4', val: 4 }),
      ],
      2
    );
    expect(invalid).toBeNull();
  });

  it('analyzeMove：王炸/炸弹/飞机/飞机带翅膀', () => {
    // 王炸需要4张王牌（红大王x2 + 黑小王x2）
    const jokerBomb = analyzeMove(
      [
        c({ id: 1, suit: 'J', rank: 'hr', val: 200 }),
        c({ id: 2, suit: 'J', rank: 'hr', val: 200 }),
        c({ id: 3, suit: 'J', rank: 'sb', val: 100 }),
        c({ id: 4, suit: 'J', rank: 'sb', val: 100 }),
      ],
      2
    );
    expect(jokerBomb?.type).toBe('bomb');
    expect(jokerBomb?.primaryValue).toBe(10000);

    // 掼蛋规则：4张相同是炸弹，不是"四带二"
    const bomb4 = analyzeMove(
      [
        c({ id: 10, suit: 'S', rank: '7', val: 7 }),
        c({ id: 11, suit: 'D', rank: '7', val: 7 }),
        c({ id: 12, suit: 'C', rank: '7', val: 7 }),
        c({ id: 13, suit: 'H', rank: '7', val: 7 }),
      ],
      2
    );
    expect(bomb4?.type).toBe('bomb');

    const airplane = analyzeMove(
      [
        c({ id: 20, suit: 'S', rank: '3', val: 3 }),
        c({ id: 21, suit: 'D', rank: '3', val: 3 }),
        c({ id: 22, suit: 'C', rank: '3', val: 3 }),
        c({ id: 23, suit: 'S', rank: '4', val: 4 }),
        c({ id: 24, suit: 'D', rank: '4', val: 4 }),
        c({ id: 25, suit: 'C', rank: '4', val: 4 }),
      ],
      2
    );
    expect(airplane?.type).toBe('sequenceTriples');

    const airplaneWithWings = analyzeMove(
      [
        c({ id: 30, suit: 'S', rank: '3', val: 3 }),
        c({ id: 31, suit: 'D', rank: '3', val: 3 }),
        c({ id: 32, suit: 'C', rank: '3', val: 3 }),
        c({ id: 33, suit: 'S', rank: '4', val: 4 }),
        c({ id: 34, suit: 'D', rank: '4', val: 4 }),
        c({ id: 35, suit: 'C', rank: '4', val: 4 }),
        c({ id: 36, suit: 'S', rank: '7', val: 7 }),
        c({ id: 37, suit: 'D', rank: '8', val: 8 }),
      ],
      2
    );
    // 飞机带翅膀是无效牌型，应该返回 null
    expect(airplaneWithWings).toBeNull();

    const airplaneWithPairWings = analyzeMove(
      [
        c({ id: 50, suit: 'S', rank: '3', val: 3 }),
        c({ id: 51, suit: 'D', rank: '3', val: 3 }),
        c({ id: 52, suit: 'C', rank: '3', val: 3 }),
        c({ id: 53, suit: 'S', rank: '4', val: 4 }),
        c({ id: 54, suit: 'D', rank: '4', val: 4 }),
        c({ id: 55, suit: 'C', rank: '4', val: 4 }),
        c({ id: 56, suit: 'S', rank: '5', val: 5 }),
        c({ id: 57, suit: 'D', rank: '5', val: 5 }),
        c({ id: 58, suit: 'S', rank: '6', val: 6 }),
        c({ id: 59, suit: 'D', rank: '6', val: 6 }),
      ],
      2
    );
    // 飞机带翅膀是无效牌型，应该返回 null
    expect(airplaneWithPairWings).toBeNull();
  });

  it('canBeat：同型比较与炸弹规则', () => {
    const aSingle = analyzeMove(
      [c({ suit: 'S', rank: '6', val: 6, id: 1 })],
      2
    )!;
    const bSingle = analyzeMove(
      [c({ suit: 'D', rank: '5', val: 5, id: 2 })],
      2
    )!;
    expect(canBeat(aSingle, bSingle)).toBe(true);
    expect(canBeat(bSingle, aSingle)).toBe(false);

    const bomb4 = analyzeMove(
      [
        c({ id: 3, suit: 'S', rank: 'Q', val: 12 }),
        c({ id: 4, suit: 'D', rank: 'Q', val: 12 }),
        c({ id: 5, suit: 'C', rank: 'Q', val: 12 }),
        c({ id: 6, suit: 'H', rank: 'Q', val: 12 }),
      ],
      2
    )!;
    expect(canBeat(bomb4, aSingle)).toBe(true);
    expect(canBeat(aSingle, bomb4)).toBe(false);

    const bomb5 = analyzeMove(
      [
        c({ id: 7, suit: 'S', rank: '3', val: 3 }),
        c({ id: 8, suit: 'D', rank: '3', val: 3 }),
        c({ id: 9, suit: 'C', rank: '3', val: 3 }),
        c({ id: 10, suit: 'H', rank: '3', val: 3 }),
        c({ id: 11, suit: 'S', rank: '3', val: 3 }),
      ],
      2
    )!;
    expect(canBeat(bomb5, bomb4)).toBe(true);

    const straight8 = analyzeMove(
      [
        c({ id: 50, suit: 'S', rank: '4', val: 4 }),
        c({ id: 51, suit: 'D', rank: '5', val: 5 }),
        c({ id: 52, suit: 'C', rank: '6', val: 6 }),
        c({ id: 53, suit: 'H', rank: '7', val: 7 }),
        c({ id: 54, suit: 'S', rank: '8', val: 8 }),
      ],
      2
    )!;
    const straight9 = analyzeMove(
      [
        c({ id: 60, suit: 'S', rank: '5', val: 5 }),
        c({ id: 61, suit: 'D', rank: '6', val: 6 }),
        c({ id: 62, suit: 'C', rank: '7', val: 7 }),
        c({ id: 63, suit: 'H', rank: '8', val: 8 }),
        c({ id: 64, suit: 'S', rank: '9', val: 9 }),
      ],
      2
    )!;
    expect(canBeat(straight9, straight8)).toBe(true);
  });

  it('canBeat：pass 与不同张数', () => {
    const pass = analyzeMove([], 2)!;
    const single = analyzeMove(
      [c({ suit: 'S', rank: '6', val: 6, id: 1 })],
      2
    )!;
    expect(canBeat(single, pass)).toBe(true);
    expect(canBeat(pass, single)).toBe(false);

    const pair = analyzeMove(
      [
        c({ id: 2, suit: 'S', rank: '7', val: 7 }),
        c({ id: 3, suit: 'D', rank: '7', val: 7 }),
      ],
      2
    )!;
    const triple = analyzeMove(
      [
        c({ id: 4, suit: 'S', rank: '7', val: 7 }),
        c({ id: 5, suit: 'D', rank: '7', val: 7 }),
        c({ id: 6, suit: 'C', rank: '7', val: 7 }),
      ],
      2
    )!;
    expect(canBeat(pair, triple)).toBe(false);
  });

  it('analyze 与 analyzeMove 一致', () => {
    const cards = [c({ id: 1, suit: 'S', rank: 'A', val: 14 })];
    expect(analyze(cards, 2)).toEqual(analyzeMove(cards, 2));
  });

  it('顺子可以包含2（2是最小的）', () => {
    // 23456 是有效的顺子，2 < 3 < 4 < 5 < 6
    const straightWith2 = analyzeMove(
      [
        c({ id: 1, suit: 'S', rank: '2', val: 2 }),
        c({ id: 2, suit: 'D', rank: '3', val: 3 }),
        c({ id: 3, suit: 'C', rank: '4', val: 4 }),
        c({ id: 4, suit: 'H', rank: '5', val: 5 }),
        c({ id: 5, suit: 'S', rank: '6', val: 6 }),
      ],
      10
    );
    expect(straightWith2?.type).toBe('straight');
    expect(straightWith2?.primaryValue).toBe(6);
  });

  it('连对可以包含2（2是最小的）', () => {
    // 223344 是有效的连对，2 < 3 < 4
    const seqPairsWith2 = analyzeMove(
      [
        c({ id: 1, suit: 'S', rank: '2', val: 2 }),
        c({ id: 2, suit: 'D', rank: '2', val: 2 }),
        c({ id: 3, suit: 'C', rank: '3', val: 3 }),
        c({ id: 4, suit: 'H', rank: '3', val: 3 }),
        c({ id: 5, suit: 'S', rank: '4', val: 4 }),
        c({ id: 6, suit: 'D', rank: '4', val: 4 }),
      ],
      10
    );
    expect(seqPairsWith2?.type).toBe('sequencePairs');
    expect(seqPairsWith2?.primaryValue).toBe(4);
  });

  it('级牌对子：红桃级牌+其他花色级牌应为有效对子', () => {
    // 级牌=2，红桃2(逢人配) + 黑桃2 = 有效对子
    const levelPair = analyzeMove(
      [
        c({ id: 1, suit: 'H', rank: '2', val: 2 }), // 红桃2，逢人配
        c({ id: 2, suit: 'S', rank: '2', val: 2 }), // 黑桃2
      ],
      2
    );
    expect(levelPair?.type).toBe('pair');
    expect(levelPair?.primaryValue).toBe(60); // 使用红桃级牌的值
  });

  it('级牌三张：红桃级牌+其他两张级牌应为有效三张', () => {
    // 级牌=2，红桃2 + 黑桃2 + 方块2 = 有效三张
    const levelTriple = analyzeMove(
      [
        c({ id: 1, suit: 'H', rank: '2', val: 2 }), // 红桃2
        c({ id: 2, suit: 'S', rank: '2', val: 2 }), // 黑桃2
        c({ id: 3, suit: 'D', rank: '2', val: 2 }), // 方块2
      ],
      2
    );
    expect(levelTriple?.type).toBe('triple');
    expect(levelTriple?.primaryValue).toBe(60);
  });

  it('级牌炸弹：四张级牌应为有效炸弹', () => {
    // 级牌=2，四张2 = 级牌炸弹
    const levelBomb = analyzeMove(
      [
        c({ id: 1, suit: 'H', rank: '2', val: 2 }),
        c({ id: 2, suit: 'S', rank: '2', val: 2 }),
        c({ id: 3, suit: 'D', rank: '2', val: 2 }),
        c({ id: 4, suit: 'C', rank: '2', val: 2 }),
      ],
      2
    );
    expect(levelBomb?.type).toBe('bomb');
    // 级牌炸弹 = 5000 * 张数 + 主值 = 5000 * 4 + 60 = 20060
    expect(levelBomb?.primaryValue).toBeGreaterThan(20000);
  });

  it('无效牌型：飞机带4张单牌翅膀应该无效', () => {
    // 三张K + 三张A + 4张单牌 = 10张牌
    // 飞机带翅膀：2个三张组需要2张单牌或2个对子(4张)作为翅膀
    // 4张单牌既不是2张单牌也不是2个对子，应该是无效
    const invalidPlane = analyzeMove(
      [
        // 三张K
        c({ id: 1, suit: 'H', rank: 'K', val: 13 }),
        c({ id: 2, suit: 'S', rank: 'K', val: 13 }),
        c({ id: 3, suit: 'D', rank: 'K', val: 13 }),
        // 三张A
        c({ id: 4, suit: 'H', rank: 'A', val: 14 }),
        c({ id: 5, suit: 'S', rank: 'A', val: 14 }),
        c({ id: 6, suit: 'D', rank: 'A', val: 14 }),
        // 4张单牌翅膀（应该是2张或2个对子）
        c({ id: 7, suit: 'C', rank: '6', val: 6 }),
        c({ id: 8, suit: 'C', rank: '3', val: 3 }),
        c({ id: 9, suit: 'S', rank: '8', val: 8 }),
        c({ id: 10, suit: 'D', rank: '4', val: 4 }),
      ],
      2
    );
    // 这应该是无效牌型，因为4张单牌既不是2张单牌，也不是2个对子
    expect(invalidPlane).toBeNull();
  });

  it('无效牌型：飞机带2张单牌翅膀', () => {
    // 三张3 + 三张4 + 2张单牌 = 8张牌
    // 飞机带翅膀是无效牌型（掼蛋规则：飞机不能带翅膀）
    const invalidPlane = analyzeMove(
      [
        // 三张3
        c({ id: 1, suit: 'H', rank: '3', val: 3 }),
        c({ id: 2, suit: 'S', rank: '3', val: 3 }),
        c({ id: 3, suit: 'D', rank: '3', val: 3 }),
        // 三张4
        c({ id: 4, suit: 'H', rank: '4', val: 4 }),
        c({ id: 5, suit: 'S', rank: '4', val: 4 }),
        c({ id: 6, suit: 'D', rank: '4', val: 4 }),
        // 2张单牌翅膀
        c({ id: 7, suit: 'C', rank: '6', val: 6 }),
        c({ id: 8, suit: 'C', rank: '8', val: 8 }),
      ],
      2
    );
    expect(invalidPlane).toBeNull();
  });

  it('无效牌型：飞机带2个对子翅膀', () => {
    // 三张3 + 三张4 + 2个对子 = 10张牌
    // 飞机带翅膀是无效牌型（掼蛋规则：飞机不能带翅膀）
    const invalidPlane = analyzeMove(
      [
        // 三张3
        c({ id: 1, suit: 'H', rank: '3', val: 3 }),
        c({ id: 2, suit: 'S', rank: '3', val: 3 }),
        c({ id: 3, suit: 'D', rank: '3', val: 3 }),
        // 三张4
        c({ id: 4, suit: 'H', rank: '4', val: 4 }),
        c({ id: 5, suit: 'S', rank: '4', val: 4 }),
        c({ id: 6, suit: 'D', rank: '4', val: 4 }),
        // 2个对子翅膀
        c({ id: 7, suit: 'C', rank: '6', val: 6 }),
        c({ id: 8, suit: 'S', rank: '6', val: 6 }),
        c({ id: 9, suit: 'D', rank: '8', val: 8 }),
        c({ id: 10, suit: 'C', rank: '8', val: 8 }),
      ],
      2
    );
    expect(invalidPlane).toBeNull();
  });
});
