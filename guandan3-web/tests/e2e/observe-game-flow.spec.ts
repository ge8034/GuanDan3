import { test } from '@playwright/test';

test('观察游戏流程（非阻塞测试）', async ({ page }) => {
  const logs: string[] = [];
  const events: string[] = [];
  
  page.on('console', msg => {
    const text = msg.text();
    logs.push(text);
    if (text.includes('turn') || text.includes('finish') || text.includes('rank')) {
      events.push(text);
    }
  });

  console.log('访问游戏页面...');
  await page.goto('http://localhost:3000', { timeout: 30000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(3000);
  
  console.log('进入练习模式...');
  const practiceBtn = page.locator('button:has-text("练习"), button:has-text("Practice")').first();
  if (await practiceBtn.isVisible({ timeout: 10000 })) {
    await practiceBtn.click();
    await page.waitForTimeout(5000);
  }
  
  console.log('尝试开始游戏...');
  const startBtn = page.locator('button:has-text("开始"), button:has-text("Start")').first();
  const startVisible = await startBtn.isVisible({ timeout: 5000 }).catch(() => false);
  
  if (startVisible) {
    await startBtn.click();
    await page.waitForTimeout(5000);
  }
  
  console.log('观察游戏进行（90秒）...');
  for (let i = 0; i < 30; i++) {
    await page.waitForTimeout(3000);
    
    const content = await page.locator('body').textContent();
    const hasRankings = /排名|rank|1st|2nd|3rd|4th|胜利|完成|finished/i.test(content || '');
    
    if (hasRankings) {
      console.log('✓ 检测到排名显示！');
      break;
    }
    
    if (i % 10 === 0) {
      console.log(`观察中... ${i * 3}秒`);
    }
  }
  
  // 保存结果
  await page.screenshot({ path: 'tests/e2e/screenshots/observe-result.png' });
  
  console.log('=== 游戏事件 ===');
  events.slice(-20).forEach(e => console.log(`  ${e}`));
  
  console.log('=== 错误日志 ===');
  const errors = logs.filter(l => l.includes('ERROR') || l.includes('error'));
  console.log(`错误数量: ${errors.length}`);
  if (errors.length > 0 && errors.length < 20) {
    errors.forEach(e => console.log(`  ${e}`));
  }
});
