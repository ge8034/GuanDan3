import { Card } from '@/lib/store/game';
import { getCardValue, analyzeMove, canBeat } from './rules';
import {
  AIMove,
  AIDifficulty,
  MoveEvaluation,
  TeammateSituation,
} from './ai-types';
import {
  calculateHandStrength,
  assessRisk,
  calculateControlScore,
  analyzeCardDistribution,
  estimateMovesToClear,
} from './ai-utils';
import { analyzeHand } from './ai-pattern-recognition';

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

export function assessTeammateSituation(
  teammateCards: Card[],
  levelRank: number,
  lastPlay: Card[] | null
): TeammateSituation {
  const distribution = analyzeCardDistribution(teammateCards, levelRank);
  const controlScore = calculateControlScore(
    teammateCards.length,
    distribution.strongCards,
    distribution.hasJokers,
    levelRank
  );

  const isLeading = !lastPlay || lastPlay.length === 0;
  const isStrong = controlScore > 50;
  const needsSupport = controlScore < 30 || distribution.weakCards > 5;
  const canLead = isLeading || (lastPlay && lastPlay.length > 0);

  return { isLeading, isStrong, needsSupport, canLead };
}

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
    // 检查所有可能的牌型
    const allPossibleMoves = [
      ...analysis.bombs,
      ...analysis.fullHouses,
      ...analysis.sequenceTriples,
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
  const controlScore = calculateControlScore(
    hand.length,
    distribution.strongCards,
    distribution.hasJokers,
    levelRank
  );

  let score = 0;
  let risk = 0;
  let benefit = 0;
  const reasoning: string[] = [];

  const handStrength = calculateHandStrength(
    hand.length,
    moveCards.reduce((sum, card) => sum + getCardValue(card, levelRank), 0),
    analysis?.type || 'unknown'
  );

  // 领出 vs 跟牌的不同评分策略
  if (isLeading) {
    score += 20;
    reasoning.push('Leading play');

    // 领出时：鼓励出小牌、多张牌（保留大牌和炸弹）
    if (analysis && analysis.primaryValue) {
      // 炸弹的主值包含基数（如1000），需要提取实际牌值
      let actualValue = analysis.primaryValue;
      if (analysis.type === 'bomb') {
        // 提取实际牌值：1000 * length + cardValue -> cardValue
        actualValue = analysis.primaryValue % 1000;
      }
      score += 500 - actualValue * 5; // 主值越小分数越高
      reasoning.push(`Primary value bonus: ${500 - actualValue * 5}`);
    }

    // 非炸弹多张牌加分（增加权重，鼓励出对子、三张等）
    if (analysis?.type !== 'bomb') {
      // 对子、三张等牌型额外加分
      if (moveCards.length === 2) {
        score += 50; // 对子额外加分
        reasoning.push(`Pair bonus: 50`);
      } else if (moveCards.length === 3) {
        score += 80; // 三张额外加分
        reasoning.push(`Triple bonus: 80`);
      }
      score += moveCards.length * 15; // 基础多张牌加分（提高从10到15）
      reasoning.push(`Cards played bonus: ${moveCards.length * 15}`);
    }
  } else {
    // 跟牌时：鼓励用最小的能压过的牌（掼蛋策略）
    // 使用主值的负数作为基础分，主值越小分数越高
    if (analysis && analysis.primaryValue) {
      // 炸弹的主值包含基数（如1000），需要提取实际牌值
      let actualValue = analysis.primaryValue;
      if (analysis.type === 'bomb') {
        // 提取实际牌值：1000 * length + cardValue -> cardValue
        actualValue = analysis.primaryValue % 1000;
      }
      score += 1000 - actualValue * 10; // 主值越小分数越高
      reasoning.push(`Primary value penalty: -${actualValue * 10}`);
    }

    // 跟牌时：多张牌稍微加分，但炸弹要扣分
    const cardsPlayed = moveCards.length;
    if (analysis?.type !== 'bomb') {
      score += cardsPlayed * 2; // 非炸弹才加分
    }
    reasoning.push(`Cards played: ${cardsPlayed}`);
  }

  const riskAssessment = assessRisk(moveCards, hand, levelRank, isLeading);
  risk = riskAssessment;
  score -= risk * 0.5;
  reasoning.push(`Risk: ${riskAssessment}`);

  const estimatedMoves = estimateMovesToClear(hand, levelRank);
  benefit = estimatedMoves * 3;
  reasoning.push(`Estimated moves to clear: ${estimatedMoves}`);

  // 领出时炸弹要大幅扣分（保留炸弹到最后），跟牌时炸弹也要扣分
  if (analysis?.type === 'bomb') {
    reasoning.push('Bomb play');
    // 四带二（6张）扣分较少，因为能快速出牌
    const penalty = moveCards.length > 4 ? 200 : 800;

    // 如果用炸弹压单张，额外扣分（保留炸弹）
    if (lastPlay && lastPlay.length === 1) {
      score -= 2000;
      reasoning.push('Bomb vs single - save for later');
    }

    score -= penalty;
    reasoning.push(`Bomb penalty -${penalty} (save for later)`);

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
  }

  // 接近结束时加分
  const remainingCards = hand.length - moveCards.length;
  if (remainingCards <= 5) {
    score += 15;
    reasoning.push('Near end of hand');
  }

  if (difficulty === 'easy') {
    score *= 0.7;
  } else if (difficulty === 'medium') {
    score *= 0.85;
  }

  return {
    move,
    score: Math.max(0, score),
    risk,
    benefit,
    reasoning: reasoning.join(', '),
  };
}

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

  const allPossibleMoves = [
    ...analysis.singles,
    ...analysis.pairs,
    ...analysis.triples,
    ...analysis.bombs,
    ...analysis.straights,
    ...analysis.sequencePairs,
    ...analysis.sequenceTriples,
    ...analysis.fullHouses,
  ];

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

  if (validMoves.length === 0) {
    return { type: 'pass' };
  }

  if (
    teammateSituation &&
    teammateSituation.needsSupport &&
    lastPlay &&
    lastPlay.length > 0
  ) {
    const supportMove = findBestSupportMove(
      hand,
      lastPlay,
      levelRank,
      teammateSituation
    );
    if (supportMove.type === 'play') {
      return supportMove;
    }
  }

  const evaluatedMoves = validMoves.map((move) =>
    evaluateMove(move, hand, lastPlay, levelRank, difficulty, isLeading)
  );

  evaluatedMoves.sort((a, b) => b.score - a.score);

  const topMoves = evaluatedMoves.slice(0, Math.min(3, evaluatedMoves.length));

  if (difficulty === 'easy') {
    return topMoves[Math.floor(Math.random() * topMoves.length)].move;
  } else if (difficulty === 'medium') {
    const randomIndex =
      Math.random() < 0.7 ? 0 : Math.floor(Math.random() * topMoves.length);
    return topMoves[randomIndex].move;
  } else {
    return topMoves[0].move;
  }
}

export function adjustDifficulty(
  currentDifficulty: AIDifficulty,
  winRate: number,
  recentPerformance: number[]
): AIDifficulty {
  if (recentPerformance.length === 0) return currentDifficulty;

  if (winRate > 0.7 && recentPerformance.every((p) => p > 0.8)) {
    if (currentDifficulty !== 'hard') {
      return 'hard';
    }
  } else if (winRate < 0.3 && recentPerformance.every((p) => p < 0.4)) {
    if (currentDifficulty !== 'easy') {
      return 'easy';
    }
  }

  return currentDifficulty;
}
