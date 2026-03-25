import type { Page } from '@playwright/test';

export async function setupGameMocks(page: Page, userId: string = 'mock-user-id') {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
  const payload = Buffer.from(JSON.stringify({
    aud: 'authenticated',
    exp: Math.floor(Date.now() / 1000) + 3600,
    sub: userId,
    email: 'mock@example.com',
    role: 'authenticated'
  })).toString('base64');
  const signature = 'mock-signature';
  const validToken = `${header}.${payload}.${signature}`;

  // Track game state for dynamic responses
  let currentSeat = 0;
  let turnNo = 0;

  // Initialize global room storage if not exists
  if (!(global as any).mockRooms) {
    (global as any).mockRooms = [];
  }

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
          id: userId,
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

  await page.route('**/rest/v1/rpc/create_room', async route => {
    console.log('Mocking Create Room RPC');
    const mockRoomId = 'mock-room-id-' + Date.now();
    
    // Parse request body to determine room mode
    const requestBody = route.request().postDataJSON();
    const mode = requestBody?.p_mode || 'pve1v3';
    const type = requestBody?.p_type || 'classic';
    const visibility = requestBody?.p_visibility || 'public';
    const name = requestBody?.p_name || 'Mock Room';
    
    // Create room object
    const newRoom = {
      id: mockRoomId,
      name: name,
      mode: mode,
      type: type,
      visibility: visibility,
      status: 'open',
      owner_uid: 'mock-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      room_members: [
        { id: `member-${mockRoomId}-0`, room_id: mockRoomId, seat_no: 0, uid: 'mock-user-id', member_type: 'human', ready: true, online: true }
      ]
    };
    
    // Store room info for later use in GET requests
    (global as any).mockRoomInfo = newRoom;
    
    // Add to global room list for other players to see
    if (!(global as any).mockRooms) {
      (global as any).mockRooms = [];
    }
    (global as any).mockRooms.push(newRoom);
    
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRoomId)
    });
  });

  await page.route('**/rest/v1/rooms*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Rooms', url);
      if (url.includes('id=eq.')) {
        const roomId = url.split('id=eq.')[1]?.split('&')[0];
        
        // Use stored room info if available, otherwise use defaults
        const roomInfo = (global as any).mockRoomInfo || {
          id: roomId || 'mock-room-id',
          name: 'Mock Practice Room',
          status: 'open',
          mode: 'pve1v3',
          type: 'classic',
          visibility: 'private',
          owner_uid: 'mock-user-id',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([roomInfo])
        });
      } else {
        // Return dynamic rooms from global storage plus some default rooms
        const dynamicRooms = (global as any).mockRooms || [];
        const defaultRooms = [
          {
            id: 'mock-room-1',
            name: 'Mock Room 1',
            status: 'open',
            mode: 'pvp4',
            type: 'classic',
            visibility: 'public',
            owner_uid: 'mock-user-id',
            created_at: new Date(Date.now() - 100000).toISOString(),
            updated_at: new Date(Date.now() - 100000).toISOString(),
            room_members: [
              { id: 'member-1', room_id: 'mock-room-1', seat_no: 0, uid: 'mock-user-id', member_type: 'human', ready: true, online: true },
              { id: 'member-2', room_id: 'mock-room-1', seat_no: 1, uid: null, member_type: 'ai', ready: true, online: true, ai_key: 'ai-1' }
            ]
          },
          {
            id: 'mock-room-2',
            name: 'Mock Room 2',
            status: 'open',
            mode: 'pvp4',
            type: 'classic',
            visibility: 'public',
            owner_uid: 'mock-user-id',
            created_at: new Date(Date.now() - 200000).toISOString(),
            updated_at: new Date(Date.now() - 200000).toISOString(),
            room_members: [
              { id: 'member-3', room_id: 'mock-room-2', seat_no: 0, uid: 'mock-user-id', member_type: 'human', ready: true, online: true },
              { id: 'member-4', room_id: 'mock-room-2', seat_no: 1, uid: null, member_type: 'ai', ready: true, online: true, ai_key: 'ai-2' }
            ]
          }
        ];
        
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([...dynamicRooms, ...defaultRooms])
        });
      }
    } else if (route.request().method() === 'POST') {
      console.log('Mocking Create Room');
      const reqBody = route.request().postDataJSON();
      const mockRoomId = 'mock-room-id-' + Date.now();
      
      // Check if this is a practice room
      const isPractice = reqBody.is_practice || reqBody.mode === 'practice';
      (global as any).isPracticeRoom = isPractice;
      
      // Create room object
      const newRoom = {
        id: mockRoomId,
        name: reqBody.name || 'Mock Room',
        status: 'open',
        mode: isPractice ? 'practice' : 'pvp4',
        type: 'classic',
        visibility: 'public',
        owner_uid: 'mock-user-id',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        room_members: [
          { id: `member-${mockRoomId}-0`, room_id: mockRoomId, seat_no: 0, uid: 'mock-user-id', member_type: 'human', ready: true, online: true }
        ]
      };
      
      // Add to global room list
      (global as any).mockRooms.push(newRoom);
      
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([newRoom])
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
        
        // Check if this is a practice room (has AI members)
        const isPracticeRoom = url.includes('practice') || (global as any).isPracticeRoom;
        
        if (isPracticeRoom) {
          // Practice room: return host + 3 AI members
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
          // Regular room: return only host initially
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { id: 'member-1', room_id: roomId, seat_no: 0, uid: 'mock-user-id', member_type: 'human', ready: true, online: true }
            ])
          });
        }
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([])
        });
      }
    } else if (route.request().method() === 'POST') {
      console.log('Mocking Add Room Member');
      const reqBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'member-p2',
          room_id: reqBody.room_id,
          seat_no: 1,
          uid: 'mock-user-id-2',
          member_type: 'human',
          ready: false,
          online: true
        }])
      });
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
    const roomId = route.request().postDataJSON()?.p_room_id;

    // Store game info for later use
    (global as any).mockGameId = mockGameId;
    (global as any).mockRoomId = roomId;

    // Get current hand cards
    const currentHandCards = (global as any).mockHandCards || handCards;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        id: mockGameId,
        room_id: roomId,
        status: 'playing',
        turn_no: 0,
        current_seat: 0,
        level_rank: 2,
        state_public: {
          counts: [27, 27, 27, 27],
          rankings: [],
          levelRank: 2
        },
        state_private: {
          hands: {
            '0': currentHandCards  // 座位0的手牌
          }
        },
        created_at: new Date().toISOString()
      }])
    });
  });

  await page.route('**/rest/v1/rpc/submit_turn', async route => {
    const request = route.request();
    const postData = request.postDataJSON();
    console.log('Mocking Submit Turn with payload:', JSON.stringify(postData));

    // Get current hand cards from global state
    const currentHandCards = (global as any).mockHandCards || handCards;

    // Extract cards from payload
    const payload = postData?.p_payload || {};
    const playedCards = payload.cards || [];

    console.log(`Played ${playedCards.length} cards, current hand size: ${currentHandCards.length}`);

    // Remove played cards from hand
    playedCards.forEach((playedCard: any) => {
      const index = currentHandCards.findIndex((c: { id: number }) => c.id === playedCard.id);
      if (index !== -1) {
        const removedCard = currentHandCards.splice(index, 1)[0];
        console.log(`Removed card: ${removedCard.rank}${removedCard.suit}, remaining: ${currentHandCards.length}`);
      }
    });

    // If no specific cards were played (fallback), remove first card
    if (playedCards.length === 0 && currentHandCards.length > 0) {
      const removedCard = currentHandCards.shift();
      console.log(`Fallback - Removed first card: ${removedCard.rank}${removedCard.suit}, remaining: ${currentHandCards.length}`);
    }

    // Update game state
    turnNo++;
    currentSeat = (currentSeat + 1) % 4;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{
        turn_no: turnNo,
        current_seat: currentSeat,
        status: 'playing',
        last_play: {
          seat: (currentSeat + 3) % 4, // Previous seat
          cards: playedCards.length > 0 ? playedCards : [{ suit: 'S', rank: 'A', val: 14 }]
        }
      }])
    });

    // Trigger game state update to refresh the UI
    setTimeout(async () => {
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('game-state-update'));
        window.dispatchEvent(new Event('storage'));
      });
    }, 50);
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
        // Get current hand cards from global state
        const currentHandCards = (global as any).mockHandCards || handCards;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: (global as any).mockGameId || 'mock-game-id-' + Date.now(),
            room_id: roomId,
            status: 'playing',
            turn_no: turnNo,
            current_seat: currentSeat,
            level_rank: 2,
            state_public: {
              counts: [27, 27, 27, 27],
              rankings: [],
              levelRank: 2
            },
            state_private: {
              hands: {
                '0': currentHandCards  // 座位0的手牌
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

  // Track hand state for dynamic responses
  let handCards = [
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

  // Store handCards in global for cross-function access
  (global as any).mockHandCards = handCards;

  await page.route('**/rest/v1/game_hands*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Game Hands', url);
      if (url.includes('game_id=eq.')) {
        const gameId = url.split('game_id=eq.')[1]?.split('&')[0];
        // Use stored game ID if available
        const actualGameId = (global as any).mockGameId || gameId;

        // Get current hand cards from global state
        const currentHandCards = (global as any).mockHandCards || handCards;
        console.log(`Current hand cards count: ${currentHandCards.length}`);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([{
            id: 'hand-1',
            game_id: actualGameId,
            uid: userId,  // 添加 uid 字段
            hand: currentHandCards,
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

  await page.route('**/rest/v1/turns*', async route => {
    console.log('Mocking Get Turns');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([])
    });
  });

  await page.route('**/rest/v1/chat_messages*', async route => {
    const url = route.request().url();
    if (route.request().method() === 'GET') {
      console.log('Mocking Get Chat Messages', url);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([])
      });
    } else if (route.request().method() === 'POST') {
      console.log('Mocking Create Chat Message');
      const reqBody = route.request().postDataJSON();
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'chat-msg-' + Date.now(),
          room_id: reqBody.room_id,
          uid: 'mock-user-id',
          message: reqBody.message,
          created_at: new Date().toISOString()
        }])
      });
    } else {
      await route.continue();
    }
  });
}
