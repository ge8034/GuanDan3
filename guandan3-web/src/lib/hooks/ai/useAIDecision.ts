import { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from '@/lib/store/game';
import type { Card } from '@/lib/store/game';
import { RoomMember } from '@/lib/store/room';
import { logger } from '@/lib/utils/logger';
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
  members: RoomMember[],
  roomMode?: 'pvp4' | 'pve1v3',  // 添加房间模式参数
  selectedCardIds?: number[]  // 添加选中的卡牌ID，避免覆盖人类玩家的操作
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
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // 前置条件检查
    const shouldRunAI =
      gameStatus === 'playing' && isOwner && members && members.length > 0;

    // 强制输出调试信息（不受DEBUG标志影响）
    console.log('[AI-DEBUG] useAIDecision 触发检查:', {
      gameStatus,
      isOwner,
      currentSeat,
      turnNo,
      membersCount: members?.length || 0,
      members: members?.map(m => ({ seat: m.seat_no, type: m.member_type })),
      shouldRunAI,
      lockValue: submittingTurnRef.current,
    });

    logger.debug('[useAIDecision] 触发检查:', {
      gameStatus,
      isOwner,
      currentSeat,
      turnNo,
      membersCount: members?.length || 0,
      shouldRunAI,
      lockValue: submittingTurnRef.current,
    });

    if (!shouldRunAI) {
      if (!isOwner) console.log('[AI-DEBUG] 跳过：不是房主');
      if (gameStatus !== 'playing') console.log('[AI-DEBUG] 跳过：gameStatus不是playing，是', gameStatus);
      if (!members || members.length === 0) console.log('[AI-DEBUG] 跳过：members为空');
      return;
    }

    const currentMember = members.find((m) => m.seat_no === currentSeat);
    const isAIMember = currentMember?.member_type === 'ai';

    // 练习模式特殊处理：当是练习模式且轮到人类玩家（座位0）时，AI也可以执行
    // 但只有在人类玩家没有选牌的情况下才执行
    const isPracticeMode = roomMode === 'pve1v3';
    const isHumanSeatZero = currentSeat === 0 && currentMember?.member_type === 'human';
    const shouldAIPlayForHuman = isPracticeMode && isHumanSeatZero && (!selectedCardIds || selectedCardIds.length === 0);

    const shouldExecuteAI = isAIMember || shouldAIPlayForHuman;

    logger.debug('[useAIDecision] 座位检查:', {
      currentSeat,
      currentMember,
      isAIMember,
      memberType: currentMember?.member_type,
      isPracticeMode,
      isHumanSeatZero,
      shouldAIPlayForHuman,
      shouldExecuteAI,
    });

    console.log('[AI-DEBUG] 座位检查详情:', {
      currentSeat,
      isAIMember,
      isPracticeMode,
      shouldExecuteAI,
      selectedCardIdsCount: selectedCardIds?.length || 0,
    });

    if (!shouldExecuteAI) {
      console.log('[AI-DEBUG] 跳过：当前座位不应执行AI');
      logger.debug(
        `[useAIDecision] 当前座位不应执行AI: member_type=${currentMember?.member_type}, roomMode=${roomMode}`
      );
      return;
    }

    // 防止重复提交 - 使用轮次号作为锁，允许不同座位在同一轮次中依次执行
    if (submittingTurnRef.current === turnNo) {
      console.log(`[AI-DEBUG] 轮次${turnNo}正在执行中，跳过 (lock=${submittingTurnRef.current})`);
      logger.debug(`[useAIDecision] 轮次${turnNo}正在执行中，跳过 (lock=${submittingTurnRef.current})`);
      return;
    }

    console.log(`[AI-DEBUG] AI 准备执行，座位=${currentSeat}, 轮次=${turnNo}, 锁=${submittingTurnRef.current}`);
    logger.debug(`[useAIDecision] AI 开始执行，座位=${currentSeat}, 轮次=${turnNo}`);

    const runAI = async () => {
      console.log(`[AI-DEBUG] runAI 函数开始执行，座位=${currentSeat}, 轮次=${turnNo}`);
      submittingTurnRef.current = turnNo;
      const decisionStartTime = Date.now();

      logger.debug(
        `[useAIDecision] 开始执行 AI 决策: currentSeat=${currentSeat}, turnNo=${turnNo}`
      );

      // 超时保护
      const timeoutId = setTimeout(() => {
        if (submittingTurnRef.current === turnNo) {
          logger.debug('[useAIDecision] 决策超时 (15秒)，强制重置');
          submittingTurnRef.current = null;
        }
      }, 15000);

      try {
        logger.debug('[useAIDecision] 获取AI系统:', {
          roomId,
          activeRooms: aiSystemManager.getActiveRoomIds(),
        });

        const system = aiSystemManager.getSystem(roomId);
        logger.debug(
          '[useAIDecision] 系统查询结果:',
          system ? '存在' : '不存在'
        );

        if (!system?.dispatcher || !system?.planner) {
          logger.error('[useAIDecision] AI 系统不存在或不完整:', {
            hasSystem: !!system,
            hasDispatcher: !!system?.dispatcher,
            hasPlanner: !!system?.planner,
          });
          logger.debug(`[useAIDecision] AI 系统不存在`);
          return;
        }

        const freshState = useGameStore.getState();

        // 双重检查状态
        if (
          freshState.status !== 'playing' ||
          freshState.currentSeat !== currentSeat
        ) {
          console.log('[AI-DEBUG] 状态已变化，跳过');
          logger.debug(`[useAIDecision] 状态已变化，跳过`);
          return;
        }

        // 再次确认可以执行AI（AI成员或练习模式的人类座位0）
        const currentMember = members.find((m) => m.seat_no === currentSeat);
        const isAIMember = currentMember?.member_type === 'ai';
        const shouldAIPlayForHuman = isPracticeMode && currentSeat === 0 && currentMember?.member_type === 'human';

        if (!isAIMember && !shouldAIPlayForHuman) {
          console.log('[AI-DEBUG] runAI中：当前座位不应执行AI');
          logger.debug(`[useAIDecision] runAI中：当前座位不应执行AI: member_type=${currentMember?.member_type}`);
          return;
        }

        console.log('[AI-DEBUG] runAI中：通过所有检查，准备获取AI系统');

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

        logger.debug(`[useAIDecision] 创建任务: ${task.id}`);

        // 分解任务
        const subtasks = system.planner.decompose(task);
        if (!subtasks || !Array.isArray(subtasks) || subtasks.length === 0) {
          logger.error('[useAIDecision] 任务分解失败');
          return;
        }

        logger.debug(`[useAIDecision] 准备提交 ${subtasks.length} 个任务`);
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

            // 验证卡牌仍在手牌中（防止竞态条件）
            if (move.type === 'play' && move.cards && move.cards.length > 0) {
              const currentHandIds = new Set(freshState.myHand.map((c: Card) => c.id));
              const validCards = move.cards.filter((c: Card) => currentHandIds.has(c.id));

              if (validCards.length !== move.cards.length) {
                addDebugLog(
                  `AI 卡牌已刷新，释放锁并等待下次决策 (${move.cards.length} -> ${validCards.length})`
                );
                // 释放锁，允许下次决策重新执行
                submittingTurnRef.current = null;
                // 记录为失败但不报错
                performanceMonitor.recordDecision({
                  timestamp: Date.now(),
                  seatNo: currentSeat,
                  difficulty,
                  moveType: move.type,
                  cardCount: move.cards.length,
                  decisionTime,
                  success: false,
                  errorMessage: 'Cards refreshed before submit',
                });
                return; // 跳过此次提交，等待下次决策
              }
            }

            const submitRes = await freshState.submitTurn(
              move.type,
              move.cards
            );
            if (
              submitRes &&
              typeof submitRes === 'object' &&
              'error' in submitRes
            ) {
              // 检查是否是状态刷新导致的预期错误
              const isRefreshedError =
                'refreshed' in submitRes && submitRes.refreshed;

              if (isRefreshedError) {
                addDebugLog('AI 状态已刷新，释放锁并等待下次决策');
                // 释放锁，允许下次决策重新执行
                submittingTurnRef.current = null;
                performanceMonitor.recordDecision({
                  timestamp: Date.now(),
                  seatNo: currentSeat,
                  difficulty,
                  moveType: move.type,
                  cardCount: move.cards?.length || 0,
                  decisionTime,
                  success: false,
                  errorMessage: 'State refreshed (expected race condition)',
                });
                return;
              }

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
        logger.error('[useAIDecision] AI 异常:', e);
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
        logger.debug(
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
  /* eslint-enable react-hooks/exhaustive-deps */

  return {
    debugLog,
    addDebugLog,
    agentStatuses: { ...agentStatusesRef.current, ...agentStatusesState },
  };
}
