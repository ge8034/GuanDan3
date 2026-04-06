/**
 * AI控制台日志捕获测试
 * 目的：通过真实游戏捕获AI决策日志，寻找AI问题
 */

import { test, expect } from '@playwright/test';

test.describe('AI控制台日志捕获', () => {
  test('捕获AI决策日志并分析', async ({ page }) => {
    const allLogs: string[] = [];
    const aiDecisionLogs: string[] = [];
    const gameEventLogs: string[] = [];

    // 捕获所有控制台输出
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);

      // 过滤AI相关日志
      if (text.includes('AI') || text.includes('决策') || text.includes('decide')) {
        aiDecisionLogs.push(text);
      }

      // 过滤游戏事件日志
      if (text.includes('turn') || text.includes('出牌') || text.includes('submit')) {
        gameEventLogs.push(text);
      }
    });

    // 监听网络请求
    const apiCalls: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('supabase') || url.includes('rpc')) {
        apiCalls.push(`${request.method()} ${url}`);
      }
    });

    console.log('=== 访问游戏页面 ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');

    console.log('=== 点击练习模式 ===');
    // 点击练习模式按钮
    const practiceButton = page.getByRole('button', { name: /练习模式|开始练习/i });
    await practiceButton.click();
    await page.waitForTimeout(2000);

    console.log('=== 点击开始游戏 ===');
    // 点击开始游戏按钮
    const startButton = page.getByRole('button', { name: /开始游戏|开始/i });
    await startButton.click();
    await page.waitForTimeout(5000);

    console.log('=== 等待游戏进行（捕获AI决策） ===');
    // 等待游戏进行，捕获AI决策日志（AI玩家会自动出牌）
    await page.waitForTimeout(30000);

    // 如果轮到人类玩家，尝试点击出牌
    const playButton = page.getByRole('button', { name: /出牌/i }).first();
    const isEnabled = await playButton.isEnabled().catch(() => false);
    if (isEnabled) {
      console.log('=== 发现出牌按钮可用，尝试点击 ===');
      await playButton.click();
      await page.waitForTimeout(10000);
    } else {
      console.log('=== 出牌按钮不可用（AI玩家回合或游戏未开始）===');
    }

    // 继续等待游戏进行
    await page.waitForTimeout(20000);

    console.log('\n=== 捕获到的日志统计 ===');
    console.log(`总日志数: ${allLogs.length}`);
    console.log(`AI决策日志数: ${aiDecisionLogs.length}`);
    console.log(`游戏事件日志数: ${gameEventLogs.length}`);
    console.log(`API调用数: ${apiCalls.length}`);

    console.log('\n=== AI决策日志 ===');
    aiDecisionLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });

    console.log('\n=== 游戏事件日志 ===');
    gameEventLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });

    console.log('\n=== API调用 ===');
    apiCalls.forEach((call, i) => {
      console.log(`${i + 1}. ${call}`);
    });

    // 分析AI是否有问题
    console.log('\n=== AI问题分析 ===');

    // 检查是否有pass但不应该pass的情况
    const passLogs = aiDecisionLogs.filter(log => log.includes('pass') || log.includes('Pass'));
    console.log(`Pass日志数: ${passLogs.length}`);

    // 检查是否有错误日志
    const errorLogs = allLogs.filter(log =>
      log.includes('error') ||
      log.includes('Error') ||
      log.includes('fail') ||
      log.includes('Fail')
    );
    console.log(`错误日志数: ${errorLogs.length}`);
    if (errorLogs.length > 0) {
      console.log('错误日志:');
      errorLogs.forEach((log, i) => console.log(`  ${i + 1}. ${log}`));
    }

    // 保存日志到文件
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      allLogs,
      aiDecisionLogs,
      gameEventLogs,
      apiCalls,
      errorLogs,
    };
    fs.writeFileSync(
      'ai-console-logs.json',
      JSON.stringify(logData, null, 2)
    );
    console.log('\n日志已保存到 ai-console-logs.json');

    // 基本检查：游戏应该正在进行或已完成
    const gameStatus = page.locator('[class*="game"], [class*="status"], [class*="score"]');
    const isVisible = await gameStatus.count();
    expect(isVisible).toBeGreaterThan(0);
  });
});
