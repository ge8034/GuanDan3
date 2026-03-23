'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/optimized-client'

interface DatabaseMetrics {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  averageDuration: number
  p95Duration: number
  p99Duration: number
  cacheHitRate: number
  connectionPoolUsage: number
}

interface CacheStats {
  size: number
  maxSize: number
  totalHits: number
  avgHits: number
  hitRate: number
}

export default function DatabasePerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [metrics, setMetrics] = useState<DatabaseMetrics | null>(null)
  const [cacheStats, setCacheStats] = useState<CacheStats | null>(null)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.ctrlKey && e.shiftKey) {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const updateMetrics = () => {
      try {
        // 检查方法是否存在（兼容标准Supabase客户端）
        const client = supabase as any
        if (client.getDatabaseMetrics && client.getDatabasePerformanceReport) {
          const dbMetrics = client.getDatabaseMetrics()
          const report = client.getDatabasePerformanceReport()
          setMetrics(dbMetrics)
          setCacheStats(report.cacheStats)
        }
      } catch (error) {
        console.error('Failed to get database metrics:', error)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible || !metrics || !cacheStats) return null

  const getDurationColor = (duration: number) => {
    if (duration < 100) return 'text-green-500'
    if (duration < 500) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getCacheRateColor = (rate: number) => {
    if (rate >= 0.7) return 'text-green-500'
    if (rate >= 0.5) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getSuccessRate = () => {
    if (metrics.totalQueries === 0) return 0
    return (metrics.successfulQueries / metrics.totalQueries) * 100
  }

  const getSuccessRateColor = () => {
    const rate = getSuccessRate()
    if (rate >= 99) return 'bg-green-500'
    if (rate >= 95) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div className="fixed top-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white font-mono text-xs max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">数据库性能监控</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>总查询数:</span>
          <span>{metrics.totalQueries}</span>
        </div>
        <div className="flex justify-between">
          <span>成功率:</span>
          <span className={`px-2 py-0.5 rounded text-white ${getSuccessRateColor()}`}>
            {getSuccessRate().toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>平均延迟:</span>
          <span className={getDurationColor(metrics.averageDuration)}>
            {metrics.averageDuration.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>P95延迟:</span>
          <span className={getDurationColor(metrics.p95Duration)}>
            {metrics.p95Duration.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>P99延迟:</span>
          <span className={getDurationColor(metrics.p99Duration)}>
            {metrics.p99Duration.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>缓存命中率:</span>
          <span className={getCacheRateColor(metrics.cacheHitRate)}>
            {(metrics.cacheHitRate * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>成功查询:</span>
            <span className="text-green-500">{metrics.successfulQueries}</span>
          </div>
          <div className="flex justify-between">
            <span>失败查询:</span>
            <span className="text-red-500">{metrics.failedQueries}</span>
          </div>
          <div className="flex justify-between">
            <span>缓存大小:</span>
            <span>{cacheStats.size}/{cacheStats.maxSize}</span>
          </div>
          <div className="flex justify-between">
            <span>缓存命中:</span>
            <span>{cacheStats.totalHits}</span>
          </div>
          <div className="flex justify-between">
            <span>平均命中:</span>
            <span>{cacheStats.avgHits.toFixed(2)}</span>
          </div>
          <div className="flex justify-between">
            <span>连接池使用:</span>
            <span>{(metrics.connectionPoolUsage * 100).toFixed(1)}%</span>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
        <button
          onClick={() => {
            const client = supabase as any
            if (client.clearDatabaseCache) {
              client.clearDatabaseCache()
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded transition-colors"
        >
          清除缓存
        </button>
        <button
          onClick={() => {
            const client = supabase as any
            if (client.exportDatabaseMetrics) {
              const report = client.exportDatabaseMetrics()
              const blob = new Blob([report], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `database-metrics-${Date.now()}.json`
              a.click()
              URL.revokeObjectURL(url)
            }
          }}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-1 px-2 rounded transition-colors"
        >
          导出指标
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700 text-gray-400 text-center">
        按 Ctrl+Shift+D 切换显示
      </div>
    </div>
  )
}
