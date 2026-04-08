/**
 * Tag 标签组件
 *
 * 用于分类和标记
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * 标签内容
   */
  children: ReactNode

  /**
   * 标签颜色
   */
  color?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | string

  /**
   * 是否可关闭
   */
  closable?: boolean

  /**
   * 关闭回调
   */
  onClose?: () => void

  /**
   * 标签大小
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * 标签变体
   * @default 'filled'
   */
  variant?: 'filled' | 'outlined' | 'soft'

  /**
   * 图标
   */
  icon?: ReactNode

  /**
   * 是否可点击
   */
  clickable?: boolean

  /**
   * 点击回调
   */
  onClick?: () => void

  /**
   * 是否选中
   */
  selected?: boolean

  /**
   * 选中颜色（checked 状态）
   */
  selectedColor?: 'neutral' | 'primary' | 'success' | 'warning' | 'error' | string
}

// ============================================
// 辅助函数
// ============================================
function getColorStyles(
  color: string,
  variant: string
): { bg: string; text: string; border: string } {
  const colorMap: Record<string, Record<string, { bg: string; text: string; border: string }>> = {
    neutral: {
      filled: { bg: 'bg-neutral-600', text: 'text-white', border: 'border-transparent' },
      outlined: { bg: 'bg-transparent', text: 'text-neutral-600', border: 'border-neutral-300' },
      soft: { bg: 'bg-neutral-100', text: 'text-neutral-700', border: 'border-transparent' },
    },
    primary: {
      filled: { bg: 'bg-primary-500', text: 'text-white', border: 'border-transparent' },
      outlined: { bg: 'bg-transparent', text: 'text-primary-600', border: 'border-primary-300' },
      soft: { bg: 'bg-primary-50', text: 'text-primary-700', border: 'border-transparent' },
    },
    success: {
      filled: { bg: 'bg-success-500', text: 'text-white', border: 'border-transparent' },
      outlined: { bg: 'bg-transparent', text: 'text-success-600', border: 'border-success-300' },
      soft: { bg: 'bg-success-50', text: 'text-success-700', border: 'border-transparent' },
    },
    warning: {
      filled: { bg: 'bg-warning-500', text: 'text-white', border: 'border-transparent' },
      outlined: { bg: 'bg-transparent', text: 'text-warning-600', border: 'border-warning-300' },
      soft: { bg: 'bg-warning-50', text: 'text-warning-700', border: 'border-transparent' },
    },
    error: {
      filled: { bg: 'bg-error-500', text: 'text-white', border: 'border-transparent' },
      outlined: { bg: 'bg-transparent', text: 'text-error-600', border: 'border-error-300' },
      soft: { bg: 'bg-error-50', text: 'text-error-700', border: 'border-transparent' },
    },
  }

  return colorMap[color]?.[variant] || colorMap.neutral.filled
}

// ============================================
// Tag 主组件
// ============================================
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  (
    {
      children,
      color = 'neutral',
      closable = false,
      onClose,
      size = 'medium',
      variant = 'filled',
      icon,
      clickable = false,
      onClick,
      selected = false,
      selectedColor = 'primary',
      className,
      ...props
    },
    ref
  ) => {
    // 获取颜色样式
    const activeColor = selected ? selectedColor : color
    const styles = getColorStyles(activeColor, variant)

    // 尺寸样式
    const sizeStyles: Record<typeof size, string> = {
      small: 'h-5 px-1.5 text-xs gap-1',
      medium: 'h-6 px-2 text-sm gap-1.5',
      large: 'h-7 px-2.5 text-base gap-2',
    }

    // 关闭按钮尺寸
    const closeIconSize: Record<typeof size, string> = {
      small: 'w-3 h-3',
      medium: 'w-3.5 h-3.5',
      large: 'w-4 h-4',
    }

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex',
          'items-center',
          'rounded',
          'border',
          'font-medium',
          'transition-colors',
          'duration-200',
          sizeStyles[size],
          styles.bg,
          styles.text,
          styles.border,
          clickable && 'cursor-pointer hover:opacity-80',
          selected && 'ring-2 ring-offset-1 ring-primary-300',
          className
        )}
        onClick={onClick}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate max-w-[200px]">{children}</span>
        {closable && (
          <button
            type="button"
            className={cn(
              'flex-shrink-0',
              'rounded-full',
              'hover:bg-black/10',
              'dark:hover:bg-white/20',
              'flex',
              'items-center',
              'justify-center',
              closeIconSize[size],
              clickable && 'cursor-pointer'
            )}
            onClick={(e) => {
              e.stopPropagation()
              onClose?.()
            }}
          >
            <svg
              className="w-full h-full"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </span>
    )
  }
)

Tag.displayName = 'Tag'

export default Tag
