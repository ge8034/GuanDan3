import { Card } from '@/lib/store/game';
import { AIMove, AIDifficulty, TeammateSituation } from './ai-types';
import { findOptimalMove, adjustDifficulty } from './ai-strategy';
import {
  recordDecisionMetrics,
  getPerformanceStats,
  getRecentPerformance,
} from './ai-performance';
import { analyzeMove, getCardValue } from './rules';

// 有效难度级别
const VALID_DIFFICULTIES: AIDifficulty[] = ['easy', 'medium', 'hard'];

// 有效级牌范围（掼蛋规则：2-A，对应值 2-14）
const MIN_LEVEL_RANK = 2;
const MAX_LEVEL_RANK = 14;

// 控制分数计算常量
const CONTROL_SCORE = {
  HAND_LENGTH_WEIGHT: 5,       // 手牌长度权重
  STRONG_CARD_WEIGHT: 8,       // 强牌权重
  JOKER_BONUS: 15,             // 拥有大小王的加分
  SAFE_CARD_WEIGHT: 3,         // 安全牌权重
  STRONG_CARD_THRESHOLD: 11,   // 强牌阈值（>=该值视为强牌）
} as const;

/**
 * AI决策错误类
 */
export class AIDecisionError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AIDecisionError';
  }
}

/**
 * 验证AI决策参数
 * @returns 如果手牌为空，返回 true；否则正常验证，验证失败抛出错误
 */
function validateAIDecisionParams(
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty
): boolean {
  // 空手牌特殊处理：返回 true 让调用者处理
  if (hand.length === 0) {
    return true;
  }

  // 验证手牌
  if (!Array.isArray(hand)) {
    throw new AIDecisionError('Invalid hand: must be an array', 'INVALID_HAND_TYPE');
  }

  // 验证卡牌ID唯一性
  const cardIds = new Set(hand.map((c) => c.id));
  if (cardIds.size !== hand.length) {
    throw new AIDecisionError('Duplicate card IDs in hand', 'DUPLICATE_CARDS');
  }

  // 验证levelRank
  if (typeof levelRank !== 'number' || levelRank < MIN_LEVEL_RANK || levelRank > MAX_LEVEL_RANK) {
    throw new AIDecisionError(
      `Invalid levelRank: ${levelRank}. Must be between ${MIN_LEVEL_RANK} and ${MAX_LEVEL_RANK}`,
      'INVALID_LEVEL_RANK',
      { levelRank }
    );
  }

  // 验证difficulty
  if (!VALID_DIFFICULTIES.includes(difficulty)) {
    throw new AIDecisionError(
      `Invalid difficulty: ${difficulty}. Must be one of: ${VALID_DIFFICULTIES.join(', ')}`,
      'INVALID_DIFFICULTY',
      { difficulty }
    );
  }

  // 验证lastPlay（如果提供）
  if (lastPlay !== null && lastPlay !== undefined) {
    if (!Array.isArray(lastPlay)) {
      throw new AIDecisionError('Invalid lastPlay: must be an array or null', 'INVALID_LAST_PLAY_TYPE');
    }
  }

  return false;
}

export function decideMove(
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty,
  isLeading: boolean,
  teammateCards?: Card[],
  teammateSituation?: TeammateSituation
): AIMove {
  // 参数验证（空手牌返回 pass）
  const isEmptyHand = validateAIDecisionParams(hand, lastPlay, levelRank, difficulty);
  if (isEmptyHand) {
    return { type: 'pass' };
  }

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
    return value >= CONTROL_SCORE.STRONG_CARD_THRESHOLD && card.suit !== 'J';
  }).length;

  const hasJokers = hand.some((card) => card.suit === 'J');

  let score = hand.length * CONTROL_SCORE.HAND_LENGTH_WEIGHT;
  score += strongCards * CONTROL_SCORE.STRONG_CARD_WEIGHT;
  if (hasJokers) score += CONTROL_SCORE.JOKER_BONUS;

  const safeCards = hand.length - strongCards - (hasJokers ? 2 : 0);
  score += safeCards * CONTROL_SCORE.SAFE_CARD_WEIGHT;

  return score;
}

export { getPerformanceStats, clearPerformanceMetrics } from './ai-performance';
