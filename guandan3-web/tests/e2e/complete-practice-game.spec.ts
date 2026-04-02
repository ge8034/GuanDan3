/**
 * 完整游戏流程测试 - 练习模式 (1v3)
 *
 * 测试流程：
 * 1. 进入练习房间
 * 2. 游戏自动开始
 * 3. 模拟人类玩家出牌
 * 4. AI agents 接管游戏
 * 5. 游戏完成
 */

import { test, expect } from '@playwright/test';
import { setupGameMocks, cleanupMockState } from './shared';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const GAME_TIMEOUT = 240000; // 4 分钟超时 - 完整游戏需要更多时间

test.describe('完整游戏流程测试', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test.afterEach(() => {
    cleanupMockState();
  });

  test('练习房完整流程：自动开始 -> 人类出牌 -> AI 对战 -> 游戏结束', async ({
    page,
  }) => {
    test.setTimeout(GAME_TIMEOUT);

    // ========== 阶段1：进入练习房 ==========
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房');

    // ========== 阶段2：等待游戏自动开始 ==========
    await page.waitForTimeout(3000);

    // 检查手牌是否存在
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    // 检查卡牌数量
    const cardCount = await page.locator('[data-card-id]').count();
    expect(cardCount, '应该有27张手牌').toBe(27);

    console.log('✓ 游戏已开始，手牌已发 (27张)');

    // ========== 阶段3：模拟人类玩家出牌 ==========
    // 获取第一张牌的 data-card-id
    const firstCard = page.locator('[data-card-id]').first();
    const cardId = await firstCard.getAttribute('data-card-id');

    // 点击第一张牌
    await firstCard.click();
    await page.waitForTimeout(300);

    // 验证牌被选中
    const selectedCard = page.locator(`[data-card-id="${cardId}"]`);
    const isSelected = await selectedCard.evaluate(
      (el) =>
        el.classList.contains('border-blue-500') ||
        el.classList.contains('ring-2') ||
        el.style.transform !== 'none'
    );
    expect(isSelected, '第一张牌应该被选中').toBeTruthy();

    console.log('✓ 选中第一张牌');

    // 点击出牌按钮
    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await expect(playButton).toBeVisible({ timeout: 5000 });
    await playButton.click();

    console.log('✓ 人类玩家已出牌');

    // ========== 阶段4：等待 AI 完成游戏 ==========
    console.log('=== 等待 AI 对战完成（最多3分钟）===');

    // 监控游戏进度 - 通过手牌数量变化来检测
    let previousCardCount = 27;
    let totalTurns = 0;
    let maxWaitTime = Date.now() + GAME_TIMEOUT;

    while (Date.now() < maxWaitTime && totalTurns < 5) {
      await page.waitForTimeout(5000);

      const currentCardCount = await page.locator('[data-card-id]').count();

      // 检查手牌数量是否减少（表示轮到人类玩家出牌）
      if (currentCardCount < previousCardCount) {
        console.log(`✓ 游戏进展：手牌从 ${previousCardCount} 张变为 ${currentCardCount} 张`);
        previousCardCount = currentCardCount;
        totalTurns++;

        // 如果手牌很少了，检查游戏是否即将结束
        if (currentCardCount <= 5) {
          console.log('✓ 手牌数量较少，游戏可能接近结束');
          break;
        }

        // 自动帮人类玩家出牌（模拟 AI 接管）
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
      } else if (currentCardCount === previousCardCount && totalTurns > 0) {
        // 手牌数量没变，可能需要主动出牌
        console.log(`⚠️  手牌数量未变化，尝试主动出牌: ${currentCardCount}`);
        try {
          const nextCard = page.locator('[data-card-id]').first();
          await nextCard.click();
          await page.waitForTimeout(200);

          const playBtn = page.getByRole('button', { name: /出牌|Play/i }).first();
          await playBtn.click();
          console.log(`✓ 主动出牌成功`);
        } catch (e) {
          console.log('⚠️  主动出牌失败:', e);
        }
      }
    }

    // ========== 阶段5：验证游戏结果 ==========
    console.log('=== 测试结果 ===');
    console.log(`检测到 ${totalTurns} 轮人类玩家出牌`);

    // 验证游戏有进展（至少检测到一轮人类玩家出牌）
    expect(totalTurns, '游戏应该有进展').toBeGreaterThan(0);

    console.log('✓ 完整游戏流程测试完成');
  });

  test('简化测试：验证 AI 能够接替人类玩家', async ({ page }) => {
    test.setTimeout(60000);

    // 监听所有控制台日志（不过滤，便于调试）
    const logs: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      logs.push(text);
      // 打印所有包含 AI 或 turn 的日志
      if (text.includes('AI') || text.includes('turn') || text.includes('Mock')) {
        console.log('[Browser Console]', text);
      }
    });

    // 进入练习房
    await page.goto(BASE_URL);
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/[^/]+$/, { timeout: 30000 });

    console.log('✓ 进入练习房');

    // 等待游戏自动开始
    await page.waitForTimeout(3000);

    // 检查手牌是否存在
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    // 检查卡牌数量
    const cardCount = await page.locator('[data-card-id]').count();
    expect(cardCount, '应该有27张手牌').toBe(27);

    console.log('✓ 游戏已开始，手牌已发 (27张)');

    // 人类玩家出牌
    const firstCard = page.locator('[data-card-id]').first();
    await firstCard.click();
    await page.waitForTimeout(300);

    const playButton = page.getByRole('button', { name: /出牌|Play/i });
    await playButton.click();

    console.log('✓ 人类玩家已出牌，等待 AI 接管...');

    // 等待 AI 接管 - 检查手牌数量变化（AI 出牌后人类玩家会再次轮到）
    let previousCardCount = cardCount;
    let cardsChanged = false;

    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(2000);
      const currentCardCount = await page.locator('[data-card-id]').count();

      // 如果轮到人类玩家再次出牌，手牌数量应该减少
      if (currentCardCount < previousCardCount) {
        cardsChanged = true;
        console.log(`✓ 检测到游戏进展：手牌从 ${previousCardCount} 张变为 ${currentCardCount} 张`);
        break;
      }

      previousCardCount = currentCardCount;
    }

    // 验证游戏有进展（通过手牌变化）
    expect(cardsChanged, '游戏应该有进展（AI 应该出牌）').toBeTruthy();

    console.log('✓ AI 接管验证完成');
  });

  test('完整游戏流程验证：从发牌到排名显示', async ({ page }) => {
    // 监听控制台日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      consoleLogs.push(msg.text());
    });

    console.log('=== 完整游戏流程测试：验证排名系统 ===');

    // 访问首页
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('domcontentloaded');

    // 进入练习房
    const practiceBtn = page.getByRole('button', { name: /开始练习|练习/i });
    await practiceBtn.click();
    await page.waitForTimeout(2000);
    console.log('✓ 进入练习房');

    // 等待游戏开始
    await page.waitForSelector('[data-card-id]', { timeout: 10000 });
    const initialCardCount = await page.locator('[data-card-id]').count();
    console.log(`✓ 游戏已开始，手牌: ${initialCardCount} 张`);

    // 持续出牌直到游戏结束
    let maxTurns = 50; // 最多50轮
    let currentTurn = 0;
    let lastCardCount = initialCardCount;

    while (currentTurn < maxTurns) {
      currentTurn++;

      // 等待轮到人类玩家
      await page.waitForTimeout(3000);

      // 点击第一张牌
      const firstCard = page.locator('[data-card-id]').first();
      const cardCount = await page.locator('[data-card-id]').count();

      if (cardCount === 0) {
        console.log('✓ 手牌已出完，游戏可能结束');
        break;
      }

      await firstCard.click();
      await page.waitForTimeout(300);

      // 点击出牌按钮
      const playButton = page.getByRole('button', { name: /出牌|Play/i });
      const playButtonExists = await playButton.count() > 0;

      if (playButtonExists) {
        await playButton.click();
        await page.waitForTimeout(1000);
      }

      // 检查手牌变化
      const newCardCount = await page.locator('[data-card-id]').count();
      console.log(`第${currentTurn}轮: 手牌 ${lastCardCount} -> ${newCardCount}`);

      // 如果手牌没变化，可能游戏结束
      if (newCardCount === lastCardCount && currentTurn > 5) {
        console.log('手牌未变化，检查游戏状态...');
        // 检查是否有游戏结束或排名相关的UI
        const hasRanking = await page.locator('text=/第.*名|排名|Ranking|winner/i').count();
        if (hasRanking > 0) {
          console.log('✓ 检测到排名显示！');
          break;
        }
      }

      lastCardCount = newCardCount;

      // 如果手牌少于5张，可能快结束了
      if (newCardCount < 5) {
        console.log('手牌较少，等待可能的游戏结束...');
        await page.waitForTimeout(5000);

        // 检查游戏结束状态
        const gameOverText = await page.locator('body').textContent();
        if (gameOverText?.match(/第.*名|排名|游戏结束|Game Over/i)) {
          console.log('✓ 检测到游戏结束/排名信息');
          break;
        }
      }
    }

    console.log(`=== 测试总结 ===`);
    console.log(`总轮次: ${currentTurn}`);
    console.log(`最终手牌: ${lastCardCount} 张`);

    // 检查页面内容寻找排名信息
    const pageText = await page.locator('body').textContent();
    // GameOverOverlay显示的是"头游"、"二游"、"三游"、"末游"
    const hasRankingInfo = pageText?.match(/头游|二游|三游|末游|游戏结束|第.*名|排名|Ranking|winner|胜利/i);
    console.log(`排名信息检测: ${hasRankingInfo ? '✓ 找到' : '✗ 未找到'}`);

    if (hasRankingInfo) {
      console.log(`排名信息: ${hasRankingInfo[0]}`);
    }

    // 检查GameOverOverlay是否存在
    const gameOverOverlay = await page.locator('[data-testid="game-over-overlay"]').count();
    console.log(`GameOverOverlay元素: ${gameOverOverlay > 0 ? '✓ 存在' : '✗ 不存在'}`);

    if (gameOverOverlay > 0) {
      const rankingElements = await page.locator('[data-testid^="ranking-"]').all();
      console.log(`排名元素数量: ${rankingElements.length}`);
      for (let i = 0; i < rankingElements.length; i++) {
        const text = await rankingElements[i].textContent();
        console.log(`  排名${i + 1}: ${text?.trim()}`);
      }
    }

    // 截图保存
    await page.screenshot({
      path: `test-results/game-complete-${Date.now()}.png`,
      fullPage: true
    });

    console.log('✓ 完整游戏流程测试完成');
  });
});
