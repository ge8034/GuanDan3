/**
 * Alert 组件
 *
 * 警告提示组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 提示类型
   * @default 'info'
   */
  variant?: 'info' | 'success' | 'warning' | 'error'

  /**
   * 标题
   */
  title?: string

  /**
   * 内容
   */
  children?: ReactNode

  /**
   * 是否显示图标
   * @default true
   */
  showIcon?: boolean

  /**
   * 是否可关闭
   * @default false
   */
  closable?: boolean

  /**
   * 关闭回调
   */
  onClose?: () => void

  /**
   * 操作按钮区域
   */
  action?: ReactNode
}

// ============================================
// 图标组件
// ============================================
const Icons = {
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
}

// ============================================
// 颜色变体
// ============================================
const variantClasses = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'text-blue-500',
    title: 'text-blue-900',
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: 'text-success',
    title: 'text-green-900',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    icon: 'text-warning',
    title: 'text-yellow-900',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'text-error',
    title: 'text-red-900',
  },
}

/**
 * Alert 组件
 *
 * @example
 * ```tsx
 * <Alert title="提示标题">
 *   这是一条提示信息
 * </Alert>
 *
 * <Alert variant="success" title="成功" closable>
 *   操作已成功完成
 * </Alert>
 *
 * <Alert variant="warning" title="警告" action={<button>查看</button>}>
 *   请注意此操作的风险
 * </Alert>
 * ```
 */
export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      variant = 'info',
      title,
      children,
      showIcon = true,
      closable = false,
      onClose,
      action,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true)

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
          // 颜色
          classes.container,
          // 动画
          'transition-opacity',
          'duration-200',
          'ease-out',
          className
        )}
        role="alert"
        aria-live="polite"
        {...props}
      >
        {/* 图标 */}
        {showIcon && (
          <div className={cn('flex-shrink-0', classes.icon)}>
            {Icons[variant]}
          </div>
        )}

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className={cn('font-semibold text-sm mb-1', classes.title)}>
              {title}
            </div>
          )}
          {children && (
            <div className="text-sm leading-relaxed">
              {children}
            </div>
          )}
        </div>

        {/* 操作区域 */}
        {action && (
          <div className="flex-shrink-0 ml-2">
            {action}
          </div>
        )}

        {/* 关闭按钮 */}
        {closable && (
          <button
            onClick={handleClose}
            className={cn(
              'flex-shrink-0',
              'ml-2',
              'opacity-70',
              'hover:opacity-100',
              'transition-opacity',
              'p-0.5',
              'rounded',
              'hover:bg-black/5'
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

Alert.displayName = 'Alert'

export default Alert
