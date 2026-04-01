import { useMemo } from 'react';
import { logger } from '@/lib/utils/logger';
import { useAISystem } from './useAISystem';
import { useAISubscription } from './useAISubscription';
import { useAIDecision } from './useAIDecision';
import { useAIStatus } from './useAIStatus';
import type { RoomMember } from '@/lib/store/room';

/**
 * 房间 AI Hook（重构版）
 *
 * 组合多个专用 hook，提供完整的 AI 功能
 * 移除模块级变量，使用 AISystemManager 单例管理
 */
export function useRoomAI(
  roomId: string,
  isOwner: boolean,
  gameStatus: 'deal' | 'playing' | 'paused' | 'finished',
  currentSeat: number,
  turnNo: number,
  members: RoomMember[],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  roomMode?: 'pvp4' | 'pve1v3',  // 添加房间模式参数
  selectedCardIds?: number[]  // 添加选中的卡牌ID
) {
  // 调试日志
  logger.debug('[useRoomAI] Hook 执行:', {
    roomId,
    isOwner,
    gameStatus,
    currentSeat,
    members: members?.length,
    difficulty,
    roomMode,
  });

  // AI 系统管理
  const { system } = useAISystem(roomId, difficulty, isOwner);

  // 游戏事件订阅
  useAISubscription(roomId, difficulty, isOwner);

  // AI 状态监控
  const statusHook = useAIStatus(roomId, isOwner);

  // AI 决策执行
  const decisionHook = useAIDecision(
    roomId,
    difficulty,
    isOwner,
    gameStatus,
    currentSeat,
    turnNo,
    members,
    roomMode,  // 传递房间模式
    selectedCardIds  // 传递选中的卡牌ID
  );

  // 合并状态
  const agentStatuses = useMemo(
    () => ({
      ...decisionHook.agentStatuses,
      ...statusHook.agentStatuses,
    }),
    [decisionHook.agentStatuses, statusHook.agentStatuses]
  );

  return {
    debugLog: decisionHook.debugLog,
    addDebugLog: decisionHook.addDebugLog,
    agentStatuses,
  };
}
