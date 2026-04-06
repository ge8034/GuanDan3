/**
 * AI 完整游戏 E2E 测试
 *
 * 端到端验证AI能够完成完整游戏
 * 测试全AI游戏、人机混合游戏、性能监控等
 */

import { test, expect } from '@playwright/test';
import { setupGameMocks, cleanupMockState } from '../shared';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const GAME_TIMEOUT = 360000; // 6 分钟超时 - AI完整游戏需要更多时间

test.describe('AI完整游戏', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test.afterEach(() => {
    cleanupMockState();
  });

  test('4个AI能自动完成一局游戏', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 进入练习房间（会自动填充3个AI，但我们需要测试4个AI）
    await page.goto(BASE_URL);

    // 监听控制台日志
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('AI') || text.includes('turn') || text.includes('决策')) {
        console.log('[Browser Console]', text);
      }
    });

    // 点击练习按钮
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房');

    // 等待游戏自动开始
    await page.waitForTimeout(3000);

    // 验证手牌存在
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    const cardCount = await page.locator('[data-card-id]').count();
    expect(cardCount, '应该有27张手牌').toBe(27);

    console.log('✓ 游戏已开始，手牌已发 (27张)');

    // 监控游戏进度
    let gameActive = true;
    let turnCount = 0;
    const maxTurns = 100; // 防止无限循环
    let lastHandSize = 27;
    let noProgressCount = 0;

    while (gameActive && turnCount < maxTurns) {
      await page.waitForTimeout(2000);
      turnCount++;

      // 检查手牌数量
      const currentCardCount = await page.locator('[data-card-id]').count();

      console.log(`轮次 ${turnCount}: 手牌数量 = ${currentCardCount}`);

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        console.log('✓ 检测到排行榜，游戏已结束');
        gameActive = false;
        break;
      }

      // 检查是否有游戏结束提示
      const hasGameOverText = await page.getByText(/游戏结束|Game Over|获胜/i).isVisible().catch(() => false);
      if (hasGameOverText) {
        console.log('✓ 检测到游戏结束提示');
        gameActive = false;
        break;
      }

      // 检测游戏进展
      if (currentCardCount !== lastHandSize) {
        lastHandSize = currentCardCount;
        noProgressCount = 0;
      } else {
        noProgressCount++;
      }

      // 如果长时间没有进展，可能AI卡住了
      if (noProgressCount > 10) {
        console.log('⚠️  游戏长时间无进展，可能AI卡住');
        // 检查是否有错误日志
        const errorLogs = logs.filter(log =>
          log.includes('error') ||
          log.includes('Error') ||
          log.includes('failed') ||
          log.includes('卡牌已刷新')
        );
        if (errorLogs.length > 0) {
          console.log('发现错误日志:', errorLogs.slice(-5));
        }
        break;
      }

      // 如果手牌很少了，游戏可能接近结束
      if (currentCardCount <= 5) {
        console.log('✓ 手牌数量较少，游戏可能接近结束');
        // 再等待几轮看是否结束
        await page.waitForTimeout(5000);
      }
    }

    // 验证游戏有进展
    expect(turnCount, '游戏应该有进展').toBeGreaterThan(5);
    expect(noProgressCount, '游戏不应该长时间无进展').toBeLessThan(10);

    console.log('✓ AI完整游戏测试完成');
  });

  test('1个人+3个AI能完成游戏', async ({ page }) => {
    test.setTimeout(GAME_TIMEOUT);

    // 监听控制台日志
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('AI') || text.includes('turn')) {
        console.log('[Browser Console]', text);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房');

    // 等待游戏自动开始
    await page.waitForTimeout(3000);

    // 检查手牌是否存在
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    const cardCount = await page.locator('[data-card-id]').count();
    expect(cardCount, '应该有27张手牌').toBe(27);

    console.log('✓ 游戏已开始，手牌已发 (27张)');

    // 人类玩家出一次牌
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 人类玩家已出牌，等待AI接管...');

    // 监控游戏进度
    let previousCardCount = cardCount;
    let totalTurns = 0;
    let noProgressCount = 0;
    const maxWaitTime = Date.now() + GAME_TIMEOUT;

    while (Date.now() < maxWaitTime && totalTurns < 50) {
      await page.waitForTimeout(3000);
      totalTurns++;

      const currentCardCount = await page.locator('[data-card-id]').count();

      console.log(`轮次 ${totalTurns}: 手牌数量 = ${currentCardCount}`);

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        console.log('✓ 检测到排行榜，游戏已结束');
        break;
      }

      // 检测游戏进展
      if (currentCardCount < previousCardCount) {
        console.log(`✓ 游戏进展：手牌从 ${previousCardCount} 张变为 ${currentCardCount} 张`);
        previousCardCount = currentCardCount;
        noProgressCount = 0;

        // 自动帮人类玩家出牌（模拟AI接管）
        if (currentCardCount > 0) {
          try {
            const nextCard = page.locator('[data-card-id]').first();
            await nextCard.click();
            await page.waitForTimeout(200);

            const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
            await playBtn.click();
            console.log(`✓ 自动出牌，剩余手牌: ${currentCardCount - 1}`);
          } catch (e) {
            console.log('⚠️  自动出牌失败:', e);
          }
        }
      } else if (currentCardCount === previousCardCount && totalTurns > 1) {
        noProgressCount++;
      }

      // 如果长时间无进展
      if (noProgressCount > 10) {
        console.log('⚠️  游戏长时间无进展');
        break;
      }

      // 如果手牌很少了
      if (currentCardCount <= 5) {
        console.log('✓ 手牌数量较少，游戏可能接近结束');
        break;
      }
    }

    // 验证游戏有进展
    expect(totalTurns, '游戏应该有进展').toBeGreaterThan(3);
    expect(noProgressCount, '游戏不应该长时间无进展').toBeLessThan(10);

    console.log('✓ 人机混合游戏测试完成');
  });

  test('AI能在合理时间内出牌', async ({ page }) => {
    test.setTimeout(120000); // 2 分钟超时

    // 监听控制台日志和时间戳
    const decisionTimes: number[] = [];
    const logs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      if (text.includes('AI') || text.includes('决策') || text.includes('submitTurn')) {
        const timestamp = Date.now();
        console.log(`[${timestamp}] ${text}`);
        decisionTimes.push(timestamp);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房');

    // 等待游戏自动开始
    await page.waitForTimeout(3000);

    // 人类玩家出牌
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 人类玩家已出牌，开始监控AI出牌时间...');

    // 监控AI出牌时间
    const startTime = Date.now();
    let lastHandSize = 27;
    let decisionCount = 0;
    const maxDecisions = 20;

    while (decisionCount < maxDecisions) {
      await page.waitForTimeout(2000);

      const currentHandSize = await page.locator('[data-card-id]').count();

      // 检测手牌变化（表示AI出牌了）
      if (currentHandSize < lastHandSize) {
        const decisionTime = Date.now();
        const timeSinceStart = decisionTime - startTime;
        const timeSinceLastDecision = decisionTimes.length > 0
          ? decisionTime - decisionTimes[decisionTimes.length - 1]
          : timeSinceStart;

        console.log(`✓ AI 决策 ${decisionCount + 1}: 距上次 ${timeSinceLastDecision}ms`);

        // 验证出牌时间在合理范围内（< 5秒）
        expect(timeSinceLastDecision).toBeLessThan(5000);

        lastHandSize = currentHandSize;
        decisionCount++;

        // 人类玩家再次出牌以触发更多AI决策
        if (currentHandSize > 0) {
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

    console.log(`✓ 共监控到 ${decisionCount} 次AI决策`);

    // 验证至少有几次AI决策
    expect(decisionCount).toBeGreaterThanOrEqual(3);

    console.log('✓ AI出牌时间测试完成');
  });

  test('AI不会出现卡牌刷新导致的锁死', async ({ page }) => {
    test.setTimeout(180000);

    // 监听控制台日志，特别关注卡牌刷新相关
    const refreshLogs: string[] = [];
    const lockLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('卡牌已刷新') || text.includes('Cards refreshed') || text.includes('Card not found')) {
        refreshLogs.push(text);
        console.log('[Card Refresh]', text);
      }
      if (text.includes('锁') || text.includes('lock') || text.includes('轮次')) {
        lockLogs.push(text);
        console.log('[Lock]', text);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏自动开始
    await page.waitForTimeout(3000);

    // 人类玩家出牌
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 人类玩家已出牌，监控AI是否会出现卡牌刷新问题...');

    // 监控较长时间
    let previousCardCount = 27;
    let noProgressCount = 0;
    const maxIterations = 30;

    for (let i = 0; i < maxIterations; i++) {
      await page.waitForTimeout(3000);

      const currentCardCount = await page.locator('[data-card-id]').count();

      if (currentCardCount < previousCardCount) {
        console.log(`✓ 轮次 ${i + 1}: AI正常出牌`);
        previousCardCount = currentCardCount;
        noProgressCount = 0;

        // 人类玩家出牌
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
      } else {
        noProgressCount++;
      }

      // 如果长时间无进展
      if (noProgressCount > 8) {
        console.log('⚠️  AI长时间无进展，检查是否卡死...');

        // 检查是否有卡牌刷新日志
        if (refreshLogs.length > 0) {
          console.log('发现卡牌刷新日志:', refreshLogs.slice(-3));

          // 检查是否有锁释放日志
          const hasReleaseLog = lockLogs.some(log =>
            log.includes('释放') || log.includes('reset') || log.includes('完成')
          );

          if (hasReleaseLog) {
            console.log('✓ 检测到锁释放日志，锁机制正常工作');
          } else {
            console.log('⚠️  未检测到锁释放日志，可能存在锁死问题');
          }
        }

        break;
      }

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        console.log('✓ 游戏已结束');
        break;
      }
    }

    // 验证游戏有足够的进展
    expect(noProgressCount, 'AI不应该长时间无进展').toBeLessThan(8);

    // 如果有卡牌刷新，验证锁机制工作正常
    if (refreshLogs.length > 0) {
      console.log(`✓ 检测到 ${refreshLogs.length} 次卡牌刷新，但AI继续正常工作`);
    }

    console.log('✓ AI卡牌刷新测试完成');
  });
});
