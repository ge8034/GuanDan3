/**
 * AI调试日志捕获测试
 * 专门用于捕获和分析AI决策过程中的控制台日志
 */

import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // 监听所有控制台消息
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    // 记录所有与AI相关的日志
    if (text.includes('AI') ||
        text.includes('useAIDecision') ||
        text.includes('getAIHand') ||
        text.includes('submitTurn') ||
        text.includes('lock') ||
        text.includes('座位') ||
        text.includes('轮次') ||
        text.includes('[AI-DEBUG]')) {
      console.log(`[${type.toUpperCase()}] ${text}`);
    }
  });

  // 监听错误
  page.on('pageerror', error => {
    console.error('[PAGE ERROR]', error.message);
    if (error.stack) {
      console.error('[STACK]', error.stack);
    }
  });
});

test('AI调试：捕获完整控制台日志', async ({ page }) => {
  test.setTimeout(180000); // 3分钟超时 - 调试捕获需要更多时间

  console.log('=== 开始AI调试测试 ===');

  // 1. 导航到练习房
  console.log('1. 导航到练习房...');
  await page.goto('/practice');

  // 等待页面加载
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // 2. 检查是否已自动进入练习房
  const url = page.url();
  console.log(`2. 当前URL: ${url}`);

  if (url.includes('/practice')) {
    console.log('✓ 已在练习房页面');

    // 3. 点击开始游戏按钮（如果存在）
    const startBtn = page.getByRole('button', { name: /开始游戏|Start/i }).first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('3. 点击开始游戏按钮...');
      await startBtn.click();
      await page.waitForTimeout(3000);
    } else {
      console.log('3. 开始游戏按钮不可见，可能已自动开始');
    }
  } else if (url.includes('/room/')) {
    console.log('✓ 已自动进入练习房间');

    // 尝试点击开始按钮
    const startBtn = page.getByRole('button', { name: /开始游戏|Start/i }).first();
    if (await startBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      console.log('3. 点击开始游戏按钮...');
      await startBtn.click();
      await page.waitForTimeout(3000);
    }
  }

  // 4. 验证游戏已开始
  await page.waitForTimeout(3000);

  // 检查手牌是否显示
  const cards = page.locator('[data-card-id]');
  const cardCount = await cards.count();
  console.log(`4. 手牌数量: ${cardCount}`);

  if (cardCount === 0) {
    console.log('⚠️  手牌为空，游戏可能未正确启动');
  } else {
    console.log(`✓ 手牌已发: ${cardCount}张`);
  }

  // 5. 观察AI行为30秒
  console.log('=== 观察AI行为30秒 ===');
  let turnCounter = 0;
  const startTime = Date.now();
  const observationDuration = 30000; // 30秒

  while (Date.now() - startTime < observationDuration) {
    await page.waitForTimeout(2000);

    // 检查当前手牌数量
    const currentCards = page.locator('[data-card-id]');
    const currentCount = await currentCards.count();
    console.log(`[${turnCounter++}] 当前手牌: ${currentCount}张`);

    // 如果轮到人类玩家，尝试出牌
    const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
    if (await playBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      console.log('  → 轮到人类玩家，尝试出牌...');

      // 选第一张牌
      const firstCard = currentCards.first();
      await firstCard.click();
      await page.waitForTimeout(200);

      // 点击出牌
      await playBtn.click();
      await page.waitForTimeout(1000);

      const newCount = await currentCards.count();
      console.log(`  → 出牌后手牌: ${newCount}张`);
    }
  }

  // 6. 最终状态
  const finalCards = page.locator('[data-card-id]');
  const finalCount = await finalCards.count();
  console.log(`=== 最终手牌: ${finalCount}张 ===`);
  console.log('=== AI调试测试完成 ===');
});
