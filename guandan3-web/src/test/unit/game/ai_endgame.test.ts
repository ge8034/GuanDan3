import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  adjustDifficulty,
  calculateWinRate,
  clearPerformanceMetrics,
  evaluateMove,
  findBestSupportMove,
  findBombs,
  findOptimalMove,
  getPerformanceStats,
  recordDecisionMetrics,
  shouldPlayAggressive,
  shouldPlayAggressiveAdjusted,
  shouldPlayDefensive,
  shouldPlayDefensiveAdjusted,
  sortCards,
} from '@/lib/game/ai';
import type { Card } from '@/lib/store/game';

const c = (card: Partial<Card>): Card => ({
  suit: 'H',
  rank: '2',
  val: 2,
  id: 1,
  ...card,
});

describe('AI Strategy - Guard & Difficulty', () => {
  beforeEach(() => {
    clearPerformanceMetrics();
  });

  it('recentPerformance 为空时不调整难度', () => {
    expect(adjustDifficulty('hard', 0, [])).toBe('hard');
    expect(adjustDifficulty('medium', 0, [])).toBe('medium');
    expect(adjustDifficulty('easy', 0, [])).toBe('easy');
  });

  it('胜率与近期表现可触发难度变化', () => {
    expect(adjustDifficulty('medium', 0.8, [0.9, 0.95])).toBe('hard');
    expect(adjustDifficulty('hard', 0.2, [0.1, 0.2, 0.3])).toBe('easy');
    expect(adjustDifficulty('hard', 0.8, [0.9, 0.95])).toBe('hard');
    expect(adjustDifficulty('easy', 0.2, [0.1, 0.2, 0.3])).toBe('easy');
    expect(adjustDifficulty('medium', 0.5, [0.5, 0.5])).toBe('medium');
  });

  it('needsSupport=true 且 lastPlay=null 时不会崩溃', () => {
    const hand: Card[] = [c({ id: 2, suit: 'S', rank: '3', val: 3 })];
    const teammateSituation = {
      isLeading: true,
      isStrong: false,
      needsSupport: true,
      canLead: true,
    };

    const move = findOptimalMove(
      hand,
      null,
      2,
      'hard',
      true,
      teammateSituation
    );

    expect(move.type).toBe('play');
    expect(move.cards?.map((x) => x.id)).toEqual([2]);
  });

  it('sortCards 按牌力与花色排序', () => {
    const input: Card[] = [
      c({ id: 1, suit: 'D', rank: '10', val: 10 }),
      c({ id: 2, suit: 'S', rank: '10', val: 10 }),
      c({ id: 3, suit: 'C', rank: '10', val: 10 }),
      c({ id: 4, suit: 'H', rank: '3', val: 3 }),
    ];

    const sorted = sortCards(input, 2);
    expect(sorted.map((x) => x.id)).toEqual([2, 3, 1, 4]);
  });

  it('recordDecisionMetrics 超过上限会裁剪并可计算胜率', () => {
    const now = Date.now();
    for (let i = 0; i < 1005; i++) {
      recordDecisionMetrics('lead', 'single', 10, 'hard', 60, now - 10);
    }
    expect(getPerformanceStats().totalDecisions).toBe(1000);

    clearPerformanceMetrics();
    for (let i = 0; i < 30; i++) {
      recordDecisionMetrics('lead', 'single', 10, 'hard', 60, Date.now() - 10);
    }
    for (let i = 0; i < 20; i++) {
      recordDecisionMetrics(
        'follow',
        'single',
        10,
        'hard',
        10,
        Date.now() - 3000
      );
    }
    expect(calculateWinRate()).toBeCloseTo(0.6, 5);
  });

  it('evaluateMove 对 pass 返回 0 分', () => {
    const result = evaluateMove({ type: 'pass' }, [], null, 2, 'hard', false);
    expect(result.score).toBe(0);
    expect(result.move.type).toBe('pass');
  });

  it('evaluateMove 可覆盖不同牌型与难度分支', () => {
    // 使用三带二牌型测试（非炸弹）
    const fullHouseCards: Card[] = [
      c({ id: 1, suit: 'S', rank: '7', val: 7 }),
      c({ id: 2, suit: 'D', rank: '7', val: 7 }),
      c({ id: 3, suit: 'C', rank: '7', val: 7 }),
      c({ id: 4, suit: 'H', rank: '9', val: 9 }),
      c({ id: 5, suit: 'S', rank: '10', val: 10 }),
    ];

    const hand = [...fullHouseCards];
    const hard = evaluateMove(
      { type: 'play', cards: fullHouseCards },
      hand,
      null,
      2,
      'hard',
      true
    );
    const medium = evaluateMove(
      { type: 'play', cards: fullHouseCards },
      hand,
      null,
      2,
      'medium',
      true
    );
    const easy = evaluateMove(
      { type: 'play', cards: fullHouseCards },
      hand,
      null,
      2,
      'easy',
      true
    );

    expect(hard.score).toBeGreaterThan(0);
    expect(hard.score).toBeGreaterThan(medium.score);
    expect(medium.score).toBeGreaterThan(easy.score);
    expect(hard.reasoning).toContain('Leading play');
    expect(hard.reasoning).toContain('Near end of hand');
  });

  it('findBestSupportMove 在无法支援时返回 pass', () => {
    const hand: Card[] = [c({ id: 1, suit: 'S', rank: 'J', val: 11 })];
    const lastPlay: Card[] = [c({ id: 2, suit: 'S', rank: '9', val: 9 })];
    const teammateSituation = {
      isLeading: false,
      isStrong: false,
      needsSupport: true,
      canLead: true,
    };

    const move = findBestSupportMove(hand, lastPlay, 2, teammateSituation);
    expect(move.type).toBe('pass');
  });

  it('findBestSupportMove 飞机带翅膀无效时返回 pass', () => {
    const hand: Card[] = [
      c({ id: 1, suit: 'S', rank: '3', val: 3 }),
      c({ id: 2, suit: 'D', rank: '3', val: 3 }),
      c({ id: 3, suit: 'C', rank: '3', val: 3 }),
      c({ id: 4, suit: 'S', rank: '4', val: 4 }),
      c({ id: 5, suit: 'D', rank: '4', val: 4 }),
      c({ id: 6, suit: 'C', rank: '4', val: 4 }),
      c({ id: 7, suit: 'S', rank: '7', val: 7 }),
      c({ id: 8, suit: 'D', rank: '8', val: 8 }),
    ];
    const lastPlay: Card[] = [
      c({ id: 11, suit: 'S', rank: '2', val: 2 }),
      c({ id: 12, suit: 'D', rank: '2', val: 2 }),
      c({ id: 13, suit: 'C', rank: '2', val: 2 }),
      c({ id: 14, suit: 'S', rank: '3', val: 3 }),
      c({ id: 15, suit: 'D', rank: '3', val: 3 }),
      c({ id: 16, suit: 'C', rank: '3', val: 3 }),
      c({ id: 17, suit: 'S', rank: '5', val: 5 }),
      c({ id: 18, suit: 'D', rank: '6', val: 6 }),
    ];
    const teammateSituation = {
      isLeading: false,
      isStrong: false,
      needsSupport: true,
      canLead: true,
    };

    const move = findBestSupportMove(hand, lastPlay, 10, teammateSituation);

    // 飞机带翅膀是无效牌型，AI无法用它来支援
    expect(move.type).toBe('pass');
  });

  it('findBestSupportMove 可用三带二支援', () => {
    const hand: Card[] = [
      c({ id: 1, suit: 'S', rank: '3', val: 3 }),
      c({ id: 2, suit: 'D', rank: '3', val: 3 }),
      c({ id: 3, suit: 'C', rank: '3', val: 3 }),
      c({ id: 4, suit: 'S', rank: '4', val: 4 }),
      c({ id: 5, suit: 'D', rank: '4', val: 4 }),
    ];
    const lastPlay: Card[] = [
      c({ id: 11, suit: 'S', rank: '2', val: 2 }),
      c({ id: 12, suit: 'D', rank: '2', val: 2 }),
      c({ id: 13, suit: 'C', rank: '2', val: 2 }),
      c({ id: 14, suit: 'S', rank: '3', val: 3 }),
      c({ id: 15, suit: 'D', rank: '3', val: 3 }),
    ];
    const teammateSituation = {
      isLeading: false,
      isStrong: false,
      needsSupport: true,
      canLead: true,
    };

    const move = findBestSupportMove(hand, lastPlay, 10, teammateSituation);

    expect(move.type).toBe('play');
    expect(move.cards?.length).toBe(5);
  });

  it('needsSupport=true 但支援失败时仍可走常规最优出牌', () => {
    const hand: Card[] = [c({ id: 1, suit: 'J', rank: 'hr', val: 0 })];
    const lastPlay: Card[] = [c({ id: 2, suit: 'S', rank: '9', val: 9 })];
    const teammateSituation = {
      isLeading: false,
      isStrong: false,
      needsSupport: true,
      canLead: true,
    };

    const move = findOptimalMove(
      hand,
      lastPlay,
      2,
      'hard',
      false,
      teammateSituation
    );
    expect(move.type).toBe('play');
    expect(move.cards?.[0].suit).toBe('J');
  });

  it('shouldPlayAggressiveAdjusted/DefensiveAdjusted 在不同难度下受随机影响', () => {
    const random = vi.spyOn(Math, 'random');

    random.mockReturnValue(0.1);
    expect(shouldPlayAggressiveAdjusted(90, 80, true, 'easy')).toBe(false);
    expect(shouldPlayDefensiveAdjusted(10, 10, true, 'easy')).toBe(false);

    random.mockReturnValue(0.9);
    expect(shouldPlayAggressiveAdjusted(90, 80, true, 'easy')).toBe(true);
    expect(shouldPlayDefensiveAdjusted(10, 10, true, 'easy')).toBe(true);

    random.mockRestore();
  });

  it('shouldPlayAggressive/Defensive 与不同难度分支覆盖', () => {
    expect(shouldPlayAggressive(90, 80, false)).toBe(true);
    expect(shouldPlayDefensive(10, 10, false)).toBe(true);

    const random = vi.spyOn(Math, 'random');
    random.mockReturnValue(0.2);
    expect(shouldPlayAggressiveAdjusted(90, 80, true, 'medium')).toBe(true);
    expect(shouldPlayDefensiveAdjusted(10, 10, true, 'medium')).toBe(true);
    expect(shouldPlayAggressiveAdjusted(90, 80, true, 'hard')).toBe(true);
    expect(shouldPlayDefensiveAdjusted(10, 10, true, 'hard')).toBe(true);
    random.mockRestore();
  });

  it('模式识别可识别王炸与四带二', () => {
    const cards: Card[] = [
      c({ id: 1, suit: 'J', rank: 'hr', val: 200 }),
      c({ id: 2, suit: 'J', rank: 'hr', val: 200 }),
      c({ id: 3, suit: 'J', rank: 'sb', val: 100 }),
      c({ id: 4, suit: 'J', rank: 'sb', val: 100 }),
      c({ id: 5, suit: 'S', rank: '7', val: 7 }),
      c({ id: 6, suit: 'D', rank: '7', val: 7 }),
      c({ id: 7, suit: 'C', rank: '7', val: 7 }),
      c({ id: 8, suit: 'H', rank: '7', val: 7 }),
      c({ id: 9, suit: 'S', rank: '9', val: 9 }),
      c({ id: 10, suit: 'D', rank: '10', val: 10 }),
    ];

    const bombs = findBombs(cards, 2);
    // 王炸需要4张王牌
    expect(
      bombs.some((b) => b.length === 4 && b.every((x) => x.suit === 'J'))
    ).toBe(true);
  });

  it('findOptimalMove 在 easy/medium 难度下会走随机分支', () => {
    const random = vi.spyOn(Math, 'random');

    const hand: Card[] = [
      c({ id: 1, suit: 'S', rank: '3', val: 3 }),
      c({ id: 2, suit: 'S', rank: 'A', val: 14 }),
    ];

    random.mockReturnValue(0);
    const easyPick0 = findOptimalMove(hand, null, 2, 'easy', true);
    expect(easyPick0.type).toBe('play');

    random.mockReturnValue(0.99);
    const easyPick1 = findOptimalMove(hand, null, 2, 'easy', true);
    expect(easyPick1.type).toBe('play');

    random.mockReturnValueOnce(0.6);
    const mediumPickTop = findOptimalMove(hand, null, 2, 'medium', true);
    expect(mediumPickTop.type).toBe('play');

    random.mockReturnValueOnce(0.8).mockReturnValueOnce(0.99);
    const mediumPickOther = findOptimalMove(hand, null, 2, 'medium', true);
    expect(mediumPickOther.type).toBe('play');

    random.mockRestore();
  });
});
