'use client'

import { useContext, useEffect } from 'react'
import { PWAContext } from './PWAProvider'
import { Wifi, WifiOff, AlertCircle } from 'lucide-react'

/**
 * 离线指示器属性
 */
interface OfflineIndicatorProps {
  /** 自定义类名 */
  className?: string
  /** 是否显示详细信息 */
  showDetails?: boolean
}

/**
 * 离线指示器
 *
 * 显示当前网络连接状态，支持离线模式提示。
 *
 * @example
 * ```tsx
 * <OfflineIndicator />
 * <OfflineIndicator showDetails />
 * ```
 */
export function OfflineIndicator({
  className = '',
  showDetails = false,
}: OfflineIndicatorProps) {
  const context = useContext(PWAContext)

  if (!context) {
    return null
  }

  const { online } = context

  // 离线时显示警告
  if (!online.isOnline) {
    return (
      <div
        className={`
          fixed top-16 left-0 right-0 z-50
          bg-amber-500 text-white
          px-4 py-3
          flex items-center justify-center gap-3
          shadow-lg
          animate-slide-down
          ${className}
        `}
        role="alert"
        aria-live="polite"
      >
        <WifiOff className="w-5 h-5 flex-shrink-0" />
        <div className="flex flex-col">
          <span className="font-medium">网络连接已断开</span>
          {showDetails && (
            <span className="text-sm opacity-90">
              部分功能可能不可用，请检查网络连接
            </span>
          )}
        </div>
      </div>
    )
  }

  return null
}

/**
 * 网络状态横幅
 *
 * 显示网络状态变化提示，包括恢复连接和断开连接。
 *
 * @example
 * ```tsx
 * <NetworkBanner />
 * ```
 */
export function NetworkBanner({ className = '' }: { className?: string }) {
  const context = useContext(PWAContext)

  if (!context) {
    return null
  }

  const { online } = context
  const [showBanner, setShowBanner] = useState(false)
  const [bannerType, setBannerType] = useState<'online' | 'offline'>('online')

  useEffect(() => {
    if (!online.isOnline) {
      setBannerType('offline')
      setShowBanner(true)
    } else {
      setBannerType('online')
      setShowBanner(true)

      // 3秒后自动隐藏
      const timer = setTimeout(() => {
        setShowBanner(false)
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [online.isOnline])

  if (!showBanner) {
    return null
  }

  const isOnline = bannerType === 'online'

  return (
    <div
      className={`
        fixed top-16 left-0 right-0 z-50
        ${isOnline ? 'bg-green-500' : 'bg-amber-500'}
        text-white
        px-4 py-3
        flex items-center justify-center gap-3
        shadow-lg
        transition-all duration-300
        ${isOnline ? 'animate-fade-in' : 'animate-slide-down'}
        ${className}
      `}
      role="status"
      aria-live="polite"
    >
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">网络连接已恢复</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">网络连接已断开</span>
        </>
      )}
    </div>
  )
}

import { useState } from 'react'
