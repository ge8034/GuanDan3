/**
 * 统一的E2E测试mock设置
 * 模块化的mock设置，消除代码重复
 */

import type { Page } from '@playwright/test'
import { setupAuthMocks } from './mocks/auth'
import { setupRoomMocks } from './mocks/rooms'
import { setupGameRpcMocks } from './mocks/game-rpc'
import { setupGameApiMocks } from './mocks/game-api'
import { setupChatMocks } from './mocks/chat'

/**
 * 设置所有E2E测试所需的mock
 * @param page - Playwright页面对象
 * @param userId - 测试用户ID
 */
export async function setupGameMocks(page: Page, userId: string = 'mock-user-id'): Promise<void> {
  // 按模块设置mock，提高可维护性
  await setupAuthMocks(page, userId)
  await setupRoomMocks(page, userId)
  await setupGameRpcMocks(page, userId)
  await setupGameApiMocks(page, userId)
  await setupChatMocks(page)
}

/**
 * 清理mock状态
 * 在测试结束后调用
 */
export function cleanupMockState(): void {
  // 清理全局状态
  delete (global as any).mockRooms
  delete (global as any).mockGameId
  delete (global as any).mockRoomId
  delete (global as any).mockHandCards
  delete (global as any).mockRoomInfo
  delete (global as any).isPracticeRoom
}
