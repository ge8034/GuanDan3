'use client'

import { useState, useEffect } from 'react'
import { use3DPerformance } from '@/hooks/use3DPerformance'

export default function PerformanceMonitor() {
  const { capabilities, currentFPS, isPerformanceMode } = use3DPerformance()
  const [isVisible, setIsVisible] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'p' && e.ctrlKey) {
        setIsVisible(prev => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible) return null

  const getFPSColor = () => {
    if (currentFPS >= 55) return 'text-green-500'
    if (currentFPS >= 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getPerformanceStatus = () => {
    if (isPerformanceMode) return '性能模式'
    if (capabilities.isLowEnd) return '低端设备'
    if (capabilities.isMobile) return '移动设备'
    return '高性能'
  }

  const getStatusColor = () => {
    if (isPerformanceMode) return 'bg-orange-500'
    if (capabilities.isLowEnd) return 'bg-red-500'
    if (capabilities.isMobile) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white font-mono text-xs max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <span className="font-bold">性能监控</span>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="text-gray-400 hover:text-white transition-colors"
        >
          {showDetails ? '▼' : '▶'}
        </button>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between">
          <span>FPS:</span>
          <span className={getFPSColor()}>{currentFPS}</span>
        </div>
        <div className="flex justify-between">
          <span>状态:</span>
          <span className={`px-2 py-0.5 rounded text-white ${getStatusColor()}`}>
            {getPerformanceStatus()}
          </span>
        </div>
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-700 space-y-1">
          <div className="flex justify-between">
            <span>设备类型:</span>
            <span>{capabilities.isMobile ? '移动端' : '桌面端'}</span>
          </div>
          <div className="flex justify-between">
            <span>低端设备:</span>
            <span>{capabilities.isLowEnd ? '是' : '否'}</span>
          </div>
          <div className="flex justify-between">
            <span>目标FPS:</span>
            <span>{capabilities.maxFPS}</span>
          </div>
          <div className="flex justify-between">
            <span>像素比:</span>
            <span>{capabilities.pixelRatio.toFixed(1)}x</span>
          </div>
          <div className="flex justify-between">
            <span>阴影质量:</span>
            <span>{capabilities.shadowMapSize}px</span>
          </div>
          <div className="flex justify-between">
            <span>粒子数量:</span>
            <span>{capabilities.particleCount}</span>
          </div>
          <div className="flex justify-between">
            <span>几何体细节:</span>
            <span>{capabilities.geometryDetail}</span>
          </div>
        </div>
      )}

      <div className="mt-3 pt-3 border-t border-gray-700 text-gray-400 text-center">
        按 Ctrl+P 切换显示
      </div>
    </div>
  )
}
