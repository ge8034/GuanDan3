/**
 * 手动开始游戏的测试
 * 
 * 这个测试绕过自动开始逻辑，直接调用 start_game RPC
 */

import { test, expect } from '@playwright/test';
import { setupGameMocks, cleanupMockState } from './shared';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('手动开始游戏测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test.afterEach(() => {
    cleanupMockState();
  });

  test('手动调用 start_game RPC', async ({ page }) => {
    // 1. 进入练习房
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房');

    // 2. 等待房间加载
    await page.waitForTimeout(2000);

    // 3. 手动触发 start_game（通过拦截 RPC 调用）
    await page.evaluate(async () => {
      // 获取 roomId
      const roomId = window.location.pathname.split('/').pop();
      
      // 直接调用 start_game RPC
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/start_game`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${localStorage.getItem('sb-access-token')}`,
        },
        body: JSON.stringify({ p_room_id: roomId }),
      });

      if (!response.ok) {
        throw new Error(`start_game failed: ${response.statusText}`);
      }

      return await response.json();
    });

    console.log('✓ 手动调用 start_game');

    // 4. 等待游戏状态更新
    await page.waitForTimeout(3000);

    // 5. 检查手牌
    const cardCount = await page.locator('[data-card-id]').count();
    console.log(`手牌数量: ${cardCount}`);

    expect(cardCount, '应该有手牌').toBeGreaterThan(0);
  });
});
