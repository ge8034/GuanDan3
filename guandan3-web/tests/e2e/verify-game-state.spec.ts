import { test } from '@playwright/test';

test('验证游戏状态和排名更新', async ({ page }) => {
  console.log('=== 游戏状态和排名验证 ===\n');
  
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  // 练习模式
  const practiceBtn = page.locator('button:has-text("练习")').first();
  if (await practiceBtn.isVisible()) {
    await practiceBtn.click();
    await page.waitForTimeout(5000);
  }
  
  // 注入监听脚本
  await page.addInitScript(() => {
    (window as any).__gameEvents = [];
  });
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('finished') || text.includes('rank') || text.includes('Game Update')) {
      console.log('[Console]', text);
    }
  });
  
  // 持续检查2分钟
  for (let i = 0; i < 40; i++) {
    await page.waitForTimeout(3000);
    
    // 获取游戏状态
    const gameState = await page.evaluate(() => {
      // 从页面获取状态
      const bodyText = document.body.textContent || '';
      
      // 查找游戏结束覆盖层
      const overlay = document.querySelector('[data-testid="game-over-overlay"]');
      const hasOverlay = overlay !== null;
      
      // 查找排名元素
      const rankingElements = document.querySelectorAll('[data-testid^="ranking-"]');
      const rankingsText = Array.from(rankingElements).map(el => el.textContent);
      
      // 检查游戏结束文本
      const hasGameOverText = bodyText.includes('游戏结束') || bodyText.includes('finished');
      
      // 检查排名关键词
      const hasRankingKeywords = bodyText.includes('排名') || 
                                  bodyText.includes('👑') || 
                                  bodyText.includes('头游');
      
      return {
        hasOverlay,
        rankingsCount: rankingElements.length,
        rankingsText,
        hasGameOverText,
        hasRankingKeywords,
        bodyTextPreview: bodyText.substring(0, 500)
      };
    });
    
    console.log(`[${i * 3}秒] 状态: overlay=${gameState.hasOverlay}, rankings=${gameState.rankingsCount}, gameover=${gameState.hasGameOverText}, keywords=${gameState.hasRankingKeywords}`);
    
    if (gameState.rankingsCount >= 4) {
      console.log('\n✓✓✓ 找到完整的排名显示！');
      console.log('排名内容:', gameState.rankingsText);
      break;
    }
    
    if (gameState.hasOverlay) {
      console.log('\n✓ 发现游戏结束覆盖层');
      if (gameState.rankingsText.length > 0) {
        console.log('排名内容:', gameState.rankingsText);
      }
    }
  }
  
  // 最终截图
  await page.screenshot({ path: 'playwright-report/screenshots/game-state-verification.png', fullPage: true });
  console.log('\n截图已保存');
});
