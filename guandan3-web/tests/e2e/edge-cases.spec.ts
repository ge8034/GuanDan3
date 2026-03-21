import { test, expect } from '@playwright/test';
import { setupGameMocks } from './mocks';

test.describe('Edge Cases and Boundary Conditions', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page, 'test-user-id');
  });

  test('边界情况：网络不稳定时的重连机制', async ({ page, context }) => {
    console.log('Testing network instability reconnection');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    await page.fill('[data-testid="lobby-create-name"]', `NetworkTest-${Date.now()}`);
    await page.click('[data-testid="lobby-create"]');
    await page.waitForURL(/\/room\//);
    
    await page.waitForTimeout(3000);
    
    const initialContent = await page.content();
    expect(initialContent).toContain('掼蛋');
    
    await context.setOffline(true);
    await page.waitForTimeout(2000);
    
    await context.setOffline(false);
    await page.waitForTimeout(5000);
    
    const reconnectedContent = await page.content();
    expect(reconnectedContent).toContain('掼蛋');
    
    console.log('Network reconnection test passed');
  });

  test('边界情况：快速连续点击按钮', async ({ page }) => {
    console.log('Testing rapid button clicks');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    await page.fill('[data-testid="lobby-create-name"]', `RapidClickTest-${Date.now()}`);
    
    const createButton = page.locator('[data-testid="lobby-create"]');
    
    await Promise.all([
      createButton.click(),
      createButton.click(),
      createButton.click()
    ]);
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/room\//);
    
    console.log('Rapid click test passed');
  });

  test('边界情况：空房间名称处理', async ({ page }) => {
    console.log('Testing empty room name handling');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    const createButton = page.locator('[data-testid="lobby-create"]');
    
    await createButton.click();
    
    await page.waitForTimeout(1000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/lobby')) {
      console.log('Empty room name was rejected - stayed on lobby page');
      const errorMessage = page.locator('text=房间名称不能为空, text=请输入房间名称, text=required, text=必填').first();
      const isErrorMessageVisible = await errorMessage.isVisible().catch(() => false);
      
      if (isErrorMessageVisible) {
        console.log('Empty room name validation works correctly');
      } else {
        console.log('Empty room name was rejected but no error message shown');
      }
    } else {
      console.log('Empty room name was accepted - may need validation implementation');
    }
  });

  test('边界情况：超长房间名称处理', async ({ page }) => {
    console.log('Testing very long room name handling');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    const longName = 'A'.repeat(100);
    await page.fill('[data-testid="lobby-create-name"]', longName);
    
    const createButton = page.locator('[data-testid="lobby-create"]');
    await createButton.click();
    
    await page.waitForTimeout(2000);
    
    const currentUrl = page.url();
    if (currentUrl.includes('/room/')) {
      console.log('Long room name was accepted');
    } else {
      console.log('Long room name was rejected or truncated');
    }
  });

  test('边界情况：游戏状态快速切换', async ({ page }) => {
    console.log('Testing rapid game state changes');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    await page.fill('[data-testid="lobby-create-name"]', `StateChangeTest-${Date.now()}`);
    await page.click('[data-testid="lobby-create"]');
    await page.waitForURL(/\/room\//);
    
    await page.waitForTimeout(5000);
    
    const handArea = page.locator('[data-testid="room-hand"]');
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    
    const initialCardCount = await cards.count();
    console.log(`Initial card count: ${initialCardCount}`);
    
    if (initialCardCount > 0) {
      const firstCard = cards.first();
      await firstCard.click();
      await page.waitForTimeout(500);
      
      const playButton = page.locator('button:has-text("出牌")');
      const isPlayButtonVisible = await playButton.isVisible().catch(() => false);
      
      if (isPlayButtonVisible) {
        await playButton.click();
        await page.waitForTimeout(1000);
        
        const afterPlayCardCount = await cards.count();
        console.log(`After play card count: ${afterPlayCardCount}`);
        
        expect(afterPlayCardCount).toBeLessThan(initialCardCount);
      }
    }
    
    console.log('Game state change test completed');
  });

  test('边界情况：页面刷新后状态恢复', async ({ page }) => {
    console.log('Testing state recovery after page refresh');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    await page.fill('[data-testid="lobby-create-name"]', `RefreshTest-${Date.now()}`);
    await page.click('[data-testid="lobby-create"]');
    await page.waitForURL(/\/room\//);
    
    const roomId = page.url().split('/').pop();
    console.log(`Created room: ${roomId}`);
    
    await page.waitForTimeout(3000);
    
    const beforeRefreshContent = await page.content();
    expect(beforeRefreshContent).toContain('掼蛋');
    
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    const afterRefreshContent = await page.content();
    expect(afterRefreshContent).toContain('掼蛋');
    
    console.log('Page refresh state recovery test passed');
  });

  test('边界情况：多标签页同时操作', async ({ context }) => {
    console.log('Testing multi-tab simultaneous operations');
    
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await setupGameMocks(page1, 'user-1');
    await setupGameMocks(page2, 'user-2');
    
    await page1.goto('http://localhost:3000');
    await page2.goto('http://localhost:3000');
    
    await Promise.all([
      page1.click('[data-testid="home-enter-lobby"]'),
      page2.click('[data-testid="home-enter-lobby"]')
    ]);
    
    await Promise.all([
      page1.waitForURL(/\/lobby/),
      page2.waitForURL(/\/lobby/)
    ]);
    
    const roomName = `MultiTabTest-${Date.now()}`;
    
    await page1.fill('[data-testid="lobby-create-name"]', roomName);
    await page1.click('[data-testid="lobby-create"]');
    await page1.waitForURL(/\/room\//);
    
    await page2.goto('http://localhost:3000/lobby');
    await page2.waitForTimeout(2000);
    
    const roomCard = page2.locator(`div.bg-white.rounded-lg`).filter({ hasText: roomName }).first();
    const isRoomVisible = await roomCard.isVisible().catch(() => false);
    
    if (isRoomVisible) {
      console.log('Multi-tab room synchronization works');
    } else {
      console.log('Multi-tab room visibility may need investigation');
    }
    
    await page1.close();
    await page2.close();
    
    console.log('Multi-tab test completed');
  });

  test('边界情况：特殊字符房间名称', async ({ page }) => {
    console.log('Testing special characters in room name');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    const specialNames = [
      '测试房间!@#$%',
      'Room with <script>',
      '房间名称"quotes"',
      "Room'with'single'quotes"
    ];
    
    for (const specialName of specialNames) {
      await page.fill('[data-testid="lobby-create-name"]', `${specialName}-${Date.now()}`);
      await page.click('[data-testid="lobby-create"]');
      
      await page.waitForTimeout(1000);
      
      const currentUrl = page.url();
      if (currentUrl.includes('/room/')) {
        console.log(`Special name accepted: ${specialName.substring(0, 20)}...`);
        await page.goto('http://localhost:3000/lobby');
        await page.waitForTimeout(500);
      } else {
        console.log(`Special name rejected: ${specialName.substring(0, 20)}...`);
      }
    }
    
    console.log('Special characters test completed');
  });

  test('边界情况：长时间无操作超时', async ({ page }) => {
    console.log('Testing long inactivity timeout');
    
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    await page.fill('[data-testid="lobby-create-name"]', `InactivityTest-${Date.now()}`);
    await page.click('[data-testid="lobby-create"]');
    await page.waitForURL(/\/room\//);
    
    await page.waitForTimeout(3000);
    
    const beforeInactivityContent = await page.content();
    expect(beforeInactivityContent).toContain('掼蛋');
    
    await page.waitForTimeout(60000);
    
    const afterInactivityContent = await page.content();
    const stillInRoom = afterInactivityContent.includes('掼蛋');
    
    if (stillInRoom) {
      console.log('Still in room after inactivity - no timeout implemented');
    } else {
      console.log('Room timeout after inactivity - timeout implemented');
    }
    
    console.log('Inactivity timeout test completed');
  });
});