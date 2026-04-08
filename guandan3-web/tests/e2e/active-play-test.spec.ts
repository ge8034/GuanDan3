import { test } from '@playwright/test';

test('主动参与游戏加快进度', async ({ page }) => {
  console.log('=== 主动参与游戏测试 ===\n');
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  
  // 练习模式
  const practiceBtn = page.locator('button:has-text("练习")').first();
  await practiceBtn.click();
  await page.waitForTimeout(5000);
  
  const handCards = page.locator('[data-card-id]');
  let turnCount = 0;
  let gameFinished = false;
  
  console.log('开始主动出牌...\n');
  
  // 主动出牌循环 - 最多200回合
  while (!gameFinished && turnCount < 200) {
    turnCount++;
    
    // 检查游戏状态
    const state = await page.evaluate(() => {
      const overlay = document.querySelector('[data-testid="game-over-overlay"]');
      const rankings = document.querySelectorAll('[data-testid^="ranking-"]');
      return {
        hasOverlay: overlay !== null,
        rankingsCount: rankings.length,
        bodyText: document.body.textContent?.substring(0, 200) || ''
      };
    });
    
    if (state.rankingsCount >= 4) {
      console.log(`\n✓✓✓ 游戏完成！找到完整排名！`);
      console.log(`总回合数: ${turnCount}`);
      gameFinished = true;
      break;
    }
    
    if (state.hasOverlay) {
      console.log(`\n✓ 发现游戏结束覆盖层，排名数: ${state.rankingsCount}`);
      if (state.rankingsCount >= 4) {
        gameFinished = true;
        break;
      }
    }
    
    if (turnCount % 10 === 0) {
      console.log(`回合 ${turnCount}: overlay=${state.hasOverlay}, rankings=${state.rankingsCount}`);
    }
    
    // 获取当前手牌数
    const cardCount = await handCards.count();
    
    if (cardCount > 0) {
      // 选择第一张牌
      await handCards.first().click({ timeout: 2000 });
      await page.waitForTimeout(100);
      
      // 尝试出牌
      const playBtn = page.locator('button:has-text("出牌")').first();
      const canPlay = await playBtn.isEnabled().catch(() => false);
      
      if (canPlay) {
        await playBtn.click();
      } else {
        // 尝试不出
        const passBtn = page.locator('button:has-text("不出")').first();
        const canPass = await passBtn.isVisible().catch(() => false);
        if (canPass) {
          await passBtn.click();
        }
      }
    }
    
    // 等待其他玩家
    await page.waitForTimeout(1500);
  }
  
  // 最终检查
  const finalState = await page.evaluate(() => {
    const rankings = document.querySelectorAll('[data-testid^="ranking-"]');
    return {
      rankingsCount: rankings.length,
      rankingsText: Array.from(rankings).map(el => el.textContent),
      bodyText: document.body.textContent || ''
    };
  });
  
  console.log('\n=== 最终结果 ===');
  console.log(`总回合数: ${turnCount}`);
  console.log(`排名数量: ${finalState.rankingsCount}`);
  console.log(`排名内容:`, finalState.rankingsText);
  
  // 截图
  await page.screenshot({ path: 'playwright-report/screenshots/active-play-result.png', fullPage: true });
  
  if (finalState.rankingsCount >= 4) {
    console.log('\n✅✅✅ 测试成功！游戏完成并显示完整排名');
    console.log(`   排名: ${finalState.rankingsText.join(' → ')}`);
  } else if (finalState.rankingsCount > 0) {
    console.log(`\n⚠️ 部分排名已显示 (${finalState.rankingsCount}/4)`);
  } else {
    console.log('\n⚠️ 游戏未完成或排名未显示');
  }
});
