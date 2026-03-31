'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

/**
 * Service Worker 状态
 */
type SWStatus = 'checking' | 'activated' | 'unsupported' | 'error'

/**
 * Service Worker 状态信息
 */
interface SWState {
  status: SWStatus
  message: string
  updateAvailable: boolean
}

/**
 * Service Worker 状态显示属性
 */
interface ServiceWorkerStatusProps {
  /** 自定义类名 */
  className?: string
  /** 是否显示详细信息 */
  showDetails?: boolean
  /** 更新可用时的回调 */
  onUpdateAvailable?: () => void
}

/**
 * 获取初始状态
 */
function getInitialState(): SWState {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return {
      status: 'unsupported',
      message: '当前浏览器不支持 Service Worker',
      updateAvailable: false,
    }
  }

  return {
    status: 'checking',
    message: '正在检查 Service Worker 状态...',
    updateAvailable: false,
  }
}

/**
 * Service Worker 状态组件
 *
 * 显示 Service Worker 运行状态，检测更新并提示刷新。
 *
 * @example
 * ```tsx
 * <ServiceWorkerStatus />
 * <ServiceWorkerStatus showDetails onUpdateAvailable={() => window.location.reload()} />
 * ```
 */
export function ServiceWorkerStatus({
  className = '',
  showDetails = false,
  onUpdateAvailable,
}: ServiceWorkerStatusProps) {
  const [state, setState] = useState<SWState>(getInitialState)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      setState({
        status: 'unsupported',
        message: '当前浏览器不支持 Service Worker',
        updateAvailable: false,
      })
      return
    }

    // 检查 Service Worker 状态
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration) {
        if (registration.active) {
          setState({
            status: 'activated',
            message: 'Service Worker 已激活',
            updateAvailable: !!registration.waiting,
          })

          // 检测更新
          if (registration.waiting && onUpdateAvailable) {
            onUpdateAvailable()
          }
        }
      } else {
        setState({
          status: 'unsupported',
          message: 'Service Worker 未注册',
          updateAvailable: false,
        })
      }
    }).catch(() => {
      setState({
        status: 'error',
        message: 'Service Worker 状态检查失败',
        updateAvailable: false,
      })
    })

    // 监听 Service Worker 更新
    const handleControllerChange = () => {
      window.location.reload()
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
    }
  }, [onUpdateAvailable])

  /**
   * 手动刷新并获取更新
   */
  const handleRefresh = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  // 开发环境或详细信息模式显示状态
  if (showDetails) {
    return (
      <div className={`flex items-center gap-2 text-sm ${className}`}>
        {getStatusIcon(state.status)}
        <span>{state.message}</span>
        {state.updateAvailable && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
          >
            <RefreshCw className="w-4 h-4" />
            <span>刷新更新</span>
          </button>
        )}
      </div>
    )
  }

  return null
}

/**
 * 获取状态图标
 */
function getStatusIcon(status: SWStatus) {
  switch (status) {
    case 'activated':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'checking':
      return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
    case 'unsupported':
      return <AlertCircle className="w-4 h-4 text-amber-500" />
    case 'error':
      return <XCircle className="w-4 h-4 text-red-500" />
  }
}

/**
 * 更新提示横幅
 *
 * 当有新版本可用时显示刷新提示。
 *
 * @example
 * ```tsx
 * <UpdateBanner onRefresh={() => window.location.reload()} />
 * ```
 */
export function UpdateBanner({
  onRefresh,
  className = '',
}: {
  onRefresh?: () => void
  className?: string
}) {
  const [show, setShow] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // 监听 Service Worker 更新
    const handleSWUpdate = () => {
      setShow(true)
    }

    navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate)

    // 检查等待中的 Service Worker
    navigator.serviceWorker.getRegistration().then((registration) => {
      if (registration?.waiting) {
        setShow(true)
      }
    })

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate)
    }
  }, [])

  const handleRefresh = () => {
    setIsRefreshing(true)
    if (onRefresh) {
      onRefresh()
    } else {
      window.location.reload()
    }
  }

  if (!show) {
    return null
  }

  return (
    <div
      className={`
        fixed top-16 left-0 right-0 z-50
        bg-blue-500 text-white
        px-4 py-3
        flex items-center justify-center gap-3
        shadow-lg
        ${className}
      `}
      role="alert"
      aria-live="polite"
    >
      <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      <span className="font-medium">
        {isRefreshing ? '正在更新...' : '有新版本可用，点击刷新获取最新内容'}
      </span>
      {!isRefreshing && (
        <button
          onClick={handleRefresh}
          className="px-3 py-1 bg-white text-blue-500 rounded-lg font-medium hover:bg-blue-50 transition-colors"
        >
          刷新
        </button>
      )}
    </div>
  )
}
