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

// 评估常量
const EVALUATION_CONSTANTS = {
  // 领出评估
  LEADING_BASE_SCORE: 20,
  PRIMARY_VALUE_TARGET: 500,
  PRIMARY_VALUE_WEIGHT: 5,
  LEVEL_CARD_BONUS: 300,
  LEVEL_CARD_SINGLE_PENALTY: 150,

  // 牌型加分
  PAIR_BONUS: 50,
  TRIPLE_BONUS: 80,
  FULLHOUSE_BONUS: 100,
  PLANE_BONUS: 150,
  SEQUENCE_PAIRS_BONUS: 120,
  STRAIGHT_BONUS: 100,
  MULTI_CARD_BONUS_MULTIPLIER: 15,

  // 跟牌评估
  FOLLOWING_PRIMARY_VALUE_TARGET: 1000,
  FOLLOWING_VALUE_WEIGHT: 20,
  FOLLOWING_MULTI_CARD_BONUS: 2,

  // 炸弹策略（优化后）
  BOMB_RETENTION_PENALTY: 400,        // 降低：800 → 400
  SMALL_BOMB_PENALTY: 100,             // 降低：200 → 100
  BOMB_VS_SINGLE_PENALTY: 1000,        // 降低：2000 → 1000
  BIG_BOMB_PENALTY: 200,
  BOMB_LENGTH_BONUS: 500,
  ENDGAME_THRESHOLD: 8,                // 残局阈值

  // 残局和风险
  NEAR_END_THRESHOLD: 5,
  NEAR_END_BONUS: 15,
  RISK_WEIGHT: 0.5,
  MOVES_TO_CLEAR_MULTIPLIER: 3,

  // 难度系数
  DIFFICULTY_EASY_MULTIPLIER: 0.7,
  DIFFICULTY_MEDIUM_MULTIPLIER: 0.85,
  DIFFICULTY_HARD_MULTIPLIER: 1.0,

  // 卡牌值标准化
  JOKER_MIN_VALUE: 100,
  JOKER_NORMALIZED_MIN: 25,
  JOKER_NORMALIZED_RANGE: 5,
  LEVEL_CARD_MIN_VALUE: 50,
  LEVEL_CARD_NORMALIZED_MIN: 15,
  LEVEL_CARD_NORMALIZED_RANGE: 10,
  SMALL_CARD_THRESHOLD: 10,
} as const;

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
  score -= risk * EVALUATION_CONSTANTS.RISK_WEIGHT;
  reasoning.push(`Risk: ${risk}`);

  const estimatedMoves = estimateMovesToClear(hand, levelRank);
  benefit = estimatedMoves * EVALUATION_CONSTANTS.MOVES_TO_CLEAR_MULTIPLIER;
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
  if (remainingCards <= EVALUATION_CONSTANTS.NEAR_END_THRESHOLD) {
    score += EVALUATION_CONSTANTS.NEAR_END_BONUS;
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
  let score = EVALUATION_CONSTANTS.LEADING_BASE_SCORE;
  reasoning.push('Leading play');

  const isLevelCardPlay = moveCards.some((c) => c.val === levelRank);

  if (analysis && analysis.primaryValue) {
    // 炸弹的主值包含基数，需要提取实际牌值
    let actualValue = analysis.primaryValue;
    if (analysis.type === 'bomb') {
      actualValue = analysis.primaryValue % 1000;
    }

    score += EVALUATION_CONSTANTS.PRIMARY_VALUE_TARGET - actualValue * EVALUATION_CONSTANTS.PRIMARY_VALUE_WEIGHT;
    reasoning.push(`Primary value bonus: ${EVALUATION_CONSTANTS.PRIMARY_VALUE_TARGET - actualValue * EVALUATION_CONSTANTS.PRIMARY_VALUE_WEIGHT}`);

    // 级牌牌型处理
    if (isLevelCardPlay && actualValue >= EVALUATION_CONSTANTS.LEVEL_CARD_MIN_VALUE) {
      if (moveCards.length >= 2) {
        // 对子及以上牌型额外加分
        score += EVALUATION_CONSTANTS.LEVEL_CARD_BONUS;
        reasoning.push(`Level card bonus: +${EVALUATION_CONSTANTS.LEVEL_CARD_BONUS}`);
      } else {
        // 领牌时出级牌单张应该降分
        score -= EVALUATION_CONSTANTS.LEVEL_CARD_SINGLE_PENALTY;
        reasoning.push(`Level card penalty (lead): -${EVALUATION_CONSTANTS.LEVEL_CARD_SINGLE_PENALTY}`);
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
    score += EVALUATION_CONSTANTS.PAIR_BONUS;
    reasoning.push(`Pair bonus: ${EVALUATION_CONSTANTS.PAIR_BONUS}`);
  } else if (cardCount === 3) {
    score += EVALUATION_CONSTANTS.TRIPLE_BONUS;
    reasoning.push(`Triple bonus: ${EVALUATION_CONSTANTS.TRIPLE_BONUS}`);
  }

  // 长牌型额外加分
  if (analysis?.type === 'fullhouse') {
    score += EVALUATION_CONSTANTS.FULLHOUSE_BONUS;
    reasoning.push(`Fullhouse bonus: ${EVALUATION_CONSTANTS.FULLHOUSE_BONUS}`);
  } else if (analysis?.type === 'sequenceTriples') {
    score += EVALUATION_CONSTANTS.PLANE_BONUS;
    reasoning.push(`Plane bonus: ${EVALUATION_CONSTANTS.PLANE_BONUS}`);
  } else if (analysis?.type === 'sequencePairs') {
    score += EVALUATION_CONSTANTS.SEQUENCE_PAIRS_BONUS;
    reasoning.push(`Sequence pairs bonus: ${EVALUATION_CONSTANTS.SEQUENCE_PAIRS_BONUS}`);
  } else if (analysis?.type === 'straight') {
    score += EVALUATION_CONSTANTS.STRAIGHT_BONUS;
    reasoning.push(`Straight bonus: ${EVALUATION_CONSTANTS.STRAIGHT_BONUS}`);
  }

  score += cardCount * EVALUATION_CONSTANTS.MULTI_CARD_BONUS_MULTIPLIER;
  reasoning.push(`Cards played bonus: ${cardCount * EVALUATION_CONSTANTS.MULTI_CARD_BONUS_MULTIPLIER}`);

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
    score += EVALUATION_CONSTANTS.FOLLOWING_PRIMARY_VALUE_TARGET - normalizedValue * EVALUATION_CONSTANTS.FOLLOWING_VALUE_WEIGHT;
    reasoning.push(
      `Primary value bonus: ${EVALUATION_CONSTANTS.FOLLOWING_PRIMARY_VALUE_TARGET - normalizedValue * EVALUATION_CONSTANTS.FOLLOWING_VALUE_WEIGHT} (normalized: ${normalizedValue.toFixed(1)})`
    );
  }

  // 跟牌时多张牌加分（炸弹不加分）
  if (analysis?.type !== 'bomb') {
    score += moveCards.length * EVALUATION_CONSTANTS.FOLLOWING_MULTI_CARD_BONUS;
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

  const isLastPlaySmall = !lastPlayIsBomb && lastPlayRawValue < EVALUATION_CONSTANTS.SMALL_CARD_THRESHOLD;
  const isLastPlayTriple = lastPlay && lastPlay.length === 3 && !lastPlayIsBomb;

  // 炸弹保留策略
  if (isLastPlaySmall || isLastPlayTriple) {
    score -= EVALUATION_CONSTANTS.BOMB_RETENTION_PENALTY;
    reasoning.push(`Bomb retention penalty: -${EVALUATION_CONSTANTS.BOMB_RETENTION_PENALTY} (压小牌保留炸弹)`);

    if (actualValue < EVALUATION_CONSTANTS.SMALL_CARD_THRESHOLD) {
      score -= EVALUATION_CONSTANTS.SMALL_BOMB_PENALTY;
      reasoning.push(`Small bomb penalty: -${EVALUATION_CONSTANTS.SMALL_BOMB_PENALTY}`);
    }
  } else {
    // 上家出大牌或炸弹
    score += bombLength * EVALUATION_CONSTANTS.BOMB_LENGTH_BONUS;
    reasoning.push(`Bomb length bonus: +${bombLength * EVALUATION_CONSTANTS.BOMB_LENGTH_BONUS}`);
  }

  return score;
}

/**
 * 标准化卡牌值（处理 Joker 和级牌）
 */
function normalizeCardValue(actualValue: number): number {
  if (actualValue >= EVALUATION_CONSTANTS.JOKER_MIN_VALUE) {
    // Joker: 映射到 25-30 范围
    return EVALUATION_CONSTANTS.JOKER_NORMALIZED_MIN + ((actualValue - EVALUATION_CONSTANTS.JOKER_MIN_VALUE) / 100) * EVALUATION_CONSTANTS.JOKER_NORMALIZED_RANGE;
  } else if (actualValue >= EVALUATION_CONSTANTS.LEVEL_CARD_MIN_VALUE) {
    // 级牌: 映射到 15-25 范围
    return EVALUATION_CONSTANTS.LEVEL_CARD_NORMALIZED_MIN + ((actualValue - EVALUATION_CONSTANTS.LEVEL_CARD_MIN_VALUE) / 10) * EVALUATION_CONSTANTS.LEVEL_CARD_NORMALIZED_RANGE;
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

  // 检测是否进入残局阶段（剩余8张或以下）
  const remainingCards = hand.length - moveCards.length;
  const isEndGame = remainingCards <= EVALUATION_CONSTANTS.ENDGAME_THRESHOLD;

  if (isEndGame) {
    reasoning.push(`Endgame (remaining: ${remainingCards}), no bomb penalty`);
    // 残局阶段：炸弹不惩罚，反而加分
    score += 100;
  }

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

  // 计算炸弹惩罚（残局时不惩罚）
  let penalty: number = 0;
  if (!isEndGame) {
    penalty = moveCards.length > 4 ? EVALUATION_CONSTANTS.BIG_BOMB_PENALTY : EVALUATION_CONSTANTS.BOMB_RETENTION_PENALTY;
    if ((isOnlyBombOption || isAllBombs) && isLeading) {
      penalty = 0; // 领牌且只有/全是炸弹时，不扣分
      reasoning.push('Only/All bombs available, no penalty');
    }
  }

  // 如果用炸弹压单张，额外扣分（残局时减少惩罚）
  if (lastPlay && lastPlay.length === 1) {
    const vsSinglePenalty = isEndGame
      ? EVALUATION_CONSTANTS.BOMB_VS_SINGLE_PENALTY / 2
      : EVALUATION_CONSTANTS.BOMB_VS_SINGLE_PENALTY;
    score -= vsSinglePenalty;
    reasoning.push(`Bomb vs single - save for later (-${vsSinglePenalty})`);
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
    return score * EVALUATION_CONSTANTS.DIFFICULTY_EASY_MULTIPLIER;
  } else if (difficulty === 'medium') {
    return score * EVALUATION_CONSTANTS.DIFFICULTY_MEDIUM_MULTIPLIER;
  }
  return score * EVALUATION_CONSTANTS.DIFFICULTY_HARD_MULTIPLIER;
}
