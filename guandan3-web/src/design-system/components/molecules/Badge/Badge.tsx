/**
 * Badge 徽章组件
 *
 * 数字或状态徽章
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, cloneElement, ReactElement, isValidElement } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface BadgeProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * 徽章内容
   */
  children?: ReactNode

  /**
   * 显示的数字（超过 count 会显示为 count+）
   */
  count?: number

  /**
   * 最大显示数字
   * @default 99
   */
  max?: number

  /**
   * 是否显示为圆点
   */
  dot?: boolean

  /**
   * 徽章颜色
   */
  color?:
    | 'neutral'
    | 'primary'
    | 'success'
    | 'warning'
    | 'error'
    | string

  /**
   * 徽章大小
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * 徽章位置（相对于子元素）
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left'

  /**
   * 徽章偏移量
   */
  offset?: [number, number]

  /**
   * 是否为零时隐藏
   * @default true
   */
  showZero?: boolean

  /**
   * 自定义内容
   */
  content?: ReactNode

  /**
   * 状态（独立徽章）
   */
  status?: 'default' | 'success' | 'processing' | 'error' | 'warning'
}

// ============================================
// 辅助函数
// ============================================
function getColorClass(color?: string): string {
  if (!color) return 'bg-error-500'

  const colorMap: Record<string, string> = {
    neutral: 'bg-neutral-500',
    primary: 'bg-primary-500',
    success: 'bg-success-500',
    warning: 'bg-warning-500',
    error: 'bg-error-500',
  }

  return colorMap[color] || ''
}

function getStatusDotClass(status?: string): string {
  const statusMap: Record<string, string> = {
    default: 'bg-neutral-400',
    success: 'bg-success-500',
    processing: 'bg-primary-500',
    error: 'bg-error-500',
    warning: 'bg-warning-500',
  }

  return statusMap[status || 'default'] || ''
}

function getStatusTextClass(status?: string): string {
  const statusMap: Record<string, string> = {
    default: 'text-neutral-600',
    success: 'text-success-600',
    processing: 'text-primary-600',
    error: 'text-error-600',
    warning: 'text-warning-600',
  }

  return statusMap[status || 'default'] || ''
}

function getPositionClass(position?: string): string {
  const positionMap: Record<string, string> = {
    'top-right': '-top-1 -right-1',
    'top-left': '-top-1 -left-1',
    'bottom-right': '-bottom-1 -right-1',
    'bottom-left': '-bottom-1 -left-1',
  }

  return positionMap[position || 'top-right'] || ''
}

// ============================================
// Badge 主组件
// ============================================
export const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  (
    {
      children,
      count,
      max = 99,
      dot = false,
      color,
      size = 'medium',
      position = 'top-right',
      offset,
      showZero = false,
      content,
      status,
      className,
      ...props
    },
    ref
  ) => {
    // 计算显示的数字
    const displayCount = count !== undefined && count > max ? `${max}+` : count

    // 判断是否应该显示徽章
    const shouldShow =
      (dot && count !== 0) ||
      (!dot && count !== undefined && (count > 0 || showZero)) ||
      content !== undefined

    // 徽章尺寸样式
    const sizeStyles: Record<typeof size, string> = {
      small: 'min-w-[14px] h-[14px] text-[10px] px-1',
      medium: 'min-w-[18px] h-[18px] text-xs px-1',
      large: 'min-w-[22px] h-[22px] text-sm px-1.5',
    }

    const dotSizeStyles: Record<typeof size, string> = {
      small: 'w-2 h-2',
      medium: 'w-2.5 h-2.5',
      large: 'w-3 h-3',
    }

    // 状态徽章（独立显示）
    if (status && !children) {
      return (
        <div
          ref={ref}
          className={cn('inline-flex', 'items-center', 'gap-1.5', className)}
          {...props}
        >
          <span
            className={cn(
              'inline-block',
              'rounded-full',
              dotSizeStyles[size],
              getStatusDotClass(status),
              status === 'processing' && 'animate-pulse'
            )}
          />
          <span className={cn('text-sm', getStatusTextClass(status))}>
            {content}
          </span>
        </div>
      )
    }

    // 独立徽章（无子元素）
    if (!children) {
      if (!shouldShow) return null

      return (
        <div
          ref={ref}
          className={cn(
            'inline-flex',
            'items-center',
            'justify-center',
            'rounded-full',
            'text-white',
            'font-medium',
            sizeStyles[size],
            getColorClass(color),
            className
          )}
          {...props}
        >
          {dot ? null : content !== undefined ? content : displayCount}
        </div>
      )
    }

    // 附加徽章（有子元素）
    const badgeContent = shouldShow ? (
      <span
        className={cn(
          'absolute',
          'inline-flex',
          'items-center',
          'justify-center',
          'rounded-full',
          'text-white',
          'font-medium',
          'transform',
          'scale-100',
          'z-10',
          sizeStyles[size],
          dot ? dotSizeStyles[size] : '',
          dot ? 'p-0' : '',
          getColorClass(color),
          getPositionClass(position),
          offset && 'transform'
        )}
        style={
          offset
            ? {
                marginTop: offset[1] ? `${offset[1]}px` : undefined,
                marginLeft: offset[0] ? `${offset[0]}px` : undefined,
              }
            : undefined
        }
      >
        {dot ? null : content !== undefined ? content : displayCount}
      </span>
    ) : null

    // 克隆子元素并附加徽章
    if (isValidElement(children)) {
      const childProps = children.props as any
      return (
        <div ref={ref} className="inline-relative" {...props}>
          {cloneElement(children as ReactElement, {
            // @ts-ignore - cloneElement does support className
            className: cn('relative inline-block', childProps.className),
          })}
          {badgeContent}
        </div>
      )
    }

    return (
      <div ref={ref} className="relative inline-block" {...props}>
        {children}
        {badgeContent}
      </div>
    )
  }
)

Badge.displayName = 'Badge'

export default Badge
