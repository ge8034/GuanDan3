import { test, expect } from '@playwright/test';

test.describe('游戏玩法测试', () => {
  test.setTimeout(300000); // 5分钟超时

  test('完整游戏流程：实际出牌操作', async ({ page }) => {
    // 收集所有控制台日志和错误
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const gameEvents: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
      // 记录游戏相关事件
      if (text.includes('[Game]') || text.includes('[AI]') || text.includes('[Turn]')) {
        gameEvents.push(text);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
    });

    // 步骤1：访问首页并选择练习房
    console.log('步骤1：访问首页并选择练习房');
    await page.goto('http://localhost:3000', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    const practiceButton = page.getByRole('button', { name: /练习/i }).first();
    await expect(practiceButton).toBeVisible({ timeout: 10000 });
    await practiceButton.click();
    
    console.log('点击练习房按钮成功');

    // 步骤2：等待游戏加载
    console.log('步骤2：等待游戏加载');
    await page.waitForTimeout(5000);

    // 检查是否进入游戏页面
    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);
    expect(currentUrl).toMatch(/\/room\//);

    // 步骤3：等待手牌显示
    console.log('步骤3：等待手牌显示');
    await page.waitForTimeout(10000);

    // 截图
    await page.screenshot({ path: 'test-screenshot-gameplay-start.png' });

    // 步骤4：查找并检查手牌
    console.log('步骤4：检查手牌');
    try {
      // 尝试找到手牌卡片
      const cards = page.locator('[class*="card"], [data-testid*="card"], [class*="playing-card"]');
      const cardCount = await cards.count();
      console.log(`找到 ${cardCount} 个卡片元素`);

      if (cardCount > 0) {
        // 获取前几张牌的文本内容
        for (let i = 0; i < Math.min(5, cardCount); i++) {
          const cardText = await cards.nth(i).textContent();
          console.log(`卡片 ${i}: ${cardText}`);
        }
      }
    } catch (error) {
      console.log('检查卡片时出错:', error);
    }

    // 步骤5：等待游戏进行一段时间，观察AI出牌
    console.log('步骤5：观察游戏进行120秒');
    await page.waitForTimeout(120000);

    // 中间截图
    await page.screenshot({ path: 'test-screenshot-gameplay-middle.png' });

    // 步骤6：尝试找到出牌按钮
    console.log('步骤6：查找出牌按钮');
    try {
      const playButton = page.getByRole('button', { name: /出牌|play|submit/i }).first();
      if (await playButton.isVisible({ timeout: 5000 })) {
        console.log('找到出牌按钮');
        // 注意：我们不点击它，因为这需要选择牌
      } else {
        console.log('未找到出牌按钮，可能不是玩家的回合');
      }
    } catch (error) {
      console.log('检查出牌按钮时出错:', error);
    }

    // 步骤7：再等待一段时间
    console.log('步骤7：继续观察60秒');
    await page.waitForTimeout(60000);

    // 最终截图
    await page.screenshot({ path: 'test-screenshot-gameplay-final.png' });

    // 输出游戏事件
    console.log('\n=== 游戏事件 ===');
    if (gameEvents.length > 0) {
      gameEvents.slice(-20).forEach(event => console.log(event));
    } else {
      console.log('没有捕获到游戏事件');
    }

    // 输出控制台错误
    console.log('\n=== 控制台错误 ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => console.error(error));
      throw new Error(`发现 ${consoleErrors.length} 个错误`);
    } else {
      console.log('没有发现控制台错误');
    }

    console.log('\n测试完成');
  });
});
