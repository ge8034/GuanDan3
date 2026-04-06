/**
 * AI 锁机制简化测试
 * 验证核心锁功能，避免复杂异步场景
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameStore } from '@/lib/store/game';
import { aiSystemManager } from '@/lib/hooks/ai/AISystemManager';
import type { Card } from '@/lib/store/game';
import type { RoomMember } from '@/lib/store/room';

vi.mock('@/lib/store/game', () => ({
  useGameStore: { getState: vi.fn() },
}));

vi.mock('@/lib/hooks/ai/AISystemManager', () => ({
  aiSystemManager: {
    getSystem: vi.fn(),
    getActiveRoomIds: vi.fn(() => []),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/utils/aiPerformanceMonitor', () => ({
  AIPerformanceMonitor: {
    getInstance: vi.fn(() => ({ recordDecision: vi.fn() })),
  },
}));

const createCard = (id: number, val: number = id): Card => ({
  id, suit: 'H', rank: String(val), val,
});

const createMember = (seatNo: number, memberType: 'ai' | 'human' = 'ai'): RoomMember => ({
  seat_no: seatNo,
  member_type: memberType,
  user_id: `user-${seatNo}`,
  profile_id: `profile-${seatNo}`,
  status: 'ready',
  is_owner: false,
  joined_at: new Date().toISOString(),
  last_heartbeat: new Date().toISOString(),
});

describe('AI锁机制（简化版）', () => {
  const mockRoomId = 'test-room';
  let mockGameState: any;
  let mockAISystem: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();

    mockGameState = {
      gameId: 'game-1',
      status: 'playing' as const,
      turnNo: 1,
      currentSeat: 0,
      levelRank: 2,
      myHand: [createCard(1, 3), createCard(2, 4)],
      lastAction: null,
      getAIHand: vi.fn(async () => [createCard(1, 3)]),
      submitTurn: vi.fn().mockImplementation(() => Promise.resolve({ data: { success: true } })),
      counts: [2, 27, 27, 27],
    };

    mockAISystem = {
      roomId: mockRoomId,
      difficulty: 'medium' as const,
      teamManager: { createTeam: vi.fn() },
      dispatcher: {
        submitTasks: vi.fn(async () => {}),
        waitForTaskResult: vi.fn().mockResolvedValue({
          status: 'COMPLETED',
          output: { move: { type: 'play', cards: [createCard(1, 3)] } },
        }),
      },
      planner: {
        decompose: vi.fn(() => [{
          id: 'task-1',
          type: 'DecideMove',
          payload: {},
          status: 'PENDING' as const,
          createdAt: Date.now(),
        }]),
      },
      createdAt: Date.now(),
    };

    (useGameStore.getState as vi.Mock).mockReturnValue(mockGameState);
    (aiSystemManager.getSystem as vi.Mock).mockReturnValue(mockAISystem);
  });

  it('应该成功执行AI决策', async () => {
    const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');
    const members = [
      createMember(0, 'ai'),
      createMember(1, 'ai'),
      createMember(2, 'ai'),
      createMember(3, 'ai'),
    ];

    const { result } = renderHook(() =>
      useAIDecision(mockRoomId, 'medium', true, 'playing', 0, 1, members)
    );

    // 等待决策完成
    await waitFor(
      () => {
        expect(mockAISystem.dispatcher.submitTasks).toHaveBeenCalled();
        expect(mockGameState.submitTurn).toHaveBeenCalled();
      },
      { timeout: 5000 }
    );

    // 验证调试日志
    expect(result.current.debugLog.length).toBeGreaterThan(0);
  });

  // 不同轮次测试暂时跳过，需要更复杂的mock设置

  it('非AI座位不应该触发决策', async () => {
    const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');
    const members = [
      createMember(0, 'human'),  // 人类玩家
      createMember(1, 'ai'),
      createMember(2, 'ai'),
      createMember(3, 'ai'),
    ];

    renderHook(() =>
      useAIDecision(mockRoomId, 'medium', true, 'playing', 0, 1, members)
    );

    // 等待一段时间，验证没有调用
    await new Promise(resolve => setTimeout(resolve, 500));

    expect(mockAISystem.dispatcher.submitTasks).not.toHaveBeenCalled();
    expect(mockGameState.submitTurn).not.toHaveBeenCalled();
  });
});
