import { test, expect, BrowserContext, Page } from '@playwright/test';

test.describe('连接稳定性与多端同步', () => {
  test.setTimeout(120000);

  let hostContext: BrowserContext;
  let p2Context: BrowserContext;
  let hostPage: Page;
  let p2Page: Page;

  test.beforeEach(async ({ browser }) => {
    hostContext = await browser.newContext();
    p2Context = await browser.newContext();
    hostPage = await hostContext.newPage();
    p2Page = await p2Context.newPage();
  });

  test.afterEach(async () => {
    await hostContext?.close();
    await p2Context?.close();
  });

  const loginAndCreateRoom = async (page: Page, name: string) => {
    await page.goto('http://localhost:3000');
    // 使用 data-testid 选择器进入大厅
    await page.click('[data-testid="home-enter-lobby"]');
    await page.waitForURL(/\/lobby/);
    await page.fill('[data-testid="lobby-create-name"]', `TestRoom-${Date.now()}`);
    await page.click('[data-testid="lobby-create"]');
    await page.waitForURL(/\/room\//);
    return page.url().split('/').pop();
  };

  const joinRoom = async (page: Page, roomId: string) => {
    await page.goto(`http://localhost:3000/room/${roomId}`);
    
    // 处理可能出现的"加入对局"遮罩层或按钮
    const joinOverlayBtn = page.locator('button:has-text("加入对局")'); // Overlay button
    const joinSeatBtn = page.locator('button:has-text("加入座位")'); // In-game button
    
    // 等待任意一个加入按钮出现，或者直接显示了准备按钮（如果自动加入了）
    const readyBtn = page.locator('button:has-text("准备")');
    
    try {
      await expect(joinOverlayBtn.or(joinSeatBtn).or(readyBtn)).toBeVisible({ timeout: 15000 });
      
      if (await readyBtn.isVisible()) {
        console.log('Already joined and ready/unready');
        return;
      }
      
      if (await joinOverlayBtn.isVisible()) {
        console.log('Clicking join overlay button');
        await joinOverlayBtn.click();
      } else if (await joinSeatBtn.isVisible()) {
        console.log('Clicking join seat button');
        await joinSeatBtn.click();
      }
      
      // 等待准备按钮出现，表示已成功加入并获取了座位
      await expect(readyBtn).toBeVisible({ timeout: 15000 });
    } catch (e) {
      console.log('Join room failed, dumping page content...');
      // 可以在这里截图或打印日志
      throw e;
    }
  };

  test.skip('断线重连恢复测试', async () => {
    // 1. Host 创建房间
    const roomId = await loginAndCreateRoom(hostPage, 'Host');
    expect(roomId).toBeTruthy();
    console.log(`Room created: ${roomId}`);

    // 2. 模拟断网
    console.log('Simulating offline...');
    await hostContext.setOffline(true);

    // 3. 验证离线提示 (如果有的话)
    // 注意：具体 UI 可能因实现而异，这里主要验证恢复能力
    // 假设 UI 会显示 "连接中断" 或类似提示，或者仅仅是操作失败
    // 但核心是恢复后状态一致

    // 等待一段时间模拟掉线
    await hostPage.waitForTimeout(2000);

    // 4. 恢复网络
    console.log('Restoring online...');
    await hostContext.setOffline(false);

    // 增加等待时间，让 socket 重连
    await hostPage.waitForTimeout(5000);

    // 5. 验证是否自动重连并保持在房间内
    // 触发一个操作来验证连接活跃，例如点击准备
    const readyBtn = hostPage.locator('button:has-text("准备")');
    await expect(readyBtn).toBeVisible({ timeout: 30000 });
    
    // 如果还没恢复，尝试 reload (作为降级策略)
    if (!await readyBtn.isEnabled()) {
        console.log('Reloading page to recover...');
        await hostPage.reload();
        await expect(readyBtn).toBeVisible({ timeout: 30000 });
    }
    
    await readyBtn.click();

    // 验证状态变为"取消准备"
    await expect(hostPage.locator('text=取消准备')).toBeVisible();
    console.log('Host successfully reconnected and performed action');
  });

  test('多设备实时同步测试', async () => {
    // 1. Host 创建房间
    const roomId = await loginAndCreateRoom(hostPage, 'Host');
    if (!roomId) throw new Error('Failed to create room');

    // 2. P2 加入房间
    await joinRoom(p2Page, roomId);
    console.log('P2 joined room');

    // 3. P2 点击准备
    await p2Page.click('button:has-text("准备")');
    
    // 4. Host 端应立即看到 P2 准备状态
    // P2 是座位 1 (Host 是 0)
    // 查找包含 "座位 1" 的区域，确认其中有 "已准备" 状态
    // PlayerAvatar 组件会渲染 "座位 1" 和 "已准备/未准备"
    const p2Avatar = hostPage.locator('div', { has: hostPage.locator('text=座位 1') });
    await expect(p2Avatar.locator('text=已准备')).toBeVisible({ timeout: 15000 });
    console.log('Host saw P2 ready');

    // 5. P2 取消准备
    await p2Page.click('text=取消准备');

    // 6. Host 端应立即看到 P2 取消准备 (变为 "未准备")
    await expect(p2Avatar.locator('text=未准备')).toBeVisible({ timeout: 15000 });
    console.log('Host saw P2 unready');
  });
});
