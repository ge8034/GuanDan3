/**
 * AI逻辑错误发现测试
 * 目的：通过真实游戏模拟发现AI出牌逻辑错误
 */

import { test, expect } from '@playwright/test';

interface AIDecision {
  hand: string;        // 手牌描述
  lastPlay: string;    // 上家出牌
  decision: string;    // AI决策
  isProblem: boolean;  // 是否为问题
  reason?: string;     // 问题原因
}

test.describe('AI逻辑错误发现', () => {
  test('通过真实游戏发现AI逻辑问题', async ({ page }) => {
    const decisions: AIDecision[] = [];
    const consoleLogs: string[] = [];

    // 捕获控制台日志
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);

      // 解析AI决策日志
      if (text.includes('AI') || text.includes('决策') || text.includes('decideMove')) {
        console.log(`[AI LOG] ${text}`);
      }
    });

    // 捕获submit_turn API调用
    page.on('request', request => {
      if (request.url().includes('submit_turn')) {
        const postData = request.postData();
        if (postData) {
          try {
            const data = JSON.parse(postData);
            console.log(`[API] submit_turn:`, data);
          } catch (e) {
            console.log(`[API] submit_turn (raw):`, postData);
          }
        }
      }
    });

    console.log('=== 步骤1: 访问游戏页面 ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    console.log('=== 步骤2: 点击练习模式 ===');
    const practiceButton = page.getByRole('button', { name: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(3000);

    console.log('=== 步骤3: 点击开始游戏 ===');
    const startButton = page.getByRole('button', { name: /开始游戏|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    console.log('=== 步骤4: 运行游戏并捕获AI决策（90秒）===');

    // 记录游戏状态
    let previousTurnCount = 0;
    let turnCount = 0;

    const checkInterval = setInterval(async () => {
      try {
        // 检查页面上的游戏元素
        const cards = await page.locator('[class*="card"]').count();
        const gameElements = await page.locator('[class*="game"], [class*="seat"], [class*="hand"]').count();

        console.log(`[游戏状态] 卡片: ${cards}, 游戏元素: ${gameElements}`);

        // 捕获当前状态快照（用于后续分析）
        if (gameElements > 0) {
          const html = await page.content();
          // 可以保存快照用于调试
        }
      } catch (e) {
        console.log(`[检查] 忽略错误:`, e);
      }
    }, 5000);

    await page.waitForTimeout(90000);
    clearInterval(checkInterval);

    console.log('=== 步骤5: 分析捕获的决策 ===');

    // 分析控制台日志中的AI决策
    const aiLogs = consoleLogs.filter(log =>
      log.includes('AI') ||
      log.includes('决策') ||
      log.includes('decideMove') ||
      log.includes('出牌')
    );

    console.log(`\n=== 捕获到的AI日志 (${aiLogs.length}条) ===`);
    aiLogs.forEach((log, i) => {
      console.log(`${i + 1}. ${log}`);
    });

    // 输出发现的潜在问题
    console.log(`\n=== 潜在问题分析 ===`);
    console.log(`总日志数: ${consoleLogs.length}`);
    console.log(`AI相关日志: ${aiLogs.length}`);

    // 基本断言：游戏应该运行
    expect(aiLogs.length).toBeGreaterThan(0);

    // 如果没有足够的数据，提示需要更长的运行时间
    if (aiLogs.length < 10) {
      console.log('⚠️ 捕获的AI日志较少，可能需要延长运行时间');
    }
  });

  test('深入分析AI决策过程', async ({ page }) => {
    const decisionLog: Array<{
      timestamp: number;
      hand: any[];
      lastPlay: any[] | null;
      move: any;
      reasoning?: string;
    }> = [];

    // 注入脚本来捕获AI决策
    await page.addInitScript(() => {
      // 拦截console.log来捕获AI决策
      const originalLog = console.log;
      console.log = function(...args: any[]) {
        const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');

        // 发送决策数据到页面（供测试读取）
        if (message.includes('AI') || message.includes('decideMove')) {
          window.dispatchEvent(new CustomEvent('ai-decision', {
            detail: { message, timestamp: Date.now() }
          }));
        }

        originalLog.apply(console, args);
      };
    });

    // 监听AI决策事件
    page.on('console', msg => {
      const text = msg.text();
      // 尝试解析AI决策信息
      if (text.includes('hand:') || text.includes('lastPlay:') || text.includes('move:')) {
        console.log(`[决策数据] ${text}`);
      }
    });

    console.log('=== 开始深度AI分析测试 ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // 点击练习模式
    const practiceButton = page.getByRole('button', { name: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(3000);

    // 点击开始游戏
    const startButton = page.getByRole('button', { name: /开始游戏|开始/i }).first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }

    // 运行较长时间以捕获更多决策
    console.log('=== 运行120秒以捕获更多AI决策 ===');
    await page.waitForTimeout(120000);

    console.log(`=== 捕获到 ${decisionLog.length} 个决策记录 ===`);
  });
});
