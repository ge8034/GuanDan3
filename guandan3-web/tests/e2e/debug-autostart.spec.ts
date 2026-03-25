import { test, expect } from '@playwright/test';

/**
 * 调试自动开始逻辑
 * 专门分析练习模式游戏自动开始失败的问题
 */
test.describe('Debug AutoStart', () => {
  test('调试自动开始逻辑 - 详细日志', async ({ page }) => {
    test.setTimeout(120000);

    // 收集所有日志
    const allLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);

      // 输出所有AutoStart相关日志
      if (text.includes('[AutoStart]') || text.includes('[fetchGame]') || text.includes('[subscribeGame]')) {
        console.log(`[浏览器] ${text}`);
      }
    });

    page.on('pageerror', err => {
      console.error(`[页面错误] ${err.message || String(err)}`);
    });

    // 1. 访问首页
    console.log('=== 步骤1: 访问首页 ===');
    await page.goto('/');
    await expect(page).toHaveTitle(/掼蛋 3/i);

    // 2. 点击练习房按钮
    console.log('=== 步骤2: 创建练习房 ===');
    const practiceBtn = page.getByRole('button', { name: /练习/i });
    await expect(practiceBtn).toBeVisible({ timeout: 15000 });
    await practiceBtn.click();

    // 3. 等待进入房间
    console.log('=== 步骤3: 等待进入房间 ===');
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    const roomId = page.url().split('/').pop();
    console.log('房间ID:', roomId);

    // 4. 等待30秒，收集所有日志
    console.log('=== 步骤4: 等待30秒收集日志 ===');
    await page.waitForTimeout(30000);

    // 5. 检查游戏状态
    console.log('=== 步骤5: 检查游戏状态 ===');

    // 检查手牌
    const cards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const cardCount = await cards.count();
    console.log(`当前手牌数量: ${cardCount}`);

    // 检查游戏状态相关的DOM元素
    const gameStatusText = await page.locator('text=/座位：/i').first().textContent().catch(() => '');
    console.log(`座位信息: ${gameStatusText}`);

    // 6. 检查是否有开始按钮
    const startButton = page.getByRole('button', { name: /开始/i });
    const hasStartButton = await startButton.isVisible().catch(() => false);
    console.log(`开始按钮可见: ${hasStartButton}`);

    // 7. 分析日志
    console.log('\n=== 日志分析 ===');

    // 查找AutoStart日志
    const autoStartLogs = allLogs.filter(log => log.includes('[AutoStart]'));
    console.log(`\nAutoStart日志数量: ${autoStartLogs.length}`);
    if (autoStartLogs.length > 0) {
      autoStartLogs.forEach(log => console.log('  ', log));
    } else {
      console.log('  ❌ 没有找到AutoStart日志！');
    }

    // 查找fetchGame日志
    const fetchGameLogs = allLogs.filter(log => log.includes('[fetchGame]'));
    console.log(`\nfetchGame日志数量: ${fetchGameLogs.length}`);
    fetchGameLogs.slice(-5).forEach(log => console.log('  ', log));

    // 查找游戏状态日志
    const gameStatusLogs = allLogs.filter(log =>
      log.includes('gameStatus') || log.includes('game_id') || log.includes('status')
    );
    console.log(`\n游戏状态相关日志: ${gameStatusLogs.length}`);
    gameStatusLogs.slice(-10).forEach(log => console.log('  ', log));

    // 8. 截图
    await page.screenshot({
      path: 'test-results/debug-autostart.png',
      fullPage: true
    });

    // 9. 关键断言
    console.log('\n=== 测试结果 ===');
    console.log(`手牌数量: ${cardCount}`);
    console.log(`开始按钮可见: ${hasStartButton}`);
    console.log(`AutoStart日志数量: ${autoStartLogs.length}`);

    // 期望：手牌数量应该大于0
    if (cardCount === 0) {
      console.error('❌ 测试失败: 手牌数量为0，游戏没有自动开始');
    }
  });
});
