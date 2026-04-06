/**
 * AI调试追踪测试
 * 目的：详细追踪AI执行的每一步
 */

import { test, expect } from '@playwright/test';

test.describe('AI调试追踪', () => {
  test('详细追踪AI执行过程', async ({ page }) => {
    // 捕获所有控制台输出
    const allLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      console.log(`[Console] ${text}`);
    });

    // 捕获所有网络请求
    const apiCalls: string[] = [];
    page.on('request', request => {
      const url = request.url();
      if (url.includes('supabase')) {
        const method = request.method();
        const cleanUrl = url.split('?')[0];
        apiCalls.push(`${method} ${cleanUrl}`);
        console.log(`[API] ${method} ${cleanUrl}`);
      }
    });

    // 捕获所有响应
    const apiResponses: string[] = [];
    page.on('response', response => {
      const url = response.url();
      if (url.includes('supabase')) {
        const status = response.status();
        const cleanUrl = url.split('?')[0];
        apiResponses.push(`${status} ${cleanUrl}`);
        console.log(`[Response] ${status} ${cleanUrl}`);
      }
    });

    console.log('\n=== 步骤1：访问首页 ===');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('\n=== 步骤2：点击练习模式 ===');
    const practiceButton = page.locator('button').filter({ hasText: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(3000);

    console.log('\n=== 步骤3：检查房间状态 ===');
    // 检查房间是否创建成功
    const roomElements = page.locator('[class*="room"], [class*="seat"]');
    const roomCount = await roomElements.count();
    console.log(`房间相关元素数量: ${roomCount}`);

    console.log('\n=== 步骤4：点击开始游戏 ===');
    const startButton = page.locator('button').filter({ hasText: /开始游戏|开始/i }).first();
    const isStartVisible = await startButton.isVisible().catch(() => false);
    console.log(`开始按钮可见: ${isStartVisible}`);

    if (isStartVisible) {
      await startButton.click();
      await page.waitForTimeout(5000);
    }

    console.log('\n=== 步骤5：等待AI执行（60秒）===');
    // 给AI足够的时间执行
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(5000);
      console.log(`  已等待 ${(i + 1) * 5}秒...`);
    }

    console.log('\n=== 步骤6：检查游戏状态 ===');
    const gameElements = page.locator('[class*="game"], [class*="card"], [class*="player"]');
    const gameCount = await gameElements.count();
    console.log(`游戏相关元素数量: ${gameCount}`);

    // 截图保存
    await page.screenshot({ path: 'ai-debug-screenshot.png' });
    console.log('截图已保存到 ai-debug-screenshot.png');

    console.log('\n=== 测试结果统计 ===');
    console.log(`总控制台日志: ${allLogs.length}`);
    console.log(`总API请求: ${apiCalls.length}`);
    console.log(`总API响应: ${apiResponses.length}`);

    console.log('\n=== 关键API调用 ===');
    const createRoomCalls = apiCalls.filter(call => call.includes('create_practice_room'));
    const startGameCalls = apiCalls.filter(call => call.includes('start_game'));
    const submitTurnCalls = apiCalls.filter(call => call.includes('submit_turn'));
    const getAiHandCalls = apiCalls.filter(call => call.includes('get_ai_hand'));

    console.log(`创建房间调用: ${createRoomCalls.length}`);
    createRoomCalls.forEach(call => console.log(`  ${call}`));

    console.log(`开始游戏调用: ${startGameCalls.length}`);
    startGameCalls.forEach(call => console.log(`  ${call}`));

    console.log(`AI手牌查询: ${getAiHandCalls.length}`);
    getAiHandCalls.forEach(call => console.log(`  ${call}`));

    console.log(`出牌调用: ${submitTurnCalls.length}`);
    submitTurnCalls.forEach(call => console.log(`  ${call}`));

    console.log('\n=== AI相关控制台日志 ===');
    const aiLogs = allLogs.filter(log =>
      log.includes('AI') || log.includes('useAISystem') || log.includes('useAIDecision')
    );
    aiLogs.forEach(log => console.log(`  ${log}`));

    console.log('\n=== 分析 ===');
    if (submitTurnCalls.length === 0) {
      console.log('⚠️ 问题：AI没有出牌！');
      console.log('可能原因：');
      console.log('1. AI系统没有初始化');
      console.log('2. AI决策Hook没有被触发');
      console.log('3. AI决策失败但没有错误日志');

      if (aiLogs.length === 0) {
        console.log('✗ 确认：没有任何AI相关的控制台日志');
        console.log('  说明useAISystem或useAIDecision Hook没有被触发！');
      }
    } else {
      console.log('✓ AI有出牌！');
    }

    // 保存详细日志到文件
    const fs = require('fs');
    const logData = {
      timestamp: new Date().toISOString(),
      allLogs,
      apiCalls,
      apiResponses,
      summary: {
        createRoomCalls: createRoomCalls.length,
        startGameCalls: startGameCalls.length,
        submitTurnCalls: submitTurnCalls.length,
        getAiHandCalls: getAiHandCalls.length,
        aiLogsCount: aiLogs.length,
      }
    };
    fs.writeFileSync('ai-debug-logs.json', JSON.stringify(logData, null, 2));
    console.log('\n详细日志已保存到 ai-debug-logs.json');
  });
});
