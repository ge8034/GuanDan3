/**
 * 简化调试测试
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test('简化调试：访问页面并检查游戏状态', async ({ page }) => {
  console.log('=== 开始调试 ===');

  // 捕获所有控制台日志
  const consoleLogs: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);

    // 打印所有日志
    if (text.includes('ERROR') || text.includes('warning') ||
        text.includes('[AutoStart]') || text.includes('[fetchGame]')) {
      console.log(`[Console ${msg.type()}] ${text}`);
    }
  });

  page.on('pageerror', err => {
    const errorText = err.message + (err.stack ? '\n' + err.stack : '');
    pageErrors.push(errorText);
    console.log(`[Page Error] ${errorText}`);
  });

  // 访问页面
  console.log('1. 访问首页...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // 检查练习按钮
  console.log('2. 检查练习按钮...');
  const practiceBtn = page.getByRole('button', { name: /练习|开始练习/i });
  await expect(practiceBtn).toBeVisible();

  // 点击开始练习
  console.log('3. 点击开始练习...');
  await practiceBtn.click();

  // 等待进入房间
  console.log('4. 等待进入房间...');
  await page.waitForURL(/\/room\/[^/]+$/, { timeout: 15000 });

  const roomId = page.url().match(/\/room\/([^/]+)/)?.[1] || 'unknown';
  console.log(`房间ID: ${roomId}`);

  // 等待游戏自动开始
  console.log('5. 等待游戏自动开始...');
  await page.waitForTimeout(8000);

  // 检查手牌
  console.log('6. 检查手牌数量...');
  const cardCount = await page.locator('[data-card-id]').count();
  console.log(`手牌数量: ${cardCount}`);

  if (cardCount === 0) {
    console.log('⚠️  手牌数量为 0，等待更长时间...');
    await page.waitForTimeout(5000);

    const finalCardCount = await page.locator('[data-card-id]').count();
    console.log(`再次检查手牌数量: ${finalCardCount}`);

    if (finalCardCount !== 27) {
      console.log(`⚠️  手牌数量仍不正确: ${finalCardCount}`);
    }
  }

  // 捕获日志
  console.log(`已捕获 ${consoleLogs.length} 条控制台日志`);

  // 分析日志
  const errors = consoleLogs.filter(l => l.includes('ERROR'));
  const autoStartLogs = consoleLogs.filter(l => l.includes('[AutoStart]'));
  const fetchGameLogs = consoleLogs.filter(l => l.includes('[fetchGame]'));

  if (errors.length > 0) {
    console.log(`\n发现 ${errors.length} 个错误:`);
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  if (autoStartLogs.length > 0) {
    console.log(`\n自动开始相关日志 (${autoStartLogs.length}条):`);
    autoStartLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
  }

  if (fetchGameLogs.length > 0) {
    console.log(`\nfetchGame 相关日志 (${fetchGameLogs.length}条):`);
    fetchGameLogs.forEach((log, i) => {
      console.log(`  ${i + 1}. ${log}`);
    });
  }

  // 尝试出牌
  console.log('7. 尝试出牌...');
  if (cardCount > 0) {
    const nextCard = page.locator('[data-card-id]').first();
    await nextCard.click();
    await page.waitForTimeout(200);

    const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
    try {
      await playBtn.click();
      console.log('✓ 出牌按钮点击成功');
    } catch (e) {
      console.log('⚠️  出牌按钮点击失败:', e);
    }
  }

  // 等待游戏处理
  console.log('8. 等待游戏处理...');
  await page.waitForTimeout(5000);

  // 再次检查手牌
  const newCardCount = await page.locator('[data-card-id]').count();
  console.log(`新手牌数量: ${newCardCount}`);
  console.log(`变化: ${cardCount} → ${newCardCount}`);

  // 检查页面错误
  if (pageErrors.length > 0) {
    console.log(`\n发现 ${pageErrors.length} 个页面错误:`);
    pageErrors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('\n✓ 调试完成');
});
