import { test, expect } from '@playwright/test';

test.describe('大厅核心功能', () => {
  test.setTimeout(180000);

  test('筛选、排序与房间详情', async ({ page }) => {
    await page.goto('http://localhost:3000/lobby', { timeout: 30000 });
    await expect(page.getByRole('heading', { name: '对战大厅' })).toBeVisible({ timeout: 60000 });

    let roomName = `LobbyCore-${Date.now()}`;
    let created = false;
    for (let attempt = 0; attempt < 2; attempt++) {
      roomName = `LobbyCore-${Date.now()}-${attempt}`;
      await page.getByTestId('lobby-create-name').fill(roomName);
      await page.getByTestId('lobby-create').click();
      try {
        await page.waitForURL(/\/room\//, { timeout: 90000 });
        created = true;
        break;
      } catch {
        await page.goto('http://localhost:3000/lobby', { timeout: 30000 });
        await expect(page.getByRole('heading', { name: '对战大厅' })).toBeVisible({ timeout: 60000 });
      }
    }
    expect(created).toBe(true);

    await page.goto('http://localhost:3000/lobby', { timeout: 30000 });
    await expect(page).toHaveURL(/\/lobby/);

    const cardTitle = page.locator('h3').filter({ hasText: roomName });
    await expect(cardTitle).toBeVisible({ timeout: 30000 });

    const onlyJoinable = page.getByTestId('lobby-filter-joinable');
    const onlyHasOnline = page.getByTestId('lobby-filter-online');
    await onlyJoinable.check();
    await onlyHasOnline.check();
    await expect(cardTitle).toBeVisible({ timeout: 30000 });

    const card = page.locator(`[data-room-id]`).filter({ has: cardTitle }).first();
    const detailBtn = card.getByTestId('lobby-detail');
    await expect(detailBtn).toBeVisible({ timeout: 30000 });
    await detailBtn.click();
    await expect(page.getByTestId('lobby-detail-modal')).toBeVisible({ timeout: 30000 });

    const copyBtn = page.getByTestId('lobby-detail-copy');
    await expect(copyBtn).toBeVisible({ timeout: 30000 });
    await copyBtn.evaluate(el => (el as HTMLElement).click());
    await expect(page.getByTestId('toast-item').first()).toBeVisible({ timeout: 30000 });
    const qrBtn = page.getByTestId('lobby-detail-qr');
    await expect(qrBtn).toBeVisible({ timeout: 30000 });
    await qrBtn.evaluate(el => (el as HTMLElement).click());
    await expect(page.getByTestId('lobby-detail-qr-img')).toBeVisible({ timeout: 30000 });
  });
});
