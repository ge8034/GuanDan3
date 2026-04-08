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
 * 找到最优出牌动作（性能优化版）
 *
 * 使用早期剪枝和延迟计算策略，大幅提升AI决策速度。
 *
 * 优化策略：
 * 1. 跟牌时只生成能压过上家的牌型
 * 2. 延迟生成复杂组合（顺子、连对、连三、三带二）
 * 3. 限制搜索范围，优先简单牌型
 * 4. 缓存分析结果
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
  const lastMove =
    lastPlay && lastPlay.length > 0 ? analyzeMove(lastPlay, levelRank) : null;

  // 优化1: 跟牌时使用快速路径（但不跳过队友支援逻辑）
  if (lastMove && !isLeading && lastPlay && !teammateSituation?.needsSupport) {
    const fastMoves = findFastFollowMove(hand, lastPlay, levelRank, lastMove, difficulty);
    if (fastMoves.length > 0) {
      // 根据难度选择移动
      return selectMoveFromFastPath(fastMoves, difficulty);
    }
  }

  // 优化2: 队友支援快速路径
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

  // 完整分析（只在没有快速路径时使用）
  const analysis = analyzeHand(hand, levelRank);
  const bombDetection = detectBombOnlyHand(hand);

  // 优化3: 根据情况选择性生成组合
  const allPossibleMoves = generateTargetedMoves(
    hand,
    analysis,
    bombDetection,
    isLeading,
    lastPlay,
    lastMove
  );

  // 筛选有效出牌
  const validMoves: AIMove[] = [];
  for (const move of allPossibleMoves) {
    const m = analyzeMove(move, levelRank);
    if (!m) continue;

    if (!lastMove) {
      validMoves.push({ type: 'play', cards: move });
      continue;
    }

    if (canBeat(m, lastMove)) {
      validMoves.push({ type: 'play', cards: move });
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
 * 快速跟牌路径 - 性能优化
 *
 * 当跟牌时，只生成简单牌型（单张、对子、三张、炸弹），
 * 避免生成复杂的组合牌型，大幅提升速度。
 *
 * 返回排序后的候选移动列表（按评分从高到低）
 */
function findFastFollowMove(
  hand: Card[],
  lastPlay: Card[],
  levelRank: number,
  lastMove: ReturnType<typeof analyzeMove>,
  difficulty: AIDifficulty
): Card[][] {
  // lastMove 不应为 null，但为了类型安全做检查
  if (!lastMove) {
    return [];
  }

  // 构建值映射
  const valueMap = new Map<number, Card[]>();
  for (const card of hand) {
    const val = card.val;
    if (!valueMap.has(val)) {
      valueMap.set(val, []);
    }
    valueMap.get(val)!.push(card);
  }

  // 快速检查：只考虑简单牌型和炸弹
  const quickMoves: Card[][] = [];

  // 单张
  if (lastMove.type === 'single') {
    for (const [val, cards] of valueMap) {
      for (const card of cards) {
        const testMove = [card];
        const testAnalyzed = analyzeMove(testMove, levelRank);
        if (testAnalyzed && canBeat(testAnalyzed, lastMove)) {
          quickMoves.push(testMove);
        }
      }
    }
  }

  // 对子
  if (lastMove.type === 'pair') {
    for (const [val, cards] of valueMap) {
      if (cards.length >= 2) {
        for (let i = 0; i < cards.length - 1; i++) {
          for (let j = i + 1; j < cards.length; j++) {
            const testMove = [cards[i], cards[j]];
            const testAnalyzed = analyzeMove(testMove, levelRank);
            if (testAnalyzed && canBeat(testAnalyzed, lastMove)) {
              quickMoves.push(testMove);
            }
          }
        }
      }
    }
  }

  // 三张
  if (lastMove.type === 'triple') {
    for (const [val, cards] of valueMap) {
      if (cards.length >= 3) {
        for (let i = 0; i < cards.length - 2; i++) {
          for (let j = i + 1; j < cards.length - 1; j++) {
            for (let k = j + 1; k < cards.length; k++) {
              const testMove = [cards[i], cards[j], cards[k]];
              const testAnalyzed = analyzeMove(testMove, levelRank);
              if (testAnalyzed && canBeat(testAnalyzed, lastMove)) {
                quickMoves.push(testMove);
              }
            }
          }
        }
      }
    }
  }

  // 炸弹（可以压任何牌型）- 检查所有可能的炸弹长度
  for (const [val, cards] of valueMap) {
    if (cards.length >= 4) {
      // 生成所有可能的炸弹组合（4张、5张、6张...）
      for (let bombSize = 4; bombSize <= cards.length; bombSize++) {
        for (let i = 0; i <= cards.length - bombSize; i++) {
          const testMove = cards.slice(i, i + bombSize);
          const testAnalyzed = analyzeMove(testMove, levelRank);
          if (testAnalyzed && testAnalyzed.type === 'bomb' && canBeat(testAnalyzed, lastMove)) {
            quickMoves.push(testMove);
          }
        }
      }
    }
  }

  // 王炸
  const jokers = hand.filter(c => c.suit === 'J');
  if (jokers.length >= 2) {
    for (let i = 0; i < jokers.length - 1; i++) {
      const testMove = [jokers[i], jokers[i + 1]];
      const testAnalyzed = analyzeMove(testMove, levelRank);
      if (testAnalyzed && canBeat(testAnalyzed, lastMove)) {
        quickMoves.push(testMove);
      }
    }
  }

  if (quickMoves.length === 0) {
    return [];
  }

  // 选择策略：
  // - 跟炸弹时：选择最小的能压过的炸弹（保留大炸弹）
  // - 其他情况：选择最小的能压过的牌（保守策略）
  quickMoves.sort((a, b) => {
    // 跟炸弹时：优先选择能压过的最小炸弹
    if (lastMove.type === 'bomb') {
      // 先按张数升序（优先使用张数少的炸弹）
      // 例如：有4张炸弹8和5张炸弹8时，优先用4张的
      if (a.length !== b.length) return a.length - b.length;
      // 张数相同时按牌值升序（优先用牌值小的）
      const avgValA = a.reduce((sum, c) => sum + c.val, 0) / a.length;
      const avgValB = b.reduce((sum, c) => sum + c.val, 0) / b.length;
      return avgValA - avgValB;
    }
    // 其他情况：按总牌值升序排序（选择最小的牌）
    const scoreA = a.reduce((sum, c) => sum + c.val, 0);
    const scoreB = b.reduce((sum, c) => sum + c.val, 0);
    return scoreA - scoreB;
  });

  // 返回排序后的所有候选移动（最优在前）
  return quickMoves;
}

/**
 * 从快速路径的候选移动中选择一个
 *
 * 根据难度级别应用不同的选择策略
 */
function selectMoveFromFastPath(
  sortedMoves: Card[][],
  difficulty: AIDifficulty
): AIMove {
  if (sortedMoves.length === 0) {
    return { type: 'pass' };
  }

  // 根据难度选择
  if (difficulty === 'easy') {
    // 简单：从前3个中随机选择
    const topMoves = sortedMoves.slice(0, Math.min(3, sortedMoves.length));
    const selectedMove = topMoves[Math.floor(Math.random() * topMoves.length)];
    return { type: 'play', cards: selectedMove };
  } else if (difficulty === 'medium') {
    // 中等：70%选择最优，30%从前3个中随机
    const topMoves = sortedMoves.slice(0, Math.min(3, sortedMoves.length));
    const randomIndex = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * topMoves.length);
    return { type: 'play', cards: topMoves[randomIndex] };
  } else {
    // 困难：总是选择最优
    return { type: 'play', cards: sortedMoves[0] };
  }
}

/**
 * 有针对性地生成组合 - 性能优化
 *
 * 根据游戏状态选择性地生成组合：
 * - 跟牌时：只生成能压过上家的牌型
 * - 领牌时：优先简单牌型，复杂牌型按需生成
 * - 手牌少时：生成所有可能的牌型
 */
function generateTargetedMoves(
  hand: Card[],
  analysis: ReturnType<typeof analyzeHand>,
  bombDetection: { isOnlyFourOfAKind: boolean; isAllBombs: boolean },
  isLeading: boolean,
  lastPlay: Card[] | null,
  lastMove: ReturnType<typeof analyzeMove> | null
): Card[][] {
  // 基础牌型始终生成
  let moves: Card[][] = [
    ...analysis.singles,
    ...analysis.pairs,
    ...analysis.triples,
    ...analysis.bombs,
  ];

  // 跟牌时：限制复杂牌型生成
  if (lastMove && !isLeading) {
    // 只生成与上家牌型相同或更大的牌型
    switch (lastMove.type) {
      case 'straight':
        // 只生成顺子
        moves.push(...analysis.straights.slice(0, 10)); // 限制数量
        break;
      case 'sequencePairs':
        // 只生成连对
        moves.push(...analysis.sequencePairs.slice(0, 5));
        break;
      case 'sequenceTriples':
        // 只生成连三
        moves.push(...analysis.sequenceTriples.slice(0, 3));
        break;
      case 'fullhouse':
        // 只生成三带二
        moves.push(...analysis.fullHouses.slice(0, 10));
        break;
      default:
        // 其他情况只返回基础牌型
        break;
    }
  } else if (isLeading) {
    // 领牌时：根据手牌数量决定
    const handSize = hand.length;
    if (handSize <= 10) {
      // 手牌少：生成所有复杂牌型
      moves.push(
        ...analysis.straights,
        ...analysis.sequencePairs,
        ...analysis.sequenceTriples,
        ...analysis.fullHouses
      );
    } else if (handSize <= 20) {
      // 手牌中等：限制复杂牌型数量
      moves.push(
        ...analysis.straights.slice(0, 5),
        ...analysis.sequencePairs.slice(0, 3),
        ...analysis.fullHouses.slice(0, 5)
      );
    }
    // 手牌多：只使用基础牌型
  }

  // 炸弹特殊情况处理
  if ((bombDetection.isOnlyFourOfAKind || bombDetection.isAllBombs) && isLeading && !lastPlay) {
    moves = analysis.bombs;
  }

  return moves;
}

/**
 * 构建待评估的移动列表
 */
function buildMovesToEvaluate(
  validMoves: AIMove[],
  lastMove: ReturnType<typeof analyzeMove> | null
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
