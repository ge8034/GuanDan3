/**
 * 人类出牌按钮检查测试
 * 目的：检查练习模式中人类玩家是否能看到出牌按钮
 */

import { test, expect } from '@playwright/test';

test.describe('人类出牌按钮检查', () => {
  test('检查练习模式中人类玩家是否有出牌按钮', async ({ page }) => {
    console.log('\n=== 步骤1：访问首页 ===');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('\n=== 步骤2：点击练习模式 ===');
    const practiceButton = page.locator('button').filter({ hasText: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(5000);

    console.log('\n=== 步骤3：点击开始游戏 ===');
    const startButton = page.locator('button').filter({ hasText: /开始游戏|开始/i }).first();
    await startButton.click();
    await page.waitForTimeout(8000);

    console.log('\n=== 步骤4：检查出牌按钮 ===');
    // 检查出牌按钮是否存在且可见
    const playButton = page.locator('button').filter({ hasText: /出牌/i }).first();
    const isPlayButtonVisible = await playButton.isVisible().catch(() => false);

    console.log(`出牌按钮可见: ${isPlayButtonVisible}`);

    // 检查过牌按钮
    const passButton = page.locator('button').filter({ hasText: /过牌/i }).first();
    const isPassButtonVisible = await passButton.isVisible().catch(() => false);

    console.log(`过牌按钮可见: ${isPassButtonVisible}`);

    // 检查游戏元素
    const gameElements = page.locator('[class*="game"], [class*="card"], [class*="hand"]');
    const gameCount = await gameElements.count();
    console.log(`游戏相关元素数量: ${gameCount}`);

    // 截图
    await page.screenshot({ path: 'human-play-button-check.png' });
    console.log('截图已保存到 human-play-button-check.png');

    console.log('\n=== 分析 ===');
    if (!isPlayButtonVisible && !isPassButtonVisible) {
      console.log('⚠️ 问题：人类玩家没有出牌/过牌按钮！');
      console.log('可能原因：');
      console.log('1. isMyTurn计算错误');
      console.log('2. 练习模式UI设计问题（应该隐藏按钮让AI自动玩）');
      console.log('3. 游戏状态未正确同步');
    } else {
      console.log('✓ 人类玩家有出牌按钮');
    }

    // 等待一段时间看按钮是否出现
    await page.waitForTimeout(5000);

    const playButtonAfterWait = page.locator('button').filter({ hasText: /出牌/i }).first();
    const isPlayButtonVisibleAfter = await playButtonAfterWait.isVisible().catch(() => false);

    console.log(`5秒后出牌按钮可见: ${isPlayButtonVisibleAfter}`);
  });
});
