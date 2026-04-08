/**
 * Toast 组件
 *
 * 通知提示组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 提示类型
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info'

  /**
   * 标题
   */
  title?: string

  /**
   * 内容
   */
  children?: ReactNode

  /**
   * 自动关闭时间 (ms)
   * @default 5000
   */
  duration?: number

  /**
   * 是否显示关闭按钮
   * @default true
   */
  closable?: boolean

  /**
   * 关闭回调
   */
  onClose?: () => void

  /**
   * 显示图标
   * @default true
   */
  showIcon?: boolean
}

// ============================================
// 图标组件
// ============================================
const Icons = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  default: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// ============================================
// 颜色变体
// ============================================
const variantClasses = {
  default: {
    container: 'bg-neutral-800 text-white border-neutral-700',
    icon: 'text-neutral-400',
  },
  success: {
    container: 'bg-success text-white border-success',
    icon: 'text-white',
  },
  warning: {
    container: 'bg-warning text-white border-warning',
    icon: 'text-white',
  },
  error: {
    container: 'bg-error text-white border-error',
    icon: 'text-white',
  },
  info: {
    container: 'bg-blue-500 text-white border-blue-600',
    icon: 'text-white',
  },
}

/**
 * Toast 组件
 *
 * @example
 * ```tsx
 * <Toast title="成功" variant="success">
 *   操作已成功完成
 * </Toast>
 *
 * <Toast title="警告" variant="warning">
 *   请注意此操作的风险
 * </Toast>
 *
 * <Toast
 *   title="错误"
 *   variant="error"
 *   duration={10000}
 *   closable={false}
 * >
 *   操作失败，请稍后重试
 * </Toast>
 * ```
 */
export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      variant = 'default',
      title,
      children,
      duration = 5000,
      closable = true,
      onClose,
      showIcon = true,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true)

    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose()
        }, duration)

        return () => clearTimeout(timer)
      }
    }, [duration])

    const handleClose = () => {
      setIsVisible(false)
      onClose?.()
    }

    if (!isVisible) {
      return null
    }

    const classes = variantClasses[variant]

    return (
      <div
        ref={ref}
        className={cn(
          // 布局
          'flex',
          'items-start',
          'gap-3',
          'p-4',
          'rounded-lg',
          'border',
          'shadow-lg',
          'min-w-[300px]',
          'max-w-md',
          // 颜色
          classes.container,
          // 动画
          'transition-all',
          'duration-300',
          'ease-out',
          'animate-in',
          'slide-in-from-right',
          'fade-in',
          className
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {/* 图标 */}
        {showIcon && (
          <div className={cn('flex-shrink-0 mt-0.5', classes.icon)}>
            {Icons[variant]}
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-semibold text-sm mb-1">{title}</div>
          )}
          {children && (
            <div className="text-sm opacity-90">{children}</div>
          )}
        </div>

        {/* 关闭按钮 */}
        {closable && (
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0',
              'opacity-70',
              'hover:opacity-100',
              'transition-opacity',
              'p-0.5',
              'rounded',
              'hover:bg-black/10'
            )}
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    )
  }
)

Toast.displayName = 'Toast'

export default Toast
