import { Card } from '@/lib/store/game';
import { AIMove, AIDifficulty, TeammateSituation } from './ai-types';
import { findOptimalMove, adjustDifficulty } from './ai-strategy';
import {
  recordDecisionMetrics,
  getPerformanceStats,
  getRecentPerformance,
} from './ai-performance';
import { analyzeMove, getCardValue } from './rules';

export function decideMove(
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty,
  isLeading: boolean,
  teammateCards?: Card[],
  teammateSituation?: TeammateSituation
): AIMove {
  const startTime = Date.now();

  const currentDifficulty = adjustDifficulty(
    difficulty,
    getPerformanceStats().winRate,
    getRecentPerformance()
  );

  const move = findOptimalMove(
    hand,
    lastPlay,
    levelRank,
    currentDifficulty,
    isLeading,
    teammateSituation
  );

  const cardType =
    move.type === 'play' && move.cards
      ? getCardTypeDescription(move.cards, levelRank)
      : undefined;

  recordDecisionMetrics(
    isLeading ? 'lead' : 'follow',
    cardType,
    hand.length,
    currentDifficulty,
    calculateControlScore(hand, levelRank),
    startTime
  );

  return move;
}

function getCardTypeDescription(cards: Card[], levelRank: number): string {
  return analyzeMove(cards, levelRank)?.type || 'unknown';
}

function calculateControlScore(hand: Card[], levelRank: number): number {
  const strongCards = hand.filter((card) => {
    const value = getCardValue(card, levelRank);
    return value >= 11 && card.suit !== 'J';
  }).length;

  const hasJokers = hand.some((card) => card.suit === 'J');

  let score = hand.length * 5;
  score += strongCards * 8;
  if (hasJokers) score += 15;

  const safeCards = hand.length - strongCards - (hasJokers ? 2 : 0);
  score += safeCards * 3;

  return score;
}

export { getPerformanceStats, clearPerformanceMetrics } from './ai-performance';
