import { test, expect, BrowserContext, Page } from '@playwright/test';

// Global configuration for better stability
test.use({
  actionTimeout: 10000,
  navigationTimeout: 15000,
});

test.describe.skip('PVP Game Flow (4 Players)', () => {
  // Hard limit for the entire test suite
  test.setTimeout(300000); 

  let hostContext: BrowserContext;
  let player2Context: BrowserContext;
  let player3Context: BrowserContext;
  let player4Context: BrowserContext;

  let hostPage: Page;
  let p2Page: Page;
  let p3Page: Page;
  let p4Page: Page;

  test.beforeAll(async ({ browser }) => {
    try {
      // Create 4 isolated contexts (simulating 4 different browsers/users)
      hostContext = await browser.newContext();
      player2Context = await browser.newContext();
      player3Context = await browser.newContext();
      player4Context = await browser.newContext();

      hostPage = await hostContext.newPage();
      p2Page = await player2Context.newPage();
      p3Page = await player3Context.newPage();
      p4Page = await player4Context.newPage();
    } catch (e) {
      console.error('Setup failed:', e);
      throw e;
    }
  });

  test.afterAll(async () => {
    // Force cleanup
    console.log('Cleaning up contexts...');
    await Promise.all([
        hostContext?.close().catch(() => {}),
        player2Context?.close().catch(() => {}),
        player3Context?.close().catch(() => {}),
        player4Context?.close().catch(() => {})
    ]);
  });

  test('Complete PVP Game Start Flow', async () => {
    // Set explicit timeout for this test case
    test.setTimeout(300000); 

    const roomName = `AutoTest-${Date.now()}`;
    let roomId = '';

    await test.step('Login all players', async () => {
       const ensureLogin = async (page: Page, name: string) => {
        console.log(`[${name}] Logging in...`);
        page.on('console', msg => {
            if (msg.type() === 'error') console.log(`[${name} Error] ${msg.text()}`);
        });
        
        try {
            await page.goto('http://localhost:3000', { timeout: 30000 });
            
            // Wait for button
            const lobbyBtn = page.locator('button:has-text("对战大厅")');
            await expect(lobbyBtn).toBeVisible({ timeout: 10000 });
            
            // Click and wait for navigation (this triggers anonymous login)
            await Promise.race([
                Promise.all([
                    page.waitForURL(/\/lobby/, { timeout: 30000 }),
                    lobbyBtn.click()
                ]),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Login Navigation Timeout')), 32000))
            ]);
            
            console.log(`[${name}] Logged in & At Lobby`);
            
            // Navigate back to Lobby (Already there)
            await expect(page.locator('h1:has-text("对战大厅")')).toBeVisible({ timeout: 10000 });
        } catch (e) {
            console.error(`[${name}] Login Failed:`, e);
            throw e; // Fail step immediately
        }
      };

      // Run in parallel to speed up and mimic real users
      await Promise.all([
          ensureLogin(hostPage, 'Host'),
          new Promise(r => setTimeout(r, 800)).then(() => ensureLogin(p2Page, 'P2')),
          new Promise(r => setTimeout(r, 1600)).then(() => ensureLogin(p3Page, 'P3')),
          new Promise(r => setTimeout(r, 2400)).then(() => ensureLogin(p4Page, 'P4'))
      ]);
    });

    await test.step('Host creates room', async () => {
      try {
        await hostPage.bringToFront();
        await hostPage.fill('input[placeholder="房间名称"]', roomName);
        await hostPage.click('text=创建房间');
        
        await hostPage.waitForURL(/\/room\//, { timeout: 60000 });
        roomId = hostPage.url().split('/').pop()!;
        console.log(`[Host] Room created: ${roomId}`);
      } catch (e) {
        console.error('Room creation failed:', e);
        throw e;
      }
    });

    await test.step('Players join room', async () => {
      const joinRoom = async (page: Page, name: string) => {
        try {
            await page.bringToFront();
            await page.goto(`http://localhost:3000/room/${roomId}`, { timeout: 30000 });
            await page.waitForURL(/\/room\//, { timeout: 60000 });
            await expect(page.locator('text=房间：')).toBeVisible({ timeout: 60000 })
            
            const joinSeatBtn = page.locator('button:has-text("加入座位")');
            const readyBtn = page.locator('button:has-text("准备")');
            await expect(readyBtn.or(joinSeatBtn)).toBeVisible({ timeout: 60000 });

            if (await joinSeatBtn.isVisible().catch(() => false)) {
              await joinSeatBtn.click();
            }

            await expect(readyBtn).toBeVisible({ timeout: 60000 });
            console.log(`[${name}] Joined`);
        } catch (e) {
            console.error(`[${name}] Join failed:`, e);
            throw e;
        }
      };

      await Promise.all([
        joinRoom(p2Page, 'P2'),
        joinRoom(p3Page, 'P3'),
        joinRoom(p4Page, 'P4')
      ]);
    });

    await test.step('P2 refreshes and restores session', async () => {
      await p2Page.bringToFront();
      await p2Page.reload();
      await expect(p2Page).toHaveURL(/\/room\//, { timeout: 15000 });

      const joinSeatBtn = p2Page.locator('button:has-text("加入座位")');
      if (await joinSeatBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await joinSeatBtn.click();
      }

      const readyBtn = p2Page.locator('button:has-text("准备")');
      const cancelBtn = p2Page.locator('text=取消准备');
      await expect(readyBtn.or(cancelBtn)).toBeVisible({ timeout: 10000 });
    });

    await test.step('All players Ready', async () => {
      const clickReady = async (page: Page, name: string) => {
        try {
            await page.bringToFront();
            
            // Wait for room state to load
            await page.waitForLoadState('networkidle');
            
            // Handle race condition where user might be already ready (e.g. Host)
            const cancelBtn = page.locator('text=取消准备');
            if (await cancelBtn.isVisible({ timeout: 3000 })) {
                console.log(`[${name}] Already Ready`);
                return;
            }

            // Wait for "Ready to Play" button explicitly
            // Sometimes Join Overlay blocks it?
            // Wait for Join Overlay to disappear if present
            const joinOverlay = page.locator('text=加入对局？');
            if (await joinOverlay.isVisible({ timeout: 2000 })) {
                 // Should have joined already, but if overlay persists, click Join Seat
                 await page.click('button:has-text("加入座位")');
            }

            const readyBtn = page.locator('button:has-text("准备")');
            await expect(readyBtn).toBeVisible({ timeout: 10000 });
            await readyBtn.click();
            await expect(cancelBtn).toBeVisible({ timeout: 10000 });
            console.log(`[${name}] is Ready`);
        } catch (e) {
            console.error(`[${name}] Ready Failed:`, e);
            throw e;
        }
      };

      // Run in parallel to speed up and mimic real users
      await Promise.all([
          clickReady(hostPage, 'Host'),
          clickReady(p2Page, 'P2'),
          clickReady(p3Page, 'P3'),
          clickReady(p4Page, 'P4')
      ]);
      
      // Wait for button to be enabled (might take a moment for sync)
      // The button text might be "Waiting (x/4)" initially, then "Start Game"
      const startBtn = hostPage.locator('button', { hasText: /(开始游戏)|(等待玩家)/ });
      await expect(startBtn).toBeVisible({ timeout: 5000 });
      
      // Wait for it to become "Start Game" (meaning 4 players present and ready)
      // This confirms Realtime sync is working
      await expect(startBtn).toHaveText('开始游戏', { timeout: 15000 });
      await expect(startBtn).toBeEnabled();
    });

    await test.step('Host Starts Game', async () => {
      // Use the same locator as above
      const startBtn = hostPage.locator('button', { hasText: '开始游戏' });
      await startBtn.click();
      
      // Wait for game start indication
      await expect(hostPage.locator('text=/状态：.*playing/')).toBeVisible({ timeout: 10000 });
      console.log('Game Started Successfully');
    });

    await test.step('P3 refreshes during playing and keeps state', async () => {
      await p3Page.bringToFront();
      await p3Page.reload();
      await expect(p3Page.locator('text=/状态：.*playing/')).toBeVisible({ timeout: 15000 });
      await expect(p3Page.locator('text=/回合：座位 \\d/')).toBeVisible({ timeout: 15000 });
    });

    await test.step('Host Plays First Card', async () => {
      // Wait for turn indicator
      // The current seat is 0 (Host), so Host should see controls
      await expect(hostPage.locator('button:has-text("出牌")')).toBeVisible({ timeout: 10000 });
      
      // Select the first card in hand
      // Hand cards are divs with specific styles. We can find them by looking for the hand container
      // Assuming cards are direct children of the hand container or identifiable
      // Based on UI code: <div ... onClick={() => toggleSelect(card.id)} ...>
      // We can just click the first element that looks like a card in the bottom area
      
      // We need a robust selector for cards.
      // In page.tsx, cards have `cursor-pointer` and are in the bottom-0 absolute div.
      // Let's assume the last div with `absolute bottom-0` is the hand.
      // Or we can look for `text=2` `text=A` etc.
      
      // Better: In `page.tsx`, `myHand` map renders divs.
      // Let's try to click the first card element.
      const firstCard = hostPage.locator('.cursor-pointer.transition-transform').first();
      await expect(firstCard).toBeVisible();
      await firstCard.click();
      
      // Click Play
      const playBtn = hostPage.locator('button:has-text("出牌")');
      await expect(playBtn).toBeEnabled();
      await playBtn.click();
      
      // Verify play success: Play button disappears
      await expect(playBtn).not.toBeVisible();
      
      // Verify P2 sees the played card (Last Action)
      await expect(p2Page.locator('text=上一手：座位 0')).toBeVisible({ timeout: 10000 });
      console.log('Host played card successfully');
    });

    await test.step('Turn Rotates to Player 2 (Pass)', async () => {
      // P2 should see "Play" and "Pass" buttons
      const passBtn = p2Page.locator('button:has-text("过牌")');
      await expect(passBtn).toBeVisible({ timeout: 10000 });
      await expect(passBtn).toBeEnabled();
      
      await passBtn.click();
      await expect(passBtn).not.toBeVisible();
      console.log('Player 2 Passed');
    });

    await test.step('Turn Rotates to Player 3 (Pass)', async () => {
      const passBtn = p3Page.locator('button:has-text("过牌")');
      await expect(passBtn).toBeVisible({ timeout: 10000 });
      await passBtn.click();
      console.log('Player 3 Passed');
    });

    await test.step('Turn Rotates to Player 4 (Pass)', async () => {
      const passBtn = p4Page.locator('button:has-text("过牌")');
      await expect(passBtn).toBeVisible({ timeout: 10000 });
      await passBtn.click();
      console.log('Player 4 Passed');
    });

    await test.step('Turn Returns to Host (New Trick)', async () => {
      // Host won the trick (everyone else passed)
      // Host should see "Play" button again
      // And importantly, the "Pass" button should NOT be visible or Host should know it's a new trick
      // (The UI might not hide Pass button if backend doesn't forbid it, but let's just check Play is enabled)
      
      const playBtn = hostPage.locator('button:has-text("出牌")');
      await expect(playBtn).toBeVisible({ timeout: 10000 });
      
      // Select a card again
      // We need to find a card that wasn't played. 
      // Since we just clicked the first one last time, let's click the first one again (it will be a different card)
      const firstCard = hostPage.locator('.cursor-pointer.transition-transform').first();
      await firstCard.click();
      
      await expect(playBtn).toBeEnabled();
      await playBtn.click();
      console.log('Host started new trick successfully');
      
      // Verify P2 sees the new play
      await expect(p2Page.locator('text=上一手：座位 0')).toBeVisible({ timeout: 10000 });
    });
  });
});
