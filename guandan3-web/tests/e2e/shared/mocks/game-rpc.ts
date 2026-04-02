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

    // 存储房间信息 - 同时存储到 mockRoomInfo 和 mockRooms
    (global as any).mockRoomInfo = newRoom;
    (global as any).isPracticeRoom = mode === 'pve1v3';

    // 存储到 mockRooms 数组，确保 GET /rooms 能找到它
    (global as any).mockRooms = (global as any).mockRooms || [];
    (global as any).mockRooms.push(newRoom);

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
    (global as any).currentSeat = 0; // 从人类玩家座位开始（座位0）
    (global as any).turnNo = 0;

    // 重置手牌
    setMockHandCards([...getMockHandCards()]);

    // 获取当前手牌（人类玩家，座位0）
    const currentHandCards = getMockHandCards();

    // 为所有4个座位生成手牌
    const generateAIHand = (seatNo: number) => {
      return Array.from({ length: 27 }, (_, i) => ({
        id: seatNo * 100 + i + 1,
        suit: ['S', 'H', 'D', 'C'][Math.floor((seatNo * 27 + i) / 13) % 4] as any,
        rank: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'][(seatNo * 27 + i) % 13] as any,
        val: 14 - ((seatNo * 27 + i) % 13),
      }));
    };

    // 初始化AI手牌
    (global as any).aiHands = {
      '1': generateAIHand(1),
      '2': generateAIHand(2),
      '3': generateAIHand(3),
    };

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          id: mockGameId,
          room_id: roomId,
          status: 'playing',
          turn_no: 0,
          current_seat: 0, // 从人类玩家座位开始（座位0）
          level_rank: 2,
          state_public: {
            counts: [27, 27, 27, 27],
            rankings: [],
            levelRank: 2,
          },
          state_private: {
            hands: {
              '0': currentHandCards,
              '1': (global as any).aiHands['1'],
              '2': (global as any).aiHands['2'],
              '3': (global as any).aiHands['3'],
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

    // 从全局变量获取当前状态，确保初始值正确
    let currentSeat = (global as any).currentSeat ?? 0;
    let turnNo = (global as any).turnNo ?? 0;

    // 初始化rankings数组
    if (!(global as any).rankings) {
      (global as any).rankings = [];
    }

    // 提取出牌信息
    const payload = postData?.p_payload || {};
    const playedCards = payload.cards || [];
    const actionType = payload?.type || 'pass';

    console.log(
      `Mock submit_turn: turnNo=${turnNo}, currentSeat=${currentSeat}, type=${actionType}, played=${playedCards.length}`
    );

    // 根据当前座位更新对应的手牌
    if (currentSeat === 0) {
      // 人类玩家 (座位0)
      let currentHandCards = getMockHandCards();
      currentHandCards = removeCardsFromHand(currentHandCards, playedCards);
      setMockHandCards(currentHandCards);
      console.log(
        `Updated seat 0 hand: ${currentHandCards.length} cards remaining`
      );

      // 检查人类玩家是否出完牌，加入排名
      const rankings = (global as any).rankings || [];
      if (currentHandCards.length === 0 && !rankings.includes(currentSeat)) {
        rankings.push(currentSeat);
        (global as any).rankings = rankings;
        console.log(`✅ 座位${currentSeat}出完牌，排名: ${rankings.length}`);
      }
    } else {
      // AI玩家 (座位1-3)
      if (!(global as any).aiHands) {
        (global as any).aiHands = {};
      }
      if (!(global as any).aiHands[currentSeat]) {
        // 如果还没有初始化AI手牌，先初始化
        (global as any).aiHands[currentSeat] = Array.from(
          { length: 27 },
          (_, i) => ({
            id: currentSeat * 100 + i + 1,
            suit: ['S', 'H', 'D', 'C'][
              Math.floor((currentSeat * 27 + i) / 13) % 4
            ] as any,
            rank: [
              'A',
              'K',
              'Q',
              'J',
              '10',
              '9',
              '8',
              '7',
              '6',
              '5',
              '4',
              '3',
              '2',
            ][(currentSeat * 27 + i) % 13] as any,
            val: 14 - ((currentSeat * 27 + i) % 13),
          })
        );
      }
      let aiHand = (global as any).aiHands[currentSeat];
      aiHand = removeCardsFromHand(aiHand, playedCards);
      (global as any).aiHands[currentSeat] = aiHand;
      console.log(
        `Updated seat ${currentSeat} AI hand: ${aiHand.length} cards remaining`
      );

      // 检查AI是否出完牌，加入排名
      const rankings = (global as any).rankings || [];
      if (aiHand.length === 0 && !rankings.includes(currentSeat)) {
        rankings.push(currentSeat);
        (global as any).rankings = rankings;
        console.log(`✅ 座位${currentSeat}出完牌，排名: ${rankings.length}`);
      }
    }

    // 更新游戏状态 - 轮转到下一个座位
    turnNo++;
    currentSeat = (currentSeat + 1) % 4;

    // 存储回全局变量
    (global as any).turnNo = turnNo;
    (global as any).currentSeat = currentSeat;

    console.log(
      `Mock submit_turn: next turnNo=${turnNo}, next currentSeat=${currentSeat}`
    );

    // 修复问题#29: 模拟所有AI玩家依次出牌，然后返回最终状态
    // 这样可以确保游戏状态正确更新，不需要依赖自定义事件
    if (currentSeat !== 0) {
      console.log(`Next seat is AI (${currentSeat}), simulating all AI turns...`);

      // 模拟所有AI玩家依次出牌
      let simTurnNo = turnNo;
      let simCurrentSeat = currentSeat;
      const aiTurnResults = [];

      // 模拟所有AI座位（1、2、3）依次出牌
      while (simCurrentSeat !== 0) {
        if (!(global as any).aiHands) {
          (global as any).aiHands = {};
        }
        if (!(global as any).aiHands[simCurrentSeat]) {
          (global as any).aiHands[simCurrentSeat] = Array.from(
            { length: 27 },
            (_, i) => ({
              id: simCurrentSeat * 100 + i + 1,
              suit: ['S', 'H', 'D', 'C'][
                Math.floor((simCurrentSeat * 27 + i) / 13) % 4
              ] as any,
              rank: [
                'A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'
              ][(simCurrentSeat * 27 + i) % 13] as any,
              val: 14 - ((simCurrentSeat * 27 + i) % 13),
            })
          );
        }

        let aiHand = (global as any).aiHands[simCurrentSeat];

        // 如果AI手牌已经是0，加入排名并跳过
        if (aiHand.length === 0) {
          const rankings = (global as any).rankings || [];
          if (!rankings.includes(simCurrentSeat)) {
            rankings.push(simCurrentSeat);
            (global as any).rankings = rankings;
            console.log(`✅ 座位${simCurrentSeat}已出完牌，排名: ${rankings.length}`);
          }
          // 移动到下一个座位
          simTurnNo++;
          simCurrentSeat = (simCurrentSeat + 1) % 4;
          continue;
        }

        const cardsToPlay = Math.min(Math.floor(Math.random() * 3) + 1, aiHand.length);
        const playedCards = aiHand.slice(0, cardsToPlay);

        // 更新手牌
        (global as any).aiHands[simCurrentSeat] = aiHand.slice(cardsToPlay);
        const newAiHand = (global as any).aiHands[simCurrentSeat];

        // 检查AI是否出完牌，加入排名
        const rankings = (global as any).rankings || [];
        if (newAiHand.length === 0 && !rankings.includes(simCurrentSeat)) {
          rankings.push(simCurrentSeat);
          (global as any).rankings = rankings;
          console.log(`✅ 座位${simCurrentSeat}出完牌，排名: ${rankings.length}`);
        }

        // 记录本次AI出牌结果
        aiTurnResults.push({
          seatNo: simCurrentSeat,
          cardsPlayed: cardsToPlay,
          remaining: newAiHand.length
        });

        console.log(`Mock AI ${simCurrentSeat} 出牌: ${playedCards.map((c: any) => c.val).join(',')}, 剩余: ${newAiHand.length}张`);

        // 移动到下一个座位
        simTurnNo++;
        simCurrentSeat = (simCurrentSeat + 1) % 4;
      }

      // 更新全局状态到最终状态（轮回到人类玩家）
      (global as any).turnNo = simTurnNo;
      (global as any).currentSeat = 0; // 轮回到人类玩家

      // 检查游戏是否结束
      const rankings = (global as any).rankings || [];
      const gameStatus = rankings.length >= 4 ? 'finished' : 'playing';

      // 返回最终的游戏状态（当前座位是0，人类玩家的回合）
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            turn_no: simTurnNo,
            current_seat: 0, // 人类玩家的回合
            status: gameStatus,
            rankings: rankings,
          },
        ]),
      });
      return;
    }

    // 检查游戏是否结束
    const rankings = (global as any).rankings || [];
    const gameStatus = rankings.length >= 4 ? 'finished' : 'playing';

    // 返回数组格式，与实际 RPC 一致
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          turn_no: turnNo,
          current_seat: currentSeat,
          status: gameStatus,
          rankings: rankings,
        },
      ]),
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
    const requestBody = route.request().postDataJSON();
    const seatNo = requestBody?.p_seat_no ?? 1;

    console.log(`Mocking Get AI Hand for seat ${seatNo}`);

    // 为每个座位维护独立的手牌状态
    if (!(global as any).aiHands) {
      (global as any).aiHands = {};
    }

    // 如果该座位还没有手牌，初始化它
    if (!(global as any).aiHands[seatNo]) {
      (global as any).aiHands[seatNo] = Array.from({ length: 27 }, (_, i) => ({
        id: seatNo * 100 + i + 1,
        suit: ['S', 'H', 'D', 'C'][
          Math.floor((seatNo * 27 + i) / 13) % 4
        ] as any,
        rank: [
          'A',
          'K',
          'Q',
          'J',
          '10',
          '9',
          '8',
          '7',
          '6',
          '5',
          '4',
          '3',
          '2',
        ][(seatNo * 27 + i) % 13] as any,
        val: 14 - ((seatNo * 27 + i) % 13),
      }));
    }

    const aiHandCards = (global as any).aiHands[seatNo] || [];

    console.log(
      `Mocking Get AI Hand: seat ${seatNo}, card count ${aiHandCards.length}`
    );

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
