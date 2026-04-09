/**
 * Tooltip 组件
 *
 * 工具提示组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useRef, useState, useEffect, cloneElement, ReactElement } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * 触发元素
   */
  children: ReactElement

  /**
   * 提示内容
   */
  content: ReactNode

  /**
   * 显示位置
   * @default 'top'
   */
  placement?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * 延迟显示时间 (ms)
   * @default 200
   */
  delay?: number

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean

  /**
   * 箭头显示
   * @default true
   */
  showArrow?: boolean
}

// ============================================
// 位置样式
// ============================================
const placementClasses = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
}

const arrowClasses = {
  top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent',
  bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent',
  left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent',
  right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent',
}

/**
 * Tooltip 组件
 *
 * @example
 * ```tsx
 * <Tooltip content="这是提示信息">
 *   <button>悬停查看</button>
 * </Tooltip>
 *
 * <Tooltip content="底部提示" placement="bottom">
 *   <span>底部提示示例</span>
 * </Tooltip>
 *
 * <Tooltip content={<div>自定义内容</div>}>
 *   <button>复杂内容</button>
 * </Tooltip>
 * ```
 */
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      placement = 'top',
      delay = 200,
      disabled = false,
      showArrow = true,
      className,
      ...props
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(false)
    const timeoutRef = useRef<number | undefined>(undefined)
    const triggerRef = useRef<HTMLElement>(null)

    // 清除定时器
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    const handleMouseEnter = () => {
      if (disabled) return
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(true)
      }, delay)
    }

    const handleMouseLeave = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setIsVisible(false)
    }

    // 克隆子元素并添加事件监听
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
      onMouseEnter: (e: React.MouseEvent) => {
        handleMouseEnter()
        const childProps = children.props as any
        if (childProps.onMouseEnter) {
          childProps.onMouseEnter(e)
        }
      },
      onMouseLeave: (e: React.MouseEvent) => {
        handleMouseLeave()
        const childProps = children.props as any
        if (childProps.onMouseLeave) {
          childProps.onMouseLeave(e)
        }
      },
      onFocus: (e: React.FocusEvent) => {
        handleMouseEnter()
        const childProps = children.props as any
        if (childProps.onFocus) {
          childProps.onFocus(e)
        }
      },
      onBlur: (e: React.FocusEvent) => {
        handleMouseLeave()
        const childProps = children.props as any
        if (childProps.onBlur) {
          childProps.onBlur(e)
        }
      },
      'aria-describedby': isVisible ? `tooltip-${Math.random().toString(36).substr(2, 9)}` : undefined,
    })

    return (
      <span ref={ref} className="inline-relative" {...props}>
        {trigger}

        {isVisible && (
          <div
            role="tooltip"
            className={cn(
              // 定位
              'absolute z-50',
              placementClasses[placement],
              // 样式
              'px-3 py-1.5',
              'bg-neutral-900',
              'text-white',
              'text-sm',
              'rounded',
              'whitespace-nowrap',
              // 动画
              'transition-opacity',
              'duration-200',
              'ease-out',
              'animate-in fade-in',
              className
            )}
          >
            {content}
            {showArrow && (
              <div
                className={cn(
                  'absolute w-0 h-0',
                  'border-4',
                  'border-neutral-900',
                  arrowClasses[placement]
                )}
              />
            )}
          </div>
        )}
      </span>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export default Tooltip
