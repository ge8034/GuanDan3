/**
 * ai-utils.ts - AI 工具函数统一导出
 *
 * 此文件保持向后兼容，重新导出所有 AI 工具函数。
 *
 * @deprecated 建议直接从 @/lib/game/ai-utils 导入所需函数
 * @example
 *   // 推荐：直接导入
 *   import { assessRisk, sortCards } from '@/lib/game/ai-utils';
 *
 *   // 或者从子模块导入
 *   import { assessRisk } from '@/lib/game/ai-utils/evaluation';
 *   import { sortCards } from '@/lib/game/ai-utils/sorting';
 */

// 从 index.ts 重新导出所有内容
export * from './ai-utils/index';
