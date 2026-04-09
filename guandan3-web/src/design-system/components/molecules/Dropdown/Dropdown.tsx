/**
 * Dropdown 组件
 *
 * 下拉菜单组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useRef, useState, useEffect, cloneElement, ReactElement } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface DropdownProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * 触发元素
   */
  children: ReactElement

  /**
   * 菜单内容
   */
  content: ReactNode

  /**
   * 对齐方式
   * @default 'start'
   */
  align?: 'start' | 'center' | 'end'

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean

  /**
   * 打开状态变化回调
   */
  onOpenChange?: (open: boolean) => void
}

// ============================================
// 对齐样式
// ============================================
const alignClasses = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
}

/**
 * Dropdown 组件
 *
 * @example
 * ```tsx
 * <Dropdown
 *   content={
 *     <div className="p-2 bg-white rounded-lg shadow-lg">
 *       <button className="block w-full text-left px-3 py-2">选项1</button>
 *       <button className="block w-full text-left px-3 py-2">选项2</button>
 *     </div>
 *   }
 * >
 *   <button>点击打开</button>
 * </Dropdown>
 * ```
 */
export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      children,
      content,
      align = 'start',
      disabled = false,
      onOpenChange,
      className,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false)
    const triggerRef = useRef<HTMLElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          triggerRef.current &&
          !triggerRef.current.contains(event.target as Node)
        ) {
          setIsOpen(false)
          onOpenChange?.(false)
        }
      }

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [isOpen, onOpenChange])

    const handleToggle = () => {
      if (disabled) return
      const newOpen = !isOpen
      setIsOpen(newOpen)
      onOpenChange?.(newOpen)
    }

    const trigger = cloneElement(children, {
      // @ts-ignore - ref merging
      ref: (node: HTMLElement | null) => {
        triggerRef.current = node
        // Forward ref to original child ref if it exists
        const { ref: originalRef } = children as any
        if (typeof originalRef === 'function') {
          originalRef(node)
        } else if (originalRef) {
          originalRef.current = node
        }
      },
      onClick: (e: React.MouseEvent) => {
        handleToggle()
        const childProps = children.props as any
        if (childProps.onClick) {
          childProps.onClick(e)
        }
      },
      'aria-haspopup': true,
      'aria-expanded': isOpen,
    })

    return (
      <div ref={ref} className="relative" {...props}>
        {trigger}

        {isOpen && (
          <div
            ref={dropdownRef}
            className={cn(
              // 定位
              'absolute',
              'top-full',
              'mt-1',
              'z-50',
              alignClasses[align],
              // 样式
              'min-w-[max-content]',
              className
            )}
            role="menu"
            aria-orientation="vertical"
          >
            {content}
          </div>
        )}
      </div>
    )
  }
)

Dropdown.displayName = 'Dropdown'

// ============================================
// DropdownItem 子组件
// ============================================
export interface DropdownItemProps extends HTMLAttributes<HTMLButtonElement> {
  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 是否危险操作（红色样式）
   */
  danger?: boolean

  /**
   * 图标
   */
  icon?: ReactNode
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemProps>(
  ({ disabled = false, danger = false, icon, children, className, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        disabled={disabled}
        className={cn(
          // 布局
          'flex',
          'items-center',
          'gap-2',
          'w-full',
          'px-3',
          'py-2',
          'text-left',
          // 样式
          'text-sm',
          'rounded',
          'transition-colors',
          'duration-150',
          // 颜色
          danger
            ? 'text-error hover:bg-error/10'
            : 'text-neutral-700 hover:bg-neutral-100',
          // 禁用状态
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0 w-4 h-4">{icon}</span>}
        {children}
      </button>
    )
  }
)

DropdownItem.displayName = 'DropdownItem'

// ============================================
// DropdownSeparator 分隔线
// ============================================
export interface DropdownSeparatorProps extends HTMLAttributes<HTMLDivElement> {}

export const DropdownSeparator = forwardRef<HTMLDivElement, DropdownSeparatorProps>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('my-1 border-t border-neutral-200', className)}
        role="separator"
        {...props}
      />
    )
  }
)

DropdownSeparator.displayName = 'DropdownSeparator'

export default Dropdown
