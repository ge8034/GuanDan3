/**
 * Spinner 组件
 *
 * 加载状态指示器
 * 基于 Impeccable Design 规范
 */

'use client'

import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 尺寸
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'

  /**
   * 颜色变体
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'white' | 'gold'
}

// ============================================
// 尺寸映射
// ============================================
const sizeClasses = {
  xs: 'h-4 w-4 border-2',
  sm: 'h-5 w-5 border-2',
  md: 'h-6 w-6 border-3',
  lg: 'h-8 w-8 border-4',
  xl: 'h-12 w-12 border-4',
}

// ============================================
// 颜色变体
// ============================================
const variantClasses = {
  primary: 'border-poker-table-200 border-t-poker-table-500',
  secondary: 'border-neutral-200 border-t-neutral-400',
  white: 'border-white/30 border-t-white',
  gold: 'border-accent-gold/30 border-t-accent-gold',
}

/**
 * Spinner 组件
 *
 * @example
 * ```tsx
 * <Spinner />
 * <Spinner size="lg" variant="gold" />
 * ```
 */
export function Spinner({
  size = 'md',
  variant = 'primary',
  className,
  ...props
}: SpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      role="status"
      aria-label="加载中"
      {...props}
    >
      <span className="sr-only">加载中...</span>
    </div>
  )
}

export default Spinner
