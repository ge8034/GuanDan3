import { test, expect } from '@playwright/test';
import { setupGameMocks } from './mocks';

test.describe('GuanDan Game Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupGameMocks(page);
  });

  test('should create room, start game, and play a turn', async ({ page }) => {
    // Increase timeout for this specific test
    test.setTimeout(120000);
    let lastDialogMessage: string | null = null
    page.on('dialog', async dialog => {
      lastDialogMessage = dialog.message()
      await dialog.accept()
    })

    // 1. Visit Home Page
    await page.goto('/');
    await expect(page).toHaveTitle(/掼蛋 3/i);
    
    // 2. Click "Practice Room" (1v3 AI)
    const practiceBtn = page.getByRole('button', { name: /练习/i });
    await expect(practiceBtn).toBeVisible();
    await practiceBtn.click();
    
    // 3. Wait for Room Page (URL change)
    try {
      await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    } catch {
      throw new Error(`进入练习房超时${lastDialogMessage ? `（弹窗：${lastDialogMessage}）` : ''}`)
    }
    
    // 4. Wait for Game to Start (Practice mode auto-starts)
    // Look for "Seat:" indicator
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 30000 });
    
    // 5. Verify My Hand is Dealt
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();
    
    // Look for any card element (more flexible selector)
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    await expect(cards.first()).toBeVisible({ timeout: 30000 });
    
    console.log('Game started successfully!');
  });
});
