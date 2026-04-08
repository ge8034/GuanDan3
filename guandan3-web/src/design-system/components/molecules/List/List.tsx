/**
 * List 组件
 *
 * 列表组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  /**
   * 列表项
   */
  children: ReactNode

  /**
   * 是否显示边框
   * @default false
   */
  bordered?: boolean

  /**
   * 尺寸
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
}

export interface ListItemProps extends HTMLAttributes<HTMLLIElement> {
  /**
   * 主内容
   */
  title: ReactNode

  /**
   * 描述
   */
  description?: ReactNode

  /**
   * 额外内容（右侧）
   */
  extra?: ReactNode

  /**
   * 列表项图标
   */
  avatar?: ReactNode

  /**
   * 是否可点击
   * @default false
   */
  clickable?: boolean

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean
}

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  small: {
    container: 'space-y-1',
    itemPadding: 'px-3 py-2',
    title: 'text-sm',
    description: 'text-xs',
  },
  medium: {
    container: 'space-y-2',
    itemPadding: 'px-4 py-3',
    title: 'text-base',
    description: 'text-sm',
  },
  large: {
    container: 'space-y-3',
    itemPadding: 'px-5 py-4',
    title: 'text-lg',
    description: 'text-base',
  },
}

// ============================================
// List 主组件
// ============================================
export const List = forwardRef<HTMLUListElement, ListProps>(
  ({ children, bordered = false, size = 'medium', className, ...props }, ref) => {
    const classes = sizeClasses[size]

    return (
      <ul
        ref={ref}
        className={cn(
          // 布局
          classes.container,
          // 边框
          bordered && 'divide-y divide-neutral-200',
          className
        )}
        {...props}
      >
        {children}
      </ul>
    )
  }
)

List.displayName = 'List'

// ============================================
// ListItem 列表项
// ============================================
export const ListItem = forwardRef<HTMLLIElement, ListItemProps>(
  (
    {
      title,
      description,
      extra,
      avatar,
      clickable = false,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <li
        ref={ref}
        className={cn(
          // 布局
          'flex',
          'items-center',
          'gap-3',
          // 交互
          clickable && !disabled && 'cursor-pointer',
          clickable && !disabled && 'hover:bg-neutral-50',
          // 过渡
          'transition-colors',
          'duration-150',
          // 禁用
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {/* 头像/图标 */}
        {avatar && (
          <div className="flex-shrink-0">
            {avatar}
          </div>
        )}

        {/* 主内容 */}
        <div className="flex-1 min-w-0">
          <div className={cn('font-medium text-neutral-900', sizeClasses.medium.title)}>
            {title}
          </div>
          {description && (
            <div className={cn('text-neutral-500', sizeClasses.medium.description)}>
              {description}
            </div>
          )}
        </div>

        {/* 额外内容 */}
        {extra && (
          <div className="flex-shrink-0">
            {extra}
          </div>
        )}
      </li>
    )
  }
)

ListItem.displayName = 'ListItem'

export default List
