/**
 * Avatar 头像组件
 *
 * 用户头像展示
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 头像图片 URL
   */
  src?: string

  /**
   * 替代文本
   */
  alt?: string

  /**
   * 头像大小
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  /**
   * 头像形状
   */
  shape?: 'circle' | 'square'

  /**
   * 显示状态点
   */
  status?: 'online' | 'offline' | 'busy' | 'away'

  /**
   * 状态点位置
   */
  statusPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'

  /**
   * 是否可点击
   */
  clickable?: boolean

  /**
   * 加载失败时显示的文本
   */
  fallbackText?: string

  /**
   * 图片加载失败回调
   */
  onError?: () => void
}

// ============================================
// 尺寸样式
// ============================================
const sizeStyles: Record<string, string> = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-12 h-12 text-lg',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-20 h-20 text-2xl',
}

// ============================================
// 状态颜色
// ============================================
const statusColorStyles: Record<string, string> = {
  online: 'bg-success-500',
  offline: 'bg-neutral-400',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
}

// ============================================
// Avatar 主组件
// ============================================
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      src,
      alt = 'avatar',
      size = 'md',
      shape = 'circle',
      status,
      statusPosition = 'bottom-right',
      clickable = false,
      fallbackText,
      onError,
      className,
      ...props
    },
    ref
  ) => {
    // 状态点位置样式
    const statusPositionStyles: Record<string, string> = {
      'top-left': 'top-0 left-0',
      'top-right': 'top-0 right-0',
      'bottom-left': 'bottom-0 left-0',
      'bottom-right': 'bottom-0 right-0',
    }

    // 获取首字母作为 fallback
    const getInitials = (text: string) => {
      const words = text.trim().split(/\s+/)
      if (words.length >= 2) {
        return (words[0][0] + words[1][0]).toUpperCase()
      }
      return text.slice(0, 2).toUpperCase()
    }

    // Fallback 内容
    // 检查 fallbackText 是否有实际内容（不是纯空格）
    const hasValidFallbackText = fallbackText && fallbackText.trim().length > 0
    const fallbackContent = hasValidFallbackText ? (
      <span className="font-medium">{getInitials(fallbackText)}</span>
    ) : (
      <svg className="w-1/2 h-1/2 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    )

    return (
      <div
        ref={ref}
        className={cn('relative inline-flex shrink-0', className)}
        {...props}
      >
        {/* 头像 */}
        <div
          className={cn(
            'inline-flex',
            'items-center',
            'justify-center',
            'overflow-hidden',
            'bg-neutral-200',
            'text-neutral-600',
            sizeStyles[size],
            shape === 'circle' && 'rounded-full',
            shape === 'square' && 'rounded-lg',
            clickable && 'cursor-pointer hover:ring-2 hover:ring-primary-500 hover:ring-offset-2',
            'transition-all',
            'duration-200'
          )}
        >
          {src ? (
            <img
              src={src}
              alt={alt}
              className="w-full h-full object-cover"
              onError={onError}
            />
          ) : (
            fallbackContent
          )}
        </div>

        {/* 状态点 */}
        {status && (
          <span
            className={cn(
              'absolute',
              'w-3',
              'h-3',
              'rounded-full',
              'border-2',
              'border-white',
              statusColorStyles[status],
              status === 'busy' && 'animate-pulse',
              // 根据尺寸调整状态点大小
              (size === 'xl' || size === '2xl') && 'w-4 h-4',
              statusPositionStyles[statusPosition]
            )}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

export default Avatar
