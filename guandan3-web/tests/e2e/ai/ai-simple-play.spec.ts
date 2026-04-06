/**
 * 简单AI出牌测试
 * 目的：验证AI是否能够自动出牌
 */

import { test, expect } from '@playwright/test';

test.describe('简单AI出牌测试', () => {
  test('验证AI能够自动出牌', async ({ page }) => {
    console.log('=== 访问游戏页面 ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    // 捕获网络请求
    const apiCalls: { url: string; method: string; timestamp: number }[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('submit_turn')) {
        apiCalls.push({
          url,
          method: request.method(),
          timestamp: Date.now(),
        });
        console.log(`[API] ${request.method()} ${url}`);
      }
    });

    // 捕获控制台日志
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AI') || text.includes('决策') || text.includes('submit')) {
        logs.push(text);
        console.log(`[LOG] ${text}`);
      }
    });

    console.log('=== 点击练习模式 ===');
    const practiceButton = page.getByRole('button', { name: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(2000);

    console.log('=== 点击开始游戏 ===');
    const startButton = page.getByRole('button', { name: /开始游戏|开始/i }).first();
    await startButton.click();

    console.log('=== 等待游戏进行（60秒）===');
    // 等待游戏进行，给AI足够的时间出牌
    await page.waitForTimeout(60000);

    console.log('\n=== 测试结果 ===');
    console.log(`总控制台日志: ${logs.length}`);
    console.log(`submit_turn API调用: ${apiCalls.length}`);

    if (apiCalls.length > 0) {
      console.log('✓ AI有出牌！');
      apiCalls.forEach((call, i) => {
        console.log(`  ${i + 1}. ${call.method} ${call.url}`);
      });
    } else {
      console.log('✗ AI没有出牌！');
      console.log('控制台日志:');
      logs.forEach(log => console.log(`  ${log}`));
    }

    // 基本断言：游戏应该有submit_turn调用（AI出牌）
    // 如果没有，说明AI没有工作
    expect(apiCalls.length).toBeGreaterThan(0);
  });

  test('验证游戏状态变化', async ({ page }) => {
    console.log('=== 访问游戏页面 ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    console.log('=== 点击练习模式 ===');
    const practiceButton = page.getByRole('button', { name: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(2000);

    console.log('=== 点击开始游戏 ===');
    const startButton = page.getByRole('button', { name: /开始游戏|开始/i }).first();
    await startButton.click();

    console.log('=== 等待游戏状态变化 ===');
    // 等待30秒，检查游戏状态
    await page.waitForTimeout(30000);

    // 检查是否有任何游戏相关的元素
    const gameElements = page.locator('[class*="game"], [class*="seat"], [class*="card"]');
    const count = await gameElements.count();
    console.log(`游戏元素数量: ${count}`);

    expect(count).toBeGreaterThan(0);
  });
});
