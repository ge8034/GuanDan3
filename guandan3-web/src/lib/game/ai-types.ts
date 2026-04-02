import { Card } from '@/lib/store/game';

// ============================================================================
// 核心 AI 类型
// ============================================================================

/**
 * AI 出牌动作
 *
 * 表示 AI 决定的出牌或过牌动作。
 *
 * @example
 * ```ts
 * // 出牌动作
 * const playMove: AIMove = {
 *   type: 'play',
 *   cards: [card1, card2, card3]
 * };
 *
 * // 过牌动作
 * const passMove: AIMove = { type: 'pass' };
 * ```
 */
export interface AIMove {
  /** 动作类型：'play' 表示出牌，'pass' 表示过牌 */
  type: 'play' | 'pass';
  /** 出牌时包含的卡牌，过牌时为 undefined */
  cards?: Card[];
}

/**
 * AI 难度级别
 *
 * - **easy**: 简单模式，AI 随机出牌
 * - **medium**: 中等模式，AI 基础策略
 * - **hard**: 困难模式，AI 高级策略
 *
 * @example
 * ```ts
 * const difficulty: AIDifficulty = 'medium';
 * const move = decideMove(hand, lastMove, 2, difficulty, true);
 * ```
 */
export type AIDifficulty = 'easy' | 'medium' | 'hard';

// ============================================================================
// 决策分析类型
// ============================================================================

/**
 * AI 决策指标
 *
 * 记录 AI 决策时的各项指标，用于分析和优化。
 *
 * @internal
 */
export interface AIDecisionMetrics {
  /** 决策耗时（毫秒） */
  decisionTime: number;
  /** 决策类型 */
  decisionType: 'lead' | 'follow' | 'pass';
  /** 出牌类型 */
  cardType?: string;
  /** 手牌大小 */
  handSize: number;
  /** AI 难度 */
  difficulty: AIDifficulty;
  /** 控制分数 */
  controlScore: number;
  /** 决策时间戳 */
  timestamp: number;
}

/**
 * 手牌分析结果
 *
 * 对手牌进行全面分析后得出的各种牌型组合。
 *
 * @example
 * ```ts
 * const analysis = analyzeHand(hand, 2);
 * console.log('对子数量:', analysis.pairs.length);
 * console.log('炸弹数量:', analysis.bombs.length);
 * ```
 */
export interface HandAnalysis {
  /** 可出的单张组合 */
  singles: Card[][];
  /** 可出的对子组合 */
  pairs: Card[][];
  /** 可出的三张组合 */
  triples: Card[][];
  /** 可出的炸弹组合 */
  bombs: Card[][];
  /** 可出的顺子组合 */
  straights: Card[][];
  /** 可出的连对组合（飞机带翅膀） */
  sequencePairs: Card[][];
  /** 可出的连三组合（飞机不带翅膀） */
  sequenceTriples: Card[][];
  /** 可出的三带二组合 */
  fullHouses: Card[][];
}

/**
 * 卡牌分布分析
 *
 * 手牌的花色、点数分布统计。
 *
 * @internal
 */
export interface CardDistribution {
  /** 各花色数量 */
  suitCounts: Record<string, number>;
  /** 各点数数量 */
  valueCounts: Record<number, number>;
  /** 是否有王牌 */
  hasJokers: boolean;
  /** 强牌数量 */
  strongCards: number;
  /** 弱牌数量 */
  weakCards: number;
}

/**
 * 出牌评估结果
 *
 * 对某个出牌选项进行评估的结果。
 *
 * @internal
 */
export interface MoveEvaluation {
  /** 出牌动作 */
  move: AIMove;
  /** 评分 */
  score: number;
  /** 风险值 */
  risk: number;
  /** 收益值 */
  benefit: number;
  /** 决策理由 */
  reasoning: string;
}

/**
 * 队友情况分析
 *
 * 分析队友在当前局面的状态。
 *
 * @example
 * ```ts
 * const situation = assessTeammateSituation(gameState, teammateSeat);
 * if (situation.needsSupport) {
 *   // 调整策略以支援队友
 * }
 * ```
 */
export interface TeammateSituation {
  /** 队友是否当前领出 */
  isLeading: boolean;
  /** 队友是否处于强势 */
  isStrong: boolean;
  /** 队友是否需要支援 */
  needsSupport: boolean;
  /** 队友是否能够领出 */
  canLead: boolean;
}

// ============================================================================
// 性能统计类型
// ============================================================================

/**
 * AI 性能统计
 *
 * AI 决策的性能统计数据。
 *
 * @internal
 */
export interface AIPerformanceStats {
  /** 总决策次数 */
  totalDecisions: number;
  /** 平均决策时间（毫秒） */
  avgDecisionTime: number;
  /** 领牌次数 */
  leadCount: number;
  /** 跟牌次数 */
  followCount: number;
  /** 过牌次数 */
  passCount: number;
  /** 各类型出牌分布 */
  cardTypeDistribution: Record<string, number>;
}

/**
 * 最近的性能数据
 *
 * 最近的 N 次决策的性能数据。
 *
 * @internal
 */
export interface AIPerformanceSnapshot {
  /** 快照时间戳 */
  timestamp: number;
  /** 决策次数 */
  count: number;
  /** 平均耗时 */
  avgTime: number;
  /** 最长耗时 */
  maxTime: number;
  /** 最短耗时 */
  minTime: number;
}
