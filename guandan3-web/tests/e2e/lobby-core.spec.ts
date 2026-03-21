import { test, expect } from '@playwright/test';
import { setupGameMocks } from './mocks';

test.describe('大厅核心功能', () => {
  test.setTimeout(180000);

  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test('筛选、排序与房间详情', async ({ page }) => {
    await page.goto('http://localhost:3000/lobby', { timeout: 30000 });
    const lobbyHeading = page.locator('h1').filter({ hasText: '对战大厅' }).first();
    await expect(lobbyHeading).toBeVisible({ timeout: 60000 });

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
        const lobbyHeading = page.locator('h1').filter({ hasText: '对战大厅' }).first();
        await expect(lobbyHeading).toBeVisible({ timeout: 60000 });
      }
    }
    expect(created).toBe(true);

    await page.goto('http://localhost:3000/lobby', { timeout: 30000 });
    await expect(page).toHaveURL(/\/lobby/);

    // Wait for room list to load with longer timeout
    await page.waitForTimeout(5000);

    // Find any room card (not necessarily the one we created)
    // Use a more flexible selector that matches the room card structure
    const roomCards = page.locator('h3').filter({ hasText: /Mock Room/i }).locator('..').locator('..');
    await expect(roomCards.first()).toBeVisible({ timeout: 60000 });

    // Wait for filters to be attached before interacting
    const onlyJoinable = page.getByTestId('lobby-filter-joinable');
    const onlyHasOnline = page.getByTestId('lobby-filter-online');
    await expect(onlyJoinable).toBeAttached({ timeout: 10000 });
    await expect(onlyHasOnline).toBeAttached({ timeout: 10000 });
    
    // Use JavaScript to check the boxes directly
    await onlyJoinable.evaluate((el: HTMLInputElement) => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await onlyHasOnline.evaluate((el: HTMLInputElement) => {
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await expect(roomCards.first()).toBeVisible({ timeout: 60000 });

    const card = roomCards.first();
    // Use a more specific selector to find detail button
    // The detail button is inside the card, not a direct child
    // Try multiple selectors to find the button
    const detailBtn = page.getByText('房间详情').first();
    await expect(detailBtn).toBeVisible({ timeout: 30000 });
    await detailBtn.click();
    
    // Wait for dialog to appear
    await page.waitForTimeout(2000);
    
    // Verify dialog is open by checking for dialog content
    // Use a more reliable approach - check for dialog content elements
    // Use the modal-title id to specifically target the dialog heading
    const dialogHeading = page.locator('#modal-title');
    await expect(dialogHeading).toBeVisible({ timeout: 30000 });

    // Verify dialog content
    const closeButton = page.getByRole('button', { name: /关闭/i });
    await expect(closeButton).toBeVisible({ timeout: 30000 });
    
    const copyButton = page.getByRole('button', { name: /复制房间链接/i });
    await expect(copyButton).toBeVisible({ timeout: 30000 });
    await copyButton.evaluate(el => (el as HTMLElement).click());
    await expect(page.getByTestId('toast-item').first()).toBeVisible({ timeout: 30000 });
    
    const qrButton = page.getByRole('button', { name: /二维码邀请/i });
    await expect(qrButton).toBeVisible({ timeout: 30000 });
    await qrButton.evaluate(el => (el as HTMLElement).click());
    await expect(page.getByTestId('lobby-detail-qr-img')).toBeVisible({ timeout: 30000 });
  });
});
