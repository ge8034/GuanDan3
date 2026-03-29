import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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

  // 使用 ref 存储最新状态，避免闭包陷阱
  const agentStatusesRef = useRef<Record<string, { status: string; task?: string }>>({})
  const [agentStatusesState, setAgentStatusesState] = useState<Record<string, { status: string; task?: string }>>({})

  // addDebugLog 使用 useCallback 但依赖为空，保持稳定引用
  const addDebugLog = useCallback((msg: string) => {
    setDebugLog((prev) => [msg, ...prev].slice(0, 5))
  }, [])

  // 暴露当前状态
  const agentStatuses = useMemo(
    () => ({ ...agentStatusesRef.current, ...agentStatusesState }),
    [agentStatusesState]
  )

  // MessageBus 订阅（修复版）
  useEffect(() => {
    if (!isOwner) return

    const bus = MessageBus.getInstance()
    const agentId = `room-${roomId}`

    // 使用 ref 存储最新状态，避免回调依赖变化
    const latestStateRef = {
      agentStatusesRef,
      setAgentStatusesState,
      addDebugLog
    }

    // 创建稳定的回调函数
    const handleMessage = (msg: Message) => {
      devLog('[useAIStatus] 收到消息:', msg.type, msg.from)

      if (msg.type === 'AGENT_LOG') {
        latestStateRef.addDebugLog(`${msg.from}: ${msg.payload}`)
      }

      if (msg.type === 'STATUS_UPDATE') {
        const update = {
          status: msg.payload.status || msg.payload,
          task: msg.payload.task
        }
        // 更新 ref
        latestStateRef.agentStatusesRef.current[msg.from] = update
        // 更新 state
        latestStateRef.setAgentStatusesState(prev => ({
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
  }, [isOwner, roomId]) // 移除 addDebugLog 依赖，仅依赖 isOwner 和 roomId

  return { debugLog, addDebugLog, agentStatuses }
}
