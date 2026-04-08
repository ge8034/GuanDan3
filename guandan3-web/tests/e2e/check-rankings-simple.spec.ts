import { test } from '@playwright/test';

test('检查排名显示', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(3000);
  
  // 练习模式
  const practiceBtn = page.locator('button:has-text("练习")').first();
  if (await practiceBtn.isVisible()) {
    await practiceBtn.click();
    await page.waitForTimeout(5000);
  }
  
  // 等待60秒并定期检查
  for (let i = 0; i < 20; i++) {
    await page.waitForTimeout(3000);
    
    // 获取页面所有文本
    const bodyText = await page.locator('body').textContent() || '';
    
    // 检查排名相关内容
    if (bodyText.includes('排名') || bodyText.includes('rank')) {
      console.log('=== 发现排名内容！===');
      console.log('页面文本:', bodyText.substring(0, 1000));
      
      // 获取所有DOM元素
      const rankingsElements = await page.locator('*').all();
      for (const el of rankingsElements) {
        const text = await el.textContent().catch(() => '');
        if (text && (text.includes('排名') || text.includes('🥇') || text.includes('第一'))) {
          console.log('排名元素:', text.substring(0, 100));
        }
      }
      break;
    }
    
    if (i % 5 === 0) {
      console.log(`检查中... ${i * 3}秒`);
    }
  }
});
