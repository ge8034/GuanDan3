import { test, expect } from '@playwright/test';

/**
 * 完整游戏流程测试（修复版）
 * 验证人类玩家可以正常参与游戏，AI不会接管
 */
test.describe('Complete Game Flow (Fixed)', () => {
  test('人类玩家参与游戏 - 出牌流程验证', async ({ page }) => {
    test.setTimeout(300000); // 5分钟超时

    // 收集所有日志
    const allLogs: string[] = [];
    const allErrors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      allLogs.push(text);

      // 输出关键日志
      if (msg.type() === 'error') {
        allErrors.push(text);
        console.error(`[控制台错误] ${text}`);
      } else if (text.includes('[useRoomAI]') || text.includes('[AutoStart]')) {
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

    // 4. 等待手牌加载
    console.log('=== 步骤4: 等待手牌加载 ===');
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 60000 });

    // 额外等待确保游戏状态同步
    console.log('等待10秒确保游戏状态同步...');
    await page.waitForTimeout(10000);

    // 5. 验证初始手牌
    console.log('=== 步骤5: 验证初始手牌 ===');
    const cards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const initialCardCount = await cards.count();
    console.log(`初始手牌数量: ${initialCardCount}`);

    // 如果手牌数量仍为0，等待更长时间
    if (initialCardCount === 0) {
      console.log('手牌数量为0，等待15秒后重新检查...');
      await page.waitForTimeout(15000);
      const retryCardCount = await cards.count();
      console.log(`重试后手牌数量: ${retryCardCount}`);
      expect(retryCardCount).toBeGreaterThan(0);
    } else {
      expect(initialCardCount).toBe(27);
    }

    // 6. 检查出牌和过牌按钮
    console.log('=== 步骤6: 检查出牌和过牌按钮 ===');
    const playButton = page.locator('[data-testid="room-play"]');
    const passButton = page.locator('[data-testid="room-pass"]');

    // 等待轮到玩家
    console.log('=== 步骤7: 等待轮到玩家 ===');
    await expect(playButton).toBeVisible({ timeout: 30000 });

    // 7. 玩家出牌
    console.log('=== 步骤8: 玩家出牌 ===');

    // 点击第一张牌
    const firstCard = cards.first();
    await firstCard.click();
    console.log('已点击第一张牌');

    // 等待出牌按钮可用
    await page.waitForTimeout(500);
    const isPlayEnabled = !(await playButton.isDisabled().catch(() => true));

    if (isPlayEnabled) {
      await playButton.click();
      console.log('已点击出牌按钮');
    } else {
      console.log('出牌按钮被禁用，可能无法出此牌');
    }

    // 8. 等待AI响应
    console.log('=== 步骤9: 等待AI响应 ===');
    await page.waitForTimeout(5000);

    // 9. 再次检查手牌
    console.log('=== 步骤10: 再次检查手牌 ===');
    const updatedCards = page.locator('[data-testid="room-hand"] [data-card-id]');
    const updatedCardCount = await updatedCards.count();
    console.log(`出牌后手牌数量: ${updatedCardCount}`);
    expect(updatedCardCount).toBeLessThan(initialCardCount);

    // 10. 验证游戏状态
    console.log('=== 步骤11: 验证游戏状态 ===');

    // 检查座位信息
    const seatText = await page.locator('text=/座位：/i').first().textContent();
    console.log(`座位信息: ${seatText}`);

    // 11. 截图
    await page.screenshot({
      path: 'test-results/complete-game-flow-fixed.png',
      fullPage: true
    });

    // 12. 分析日志
    console.log('\n=== 控制台日志分析 ===');

    // 验证AI没有接管人类玩家座位
    const aiTakeoverLogs = allLogs.filter(log =>
      log.includes('当前座位不是AI成员') ||
      log.includes('member_type=human')
    );

    console.log(`AI跳过人类玩家座位的日志数量: ${aiTakeoverLogs.length}`);
    aiTakeoverLogs.forEach(log => console.log('  ', log));

    // 13. 关键断言
    console.log('\n=== 测试断言 ===');

    // 验证手牌数量
    expect(initialCardCount).toBe(27);
    console.log(`✅ 初始手牌数量正确: ${initialCardCount}`);

    // 验证出牌后手牌减少
    expect(updatedCardCount).toBeLessThan(initialCardCount);
    console.log(`✅ 出牌后手牌数量减少: ${initialCardCount} → ${updatedCardCount}`);

    // 验证无严重错误
    const hasCriticalError = allErrors.some(err =>
      err.includes('500') ||
      (err.includes('WebSocket') && err.includes('timed out'))
    );
    expect(hasCriticalError).toBeFalsy();
    console.log('✅ 无严重错误');

    // 验证AI没有接管人类玩家座位
    const aiTookOver = allLogs.some(log =>
      log.includes('runAI') && log.includes('currentSeat=0') && !log.includes('跳过')
    );
    expect(aiTookOver).toBeFalsy();
    console.log('✅ AI没有接管人类玩家座位');

    console.log('\n✅ 完整游戏流程测试通过！');
    console.log(`✅ 初始手牌: ${initialCardCount}`);
    console.log(`✅ 出牌后手牌: ${updatedCardCount}`);
    console.log(`✅ 出牌数量: ${initialCardCount - updatedCardCount}`);
  });

  test('游戏完整流程 - 多轮出牌验证', async ({ page }) => {
    test.setTimeout(300000); // 5分钟超时

    // 收集错误日志
    const allErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        allErrors.push(msg.text());
      }
    });
    page.on('pageerror', err => {
      allErrors.push(err.message || String(err));
    });

    // 1. 创建练习房
    await page.goto('http://localhost:3000');
    const practiceBtn = page.getByRole('button', { name: /练习/i });
    await practiceBtn.click();

    // 2. 等待进入房间
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });

    // 3. 等待手牌加载
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 60000 });

    // 额外等待确保游戏状态同步
    console.log('等待10秒确保游戏状态同步...');
    await page.waitForTimeout(10000);

    const cards = page.locator('[data-testid="room-hand"] [data-card-id]');
    let initialCardCount = await cards.count();
    console.log(`初始手牌数量: ${initialCardCount}`);

    // 如果手牌数量仍为0，等待更长时间
    if (initialCardCount === 0) {
      console.log('手牌数量为0，等待15秒后重新检查...');
      await page.waitForTimeout(15000);
      initialCardCount = await cards.count();
      console.log(`重试后手牌数量: ${initialCardCount}`);
    }

    expect(initialCardCount).toBe(27);

    // 4. 进行多轮出牌
    const playButton = page.locator('[data-testid="room-play"]');
    const passButton = page.locator('[data-testid="room-pass"]');

    let rounds = 0;
    const maxRounds = 10;
    let previousCardCount = initialCardCount;

    while (rounds < maxRounds) {
      rounds++;

      // 等待轮到玩家
      try {
        await expect(playButton).toBeVisible({ timeout: 30000 });
      } catch {
        console.log('出牌按钮不可见，可能游戏结束');
        break;
      }

      // 检查手牌数量
      const currentCardCount = await cards.count();
      console.log(`第${rounds}轮: 当前手牌数量 = ${currentCardCount}`);

      if (currentCardCount === 0) {
        console.log('手牌已出完，游戏结束');
        break;
      }

      // 尝试出牌或过牌
      const canPass = await passButton.isVisible().catch(() => false) &&
                     !(await passButton.isDisabled().catch(() => true));

      if (canPass) {
        console.log(`第${rounds}轮: 选择过牌`);
        await passButton.click();
        await page.waitForTimeout(3000);
      } else {
        console.log(`第${rounds}轮: 尝试出牌`);
        // 点击第一张牌
        await cards.first().click();
        await page.waitForTimeout(500);

        const isPlayEnabled = !(await playButton.isDisabled().catch(() => true));
        if (isPlayEnabled) {
          await playButton.click();
          console.log(`第${rounds}轮: 出牌成功`);
          await page.waitForTimeout(3000);
        } else {
          console.log(`第${rounds}轮: 出牌按钮被禁用，取消选择`);
          await cards.first().click();
          await page.waitForTimeout(500);
        }
      }

      // 检查手牌数量是否变化
      const newCardCount = await cards.count();
      if (newCardCount !== previousCardCount) {
        console.log(`第${rounds}轮: 手牌数量变化 ${previousCardCount} → ${newCardCount}`);
        previousCardCount = newCardCount;
      }
    }

    // 5. 最终状态验证
    const finalCardCount = await cards.count();
    console.log(`\n最终手牌数量: ${finalCardCount}`);
    console.log(`完成轮数: ${rounds}`);

    // 6. 截图
    await page.screenshot({
      path: 'test-results/complete-game-flow-multi-round.png',
      fullPage: true
    });

    // 7. 验证无严重错误
    const hasCriticalError = allErrors.some(err =>
      err.includes('500') ||
      (err.includes('WebSocket') && err.includes('timed out'))
    );
    expect(hasCriticalError).toBeFalsy();

    console.log('\n✅ 多轮出牌测试完成！');
    console.log(`✅ 完成轮数: ${rounds}`);
    console.log(`✅ 最终手牌: ${finalCardCount}`);
  });
});
