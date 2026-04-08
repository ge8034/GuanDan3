/**
 * Breadcrumb 组件
 *
 * 面包屑导航组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, Children, isValidElement, cloneElement, ReactElement } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'
import Link from 'next/link'

// ============================================
// 类型定义
// ============================================
export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /**
   * 分隔符
   * @default '/'
   */
  separator?: ReactNode
}

export interface BreadcrumbItemProps extends HTMLAttributes<HTMLLIElement> {
  /**
   * 是否为当前页
   */
  current?: boolean

  /**
   * 链接地址
   */
  href?: string

  /**
   * 子元素
   */
  children: ReactNode
}

// ============================================
// BreadcrumbItem 面包屑项（内部组件）
// ============================================
const BreadcrumbItemInner = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  ({ current = false, href, children, className, ...props }, ref) => {
    const content = href ? (
      <Link
        href={href}
        className={cn(
          'transition-colors',
          current
            ? 'text-neutral-900 font-medium'
            : 'text-neutral-600 hover:text-neutral-900'
        )}
        aria-current={current ? 'page' : undefined}
      >
        {children}
      </Link>
    ) : (
      <span
        className={cn(
          'transition-colors',
          current
            ? 'text-neutral-900 font-medium'
            : 'text-neutral-600'
        )}
        aria-current={current ? 'page' : undefined}
      >
        {children}
      </span>
    )

    return (
      <li
        ref={ref}
        className={cn('flex items-center gap-2', className)}
        {...props}
      >
        {content}
      </li>
    )
  }
)

BreadcrumbItemInner.displayName = 'BreadcrumbItemInner'

// ============================================
// Breadcrumb 主组件
// ============================================
export const Breadcrumb = forwardRef<HTMLElement, BreadcrumbProps>(
  ({ separator = '/', children, className, ...props }, ref) => {
    // 将子元素包裹在带分隔符的结构中
    const childArray = Children.toArray(children)
    const childCount = childArray.length

    const itemsWithSeparators = childArray.flatMap((child, index) => {
      const elements = []

      // 渲染子元素
      if (isValidElement(child)) {
        elements.push(
          cloneElement(child as ReactElement, {
            key: child.key || `item-${index}`,
          })
        )
      } else {
        elements.push(child)
      }

      // 添加分隔符（除了最后一个）
      if (index < childCount - 1) {
        elements.push(
          <span
            key={`separator-${index}`}
            className="text-neutral-400"
            aria-hidden="true"
          >
            {separator}
          </span>
        )
      }

      return elements
    })

    return (
      <nav
        ref={ref}
        className={cn('flex items-center gap-2 text-sm', className)}
        aria-label="面包屑导航"
        {...props}
      >
        <ol className="flex items-center gap-2">
          {itemsWithSeparators}
        </ol>
      </nav>
    )
  }
)

Breadcrumb.displayName = 'Breadcrumb'

// ============================================
// 导出的 BreadcrumbItem（使用内部实现）
// ============================================
export const BreadcrumbItem = forwardRef<HTMLLIElement, BreadcrumbItemProps>(
  (props, ref) => {
    return <BreadcrumbItemInner ref={ref} {...props} />
  }
)

BreadcrumbItem.displayName = 'BreadcrumbItem'

// ============================================
// 辅助函数：创建面包屑列表
// ============================================
export interface BreadcrumbData {
  label: string
  href?: string
}

export const createBreadcrumbItems = (
  items: BreadcrumbData[],
  separator: ReactNode = '/'
) => {
  return items.map((item, index) => (
    <BreadcrumbItem
      key={item.href || index}
      href={item.href}
      current={index === items.length - 1}
    >
      {item.label}
    </BreadcrumbItem>
  ))
}

export default Breadcrumb
