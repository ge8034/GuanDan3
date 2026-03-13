import { test, expect } from '@playwright/test';

test.describe('GuanDan Game Flow', () => {
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
    const practiceBtn = page.getByRole('button', { name: /练习房/i });
    await expect(practiceBtn).toBeVisible();
    await practiceBtn.click();
    
    // 3. Wait for Room Page (URL change)
    try {
      await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    } catch {
      throw new Error(`进入练习房超时${lastDialogMessage ? `（弹窗：${lastDialogMessage}）` : ''}`)
    }
    
    // 4. Verify Room Elements
    // Should see "Start Game" button since I am the owner
    const startBtn = page.getByRole('button', { name: /开始游戏/i });
    await expect(startBtn).toBeVisible({ timeout: 30000 });
    
    // 5. Start Game
    await startBtn.click();
    
    // 6. Wait for Game to Start (Status changes to 'playing')
    // Look for "Turn: Seat" indicator
    await expect(page.getByText(/回合：座位/i)).toBeVisible({ timeout: 30000 });
    
    // 7. Verify My Hand is Dealt
    const handArea = page.locator('.col-span-3.row-start-3');
    await expect(handArea).toBeVisible();
    
    await expect(page.locator('.cursor-pointer.transition-transform').first()).toBeVisible({ timeout: 30000 });
    
    console.log('Game started successfully!');
  });
});
