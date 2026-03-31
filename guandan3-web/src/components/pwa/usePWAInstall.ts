'use client'

import { useEffect, useState, useCallback } from 'react'

/**
 * PWA 安装状态
 */
export interface PWAInstallState {
  /** 是否可以安装 */
  canInstall: boolean
  /** 延迟的安装提示事件 */
  deferredPrompt: Event | null
}

/**
 * PWA 安装 Hook
 *
 * 检测和触发 PWA 安装提示。
 *
 * @returns PWA 安装状态和安装函数
 *
 * @example
 * ```tsx
 * function InstallButton() {
 *   const { canInstall, promptInstall } = usePWAInstall()
 *
 *   if (!canInstall) return null
 *
 *   return (
 *     <button onClick={promptInstall}>
 *       安装应用
 *     </button>
 *   )
 * }
 * ```
 */
export function usePWAInstall() {
  const [state, setState] = useState<PWAInstallState>({
    canInstall: false,
    deferredPrompt: null,
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setState({
        canInstall: true,
        deferredPrompt: e,
      })
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  /**
   * 请求安装 PWA
   *
   * @returns Promise<boolean> - 用户是否接受安装
   */
  const promptInstall = useCallback(async (): Promise<boolean> => {
    if (!state.canInstall || !state.deferredPrompt) {
      return false
    }

    const promptEvent = state.deferredPrompt as any
    promptEvent.prompt()

    const { outcome } = await promptEvent.userChoice

    setState({
      canInstall: false,
      deferredPrompt: null,
    })

    return outcome === 'accepted'
  }, [state.canInstall, state.deferredPrompt])

  return {
    canInstall: state.canInstall,
    promptInstall,
  }
}
