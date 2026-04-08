/**
 * Divider 组件
 *
 * 分隔线组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface DividerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 分隔线方向
   * @default 'horizontal'
   */
  orientation?: 'horizontal' | 'vertical'

  /**
   * 文本标签
   */
  label?: string

  /**
   * 是否为虚线
   * @default false
   */
  dashed?: boolean
}

/**
 * Divider 组件
 *
 * @example
 * ```tsx
 * <Divider />
 *
 * <Divider label="文本标签" />
 *
 * <Divider orientation="vertical" />
 *
 * <Divider dashed />
 * ```
 */
export const Divider = forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      label,
      dashed = false,
      className,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      // 基础样式
      'border-neutral-300',
      // 虚线样式
      dashed && 'border-dashed',
      // 方向
      orientation === 'horizontal'
        ? 'w-full border-t'
        : 'h-full border-l'
    )

    if (label) {
      return (
        <div
          ref={ref}
          className={cn('flex items-center gap-3', className)}
          {...props}
        >
          <div className={cn(baseStyles, 'flex-1')} role="separator" aria-orientation={orientation} />
          <span
            className={cn(
              'text-sm',
              'text-neutral-600',
              'font-medium',
              'whitespace-nowrap'
            )}
          >
            {label}
          </span>
          <div className={cn(baseStyles, 'flex-1')} role="separator" aria-orientation={orientation} />
        </div>
      )
    }

    return (
      <div
        ref={ref}
        className={cn(baseStyles, className)}
        role="separator"
        aria-orientation={orientation}
        {...props}
      />
    )
  }
)

Divider.displayName = 'Divider'

export default Divider
