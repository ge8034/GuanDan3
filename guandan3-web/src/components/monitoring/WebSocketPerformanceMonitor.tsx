'use client'

import { useState, useEffect } from 'react'
import { useWebSocketOptimizer } from '@/lib/hooks/useOptimizedRoomSubscription'

interface CompressionStats {
  averageRatio: number
  averageTime: number
  totalSavings: number
  messageCount: number
}

interface QueueStats {
  channel: string
  messageCount: number
  size: number
  age: number
}

export default function WebSocketPerformanceMonitor() {
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [compressionStats, setCompressionStats] = useState<CompressionStats | null>(null)
  const [queueStats, setQueueStats] = useState<QueueStats[]>([])

  const { getCompressionStats, getQueueStats } = useWebSocketOptimizer()

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'w' && e.ctrlKey && e.shiftKey) {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const updateStats = () => {
      try {
        setCompressionStats(getCompressionStats())
        setQueueStats(getQueueStats())
      } catch (error) {
        console.error('Failed to get WebSocket stats:', error)
      }
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)

    return () => clearInterval(interval)
  }, [isVisible, getCompressionStats, getQueueStats])

  if (!isVisible || !compressionStats) return null

  const getCompressionRatioColor = (ratio: number) => {
    if (ratio < 0.5) return 'text-green-500'
    if (ratio < 0.8) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getCompressionTimeColor = (time: number) => {
    if (time < 5) return 'text-green-500'
    if (time < 10) return 'text-yellow-500'
    return 'text-red-500'
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  const formatAge = (age: number) => {
    if (age < 1000) return `${age}ms`
    if (age < 60000) return `${(age / 1000).toFixed(1)}s`
    return `${(age / 60000).toFixed(1)}m`
  }

  return (
    <div className="fixed bottom-4 left-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white font-mono text-xs max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">WebSocket性能监控</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>消息数:</span>
          <span>{compressionStats.messageCount}</span>
        </div>
        <div className="flex justify-between">
          <span>压缩比:</span>
          <span className={getCompressionRatioColor(compressionStats.averageRatio)}>
            {(compressionStats.averageRatio * 100).toFixed(1)}%
          </span>
        </div>
        <div className="flex justify-between">
          <span>压缩时间:</span>
          <span className={getCompressionTimeColor(compressionStats.averageTime)}>
            {compressionStats.averageTime.toFixed(2)}ms
          </span>
        </div>
        <div className="flex justify-between">
          <span>节省流量:</span>
          <span className="text-green-500">
            {formatBytes(compressionStats.totalSavings)}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-2">
          {queueStats.length > 0 ? (
            <div>
              <div className="text-blue-500 font-bold mb-1">消息队列</div>
              {queueStats.map((queue, i) => (
                <div key={i} className="text-xs text-gray-300">
                  <div className="flex justify-between">
                    <span className="truncate">{queue.channel}</span>
                    <span>{queue.messageCount}条</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>{formatBytes(queue.size)}</span>
                    <span>{formatAge(queue.age)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-green-500 text-center">
              无待处理消息
            </div>
          )}
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700 text-gray-400 text-center">
        按 Ctrl+Shift+W 切换显示
      </div>
    </div>
  )
}
