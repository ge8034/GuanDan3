/**
 * Realtime 竞态条件集成测试
 *
 * 测试 Realtime 更新与卡牌提交的竞态条件处理
 * 验证手牌刷新、卡牌验证、UI状态同步等场景
 */

import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useGameStore } from '@/lib/store/game';
import { aiSystemManager } from '@/lib/hooks/ai/AISystemManager';
import type { Card } from '@/lib/store/game';
import type { RoomMember } from '@/lib/store/room';

// Mock dependencies
vi.mock('@/lib/store/game', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useGameStore: {
      getState: vi.fn(),
    },
  };
});

vi.mock('@/lib/hooks/ai/AISystemManager', () => ({
  aiSystemManager: {
    getSystem: vi.fn(),
    getActiveRoomIds: vi.fn(() => []),
  },
}));

vi.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/utils/aiPerformanceMonitor', () => ({
  AIPerformanceMonitor: {
    getInstance: vi.fn(() => ({
      recordDecision: vi.fn(),
    })),
  },
}));

// Helper function to create mock card
const createCard = (id: number, val: number = id): Card => ({
  id,
  suit: 'H',
  rank: String(val),
  val,
});

// Helper function to create mock room member
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

describe('Realtime竞态条件', () => {
  const mockRoomId = 'test-room-123';

  // 初始手牌
  const initialHand = Array.from({ length: 27 }, (_, i) => createCard(i + 1, (i % 13) + 2));

  // 刷新后的手牌（ID 不同）
  const refreshedHand = Array.from({ length: 26 }, (_, i) => createCard(i + 100, (i % 13) + 2));

  const mockGameState = {
    gameId: 'game-123',
    status: 'playing' as const,
    turnNo: 1,
    currentSeat: 0,
    levelRank: 2,
    myHand: [...initialHand],
    lastAction: null,
    getAIHand: vi.fn(async (seatNo: number) => {
      // 返回当前store中的手牌，而不是固定的initialHand
      return [...mockGameState.myHand];
    }),
    submitTurn: vi.fn(),
    counts: [27, 27, 27, 27],
    updateHand: vi.fn(),
    setGame: vi.fn(),
  };

  const mockAISystem = {
    roomId: mockRoomId,
    difficulty: 'medium' as const,
    teamManager: {
      createTeam: vi.fn(),
    },
    dispatcher: {
      submitTasks: vi.fn(async () => {}),
      waitForTaskResult: vi.fn(),
    },
    planner: {
      decompose: vi.fn((task: unknown) => [
        {
          id: `task-${Date.now()}`,
          type: 'DecideMove',
          payload: task,
          status: 'PENDING',
          createdAt: Date.now(),
        },
      ]),
    },
    createdAt: Date.now(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // 移除假定时器，因为它会阻止真正的异步操作完成
    // vi.useFakeTimers();

    // 重置手牌
    mockGameState.myHand = [...initialHand];
    (useGameStore.getState as vi.Mock).mockReturnValue(mockGameState);
    (aiSystemManager.getSystem as vi.Mock).mockReturnValue(mockAISystem);
  });

  afterEach(() => {
    // vi.useRealTimers();
  });

  describe('决策期间手牌刷新', () => {
    it('决策期间手牌刷新时正确检测并处理', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      // Mock 决策返回的卡牌（使用初始手牌的 ID）
      const decisionCard = createCard(5, 5); // 初始手牌中的卡牌

      let resolveDecision: (value: unknown) => void;
      const decisionPromise = new Promise((resolve) => {
        resolveDecision = resolve;
      });

      mockAISystem.dispatcher.waitForTaskResult = vi.fn(() => decisionPromise);

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策开始
      await waitFor(() => {
        expect(mockAISystem.dispatcher.submitTasks).toHaveBeenCalled();
      });

      // 在决策进行中时，模拟 Realtime 更新刷新手牌
      await act(async () => {
        mockGameState.myHand = [...refreshedHand];

        // 现在完成决策，返回初始手牌的卡牌
        resolveDecision!({
          status: 'COMPLETED',
          output: {
            move: {
              type: 'play',
              cards: [decisionCard],
            },
          },
        });
      });

      // 等待一小段时间让异步操作完成
      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证卡牌验证逻辑检测到变化
      // 因为 decisionCard.id=5 不在 refreshedHand 中
      expect(mockGameState.submitTurn).not.toHaveBeenCalled();

      // 验证调试日志包含卡牌刷新信息
      const hasCardRefreshLog = result.current.debugLog.some(log =>
        log.includes('卡牌已刷新') || log.includes('Cards refreshed')
      );
      expect(hasCardRefreshLog).toBe(true);
    });

    it('决策完成后手牌未刷新时正常提交', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      // Mock 决策返回的卡牌
      const decisionCard = createCard(5, 5);

      mockAISystem.dispatcher.waitForTaskResult = vi.fn().mockResolvedValue({
        status: 'COMPLETED',
        output: {
          move: {
            type: 'play',
            cards: [decisionCard],
          },
        },
      });

      // Mock submitTurn 返回成功
      mockGameState.submitTurn = vi.fn().mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策和提交执行
      await waitFor(() => {
        expect(mockGameState.submitTurn).toHaveBeenCalled();
      });

      // 验证 submitTurn 被正确调用
      expect(mockGameState.submitTurn).toHaveBeenCalledWith('play', [decisionCard]);
    });
  });

  describe('提交前卡牌验证', () => {
    it('提交前卡牌验证防止无效提交', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      // Mock 决策返回的卡牌（不存在的 ID）
      const invalidCard = createCard(9999, 5);

      mockAISystem.dispatcher.waitForTaskResult = vi.fn().mockResolvedValue({
        status: 'COMPLETED',
        output: {
          move: {
            type: 'play',
            cards: [invalidCard],
          },
        },
      });

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策执行
      await waitFor(() => {
        expect(mockAISystem.dispatcher.waitForTaskResult).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证没有调用 submitTurn
      expect(mockGameState.submitTurn).not.toHaveBeenCalled();
    });

    it('部分卡牌无效时过滤并跳过提交', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      // Mock 决策返回混合卡牌
      const validCard = createCard(1, 3);
      const invalidCard = createCard(9999, 5);

      mockAISystem.dispatcher.waitForTaskResult = vi.fn().mockResolvedValue({
        status: 'COMPLETED',
        output: {
          move: {
            type: 'play',
            cards: [validCard, invalidCard],
          },
        },
      });

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策执行
      await waitFor(() => {
        expect(mockAISystem.dispatcher.waitForTaskResult).toHaveBeenCalled();
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证没有调用 submitTurn（因为过滤后数量不匹配）
      expect(mockGameState.submitTurn).not.toHaveBeenCalled();
    });
  });

  describe('UI选中状态同步', () => {
    it('UI选中状态在手牌刷新时清理', async () => {
      const { useRoomHandlers } = await import('@/app/room/[roomId]/hooks/useRoomHandlers');

      // Mock 所有依赖
      const mockJoinRoom = vi.fn().mockResolvedValue(true);
      const mockHeartbeatRoomMember = vi.fn().mockResolvedValue(undefined);
      const mockFetchLastTrickPlay = vi.fn().mockResolvedValue(null);
      const mockPauseGame = vi.fn().mockResolvedValue(undefined);
      const mockResumeGame = vi.fn().mockResolvedValue(undefined);
      const mockShowToast = vi.fn();
      const mockPlaySound = vi.fn();
      const mockStartGameRef = { current: vi.fn().mockResolvedValue(undefined) };

      // 初始手牌
      const initialMyHand = [
        createCard(1, 3),
        createCard(2, 4),
        createCard(3, 5),
      ];

      // 刷新后的手牌（ID 变化）
      const refreshedMyHand = [
        createCard(101, 3),
        createCard(102, 4),
        createCard(103, 5),
      ];

      // 使用 wrapper 组件来共享状态
      const { result, rerender } = renderHook(
        ({ myHand }) =>
          useRoomHandlers({
            roomId: mockRoomId,
            joinRoom: mockJoinRoom,
            heartbeatRoomMember: mockHeartbeatRoomMember,
            fetchLastTrickPlay: mockFetchLastTrickPlay,
            pauseGame: mockPauseGame,
            resumeGame: mockResumeGame,
            myHand,
            levelRank: 2,
            lastAction: null,
            startGameRef: mockStartGameRef,
            showToast: mockShowToast,
            playSound: mockPlaySound,
            realtimeHealthy: true,
          }),
        { initialProps: { myHand: initialMyHand } }
      );

      // 选中一些卡牌
      await act(async () => {
        const { handleCardClick } = result.current;
        handleCardClick(1);
        handleCardClick(2);
      });

      expect(result.current.selectedCardIds).toEqual([1, 2]);

      // 模拟手牌刷新（通过 rerender 更新手牌）
      rerender({ myHand: refreshedMyHand });

      // 等待 useEffect 清理无效卡牌
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 验证无效的卡牌 ID 被清除
      // 因为旧手牌的 ID (1, 2) 不在新手牌中，应该被清空
      expect(result.current.selectedCardIds).toEqual([]);
    });

    it('手牌未变化时保持选中状态', async () => {
      const { useRoomHandlers } = await import('@/app/room/[roomId]/hooks/useRoomHandlers');

      const mockJoinRoom = vi.fn().mockResolvedValue(true);
      const mockHeartbeatRoomMember = vi.fn().mockResolvedValue(undefined);
      const mockFetchLastTrickPlay = vi.fn().mockResolvedValue(null);
      const mockPauseGame = vi.fn().mockResolvedValue(undefined);
      const mockResumeGame = vi.fn().mockResolvedValue(undefined);
      const mockShowToast = vi.fn();
      const mockPlaySound = vi.fn();
      const mockStartGameRef = { current: vi.fn().mockResolvedValue(undefined) };

      const myHand = [
        createCard(1, 3),
        createCard(2, 4),
        createCard(3, 5),
      ];

      // 使用 wrapper 组件来共享状态
      const { result, rerender } = renderHook(
        ({ myHand }) =>
          useRoomHandlers({
            roomId: mockRoomId,
            joinRoom: mockJoinRoom,
            heartbeatRoomMember: mockHeartbeatRoomMember,
            fetchLastTrickPlay: mockFetchLastTrickPlay,
            pauseGame: mockPauseGame,
            resumeGame: mockResumeGame,
            myHand,
            levelRank: 2,
            lastAction: null,
            startGameRef: mockStartGameRef,
            showToast: mockShowToast,
            playSound: mockPlaySound,
            realtimeHealthy: true,
          }),
        { initialProps: { myHand } }
      );

      // 选中一些卡牌
      await act(async () => {
        const { handleCardClick } = result.current;
        handleCardClick(1);
        handleCardClick(2);
      });

      expect(result.current.selectedCardIds).toEqual([1, 2]);

      // 重新渲染相同的手牌
      rerender({ myHand });

      // 等待 useEffect 执行
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // 验证选中状态保持不变
      expect(result.current.selectedCardIds).toEqual([1, 2]);
    });
  });

  describe('Realtime更新与决策时序', () => {
    it('Realtime更新在决策前完成', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      // 首先模拟 Realtime 更新刷新手牌
      mockGameState.myHand = [...refreshedHand];

      // 然后触发 AI 决策
      const decisionCard = createCard(100, 3); // 刷新后手牌中的卡牌

      mockAISystem.dispatcher.waitForTaskResult = vi.fn().mockResolvedValue({
        status: 'COMPLETED',
        output: {
          move: {
            type: 'play',
            cards: [decisionCard],
          },
        },
      });

      mockGameState.submitTurn = vi.fn().mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策和提交执行
      await waitFor(() => {
        expect(mockGameState.submitTurn).toHaveBeenCalled();
      });

      // 验证提交成功
      expect(mockGameState.submitTurn).toHaveBeenCalledWith('play', [decisionCard]);
    });

    it('Realtime更新在决策期间完成', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      let resolveDecision: (value: unknown) => void;
      const decisionPromise = new Promise((resolve) => {
        resolveDecision = resolve;
      });

      mockAISystem.dispatcher.waitForTaskResult = vi.fn(() => decisionPromise);

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策开始
      await waitFor(() => {
        expect(mockAISystem.dispatcher.submitTasks).toHaveBeenCalled();
      });

      // 在决策进行中时，模拟 Realtime 更新
      await act(async () => {
        mockGameState.myHand = [...refreshedHand];

        // 完成决策，返回初始手牌的卡牌（无效）
        resolveDecision!({
          status: 'COMPLETED',
          output: {
            move: {
              type: 'play',
              cards: [createCard(5, 5)], // 初始手牌中的卡牌
            },
          },
        });
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证没有提交
      expect(mockGameState.submitTurn).not.toHaveBeenCalled();

      // 验证调试日志包含卡牌刷新信息
      const hasCardRefreshLog = result.current.debugLog.some(log =>
        log.includes('卡牌已刷新') || log.includes('Cards refreshed')
      );
      expect(hasCardRefreshLog).toBe(true);
    });
  });

  describe('多次快速刷新', () => {
    it('连续多次手牌刷新时正确处理', async () => {
      const { useAIDecision } = await import('@/lib/hooks/ai/useAIDecision');

      const members = [createMember(0, 'ai'), createMember(1, 'ai'), createMember(2, 'ai'), createMember(3, 'ai')];

      // Mock 决策需要较长时间
      let resolveDecision: (value: unknown) => void;
      const decisionPromise = new Promise((resolve) => {
        resolveDecision = resolve;
      });

      mockAISystem.dispatcher.waitForTaskResult = vi.fn(() => decisionPromise);

      const { result } = renderHook(() =>
        useAIDecision(
          mockRoomId,
          'medium',
          true,
          'playing',
          0,
          1,
          members
        )
      );

      // 等待决策开始
      await waitFor(() => {
        expect(mockAISystem.dispatcher.submitTasks).toHaveBeenCalled();
      });

      // 连续多次刷新手牌
      await act(async () => {
        mockGameState.myHand = Array.from({ length: 26 }, (_, i) => createCard(i + 200, (i % 13) + 2));
        await new Promise(resolve => setTimeout(resolve, 10));

        mockGameState.myHand = Array.from({ length: 25 }, (_, i) => createCard(i + 300, (i % 13) + 2));
        await new Promise(resolve => setTimeout(resolve, 10));

        mockGameState.myHand = Array.from({ length: 24 }, (_, i) => createCard(i + 400, (i % 13) + 2));

        // 完成决策
        resolveDecision!({
          status: 'COMPLETED',
          output: {
            move: {
              type: 'play',
              cards: [createCard(5, 5)], // 初始手牌中的卡牌
            },
          },
        });
      });

      await new Promise(resolve => setTimeout(resolve, 100));

      // 验证没有提交（因为卡牌不存在）
      expect(mockGameState.submitTurn).not.toHaveBeenCalled();
    });
  });
});
