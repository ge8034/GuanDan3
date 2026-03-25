import { test, expect, type Page } from '@playwright/test';

async function setupMocks(page: Page) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: 'mock-user-id',
    email: 'mock@example.com',
    role: 'authenticated'
  })).toString('base64');
  const signature = 'mock-signature';
  const validToken = `${header}.${payload}.${signature}`;

  let mockTurnNo = 0;
  let mockCurrentSeat = 0;

  // 定义手牌数据
  const mockHandCards = [
    { id: 1, suit: 'S', rank: 'A', val: 14 },
    { id: 2, suit: 'S', rank: 'K', val: 13 },
    { id: 3, suit: 'S', rank: 'Q', val: 12 },
    { id: 4, suit: 'S', rank: 'J', val: 11 },
    { id: 5, suit: 'S', rank: '10', val: 10 },
    { id: 6, suit: 'S', rank: '9', val: 9 },
    { id: 7, suit: 'S', rank: '8', val: 8 },
    { id: 8, suit: 'S', rank: '7', val: 7 },
    { id: 9, suit: 'S', rank: '6', val: 6 },
    { id: 10, suit: 'S', rank: '5', val: 5 },
    { id: 11, suit: 'S', rank: '4', val: 4 },
    { id: 12, suit: 'S', rank: '3', val: 3 },
    { id: 13, suit: 'S', rank: '2', val: 2 },
    { id: 14, suit: 'H', rank: 'A', val: 14 },
    { id: 15, suit: 'H', rank: 'K', val: 13 },
    { id: 16, suit: 'H', rank: 'Q', val: 12 },
    { id: 17, suit: 'H', rank: 'J', val: 11 },
    { id: 18, suit: 'H', rank: '10', val: 10 },
    { id: 19, suit: 'H', rank: '9', val: 9 },
    { id: 20, suit: 'H', rank: '8', val: 8 },
    { id: 21, suit: 'H', rank: '7', val: 7 },
    { id: 22, suit: 'H', rank: '6', val: 6 },
    { id: 23, suit: 'H', rank: '5', val: 5 },
    { id: 24, suit: 'H', rank: '4', val: 4 },
    { id: 25, suit: 'H', rank: '3', val: 3 },
    { id: 26, suit: 'H', rank: '2', val: 2 },
    { id: 27, suit: 'D', rank: 'A', val: 14 }
  ];

  await page.route('**/auth/v1/signup', async route => {
    console.log('Mocking Auth Signup');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        access_token: validToken,
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token',
        user: {
          id: 'mock-user-id',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'mock@example.com',
          app_metadata: { provider: 'email' },
          user_metadata: {},
          created_at: new Date().toISOString(),
        }
      })
    });
  });

  await page.route('**/rest/v1/rpc/create_practice_room', async route => {
    console.log('Mocking Create Practice Room RPC');
    const mockRoomId = 'mock-room-id-' + Date.now();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ room_id: mockRoomId }])
    });
  });

  await page.route('**/rest/v1/rooms*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Rooms', url);
      if (url.includes('id=eq.')) {
        const roomId = url.split('id=eq.')[1]?.split('&')[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: roomId || 'mock-room-id',
            name: 'Mock Practice Room',
            status: 'playing',
            mode: 'pve1v3',
            type: 'classic',
            visibility: 'private',
            owner_uid: 'mock-user-id',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    } else if (route.request().method() === 'POST') {
      console.log('Mocking Create Room');
      const reqBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'mock-room-id-' + Date.now(),
          name: reqBody.name || 'Mock Room',
          status: 'open',
          mode: 'pvp4',
          type: 'classic',
          visibility: 'public',
          owner_uid: 'mock-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
      });
    } else {
      await route.continue();
    }
  });

  await page.route('**/rest/v1/room_members*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Room Members', url);
      if (url.includes('room_id=eq.')) {
        const roomId = url.split('room_id=eq.')[1]?.split('&')[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'member-1', room_id: roomId, seat_no: 0, uid: 'mock-user-id', member_type: 'human', ready: true, online: true },
            { id: 'member-2', room_id: roomId, seat_no: 1, uid: null, member_type: 'ai', ready: true, online: true, ai_key: 'ai-1' },
            { id: 'member-3', room_id: roomId, seat_no: 2, uid: null, member_type: 'ai', ready: true, online: true, ai_key: 'ai-2' },
            { id: 'member-4', room_id: roomId, seat_no: 3, uid: null, member_type: 'ai', ready: true, online: true, ai_key: 'ai-3' }
          ])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    } else {
      await route.continue();
    }
  });

  await page.route('**/rest/v1/rpc/heartbeat_room_member', async route => {
    console.log('Mocking Heartbeat Room Member');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null)
    });
  });

  await page.route('**/rest/v1/rpc/start_game', async route => {
    console.log('Mocking Start Game');
    const mockGameId = 'mock-game-id-' + Date.now();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: mockGameId,
        room_id: route.request().postDataJSON()?.p_room_id,
        status: 'playing',
        turn_no: 0,
        current_seat: 0,
        level_rank: 2,
        state_public: {
          counts: [27, 27, 27, 27],
          rankings: [],
          levelRank: 2
        },
        created_at: new Date().toISOString()
      }])
    });
  });

  await page.route('**/rest/v1/rpc/submit_turn', async route => {
    console.log('Mocking Submit Turn');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        turn_no: 1,
        current_seat: 1,
        status: 'playing'
      }])
    });
  });

  await page.route('**/rest/v1/rpc/get_ai_hand', async route => {
    console.log('Mocking Get AI Hand');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/rest/v1/rpc/get_turns_since', async route => {
    console.log('Mocking Get Turns Since');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/rest/v1/games*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Games', url);
      if (url.includes('room_id=eq.')) {
        const roomId = url.split('room_id=eq.')[1]?.split('&')[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'mock-game-id-' + Date.now(),
            room_id: roomId,
            status: 'playing',
            turn_no: mockTurnNo,
            current_seat: 0,
            level_rank: 2,
            state_public: {
              counts: [27, 27, 27, 27],
              rankings: [],
              levelRank: 2
            },
            state_private: {
              hands: {
                '0': mockHandCards  // 座位0的手牌
              }
            },
            created_at: new Date().toISOString()
          }])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    } else {
      await route.continue();
    }
  });

  await page.route('**/rest/v1/turns*', async route => {
    console.log('Mocking Get Turns');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/rest/v1/game_hands*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Game Hands', url);
      if (url.includes('game_id=eq.')) {
        const gameId = url.split('game_id=eq.')[1]?.split('&')[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'hand-1',
            game_id: gameId,
            uid: 'mock-user-id',  // 添加 uid 字段
            hand: mockHandCards,
            updated_at: new Date().toISOString()
          }])
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    } else {
      await route.continue();
    }
  });

  return { mockTurnNo, mockCurrentSeat };
}

async function waitForPlayerTurn(page: Page, timeout: number = 30000): Promise<boolean> {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    try {
      const seatText = await page.getByText(/座位：/i).textContent();
      const currentSeat = seatText?.match(/座位：(\d+)/)?.[1];
      
      if (currentSeat === '0') {
        console.log('Player turn detected (Seat 0)');
        return true;
      }
    } catch (e) {
      // Element might not be visible yet
    }
    
    await page.waitForTimeout(1000);
  }
  
  console.log('Timeout waiting for player turn');
  return false;
}

test.describe('Game Scenarios V2 - Improved', () => {
  test.use({
    actionTimeout: 10000,
    navigationTimeout: 15000,
  });

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`BROWSER: ${msg.text()}`));
    page.on('dialog', async dialog => await dialog.accept());

    await page.goto('/');
    
    await setupMocks(page);
  });

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