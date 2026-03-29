import { test, expect } from '@playwright/test';

/**
 * 完整游戏牌局测试
 * 模拟真实掼蛋游戏完整流程 - 直到产生排名
 */
test.describe('Complete Game Play', () => {
  test('完整牌局测试: 创建房间→自动发牌→AI对战→游戏结束→显示排名', async ({ page }) => {
    test.setTimeout(600000); // 10分钟超时

    // 收集所有日志和错误
    const allLogs: string[] = [];
    const allErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);
      // 输出所有日志以便调试
      if (msg.type() === 'error') {
        allErrors.push(text);
        console.error(`[控制台错误] ${text}`);
      } else if (text.includes('[useRoomAI]') || text.includes('[AI]')) {
        console.log(`[控制台日志] ${text}`);
      }
    });

    page.on('pageerror', err => {
      const msg = err.message || String(err);
      allErrors.push(msg);
      console.error(`[页面错误] ${msg}`);
    });

    // 1. 访问首页
    console.log('=== 步骤1: 访问首页 ===');
    await page.goto('http://localhost:3000');
    await expect(page).toHaveTitle(/掼蛋 3/i);

    // 2. 点击练习房按钮
    console.log('=== 步骤2: 创建练习房 ===');
    const practiceBtn = page.getByRole('button', { name: /练习/i });
    await expect(practiceBtn).toBeVisible({ timeout: 15000 });
    await practiceBtn.click();

    // 3. 等待进入房间
    console.log('=== 步骤3: 等待进入房间 ===');
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    const roomId = page.url().split('/').pop();
    console.log('房间ID:', roomId);

    // 4. 等待游戏自动开始
    console.log('=== 步骤4: 等待游戏自动开始 ===');

    // 等待"座位："文本出现（表示房间加载完成）
    console.log('等待"座位："文本出现...');
    try {
      await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 30000 });
      console.log('找到"座位："文本');
    } catch (e) {
      console.log('未找到"座位："文本，继续执行');
      // 继续执行，假设座位为0
    }

    // 等待手牌区域出现（游戏开始的标志）
    console.log('等待手牌区域出现...');
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 60000 });

    // 额外等待10秒确保游戏状态同步
    console.log('等待10秒确保游戏状态同步...');
    await page.waitForTimeout(10000);

    // 5. 验证初始手牌
    console.log('=== 步骤5: 验证初始手牌 ===');
    const cards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const cardCount = await cards.count();
    console.log(`初始手牌数量: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);

    // 6. 人类玩家出牌（启动游戏流程）
    console.log('=== 步骤6: 人类玩家出牌 ===');

    const playButton = page.locator('[data-testid="room-play"]');
    const passButton = page.locator('[data-testid="room-pass"]');

    // 检查过牌按钮是否可用
    const canPass = await passButton.isVisible().catch(() => false) &&
                   !(await passButton.isDisabled().catch(() => true));

    if (canPass) {
      console.log('过牌按钮可用，点击过牌');
      await passButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('过牌按钮不可用，尝试出牌');

      // 点击第一张牌
      const firstCard = cards.first();
      await firstCard.click();
      console.log('已点击第一张牌');

      // 等待出牌按钮可用
      await expect(playButton).toBeVisible({ timeout: 10000 });

      // 检查出牌按钮是否可用（可能仍被禁用）
      const isPlayEnabled = !(await playButton.isDisabled().catch(() => true));
      if (isPlayEnabled) {
        await playButton.click();
        console.log('已点击出牌按钮');
      } else {
        console.log('出牌按钮被禁用，尝试点击第二张牌');
        // 尝试点击另一张牌
        const secondCard = cards.nth(1);
        if (await secondCard.isVisible().catch(() => false)) {
          await secondCard.click();
          await page.waitForTimeout(500);
          // 再次尝试出牌按钮
          if (!(await playButton.isDisabled().catch(() => true))) {
            await playButton.click();
            console.log('已点击出牌按钮（点击第二张牌后）');
          } else {
            console.log('出牌按钮仍被禁用，无法出牌');
          }
        }
      }

      // 等待出牌完成
      await page.waitForTimeout(2000);
    }

    console.log('人类玩家行动完成');

    // 获取游戏状态的函数 - 使用DOM
    const getGameStateFromDOM = async () => {
      // 我的手牌数量
      const myCardCount = await cards.count();

      // 检查游戏是否结束
      const gameOverOverlay = page.locator('[data-testid="game-over-overlay"]');
      const isGameOver = await gameOverOverlay.isVisible().catch(() => false);

      // 获取排名
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
      const playButton = page.locator('[data-testid="room-play"]');
      const passButton = page.locator('[data-testid="room-pass"]');
      const playVisible = await playButton.isVisible().catch(() => false);
      const passVisible = await passButton.isVisible().catch(() => false);
      const playDisabled = playVisible ? await playButton.isDisabled() : true;
      const passDisabled = passVisible ? await passButton.isDisabled() : true;

      // 获取当前座位信息（从页面文本）
      const seatText = await page.locator('text=/座位：/i').first().textContent().catch(() => '');
      const mySeatMatch = seatText?.match(/座位：(\d)/);
      const mySeat = mySeatMatch ? parseInt(mySeatMatch[1]) : -1;

      // 检查当前轮到谁（通过玩家头像的激活状态）
      let currentActiveSeat = -1;
      for (let i = 0; i < 4; i++) {
        const avatar = page.locator(`[data-testid="player-seat-${i}"]`);
        if (await avatar.isVisible().catch(() => false)) {
          const classList = await avatar.getAttribute('class') || '';
          // 检查是否有激活状态的类（如 border-yellow-400, ring 等）
          if (classList.includes('ring') || classList.includes('border-yellow') || classList.includes('ring-2')) {
            currentActiveSeat = i;
            break;
          }
        }
      }

      return {
        myCardCount,
        isGameOver,
        rankings,
        playVisible,
        passVisible,
        playDisabled,
        passDisabled,
        mySeat,
        currentActiveSeat
      };
    };

    // 6. 游戏循环 - 等待游戏结束
    console.log('=== 步骤6: 开始游戏循环 ===');

    let iteration = 0;
    const maxIterations = 500;
    let lastCardCount = cardCount;
    let sameCountCount = 0;

    while (iteration < maxIterations) {
      iteration++;

      const currentState = await getGameStateFromDOM();

      // 检查游戏是否结束且有完整排名
      if (currentState.isGameOver && currentState.rankings.length >= 4) {
        console.log(`\n✅ 游戏结束！`);
        console.log(`   最终排名: [${currentState.rankings.map((s: number) => `座位${s}`).join(', ')}]`);
        break;
      }

      // 检查手牌数量变化
      if (currentState.myCardCount === lastCardCount) {
        sameCountCount++;
      } else {
        sameCountCount = 0;
        lastCardCount = currentState.myCardCount;
        console.log(`[${iteration}] 座位${currentState.mySeat}→${currentState.currentActiveSeat}, 手牌: ${currentState.myCardCount}`);
      }

      // 优先尝试出牌：先选牌，再检查按钮是否可用
      if (currentState.playVisible && currentState.myCardCount > 0) {
        // 先选一张牌
        await cards.nth(0).click();
        await page.waitForTimeout(300);

        // 检查按钮是否可用
        const playBtn = page.locator('[data-testid="room-play"]');
        const isDisabled = await playBtn.isDisabled().catch(() => true);

        if (!isDisabled) {
          await playBtn.click();
          console.log(`[${iteration}] 出牌 1 张`);
          sameCountCount = 0;
          await page.waitForTimeout(10000);
          continue;
        } else {
          // 取消选择
          await cards.nth(0).click();
          await page.waitForTimeout(200);
        }
      }

      // 如果可以过牌（且不是第一个出牌的），考虑过牌
      if (currentState.passVisible && !currentState.passDisabled && sameCountCount > 15) {
        await page.locator('[data-testid="room-pass"]').click();
        console.log(`[${iteration}] 过牌`);
        sameCountCount = 0;
        await page.waitForTimeout(10000);
        continue;
      }

      // 检查是否出完牌
      if (currentState.myCardCount === 0) {
        console.log('我的手牌已出完，等待游戏结束...');
        await page.waitForTimeout(10000);

        const updatedState = await getGameStateFromDOM();
        if (updatedState.isGameOver && updatedState.rankings.length >= 4) {
          console.log(`✅ 最终排名: [${updatedState.rankings.map((s: number) => `座位${s}`).join(', ')}]`);
          break;
        }
      }

      // 每隔50次循环输出状态
      if (iteration % 50 === 0) {
        console.log(`[${iteration}] 我的座位: ${currentState.mySeat}, 当前活跃: ${currentState.currentActiveSeat}, 手牌: ${currentState.myCardCount}, 出牌: ${currentState.playVisible && !currentState.playDisabled}`);
      }

      // 等待
      await page.waitForTimeout(2000);
    }

    // 7. 最终状态验证
    console.log('\n=== 步骤7: 最终状态验证 ===');
    const finalState = await getGameStateFromDOM();
    console.log(`最终游戏状态:`, JSON.stringify(finalState));

    // 8. 截图保存
    await page.screenshot({
      path: 'test-results/full-gameplay-final.png',
      fullPage: true
    });

    // 9. 分析控制台日志
    console.log('\n=== 控制台日志分析 ===');
    const errorLogs = allLogs.filter(log =>
      log.includes('error') ||
      log.includes('Error') ||
      log.includes('failed')
    );

    const realErrors = errorLogs.filter(log =>
      !log.includes('[fetchGame]') &&
      !log.includes('Not Found') &&
      !log.includes('ERR_NETWORK_CHANGED') &&
      !log.includes('ERR_CONNECTION_RESET')
    );

    if (realErrors.length > 0) {
      console.log(`发现 ${realErrors.length} 个真实错误:`);
      realErrors.forEach(log => console.log('  -', log));
    }

    // 检查AI相关日志
    const aiLogs = allLogs.filter(log =>
      log.includes('AI') ||
      log.includes('ai') ||
      log.includes('Agent') ||
      log.includes('决策') ||
      log.includes('submit_turn')
    );

    if (aiLogs.length > 0) {
      console.log(`\n发现 ${aiLogs.length} 条AI相关日志:`);
      aiLogs.slice(-10).forEach(log => console.log('  -', log));
    }

    // 10. 关键断言
    console.log('\n=== 测试断言 ===');

    // 验证游戏结束
    expect(finalState.isGameOver).toBeTruthy();
    console.log(`✅ 游戏已结束`);

    // 验证排名完整
    expect(finalState.rankings.length).toBe(4);
    console.log(`✅ 最终排名: [${finalState.rankings.map((s: number) => `座位${s}`).join(', ')}]`);

    // 验证无严重错误
    const hasCriticalError = allErrors.some(err =>
      err.includes('500') ||
      (err.includes('WebSocket') && err.includes('timed out'))
    );
    expect(hasCriticalError).toBeFalsy();

    console.log('\n✅ 完整牌局测试完成！');
    console.log(`✅ 总循环次数: ${iteration}`);
    console.log(`✅ 最终排名: ${finalState.rankings}`);
  });
});
