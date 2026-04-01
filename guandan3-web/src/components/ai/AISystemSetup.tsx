'use client'

import { useEffect } from 'react'
import { aiSystemManager } from '@/lib/hooks/ai/AISystemManager'

/**
 * AI系统设置组件
 *
 * 初始化AI系统管理器的定期清理机制
 * 防止长时间运行导致内存泄漏
 */
export default function AISystemSetup() {
  useEffect(() => {
    // 只在客户端运行
    if (typeof window === 'undefined') return

    // 启动定期清理（每5分钟清理一次超过30分钟未使用的系统）
    const stopCleanup = aiSystemManager.startPeriodicCleanup(
      5 * 60 * 1000, // 清理间隔：5分钟
      30 * 60 * 1000 // 最大存活时间：30分钟
    )

    // 组件卸载时停止清理
    return () => {
      stopCleanup()
    }
  }, [])

  return null
}
