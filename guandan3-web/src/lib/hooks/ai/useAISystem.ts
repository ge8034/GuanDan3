import { useEffect } from 'react'
import { devLog } from '@/lib/utils/devLog'
import { aiSystemManager } from './AISystemManager'
import type { AISystem } from './AISystemManager'

/**
 * AI 系统初始化 Hook
 *
 * 负责创建和管理 AI 系统实例
 */
export function useAISystem(
  roomId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  isOwner: boolean
): { system: AISystem | null } {
  // 初始化系统
  useEffect(() => {
    if (!isOwner) return

    aiSystemManager.getOrCreateSystem(roomId, difficulty)
    devLog(`[useAISystem] AI 系统已准备: roomId=${roomId}, difficulty=${difficulty}`)

    // 清理函数
    return () => {
      // 注意：不在 unmount 时清理系统，因为可能有其他 hook 在使用
      // 系统会在房间关闭时通过专门的清理函数销毁
    }
  }, [roomId, difficulty, isOwner])

  // 当 difficulty 改变时重新创建系统
  useEffect(() => {
    if (!isOwner) return

    aiSystemManager.getOrCreateSystem(roomId, difficulty)
    devLog(`[useAISystem] AI 系统已更新: difficulty=${difficulty}`)

    return () => {
      // difficulty 变化时清理旧系统
      // aiSystemManager.disposeSystem(roomId)
    }
  }, [difficulty, isOwner, roomId])

  const system = aiSystemManager.getSystem(roomId) || null

  return { system }
}
