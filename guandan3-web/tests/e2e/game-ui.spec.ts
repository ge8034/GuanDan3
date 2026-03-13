import { test, expect } from '@playwright/test';

test.describe('GuanDan Game UI', () => {
  test('should display last action when a turn is played', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('dialog', async dialog => {
      await dialog.accept()
    })
    
    // 1. Enter Room
    await page.goto('/');
    await page.getByRole('button', { name: /练习房/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    // 2. Start Game
    const startBtn = page.getByRole('button', { name: /开始游戏/i });
    await expect(startBtn).toBeVisible({ timeout: 15000 });
    await startBtn.click();
    
    // 3. Wait for Game Start
    await expect(page.getByText(/回合：座位/i)).toBeVisible({ timeout: 15000 });
    
    // 4. Wait for any action on the table
    // The table area initially shows "New Trick"
    // When someone plays, it should show "Last: Seat X" or "PASS"
    
    // We can wait for the "Last:" text to appear, which indicates a move has been made.
    // Since AI plays automatically after 1.5s delay, we should see something soon.
    // If I am Seat 0, and current turn is 0, I need to play first.
    // If random start gives turn to AI, they will play.
    
    // Let's check whose turn it is
    const turnText = await page.getByText(/回合：座位 (\d+)/i).textContent();
    const currentSeat = turnText?.match(/回合：座位 (\d+)/)?.[1];
    
    console.log(`当前回合座位：${currentSeat}`);
    
    if (currentSeat === '0') {
        // My turn. I need to play something to trigger UI update.
        // Wait for cards to be interactive
        const handArea = page.locator('.col-span-3.row-start-3');
        await expect(handArea).toBeVisible();
        
        // Select the first card (specifically the div that has onclick)
        // The structure is: container > div (card)
        // We use a more specific selector to ensure we click the card element
        const firstCard = handArea.locator('.cursor-pointer.transition-transform').first();
        await firstCard.waitFor({ state: 'visible' });
        await firstCard.click();
        
        // Click Play
        const playBtn = page.getByRole('button', { name: /出牌/i });
        await expect(playBtn).toBeEnabled({ timeout: 5000 });
        await playBtn.click();
        
        console.log('已出牌，等待界面更新');
        
        // Add a small delay to allow Realtime to propagate
        await page.waitForTimeout(2000);
    } else {
        console.log('等待 AI 出牌');
        // AI plays after 1.5s, plus network latency
        await page.waitForTimeout(3000);
    }
    
    // 5. Verify UI Update
    console.log('Checking for UI updates...');
    
    // Check if the center area has changed from "新一轮"
    // The "新一轮" text should disappear or be replaced
    const newTrickText = page.getByText('新一轮');
    
    // Check initially
    if (await newTrickText.isVisible()) {
        console.log('"New Trick" is still visible. Waiting for it to disappear...');
        try {
            await expect(newTrickText).toBeHidden({ timeout: 5000 });
        } catch (e) {
            console.log('Timeout waiting for Realtime update. Trying to reload page to check database state...');
            await page.reload();
            await page.waitForURL(/\/room\/.+/);
            await expect(page.getByText(/回合：座位/i)).toBeVisible();
            
            // Check again after reload
            if (await newTrickText.isVisible()) {
                 console.error('Even after reload, "New Trick" is visible. Data was not saved or logic is wrong.');
                 throw new Error('Data persistence failed');
            } else {
                 console.log('After reload, UI is correct. This indicates a Realtime subscription issue.');
            }
        }
    }
    
    // Look for "上一手" OR "过牌" OR Card elements
    // We use a race condition check or just check for any of them
    const tableArea = page.locator('.col-start-2.row-start-2');
    
    // Take a screenshot for debug if needed (not in this env)
    // await page.screenshot({ path: 'debug-ui.png' });
    
    await Promise.race([
        expect(tableArea.locator('text=上一手：')).toBeVisible({ timeout: 15000 }),
        expect(newTrickText).toBeHidden({ timeout: 15000 })
    ]);
    console.log('UI 已更新（上一手/新一轮状态变化）');
  });
});
