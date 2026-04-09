/**
 * Empty 组件
 *
 * 空状态组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface EmptyProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  /**
   * 图片
   */
  image?: ReactNode

  /**
   * 标题
   */
  title?: ReactNode

  /**
   * 描述
   */
  description?: ReactNode

  /**
   * 操作按钮
   */
  action?: ReactNode

  /**
   * 尺寸
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
}

// ============================================
// 默认空状态插图
// ============================================
const DefaultEmptyIllustration = () => (
  <svg
    className="w-48 h-48 mx-auto text-neutral-300"
    fill="none"
    viewBox="0 0 200 200"
    xmlns="http://www.w3.org/2000/svg"
  >
    <circle cx="100" cy="100" r="80" fill="currentColor" opacity="0.1" />
    <path
      fill="currentColor"
      d="M100 60c-22.1 0-40 17.9-40 40s17.9 40 40 40 40-17.9 40-40-17.9-40-40-40zm0 70c-16.6 0-30-13.4-30-30s13.4-30 30-30 30 13.4 30 30-13.4 30-30 30zm0-50c-11 0-20 9-20 20s9 20 20 20 20-9 20-20-9-20-20-20zm0 35c-8.3 0-15-6.7-15-15s6.7-15 15-15 15 6.7 15 15-6.7 15-15 15z"
      opacity="0.3"
    />
  </svg>
)

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  small: {
    image: 'w-24 h-24',
    container: 'py-8',
  },
  medium: {
    image: 'w-48 h-48',
    container: 'py-12',
  },
  large: {
    image: 'w-64 h-64',
    container: 'py-16',
  },
}

/**
 * Empty 组件
 *
 * @example
 * ```tsx
 * <Empty
 *   title="暂无数据"
 *   description="还没有任何内容，点击按钮创建"
 *   action={<button>创建</button>}
 * />
 *
 * <Empty
 *   title="搜索无结果"
 *   image={<CustomImage />}
 * />
 * ```
 */
export const Empty = forwardRef<HTMLDivElement, EmptyProps>(
  (
    {
      image,
      title = '暂无数据',
      description,
      action,
      size = 'medium',
      className,
      ...props
    },
    ref
  ) => {
    const classes = sizeClasses[size]

    return (
      <div
        ref={ref}
        className={cn(
          // 布局
          'flex',
          'flex-col',
          'items-center',
          'justify-center',
          'text-center',
          classes.container,
          className
        )}
        {...props}
      >
        {/* 图片/插图 */}
        <div className={cn('flex-shrink-0', classes.image)}>
          {image || <DefaultEmptyIllustration />}
        </div>

        {/* 标题 */}
        {title && (
          <div className="mt-4">
            <div className="text-base font-medium text-neutral-900">{title}</div>
          </div>
        )}

        {/* 描述 */}
        {description && (
          <div className="mt-2">
            <div className="text-sm text-neutral-500 max-w-xs mx-auto">
              {description}
            </div>
          </div>
        )}

        {/* 操作按钮 */}
        {action && (
          <div className="mt-6">{action}</div>
        )}
      </div>
    )
  }
)

Empty.displayName = 'Empty'

export default Empty
