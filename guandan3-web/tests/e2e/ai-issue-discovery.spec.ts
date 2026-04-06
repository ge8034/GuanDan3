/**
 * AI 问题发现 E2E 测试 - 详细版本
 *
 * 通过实际进入游戏并操作，捕获AI决策日志
 */

import { test, expect } from '@playwright/test';

test.describe('AI问题发现 - 深度游戏测试', () => {
  test('进入练习模式并捕获AI决策', async ({ page }) => {
    // 设置详细控制台监听
    const consoleLogs: string[] = [];
    const errors: string[] = [];
    const aiLogs: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      const type = msg.type();

      // 记录所有包含特定关键词的日志
      if (text.includes('AI') || text.includes('useAIDecision') ||
          text.includes('决策') || text.includes('出牌') ||
          text.includes('game') || text.includes('轮') ||
          text.includes('seat') || text.includes('turn') ||
          text.includes('submit') || text.includes('rpc') ||
          text.includes('RPC') || text.includes('error') ||
          text.includes('错误') || text.includes('异常')) {
        const logEntry = `[${type}] ${text}`;
        console.log(logEntry); // 同时输出到控制台
        consoleLogs.push(logEntry);

        if (text.includes('AI') || text.includes('useAIDecision')) {
          aiLogs.push(logEntry);
        }
      }

      if (type === 'error') {
        errors.push(text);
      }
    });

    console.log('=== 开始测试：进入练习模式 ===');

    // 访问首页
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    // 截图初始页面
    await page.screenshot({ path: 'test-screenshot-home.png' });
    console.log('已保存首页截图');

    // 查找"开始游戏"或"练习模式"按钮
    const startButton = page.getByRole('button', { name: /开始游戏|练习模式|进入即玩|Start/i });
    const practiceButton = page.getByRole('button', { name: /练习/i });
    const anyButton = page.getByRole('button').first();

    console.log('查找按钮...');

    // 尝试找到并点击按钮
    if (await startButton.isVisible()) {
      console.log('找到"开始游戏"按钮，点击');
      await startButton.click();
    } else if (await practiceButton.isVisible()) {
      console.log('找到"练习"按钮，点击');
      await practiceButton.click();
    } else if (await anyButton.isVisible()) {
      console.log('找到第一个按钮，点击');
      await anyButton.click();
    } else {
      // 检查页面内容
      const bodyText = await page.locator('body').textContent();
      console.log('页面文本:', bodyText?.substring(0, 200));

      // 尝试直接导航到房间
      await page.goto('http://localhost:3000/lobby');
      await page.waitForTimeout(2000);

      const lobbyButton = page.getByRole('link', { name: /练习/i });
      if (await lobbyButton.isVisible()) {
        await lobbyButton.click();
      }
    }

    // 等待页面加载
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'test-screenshot-room.png' });
    console.log('已保存房间页面截图');

    // 查找开始/准备按钮
    const readyButton = page.getByRole('button', { name: /开始|准备|Start|Ready/i });
    const allButtons = page.getByRole('button');

    console.log('查找准备按钮...');

    let buttonFound = false;
    const buttonCount = await allButtons.count();
    console.log(`页面共有 ${buttonCount} 个按钮`);

    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const text = await button.textContent();
      console.log(`按钮 ${i}: "${text}"`);

      if (text.includes('开始') || text.includes('Start') ||
          text.includes('准备') || text.includes('Ready') ||
          text.includes('练习') || text.includes('Practice')) {
        console.log(`点击按钮: "${text}"`);
        await button.click();
        buttonFound = true;
        break;
      }
    }

    if (!buttonFound) {
      console.log('未找到开始/准备按钮，尝试点击第一个按钮');
      await allButtons.first().click();
    }

    // 等待游戏开始 - 关键步骤
    console.log('等待游戏开始，观察AI行为...');
    await page.waitForTimeout(15000);

    // 多次截图观察游戏状态
    for (let i = 0; i < 5; i++) {
      await page.waitForTimeout(3000);
      await page.screenshot({ path: `test-screenshot-after-start-${i}.png` });
      console.log(`已保存截图 ${i}`);

      // 检查是否有游戏状态变化
      const bodyText = await page.locator('body').textContent();
      if (bodyText && bodyText.includes('AI')) {
        console.log(`发现AI相关文本: ${bodyText.substring(0, 100)}`);
      }
    }

    // 分析日志
    console.log('\n=== 控制台日志分析 ===');
    console.log('总日志数:', consoleLogs.length);
    console.log('AI相关日志:', aiLogs.length);
    console.log('错误数:', errors.length);

    // 打印AI相关日志
    if (aiLogs.length > 0) {
      console.log('\n=== AI相关日志 ===');
      aiLogs.forEach(log => console.log(log));
    } else {
      console.log('\n未捕获到AI相关日志');
    }

    if (errors.length > 0) {
      console.log('\n=== 发现错误 ===');
      errors.forEach(err => console.error(err));
    }

    // 保存日志到文件
    const fs = require('fs');
    fs.writeFileSync(
      'ai-discovery-logs.json',
      JSON.stringify({
        timestamp: new Date().toISOString(),
        consoleLogs,
        errors,
        aiLogs
      }, null, 2)
    );

    console.log('\n日志已保存到 ai-discovery-logs.json');

    // 基于日志分析问题
    console.log('\n=== 问题分析 ===');

    if (aiLogs.length === 0) {
      console.log('⚠️ 未捕获到AI日志，可能原因：');
      console.log('1. 游戏未实际开始');
      console.log('2. AI未被触发');
      console.log('3. 日志级别不正确');
      console.log('4. 需要实际操作触发AI决策');
    } else {
      console.log('✓ 已捕获AI日志，可以开始分析');
    }

    // 期望：至少应该有一些AI相关日志
    // 但如果没有，我们需要通过实际游戏操作来触发
  });
});
