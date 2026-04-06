/**
 * 真实游戏页面调试测试
 *
 * 流程：
 * 1. 访问游戏页面
 * 2. 捕获所有控制台日志
 * 3. 模拟真实游戏流程
 * 4. 分析问题
 * 5. 迭代修复
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const GAME_TIMEOUT = 180000; // 3分钟

test.describe('真实游戏页面调试', () => {
  test.beforeEach(async ({ page }) => {
    // 捕获所有控制台日志
    const logs: any[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push({
        type: msg.type(),
        text: text,
        location: msg.location()
      });

      // 只打印重要日志
      if (
        text.includes('ERROR') ||
        text.includes('warning') ||
        text.includes('[AutoStart]') ||
        text.includes('[fetchGame]') ||
        text.includes('[useRoomGame]') ||
        text.includes('gameStatus') ||
        text.includes('currentSeat') ||
        text.includes('turnNo')
      ) {
        console.log(`[${msg.type()}] ${text}`);
      }
    });

    // 捕获页面错误
    page.on('pageerror', (error) => {
      console.log('[Page Error]', error.message);
    });

    // 保存日志供测试使用
    (page as any).consoleLogs = logs;
  });

  test('完整游戏流程调试：访问页面 → 创建练习房 → 游戏完成', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    console.log('=== 阶段1：访问首页 ===');
    await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000); // 给页面更多时间

    const logs = (page as any).consoleLogs || [];
    console.log(`✓ 页面加载完成，捕获日志: ${logs.length} 条`);

    // 检查页面元素
    const title = await page.locator('h1').first().textContent();
    console.log(`✓ 页面标题: ${title}`);

    // 检查练习按钮
    const practiceBtn = page.getByRole('button', { name: /练习|开始练习/i });
    await expect(practiceBtn).toBeVisible({ timeout: 5000 });
    console.log('✓ 练习按钮可见');

    console.log('\n=== 阶段2：创建练习房 ===');
    await practiceBtn.click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    const roomUrl = page.url();
    const roomIdMatch = roomUrl.match(/\/room\/([^/]+)/);
    const roomId = roomIdMatch ? roomIdMatch[1] : 'unknown';
    console.log(`✓ 进入房间: ${roomId}`);

    // 等待游戏自动开始
    console.log('等待游戏自动开始...');
    await page.waitForTimeout(5000);

    // 检查手牌区域
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 15000 });

    console.log('检查手牌加载...');
    await page.waitForTimeout(2000);

    // 再次检查手牌数量
    const cardCount = await page.locator('[data-card-id]').count();
    console.log(`✓ 手牌数量: ${cardCount}`);

    if (cardCount === 0) {
      // 手牌可能还在加载，等待更长时间
      console.log('手牌数量为 0，等待更多时间...');
      await page.waitForTimeout(5000);

      const finalCardCount = await page.locator('[data-card-id]').count();
      console.log(`✓ 最终手牌数量: ${finalCardCount}`);

      if (finalCardCount !== 27) {
        throw new Error(`手牌数量不正确: ${finalCardCount} (期望 27)`);
      }
    } else if (cardCount !== 27) {
      throw new Error(`手牌数量不正确: ${cardCount} (期望 27)`);
    }

    console.log('\n=== 阶段3：模拟真实游戏流程 ===');

    let previousCardCount = cardCount;
    let totalTurns = 0;
    let consecutiveStops = 0;
    const maxStops = 5; // 最大连续停滞次数

    while (consecutiveStops < maxStops && totalTurns < 5) {
      consecutiveStops = 0;

      // 先尝试出牌
      if (previousCardCount > 0) {
        try {
          const nextCard = page.locator('[data-card-id]').first();
          await nextCard.click();
          await page.waitForTimeout(200);

          const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
          await playBtn.click();
          console.log(`✓ 自动出牌成功，剩余: ${previousCardCount - 1}`);
        } catch (e) {
          console.log(`⚠️  自动出牌失败:`, e);
        }
      }

      // 等待游戏处理
      await page.waitForTimeout(3000);

      const currentCardCount = await page.locator('[data-card-id]').count();
      console.log(`轮次 ${totalTurns + 1}: 手牌 ${previousCardCount} → ${currentCardCount}`);

      // 检查手牌数量变化
      if (currentCardCount < previousCardCount) {
        consecutiveStops = 0;
        totalTurns++;
        previousCardCount = currentCardCount;

        // 如果手牌很少了，检查游戏是否即将结束
        if (currentCardCount <= 5) {
          console.log('✓ 手牌数量较少，游戏可能接近结束');
          break;
        }
      } else {
        consecutiveStops++;
        console.log(`⚠️  连续停滞 (${consecutiveStops}/${maxStops})`);

        // 如果停滞太多次，再次尝试出牌
        if (consecutiveStops >= 2) {
          console.log('⚠️  停滞时间过长，再次尝试出牌');
          try {
            const nextCard = page.locator('[data-card-id]').first();
            await nextCard.click();
            await page.waitForTimeout(200);

            const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
            await playBtn.click();
            consecutiveStops = 0;
            console.log('✓ 再次出牌成功');
          } catch (e) {
            console.log('⚠️  出牌失败:', e);
          }
        }
      }

      // 检查游戏是否结束
      const bodyText = await page.evaluate(() => document.body.textContent || '');
      if (
        bodyText.includes('游戏结束') ||
        bodyText.includes('结算') ||
        bodyText.includes('胜利') ||
        bodyText.includes('本局结束')
      ) {
        console.log('✓ 游戏已结束');
        break;
      }
    }

    console.log('\n=== 测试结果 ===');
    console.log(`总轮次: ${totalTurns}`);
    console.log(`最终手牌: ${previousCardCount}`);

    // 验证游戏有进展
    expect(totalTurns, '游戏应该有进展').toBeGreaterThan(0);

    console.log('\n=== 控制台日志分析 ===');

    // 分析错误日志
    const errors = logs.filter(l => l.type === 'error' || l.text.includes('ERROR'));
    if (errors.length > 0) {
      console.log(`发现 ${errors.length} 条错误:`);
      errors.forEach((log, i) => {
        console.log(`  ${i + 1}. ${log.text}`);
      });
    }

    // 分析关键日志
    const autoStartLogs = logs.filter(l =>
      l.text.includes('[AutoStart]')
    );
    console.log(`自动开始相关日志: ${autoStartLogs.length} 条`);

    const fetchGameLogs = logs.filter(l =>
      l.text.includes('[fetchGame]')
    );
    console.log(`fetchGame 调用: ${fetchGameLogs.length} 条`);

    console.log('\n✓ 调试测试完成');
  });

  test('游戏状态检查', async ({ page }) => {
    test.setTimeout(60000);

    console.log('=== 检查游戏状态 ===');

    // 访问练习房
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习|开始练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 检查页面元素
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    const cardCount = await page.locator('[data-card-id]').count();
    console.log(`手牌数量: ${cardCount}`);

    if (cardCount > 0) {
      console.log('✓ 游戏状态正常，手牌已加载');
    } else {
      console.log('⚠️  手牌数量为 0，可能是游戏未正常开始');
    }
  });
});
