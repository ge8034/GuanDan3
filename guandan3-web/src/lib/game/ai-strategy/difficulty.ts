/**
 * AI 难度调整模块
 *
 * 负责根据游戏表现动态调整 AI 难度。
 */

import { AIDifficulty } from '../ai-types';

/**
 * 根据胜率和近期表现调整 AI 难度
 *
 * 当 AI 胜率过高且表现持续优秀时，提高难度；
 * 当 AI 胜率过低且表现持续不佳时，降低难度。
 *
 * @param currentDifficulty - 当前难度
 * @param winRate - 胜率（0-1）
 * @param recentPerformance - 近期表现分数列表（0-1）
 * @returns 调整后的难度
 */
export function adjustDifficulty(
  currentDifficulty: AIDifficulty,
  winRate: number,
  recentPerformance: number[]
): AIDifficulty {
  if (recentPerformance.length === 0) return currentDifficulty;

  // 胜率高且表现持续优秀 → 提高难度
  if (winRate > 0.7 && recentPerformance.every((p) => p > 0.8)) {
    if (currentDifficulty !== 'hard') {
      return 'hard';
    }
  }
  // 胜率低且表现持续不佳 → 降低难度
  else if (winRate < 0.3 && recentPerformance.every((p) => p < 0.4)) {
    if (currentDifficulty !== 'easy') {
      return 'easy';
    }
  }

  return currentDifficulty;
}
