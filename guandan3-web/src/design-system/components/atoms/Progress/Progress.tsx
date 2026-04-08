/**
 * Progress 组件
 *
 * 进度条组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 进度值 (0-100)
   */
  value?: number

  /**
   * 最大值
   * @default 100
   */
  max?: number

  /**
   * 尺寸
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 变体
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error'

  /**
   * 是否显示百分比文本
   * @default false
   */
  showLabel?: boolean

  /**
   * 是否为不确定进度（加载动画）
   * @default false
   */
  indeterminate?: boolean
}

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
}

// ============================================
// 颜色变体
// ============================================
const variantClasses = {
  default: 'bg-poker-table-500',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

/**
 * Progress 组件
 *
 * @example
 * ```tsx
 * <Progress value={50} />
 *
 * <Progress value={75} variant="success" showLabel />
 *
 * <Progress indeterminate />
 *
 * <Progress value={25} size="lg" variant="warning" />
 * ```
 */
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      max = 100,
      size = 'md',
      variant = 'default',
      showLabel = false,
      indeterminate = false,
      className,
      ...props
    },
    ref
  ) => {
    // 确保值在有效范围内
    const clampedValue = Math.max(0, Math.min(100, value))
    const percentage = Math.round((clampedValue / max) * 100)

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        {/* 进度条 */}
        <div
          className={cn(
            'flex-1',
            'bg-neutral-200',
            'rounded-full',
            'overflow-hidden',
            sizeClasses[size]
          )}
          role="progressbar"
          aria-valuenow={indeterminate ? undefined : clampedValue}
          aria-valuemax={max}
          aria-valuetext={showLabel ? `${percentage}%` : undefined}
        >
          {/* 进度填充 */}
          {!indeterminate && (
            <div
              className={cn(
                'h-full',
                'rounded-full',
                'transition-all',
                'duration-300',
                'ease-[cubic-bezier(0.16,1,0.3,1)]',
                variantClasses[variant]
              )}
              style={{ width: `${percentage}%` }}
            />
          )}

          {/* 不确定进度动画 */}
          {indeterminate && (
            <div
              className={cn(
                'h-full',
                'rounded-full',
                variantClasses[variant],
                'animate-pulse'
              )}
              style={{
                width: '40%',
                marginLeft: '-30%',
                animation: 'progress-indeterminate 1.5s ease-in-out infinite',
              }}
            />
          )}
        </div>

        {/* 百分比标签 */}
        {showLabel && !indeterminate && (
          <span
            className={cn(
              'text-sm',
              'font-medium',
              'tabular-nums',
              variantClasses[variant].replace('bg-', 'text-'),
              'min-w-[3rem]'
            )}
          >
            {percentage}%
          </span>
        )}
      </div>
    )
  }
)

Progress.displayName = 'Progress'

// 添加CSS动画
if (typeof document !== 'undefined') {
  const style = document.createElement('style')
  style.textContent = `
    @keyframes progress-indeterminate {
      0% {
        margin-left: -30%;
      }
      50% {
        margin-left: 30%;
      }
      100% {
        margin-left: -30%;
      }
    }
  `
  document.head.appendChild(style)
}

export default Progress
