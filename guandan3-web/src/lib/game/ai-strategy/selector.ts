/**
 * AI 最优移动选择模块
 *
 * 负责从所有可能的出牌中找到最优的出牌动作。
 */

import { Card } from '@/lib/store/game';
import { analyzeMove, canBeat } from '../rules';
import { AIMove, AIDifficulty, TeammateSituation } from '../ai-types';
import { analyzeHand } from '../ai-pattern-recognition';
import { evaluateMove } from './evaluator';
import { findBestSupportMove } from './strategy';

/**
 * 找到最优出牌动作
 *
 * 分析所有可能的出牌，评估每个出牌的分数，选择最优的出牌动作。
 *
 * @param hand - 当前手牌
 * @param lastPlay - 上家出牌
 * @param levelRank - 当前级牌点数
 * @param difficulty - AI 难度
 * @param isLeading - 是否领出
 * @param teammateSituation - 队友情况
 * @returns 最优出牌动作
 */
export function findOptimalMove(
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty,
  isLeading: boolean,
  teammateSituation?: TeammateSituation
): AIMove {
  const analysis = analyzeHand(hand, levelRank);
  const validMoves: AIMove[] = [];
  const lastMove =
    lastPlay && lastPlay.length > 0 ? analyzeMove(lastPlay, levelRank) : null;

  // 检测手牌是否只有炸弹
  const bombDetection = detectBombOnlyHand(hand);
  const allPossibleMoves = getAllPossibleMoves(analysis, bombDetection, isLeading, lastPlay);

  // 筛选有效出牌
  allPossibleMoves.forEach((move) => {
    const m = analyzeMove(move, levelRank);
    if (!m) return;
    if (!lastMove) {
      validMoves.push({ type: 'play', cards: move });
      return;
    }
    const canBeatResult = canBeat(m, lastMove);
    if (canBeatResult) validMoves.push({ type: 'play', cards: move });
  });

  // 队友支援逻辑
  if (shouldSupportTeammate(teammateSituation, lastPlay)) {
    const supportMove = findBestSupportMove(
      hand,
      lastPlay!,
      levelRank,
      teammateSituation!
    );
    if (supportMove.type === 'play') {
      return supportMove;
    }
  }

  // 构建待评估的移动列表
  const movesToEvaluate = buildMovesToEvaluate(validMoves, lastMove);

  if (movesToEvaluate.length === 0) {
    return { type: 'pass' };
  }

  // 评估所有移动
  const evaluatedMoves = movesToEvaluate.map((move) =>
    evaluateMove(move, hand, lastPlay, levelRank, difficulty, isLeading)
  );

  // 选择最优移动
  return selectBestMove(evaluatedMoves, difficulty);
}

/**
 * 检测手牌是否只有炸弹
 */
function detectBombOnlyHand(hand: Card[]) {
  // 检测手牌是否只有4张相同牌（炸弹情况）
  const isOnlyFourOfAKind =
    hand.length === 4 && hand.every((c) => c.val === hand[0].val);

  // 检测手牌是否主要由炸弹组成（每个牌值出现4次）
  const cardCounts: Record<number, number> = {};
  hand.forEach((c) => {
    cardCounts[c.val] = (cardCounts[c.val] || 0) + 1;
  });
  const isAllBombs =
    Object.values(cardCounts).length > 0 &&
    Object.values(cardCounts).every((count) => count === 4);

  return { isOnlyFourOfAKind, isAllBombs };
}

/**
 * 获取所有可能的出牌
 */
function getAllPossibleMoves(
  analysis: ReturnType<typeof analyzeHand>,
  bombDetection: { isOnlyFourOfAKind: boolean; isAllBombs: boolean },
  isLeading: boolean,
  lastPlay: Card[] | null
) {
  let allPossibleMoves = [
    ...analysis.singles,
    ...analysis.pairs,
    ...analysis.triples,
    ...analysis.bombs,
    ...analysis.straights,
    ...analysis.sequencePairs,
    ...analysis.sequenceTriples,
    ...analysis.fullHouses,
  ];

  // 如果手牌只有炸弹且领牌，只保留炸弹选项
  if (
    (bombDetection.isOnlyFourOfAKind || bombDetection.isAllBombs) &&
    isLeading &&
    !lastPlay
  ) {
    allPossibleMoves = analysis.bombs;
  }

  return allPossibleMoves;
}

/**
 * 判断是否应该支援队友
 */
function shouldSupportTeammate(
  teammateSituation?: TeammateSituation,
  lastPlay?: Card[] | null
): boolean {
  return (
    !!teammateSituation &&
    teammateSituation.needsSupport &&
    !!lastPlay &&
    lastPlay.length > 0
  );
}

/**
 * 构建待评估的移动列表
 */
function buildMovesToEvaluate(
  validMoves: AIMove[],
  lastMove: ReturnType<typeof analyzeMove>
): AIMove[] {
  const movesToEvaluate = [...validMoves];

  // 跟牌时，pass永远是一个选项
  if (lastMove && lastMove.type !== 'pass') {
    movesToEvaluate.push({ type: 'pass' });
  }

  return movesToEvaluate;
}

/**
 * 从评估的移动中选择最优移动
 */
function selectBestMove(
  evaluatedMoves: ReturnType<typeof evaluateMove>[],
  difficulty: AIDifficulty
): AIMove {
  // 按分数排序
  evaluatedMoves.sort((a, b) => b.score - a.score);

  // 取前几个最优移动
  const topMoves = evaluatedMoves.slice(0, Math.min(3, evaluatedMoves.length));

  // 根据难度选择
  if (difficulty === 'easy') {
    // 简单：随机选择
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  } else if (difficulty === 'medium') {
    // 中等：70%选择最优，30%随机
    const randomIndex =
      Math.random() < 0.7 ? 0 : Math.floor(Math.random() * topMoves.length);
    return topMoves[randomIndex].move;
  } else {
    // 困难：总是选择最优
    return topMoves[0].move;
  }
}
