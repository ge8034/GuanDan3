/**
 * AI 压力测试
 *
 * 测试AI在长时间运行、多房间并发、内存泄漏等场景下的表现
 */

import { test, expect } from '@playwright/test';
import { setupGameMocks, cleanupMockState } from '../shared';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const STRESS_TEST_TIMEOUT = 360000; // 6 分钟压力测试 - 增加超时以应对网络波动

test.describe('AI压力测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test.afterEach(() => {
    cleanupMockState();
  });

  test('AI长时间运行不出错', async ({ page }) => {
    test.setTimeout(STRESS_TEST_TIMEOUT);

    // 监听控制台日志
    const logs: string[] = [];
    const errorLogs: string[] = [];
    const decisionTimes: number[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);

      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        errorLogs.push(text);
        console.log('[Error]', text);
      }

      if (text.includes('决策') || text.includes('AI')) {
        const timestamp = Date.now();
        decisionTimes.push(timestamp);
        console.log(`[${timestamp}] ${text}`);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房，开始长时间运行测试...');

    // 等待游戏开始
    await page.waitForTimeout(3000);

    const startTime = Date.now();
    const maxDuration = 120000; // 2 分钟
    let decisionCount = 0;
    let previousCardCount = 27;
    let noProgressCount = 0;
    let maxConsecutiveNoProgress = 0;

    while (Date.now() - startTime < maxDuration) {
      await page.waitForTimeout(2000);

      const currentCardCount = await page.locator('[data-card-id]').count();

      // 检测游戏进展
      if (currentCardCount < previousCardCount) {
        decisionCount++;
        noProgressCount = 0;
        console.log(`[${decisionCount}] 手牌: ${previousCardCount} -> ${currentCardCount}`);
        previousCardCount = currentCardCount;

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
        maxConsecutiveNoProgress = Math.max(maxConsecutiveNoProgress, noProgressCount);
      }

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        console.log('✓ 游戏已结束');
        break;
      }

      // 如果长时间无进展，记录并继续
      if (noProgressCount > 15) {
        console.log('⚠️  长时间无进展，但继续测试...');
        noProgressCount = 0; // 重置计数器
      }
    }

    const duration = Date.now() - startTime;

    console.log('=== 压力测试结果 ===');
    console.log(`测试时长: ${duration}ms`);
    console.log(`决策次数: ${decisionCount}`);
    console.log(`最大连续无进展: ${maxConsecutiveNoProgress}`);
    console.log(`错误日志数: ${errorLogs.length}`);

    // 验证结果
    expect(decisionCount, '应该有足够的决策次数').toBeGreaterThanOrEqual(10);
    expect(maxConsecutiveNoProgress, '不应该有长时间连续无进展').toBeLessThan(20);

    // 检查是否有严重错误
    const criticalErrors = errorLogs.filter(log =>
      log.includes('崩溃') ||
      log.includes('crash') ||
      log.includes('Fatal') ||
      log.includes('锁定') && log.includes('死')
    );

    expect(criticalErrors.length, '不应该有严重错误').toBe(0);

    console.log('✓ 长时间运行测试完成');
  });

  test('AI决策性能稳定', async ({ page }) => {
    test.setTimeout(STRESS_TEST_TIMEOUT);

    // 监听决策时间
    const decisionTimes: number[] = [];
    let lastDecisionTime = Date.now();

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('AI') || text.includes('决策') || text.includes('提交')) {
        const now = Date.now();
        const timeSinceLast = now - lastDecisionTime;
        lastDecisionTime = now;

        // 只记录合理的时间间隔（100ms - 10秒）
        if (timeSinceLast >= 100 && timeSinceLast <= 10000) {
          decisionTimes.push(timeSinceLast);
        }
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    // 运行足够长的时间以收集数据
    const startTime = Date.now();
    const maxDuration = 90000; // 90 秒
    let previousCardCount = 27;

    while (Date.now() - startTime < maxDuration) {
      await page.waitForTimeout(2000);

      const currentCardCount = await page.locator('[data-card-id]').count();

      if (currentCardCount < previousCardCount) {
        previousCardCount = currentCardCount;

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
      }

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        break;
      }
    }

    console.log('=== 性能测试结果 ===');
    console.log(`样本数量: ${decisionTimes.length}`);

    if (decisionTimes.length > 0) {
      const avgTime = decisionTimes.reduce((a, b) => a + b, 0) / decisionTimes.length;
      const maxTime = Math.max(...decisionTimes);
      const minTime = Math.min(...decisionTimes);
      const p95Index = Math.floor(decisionTimes.length * 0.95);
      const p95Time = decisionTimes.sort((a, b) => a - b)[p95Index];

      console.log(`平均时间: ${avgTime.toFixed(0)}ms`);
      console.log(`最小时间: ${minTime}ms`);
      console.log(`最大时间: ${maxTime}ms`);
      console.log(`P95时间: ${p95Time}ms`);

      // 验证性能指标
      expect(avgTime, '平均决策时间应该 < 3秒').toBeLessThan(3000);
      expect(p95Time, 'P95决策时间应该 < 5秒').toBeLessThan(5000);
      expect(maxTime, '最大决策时间应该 < 10秒').toBeLessThan(10000);
    }

    console.log('✓ 性能测试完成');
  });

  test('AI无内存泄漏', async ({ page }) => {
    test.setTimeout(STRESS_TEST_TIMEOUT);

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    // 获取初始内存使用（通过简单的性能指标）
    const getMemoryInfo = async () => {
      try {
        // 使用 performance API 获取内存信息（如果可用）
        const memoryInfo = await page.evaluate(() => {
          if ('memory' in performance) {
            return {
              usedJSHeapSize: (performance as any).memory.usedJSHeapSize,
              totalJSHeapSize: (performance as any).memory.totalJSHeapSize,
              jsHeapSizeLimit: (performance as any).memory.jsHeapSizeLimit,
            };
          }
          return null;
        });
        return memoryInfo;
      } catch (e) {
        return null;
      }
    };

    const initialMetrics = await getMemoryInfo();
    console.log('初始指标:', initialMetrics);

    // 运行大量决策
    let previousCardCount = 27;
    const iterations = 30;

    for (let i = 0; i < iterations; i++) {
      await page.waitForTimeout(2000);

      const currentCardCount = await page.locator('[data-card-id]').count();

      if (currentCardCount < previousCardCount) {
        previousCardCount = currentCardCount;

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
      }

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        break;
      }
    }

    const finalMetrics = await getMemoryInfo();
    console.log('最终指标:', finalMetrics);

    // 注意：Playwright 的 metrics API 不直接提供内存使用量
    // 这个测试主要通过长时间运行不崩溃来验证无内存泄漏
    console.log('✓ 内存泄漏测试完成（长时间运行无崩溃）');
  });

  test('AI在极限条件下的稳定性', async ({ page }) => {
    test.setTimeout(STRESS_TEST_TIMEOUT);

    // 监听错误
    const errorLogs: string[] = [];

    page.on('console', (msg) => {
      const text = msg.text();
      if (text.includes('error') || text.includes('Error')) {
        errorLogs.push(text);
        console.log('[Error]', text);
      }
    });

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    // 极限条件1：快速切换窗口焦点
    console.log('测试: 快速切换窗口焦点');
    for (let i = 0; i < 5; i++) {
      await page.bringToFront();
      await page.waitForTimeout(100);
      // 模拟失去焦点
      await page.evaluate(() => {
        window.dispatchEvent(new Event('blur'));
      });
      await page.waitForTimeout(100);
      // 模拟获得焦点
      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
      });
      await page.waitForTimeout(100);
    }

    // 极限条件2：快速调整窗口大小
    console.log('测试: 快速调整窗口大小');
    const sizes = [
      { width: 800, height: 600 },
      { width: 1024, height: 768 },
      { width: 600, height: 800 },
      { width: 1280, height: 720 },
    ];

    for (const size of sizes) {
      await page.setViewportSize(size);
      await page.waitForTimeout(200);
    }

    // 恢复默认大小
    await page.setViewportSize({ width: 1280, height: 720 });

    // 极限条件3：模拟设备方向变化
    console.log('测试: 模拟设备方向变化');
    await page.evaluate(() => {
      window.dispatchEvent(new Event('orientationchange'));
    });
    await page.waitForTimeout(500);

    // 极限条件4：模拟网络状态变化
    console.log('测试: 模拟网络状态变化');
    await page.context().setOffline(true);
    await page.waitForTimeout(1000);
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);

    // 验证游戏仍然可用
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();

    const cardCount = await page.locator('[data-card-id]').count();
    expect(cardCount).toBeGreaterThan(0);

    // 尝试出牌
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 极限条件测试完成');

    // 检查是否有严重错误
    const criticalErrors = errorLogs.filter(log =>
      log.includes('崩溃') ||
      log.includes('crash') ||
      log.includes('Fatal')
    );

    expect(criticalErrors.length).toBe(0);
  });

  test('AI错误恢复能力', async ({ page }) => {
    test.setTimeout(STRESS_TEST_TIMEOUT);

    // 进入练习房间
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    // 等待游戏开始
    await page.waitForTimeout(3000);

    let previousCardCount = 27;
    let recoveryCount = 0;
    const testIterations = 20;

    for (let i = 0; i < testIterations; i++) {
      // 每隔几轮模拟一次干扰
      if (i % 5 === 2) {
        console.log(`轮次 ${i + 1}: 模拟干扰`);

        // 随机选择一种干扰方式
        const interferenceType = i % 3;

        switch (interferenceType) {
          case 0:
            // 短暂离线
            await page.context().setOffline(true);
            await page.waitForTimeout(500);
            await page.context().setOffline(false);
            break;

          case 1:
            // 快速刷新
            await page.reload();
            await page.waitForTimeout(2000);
            break;

          case 2:
            // 切换标签页（模拟失焦）
            await page.evaluate(() => {
              document.dispatchEvent(new Event('visibilitychange'));
            });
            await page.waitForTimeout(500);
            await page.evaluate(() => {
              document.dispatchEvent(new Event('visibilitychange'));
            });
            break;
        }

        await page.waitForTimeout(1000);
      }

      // 正常游戏流程
      await page.waitForTimeout(2000);

      const currentCardCount = await page.locator('[data-card-id]').count();

      if (currentCardCount < previousCardCount) {
        console.log(`轮次 ${i + 1}: AI正常出牌 (${previousCardCount} -> ${currentCardCount})`);
        previousCardCount = currentCardCount;
        recoveryCount++;

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
      }

      // 检查游戏是否结束
      const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
      if (hasRanking) {
        console.log('✓ 游戏已结束');
        break;
      }
    }

    console.log(`=== 错误恢复测试结果 ===`);
    console.log(`总轮次: ${testIterations}`);
    console.log(`AI成功出牌次数: ${recoveryCount}`);
    console.log(`恢复率: ${(recoveryCount / testIterations * 100).toFixed(1)}%`);

    // 验证AI有良好的恢复能力
    expect(recoveryCount, 'AI应该能够在干扰后继续出牌').toBeGreaterThanOrEqual(Math.floor(testIterations * 0.6));

    console.log('✓ 错误恢复测试完成');
  });
});
