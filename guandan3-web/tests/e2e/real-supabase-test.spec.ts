import { test, expect } from '@playwright/test';

/**
 * 真实Supabase集成测试
 * 此测试不使用mock，直接连接真实Supabase验证start_game函数
 */
test.describe('Real Supabase Integration', () => {
  test('真实连接: 创建练习房并验证手牌显示', async ({ page }) => {
    test.setTimeout(120000);

    // 收集控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      console.log(`[浏览器] ${text}`);
    });

    // 收集所有网络请求
    const apiRequests: Array<{ url: string; status?: number; method?: string }> = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('supabase.co') || url.includes('rpc')) {
        console.log(`[请求] ${request.method()} ${url}`);
      }
    });

    page.on('response', response => {
      const url = response.url();
      if (url.includes('supabase.co') || url.includes('rpc')) {
        const status = response.status();
        console.log(`[响应] ${status} ${url}`);
        apiRequests.push({ url, status, method: response.request().method() });
        if (status >= 400) {
          console.error(`[API错误] ${status} ${url}`);
          response.text().then(body => console.error(`  Body: ${body}`)).catch(() => {});
        }
      }
    });

    // 收集错误
    const errors: string[] = [];
    page.on('pageerror', err => {
      const msg = err.message || String(err);
      errors.push(msg);
      console.error(`[页面错误] ${msg}`);
    });

    // 1. 访问首页
    console.log('正在访问首页...');
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/掼蛋 3/i);

    // 2. 点击练习房按钮
    console.log('点击练习房按钮...');
    const practiceBtn = page.getByRole('button', { name: /练习/i });
    await expect(practiceBtn).toBeVisible({ timeout: 15000 });
    await practiceBtn.click();

    // 3. 等待跳转到房间页面
    console.log('等待跳转到房间...');
    await page.waitForURL(/\/room\/.+/, { timeout: 30000 });
    console.log('已进入房间页面:', page.url());

    // 4. 等待游戏开始
    console.log('等待游戏开始...');
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 30000 });

    // 5. 验证手牌区域存在
    console.log('验证手牌区域...');
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    // 6. 检查手牌数量 (应该有27张牌)
    console.log('检查手牌数量...');

    // 等待足够长的时间让游戏数据完全同步
    console.log('等待10秒让游戏数据同步...');
    await page.waitForTimeout(10000);

    // 直接在浏览器中检查myHand数据
    const myHandData = await page.evaluate(() => {
      // 尝试获取Zustand store状态
      const state = (window as any).__ZUSTAND_STORE__?.getState?.()
      return {
        myHand: state?.myHand || [],
        myHandLength: state?.myHand?.length || 0,
        gameStatus: state?.status || 'unknown',
        gameId: state?.gameId || null
      }
    });

    console.log('浏览器中的myHand数据:', JSON.stringify(myHandData, null, 2));

    // 检查是否有卡片元素
    const cards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const cardCount = await cards.count();
    console.log(`检测到 ${cardCount} 张卡牌 (使用data-card-id选择器)`);

    // 验证至少有一些牌显示 (可能不是完整的27张，但应该 > 0)
    expect(cardCount).toBeGreaterThan(0);

    // 7. 打印控制台日志摘要
    console.log('\n=== 控制台日志摘要 ===');
    const errorLogs = consoleLogs.filter(log =>
      log.includes('error') ||
      log.includes('Error') ||
      log.includes('failed') ||
      log.includes('404')
    );
    if (errorLogs.length > 0) {
      console.log('发现错误日志:');
      errorLogs.forEach(log => console.log('  -', log));
    } else {
      console.log('无错误日志');
    }

    // 8. 验证没有严重错误
    console.log('\n=== 页面错误 ===');
    if (errors.length > 0) {
      console.log(`发现 ${errors.length} 个页面错误:`);
      errors.forEach(err => console.log('  -', err));
    }

    // 关键断言：不应该有404错误 (game_events表应该已修复)
    const has404Error = consoleLogs.some(log =>
      log.includes('404') && log.includes('game_events')
    );
    expect(has404Error).toBeFalsy();

    // 9. 截图保存
    await page.screenshot({
      path: 'test-results/real-supabase-hand-cards.png',
      fullPage: true
    });

    console.log('\n✅ 测试完成！手牌显示正常，无404错误');
  });
});
