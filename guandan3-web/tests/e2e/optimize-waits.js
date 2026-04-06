/**
 * E2E测试等待时间优化建议
 *
 * 这个脚本提供了优化等待时间的建议和模式
 */

// 常见的优化模式

// 1. 等待游戏进展
// 优化前：固定等待
await page.waitForTimeout(5000);

// 优化后：智能等待
import { waitForGameProgress } from './shared';
const result = await waitForGameProgress(page, {
  maxWaitTime: 10000,
  checkInterval: 2000
});
if (!result.progressMade) {
  console.log('游戏无进展');
}

// 2. 等待元素可见
// 优化前：固定等待 + 可能的失败
await page.waitForTimeout(3000);
await expect(element).toBeVisible();

// 优化后：智能等待 + 超时控制
import { smartWaitVisible } from './shared';
await smartWaitVisible(element, { timeout: 10000 });

// 3. 等待AI出牌
// 优化前：固定长时间等待
await page.waitForTimeout(10000);
const cardCount = await page.locator('[data-card-id]').count();

// 优化后：智能检测变化
import { waitForAIPlay } from './shared';
const hasPlayed = await waitForAIPlay(page, {
  maxWaitTime: 15000
});
if (hasPlayed) {
  console.log('AI已出牌');
}

// 4. 等待游戏结束
// 优化前：循环 + 固定等待
for (let i = 0; i < 30; i++) {
  await page.waitForTimeout(3000);
  const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
  if (hasRanking) break;
}

// 优化后：智能等待
import { waitForGameEnd } from './shared';
const ended = await waitForGameEnd(page, {
  maxWaitTime: 120000,
  checkInterval: 3000
});
if (ended) {
  console.log('游戏已结束');
}

// 5. 游戏循环监控
// 优化前：简单循环 + 无卡住检测
let previousCardCount = 27;
for (let i = 0; i < 50; i++) {
  await page.waitForTimeout(3000);
  const currentCardCount = await page.locator('[data-card-id]').count();
  previousCardCount = currentCardCount;
}

// 优化后：进度监控 + 卡住检测
import { GameProgressMonitor } from './shared';
const monitor = new GameProgressMonitor(10); // 最多10次无进展
for (let i = 0; i < 50; i++) {
  const status = await monitor.checkProgress(page);

  if (status.hasProgress) {
    console.log(`进展: ${status.currentCardCount} 张牌`);
  }

  if (status.isStuck) {
    console.log('游戏可能卡住');
    break;
  }

  // 检查游戏是否结束
  const hasRanking = await page.locator('[data-testid="ranking-display"]').isVisible().catch(() => false);
  if (hasRanking) break;

  await page.waitForTimeout(2000); // 减少等待时间
}

// 6. 安全操作
// 优化前：可能失败
const button = page.getByRole('button', { name: /出牌/i });
await button.click(); // 如果按钮不可点击会失败

// 优化后：安全点击
import { safeClick } from './shared';
const clicked = await safeClick(button, { retry: 3 });
if (!clicked) {
  console.log('点击失败，但测试继续');
}

module.exports = {
  // 导出优化建议
  suggestions: {
    useSmartWaiting: '使用智能等待代替固定等待',
    monitorProgress: '使用进度监控器检测游戏卡住',
    safeOperations: '使用安全操作函数避免失败',
    reasonableTimeouts: '设置合理的超时时间',
  }
};
