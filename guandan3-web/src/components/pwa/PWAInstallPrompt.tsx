'use client'

import { useContext, useState, useEffect } from 'react'
import { PWAContext } from './PWAProvider'
import { Download, X } from 'lucide-react'

/**
 * PWA 安装提示属性
 */
interface PWAInstallPromptProps {
  /** 自定义类名 */
  className?: string
  /** 是否显示关闭按钮 */
  showClose?: boolean
  /** 提示位置 */
  position?: 'bottom' | 'top'
}

/**
 * 本地存储键
 */
const DISMISS_PROMPT_KEY = 'pwa-install-prompt-dismissed'

/**
 * 检查提示是否已被用户关闭
 */
function wasPromptDismissed(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(DISMISS_PROMPT_KEY) === 'true'
  } catch {
    return false
  }
}

/**
 * 标记提示已被用户关闭
 */
function dismissPrompt(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DISMISS_PROMPT_KEY, 'true')
  } catch {
    // 忽略存储错误
  }
}

/**
 * PWA 安装提示组件
 *
 * 当应用可以安装为 PWA 时显示安装提示。
 * 支持用户关闭并记住选择。
 *
 * @example
 * ```tsx
 * <PWAInstallPrompt />
 * <PWAInstallPrompt position="top" showClose />
 * ```
 */
export function PWAInstallPrompt({
  className = '',
  showClose = true,
  position = 'bottom',
}: PWAInstallPromptProps) {
  const context = useContext(PWAContext)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    setDismissed(wasPromptDismissed())
  }, [])

  if (!context) {
    return null
  }

  const { install, promptInstall } = context

  // 不能安装或已被关闭
  if (!install.canInstall || dismissed) {
    return null
  }

  /**
   * 处理安装按钮点击
   */
  const handleInstall = async () => {
    const accepted = await promptInstall()
    if (accepted) {
      setDismissed(true)
    }
  }

  /**
   * 处理关闭按钮点击
   */
  const handleClose = () => {
    dismissPrompt()
    setDismissed(true)
  }

  const positionClasses = position === 'bottom'
    ? 'bottom-4 left-4 right-4'
    : 'top-20 left-4 right-4'

  return (
    <div
      className={`
        fixed z-50
        ${positionClasses}
        bg-gradient-to-r from-green-600 to-green-500
        text-white
        rounded-xl
        p-4
        shadow-xl
        flex items-center justify-between gap-4
        animate-slide-up
        ${className}
      `}
      role="dialog"
      aria-labelledby="pwa-install-title"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <p id="pwa-install-title" className="font-medium">
            安装掼蛋 3
          </p>
          <p className="text-sm opacity-90">
            添加到主屏幕，获得更好体验
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleInstall}
          className="px-4 py-2 bg-white text-green-600 rounded-lg font-medium hover:bg-green-50 transition-colors"
        >
          安装
        </button>

        {showClose && (
          <button
            onClick={handleClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * 简化版 PWA 安装提示
 *
 * 仅显示安装按钮，适合放在导航栏或设置页面中。
 *
 * @example
 * ```tsx
 * <PWAInstallButton />
 * ```
 */
export function PWAInstallButton({ className = '' }: { className?: string }) {
  const context = useContext(PWAContext)

  if (!context) {
    return null
  }

  const { install, promptInstall } = context

  if (!install.canInstall) {
    return null
  }

  const handleInstall = async () => {
    await promptInstall()
  }

  return (
    <button
      onClick={handleInstall}
      className={`
        flex items-center gap-2
        px-4 py-2
        bg-green-500 hover:bg-green-600
        text-white rounded-lg
        transition-colors
        ${className}
      `}
    >
      <Download className="w-4 h-4" />
      <span>安装应用</span>
    </button>
  )
}
