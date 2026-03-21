import { test, expect, BrowserContext, Page } from '@playwright/test';
import { setupGameMocks } from './mocks';

test.describe('可靠性测试 - 并发与竞态', () => {
  test.setTimeout(120000);

  let contexts: BrowserContext[] = [];
  let pages: Page[] = [];

  test.afterEach(async () => {
    for (const ctx of contexts) {
      await ctx?.close().catch(() => {});
    }
    contexts = [];
    pages = [];
  });

  const loginAndCreateRoom = async (page: Page, name: string) => {
    await page.goto('http://localhost:3000');
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    
    await page.fill('[data-testid="lobby-create-name"]', `ReliabilityTest-${Date.now()}`);
    await page.click('[data-testid="lobby-create"]');
    await page.waitForURL(/\/room\//);
    return page.url().split('/').pop();
  };

  const joinRoom = async (page: Page, roomId: string) => {
    await page.goto(`http://localhost:3000/room/${roomId}`);
    await page.waitForTimeout(2000);
    
    const joinOverlayBtn = page.locator('button:has-text("加入对局")');
    if (await joinOverlayBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await joinOverlayBtn.click();
    }
    
    await page.waitForTimeout(1000);
  };

  test('多人同时加入房间并发测试', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    contexts.push(hostContext);
    pages.push(hostPage);

    await setupGameMocks(hostPage);
    const roomId = await loginAndCreateRoom(hostPage, 'Host');
    expect(roomId).toBeTruthy();
    console.log(`Room created: ${roomId}`);

    const playerContexts: BrowserContext[] = [];
    const playerPages: Page[] = [];

    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await setupGameMocks(page, `mock-user-id-${i + 2}`);
      playerContexts.push(ctx);
      playerPages.push(page);
      contexts.push(ctx);
      pages.push(page);
    }

    console.log('Starting concurrent join test...');
    
    const joinPromises = playerPages.map((page, index) => 
      joinRoom(page, roomId!).then(() => {
        console.log(`Player ${index + 2} joined successfully`);
      }).catch(err => {
        console.error(`Player ${index + 2} join failed:`, err);
        throw err;
      })
    );

    await Promise.all(joinPromises);

    await hostPage.waitForTimeout(2000);

    for (let i = 0; i < 3; i++) {
      const seatLocator = hostPage.locator(`text=座位 ${i + 1}`);
      await expect(seatLocator).toBeVisible({ timeout: 10000 });
      console.log(`Seat ${i + 1} is visible on host page`);
    }

    console.log('Concurrent join test passed');
  });

  test('多人同时准备竞态测试', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    contexts.push(hostContext);
    pages.push(hostPage);

    await setupGameMocks(hostPage);
    const roomId = await loginAndCreateRoom(hostPage, 'Host');
    
    const playerContexts: BrowserContext[] = [];
    const playerPages: Page[] = [];

    for (let i = 0; i < 3; i++) {
      const ctx = await browser.newContext();
      const page = await ctx.newPage();
      await setupGameMocks(page, `mock-user-id-${i + 2}`);
      await joinRoom(page, roomId!);
      playerContexts.push(ctx);
      playerPages.push(page);
      contexts.push(ctx);
      pages.push(page);
    }

    await hostPage.waitForTimeout(2000);

    const allPages = [hostPage, ...playerPages];
    
    console.log('Starting concurrent ready test...');
    
    const readyPromises = allPages.map((page, index) => 
      page.locator('button:has-text("准备")').click().then(() => {
        console.log(`Player ${index} clicked ready`);
      }).catch((err: Error) => {
        console.error(`Player ${index} ready failed:`, err);
      })
    );

    await Promise.all(readyPromises);

    await hostPage.waitForTimeout(3000);

    for (let i = 0; i < 4; i++) {
      const seatLocator = hostPage.locator(`text=座位 ${i}`);
      const checkmark = seatLocator.locator('xpath=..').locator('text=✓');
      await expect(checkmark).toBeVisible({ timeout: 10000 });
      console.log(`Seat ${i} shows ready checkmark`);
    }

    console.log('Concurrent ready test passed');
  });

  test('快速连续操作稳定性测试', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    contexts.push(hostContext);
    pages.push(hostPage);

    await setupGameMocks(hostPage);
    const roomId = await loginAndCreateRoom(hostPage, 'Host');

    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();
    await setupGameMocks(playerPage, 'mock-user-id-2');
    await joinRoom(playerPage, roomId!);
    contexts.push(playerContext);
    pages.push(playerPage);

    await hostPage.waitForTimeout(2000);

    console.log('Starting rapid action test...');
    
    const readyBtn = playerPage.locator('button:has-text("准备")');
    const unreadyBtn = playerPage.locator('button:has-text("取消准备")');

    for (let i = 0; i < 10; i++) {
      await readyBtn.click();
      await playerPage.waitForTimeout(100);
      
      const seatLocator = hostPage.locator('text=座位 1');
      const checkmark = seatLocator.locator('xpath=..').locator('text=✓');
      await expect(checkmark).toBeVisible({ timeout: 5000 });
      
      await unreadyBtn.click();
      await playerPage.waitForTimeout(100);
      
      await expect(checkmark).not.toBeVisible({ timeout: 5000 });
      
      console.log(`Cycle ${i + 1} completed`);
    }

    console.log('Rapid action test passed');
  });

  test('网络抖动下的状态同步测试', async ({ browser }) => {
    const hostContext = await browser.newContext();
    const hostPage = await hostContext.newPage();
    contexts.push(hostContext);
    pages.push(hostPage);

    await setupGameMocks(hostPage);
    const roomId = await loginAndCreateRoom(hostPage, 'Host');

    const playerContext = await browser.newContext();
    const playerPage = await playerContext.newPage();
    await setupGameMocks(playerPage, 'mock-user-id-2');
    await joinRoom(playerPage, roomId!);
    contexts.push(playerContext);
    pages.push(playerPage);

    await hostPage.waitForTimeout(2000);

    console.log('Starting network jitter test...');
    
    for (let i = 0; i < 5; i++) {
      await playerContext.setOffline(true);
      console.log(`Cycle ${i + 1}: Network offline`);
      await playerPage.waitForTimeout(500);
      
      await playerContext.setOffline(false);
      console.log(`Cycle ${i + 1}: Network online`);
      await playerPage.waitForTimeout(1000);
      
      const seatLocator = hostPage.locator('text=座位 1');
      await expect(seatLocator).toBeVisible({ timeout: 5000 });
      console.log(`Cycle ${i + 1}: State synced`);
    }

    console.log('Network jitter test passed');
  });
});
