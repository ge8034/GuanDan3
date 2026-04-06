/**
 * AI 决策模块
 *
 * 提供掼蛋游戏的 AI 决策功能，支持不同难度级别。
 *
 * @module ai
 */

import { Card } from '@/lib/store/game';
import type { AIMove, AIDifficulty, TeammateSituation } from './ai-types';
import { decideMove } from './ai-decision';
import { recordDecisionMetrics, getPerformanceStats, clearPerformanceMetrics, getRecentPerformance, calculateWinRate } from './ai-performance';

// ============================================================================
// 公共 API - 外部模块使用的函数
// ============================================================================

/**
 * AI 决策函数
 *
 * 根据当前手牌、上家出牌、级牌等信息，决定 AI 的出牌或过牌动作。
 *
 * @param hand - AI 当前手牌
 * @param lastMove - 上家出牌（领牌时为 null）
 * @param levelRank - 当前级牌点数
 * @param difficulty - AI 难度级别
 * @param isLeading - 是否领牌
 * @returns AI 决定的出牌动作
 *
 * @example
 * ```ts
 * const move = decideMove(hand, lastMove, 2, 'medium', true);
 * if (move.type === 'play') {
 *   console.log('AI 出牌:', move.cards);
 * }
 * ```
 */
export { decideMove };

// ============================================================================
// 性能监控 API
// ============================================================================

/**
 * 记录 AI 决策指标
 *
 * 用于内部性能分析，不建议外部直接调用。
 */
export { recordDecisionMetrics };

/**
 * 获取性能统计
 *
 * 返回 AI 决策的性能统计数据。
 */
export { getPerformanceStats };

/**
 * 清除性能指标
 *
 * 清除所有已记录的性能指标，通常在测试开始时调用。
 */
export { clearPerformanceMetrics };

/**
 * 获取最近的性能数据
 */
export { getRecentPerformance };

/**
 * 计算胜率
 */
export { calculateWinRate };

// ============================================================================
// 类型导出
// ============================================================================

/**
 * AI 相关类型定义
 *
 * 所有 AI 模块使用的公共类型。
 */
export type { AIMove, AIDifficulty, TeammateSituation } from './ai-types';

// ============================================================================
// 内部导出 - 仅供测试使用
// ============================================================================

/**
 * @internal
 * 以下导出仅供内部测试使用，不建议外部模块依赖
 */
export {
  // 策略函数
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

export {
  // 工具函数
  sortCards,
  filterSafeCards,
  countStrongCards,
  calculateHandStrength,
  analyzeCardDistribution,
  estimateMovesToClear,
  calculateControlScore,
  assessRisk,
} from './ai-utils';

export {
  // 牌型识别
  analyzeHand,
  findSingles,
  findPairs,
  findTriples,
  findBombs,
  findStraights,
  findFullHouses,
  findSequencePairs,
  findSequenceTriples,
  clearHandAnalysisCache,
  getHandAnalysisCacheStats,
} from './ai-pattern-recognition';
