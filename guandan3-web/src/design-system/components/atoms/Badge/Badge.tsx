/**
 * Badge 组件
 *
 * 徽章/标签组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 徽章变体
   * @default 'default'
   */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'gold'

  /**
   * 尺寸
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 是否为点状徽章
   * @default false
   */
  dot?: boolean

  /**
   * 数字徽章计数
   */
  count?: number | string

  /**
   * 最大显示数字（超过显示+N）
   */
  max?: number
}

// ============================================
// 变体样式
// ============================================
const variantClasses = {
  default: [
    'bg-neutral-100',
    'text-neutral-700',
    'border-neutral-200',
  ],
  primary: [
    'bg-poker-table-100',
    'text-poker-table-700',
    'border-poker-table-200',
  ],
  secondary: [
    'bg-neutral-200',
    'text-neutral-800',
    'border-neutral-300',
  ],
  success: [
    'bg-semantic-success/10',
    'text-semantic-success-dark',
    'border-semantic-success/20',
  ],
  warning: [
    'bg-semantic-warning/10',
    'text-semantic-warning-dark',
    'border-semantic-warning/20',
  ],
  error: [
    'bg-semantic-error/10',
    'text-semantic-error-dark',
    'border-semantic-error/20',
  ],
  gold: [
    'bg-accent-gold/10',
    'text-accent-gold-dark',
    'border-accent-gold/20',
  ],
}

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  sm: [
    'px-2',
    'py-0.5',
    'text-xs',
    'rounded',
  ],
  md: [
    'px-2.5',
    'py-0.5',
    'text-sm',
    'rounded-md',
  ],
  lg: [
    'px-3',
    'py-1',
    'text-base',
    'rounded-lg',
  ],
}

// ============================================
// 点状徽章尺寸
// ============================================
const dotSizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
}

/**
 * Badge 组件
 *
 * @example
 * ```tsx
 * <Badge>新消息</Badge>
 *
 * <Badge variant="success">已完成</Badge>
 *
 * <Badge variant="error" count={5} />
 *
 * <Badge variant="primary" dot />
 * ```
 */
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      count,
      max = 99,
      className,
      children,
      ...props
    },
    ref
  ) => {
    // 格式化计数显示
    const displayCount =
      typeof count === 'number' && count > max ? `${max}+` : count

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex',
          'items-center',
          'justify-center',
          'border',
          'font-medium',
          'transition-colors',
          'duration-200',
          'ease-[cubic-bezier(0.16,1,0.3,1)]',

          // 变体
          ...variantClasses[variant],

          // 尺寸（非点状）
          !dot && sizeClasses[size],

          // 自定义类名
          className
        )}
        {...props}
      >
        {/* 点状徽章 */}
        {dot ? (
          <span
            className={cn(
              'rounded-full',
              'bg-current',
              dotSizeClasses[size]
            )}
          />
        ) : count !== undefined ? (
          // 数字徽章
          <span className="min-w-[1.25rem] text-center">{displayCount}</span>
        ) : (
          // 文本徽章
          children
        )}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

// ============================================
// BadgeAnchor - 定位徽章组件
// ============================================
export interface BadgeAnchorProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  badge?: React.ReactNode
  /**
   * 徽章位置
   * @default 'top-right'
   */
  placement?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'
  /**
   * 是否显示点状徽章
   */
  showDot?: boolean
}

/**
 * 带定位徽章的容器组件
 *
 * @example
 * ```tsx
 * <BadgeAnchor badge={<Badge count={5} />}>
 *   <Button>通知</Button>
 * </BadgeAnchor>
 *
 * <BadgeAnchor showDot>
 *   <Button>消息</Button>
 * </BadgeAnchor>
 * ```
 */
export const BadgeAnchor = forwardRef<HTMLDivElement, BadgeAnchorProps>(
  (
    {
      children,
      badge,
      placement = 'top-right',
      showDot = false,
      className,
      ...props
    },
    ref
  ) => {
    // 位置样式
    const placementClasses = {
      'top-right': '-top-1 -right-1',
      'top-left': '-top-1 -left-1',
      'bottom-right': '-bottom-1 -right-1',
      'bottom-left': '-bottom-1 -left-1',
    }

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex', className)}
        {...props}
      >
        {children}

        {/* 徽章 */}
        {(badge || showDot) && (
          <div
            className={cn(
              'absolute',
              'z-10',
              placementClasses[placement],
              'transform',
              'translate-x-1/2',
              'translate-y-1/2',
              placement === 'bottom-right' && 'translate-x-1/2 translate-y-1/2',
              placement === 'bottom-left' && '-translate-x-1/2 translate-y-1/2',
              placement === 'top-left' && '-translate-x-1/2 -translate-y-1/2'
            )}
          >
            {showDot && !badge ? (
              <Badge
                variant="error"
                size="sm"
                dot
                className="ring-2 ring-white"
              />
            ) : (
              badge
            )}
          </div>
        )}
      </div>
    )
  }
)

BadgeAnchor.displayName = 'BadgeAnchor'

export default Badge
