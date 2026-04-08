/**
 * Pagination 组件
 *
 * 分页组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface PaginationProps extends HTMLAttributes<HTMLElement> {
  /**
   * 当前页码
   */
  current: number

  /**
   * 总页数
   */
  total: number

  /**
   * 页码变化回调
   */
  onChange?: (page: number) => void

  /**
   * 每页显示的页码数量
   * @default 7
   */
  pageSize?: number

  /**
   * 是否显示省略号
   * @default true
   */
  showEllipsis?: boolean

  /**
   * 是否显示总数信息
   * @default false
   */
  showTotal?: boolean

  /**
   * 禁用状态
   * @default false
   */
  disabled?: boolean

  /**
   * 上一页按钮文本
   * @default '上一页'
   */
  prevText?: ReactNode

  /**
   * 下一页按钮文本
   * @default '下一页'
   */
  nextText?: ReactNode
}

// ============================================
// Pagination 主组件
// ============================================
export const Pagination = forwardRef<HTMLElement, PaginationProps>(
  (
    {
      current,
      total,
      onChange,
      pageSize = 7,
      showEllipsis = true,
      showTotal = false,
      disabled = false,
      prevText = '上一页',
      nextText = '下一页',
      className,
      ...props
    },
    ref
  ) => {
    // 边界情况：总页数小于等于0时不渲染
    if (total <= 0) {
      return null
    }

    // 确保当前页在有效范围内
    const safeCurrent = Math.max(1, Math.min(current, total))
    // 计算显示的页码范围
    const getPageRange = () => {
      const pages: Array<number | 'ellipsis'> = []
      const halfPageSize = Math.floor(pageSize / 2)

      let startPage = Math.max(1, current - halfPageSize)
      let endPage = Math.min(total, current + halfPageSize)

      // 调整起始页，确保显示足够的页码
      if (endPage - startPage + 1 < pageSize) {
        if (startPage === 1) {
          endPage = Math.min(total, startPage + pageSize - 1)
        } else if (endPage === total) {
          startPage = Math.max(1, endPage - pageSize + 1)
        }
      }

      // 添加第一页
      if (startPage > 1) {
        pages.push(1)
        if (startPage > 2 && showEllipsis) {
          pages.push('ellipsis')
        }
      }

      // 添加中间页码
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // 添加最后一页
      if (endPage < total) {
        if (endPage < total - 1 && showEllipsis) {
          pages.push('ellipsis')
        }
        pages.push(total)
      }

      return pages
    }

    const pages = getPageRange()
    const isFirstPage = safeCurrent === 1
    const isLastPage = safeCurrent === total

    const handlePageChange = (page: number) => {
      if (disabled || page === current || page < 1 || page > total) return
      onChange?.(page)
    }

    const renderPageItem = (page: number | 'ellipsis', index: number) => {
      if (page === 'ellipsis') {
        return (
          <li key={`ellipsis-${index}`} className="px-3 py-2 text-neutral-400">
            ...
          </li>
        )
      }

      const isActive = page === current

      return (
        <li key={page}>
          <button
            type="button"
            onClick={() => handlePageChange(page)}
            disabled={disabled}
            aria-current={isActive ? 'page' : undefined}
            aria-label={`第 ${page} 页`}
            className={cn(
              'min-w-[2.5rem]',
              'px-3',
              'py-2',
              'text-sm',
              'rounded-lg',
              'transition-colors',
              'duration-150',
              // 状态
              isActive
                ? 'bg-poker-table-500 text-white font-medium'
                : 'text-neutral-700 hover:bg-neutral-100',
              // 禁用
              disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
            )}
          >
            {page}
          </button>
        </li>
      )
    }

    return (
      <nav
        ref={ref}
        className={cn('flex flex-col items-center gap-4', className)}
        aria-label="分页导航"
        {...props}
      >
        {/* 总数信息 */}
        {showTotal && (
          <div className="text-sm text-neutral-600">
            共 {total} 页
          </div>
        )}

        {/* 分页按钮 */}
        <ul className="flex items-center gap-1">
          {/* 上一页 */}
          <li>
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrent - 1)}
              disabled={disabled || isFirstPage}
              aria-label="上一页"
              className={cn(
                'px-3',
                'py-2',
                'text-sm',
                'rounded-lg',
                'transition-colors',
                'duration-150',
                'text-neutral-700',
                'hover:bg-neutral-100',
                // 禁用
                (disabled || isFirstPage) && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {prevText}
            </button>
          </li>

          {/* 页码 */}
          {pages.map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <li key={`ellipsis-${index}`} className="px-3 py-2 text-neutral-400">
                  ...
                </li>
              )
            }

            const isActive = page === safeCurrent

            return (
              <li key={page}>
                <button
                  type="button"
                  onClick={() => handlePageChange(page)}
                  disabled={disabled}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`第 ${page} 页`}
                  className={cn(
                    'min-w-[2.5rem]',
                    'px-3',
                    'py-2',
                    'text-sm',
                    'rounded-lg',
                    'transition-colors',
                    'duration-150',
                    // 状态
                    isActive
                      ? 'bg-poker-table-500 text-white font-medium'
                      : 'text-neutral-700 hover:bg-neutral-100',
                    // 禁用
                    disabled && 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  )}
                >
                  {page}
                </button>
              </li>
            )
          })}

          {/* 下一页 */}
          <li>
            <button
              type="button"
              onClick={() => handlePageChange(safeCurrent + 1)}
              disabled={disabled || isLastPage}
              aria-label="下一页"
              className={cn(
                'px-3',
                'py-2',
                'text-sm',
                'rounded-lg',
                'transition-colors',
                'duration-150',
                'text-neutral-700',
                'hover:bg-neutral-100',
                // 禁用
                (disabled || isLastPage) && 'opacity-50 cursor-not-allowed hover:bg-transparent'
              )}
            >
              {nextText}
            </button>
          </li>
        </ul>
      </nav>
    )
  }
)

Pagination.displayName = 'Pagination'

export default Pagination
