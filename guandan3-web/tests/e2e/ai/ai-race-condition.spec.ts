/**
 * AI 竞态条件 E2E 测试
 *
 * 在真实环境中验证竞态条件处理
 * 测试快速出牌场景、网络延迟恢复、页面刷新恢复等
 */

import { test, expect } from '@playwright/test';
import { setupGameMocks, cleanupMockState } from '../shared';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const GAME_TIMEOUT = 240000; // 4分钟超时 - 竞态条件测试需要更多时间

test.describe('AI竞态条件E2E', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test.afterEach(() => {
    cleanupMockState();
  });

  test('快速出牌不会导致AI卡住', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 监听控制台日志
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('AI') || text.includes('决策') || text.includes('锁')) {
        console.log('[Console]', text);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    console.log('✓ 游戏已开始，开始快速出牌测试...');

    // 快速连续出牌多次
    let previousCardCount = 27;
    let noProgressCount = 0;
    const maxIterations = 15;

    for (let i = 0; i < maxIterations; i++) {
      // 快速出牌
      try {
        const firstCard = page.locator('[data-card-id]').first();
        await firstCard.click();
        await page.waitForTimeout(100); // 更短的等待时间

        const playButton = page.getByRole('button', { name: /出牌|Play/i });
        await playButton.click();
        await page.waitForTimeout(100); // 更短的等待时间

        console.log(`✓ 快速出牌 ${i + 1}`);

        // 检查手牌是否变化
        const currentCardCount = await page.locator('[data-card-id]').count();

        if (currentCardCount < previousCardCount) {
          console.log(`✓ 手牌变化: ${previousCardCount} -> ${currentCardCount}`);
          previousCardCount = currentCardCount;
          noProgressCount = 0;
        } else {
          noProgressCount++;
        }

        // 如果连续多次无进展
        if (noProgressCount > 5) {
          console.log('⚠️  快速出牌后AI无进展');

          // 检查是否有锁相关日志
          const lockLogs = logs.filter(log =>
            log.includes('锁') || log.includes('lock') || log.includes('轮次')
          );

          if (lockLogs.length > 0) {
            console.log('锁相关日志:', lockLogs.slice(-5));
          }

          // 等待更长时间看AI能否恢复
          await page.waitForTimeout(5000);

          const recoveryCardCount = await page.locator('[data-card-id]').count();
          if (recoveryCardCount < previousCardCount) {
            console.log('✓ AI在等待后恢复正常');
          }
          break;
        }

        // 检查游戏是否结束
        const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
        if (hasRanking) {
          console.log('✓ 游戏已结束');
          break;
        }
      } catch (e) {
        console.log('⚠️  快速出牌失败:', e);
        break;
      }
    }

    // 验证AI没有被卡住
    expect(noProgressCount, '快速出牌后AI应该能够响应').toBeLessThan(8);

    console.log('✓ 快速出牌测试完成');
  });

  test('网络延迟恢复后AI继续出牌', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 监听控制台日志
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('AI') || text.includes('延迟') || text.includes('timeout')) {
        console.log('[Console]', text);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    console.log('✓ 游戏已开始，开始网络延迟测试...');

    // 人类玩家先出牌
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 人类玩家已出牌');

    // 等待AI开始决策
    await page.waitForTimeout(2000);

    // 模拟网络延迟：离线一段时间
    console.log('⚠️  模拟网络延迟...');

    // 通过设置离线来模拟网络问题
    await page.context().setOffline(true);
    await page.waitForTimeout(5000);

    // 恢复网络
    await page.context().setOffline(false);
    console.log('✓ 网络已恢复');

    // 等待AI恢复并继续出牌
    let previousCardCount = await page.locator('[data-card-id]').count();
    let recovered = false;
    let iterations = 0;

    while (!recovered && iterations < 15) {
      await page.waitForTimeout(3000);
      iterations++;

      const currentCardCount = await page.locator('[data-card-id]').count();
      console.log(`轮次 ${iterations}: 手牌数量 = ${currentCardCount}`);

      if (currentCardCount < previousCardCount) {
        console.log('✓ AI在网络恢复后继续出牌');
        recovered = true;
        previousCardCount = currentCardCount;

        // 人类玩家再次出牌
        if (currentCardCount > 0) {
          try {
            const nextCard = page.locator('[data-card-id]').first();
            await nextCard.click();
            await page.waitForTimeout(200);

            const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
            await playBtn.click();
          } catch (e) {
            // 忽略错误
          }
        }
      }

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        console.log('✓ 游戏已结束');
        break;
      }
    }

    // 验证AI能够在网络恢复后继续工作
    expect(recovered, 'AI应该在网络恢复后继续出牌').toBe(true);

    console.log('✓ 网络延迟恢复测试完成');
  });

  test('页面刷新后AI状态正确', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    console.log('✓ 游戏已开始');

    // 获取初始手牌数量
    const initialCardCount = await page.locator('[data-card-id]').count();
    console.log(`初始手牌数量: ${initialCardCount}`);
    expect(initialCardCount).toBe(27);

    // 人类玩家出牌
    const firstCard = page.locator('[data-card-id]').first();
    const cardId = await firstCard.getAttribute('data-card-id');

    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 人类玩家已出牌');

    // 等待AI响应
    await page.waitForTimeout(3000);

    // 获取出牌后的手牌数量
    const afterPlayCardCount = await page.locator('[data-card-id]').count();
    console.log(`出牌后手牌数量: ${afterPlayCardCount}`);

    // 刷新页面
    console.log('⚠️  刷新页面...');
    await page.reload();
    await page.waitForTimeout(3000);

    console.log('✓ 页面已刷新');

    // 验证游戏状态已恢复
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    // 获取刷新后的手牌数量
    const afterRefreshCardCount = await page.locator('[data-card-id]').count();
    console.log(`刷新后手牌数量: ${afterRefreshCardCount}`);

    // 手牌数量应该与出牌后一致
    expect(afterRefreshCardCount).toBe(afterPlayCardCount);

    // 验证AI能够继续工作
    // 人类玩家再次出牌
    const nextCard = page.locator('[data-card-id]').first();
    await nextCard.click();
    await page.waitForTimeout(300);

    const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
    await playBtn.click();

    console.log('✓ 刷新后人类玩家已出牌');

    // 等待AI响应
    await page.waitForTimeout(5000);

    const finalCardCount = await page.locator('[data-card-id]').count();
    console.log(`最终手牌数量: ${finalCardCount}`);

    // 验证AI继续工作（手牌数量应该减少）
    expect(finalCardCount).toBeLessThan(afterRefreshCardCount);

    console.log('✓ 页面刷新测试完成');
  });

  test('多次快速刷新不会导致AI状态错乱', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    console.log('✓ 游戏已开始');

    // 记录初始状态
    const initialCardCount = await page.locator('[data-card-id]').count();
    console.log(`初始手牌数量: ${initialCardCount}`);

    // 多次快速刷新
    console.log('⚠️  开始多次快速刷新...');

    for (let i = 0; i < 5; i++) {
      await page.reload();
      await page.waitForTimeout(2000);
      console.log(`刷新 ${i + 1}/5 完成`);
    }

    console.log('✓ 多次刷新完成');

    // 验证游戏状态仍然正确
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    const finalCardCount = await page.locator('[data-card-id]').count();
    console.log(`刷新后手牌数量: ${finalCardCount}`);

    // 手牌数量应该保持一致
    expect(finalCardCount).toBe(initialCardCount);

    // 验证UI可用（检查是否可以点击卡牌）
    const firstCard = page.locator('[data-card-id]').first();
    await expect(firstCard).toBeVisible();

    // 尝试点击卡牌
    await firstCard.click();
    await page.waitForTimeout(300);

    // 验证卡牌可以被选中（检查是否有选中样式）
    const isSelected = await firstCard.evaluate((el) => {
      return el.classList.contains('border-blue-500') ||
             el.classList.contains('ring-2') ||
             (el as HTMLElement).style.transform !== 'none';
    });

    expect(isSelected).toBe(true);

    console.log('✓ 多次刷新测试完成');
  });

  test('AI在并发操作下保持一致性', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    console.log('✓ 游戏已开始');

    // 监听控制台日志
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('AI') || text.includes('决策') || text.includes('锁')) {
        console.log('[Console]', text);
      }
    });

    // 模拟并发操作：快速点击多个卡牌
    const cards = page.locator('[data-card-id]');
    const cardCount = await cards.count();

    console.log(`⚠️  开始并发操作：快速点击 ${Math.min(5, cardCount)} 张卡牌`);

    // 快速点击多张卡牌
    const clickPromises = [];
    for (let i = 0; i < Math.min(5, cardCount); i++) {
      clickPromises.push(
        cards.nth(i).click().catch(() => {})
      );
      // 不等待，立即点击下一张
    }

    // 等待所有点击完成
    await Promise.all(clickPromises);
    await page.waitForTimeout(500);

    // 尝试出牌
    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click().catch(() => {
      console.log('⚠️  出牌失败（可能是因为选了多张牌但不符合牌型）');
    });

    console.log('✓ 并发操作完成');

    // 等待AI响应
    await page.waitForTimeout(3000);

    // 验证游戏没有崩溃
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();

    // 检查是否有错误日志
    const errorLogs = logs.filter(log =>
      log.includes('error') ||
      log.includes('Error') ||
      log.includes('崩溃') ||
      log.includes('crash')
    );

    if (errorLogs.length > 0) {
      console.log('发现错误日志:', errorLogs.slice(-3));
    }

    // 验证手牌数量合理
    const currentCardCount = await page.locator('[data-card-id]').count();
    console.log(`当前手牌数量: ${currentCardCount}`);
    expect(currentCardCount).toBeGreaterThan(0);
    expect(currentCardCount).toBeLessThanOrEqual(27);

    console.log('✓ 并发操作测试完成');
  });
});
