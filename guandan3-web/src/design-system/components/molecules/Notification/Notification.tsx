/**
 * Notification 消息通知组件
 *
 * 全局消息提示
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useEffect, useState } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'
import { X } from 'lucide-react'

// ============================================
// 类型定义
// ============================================
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface NotificationProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 消息类型
   */
  type?: NotificationType

  /**
   * 标题
   */
  title?: string

  /**
   * 消息内容
   */
  message: string

  /**
   * 是否显示关闭按钮
   */
  closable?: boolean

  /**
   * 自动关闭时间（毫秒），0 表示不自动关闭
   */
  duration?: number

  /**
   * 关闭回调
   */
  onClose?: () => void

  /**
   * 显示图标
   */
  showIcon?: boolean

  /**
   * 自定义图标
   */
  icon?: React.ReactNode
}

// ============================================
// 图标映射
// ============================================
const typeIcons: Record<NotificationType, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
}

// ============================================
// 样式配置
// ============================================
const typeStyles: Record<NotificationType, string> = {
  success: 'bg-success-50 border-success-200 text-success-800',
  info: 'bg-primary-50 border-primary-200 text-primary-800',
  warning: 'bg-warning-50 border-warning-200 text-warning-800',
  error: 'bg-error-50 border-error-200 text-error-800',
}

const iconColorStyles: Record<NotificationType, string> = {
  success: 'text-success-500',
  info: 'text-primary-500',
  warning: 'text-warning-500',
  error: 'text-error-500',
}

// ============================================
// Notification 主组件
// ============================================
export const Notification = forwardRef<HTMLDivElement, NotificationProps>(
  (
    {
      type = 'info',
      title,
      message,
      closable = true,
      duration = 4500,
      onClose,
      showIcon = true,
      icon,
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(true)
    const [isExiting, setIsExiting] = useState(false)

    // 自动关闭
    useEffect(() => {
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose()
        }, duration)

        return () => clearTimeout(timer)
      }
    }, [duration])

    // 处理关闭
    const handleClose = () => {
      setIsExiting(true)
      // 等待动画完成后触发 onClose
      setTimeout(() => {
        setVisible(false)
        onClose?.()
      }, 200) // 与动画时长匹配
    }

    if (!visible) {
      return null
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          'flex',
          'items-start',
          'gap-3',
          'p-4',
          'rounded-lg',
          'border',
          'shadow-sm',
          'transition-all',
          'duration-200',
          'ease-out',
          typeStyles[type],
          isExiting && 'opacity-0 scale-95',
          className
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {/* 图标 */}
        {showIcon && (
          <div className={cn('flex-shrink-0 mt-0.5', iconColorStyles[type])}>
            {icon || typeIcons[type]}
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className="font-medium text-sm mb-1">{title}</div>
          )}
          <div className="text-sm">{message}</div>
        </div>

        {/* 关闭按钮 */}
        {closable && (
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex-shrink-0',
              'p-1',
              'rounded',
              'hover:bg-black/5',
              'focus:outline-none',
              'focus:ring-2',
              'focus:ring-current',
              'focus:ring-offset-1',
              'transition-colors',
              'duration-150'
            )}
            aria-label="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    )
  }
)

Notification.displayName = 'Notification'

export default Notification
