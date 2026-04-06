import { test, expect } from '@playwright/test';

test.describe('完整游戏流程测试', () => {
  test.beforeEach(async ({ page }) => {
    // 设置较长的超时时间
    test.setTimeout(180000); // 3分钟
  });

  test('模拟完整游戏直到排名', async ({ page }) => {
    const logs: string[] = [];
    const errors: string[] = [];

    page.on('console', msg => {
      const text = msg.text();
      logs.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });

    console.log('=== 步骤1: 访问首页 ===');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'tests/e2e/screenshots/step1-home.png' });

    console.log('=== 步骤2: 进入练习模式 ===');
    const practiceBtn = page.getByRole('button', { name: /练习模式|开始练习/i }).first();
    await expect(practiceBtn).toBeVisible({ timeout: 10000 });
    await practiceBtn.click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/e2e/screenshots/step2-practice.png' });

    console.log('=== 步骤3: 开始游戏 ===');
    const startBtn = page.getByRole('button', { name: /开始游戏|开始/i }).first();
    const startVisible = await startBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (startVisible) {
      await startBtn.click();
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'tests/e2e/screenshots/step3-started.png' });
    }

    console.log('=== 步骤4: 观察游戏进行（最长2分钟）===');
    
    let lastCardCount = 0;
    let noChangeCount = 0;
    
    for (let i = 0; i < 40; i++) {
      await page.waitForTimeout(3000);
      
      // 检查是否有排名显示
      const rankingText = await page.locator('body').textContent();
      const hasRankings = /排名|rank|1st|2nd|3rd|4th|第一名|第二名|第三名|第四名|胜利|完成|finished/i.test(rankingText || '');
      
      if (hasRankings) {
        console.log('=== 检测到游戏结束和排名 ===');
        await page.screenshot({ path: 'tests/e2e/screenshots/step5-rankings.png' });
        break;
      }
      
      // 检查卡片数量变化
      const cardCount = await page.locator('[class*="card"], [class*="Card"]').count();
      if (cardCount === lastCardCount) {
        noChangeCount++;
      } else {
        noChangeCount = 0;
        lastCardCount = cardCount;
      }
      
      // 20秒无变化则停止
      if (noChangeCount > 6) {
        console.log('=== 游戏状态无变化，停止等待 ===');
        break;
      }
      
      if (i % 5 === 0) {
        console.log(`游戏进行中... ${i * 3}秒, 卡片数: ${cardCount}`);
      }
    }

    console.log('=== 步骤5: 分析结果 ===');
    
    // 最终截图
    await page.screenshot({ path: 'tests/e2e/screenshots/final-state.png' });
    
    // 获取页面内容
    const pageContent = await page.locator('body').textContent();
    
    // 分析错误
    console.log('错误数量:', errors.length);
    if (errors.length > 0) {
      console.log('错误列表:');
      errors.slice(0, 10).forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
    }
    
    // 检查游戏状态
    const hasRankings = /排名|rank|1st|2nd|3rd|4th|第一名|第二名|第三名|第四名|胜利|完成|finished/i.test(pageContent || '');
    const hasErrors = errors.some(e => e.includes('ERROR') || e.includes('失败'));
    
    console.log('游戏结果分析:');
    console.log('  - 有排名显示:', hasRankings);
    console.log('  - 有错误:', hasErrors);
    
    // 保存详细日志
    require('fs').appendFileSync(
      'tests/e2e/screenshots/test-log.txt', 
      `\n\n=== 测试运行 ${new Date().toISOString()} ===\n` +
      `错误数量: ${errors.length}\n` +
      `有排名: ${hasRankings}\n` +
      `页面内容预览: ${(pageContent || '').slice(0, 500)}\n`
    );
    
    // 断言
    expect(hasErrors).toBe(false);
  });
});
