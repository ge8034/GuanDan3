import { useEffect } from 'react';
import { logger } from '@/lib/utils/logger';
import { aiSystemManager } from './AISystemManager';
import type { AISystem } from './AISystemManager';

/**
 * AI 系统初始化 Hook
 *
 * 负责创建和管理 AI 系统实例
 * 修复：同步创建系统，避免 useEffect 延迟导致的竞态条件
 */
export function useAISystem(
  roomId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  isOwner: boolean
): { system: AISystem | null } {
  // 同步创建系统（在渲染期间立即创建，不等待 useEffect）
  // 这确保了 useAIDecision 在首次运行时系统已经存在
  let system: AISystem | null = null;
  if (isOwner && roomId) {
    system = aiSystemManager.getOrCreateSystem(roomId, difficulty);
  }

  // 确保 system 不为空
  system = system || aiSystemManager.getSystem(roomId) || null;

  // useEffect 用于调试日志（不涉及创建逻辑）
  useEffect(() => {
    logger.debug('[useAISystem] Hook 触发:', { roomId, difficulty, isOwner });
    if (!isOwner) {
      logger.debug('[useAISystem] 跳过：不是房主');
      return;
    }

    logger.debug('[useAISystem] 系统状态:', {
      roomId,
      systemExists: !!system,
      difficulty,
    });
  }, [roomId, difficulty, isOwner, !!system]);

  // 当 difficulty 改变时更新系统
  useEffect(() => {
    if (!isOwner || !roomId) return;

    // 检查是否需要更新（difficulty 变化）
    const existing = aiSystemManager.getSystem(roomId);
    if (existing && existing.difficulty !== difficulty) {
      aiSystemManager.getOrCreateSystem(roomId, difficulty);
      logger.debug(`[useAISystem] AI 系统已更新: difficulty=${difficulty}`);
    }
  }, [difficulty, isOwner, roomId]);

  // 调试：每次渲染时检查系统状态（仅在开发模式）
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[useAISystem] 渲染检查:', {
      roomId,
      systemExists: !!system,
      activeRooms: aiSystemManager.getActiveRoomIds(),
    });
  }

  return { system };
}
