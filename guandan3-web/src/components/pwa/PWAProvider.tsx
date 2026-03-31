'use client'

import { useEffect, useState } from 'react'

/**
 * PWA 联机状态
 */
interface OnlineStatus {
  /** 是否在线 */
  isOnline: boolean
  /** 上次状态变更时间 */
  since: Date
}

/**
 * PWA 安装提示状态
 */
interface InstallPrompt {
  /** 是否可安装 */
  canInstall: boolean
  /** 延迟安装事件 */
  deferredPrompt: Event | null
}

/**
 * PWA 上下文类型
 */
interface PWAContextValue {
  /** 联机状态 */
  online: OnlineStatus
  /** 安装提示状态 */
  install: InstallPrompt
  /** 请求安装 PWA */
  promptInstall: () => Promise<boolean>
}

/**
 * PWA 提供者属性
 */
interface PWAProviderProps {
  children: React.ReactNode
}

/**
 * PWA 联机状态初始值
 */
const initialOnlineStatus: OnlineStatus = {
  isOnline: true,
  since: new Date(),
}

/**
 * PWA 安装提示初始值
 */
const initialInstallPrompt: InstallPrompt = {
  canInstall: false,
  deferredPrompt: null,
}

/**
 * PWA Provider
 *
 * 提供完整的 PWA 功能支持，包括：
 * - 联机/离线状态检测
 * - PWA 安装提示
 * - Service Worker 状态监控
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <PWAProvider>
 *       <Layout />
 *     </PWAProvider>
 *   )
 * }
 * ```
 */
export function PWAProvider({ children }: PWAProviderProps) {
  const [online, setOnline] = useState<OnlineStatus>(initialOnlineStatus)
  const [install, setInstall] = useState<InstallPrompt>(initialInstallPrompt)

  useEffect(() => {
    // 联机状态变化处理
    const handleOnline = () => {
      setOnline({ isOnline: true, since: new Date() })
    }

    const handleOffline = () => {
      setOnline({ isOnline: false, since: new Date() })
    }

    // PWA 安装提示处理
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setInstall({
        canInstall: true,
        deferredPrompt: e,
      })
    }

    // 监听联机状态
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 监听 PWA 安装提示
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 初始化联机状态
    setOnline({
      isOnline: navigator.onLine,
      since: new Date(),
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  /**
   * 请求安装 PWA
   */
  const promptInstall = async (): Promise<boolean> => {
    if (!install.canInstall || !install.deferredPrompt) {
      return false
    }

    const promptEvent = install.deferredPrompt as any
    promptEvent.prompt()

    const { outcome } = await promptEvent.userChoice

    setInstall({
      canInstall: false,
      deferredPrompt: null,
    })

    return outcome === 'accepted'
  }

  const contextValue: PWAContextValue = {
    online,
    install,
    promptInstall,
  }

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
    </PWAContext.Provider>
  )
}

/**
 * PWA Context
 */
export const PWAContext = React.createContext<PWAContextValue | null>(null)

import React from 'react'
