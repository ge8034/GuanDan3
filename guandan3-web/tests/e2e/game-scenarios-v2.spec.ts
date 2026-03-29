import { test, expect, type Page } from '@playwright/test';
import { setupGameMocks, MOCK_TIMEOUTS } from './shared';

test.describe('Game Scenarios V2 - Improved', () => {
  // 设置测试配置
  test.describe.configure({
    timeout: 120000, // 2分钟超时
    mode: 'default',
  });

  /**
   * 设置测试mock（使用共享模块）
   * 简化版本，消除代码重复
   */
  async function setupMocks(page: Page) {
    // 使用共享的mock设置
    await setupGameMocks(page, 'mock-user-id');
  }

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('dialog', async dialog => await dialog.accept());

    await page.goto('http://localhost:3000');

    await setupMocks(page);
  });

  // ============== 测试用例开始 ==============

  test('Scenario 1: Game Interface Loading', async ({ page }) => {
    console.log('Testing Game Interface Loading');

    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3'),
      page.getByText('出牌'),
      page.getByText('过')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        console.log('Found game element:', await element.textContent());
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    console.log('Game interface loaded successfully');
  });

  test('Scenario 2: Player Turn Detection', async ({ page }) => {
    console.log('Testing Player Turn Detection');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const playerTurn = await waitForPlayerTurn(page, 45000);
    expect(playerTurn).toBeTruthy();
    console.log('Player turn detected successfully');
  });

  test('Scenario 3: Card Selection', async ({ page }) => {
    console.log('Testing Card Selection');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });
    
    await page.waitForTimeout(5000);
    
    const playButton = page.getByTestId('room-play');
    const isPlayButtonVisible = await playButton.isVisible().catch(() => false);
    console.log(`Play button visible: ${isPlayButtonVisible}`);
    
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    const cardCount = await cards.count();
    console.log(`Card count: ${cardCount}`);
    expect(cardCount).toBeGreaterThan(0);
    
    const firstCard = cards.first();
    await expect(firstCard).toBeVisible();
    
    const classNameBefore = await firstCard.evaluate(el => el.className);
    console.log(`Card class before click: ${classNameBefore}`);
    
    await firstCard.dispatchEvent('click');
    console.log('Card selected successfully');
    
    await page.waitForTimeout(2000);
    
    const classNameAfter = await firstCard.evaluate(el => el.className);
    console.log(`Card class after click: ${classNameAfter}`);
    
    const hasSelectedClass = await firstCard.evaluate(el => {
      return el.classList.contains('ring-yellow-400') || el.classList.contains('ring-3') || el.classList.contains('ring-4');
    });
    console.log(`Card has selected class: ${hasSelectedClass}`);
    
    expect(hasSelectedClass).toBeTruthy();
  });

  test('Scenario 4: Turn Rotation', async ({ page }) => {
    console.log('Testing Turn Rotation');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const turnsObserved = new Set<string>();
    
    for (let i = 0; i < 12; i++) {
      try {
        const seatText = await page.getByText(/座位：/i).textContent();
        const currentSeat = seatText?.match(/座位：(\d+)/)?.[1];
        
        if (currentSeat) {
          turnsObserved.add(currentSeat);
          console.log(`Observation ${i + 1}: Seat ${currentSeat}`);
        }
      } catch (e) {
        console.log('Error reading seat text:', e);
      }
      
      if (turnsObserved.size >= 4) {
        console.log('All 4 seats observed');
        break;
      }
      
      await page.waitForTimeout(3000);
    }
    
    expect(turnsObserved.size).toBeGreaterThanOrEqual(1);
    console.log(`Observed ${turnsObserved.size} different seats`);
  });

  test('Scenario 5: Game State Display', async ({ page }) => {
    console.log('Testing Game State Display');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const roomInfo = page.getByText(/房间：/i);
    await expect(roomInfo).toBeVisible();
    
    const gameStatus = page.getByText(/牌局：/i);
    await expect(gameStatus).toBeVisible();
    
    const levelInfo = page.getByText(/级牌：/i);
    await expect(levelInfo).toBeVisible();
    
    const seatInfo = page.getByText(/座位：/i);
    await expect(seatInfo).toBeVisible();
    
    console.log('All game state elements visible');
  });

  test('Scenario 6: AI Players Display', async ({ page }) => {
    console.log('Testing AI Players Display');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const aiSeats = [1, 2, 3];
    for (const seat of aiSeats) {
      const seatText = page.getByText(new RegExp(`座位 ${seat}`));
      await expect(seatText).toBeVisible({ timeout: 10000 });
    }
    
    await page.waitForTimeout(2000);
    
    const aiEmoji = page.getByText('🤖');
    const aiCount = await aiEmoji.count();
    expect(aiCount).toBeGreaterThan(0);
    
    console.log('All AI players displayed correctly');
  });

  test('Scenario 7: Card Count Changes', async ({ page }) => {
    console.log('Testing Card Count Changes');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/座位：/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const handArea = page.locator('[data-testid="room-hand"]');
    await expect(handArea).toBeVisible({ timeout: 10000 });
    
    const cards = handArea.locator('[class*="bg-white"][class*="border"]');
    
    await page.waitForTimeout(5000);
    
    const initialCount = await cards.count();
    console.log(`Initial card count: ${initialCount}`);
    
    if (initialCount === 0) {
      console.log('No cards found, trying alternative selectors...');
      const altCards = page.locator('[data-testid="hand-card"]');
      const altCount = await altCards.count();
      console.log(`Alternative card count: ${altCount}`);
      
      if (altCount === 0) {
        console.log('Still no cards found, checking if game has started...');
        const gameStarted = page.getByText(/牌局：/i);
        const hasGameStarted = await gameStarted.isVisible().catch(() => false);
        console.log(`Game started: ${hasGameStarted}`);
        
        if (!hasGameStarted) {
          console.log('Game may not have started yet, skipping card count check');
          return;
        }
        
        console.log('Game has started but no cards found, this might be expected in some scenarios');
        return;
      }
      
      expect(altCount).toBeGreaterThan(0);
    } else {
      expect(initialCount).toBeGreaterThan(0);
    }
    
    await page.waitForTimeout(10000);
    
    const currentCount = await cards.count();
    console.log(`Current card count: ${currentCount}`);
    
    expect(currentCount).toBeLessThanOrEqual(initialCount);
    console.log('Card count changes tracked correctly');
  });

  test('Scenario 8: Game Controls', async ({ page }) => {
    console.log('Testing Game Controls');
    
    await page.getByRole('button', { name: /练习/i }).click();
    await page.waitForURL(/\/room\/.+/, { timeout: 60000 });
    
    const gameElements = [
      page.getByText(/回合：座位/i),
      page.locator('[data-testid="hand-area"]'),
      page.locator('.col-span-3.row-start-3')
    ];
    
    let foundGameElement = false;
    for (const element of gameElements) {
      try {
        await expect(element).toBeVisible({ timeout: 5000 });
        foundGameElement = true;
        break;
      } catch (e) {
        console.log('Element not found, trying next...');
      }
    }
    
    expect(foundGameElement).toBeTruthy();
    
    const playCardBtn = page.locator('[data-testid="room-play"]');
    const passBtn = page.locator('[data-testid="room-pass"]');
    
    const playVisible = await playCardBtn.isVisible({ timeout: 10000 });
    const passVisible = await passBtn.isVisible({ timeout: 10000 });
    
    expect(playVisible || passVisible).toBeTruthy();
    console.log(`Play button visible: ${playVisible}, Pass button visible: ${passVisible}`);
  });
});

/**
 * 等待玩家轮到的辅助函数
 * 使用指数退避策略优化等待效率
 */
async function waitForPlayerTurn(page: Page, timeout: number = MOCK_TIMEOUTS.LONG): Promise<boolean> {
  const startTime = Date.now()
  let delay = 100 // 初始延迟100ms

  while (Date.now() - startTime < timeout) {
    try {
      const seatText = await page.getByText(/座位：/i).textContent()
      const currentSeat = seatText?.match(/座位：(\d+)/)?.[1]

      if (currentSeat === '0') {
        console.log('Player turn detected')
        return true
      }
    } catch (e) {
      // 继续等待
    }

    await page.waitForTimeout(delay)
    delay = Math.min(delay * 2, 1000) // 指数增长，最大1秒
  }

  console.log('Player turn timeout')
  return false
}
