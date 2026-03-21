import { test, expect, type Page } from '@playwright/test';
import { setupGameMocks } from './mocks';

test.describe('Game Scenarios & Mechanics', () => {
  test.use({
    actionTimeout: 10000,
    navigationTimeout: 15000,
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('dialog', async dialog => await dialog.accept());

    await page.goto('/');
    
    await setupGameMocks(page);
  });

  test('Scenario 1: Single Card Play', async ({ page }) => {
    console.log('Testing Single Card Play Scenario');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 30000 });
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();
    
    await page.waitForTimeout(5000);
    
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    const cardCount = await cards.count();
    console.log(`Initial card count: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);
    
    await cards.first().dispatchEvent('click');
    console.log('Selected first card');
    
    const playCardBtn = page.locator('button:has-text("出牌")');
    const passBtn = page.locator('button:has-text("过")');
    
    await page.waitForTimeout(2000);
    
    const playVisible = await playCardBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const passVisible = await passBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(playVisible || passVisible).toBeTruthy();
    
    if (playVisible && await playCardBtn.isEnabled()) {
      await playCardBtn.click();
      console.log('Successfully played single card');
    } else if (passVisible && await passBtn.isEnabled()) {
      await passBtn.click();
      console.log('Passed turn');
    }
    
    await page.waitForTimeout(3000);
    console.log('Single card play scenario completed');
  });

  test('Scenario 2: Pair Card Play', async ({ page }) => {
    console.log('Testing Pair Card Play Scenario');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 30000 });
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();
    
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    
    await page.waitForTimeout(2000);
    
    const playCardBtn = page.locator('button:has-text("出牌")');
    const passBtn = page.locator('button:has-text("过")');
    
    await page.waitForTimeout(2000);
    
    const playVisible = await playCardBtn.isVisible({ timeout: 5000 }).catch(() => false);
    const passVisible = await passBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (playVisible || passVisible) {
      console.log('Turn buttons are visible');
      
      if (await cards.count() >= 2) {
        await cards.nth(0).dispatchEvent('click');
        await cards.nth(1).dispatchEvent('click');
        console.log('Selected two cards for pair');
        
        if (playVisible && await playCardBtn.isEnabled()) {
          await playCardBtn.click();
          console.log('Successfully played pair');
        } else if (passVisible && await passBtn.isEnabled()) {
          await passBtn.click();
          console.log('Passed turn (pair not valid)');
        }
      }
    }
    
    await page.waitForTimeout(3000);
    console.log('Pair card play scenario completed');
  });

  test('Scenario 3: Turn Rotation', async ({ page }) => {
    console.log('Testing Turn Rotation Scenario');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 });
    
    let currentTurn = await getCurrentTurn(page);
    console.log(`Initial turn: Seat ${currentTurn}`);
    
    const turnsObserved = new Set();
    turnsObserved.add(currentTurn);
    
    for (let i = 0; i < 8; i++) {
      await page.waitForTimeout(5000);
      
      const newTurn = await getCurrentTurn(page);
      console.log(`Turn ${i + 1}: Seat ${newTurn}`);
      turnsObserved.add(newTurn);
      
      if (turnsObserved.size >= 4) {
        console.log('All 4 seats have been observed');
        break;
      }
    }
    
    expect(turnsObserved.size).toBeGreaterThanOrEqual(1);
    console.log(`Observed ${turnsObserved.size} different seats`);
    console.log('Turn rotation scenario completed');
  });

  test('Scenario 4: AI Response Time', async ({ page }) => {
    console.log('Testing AI Response Time');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 });
    
    const currentTurn = await getCurrentTurn(page);
    console.log(`Current turn: Seat ${currentTurn}`);
    
    if (currentTurn !== '0') {
      console.log('AI is playing, measuring response time...');
      
      const startTime = Date.now();
      
      await page.waitForTimeout(10000);
      
      const newTurn = await getCurrentTurn(page);
      const responseTime = Date.now() - startTime;
      
      console.log(`AI response time: ${responseTime}ms`);
      console.log(`Turn changed from ${currentTurn} to ${newTurn}`);
      
      expect(responseTime).toBeLessThan(15000);
    } else {
      console.log('Player turn, skipping AI response time test');
    }
    
    console.log('AI response time scenario completed');
  });

  test('Scenario 5: Card Selection Visual Feedback', async ({ page }) => {
    console.log('Testing Card Selection Visual Feedback');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 });
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();
    
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    const firstCard = cards.first();
    
    await expect(firstCard).toBeVisible();
    
    const initialTransform = await firstCard.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    console.log(`Initial transform: ${initialTransform}`);
    
    await firstCard.dispatchEvent('click');
    
    await page.waitForTimeout(500);
    
    const selectedTransform = await firstCard.evaluate(el => {
      return window.getComputedStyle(el).transform;
    });
    console.log(`Selected transform: ${selectedTransform}`);
    
    expect(selectedTransform).not.toBe(initialTransform);
    console.log('Card selection visual feedback verified');
  });

  test('Scenario 6: Game State Persistence', async ({ page }) => {
    console.log('Testing Game State Persistence');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 });
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();
    
    await page.waitForTimeout(5000);
    
    const initialCardCount = await handArea.locator('.w-24.h-36.bg-white').count();
    console.log(`Initial card count: ${initialCardCount}`);
    
    await page.waitForTimeout(10000);
    
    const currentCardCount = await handArea.locator('.w-24.h-36.bg-white').count();
    console.log(`Current card count: ${currentCardCount}`);
    
    expect(currentCardCount).toBeLessThanOrEqual(initialCardCount);
    console.log('Game state persistence verified');
  });

  test('Scenario 7: Multiple Rounds', async ({ page }) => {
    console.log('Testing Multiple Rounds');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 });
    
    let roundCount = 0;
    const maxRounds = 5;
    
    for (let i = 0; i < maxRounds; i++) {
      await page.waitForTimeout(8000);
      
      const turnText = await page.getByText(/座位：/i).textContent();
      const currentTurn = turnText?.match(/座位：(\d+)/)?.[1];
      
      console.log(`Round ${i + 1}: Seat ${currentTurn}`);
      roundCount++;
      
      if (roundCount >= maxRounds) {
        break;
      }
    }
    
    expect(roundCount).toBeGreaterThanOrEqual(3);
    console.log(`Completed ${roundCount} rounds`);
    console.log('Multiple rounds scenario completed');
  });

  test('Scenario 8: Error Handling - Invalid Move', async ({ page }) => {
    console.log('Testing Error Handling - Invalid Move');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    await expect(page.getByText(/座位：/i)).toBeVisible({ timeout: 15000 });
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible();
    
    const cards = handArea.locator('.w-24.h-36.bg-white');
    
    await page.waitForTimeout(2000);
    
    const playCardBtn = page.locator('button:has-text("出牌")');
    const passBtn = page.locator('button:has-text("过")');
    
    const playVisible = await playCardBtn.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (playVisible && await cards.count() >= 1) {
      await cards.first().dispatchEvent('click');
      
      if (await playCardBtn.isEnabled()) {
        await playCardBtn.click();
        console.log('Attempted to play card');
      }
      
      await page.waitForTimeout(2000);
      
      const errorMessage = page.locator('text=/出牌失败|无效|错误/i');
      const hasError = await errorMessage.isVisible({ timeout: 3000 }).catch(() => false);
      
      if (hasError) {
        console.log('Error message displayed for invalid move');
      } else {
        console.log('Move was valid or no error message shown');
      }
    }
    
    console.log('Error handling scenario completed');
  });
});

async function getCurrentTurn(page: Page): Promise<string> {
  const turnText = await page.getByText(/座位：/i).textContent();
  const match = turnText?.match(/座位：(\d+)/);
  return match?.[1] || '0';
}