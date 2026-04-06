/**
 * AI真实游戏行为分析测试
 */

import { test, expect } from '@playwright/test';

test.describe('AI真实游戏行为分析', () => {
  test('深入分析AI在练习模式中的决策过程', async ({ page }) => {
    const allLogs: string[] = [];

    page.on('console', msg => {
      allLogs.push(msg.text());
    });

    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    console.log('开始AI行为分析');
    await page.waitForTimeout(5000);

    expect(allLogs.length).toBeGreaterThan(0);
  });
});
