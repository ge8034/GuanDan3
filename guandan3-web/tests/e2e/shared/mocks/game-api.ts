/**
 * 游戏API (games, game_hands, turns) 相关的mock设置
 */

import type { Page } from '@playwright/test';
import type { MockCard, MockGameHand, MockGame } from '../types';
import { getUrlParam, getMockHandCards } from '../helpers';

/**
 * 设置游戏API相关的mock
 */
export async function setupGameApiMocks(
  page: Page,
  userId: string = 'mock-user-id'
): Promise<void> {
  // GET /games - 获取游戏状态
  await page.route('**/rest/v1/games*', async (route) => {
    const url = route.request().url();

    if (route.request().method() === 'GET') {
      console.log('Mocking Get Games', url);

      if (url.includes('room_id=eq.')) {
        const roomId = getUrlParam(url, 'room_id');

        // 检查是否有 mockGameId（由 start_game RPC 设置）
        // 注意：查询现在包含 'deal' 状态，所以即使在 'deal' 状态也会返回游戏数据
        if (!(global as any).mockGameId) {
          // 练习房还没有开始游戏，返回空数组
          console.log('[Get Games] No game started yet, returning empty');
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([]),
          });
          return;
        }

        const currentHandCards = getMockHandCards();
        // 默认从人类玩家（座位0）开始
        const currentSeat = (global as any).currentSeat ?? 0;
        const turnNo = (global as any).turnNo ?? 0;

        // 获取排名和游戏状态
        const rankings = (global as any).rankings || [];
        const gameStatus = rankings.length >= 4 ? 'finished' : 'playing';

        console.log(
          `[Get Games] Returning game state: currentSeat=${currentSeat}, turnNo=${turnNo}, status=${gameStatus}, rankings=[${rankings.join(',')}]`
        );

        // 获取AI手牌
        const aiHands = (global as any).aiHands || {};

        // 计算当前手牌数量
        const counts = [
          currentHandCards.length,
          (aiHands['1'] || []).length,
          (aiHands['2'] || []).length,
          (aiHands['3'] || []).length,
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: (global as any).mockGameId || generateMockId('game'),
              room_id: roomId,
              status: gameStatus,
              turn_no: turnNo,
              current_seat: currentSeat,
              level_rank: 2,
              state_public: {
                counts: counts,
                rankings: rankings,
                levelRank: 2,
              },
              state_private: {
                hands: {
                  '0': currentHandCards,
                  '1': aiHands['1'] || [],
                  '2': aiHands['2'] || [],
                  '3': aiHands['3'] || [],
                },
              },
              created_at: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    } else {
      await route.continue();
    }
  });

  // GET /game_hands - 获取手牌数据
  await page.route('**/rest/v1/game_hands*', async (route) => {
    const url = route.request().url();

    if (route.request().method() === 'GET') {
      console.log('Mocking Get Game Hands', url);

      if (url.includes('game_id=eq.')) {
        const gameId = getUrlParam(url, 'game_id');
        const actualGameId = (global as any).mockGameId || gameId;
        const currentHandCards = getMockHandCards();

        console.log(`Current hand cards count: ${currentHandCards.length}`);

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            {
              id: 'hand-1',
              game_id: actualGameId,
              uid: userId, // 添加uid字段以匹配数据库schema
              hand: currentHandCards,
              updated_at: new Date().toISOString(),
            },
          ]),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
        });
      }
    } else {
      await route.continue();
    }
  });

  // GET /turns - 获取出牌记录
  await page.route('**/rest/v1/turns*', async (route) => {
    console.log('Mocking Get Turns');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([]),
    });
  });
}

/**
 * 生成唯一ID的辅助函数
 */
function generateMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
