/**
 * 验证 last_payload 获取逻辑的集成测试
 *
 * 测试场景：seat 1 出牌 → seat 2,3,0 都过牌 → seat 1 再次出牌
 * 验证：seat 1 的第二次出牌与自己的第一次出牌比较，而不是与 seat 0 的 pass 比较
 *
 * 2026-04-01
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 测试配置
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

describe('last_payload 验证集成测试', () => {
  let supabase: SupabaseClient;
  let testRoomId: string;
  let testGameId: string;
  let userId1: string;
  let userId2: string;
  let userId3: string;
  let userId4: string;

  beforeAll(async () => {
    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // 创建测试用户
    const users = await Promise.all([
      createTestUser(supabase, 'test_user_1'),
      createTestUser(supabase, 'test_user_2'),
      createTestUser(supabase, 'test_user_3'),
      createTestUser(supabase, 'test_user_4'),
    ]);

    userId1 = users[0];
    userId2 = users[1];
    userId3 = users[2];
    userId4 = users[3];
  });

  afterAll(async () => {
    // 清理测试数据
    if (testGameId) {
      await supabase.from('turns').delete().eq('game_id', testGameId);
      await supabase.from('game_hands').delete().eq('game_id', testGameId);
      await supabase.from('games').delete().eq('id', testGameId);
    }
    if (testRoomId) {
      await supabase.from('room_members').delete().eq('room_id', testRoomId);
      await supabase.from('rooms').delete().eq('id', testRoomId);
    }
  });

  it('场景：seat 1 出牌后其他玩家过牌，seat 1 再次出牌应与自己的第一次出牌比较', async () => {
    // 1. 创建测试房间
    const { data: room, error: roomError } = await supabase
      .from('rooms')
      .insert({
        name: '测试房间 - last_payload 验证',
        room_type: 'pvp4',
        max_players: 4,
        status: 'waiting',
      })
      .select()
      .single();

    expect(roomError).toBeNull();
    testRoomId = room.id;

    // 2. 添加4个玩家到房间
    const { error: membersError } = await supabase
      .from('room_members')
      .insert([
        { room_id: testRoomId, uid: userId1, seat_no: 0, member_type: 'human', status: 'ready' },
        { room_id: testRoomId, uid: userId2, seat_no: 1, member_type: 'human', status: 'ready' },
        { room_id: testRoomId, uid: userId3, seat_no: 2, member_type: 'human', status: 'ready' },
        { room_id: testRoomId, uid: userId4, seat_no: 3, member_type: 'human', status: 'ready' },
      ]);

    expect(membersError).toBeNull();

    // 3. 创建游戏
    const { data: game, error: gameError } = await supabase
      .from('games')
      .insert({
        room_id: testRoomId,
        level_rank: 2,
        current_seat: 1, // seat 1 先出牌
        turn_no: 0,
        status: 'playing',
        state_private: {
          hands: {
            '0': [{ id: 101, suit: 'S', rank: '3', val: 3 }, { id: 102, suit: 'S', rank: '4', val: 4 }],
            '1': [
              // seat 1 的手牌 - 包含一对4和一对5
              { id: 201, suit: 'H', rank: '4', val: 4 },
              { id: 202, suit: 'D', rank: '4', val: 4 },
              { id: 203, suit: 'H', rank: '5', val: 5 },
              { id: 204, suit: 'D', rank: '5', val: 5 },
            ],
            '2': [{ id: 301, suit: 'C', rank: '3', val: 3 }, { id: 302, suit: 'C', rank: '4', val: 4 }],
            '3': [{ id: 401, suit: 'D', rank: '3', val: 3 }, { id: 402, suit: 'D', rank: '4', val: 4 }],
          },
        },
        state_public: {
          counts: [2, 4, 2, 2],
          rankings: [],
        },
      })
      .select()
      .single();

    expect(gameError).toBeNull();
    testGameId = game.id;

    // 4. seat 1 出一对4 (turn_no = 0)
    const actionId1 = crypto.randomUUID();
    const { error: turn1Error } = await supabase.rpc('submit_turn', {
      p_game_id: testGameId,
      p_action_id: actionId1,
      p_expected_turn_no: 0,
      p_payload: {
        type: 'play',
        cards: [
          { id: 201, suit: 'H', rank: '4', val: 4 },
          { id: 202, suit: 'D', rank: '4', val: 4 },
        ],
      },
    });

    expect(turn1Error).toBeNull();

    // 验证 seat 1 手牌减少
    const { data: gameAfter1 } = await supabase
      .from('games')
      .select('state_private, state_public')
      .eq('id', testGameId)
      .single();

    expect(gameAfter1?.state_public?.counts?.[1]).toBe(2); // seat 1 剩2张牌

    // 5. seat 2 过牌 (turn_no = 1)
    const { error: turn2Error } = await supabase.rpc('submit_turn', {
      p_game_id: testGameId,
      p_action_id: crypto.randomUUID(),
      p_expected_turn_no: 1,
      p_payload: { type: 'pass', cards: [] },
    });

    expect(turn2Error).toBeNull();

    // 6. seat 3 过牌 (turn_no = 2)
    const { error: turn3Error } = await supabase.rpc('submit_turn', {
      p_game_id: testGameId,
      p_action_id: crypto.randomUUID(),
      p_expected_turn_no: 2,
      p_payload: { type: 'pass', cards: [] },
    });

    expect(turn3Error).toBeNull();

    // 7. seat 0 过牌 (turn_no = 3)
    const { error: turn4Error } = await supabase.rpc('submit_turn', {
      p_game_id: testGameId,
      p_action_id: crypto.randomUUID(),
      p_expected_turn_no: 3,
      p_payload: { type: 'pass', cards: [] },
    });

    expect(turn4Error).toBeNull();

    // 8. 关键测试：seat 1 出一对5，应该与自己的一对4比较，允许通过
    const actionId5 = crypto.randomUUID();
    const { error: turn5Error } = await supabase.rpc('submit_turn', {
      p_game_id: testGameId,
      p_action_id: actionId5,
      p_expected_turn_no: 4,
      p_payload: {
        type: 'play',
        cards: [
          { id: 203, suit: 'H', rank: '5', val: 5 },
          { id: 204, suit: 'D', rank: '5', val: 5 },
        ],
      },
    });

    // 这里的关键：迁移修复后，seat 1 的第二次出牌应该与自己的第一次出牌（一对4）比较
    // 一对5 > 一对4，应该允许通过
    expect(turn5Error).toBeNull();

    // 9. 验证最终状态
    const { data: gameFinal } = await supabase
      .from('games')
      .select('state_private, state_public, turn_no, current_seat')
      .eq('id', testGameId)
      .single();

    expect(gameFinal?.turn_no).toBe(5);
    expect(gameFinal?.current_seat).toBe(2); // 轮到 seat 2
    expect(gameFinal?.state_public?.counts?.[1]).toBe(0); // seat 1 出完所有牌

    // 10. 验证所有 turn 记录
    const { data: turns } = await supabase
      .from('turns')
      .select('*')
      .eq('game_id', testGameId)
      .order('turn_no');

    expect(turns).toHaveLength(5);
    expect(turns?.[0].payload).toMatchObject({ type: 'play' }); // seat 1 出一对4
    expect(turns?.[1].payload).toMatchObject({ type: 'pass' }); // seat 2 过
    expect(turns?.[2].payload).toMatchObject({ type: 'pass' }); // seat 3 过
    expect(turns?.[3].payload).toMatchObject({ type: 'pass' }); // seat 0 过
    expect(turns?.[4].payload).toMatchObject({ type: 'play' }); // seat 1 出一对5
  });

  it('场景：seat 1 出一对6后过一轮，再次出牌应该比一对6大', async () => {
    // 这是一个反向测试：验证非法出牌被正确拒绝
    // seat 1 出一对6 → 其他过牌 → seat 1 出一对5（应该失败，因为5<6）

    // 1. 创建新游戏
    const { data: game2, error: game2Error } = await supabase
      .from('games')
      .insert({
        room_id: testRoomId,
        level_rank: 2,
        current_seat: 1,
        turn_no: 0,
        status: 'playing',
        state_private: {
          hands: {
            '0': [{ id: 101, suit: 'S', rank: '3', val: 3 }],
            '1': [
              { id: 201, suit: 'H', rank: '6', val: 6 },
              { id: 202, suit: 'D', rank: '6', val: 6 },
              { id: 203, suit: 'H', rank: '5', val: 5 },
              { id: 204, suit: 'D', rank: '5', val: 5 },
            ],
            '2': [{ id: 301, suit: 'C', rank: '3', val: 3 }],
            '3': [{ id: 401, suit: 'D', rank: '3', val: 3 }],
          },
        },
        state_public: {
          counts: [1, 4, 1, 1],
          rankings: [],
        },
      })
      .select()
      .single();

    expect(game2Error).toBeNull();
    const game2Id = game2!.id;

    try {
      // 2. seat 1 出一对6
      const { error: turn1Error } = await supabase.rpc('submit_turn', {
        p_game_id: game2Id,
        p_action_id: crypto.randomUUID(),
        p_expected_turn_no: 0,
        p_payload: {
          type: 'play',
          cards: [
            { id: 201, suit: 'H', rank: '6', val: 6 },
            { id: 202, suit: 'D', rank: '6', val: 6 },
          ],
        },
      });

      expect(turn1Error).toBeNull();

      // 3. 其他玩家过牌
      for (let i = 1; i <= 3; i++) {
        await supabase.rpc('submit_turn', {
          p_game_id: game2Id,
          p_action_id: crypto.randomUUID(),
          p_expected_turn_no: i,
          p_payload: { type: 'pass', cards: [] },
        });
      }

      // 4. seat 1 出一对5 - 应该失败，因为5 < 6
      const { error: turn5Error } = await supabase.rpc('submit_turn', {
        p_game_id: game2Id,
        p_action_id: crypto.randomUUID(),
        p_expected_turn_no: 4,
        p_payload: {
          type: 'play',
          cards: [
            { id: 203, suit: 'H', rank: '5', val: 5 },
            { id: 204, suit: 'D', rank: '5', val: 5 },
          ],
        },
      });

      // 修复后：应该返回错误，因为 last_payload 是一对6，而一对5 < 一对6
      expect(turn5Error).not.toBeNull();
      expect(turn5Error?.message).toContain('invalid_move');
    } finally {
      // 清理
      await supabase.from('turns').delete().eq('game_id', game2Id);
      await supabase.from('game_hands').delete().eq('game_id', game2Id);
      await supabase.from('games').delete().eq('id', game2Id);
    }
  });

  it('场景：第一轮出牌时没有 last_payload，应该允许任意出牌', async () => {
    // 验证 turn_no = 0 时，没有 last_payload，任何出牌都允许
    const { data: game3, error: game3Error } = await supabase
      .from('games')
      .insert({
        room_id: testRoomId,
        level_rank: 2,
        current_seat: 0,
        turn_no: 0,
        status: 'playing',
        state_private: {
          hands: {
            '0': [{ id: 101, suit: 'S', rank: '3', val: 3 }],
            '1': [{ id: 201, suit: 'H', rank: '4', val: 4 }],
            '2': [{ id: 301, suit: 'C', rank: '5', val: 5 }],
            '3': [{ id: 401, suit: 'D', rank: '6', val: 6 }],
          },
        },
        state_public: {
          counts: [1, 1, 1, 1],
          rankings: [],
        },
      })
      .select()
      .single();

    expect(game3Error).toBeNull();
    const game3Id = game3!.id;

    try {
      // 第一轮出牌，没有 last_payload
      const { error: turnError } = await supabase.rpc('submit_turn', {
        p_game_id: game3Id,
        p_action_id: crypto.randomUUID(),
        p_expected_turn_no: 0,
        p_payload: {
          type: 'play',
          cards: [{ id: 101, suit: 'S', rank: '3', val: 3 }],
        },
      });

      expect(turnError).toBeNull();
    } finally {
      // 清理
      await supabase.from('turns').delete().eq('game_id', game3Id);
      await supabase.from('games').delete().eq('id', game3Id);
    }
  });
});

/**
 * 创建测试用户的辅助函数
 */
async function createTestUser(supabase: SupabaseClient, email: string): Promise<string> {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: 'test123456',
    email_confirm: true,
  });

  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  return data.user.id;
}
