import { test, expect } from '@playwright/test';

test.describe('真实游戏流程测试', () => {
  test.setTimeout(300000); // 5分钟超时

  test('完整游戏流程：练习房1v3 AI', async ({ page }) => {
    // 收集所有控制台日志和错误
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    const networkErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      }
    });

    page.on('pageerror', error => {
      consoleErrors.push(`Page Error: ${error.message}`);
      consoleErrors.push(`Stack: ${error.stack}`);
    });

    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.url()} - ${response.status()}`);
      }
    });

    // 步骤1：访问首页
    console.log('步骤1：访问首页');
    await page.goto('http://localhost:3000', { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    
    // 截图保存
    await page.screenshot({ path: 'test-screenshot-home.png' });
    console.log('首页截图已保存');

    // 步骤2：选择练习房模式（1v3 AI）
    console.log('步骤2：选择练习房模式');
    try {
      // 等待页面加载完成
      await page.waitForTimeout(3000);
      
      // 尝试找到练习房按钮
      const practiceButton = page.getByRole('button', { name: /练习/i }).first();
      await expect(practiceButton).toBeVisible({ timeout: 10000 });
      await practiceButton.click();
      
      console.log('点击练习房按钮成功');
    } catch (error) {
      console.error('找不到练习房按钮，尝试其他选择器');
      // 尝试其他选择器
      const allButtons = page.locator('button');
      const count = await allButtons.count();
      console.log(`页面共有 ${count} 个按钮`);
      
      for (let i = 0; i < Math.min(count, 5); i++) {
        const text = await allButtons.nth(i).textContent();
        console.log(`按钮 ${i}: ${text}`);
      }
      
      // 尝试通过文本查找
      const practiceLink = page.getByText(/练习|单机|AI|1v3/i).first();
      if (await practiceLink.isVisible()) {
        await practiceLink.click();
        console.log('通过文本点击练习房成功');
      } else {
        throw new Error('无法找到练习房入口');
      }
    }

    // 步骤3：等待游戏开始
    console.log('步骤3：等待游戏开始');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-screenshot-room.png' });
    console.log('房间截图已保存');

    // 检查是否进入游戏页面
    const currentUrl = page.url();
    console.log('当前 URL:', currentUrl);

    // 步骤4：等待游戏加载完成
    console.log('步骤4：等待游戏加载');
    await page.waitForTimeout(10000);

    // 检查是否有游戏元素
    try {
      // 查找手牌区域
      const handArea = page.locator('[class*="hand"], [class*="card"], [data-testid*="card"], [data-testid*="hand"]').first();
      if (await handArea.isVisible({ timeout: 5000 })) {
        console.log('找到手牌区域');
      } else {
        console.log('未找到手牌区域，可能游戏未正确加载');
      }
    } catch (error) {
      console.log('检查游戏元素时出错:', error);
    }

    // 步骤5：观察游戏运行
    console.log('步骤5：观察游戏运行60秒');
    await page.screenshot({ path: 'test-screenshot-after-start.png' });

    // 等待一段时间，观察游戏是否正常运行
    await page.waitForTimeout(60000);

    // 最终截图
    await page.screenshot({ path: 'test-screenshot-final.png' });

    // 输出收集的日志
    console.log('\n=== 控制台日志 ===');
    consoleLogs.slice(-50).forEach(log => console.log(log));

    console.log('\n=== 控制台错误 ===');
    if (consoleErrors.length > 0) {
      consoleErrors.forEach(error => console.error(error));
      throw new Error(`发现 ${consoleErrors.length} 个错误`);
    } else {
      console.log('没有发现控制台错误');
    }

    console.log('\n=== 网络错误 ===');
    if (networkErrors.length > 0) {
      networkErrors.forEach(error => console.error(error));
    } else {
      console.log('没有发现网络错误');
    }

    console.log('\n测试完成');
  });
});
