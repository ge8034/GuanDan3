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

  // 记录每个座位连续失败次数，用于防止无限循环
  const consecutiveFailuresRef = useRef<Record<number, number>>({});

  // AI 决策执行
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    // 前置条件检查
    const shouldRunAI =
      gameStatus === 'playing' && isOwner && members && members.length > 0;

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
      return;
    }

    const currentMember = members.find((m) => m.seat_no === currentSeat);
    const isAIMember = currentMember?.member_type === 'ai';

    // 练习模式特殊处理：当是练习模式且轮到人类玩家（座位0）时，AI也可以执行
    // 但只有在人类玩家没有选牌的情况下才执行
    const isPracticeMode = roomMode === 'pve1v3';
    const isHumanSeatZero = currentSeat === 0 && currentMember?.member_type === 'human';
    const hasSelectedCards = selectedCardIds && selectedCardIds.length > 0;

    // 给人类玩家一个思考时间：如果是练习模式且轮到人类玩家，添加延迟后再执行AI
    const shouldAIPlayForHuman = isPracticeMode && isHumanSeatZero && !hasSelectedCards;

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

    if (!shouldExecuteAI) {
      logger.debug(
        `[useAIDecision] 当前座位不应执行AI: member_type=${currentMember?.member_type}, roomMode=${roomMode}`
      );
      return;
    }

    // 修复问题#7: 检查连续失败次数，防止无限循环
    const failures = consecutiveFailuresRef.current[currentSeat] || 0;
    if (failures >= 3) {
      logger.warn(`[useAIDecision] 座位${currentSeat}连续失败${failures}次，跳过本次执行`);
      // 在轮次变化时重置失败计数
      if (submittingTurnRef.current !== null && submittingTurnRef.current !== turnNo) {
        consecutiveFailuresRef.current[currentSeat] = 0;
      } else {
        return;
      }
    }

    // 修复问题#10: 使用 (turnNo, currentSeat) 组合作为锁
    // 而不是只用 turnNo，这样同一轮次的不同座位可以并发执行
    const lockKey = `${turnNo}_${currentSeat}`;
    if (submittingTurnRef.current === lockKey) {
      logger.debug(`[useAIDecision] 座位${currentSeat}轮次${turnNo}正在执行中，跳过`);
      return;
    }

    // 设置锁
    submittingTurnRef.current = lockKey;

    logger.debug(`[useAIDecision] AI 开始执行，座位=${currentSeat}, 轮次=${turnNo}`);

    const runAI = async () => {
      console.log(`[AI-DEBUG] runAI 函数开始执行，座位=${currentSeat}, 轮次=${turnNo}`);

      // 练习模式：给人类玩家思考时间
      const isPracticeMode = roomMode === 'pve1v3';
      const isHumanSeatZero = currentSeat === 0 && members.find((m) => m.seat_no === currentSeat)?.member_type === 'human';

      if (isPracticeMode && isHumanSeatZero) {
        // 修复问题#12: 缩短等待时间从5秒到2秒，提升用户体验
        const waitTime = 2000; // 等待2秒给人类玩家操作
        console.log(`[AI-DEBUG] 练习模式：等待${waitTime}ms让人类玩家操作...`);

        await new Promise(resolve => setTimeout(resolve, waitTime));

        // 修复问题#4: 从最新store读取selectedCardIds，而不是使用闭包值
        const freshStateAfterWait = useGameStore.getState();
        const currentSelectedIds = freshStateAfterWait.selectedCardIds || [];
        const hasSelectedCards = currentSelectedIds.length > 0;

        if (hasSelectedCards) {
          console.log(`[AI-DEBUG] 人类玩家已选牌，AI跳过`);
          // 释放锁并重置失败计数
          submittingTurnRef.current = null;
          consecutiveFailuresRef.current[currentSeat] = 0;
          return; // 人类已操作，AI不执行
        }

        console.log(`[AI-DEBUG] 人类玩家未操作，AI接管执行`);
      }

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
          logger.debug(`[useAIDecision] runAI中：当前座位不应执行AI: member_type=${currentMember?.member_type}`);
          return;
        }

        const lastAction = freshState.lastAction;
        const aiHand = await freshState.getAIHand(currentSeat);

        // 修复问题#3: 检查手牌是否为空，如果为空则跳过决策
        if (!aiHand || aiHand.length === 0) {
          logger.warn(`[useAIDecision] 座位${currentSeat}手牌为空，跳过决策`);
          // 释放锁并增加失败计数
          submittingTurnRef.current = null;
          consecutiveFailuresRef.current[currentSeat] = (consecutiveFailuresRef.current[currentSeat] || 0) + 1;
          return;
        }

        // 重置失败计数（成功获取手牌）
        consecutiveFailuresRef.current[currentSeat] = 0;

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
        // 修复问题#6: 记录完整的错误信息，而不是"[Object]"
        const errorMessage = e instanceof Error ? e.message : String(e);
        const errorDetails = e instanceof Error ? {
          message: e.message,
          stack: e.stack,
          name: e.name,
        } : { raw: String(e) };

        logger.error('[useAIDecision] AI 异常:', {
          seatNo: currentSeat,
          turnNo,
          error: errorDetails,
        });

        const decisionTime = Date.now() - decisionStartTime;
        performanceMonitor.recordDecision({
          timestamp: Date.now(),
          seatNo: currentSeat,
          difficulty,
          moveType: 'error',
          cardCount: 0,
          decisionTime,
          success: false,
          errorMessage,
        });

        // 增加失败计数
        consecutiveFailuresRef.current[currentSeat] = (consecutiveFailuresRef.current[currentSeat] || 0) + 1;
      } finally {
        clearTimeout(timeoutId);
        // 重置锁 - 确保无论如何都释放锁
        submittingTurnRef.current = null;
        logger.debug(
          `[useAIDecision] 完成，耗时: ${Date.now() - decisionStartTime}ms`
        );
      }
    };

    runAI();
  }, [
    // 修复问题#1: 添加缺失的依赖项
    gameStatus,
    currentSeat,
    turnNo,
    isOwner,
    roomId,
    difficulty,
    members,
    roomMode,           // 修复: 练习模式判断需要此依赖
    selectedCardIds,    // 修复: 练习模式选牌检查需要此依赖
    addDebugLog,
  ]);
  /* eslint-enable react-hooks/exhaustive-deps */

  return {
    debugLog,
    addDebugLog,
    agentStatuses: { ...agentStatusesRef.current, ...agentStatusesState },
  };
}
