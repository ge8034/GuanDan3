import { useEffect, useState, useCallback } from 'react'
import { MessageBus } from '@/lib/multi-agent/core/MessageBus'
import type { Message } from '@/lib/multi-agent/core/types'
import { devLog } from '@/lib/utils/devLog'

/**
 * AI 状态监控 Hook（修复版）
 *
 * 使用 ref 存储回调以避免频繁重新订阅
 * 监听 AI Agent 的日志消息，更新状态显示
 */
export function useAIStatus(
  roomId: string,
  isOwner: boolean
): {
  debugLog: string[]
  addDebugLog: (msg: string) => void
  agentStatuses: Record<string, { status: string; task?: string }>
} {
  const [debugLog, setDebugLog] = useState<string[]>([])

  // 只使用 state，避免在渲染期间访问 ref
  const [agentStatusesState, setAgentStatusesState] = useState<Record<string, { status: string; task?: string }>>({})

  // addDebugLog 使用 useCallback 但依赖为空，保持稳定引用
  const addDebugLog = useCallback((msg: string) => {
    setDebugLog((prev) => [msg, ...prev].slice(0, 5))
  }, [])

  // 直接返回状态，不与 ref 合并
  const agentStatuses = agentStatusesState

  // MessageBus 订阅（修复版）
  useEffect(() => {
    if (!isOwner) return

    const bus = MessageBus.getInstance()
    const agentId = `room-${roomId}`

    // 创建稳定的回调函数
    const handleMessage = (msg: Message) => {
      devLog('[useAIStatus] 收到消息:', msg.type, msg.from)

      if (msg.type === 'AGENT_LOG') {
        addDebugLog(`${msg.from}: ${msg.payload}`)
      }

      if (msg.type === 'STATUS_UPDATE') {
        const update = {
          status: msg.payload.status || msg.payload,
          task: msg.payload.task
        }
        // 更新 state
        setAgentStatusesState(prev => ({
          ...prev,
          [msg.from]: update
        }))
      }
    }

    devLog('[useAIStatus] 订阅 MessageBus, agentId:', agentId)
    bus.subscribe(agentId, handleMessage)

    // 清理函数
    return () => {
      devLog('[useAIStatus] 取消订阅 MessageBus, agentId:', agentId)
      bus.unsubscribe(agentId)
    }
  }, [isOwner, roomId, addDebugLog])

  return { debugLog, addDebugLog, agentStatuses }
}
