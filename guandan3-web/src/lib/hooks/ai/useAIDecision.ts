import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store/game';
import { RoomMember } from '@/lib/store/room';
import { devLog, devError } from '@/lib/utils/devLog';
import { AIPerformanceMonitor } from '@/lib/utils/aiPerformanceMonitor';
import { aiSystemManager } from './AISystemManager';
import type { Task } from '@/lib/multi-agent/core/types';

/**
 * AI 决策执行 Hook
 *
 * 当轮到 AI 出牌时，自动执行决策并提交
 */
export function useAIDecision(
  roomId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  isOwner: boolean,
  gameStatus: 'deal' | 'playing' | 'paused' | 'finished',
  currentSeat: number,
  turnNo: number,
  members: RoomMember[]
): {
  debugLog: string[];
  addDebugLog: (msg: string) => void;
  agentStatuses: Record<string, { status: string; task?: string }>;
} {
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const addDebugLog = useCallback((msg: string) => {
    setDebugLog((prev) => [msg, ...prev].slice(0, 5));
  }, []);

  const agentStatusesRef = useRef<
    Record<string, { status: string; task?: string }>
  >({});
  const [agentStatusesState, setAgentStatusesState] = useState<
    Record<string, { status: string; task?: string }>
  >({});

  const performanceMonitor = AIPerformanceMonitor.getInstance();
  // 使用轮次号作为锁，每个轮次只能有一个AI在执行
  // 这样避免了不同座位之间的阻塞，同时保证了同一轮次的并发安全
  const submittingTurnRef = useRef<number | null>(null);

  // AI 决策执行
  useEffect(() => {
    // 前置条件检查
    const shouldRunAI =
      gameStatus === 'playing' && isOwner && members && members.length > 0;

    console.log('[useAIDecision] 触发检查:', {
      gameStatus,
      isOwner,
      currentSeat,
      membersCount: members?.length || 0,
      shouldRunAI,
    });

    if (!shouldRunAI) {
      return;
    }

    const currentMember = members.find((m) => m.seat_no === currentSeat);
    const isAIMember = currentMember?.member_type === 'ai';

    console.log('[useAIDecision] 座位检查:', {
      currentSeat,
      currentMember,
      isAIMember,
    });

    if (!isAIMember) {
      devLog(
        `[useAIDecision] 当前座位不是AI成员，跳过: member_type=${currentMember?.member_type}`
      );
      return;
    }

    // 防止重复提交 - 使用轮次号作为锁，允许不同座位在同一轮次中依次执行
    if (submittingTurnRef.current === turnNo) {
      devLog(`[useAIDecision] 轮次${turnNo}正在执行中，跳过`);
      return;
    }

    const runAI = async () => {
      submittingTurnRef.current = turnNo;
      const decisionStartTime = Date.now();

      devLog(
        `[useAIDecision] 开始执行 AI 决策: currentSeat=${currentSeat}, turnNo=${turnNo}`
      );

      // 超时保护
      const timeoutId = setTimeout(() => {
        if (submittingTurnRef.current === turnNo) {
          devLog('[useAIDecision] 决策超时 (15秒)，强制重置');
          submittingTurnRef.current = null;
        }
      }, 15000);

      try {
        console.log('[useAIDecision] 获取AI系统:', {
          roomId,
          activeRooms: aiSystemManager.getActiveRoomIds(),
        });

        const system = aiSystemManager.getSystem(roomId);
        console.log(
          '[useAIDecision] 系统查询结果:',
          system ? '存在' : '不存在'
        );

        if (!system?.dispatcher || !system?.planner) {
          console.error('[useAIDecision] AI 系统不存在或不完整:', {
            hasSystem: !!system,
            hasDispatcher: !!system?.dispatcher,
            hasPlanner: !!system?.planner,
          });
          devLog(`[useAIDecision] AI 系统不存在`);
          return;
        }

        const freshState = useGameStore.getState();

        // 双重检查状态
        if (
          freshState.status !== 'playing' ||
          freshState.currentSeat !== currentSeat
        ) {
          devLog(`[useAIDecision] 状态已变化，跳过`);
          return;
        }

        // 再次确认是 AI 成员
        const currentMember = members.find((m) => m.seat_no === currentSeat);
        if (!currentMember || currentMember.member_type !== 'ai') {
          devLog(`[useAIDecision] 当前座位不是AI成员`);
          return;
        }

        const lastAction = freshState.lastAction;
        const aiHand = await freshState.getAIHand(currentSeat);

        // 创建任务
        const task: Task = {
          id: `turn-${freshState.gameId}-${freshState.turnNo}-${currentSeat}`,
          type: 'GuanDanTurn',
          priority: 10,
          payload: {
            hand: aiHand,
            lastAction,
            levelRank: freshState.levelRank,
            seatNo: currentSeat,
            playersCardCounts: freshState.counts,
          },
          dependencies: [],
          status: 'PENDING',
          createdAt: Date.now(),
        };

        devLog(`[useAIDecision] 创建任务: ${task.id}`);

        // 分解任务
        const subtasks = system.planner.decompose(task);
        if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
          devError('[useAIDecision] 任务分解失败');
          return;
        }

        devLog(`[useAIDecision] 准备提交 ${subtasks.length} 个任务`);
        await system.dispatcher.submitTasks(subtasks);
        addDebugLog(`AI Agent: 调度中 (座位 ${currentSeat})`);

        // 等待决策结果
        const decisionTask = subtasks.find(
          (t: Task) => t.type === 'DecideMove'
        );
        if (decisionTask) {
          const result = await system.dispatcher.waitForTaskResult(
            decisionTask.id
          );

          if (result && result.status === 'COMPLETED') {
            const move = result.output.move;
            const decisionTime = Date.now() - decisionStartTime;

            addDebugLog(
              `AI 决策: ${move.type} ${move.cards?.length || 0} 张 (${decisionTime}ms)`
            );

            const submitRes = await freshState.submitTurn(
              move.type,
              move.cards
            );
            if (
              submitRes &&
              typeof submitRes === 'object' &&
              'error' in submitRes
            ) {
              addDebugLog(
                `AI 提交失败: ${(submitRes as { error?: { message?: string } }).error?.message || '未知错误'}`
              );
              performanceMonitor.recordDecision({
                timestamp: Date.now(),
                seatNo: currentSeat,
                difficulty,
                moveType: move.type,
                cardCount: move.cards?.length || 0,
                decisionTime,
                success: false,
                errorMessage:
                  (submitRes as { error?: { message?: string } }).error
                    ?.message || '未知错误',
              });
            } else {
              addDebugLog('AI 提交成功');
              performanceMonitor.recordDecision({
                timestamp: Date.now(),
                seatNo: currentSeat,
                difficulty,
                moveType: move.type,
                cardCount: move.cards?.length || 0,
                decisionTime,
                success: true,
              });
            }
          } else {
            addDebugLog('AI 任务超时或失败');
            const decisionTime = Date.now() - decisionStartTime;
            performanceMonitor.recordDecision({
              timestamp: Date.now(),
              seatNo: currentSeat,
              difficulty,
              moveType: 'unknown',
              cardCount: 0,
              decisionTime,
              success: false,
              errorMessage: 'Task timeout or failed',
            });
          }
        }
      } catch (e: unknown) {
        devError('[useAIDecision] AI 异常:', e);
        const decisionTime = Date.now() - decisionStartTime;
        performanceMonitor.recordDecision({
          timestamp: Date.now(),
          seatNo: currentSeat,
          difficulty,
          moveType: 'error',
          cardCount: 0,
          decisionTime,
          success: false,
          errorMessage: e instanceof Error ? e.message : '未知错误',
        });
      } finally {
        clearTimeout(timeoutId);
        // 重置锁
        submittingTurnRef.current = null;
        devLog(
          `[useAIDecision] 完成，耗时: ${Date.now() - decisionStartTime}ms`
        );
      }
    };

    runAI();
  }, [
    gameStatus,
    currentSeat,
    turnNo,
    isOwner,
    roomId,
    difficulty,
    members,
    addDebugLog,
  ]);

  return {
    debugLog,
    addDebugLog,
    agentStatuses: { ...agentStatusesRef.current, ...agentStatusesState },
  };
}
