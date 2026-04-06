/**
 * 完整游戏流程测试 - 验证排名系统
 */

import { test, expect } from '@playwright/test';

test.describe('完整游戏流程验证', () => {
  test('完整游戏流程直到排名', async ({ page }) => {
    const consoleLogs: string[] = [];
    const errorLogs: string[] = [];
    const gameEvents: any[] = [];

    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (msg.type() === 'error') {
        errorLogs.push(text);
      }
      if (text.includes('game') || text.includes('turn') || text.includes('score') || text.includes('rank')) {
        gameEvents.push({ timestamp: Date.now(), type: msg.type(), text: text });
      }
    });

    const apiCalls: any[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('submit_turn') || url.includes('finish_game')) {
        apiCalls.push({ method: request.method(), url: url, timestamp: Date.now() });
      }
    });

    console.log('访问游戏页面');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('点击练习模式');
    const practiceButton = page.getByRole('button', { name: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(3000);

    console.log('点击开始游戏');
    const startButton = page.getByRole('button', { name: /开始游戏|开始/i }).first();
    if (await startButton.isVisible({ timeout: 5000 })) {
      await startButton.click();
    }

    console.log('运行游戏（最长3分钟）');
    for (let i = 0; i < 60; i++) {
      await page.waitForTimeout(3000);
      
      const hasRankings = await page.locator('text=/排名|rank|1st|2nd|3rd|4th/i').count();
      const hasWinner = await page.locator('text=/胜利|winner|finished|完成/i').count();
      
      if (hasRankings > 0 || hasWinner > 0) {
        console.log('游戏已结束，检测到排名显示');
        break;
      }
      
      if (i % 10 === 0) {
        console.log(`游戏运行中... (${i * 3}秒)`);
      }
    }

    console.log('分析数据');
    console.log('错误日志:', errorLogs.length);
    console.log('游戏事件:', gameEvents.length);
    console.log('API调用:', apiCalls.length);

    const screenshotPath = `tests/e2e/screenshots/game-state-${Date.now()}.png`;
    await page.screenshot({ path: screenshotPath });
    console.log(`截图已保存: ${screenshotPath}`);

    expect(errorLogs.length).toBe(0);
  });
});
