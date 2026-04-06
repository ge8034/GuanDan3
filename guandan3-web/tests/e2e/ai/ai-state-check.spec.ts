/**
 * AI状态检查测试
 * 目的：检查游戏状态、members、isOwner等关键值
 */

import { test, expect } from '@playwright/test';

test.describe('AI状态检查', () => {
  test('检查AI出牌前的所有状态', async ({ page }) => {
    console.log('\n=== 步骤1：访问首页 ===');
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(2000);

    console.log('\n=== 步骤2：点击练习模式 ===');
    const practiceButton = page.locator('button').filter({ hasText: /练习模式|开始练习/i }).first();
    await practiceButton.click();
    await page.waitForTimeout(3000);

    console.log('\n=== 步骤3：点击开始游戏 ===');
    const startButton = page.locator('button').filter({ hasText: /开始游戏|开始/i }).first();
    await startButton.click();
    await page.waitForTimeout(5000);

    console.log('\n=== 步骤4：检查游戏状态（通过浏览器执行）===');

    // 检查游戏状态
    const gameState = await page.evaluate(() => {
      // @ts-ignore - 访问全局store
      const gameStore = window.useGameStore?.getState?.() || {};
      // @ts-ignore - 访问全局store
      const roomStore = window.useRoomStore?.getState?.() || {};
      // @ts-ignore - 访问全局store
      const authStore = window.useAuthStore?.getState?.() || {};

      return {
        gameStatus: gameStore.status,
        currentSeat: gameStore.currentSeat,
        turnNo: gameStore.turnNo,
        members: roomStore.members || [],
        roomOwnerId: roomStore.currentRoom?.owner_uid,
        userId: authStore.user?.id,
      };
    });

    console.log('游戏状态检查结果:');
    console.log('  gameStatus:', gameState.gameStatus);
    console.log('  currentSeat:', gameState.currentSeat);
    console.log('  turnNo:', gameState.turnNo);
    console.log('  roomOwnerId:', gameState.roomOwnerId);
    console.log('  userId:', gameState.userId);
    console.log('  members数量:', gameState.members.length);
    console.log('  members详情:');
    gameState.members.forEach((m: any) => {
      console.log(`    座位${m.seat_no}: ${m.member_type} (uid=${m.uid})`);
    });

    // 计算isOwner
    const isOwner = gameState.roomOwnerId === gameState.userId;
    console.log('  isOwner计算:', isOwner, `(roomOwnerId=${gameState.roomOwnerId}, userId=${gameState.userId})`);

    // 检查当前座位是否是AI
    const currentMember = gameState.members.find((m: any) => m.seat_no === gameState.currentSeat);
    const isAIMember = currentMember?.member_type === 'ai';
    console.log('  当前座位:', gameState.currentSeat);
    console.log('  当前座位成员:', currentMember);
    console.log('  是否是AI成员:', isAIMember);

    console.log('\n=== 步骤5：等待AI执行（30秒）===');
    await page.waitForTimeout(30000);

    console.log('\n=== 步骤6：再次检查游戏状态 ===');
    const gameState2 = await page.evaluate(() => {
      // @ts-ignore
      const gameStore = window.useGameStore?.getState?.() || {};
      return {
        gameStatus: gameStore.status,
        currentSeat: gameStore.currentSeat,
        turnNo: gameStore.turnNo,
      };
    });

    console.log('更新后的游戏状态:');
    console.log('  gameStatus:', gameState2.gameStatus);
    console.log('  currentSeat:', gameState2.currentSeat);
    console.log('  turnNo:', gameState2.turnNo);

    console.log('\n=== 分析 ===');
    if (gameState.gameStatus !== 'playing') {
      console.log('⚠️ 问题：gameStatus不是playing，是', gameState.gameStatus);
    }
    if (!isOwner) {
      console.log('⚠️ 问题：isOwner是false，AI系统可能未初始化');
    }
    if (gameState.members.length === 0) {
      console.log('⚠️ 问题：members数组为空');
    }
    if (!isAIMember && currentMember) {
      console.log('⚠️ 当前座位不是AI，需要人类玩家先出牌');
    }
  });
});
