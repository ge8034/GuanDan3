import { test, expect } from '@playwright/test';

test('简单游戏调试测试', async ({ page }) => {
  const logs: string[] = [];
  
  page.on('console', msg => {
    logs.push(`[${msg.type()}] ${msg.text()}`);
  });

  await page.goto('http://localhost:3000');
  await page.waitForLoadState('networkidle');
  
  console.log('页面已加载');

  // 等待并截图
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'tests/e2e/screenshots/01-homepage.png' });
  
  // 查找练习模式按钮
  const practiceButtons = await page.getByRole('button', { name: /练习/i }).all();
  console.log(`找到${practiceButtons.length}个练习模式按钮`);
  
  if (practiceButtons.length > 0) {
    await practiceButtons[0].click();
    await page.waitForTimeout(5000);
    await page.screenshot({ path: 'tests/e2e/screenshots/02-after-practice-click.png' });
    
    // 查找开始游戏按钮
    const startButtons = await page.getByRole('button', { name: /开始/i }).all();
    console.log(`找到${startButtons.length}个开始按钮`);
    
    if (startButtons.length > 0) {
      await startButtons[0].click();
      await page.waitForTimeout(10000);
      await page.screenshot({ path: 'tests/e2e/screenshots/03-after-start.png' });
    }
  }

  // 输出日志
  console.log('=== 控制台日志 ===');
  logs.forEach(log => console.log(log));
});
