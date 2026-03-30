/**
 * 游戏RPC相关的API mock设置
 */

import type { Page } from '@playwright/test';
import type { MockCard } from '../types';
import {
  generateMockId,
  getUrlParam,
  getMockHandCards,
  setMockHandCards,
} from '../helpers';
import { removeCardsFromHand } from '../mock-data';
import { PLAYER_SEAT } from '../types';

/**
 * 设置游戏RPC相关的API mock
 */
export async function setupGameRpcMocks(
  page: Page,
  userId: string = 'mock-user-id'
): Promise<void> {
  // 初始化游戏状态
  let currentSeat = 0;
  let turnNo = 0;

  // RPC: create_practice_room
  await page.route('**/rest/v1/rpc/create_practice_room', async (route) => {
    console.log('Mocking Create Practice Room RPC');
    const mockRoomId = generateMockId('room');

    // 设置练习房标志，确保后续API返回AI玩家
    (global as any).isPracticeRoom = true;

    // 存储房间数据到mockRooms，这样GET /rooms才能找到它
    const newRoom = {
      id: mockRoomId,
      name: '练习房',
      mode: 'pve1v3', // 与 useAutoStart 检查匹配
      type: 'classic',
      visibility: 'public' as const,
      status: 'open' as const,
      owner_uid: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    (global as any).mockRooms = (global as any).mockRooms || [];
    (global as any).mockRooms.push(newRoom);

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ room_id: mockRoomId }]),
    });
  });

  // RPC: create_room
  await page.route('**/rest/v1/rpc/create_room', async (route) => {
    console.log('Mocking Create Room RPC');
    const requestBody = route.request().postDataJSON();
    const mode = requestBody?.p_mode || 'pve1v3';

    const mockRoomId = generateMockId('room');

    // 创建房间对象
    const newRoom = {
      id: mockRoomId,
      name: requestBody?.p_name || 'Mock Room',
      mode,
      type: requestBody?.p_type || 'classic',
      visibility: requestBody?.p_visibility || 'public',
      status: 'open',
      owner_uid: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 存储房间信息
    (global as any).mockRoomInfo = newRoom;
    (global as any).isPracticeRoom = mode === 'pve1v3';

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockRoomId),
    });
  });

  // RPC: start_game
  await page.route('**/rest/v1/rpc/start_game', async (route) => {
    console.log('Mocking Start Game');
    const requestBody = route.request().postDataJSON();
    const roomId = requestBody?.p_room_id;

    const mockGameId = generateMockId('game');

    // 存储游戏信息
    (global as any).mockGameId = mockGameId;
    (global as any).mockRoomId = roomId;
    (global as any).currentSeat = 1; // 从 AI 座位开始
    (global as any).turnNo = 0;

    // 重置手牌
    setMockHandCards([...getMockHandCards()]);

    // 获取当前手牌
    const currentHandCards = getMockHandCards();

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: mockGameId,
          room_id: roomId,
          status: 'playing',
          turn_no: 0,
          current_seat: 1, // 从 AI 座位开始，让 AI 立即接管
          level_rank: 2,
          state_public: {
            counts: [27, 27, 27, 27],
            rankings: [],
            levelRank: 2,
          },
          state_private: {
            hands: {
              '0': currentHandCards,
            },
          },
          created_at: new Date().toISOString(),
        },
      ]),
    });
  });

  // RPC: submit_turn
  await page.route('**/rest/v1/rpc/submit_turn', async (route) => {
    const request = route.request();
    const postData = request.postDataJSON();
    console.log('Mocking Submit Turn with payload:', JSON.stringify(postData));

    // 从全局变量获取当前状态
    let currentSeat = (global as any).currentSeat || 1;
    let turnNo = (global as any).turnNo || 0;

    // 获取当前手牌
    let currentHandCards = getMockHandCards();

    // 提取出牌信息
    const payload = postData?.p_payload || {};
    const playedCards = payload.cards || [];

    console.log(
      `Played ${playedCards.length} cards, current hand size: ${currentHandCards.length}`
    );

    // 移除已打出的牌
    currentHandCards = removeCardsFromHand(currentHandCards, playedCards);
    setMockHandCards(currentHandCards);

    // 如果没有出牌，移除第一张（回退逻辑）
    if (playedCards.length === 0 && currentHandCards.length > 0) {
      currentHandCards.shift();
      setMockHandCards(currentHandCards);
    }

    // 更新游戏状态
    turnNo++;
    currentSeat = (currentSeat + 1) % 4;

    // 存储回全局变量
    (global as any).turnNo = turnNo;
    (global as any).currentSeat = currentSeat;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        game_id: (global as any).mockGameId,
        turn_no: turnNo,
        current_seat: currentSeat,
      }),
    });
  });

  // RPC: heartbeat_room_member
  await page.route('**/rest/v1/rpc/heartbeat_room_member', async (route) => {
    console.log('Mocking Heartbeat Room Member');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  // RPC: toggle_ready
  await page.route('**/rest/v1/rpc/toggle_ready', async (route) => {
    console.log('Mocking Toggle Ready');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  // RPC: leave_room
  await page.route('**/rest/v1/rpc/leave_room', async (route) => {
    console.log('Mocking Leave Room');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  // RPC: add_ai
  await page.route('**/rest/v1/rpc/add_ai', async (route) => {
    console.log('Mocking Add AI');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(null),
    });
  });

  // RPC: get_ai_hand - 为 AI 返回手牌
  await page.route('**/rest/v1/rpc/get_ai_hand', async (route) => {
    console.log('Mocking Get AI Hand');
    const requestBody = route.request().postDataJSON();
    const seatNo = requestBody?.p_seat_no ?? 1;

    // 为每个 AI 座位生成不同的手牌
    const aiHandCards = Array.from({ length: 27 }, (_, i) => ({
      id: seatNo * 100 + i + 1,
      suit: ['S', 'H', 'D', 'C'][Math.floor((seatNo * 27 + i) / 13) % 4] as any,
      rank: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'][
        (seatNo * 27 + i) % 13
      ] as any,
      val: 14 - ((seatNo * 27 + i) % 13),
    }));

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(aiHandCards),
    });
  });

  // RPC: get_turns_since
  await page.route('**/rest/v1/rpc/get_turns_since', async (route) => {
    console.log('Mocking Get Turns Since');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}
