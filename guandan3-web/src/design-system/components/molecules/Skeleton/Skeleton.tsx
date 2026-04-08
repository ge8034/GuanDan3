/**
 * Skeleton 骨架屏组件
 *
 * 用于在内容加载时显示占位符
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 是否显示动画
   * @default true
   */
  active?: boolean

  /**
   * 骨架屏元素数量（用于按钮/输入类型）
   * @default 1
   */
  count?: number

  /**
   * 骨架屏类型
   * @default 'text'
   */
  variant?: 'text' | 'circle' | 'rect' | 'button' | 'input' | 'avatar'

  /**
   * 宽度（仅对 rect、button、input、avatar 有效）
   */
  width?: string | number

  /**
   * 高度（仅对 rect、button、input 有效）
   */
  height?: string | number

  /**
   * 圆角大小
   */
  radius?: string | number
}

// ============================================
// 辅助函数
// ============================================
function getWidthStyle(width?: string | number): React.CSSProperties | undefined {
  if (width === undefined) return undefined
  return { width: typeof width === 'number' ? `${width}px` : width }
}

function getHeightStyle(height?: string | number): React.CSSProperties | undefined {
  if (height === undefined) return undefined
  return { height: typeof height === 'number' ? `${height}px` : height }
}

function getRadiusStyle(radius?: string | number): React.CSSProperties | undefined {
  if (radius === undefined) return undefined
  return { borderRadius: typeof radius === 'number' ? `${radius}px` : radius }
}

// ============================================
// Skeleton 主组件
// ============================================
export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      active = true,
      count = 1,
      variant = 'text',
      width,
      height,
      radius,
      className,
      style,
      ...props
    },
    ref
  ) => {
    // 基础样式
    const baseStyles = cn(
      'bg-neutral-200',
      'inline-block',
      active && 'animate-pulse',
      className
    )

    // 不同类型的样式
    const variantStyles: Record<typeof variant, string> = {
      text: 'h-4 rounded',
      circle: 'rounded-full',
      rect: 'rounded',
      button: 'h-10 rounded',
      input: 'h-10 rounded',
      avatar: 'w-10 h-10 rounded-full',
    }

    // 生成骨架屏元素
    const renderSkeleton = (index: number) => {
      const specificStyle: React.CSSProperties = {
        ...getWidthStyle(width),
        ...getHeightStyle(height),
        ...getRadiusStyle(radius),
        ...style,
      }

      switch (variant) {
        case 'text':
          return (
            <div
              key={index}
              className={cn(baseStyles, variantStyles.text)}
              style={specificStyle}
              {...props}
            />
          )

        case 'circle':
          return (
            <div
              key={index}
              className={cn(baseStyles, variantStyles.circle)}
              style={{
                ...getWidthStyle(width || 40),
                ...getHeightStyle(height || 40),
                ...specificStyle,
              }}
              {...props}
            />
          )

        case 'rect':
          return (
            <div
              key={index}
              className={cn(baseStyles, variantStyles.rect)}
              style={{
                ...getWidthStyle(width || '100%'),
                ...getHeightStyle(height || 100),
                ...specificStyle,
              }}
              {...props}
            />
          )

        case 'button':
          return (
            <div
              key={index}
              className={cn(baseStyles, variantStyles.button)}
              style={{
                ...getWidthStyle(width || 120),
                ...specificStyle,
              }}
              {...props}
            />
          )

        case 'input':
          return (
            <div
              key={index}
              className={cn(baseStyles, variantStyles.input)}
              style={{
                ...getWidthStyle(width || '100%'),
                ...specificStyle,
              }}
              {...props}
            />
          )

        case 'avatar':
          return (
            <div
              key={index}
              className={cn(baseStyles, variantStyles.avatar)}
              style={specificStyle}
              {...props}
            />
          )

        default:
          return null
      }
    }

    return (
      <div ref={ref} className={count > 1 ? 'space-y-2' : ''}>
        {Array.from({ length: count }).map((_, index) => renderSkeleton(index))}
      </div>
    )
  }
)

Skeleton.displayName = 'Skeleton'

// ============================================
// 复合骨架屏组件
// ============================================

/**
 * 头像骨架屏
 */
export interface SkeletonAvatarProps extends Omit<SkeletonProps, 'variant'> {
  /**
   * 头像尺寸
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * 形状
   * @default 'circle'
   */
  shape?: 'circle' | 'square'
}

export const SkeletonAvatar = forwardRef<HTMLDivElement, SkeletonAvatarProps>(
  ({ size = 'medium', shape = 'circle', ...props }, ref) => {
    const sizeStyles: Record<typeof size, number> = {
      small: 32,
      medium: 40,
      large: 64,
    }

    return (
      <Skeleton
        ref={ref}
        variant={shape === 'circle' ? 'circle' : 'rect'}
        width={sizeStyles[size]}
        height={sizeStyles[size]}
        {...props}
      />
    )
  }
)

SkeletonAvatar.displayName = 'SkeletonAvatar'

/**
 * 按钮骨架屏
 */
export const SkeletonButton = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
  return <Skeleton ref={ref} variant="button" {...props} />
})

SkeletonButton.displayName = 'SkeletonButton'

/**
 * 输入框骨架屏
 */
export const SkeletonInput = forwardRef<HTMLDivElement, SkeletonProps>((props, ref) => {
  return <Skeleton ref={ref} variant="input" {...props} />
})

SkeletonInput.displayName = 'SkeletonInput'

/**
 * 图片骨架屏
 */
export interface SkeletonImageProps extends Omit<SkeletonProps, 'variant'> {
  /**
   * 图片宽度
   */
  width?: string | number

  /**
   * 图片高度
   */
  height?: string | number
}

export const SkeletonImage = forwardRef<HTMLDivElement, SkeletonImageProps>(
  ({ width = '100%', height = 200, ...props }, ref) => {
    return (
      <Skeleton
        ref={ref}
        variant="rect"
        width={width}
        height={height}
        {...props}
      />
    )
  }
)

SkeletonImage.displayName = 'SkeletonImage'

export default Skeleton
