/**
 * 检查游戏视觉状态
 * 截图并保存
 */

import { chromium } from 'playwright';

async function checkGameState() {
  const browser = await chromium.launch({
    headless: false,
    slowMo: 100
  });

  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });

  const page = await context.newPage();

  try {
    console.log('正在访问游戏页面...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('等待页面加载...');
    await page.waitForTimeout(3000);

    // 截图首页
    await page.screenshot({ path: 'test-results/screenshots/01-homepage.png', fullPage: true });
    console.log('✓ 首页截图已保存');

    // 点击练习按钮
    const practiceBtn = page.locator('[data-testid="home-practice"]').first();
    if (await practiceBtn.isVisible({ timeout: 5000 })) {
      await practiceBtn.click();
      await page.waitForTimeout(5000);

      // 截图游戏房间
      await page.screenshot({ path: 'test-results/screenshots/02-game-room.png', fullPage: true });
      console.log('✓ 游戏房间截图已保存');

      // 检查游戏状态
      const startBtn = page.locator('button:has-text("开始")').first();
      if (await startBtn.isVisible({ timeout: 3000 })) {
        await startBtn.click();
        await page.waitForTimeout(5000);
        console.log('✓ 游戏已开始');

        // 截图游戏进行中
        await page.screenshot({ path: 'test-results/screenshots/03-game-playing.png', fullPage: true });
        console.log('✓ 游戏进行中截图已保存');
      } else {
        // 游戏可能已自动开始
        await page.screenshot({ path: 'test-results/screenshots/03-game-playing.png', fullPage: true });
        console.log('✓ 游戏进行中截图已保存（自动开始）');
      }
    }

    // 保持浏览器打开以便查看
    console.log('\n浏览器已打开，可以查看游戏效果');
    console.log('截图已保存到: test-results/screenshots/');
    console.log('按 Ctrl+C 退出...');

    // 等待用户手动关闭
    await new Promise(() => {});

  } catch (error) {
    console.error('发生错误:', error.message);
  } finally {
    await browser.close();
  }
}

checkGameState().catch(console.error);
