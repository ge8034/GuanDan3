/**
 * Avatar 组件
 *
 * 用户头像组件
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
   * 头像尺寸
   * @default 'md'
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl'

  /**
   * 头像图片URL
   */
  src?: string

  /**
   * 备用文本（显示初始字母）
   */
  alt?: string

  /**
   * 是否圆形
   * @default true
   */
  rounded?: boolean

  /**
   * 状态指示器
   */
  status?: 'online' | 'offline' | 'away' | 'busy'

  /**
   * 是否点击效果
   * @default false
   */
  clickable?: boolean

  /**
   * 加载失败回调
   */
  onFallback?: () => void
}

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-16 w-16 text-xl',
  '2xl': 'h-20 w-20 text-2xl',
}

// ============================================
// 状态颜色
// ============================================
const statusColors = {
  online: 'bg-semantic-success',
  offline: 'bg-neutral-400',
  away: 'bg-semantic-warning',
  busy: 'bg-semantic-error',
}

/**
 * Avatar 组件
 *
 * @example
 * ```tsx
 * <Avatar src="/avatar.jpg" alt="用户名" />
 *
 * <Avatar alt="张三" />
 *
 * <Avatar src="/avatar.jpg" alt="用户名" status="online" />
 *
 * <Avatar
 *   src="/avatar.jpg"
 *   alt="用户名"
 *   size="lg"
 *   clickable
 *   onClick={handleClick}
 * />
 * ```
 */
export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      size = 'md',
      src,
      alt,
      rounded = true,
      status,
      clickable = false,
      onFallback,
      className,
      ...props
    },
    ref
  ) => {
    // 提取首字母作为备用显示
    const fallbackText = alt ? alt.charAt(0).toUpperCase() : '?'

    // 随机背景色（基于alt字符串生成）
    const getBgColor = () => {
      if (!alt) return 'bg-neutral-200'
      const colors = [
        'bg-poker-table-500',
        'bg-semantic-success',
        'bg-semantic-error',
        'bg-semantic-warning',
        'bg-accent-gold',
      ]
      const index = alt.charCodeAt(0) % colors.length
      return colors[index]
    }

    return (
      <div
        ref={ref}
        className={cn(
          'relative',
          'inline-flex',
          'shrink-0',
          'items-center',
          'justify-center',
          'font-semibold',
          'text-white',
          'overflow-hidden',
          'transition-all',
          'duration-200',
          'ease-[cubic-bezier(0.16,1,0.3,1)]',

          // 尺寸
          sizeClasses[size],

          // 圆角
          rounded ? 'rounded-full' : 'rounded-lg',

          // 点击效果
          clickable && [
            'cursor-pointer',
            'hover:scale-105',
            'active:scale-95',
          ],

          // 自定义类名
          className
        )}
        {...props}
      >
        {/* 头像图片 */}
        {src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full object-cover"
            onError={onFallback}
          />
        ) : (
          // 备用显示（首字母）
          <span className={cn('text-white', getBgColor(), 'h-full w-full flex items-center justify-center')}>
            {fallbackText}
          </span>
        )}

        {/* 状态指示器 */}
        {status && (
          <span
            className={cn(
              'absolute',
              'bottom-0',
              'right-0',
              'block',
              'h-2.5',
              'w-2.5',
              'rounded-full',
              'ring-2',
              'ring-white',
              statusColors[status],

              // 不同尺寸的状态指示器大小
              size === 'xs' && 'h-1.5 w-1.5',
              size === '2xl' && 'h-3 w-3'
            )}
            aria-label={`状态: ${status}`}
          />
        )}
      </div>
    )
  }
)

Avatar.displayName = 'Avatar'

// Avatar Group 组件（头像组）
export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /**
   * 最大显示数量
   */
  max?: number
  /**
   * 重叠数量
   * @default 3
   */
  overlap?: number
}

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  ({ children, max, overlap = 3, className, ...props }, ref) => {
    const avatars = Array.isArray(children) ? children : [children]
    const visibleAvatars = max ? avatars.slice(0, max) : avatars
    const remainingCount = max ? avatars.length - max : 0

    return (
      <div
        ref={ref}
        className={cn('flex -space-x-2', className)}
        {...props}
      >
        {visibleAvatars.map((avatar, index) => (
          <div
            key={index}
            className="ring-2 ring-white rounded-full"
            style={{ zIndex: overlap - index }}
          >
            {avatar}
          </div>
        ))}

        {/* 剩余数量显示 */}
        {remainingCount > 0 && (
          <div
            className={cn(
              'flex',
              'items-center',
              'justify-center',
              'rounded-full',
              'bg-neutral-200',
              'text-neutral-600',
              'font-medium',
              'ring-2',
              'ring-white',
              'h-10',
              'w-10',
              'text-sm'
            )}
            style={{ zIndex: 0 }}
          >
            +{remainingCount}
          </div>
        )}
      </div>
    )
  }
)

AvatarGroup.displayName = 'AvatarGroup'

export default Avatar
