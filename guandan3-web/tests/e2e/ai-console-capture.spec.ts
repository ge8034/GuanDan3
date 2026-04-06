/**
 * AI控制台日志捕获测试
 * 目的：捕获真实游戏中的AI决策过程，分析潜在问题
 */

import { test, expect } from '@playwright/test';

test.describe('AI控制台日志分析', () => {
  test('捕获练习模式游戏中AI的控制台日志', async ({ page }) => {
    // 收集控制台日志
    const consoleLogs: string[] = [];
    const errorLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      // 过滤出AI相关的日志
      if (text.includes('AI') || text.includes('ai') ||
          text.includes('决策') || text.includes('decision') ||
          text.includes('bomb') || text.includes('炸弹') ||
          text.includes('analyzeHand') || text.includes('findOptimalMove')) {
        consoleLogs.push(text);
      }
      if (msg.type() === 'error') {
        errorLogs.push(text);
      }
    });

    // 访问首页
    await page.goto('http://localhost:3000');

    // 等待页面加载
    await expect(page.locator('h1, button, main')).toBeVisible();

    console.log('\n=== 开始AI日志捕获 ===');

    // 点击练习房按钮
    const practiceButton = page.getByText(/练习|练习房|开始游戏/i).or(
      page.locator('button').filter({ hasText: /练习|practice/i })
    ).first();

    await practiceButton.click();
    console.log('已点击练习房按钮');

    // 等待游戏界面加载
    await page.waitForTimeout(2000);

    // 如果有开始按钮，点击开始
    const startButton = page.getByText(/开始|start|开局/i).or(
      page.locator('button').filter({ hasText: /开始|start|开局/i })
    ).first();

    const isVisible = await startButton.isVisible().catch(() => false);
    if (isVisible) {
      await startButton.click();
      console.log('已点击开始按钮');
    }

    // 等待游戏开始，观察AI出牌
    await page.waitForTimeout(10000); // 等待10秒观察AI行为

    // 查找并点击出牌区域（模拟游戏进行）
    const playArea = page.locator('.play-area, button').filter({ hasText: /出牌|pass|过/i }).first();
    const hasPlayArea = await playArea.isVisible().catch(() => false);

    if (hasPlayArea) {
      console.log('找到出牌区域');
      // 可能的出牌按钮
      const playButton = page.getByText(/出牌|play/i).first();
      const passButton = page.getByText(/不出|pass|过/i).first();

      // 尝试点击
      await playButton.click().catch(() => {});
      await page.waitForTimeout(2000);
      await passButton.click().catch(() => {});
    }

    // 再等待一段时间观察AI响应
    await page.waitForTimeout(8000);

    console.log('\n=== 捕获到的AI相关日志 ===');
    for (const log of consoleLogs) {
      console.log(log);
    }

    console.log('\n=== 错误日志 ===');
    for (const err of errorLogs) {
      console.log(err);
    }

    console.log(`\n总共捕获 ${consoleLogs.length} 条AI相关日志`);

    // 分析日志中的潜在问题
    console.log('\n=== 日志分析 ===');

    // 检查是否有AI决策失败的日志
    const failedDecisions = consoleLogs.filter(log =>
      log.includes('fail') || log.includes('error') || log.includes('错误')
    );

    // 检查是否有AI不出牌的日志
    const noPlayLogs = consoleLogs.filter(log =>
      log.includes('pass') && log.includes('AI')
    );

    // 检查是否有炸弹相关的日志
    const bombLogs = consoleLogs.filter(log =>
      log.includes('bomb') || log.includes('炸弹')
    );

    console.log(`AI决策失败: ${failedDecisions.length}`);
    for (const log of failedDecisions) {
      console.log(`  - ${log}`);
    }

    console.log(`AI不出牌: ${noPlayLogs.length}`);
    for (const log of noPlayLogs.slice(0, 5)) {
      console.log(`  - ${log}`);
    }

    console.log(`炸弹相关: ${bombLogs.length}`);
    for (const log of bombLogs) {
      console.log(`  - ${log}`);
    }

    // 确保至少捕获到一些日志
    expect(consoleLogs.length + errorLogs.length).toBeGreaterThan(0);
  });

  test('手动设置AI手牌并观察决策', async ({ page }) => {
    const aiDecisions: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('AI') || text.includes('决策') || text.includes('decision')) {
        aiDecisions.push(text);
        console.log(`[AI日志] ${text}`);
      }
    });

    // 访问首页并创建练习房
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1000);

    // 点击练习房
    const practiceButton = page.getByText(/练习|practice/i).or(
      page.locator('button').filter({ hasText: /练习/i })
    ).first();
    await practiceButton.click();
    await page.waitForTimeout(3000);

    // 点击开始
    const startButton = page.getByText(/开始|start/i).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    if (isStartVisible) {
      await startButton.click();
    }

    // 观察AI行为15秒
    await page.waitForTimeout(15000);

    console.log(`\n=== 共捕获 ${aiDecisions.length} 条AI决策日志 ===`);
  });
});
