/**
 * AI 策略判断模块
 *
 * 负责判断攻击/防守策略，以及队友支援逻辑。
 */

import { Card } from '@/lib/store/game';
import { AIMove, AIDifficulty, TeammateSituation } from '../ai-types';
import { analyzeMove, canBeat } from '../rules';
import { analyzeHand } from '../ai-pattern-recognition';
import {
  calculateControlScore,
  analyzeCardDistribution,
} from '../ai-utils';

/**
 * 判断是否应该采取攻击策略
 *
 * @param handStrength - 手牌强度（0-100）
 * @param controlScore - 控制分数（0-100）
 * @param isLeading - 是否领出
 * @returns 是否应该攻击
 */
export function shouldPlayAggressive(
  handStrength: number,
  controlScore: number,
  isLeading: boolean
): boolean {
  if (isLeading) {
    return handStrength > 60 && controlScore > 50;
  }
  return handStrength > 80 && controlScore > 70;
}

/**
 * 判断是否应该采取防守策略
 *
 * @param handStrength - 手牌强度（0-100）
 * @param controlScore - 控制分数（0-100）
 * @param isLeading - 是否领出
 * @returns 是否应该防守
 */
export function shouldPlayDefensive(
  handStrength: number,
  controlScore: number,
  isLeading: boolean
): boolean {
  if (isLeading) {
    return handStrength < 40 || controlScore < 30;
  }
  return handStrength < 50 || controlScore < 40;
}

/**
 * 根据难度调整攻击策略
 *
 * @param handStrength - 手牌强度（0-100）
 * @param controlScore - 控制分数（0-100）
 * @param isLeading - 是否领出
 * @param difficulty - AI 难度
 * @returns 是否应该攻击
 */
export function shouldPlayAggressiveAdjusted(
  handStrength: number,
  controlScore: number,
  isLeading: boolean,
  difficulty: AIDifficulty
): boolean {
  const baseAggressive = shouldPlayAggressive(
    handStrength,
    controlScore,
    isLeading
  );

  if (difficulty === 'easy') {
    return baseAggressive && Math.random() > 0.3;
  } else if (difficulty === 'medium') {
    return baseAggressive && Math.random() > 0.15;
  } else {
    return baseAggressive;
  }
}

/**
 * 根据难度调整防守策略
 *
 * @param handStrength - 手牌强度（0-100）
 * @param controlScore - 控制分数（0-100）
 * @param isLeading - 是否领出
 * @param difficulty - AI 难度
 * @returns 是否应该防守
 */
export function shouldPlayDefensiveAdjusted(
  handStrength: number,
  controlScore: number,
  isLeading: boolean,
  difficulty: AIDifficulty
): boolean {
  const baseDefensive = shouldPlayDefensive(
    handStrength,
    controlScore,
    isLeading
  );

  if (difficulty === 'easy') {
    return baseDefensive && Math.random() > 0.3;
  } else if (difficulty === 'medium') {
    return baseDefensive && Math.random() > 0.15;
  } else {
    return baseDefensive;
  }
}

/**
 * 评估队友情况
 *
 * 分析队友的手牌状态，判断是否需要支援。
 *
 * @param teammateCards - 队友手牌
 * @param levelRank - 当前级牌点数
 * @param lastPlay - 上家出牌
 * @returns 队友情况分析结果
 */
export function assessTeammateSituation(
  teammateCards: Card[],
  levelRank: number,
  lastPlay: Card[] | null
): TeammateSituation {
  const distribution = analyzeCardDistribution(teammateCards, levelRank);
  const controlScore = calculateControlScore({
    cardCount: teammateCards.length,
    strongCards: distribution.strongCards,
    hasJokers: distribution.hasJokers,
    levelRank,
  });

  const isLeading = !lastPlay || lastPlay.length === 0;
  const isStrong = controlScore > 50;
  const needsSupport = controlScore < 30 || distribution.weakCards > 5;
  // canLead：当前是领出回合（没有上家出牌）
  const canLead = isLeading;

  return { isLeading, isStrong, needsSupport, canLead };
}

/**
 * 找到最佳支援队友的出牌
 *
 * @param hand - 当前手牌
 * @param lastPlay - 上家出牌
 * @param levelRank - 当前级牌点数
 * @param teammateSituation - 队友情况
 * @returns 支援出牌动作
 */
export function findBestSupportMove(
  hand: Card[],
  lastPlay: Card[],
  levelRank: number,
  teammateSituation: TeammateSituation
): AIMove {
  const analysis = analyzeHand(hand, levelRank);
  const validMoves: AIMove[] = [];
  const lastMove = analyzeMove(lastPlay, levelRank);
  if (!lastMove) return { type: 'pass' };

  if (teammateSituation.needsSupport) {
    // 检查所有可能的牌型（包括单张、对子、三张等基础牌型）
    const allPossibleMoves = [
      ...analysis.singles,
      ...analysis.pairs,
      ...analysis.triples,
      ...analysis.straights,
      ...analysis.sequencePairs,
      ...analysis.sequenceTriples,
      ...analysis.fullHouses,
      ...analysis.bombs,
    ];

    allPossibleMoves.forEach((moveCards) => {
      const move = analyzeMove(moveCards, levelRank);
      if (move && canBeat(move, lastMove)) {
        validMoves.push({ type: 'play', cards: moveCards });
      }
    });
  }

  if (validMoves.length === 0) {
    return { type: 'pass' };
  }

  return validMoves[Math.floor(Math.random() * validMoves.length)];
}
