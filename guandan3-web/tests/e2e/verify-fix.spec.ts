import { test, expect, Page } from '@playwright/test';

test.describe('修复验证', () => {
  test.setTimeout(90000);

  test('验证修复是否真的生效', async ({ page }) => {
    console.log('🧪 开始修复验证...');
    page.on('dialog', async dialog => {
      await dialog.accept()
    })

    await page.goto('http://localhost:3000');
    await page.getByRole('button', { name: /练习房/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });

    await page.getByRole('button', { name: /开始游戏/i }).click();
    await expect(page.getByText(/回合：座位/i)).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.cursor-pointer.transition-transform').first()).toBeVisible({ timeout: 30000 });

    await page.reload();
    await page.waitForURL(/\/room\/.+/);
    await expect(page.getByText(/回合：座位/i)).toBeVisible({ timeout: 30000 });
    await expect(page.locator('.cursor-pointer.transition-transform').first()).toBeVisible({ timeout: 30000 });

    console.log('✅ 修复验证通过：刷新后仍能看到手牌与操作按钮');
  });
});
