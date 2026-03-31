import { Card } from '@/lib/store/game';
import { AIMove, AIDifficulty, TeammateSituation } from './ai-types';
import { decideMove } from './ai-decision';
import {
  shouldPlayAggressive,
  shouldPlayDefensive,
  shouldPlayAggressiveAdjusted,
  shouldPlayDefensiveAdjusted,
  assessTeammateSituation,
  findBestSupportMove,
  evaluateMove,
  findOptimalMove,
  adjustDifficulty,
} from './ai-strategy';
import {
  sortCards,
  filterSafeCards,
  countStrongCards,
  calculateHandStrength,
  analyzeCardDistribution,
  estimateMovesToClear,
  calculateControlScore,
  assessRisk,
} from './ai-utils';
import {
  analyzeHand,
  findSingles,
  findPairs,
  findTriples,
  findBombs,
  findStraights,
  findFullHouses,
  findSequencePairs,
  findSequenceTriples,
} from './ai-pattern-recognition';
import {
  recordDecisionMetrics,
  getPerformanceStats,
  clearPerformanceMetrics,
  getRecentPerformance,
  calculateWinRate,
} from './ai-performance';

export type { AIMove, AIDifficulty, TeammateSituation } from './ai-types';

export {
  decideMove,
  shouldPlayAggressive,
  shouldPlayDefensive,
  shouldPlayAggressiveAdjusted,
  shouldPlayDefensiveAdjusted,
  assessTeammateSituation,
  findBestSupportMove,
  evaluateMove,
  findOptimalMove,
  adjustDifficulty,
  sortCards,
  filterSafeCards,
  countStrongCards,
  calculateHandStrength,
  analyzeCardDistribution,
  estimateMovesToClear,
  calculateControlScore,
  assessRisk,
  analyzeHand,
  findSingles,
  findPairs,
  findTriples,
  findBombs,
  findStraights,
  findFullHouses,
  findSequencePairs,
  findSequenceTriples,
  recordDecisionMetrics,
  getPerformanceStats,
  clearPerformanceMetrics,
  getRecentPerformance,
  calculateWinRate,
};
