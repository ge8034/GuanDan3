/**
 * AI 策略模块 - 统一导出
 *
 * 这个文件将 AI 策略相关的所有功能统一导出，保持向后兼容。
 *
 * 模块结构：
 * - evaluator.ts: 移动评估逻辑
 * - selector.ts: 最优移动选择
 * - strategy.ts: 攻击/防守策略判断
 * - difficulty.ts: 难度调整逻辑
 */

// 策略判断
export {
  shouldPlayAggressive,
  shouldPlayDefensive,
  shouldPlayAggressiveAdjusted,
  shouldPlayDefensiveAdjusted,
  assessTeammateSituation,
  findBestSupportMove,
} from './strategy';

// 移动评估
export { evaluateMove } from './evaluator';

// 最优移动选择
export { findOptimalMove } from './selector';

// 难度调整
export { adjustDifficulty } from './difficulty';
