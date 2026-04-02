/**
 * AI 策略模块 - 向后兼容导出
 *
 * 这个文件保持向后兼容，所有导出从 ai-strategy/ 目录重新导出。
 * 建议新代码直接从 '@/lib/game/ai-strategy' 导入。
 *
 * @deprecated 请直接从 '@/lib/game/ai-strategy' 导入
 */

// 从子模块重新导出所有功能
export {
  shouldPlayAggressive,
  shouldPlayDefensive,
  shouldPlayAggressiveAdjusted,
  shouldPlayDefensiveAdjusted,
  assessTeammateSituation,
  findBestSupportMove,
  evaluateMove,
  findOptimalMove,
  adjustDifficulty,
} from './ai-strategy/index';
