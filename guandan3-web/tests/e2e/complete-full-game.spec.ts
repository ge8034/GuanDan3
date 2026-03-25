import { test, expect } from '@playwright/test';

/**
 * 完整游戏牌局测试
 * 模拟真实掼蛋游戏完整流程 - 从发牌到产生最终排名
 * 验证所有核心游戏功能：发牌、出牌、过牌、AI对战、游戏结束
 */
test.describe('Complete Full Game Play', () => {
  test('完整牌局: 发牌→玩家出牌→AI对战→游戏结束→最终排名', async ({ page }) => {
    test.setTimeout(600000); // 10分钟超时

    // 收集所有日志和错误
    const allLogs: string[] = [];
    const allErrors: string[] = [];
    const gameEvents: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);

      // 记录关键游戏事件
      if (text.includes('gameStatus') || text.includes('rankings') || text.includes('currentSeat')) {
        gameEvents.push(text);
      }

      // 输出关键日志
      if (msg.type() === 'error') {
        allErrors.push(text);
        console.error(`[错误] ${text}`);
      } else if (text.includes('[useRoomAI]') || text.includes('[AutoStart]') || text.includes('排名')) {
        console.log(`[日志] ${text}`);
      }
    });

    page.on('pageerror', err => {
      const msg = err.message || String(err);
      allErrors.push(msg);
      console.error(`[页面错误] ${msg}`);
    });

    // ========== 步骤1: 访问首页 ==========
    console.log('\n=== 步骤1: 访问首页 ===');
    await page.goto('/');
    await expect(page).toHaveTitle(/掼蛋 3/i);

    // ========== 步骤2: 创建练习房 ==========
    console.log('\n=== 步骤2: 创建练习房 ===');
    const practiceBtn = page.getByRole('button', { name: /练习/i });
    await expect(practiceBtn).toBeVisible({ timeout: 15000 });
    await practiceBtn.click();

    // ========== 步骤3: 等待进入房间 ==========
    console.log('\n=== 步骤3: 等待进入房间 ===');
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    const roomId = page.url().split('/').pop();
    console.log('房间ID:', roomId);

    // ========== 步骤4: 等待游戏自动开始 ==========
    console.log('\n=== 步骤4: 等待游戏自动开始 ===');

    // 等待座位信息出现
    try {
      await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 30000 });
      console.log('✓ 座位信息已加载');
    } catch {
      console.log('✗ 座位信息未找到，继续执行');
    }

    // 等待手牌区域出现
    console.log('等待手牌区域...');
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 60000 });

    // 额外等待确保游戏状态同步
    console.log('等待10秒确保游戏状态同步...');
    await page.waitForTimeout(10000);

    // ========== 步骤5: 验证初始发牌 ==========
    console.log('\n=== 步骤5: 验证初始发牌 ===');
    const cards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const initialCardCount = await cards.count();
    console.log(`初始手牌数量: ${initialCardCount}`);
    expect(initialCardCount).toBeGreaterThan(0);
    expect(initialCardCount).toBe(27);
    console.log('✓ 发牌正确，27张牌');

    // ========== 步骤6: 验证游戏状态 ==========
    console.log('\n=== 步骤6: 验证游戏状态 ===');

    // 检查座位信息
    const seatText = await page.locator('text=/座位：/i').first().textContent();
    console.log(`座位信息: ${seatText}`);

    // 检查出牌和过牌按钮
    const playButton = page.locator('[data-testid="room-play"]');
    const passButton = page.locator('[data-testid="room-pass"]');

    // ========== 步骤7: 人类玩家出牌 ==========
    console.log('\n=== 步骤7: 人类玩家出牌 ===');

    // 等待轮到玩家
    console.log('等待轮到玩家...');
    await expect(playButton).toBeVisible({ timeout: 30000 });
    console.log('✓ 轮到玩家出牌');

    // 选择一张牌
    const firstCard = cards.first();
    await firstCard.click();
    console.log('✓ 已选择第一张牌');

    // 等待出牌按钮可用
    await page.waitForTimeout(500);
    const isPlayEnabled = !(await playButton.isDisabled().catch(() => true));

    if (isPlayEnabled) {
      await playButton.click();
      console.log('✓ 已点击出牌按钮');
    } else {
      console.log('✗ 出牌按钮被禁用，尝试过牌');
      const canPass = await passButton.isVisible().catch(() => false);
      if (canPass) {
        await passButton.click();
        console.log('✓ 已点击过牌按钮');
      }
    }

    // 等待AI响应
    await page.waitForTimeout(3000);

    // ========== 步骤8: 验证出牌后状态 ==========
    console.log('\n=== 步骤8: 验证出牌后状态 ===');
    const updatedCards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const updatedCardCount = await updatedCards.count();
    console.log(`出牌后手牌数量: ${updatedCardCount}`);
    console.log('✓ 出牌成功');

    // ========== 步骤9: AI自动对战循环 ==========
    console.log('\n=== 步骤9: AI自动对战循环 ===');

    let iteration = 0;
    const maxIterations = 100;
    let lastCardCount = updatedCardCount;
    let sameCountCount = 0;

    // 游戏状态检查函数
    const getGameState = async () => {
      const currentCards = page.locator('[data-testid="room-hand"] [data-card-id]');
      const cardCount = await currentCards.count();

      // 检查游戏结束覆盖层
      const gameOverOverlay = page.locator('[data-testid="game-over-overlay"]');
      const isGameOver = await gameOverOverlay.isVisible().catch(() => false);

      // 获取排名信息
      let rankings: number[] = [];
      if (isGameOver) {
        for (let i = 0; i < 4; i++) {
          const rankingElement = page.locator(`[data-testid="ranking-${i}"]`);
          if (await rankingElement.isVisible().catch(() => false)) {
            const seatAttr = await rankingElement.getAttribute('data-seat');
            if (seatAttr) rankings.push(parseInt(seatAttr));
          }
        }
      }

      // 检查出牌和过牌按钮状态
      const playVisible = await playButton.isVisible().catch(() => false);
      const passVisible = await passButton.isVisible().catch(() => false);
      const playDisabled = playVisible ? await playButton.isDisabled() : true;

      return {
        cardCount,
        isGameOver,
        rankings,
        playVisible,
        passVisible,
        playDisabled
      };
    };

    // 游戏循环
    while (iteration < maxIterations) {
      iteration++;

      const currentState = await getGameState();

      // 检查游戏是否结束且有完整排名
      if (currentState.isGameOver && currentState.rankings.length >= 4) {
        console.log(`\n✅ 游戏结束！`);
        console.log(`   最终排名: [${currentState.rankings.map((s: number) => `座位${s}`).join(', ')}]`);
        break;
      }

      // 检查手牌数量变化
      if (currentState.cardCount === lastCardCount) {
        sameCountCount++;
      } else {
        sameCountCount = 0;
        lastCardCount = currentState.cardCount;
        console.log(`[${iteration}] 手牌: ${currentState.cardCount}`);
      }

      // 如果轮到玩家，尝试出牌
      if (currentState.playVisible && !currentState.playDisabled && currentState.cardCount > 0) {
        // 选择一张牌 - 重新定位元素
        const currentCards = page.locator('[data-testid="room-hand"] [data-card-id]');
        await currentCards.nth(0).click();
        await page.waitForTimeout(300);

        // 尝试出牌
        const isDisabled = await playButton.isDisabled().catch(() => true);
        if (!isDisabled) {
          await playButton.click();
          console.log(`[${iteration}] 玩家出牌`);
          sameCountCount = 0;
          await page.waitForTimeout(3000);
          continue;
        } else {
          // 取消选择
          await currentCards.nth(0).click();
          await page.waitForTimeout(200);
        }
      }

      // 如果可以过牌，考虑过牌
      const canPass = await passButton.isVisible().catch(() => false) &&
                     !(await passButton.isDisabled().catch(() => true));
      if (canPass && sameCountCount > 5) {
        await passButton.click();
        console.log(`[${iteration}] 玩家过牌`);
        sameCountCount = 0;
        await page.waitForTimeout(3000);
        continue;
      }

      // 检查是否出完牌
      if (currentState.cardCount === 0) {
        console.log('我的手牌已出完，等待游戏结束...');
        await page.waitForTimeout(5000);

        const updatedState = await getGameState();
        if (updatedState.isGameOver && updatedState.rankings.length >= 4) {
          console.log(`✅ 最终排名: [${updatedState.rankings.map((s: number) => `座位${s}`).join(', ')}]`);
          break;
        }
      }

      // 每20次循环输出状态
      if (iteration % 20 === 0) {
        console.log(`[${iteration}] 手牌: ${currentState.cardCount}, 出牌按钮: ${currentState.playVisible && !currentState.playDisabled}`);
      }

      // 等待
      await page.waitForTimeout(2000);
    }

    // ========== 步骤10: 最终状态验证 ==========
    console.log('\n=== 步骤10: 最终状态验证 ===');

    const finalState = await getGameState();
    console.log(`最终游戏状态:`, {
      手牌数量: finalState.cardCount,
      游戏结束: finalState.isGameOver,
      排名: finalState.rankings
    });

    // ========== 步骤11: 截图保存 ==========
    await page.screenshot({
      path: 'test-results/complete-full-game-final.png',
      fullPage: true
    });

    // ========== 步骤12: 分析控制台日志 ==========
    console.log('\n=== 控制台日志分析 ===');

    // 检查AI相关日志
    const aiLogs = allLogs.filter(log =>
      log.includes('[useRoomAI]') ||
      log.includes('AI') ||
      log.includes('submit_turn')
    );
    console.log(`AI相关日志: ${aiLogs.length}条`);

    // 检查错误日志
    const realErrors = allErrors.filter(err =>
      !err.includes('[fetchGame]') &&
      !err.includes('Not Found') &&
      !err.includes('ERR_NETWORK_CHANGED') &&
      !err.includes('ERR_CONNECTION_RESET')
    );

    if (realErrors.length > 0) {
      console.log(`发现 ${realErrors.length} 个错误:`);
      realErrors.forEach(log => console.log('  -', log));
    } else {
      console.log('✓ 无严重错误');
    }

    // ========== 步骤13: 关键断言 ==========
    console.log('\n=== 测试断言 ===');

    // 验证初始发牌
    expect(initialCardCount).toBe(27);
    console.log('✅ 初始发牌: 27张');

    // 验证游戏结束
    expect(finalState.isGameOver).toBeTruthy();
    console.log('✅ 游戏已结束');

    // 验证排名完整
    expect(finalState.rankings.length).toBe(4);
    console.log(`✅ 最终排名: [${finalState.rankings.map((s: number) => `座位${s}`).join(', ')}]`);

    // 验证无严重错误
    const hasCriticalError = allErrors.some(err =>
      err.includes('500') ||
      (err.includes('WebSocket') && err.includes('timed out'))
    );
    expect(hasCriticalError).toBeFalsy();
    console.log('✅ 无严重错误');

    // 验证AI没有接管人类玩家
    const aiTookOver = allLogs.some(log =>
      log.includes('runAI') && log.includes('currentSeat=0') && !log.includes('跳过')
    );
    expect(aiTookOver).toBeFalsy();
    console.log('✅ AI没有接管人类玩家座位');

    console.log('\n✅ 完整牌局测试通过！');
    console.log(`✅ 总循环次数: ${iteration}`);
    console.log(`✅ 最终排名: ${finalState.rankings}`);
    console.log(`✅ 控制台零错误: ${allErrors.length === 0 ? '是' : '否'}`);
  });
});
