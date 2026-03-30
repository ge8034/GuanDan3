/**
 * 简单的房间测试 - 用于隔离问题
 */

import { test, expect } from '@playwright/test';
import { setupGameMocks, cleanupMockState } from './shared';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('简单房间测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test.afterEach(() => {
    cleanupMockState();
  });

  test('基本页面加载', async ({ page }) => {
    // 收集控制台日志
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      // 打印所有日志
      console.log(`[${msg.type()}]`, msg.text());
    });

    // 访问首页
    console.log('访问首页:', BASE_URL);
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('首页加载完成');

    // 检查是否有运行时错误
    await page.waitForTimeout(3000);
    console.log(`发现 ${errors.length} 个错误`);
    errors.slice(0, 5).forEach((err) => console.log('  -', err));

    // 截图查看页面状态
    await page.screenshot({ path: 'test-screenshot-home.png' });
    console.log('截图已保存: test-screenshot-home.png');

    // 尝试点击练习按钮
    const practiceBtn = page.getByRole('button', { name: /练习/i }).first();
    if (await practiceBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('找到练习按钮，点击...');
      await practiceBtn.click();

      // 等待URL变化
      await page.waitForURL(/\/room\/[^/]+$/, { timeout: 15000 });
      console.log('已进入房间页面');

      // 截图
      await page.screenshot({ path: 'test-screenshot-room.png' });
      console.log('房间截图已保存: test-screenshot-room.png');

      // 检查页面是否有错误
      const bodyText = await page.evaluate(
        () => document.body.textContent || ''
      );
      console.log('页面内容长度:', bodyText.length);

      // 检查是否有开始游戏按钮
      const startBtn = page.getByRole('button', { name: /开始游戏|开始/i });
      if (await startBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        console.log('✓ 找到开始游戏按钮');
        await startBtn.click();
        console.log('已点击开始游戏按钮');

        // 等待游戏加载
        await page.waitForTimeout(5000);

        // 截图
        await page.screenshot({ path: 'test-screenshot-after-start.png' });
        console.log('开始游戏后截图已保存');

        // 检查手牌区域
        const roomHand = page.locator('[data-testid="room-hand"]');
        const isVisible = await roomHand
          .isVisible({ timeout: 5000 })
          .catch(() => false);
        console.log('手牌区域可见:', isVisible);

        // 检查手牌数量
        const cardCount = await page.locator('[data-card-id]').count();
        console.log('手牌数量:', cardCount);
      } else {
        console.log('✗ 未找到开始游戏按钮');
        console.log('页面可能已经有错误');
      }
    } else {
      console.log('✗ 未找到练习按钮');
    }

    // 最终错误报告
    console.log('\n=== 错误总结 ===');
    console.log(`总错误数: ${errors.length}`);
    errors.slice(0, 10).forEach((err) => console.log('-', err));
  });
});
