'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/optimized-client'

interface NetworkMetrics {
  requestCount: number
  totalBytes: number
  averageLatency: number
  p95Latency: number
  p99Latency: number
  errorRate: number
}

interface RequestMetrics {
  url: string
  method: string
  duration: number
  status: number
  bytes: number
  timestamp: number
}

export default function NetworkPerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null)
  const [slowRequests, setSlowRequests] = useState<RequestMetrics[]>([])
  const [failedRequests, setFailedRequests] = useState<RequestMetrics[]>([])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'n' && e.ctrlKey && e.shiftKey) {
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
        const client = supabase as any
        if (client.getNetworkPerformanceReport) {
          const report = client.getNetworkPerformanceReport()
          setMetrics(report.metrics)
          setSlowRequests(report.slowRequests.slice(0, 5))
          setFailedRequests(report.failedRequests.slice(0, 5))
        }
      } catch (error) {
        console.error('Failed to get network metrics:', error)
      }
    }

    updateMetrics()
    const interval = setInterval(updateMetrics, 2000)

    return () => clearInterval(interval)
  }, [isVisible])

  if (!isVisible || !metrics) return null

  const getLatencyColor = (latency: number) => {
    if (latency < 200) return 'text-green-500'
    if (latency < 500) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getErrorRateColor = (rate: number) => {
    if (rate < 0.01) return 'text-green-500'
    if (rate < 0.05) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white font-mono text-xs max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">网络性能监控</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>请求数:</span>
          <span>{metrics.requestCount}</span>
        </div>
        <div className="flex justify-between">
          <span>总流量:</span>
          <span>{formatBytes(metrics.totalBytes)}</span>
        </div>
        <div className="flex justify-between">
          <span>平均延迟:</span>
          <span className={getLatencyColor(metrics.averageLatency)}>
            {metrics.averageLatency.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>P95延迟:</span>
          <span className={getLatencyColor(metrics.p95Latency)}>
            {metrics.p95Latency.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>P99延迟:</span>
          <span className={getLatencyColor(metrics.p99Latency)}>
            {metrics.p99Latency.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>错误率:</span>
          <span className={getErrorRateColor(metrics.errorRate)}>
            {(metrics.errorRate * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {slowRequests.length > 0 && (
            <div>
              <div className="text-yellow-500 font-bold mb-1">慢请求 (Top 5)</div>
              {slowRequests.map((req, i) => (
                <div key={i} className="text-xs text-gray-300 truncate">
                  {req.method} {req.url} - {req.duration.toFixed(2)}ms
                </div>
              ))}
            </div>
          )}

          {failedRequests.length > 0 && (
            <div>
              <div className="text-red-500 font-bold mb-1">失败请求 (Top 5)</div>
              {failedRequests.map((req, i) => (
                <div key={i} className="text-xs text-gray-300 truncate">
                  {req.method} {req.url} - {req.status}
                </div>
              ))}
            </div>
          )}

          {slowRequests.length === 0 && failedRequests.length === 0 && (
            <div className="text-green-500 text-center">
              无慢请求或失败请求
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700">
        <button
          onClick={() => {
            const client = supabase as any
            if (client.clearNetworkMetrics) {
              client.clearNetworkMetrics()
            }
          }}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded transition-colors"
        >
          清除指标
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-gray-700 text-gray-400 text-center">
        按 Ctrl+Shift+N 切换显示
      </div>
    </div>
  )
}
