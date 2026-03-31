'use client'

import { useEffect } from 'react'
import { setupResourcePreloading, setupPerformanceObserver } from '@/lib/performance/resource-optimizer'

/**
 * 性能优化设置组件
 *
 * 在客户端初始化资源预加载和性能监控
 * 必须是客户端组件，因为需要访问浏览器 API
 */
export default function PerformanceSetup() {
  useEffect(() => {
    setupResourcePreloading()
    setupPerformanceObserver()
  }, [])

  return null
}
