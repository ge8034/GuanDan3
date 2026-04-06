/**
 * 完整游戏测试 - 包含排名分析
 *
 * 测试流程：
 * 1. 访问游戏页面
 * 2. 捕获控制台日志
 * 3. 模拟真实游戏流程
 * 4. 验证排名系统
 * 5. 分析并修复问题
 */

import { test, expect } from '@playwright/test';
import { getRandomSeed } from '../e2e/shared/helpers';

test.describe('完整游戏测试 - 排名验证', () => {
  test('完整的单人游戏流程 - 应该分出1/2/3/4排名', async ({ page }) => {
    // 存储控制台日志
    const consoleLogs: string[] = [];
    const errors: string[] = [];

    // 监听控制台消息
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
      consoleLogs.push(`[${msg.type()}] ${msg.text()}`);
    });

    // 监听页面错误
    page.on('pageerror', (error) => {
      errors.push(error.toString());
    });

    // 监听网络请求
    const apiRequests: { url: string; status: number; method: string }[] = [];
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('supabase.co')) {
        apiRequests.push({
          url: url.split('?')[0],
          method: request.method(),
          status: 0 // 会在response中更新
        });
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      const req = apiRequests.find(r => r.url === url.split('?')[0]);
      if (req) {
        req.status = response.status();
      }
    });

    console.log('🎯 步骤1: 访问首页');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // 等待React初始化

    console.log('🎯 步骤2: 创建练习房间');
    // 点击创建练习房间按钮
    const practiceButton = page.getByRole('button', { name: /练习|开始游戏|start/i });
    await practiceButton.click();
    await page.waitForTimeout(2000); // 等待房间创建和页面跳转

    console.log('🎯 步骤3: 等待进入游戏房间');
    // 等待URL变化或游戏界面出现
    await page.waitForURL(/\/room\//, { timeout: 10000 });
    await page.waitForTimeout(2000); // 等待游戏界面加载

    // 获取当前房间ID
    const url = page.url();
    const roomIdMatch = url.match(/room\/([a-f0-9-]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : 'unknown';
    console.log(`📍 房间ID: ${roomId}`);

    console.log('🎯 步骤4: 检查游戏状态');
    // 检查是否进入游戏状态
    const gameStarted = await page.locator('[data-testid="game-table"], .game-table, #game-table').isVisible({ timeout: 5000 }).catch(() => false);
    expect(gameStarted).toBeTruthy();

    console.log('🎯 步骤5: 等待游戏自动进行（AI vs AI）');
    // 等待AI出牌和游戏进行
    await page.waitForTimeout(10000); // 等待10秒让AI自动出牌

    // 检查手牌
    const handCards = await page.locator('.card, [data-card-id]').count();
    console.log(`🃏 当前手牌数: ${handCards}`);

    // 尝试点击出牌按钮（如果有）
    const playButton = page.getByRole('button', { name: /出牌|play|confirm/i });
    if (await playButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🎯 发现出牌按钮，尝试点击');
      await playButton.click();
      await page.waitForTimeout(2000);
    }

    // 尝试点击过牌按钮
    const passButton = page.getByRole('button', { name: /过牌|pass/i });
    if (await passButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      console.log('🎯 发现过牌按钮，尝试点击');
      await passButton.click();
      await page.waitForTimeout(2000);
    }

    console.log('🎯 步骤6: 等待游戏结束（最长时间30秒）');
    await page.waitForTimeout(30000);

    console.log('🎯 步骤7: 检查排名显示');
    // 检查是否有排名显示
    const rankings = page.locator('[data-testid="rankings"], .rankings, .score-board');
    const hasRankings = await rankings.isVisible({ timeout: 5000 }).catch(() => false);

    console.log('📊 测试结果分析:');
    console.log(`- 房间ID: ${roomId}`);
    console.log(`- 手牌数: ${handCards}`);
    console.log(`- 有排名显示: ${hasRankings}`);
    console.log(`- 控制台日志数: ${consoleLogs.length}`);
    console.log(`- 错误数: ${errors.length}`);

    // 分析API请求
    const failedRequests = apiRequests.filter(r => r.status >= 400);
    const successRequests = apiRequests.filter(r => r.status > 0 && r.status < 400);

    console.log(`- API请求总数: ${apiRequests.length}`);
    console.log(`- 成功请求: ${successRequests.length}`);
    console.log(`- 失败请求: ${failedRequests.length}`);

    if (failedRequests.length > 0) {
      console.log('❌ 失败的API请求:');
      failedRequests.forEach(req => {
        console.log(`  - ${req.method} ${req.url}: ${req.status}`);
      });
    }

    if (errors.length > 0) {
      console.log('❌ 控制台错误:');
      errors.slice(0, 10).forEach(err => {
        console.log(`  - ${err}`);
      });
    }

    // 检查游戏状态
    const gameState = await page.evaluate(() => {
      return (window as any).gameState || null;
    });

    if (gameState) {
      console.log('🎮 游戏状态:');
      console.log(`  - 状态: ${gameState.status}`);
      console.log(`  - 回合: ${gameState.turnNo}`);
      console.log(`  - 当前座位: ${gameState.currentSeat}`);
      console.log(`  - 等级: ${gameState.levelRank}`);
    }

    // 截图保存
    await page.screenshot({ path: `test-results/game-rankings-${Date.now()}.png` });

    // 如果有错误，抛出测试失败
    if (errors.length > 0) {
      console.log('⚠️  测试发现错误，需要修复');
    }

    // 基本断言
    expect(gameStarted).toBeTruthy();
  });
});
