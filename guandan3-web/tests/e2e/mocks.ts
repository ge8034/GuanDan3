/**
 * E2E测试mock设置（兼容性入口）
 *
 * 此文件重新导出共享模块的设置函数，保持向后兼容
 * 建议新测试直接使用 tests/e2e/shared/setup.ts
 */

import type { Page } from '@playwright/test'
import { setupGameMocks as setupSharedMocks, cleanupMockState } from './shared/setup'

/**
 * 设置游戏mock（兼容性函数）
 * @deprecated 建议直接从 shared 导入 setupGameMocks
 */
export async function setupGameMocks(page: Page, userId: string = 'mock-user-id'): Promise<void> {
  await setupSharedMocks(page, userId)
}

/**
 * 清理mock状态（兼容性函数）
 * @deprecated 建议直接从 shared 导入 cleanupMockState
 */
export function cleanupMockState_(): void {
  cleanupMockState()
}

// 导出所有共享类型和工具
export * from './shared'
