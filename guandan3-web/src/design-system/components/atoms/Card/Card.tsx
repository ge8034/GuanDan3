/**
 * Card 组件
 *
 * 内容容器组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 卡片变体
   * @default 'default'
   */
  variant?: 'default' | 'elevated' | 'outlined' | 'flat'

  /**
   * 内边距
   * @default 'md'
   */
  padding?: 'none' | 'sm' | 'md' | 'lg'

  /**
   * 是否可悬停
   * @default false
   */
  hoverable?: boolean

  /**
   * 是否点击效果
   * @default false
   */
  clickable?: boolean

  /**
   * 圆角
   * @default 'lg'
   */
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
}

// ============================================
// 变体样式
// ============================================
const variantClasses = {
  default: [
    'bg-white',
    'border',
    'border-neutral-200',
    'shadow-sm',
  ],
  elevated: [
    'bg-white',
    'shadow-lg',
    'border-0',
  ],
  outlined: [
    'bg-transparent',
    'border-2',
    'border-neutral-300',
    'shadow-none',
  ],
  flat: [
    'bg-neutral-50',
    'border-0',
    'shadow-none',
  ],
}

// ============================================
// 内边距样式
// ============================================
const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
}

// ============================================
// 圆角样式
// ============================================
const radiusClasses = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
}

/**
 * Card 组件
 *
 * @example
 * ```tsx
 * <Card>
 *   <h3>标题</h3>
 *   <p>内容</p>
 * </Card>
 *
 * <Card variant="elevated" hoverable>
 *   可悬停卡片
 * </Card>
 *
 * <Card clickable onClick={handleClick}>
 *   可点击卡片
 * </Card>
 * ```
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      clickable = false,
      radius = 'lg',
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // 基础样式
          'transition-all',
          'duration-200',
          'ease-[cubic-bezier(0.16,1,0.3,1)]',

          // 变体
          ...variantClasses[variant],

          // 内边距
          paddingClasses[padding],

          // 圆角
          radiusClasses[radius],

          // 交互状态
          hoverable && [
            'hover:shadow-md',
            'hover:-translate-y-0.5',
          ],
          clickable && [
            'cursor-pointer',
            'hover:shadow-md',
            'active:scale-[0.98]',
            'active:shadow-sm',
          ],

          // 自定义类名
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)

Card.displayName = 'Card'

// Card 子组件
export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

export const CardTitle = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

export const CardDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-600', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export default Card
