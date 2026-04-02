/**
 * AI 移动评估模块
 *
 * 负责评估出牌动作的分数、风险和收益。
 */

import { Card } from '@/lib/store/game';
import { getCardValue, analyzeMove } from '../rules';
import { AIMove, AIDifficulty, MoveEvaluation } from '../ai-types';
import {
  calculateHandStrength,
  assessRisk,
  calculateControlScore,
  analyzeCardDistribution,
  estimateMovesToClear,
} from '../ai-utils';

/**
 * 评估出牌动作
 *
 * 根据手牌、当前出牌、难度等因素，对某个出牌动作进行综合评估。
 *
 * @param move - 要评估的出牌动作
 * @param hand - 当前手牌
 * @param lastPlay - 上家出牌
 * @param levelRank - 当前级牌点数
 * @param difficulty - AI 难度
 * @param isLeading - 是否领出
 * @returns 评估结果（分数、风险、收益和理由）
 */
export function evaluateMove(
  move: AIMove,
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty,
  isLeading: boolean
): MoveEvaluation {
  if (move.type === 'pass') {
    return {
      move,
      score: 0,
      risk: 0,
      benefit: 0,
      reasoning: 'No valid moves available',
    };
  }

  const moveCards = move.cards!;
  const analysis = analyzeMove(moveCards, levelRank);
  const distribution = analyzeCardDistribution(hand, levelRank);
  const controlScore = calculateControlScore({
    cardCount: hand.length,
    strongCards: distribution.strongCards,
    hasJokers: distribution.hasJokers,
    levelRank,
  });

  let score = 0;
  let risk = 0;
  let benefit = 0;
  const reasoning: string[] = [];

  const handStrength = calculateHandStrength({
    cardCount: hand.length,
    playedValue: moveCards.reduce((sum, card) => sum + getCardValue(card, levelRank), 0),
    playedType: analysis?.type || 'unknown',
  });

  // 领出 vs 跟牌的不同评分策略
  if (isLeading) {
    score += evaluateLeadingMove(moveCards, levelRank, analysis, reasoning);
  } else {
    score += evaluateFollowingMove(
      moveCards,
      lastPlay,
      levelRank,
      analysis,
      reasoning
    );
  }

  risk = assessRisk(moveCards, hand, levelRank, isLeading);
  score -= risk * 0.5;
  reasoning.push(`Risk: ${risk}`);

  const estimatedMoves = estimateMovesToClear(hand, levelRank);
  benefit = estimatedMoves * 3;
  reasoning.push(`Estimated moves to clear: ${estimatedMoves}`);

  // 炸弹特殊处理
  if (analysis?.type === 'bomb') {
    score += evaluateBombPlay(
      moveCards,
      hand,
      lastPlay,
      isLeading,
      levelRank,
      reasoning
    );
  }

  // 接近结束时加分
  const remainingCards = hand.length - moveCards.length;
  if (remainingCards <= 5) {
    score += 15;
    reasoning.push('Near end of hand');
  }

  // 难度调整
  score = applyDifficultyMultiplier(score, difficulty);

  return {
    move,
    score: Math.max(0, score),
    risk,
    benefit,
    reasoning: reasoning.join(', '),
  };
}

/**
 * 评估领出时的出牌分数
 */
function evaluateLeadingMove(
  moveCards: Card[],
  levelRank: number,
  analysis: ReturnType<typeof analyzeMove>,
  reasoning: string[]
): number {
  let score = 20; // 领出基础分
  reasoning.push('Leading play');

  const isLevelCardPlay = moveCards.some((c) => c.val === levelRank);

  if (analysis && analysis.primaryValue) {
    // 炸弹的主值包含基数，需要提取实际牌值
    let actualValue = analysis.primaryValue;
    if (analysis.type === 'bomb') {
      actualValue = analysis.primaryValue % 1000;
    }

    score += 500 - actualValue * 5; // 主值越小分数越高
    reasoning.push(`Primary value bonus: ${500 - actualValue * 5}`);

    // 级牌牌型处理
    if (isLevelCardPlay && actualValue >= 50) {
      if (moveCards.length >= 2) {
        // 对子及以上牌型额外加分
        const levelCardBonus = 300;
        score += levelCardBonus;
        reasoning.push(`Level card bonus: +${levelCardBonus}`);
      } else {
        // 领牌时出级牌单张应该降分
        score -= 150;
        reasoning.push('Level card penalty (lead): -150');
      }
    }
  }

  // 非炸弹多张牌加分
  if (analysis?.type !== 'bomb') {
    score += evaluateNonBombCombo(analysis, moveCards.length, reasoning);
  }

  return score;
}

/**
 * 评估非炸弹组合的加分
 */
function evaluateNonBombCombo(
  analysis: ReturnType<typeof analyzeMove>,
  cardCount: number,
  reasoning: string[]
): number {
  let score = 0;

  // 基础牌型加分
  if (cardCount === 2) {
    score += 50; // 对子
    reasoning.push('Pair bonus: 50');
  } else if (cardCount === 3) {
    score += 80; // 三张
    reasoning.push('Triple bonus: 80');
  }

  // 长牌型额外加分
  if (analysis?.type === 'fullhouse') {
    score += 100; // 三带二
    reasoning.push('Fullhouse bonus: 100');
  } else if (analysis?.type === 'sequenceTriples') {
    score += 150; // 飞机
    reasoning.push('Plane bonus: 150');
  } else if (analysis?.type === 'sequencePairs') {
    score += 120; // 连对
    reasoning.push('Sequence pairs bonus: 120');
  } else if (analysis?.type === 'straight') {
    score += 100; // 顺子
    reasoning.push('Straight bonus: 100');
  }

  score += cardCount * 15; // 基础多张牌加分
  reasoning.push(`Cards played bonus: ${cardCount * 15}`);

  return score;
}

/**
 * 评估跟牌时的出牌分数
 */
function evaluateFollowingMove(
  moveCards: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  analysis: ReturnType<typeof analyzeMove>,
  reasoning: string[]
): number {
  let score = 0;

  if (analysis && analysis.primaryValue) {
    // 炸弹的主值包含基数，需要提取实际牌值
    let actualValue = analysis.primaryValue;
    if (analysis.type === 'bomb') {
      const bombLength = Math.floor(analysis.primaryValue / 1000);
      actualValue = analysis.primaryValue % 1000;

      score += evaluateBombInFollowing(
        bombLength,
        actualValue,
        lastPlay,
        levelRank,
        reasoning
      );
    }

    // 对数缩放处理大值牌
    const normalizedValue = normalizeCardValue(actualValue);
    score += 1000 - normalizedValue * 20; // 主值越小分数越高
    reasoning.push(
      `Primary value bonus: ${1000 - normalizedValue * 20} (normalized: ${normalizedValue.toFixed(1)})`
    );
  }

  // 跟牌时多张牌加分（炸弹不加分）
  if (analysis?.type !== 'bomb') {
    score += moveCards.length * 2;
  }
  reasoning.push(`Cards played: ${moveCards.length}`);

  return score;
}

/**
 * 评估跟牌时的炸弹使用
 */
function evaluateBombInFollowing(
  bombLength: number,
  actualValue: number,
  lastPlay: Card[] | null,
  levelRank: number,
  reasoning: string[]
): number {
  let score = 0;

  // 获取上家出牌信息
  const lastPlayValue =
    lastPlay && lastPlay.length > 0
      ? analyzeMove(lastPlay, levelRank)?.primaryValue
      : 0;
  let lastPlayActualValue = lastPlayValue || 0;
  let lastPlayIsBomb = false;

  if (lastPlayValue && lastPlayValue >= 1000) {
    lastPlayActualValue = lastPlayValue % 1000;
    lastPlayIsBomb = true;
  }

  // 计算上家出牌的原始值
  let lastPlayRawValue = 0;
  if (lastPlay && lastPlay.length > 0) {
    lastPlayRawValue =
      lastPlay.reduce((sum, card) => sum + card.val, 0) / lastPlay.length;
  }

  const isLastPlaySmall = !lastPlayIsBomb && lastPlayRawValue < 10;
  const isLastPlayTriple = lastPlay && lastPlay.length === 3 && !lastPlayIsBomb;

  // 炸弹保留策略
  if (isLastPlaySmall || isLastPlayTriple) {
    score -= 800; // 炸弹保留惩罚
    reasoning.push('Bomb retention penalty: -800 (压小牌保留炸弹)');

    if (actualValue < 10) {
      score -= 200; // 小炸弹额外惩罚
      reasoning.push('Small bomb penalty: -200');
    }
  } else {
    // 上家出大牌或炸弹
    score += bombLength * 500;
    reasoning.push(`Bomb length bonus: +${bombLength * 500}`);
  }

  return score;
}

/**
 * 标准化卡牌值（处理 Joker 和级牌）
 */
function normalizeCardValue(actualValue: number): number {
  if (actualValue >= 100) {
    // Joker: 映射到 25-30 范围
    return 25 + ((actualValue - 100) / 100) * 5;
  } else if (actualValue >= 50) {
    // 级牌: 映射到 15-25 范围
    return 15 + ((actualValue - 50) / 10) * 10;
  }
  // 普通牌（2-15）：保持原值
  return actualValue;
}

/**
 * 评估炸弹出牌
 */
function evaluateBombPlay(
  moveCards: Card[],
  hand: Card[],
  lastPlay: Card[] | null,
  isLeading: boolean,
  levelRank: number,
  reasoning: string[]
): number {
  let score = 0;
  reasoning.push('Bomb play');

  // 检测手牌是否主要是炸弹
  const isOnlyBombOption =
    hand.length === moveCards.length &&
    hand.every((c) => c.val === moveCards[0].val);

  // 检测手牌是否全部由炸弹组成
  const cardCounts: Record<number, number> = {};
  hand.forEach((c) => {
    cardCounts[c.val] = (cardCounts[c.val] || 0) + 1;
  });
  const isAllBombs =
    Object.values(cardCounts).length > 0 &&
    Object.values(cardCounts).every((count) => count === 4);

  // 计算炸弹惩罚
  let penalty = moveCards.length > 4 ? 200 : 800;
  if ((isOnlyBombOption || isAllBombs) && isLeading) {
    penalty = 0; // 领牌且只有/全是炸弹时，不扣分
    reasoning.push('Only/All bombs available, no penalty');
  }

  // 如果用炸弹压单张，额外扣分
  if (lastPlay && lastPlay.length === 1) {
    score -= 2000;
    reasoning.push('Bomb vs single - save for later');
  }

  score -= penalty;
  if (penalty > 0) {
    reasoning.push(`Bomb penalty -${penalty} (save for later)`);
  }

  // 识别炸弹类型
  if (moveCards.length === 6) {
    const counts: Record<number, number> = {};
    moveCards.forEach((c) => {
      const val = getCardValue(c, levelRank);
      counts[val] = (counts[val] || 0) + 1;
    });
    const maxCount = Math.max(...Object.values(counts));
    if (maxCount === 4) {
      reasoning.push('Quad with two');
    }
  }

  return score;
}

/**
 * 应用难度系数
 */
function applyDifficultyMultiplier(
  score: number,
  difficulty: AIDifficulty
): number {
  if (difficulty === 'easy') {
    return score * 0.7;
  } else if (difficulty === 'medium') {
    return score * 0.85;
  }
  return score;
}
