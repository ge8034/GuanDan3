import { useEffect, useRef } from 'react'
import { useGameStore } from '@/lib/store/game'
import { devLog } from '@/lib/utils/devLog'
import { aiSystemManager } from './AISystemManager'

/**
 * AI 游戏事件订阅 Hook
 *
 * 监听游戏状态变化，向 AI 系统广播事件
 */
export function useAISubscription(
  roomId: string,
  difficulty: 'easy' | 'medium' | 'hard',
  isOwner: boolean
): void {
  // 使用 ref 追踪订阅状态，避免重复订阅
  const subscriptionKeyRef = useRef<string | null>(null)
  const systemRef = useRef<any>(null)

  // 确保 AI 系统存在（在 useEffect 外部创建）
  useEffect(() => {
    if (!isOwner) return

    systemRef.current = aiSystemManager.getOrCreateSystem(roomId, difficulty)
  }, [isOwner, roomId, difficulty])

  // 订阅游戏状态变化
  useEffect(() => {
    if (!isOwner || !systemRef.current) return

    const system = systemRef.current

    // 检查是否已订阅
    const key = `game-sub-${roomId}`
    if (subscriptionKeyRef.current === key) {
      devLog('[useAISubscription] 跳过重复订阅')
      return
    }
    subscriptionKeyRef.current = key

    // 追踪状态
    let prevStatus = ''
    let prevLastActionStr = ''

    // 订阅游戏状态变化
    const unsub = useGameStore.subscribe((state) => {
      // 检测游戏开始
      if (state.status === 'playing' && prevStatus !== 'playing') {
        prevStatus = 'playing'
        devLog('[useAISubscription] 发送 GAME_START 消息到 AI Team')
        system.teamManager.broadcastToTeam(`room-${roomId}`, {
          id: crypto.randomUUID(),
          type: 'GAME_START',
          payload: { levelRank: state.levelRank },
          from: 'SYSTEM',
          to: 'BROADCAST',
          timestamp: Date.now()
        })
      }

      // 游戏结束时重置
      if (state.status !== 'playing' && prevStatus === 'playing') {
        prevStatus = ''
      }

      // 检测最后出牌
      const lastActionStr = JSON.stringify(state.lastAction)
      if (state.lastAction && lastActionStr !== prevLastActionStr) {
        prevLastActionStr = lastActionStr
        devLog('[useAISubscription] 发送 GAME_ACTION 消息到 AI Team')
        system.teamManager.broadcastToTeam(`room-${roomId}`, {
          id: crypto.randomUUID(),
          type: 'GAME_ACTION',
          payload: {
            action: state.lastAction,
            levelRank: state.levelRank
          },
          from: 'SYSTEM',
          to: 'BROADCAST',
          timestamp: Date.now()
        })
      }
    })

    // 清理函数
    return () => {
      unsub()
      subscriptionKeyRef.current = null
    }
  }, [isOwner, roomId, difficulty])
}
