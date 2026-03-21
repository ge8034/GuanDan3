import { test, expect, Page } from '@playwright/test';
import { setupGameMocks } from './mocks';

test.describe('修复验证', () => {
  test.setTimeout(90000);

  test('验证修复是否真的生效', async ({ page }) => {
    console.log('🧪 开始修复验证...');

    await setupGameMocks(page, 'verify-fix-user');
    page.on('dialog', async dialog => {
      await dialog.accept()
    })

    await page.goto('http://localhost:3000');
    // 直接点击"开始练习"按钮创建练习房间
    await page.getByTestId('home-practice').click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });

    // 等待游戏界面加载
    await page.waitForTimeout(3000);

    // 验证基本游戏界面元素存在
    const pageContent = await page.content();
    expect(pageContent).toContain('掼蛋');

    // 验证手牌区域存在
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });

    // 刷新页面验证状态恢复
    await page.reload();
    await page.waitForURL(/\/room\/.+/);
    await page.waitForTimeout(3000);

    // 验证刷新后手牌区域仍然存在
    await expect(handArea).toBeVisible({ timeout: 10000 });

    const afterReloadContent = await page.content();
    expect(afterReloadContent).toContain('掼蛋');

    console.log('✅ 修复验证通过：刷新后仍能看到游戏界面');
  });
});
