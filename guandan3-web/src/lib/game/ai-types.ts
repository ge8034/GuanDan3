import { Card } from '@/lib/store/game';

export interface AIMove {
  type: 'play' | 'pass';
  cards?: Card[];
}

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface AIDecisionMetrics {
  decisionTime: number;
  decisionType: 'lead' | 'follow' | 'pass';
  cardType?: string;
  handSize: number;
  difficulty: AIDifficulty;
  controlScore: number;
  timestamp: number;
}

export interface HandAnalysis {
  singles: Card[][];
  pairs: Card[][];
  triples: Card[][];
  bombs: Card[][];
  straights: Card[][];
  sequencePairs: Card[][];
  sequenceTriples: Card[][];
  fullHouses: Card[][];
}

export interface CardDistribution {
  suitCounts: Record<string, number>;
  valueCounts: Record<number, number>;
  hasJokers: boolean;
  strongCards: number;
  weakCards: number;
}

export interface MoveEvaluation {
  move: AIMove;
  score: number;
  risk: number;
  benefit: number;
  reasoning: string;
}

export interface TeammateSituation {
  isLeading: boolean;
  isStrong: boolean;
  needsSupport: boolean;
  canLead: boolean;
}
