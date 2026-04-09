/**
 * Tooltip 组件
 *
 * 工具提示组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useRef, useEffect, cloneElement, ReactElement, MouseEvent } from 'react'
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
   * 触发方式
   * @default 'hover'
   */
  trigger?: 'hover' | 'click' | 'focus'

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean

  /**
   * 是否显示箭头
   * @default true
   */
  showArrow?: boolean

  /**
   * 延迟显示时间（毫秒）
   * @default 200
   */
  delay?: number

  /**
   * 显示状态变化回调
   */
  onVisibleChange?: (visible: boolean) => void

  /**
   * 自定义提示框类名
   */
  tooltipClassName?: string

  /**
   * 提示框背景颜色
   * @default 'neutral'
   */
  variant?: 'neutral' | 'primary' | 'error'
}

// ============================================
// Tooltip 组件
// ============================================
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      placement = 'top',
      trigger = 'hover',
      disabled = false,
      showArrow = true,
      delay = 200,
      onVisibleChange,
      tooltipClassName,
      variant = 'neutral',
      className,
      ...props
    },
    ref
  ) => {
    const [visible, setVisible] = useState(false)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)
    const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

    // 更新提示框位置
    const updatePosition = () => {
      if (!triggerRef.current || !tooltipRef.current) return

      const triggerRect = triggerRef.current.getBoundingClientRect()
      const tooltipRect = tooltipRef.current.getBoundingClientRect()

      // 检查元素是否有尺寸
      if (triggerRect.width === 0 || triggerRect.height === 0) return

      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

      let top = 0
      let left = 0

      switch (placement) {
        case 'top':
          top = triggerRect.top + scrollTop - tooltipRect.height - 8
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'bottom':
          top = triggerRect.bottom + scrollTop + 8
          left = triggerRect.left + scrollLeft + (triggerRect.width - tooltipRect.width) / 2
          break
        case 'left':
          top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.left + scrollLeft - tooltipRect.width - 8
          break
        case 'right':
          top = triggerRect.top + scrollTop + (triggerRect.height - tooltipRect.height) / 2
          left = triggerRect.right + scrollLeft + 8
          break
      }

      // 边界检测，防止超出视口
      const padding = 8
      const maxLeft = window.innerWidth - tooltipRect.width - padding
      const maxTop = window.innerHeight - tooltipRect.height - padding

      // 只在有效位置时更新（避免在测试环境中设置为 0,0）
      if (window.innerWidth > 0 && window.innerHeight > 0) {
        left = Math.max(padding, Math.min(left, maxLeft))
        top = Math.max(padding, Math.min(top, maxTop))
        setPosition({ top, left })
      }
    }

    // 显示提示框
    const showTooltip = () => {
      if (disabled) return

      if (delay > 0) {
        timeoutRef.current = setTimeout(() => {
          setVisible(true)
          onVisibleChange?.(true)
        }, delay)
      } else {
        setVisible(true)
        onVisibleChange?.(true)
      }
    }

    // 隐藏提示框
    const hideTooltip = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setVisible(false)
      onVisibleChange?.(false)
    }

    // 触发事件处理
    const eventHandlers = {
      hover: {
        onMouseEnter: showTooltip,
        onMouseLeave: hideTooltip,
      },
      click: {
        onClick: (e: React.MouseEvent) => {
          e.stopPropagation()
          setVisible(v => !v)
          onVisibleChange?.(!visible)
        },
      },
      focus: {
        onFocus: showTooltip,
        onBlur: hideTooltip,
      },
    }

    // 更新位置（当显示时或窗口调整大小时）
    useEffect(() => {
      if (visible) {
        // 延迟一帧以确保 tooltip 已渲染
        requestAnimationFrame(() => {
          updatePosition()
        })
      }
    }, [visible, placement])

    useEffect(() => {
      if (visible) {
        const handleResize = () => updatePosition()
        const handleScroll = () => updatePosition()

        window.addEventListener('resize', handleResize)
        window.addEventListener('scroll', handleScroll, true)

        return () => {
          window.removeEventListener('resize', handleResize)
          window.removeEventListener('scroll', handleScroll, true)
        }
      }
    }, [visible])

    // 点击外部关闭
    useEffect(() => {
      if (visible && trigger === 'click') {
        const handleClickOutside = (e: Event) => {
          if (
            triggerRef.current &&
            !triggerRef.current.contains(e.target as Node) &&
            tooltipRef.current &&
            !tooltipRef.current.contains(e.target as Node)
          ) {
            hideTooltip()
          }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
      }
    }, [visible, trigger])

    // 组件卸载时清理定时器
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [])

    // 箭头样式
    const arrowStyles: Record<typeof placement, string> = {
      top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full rotate-45',
      bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45',
      left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full rotate-45',
      right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full rotate-45',
    }

    // 颜色样式
    const variantStyles: Record<typeof variant, string> = {
      neutral: 'bg-neutral-900 text-white',
      primary: 'bg-primary-500 text-white',
      error: 'bg-error-500 text-white',
    }

    return (
      <>
        <div
          ref={triggerRef}
          {...eventHandlers[trigger]}
          className="inline-block"
        >
          {cloneElement(children, {
            ...(children.props as any),
            tabIndex: trigger === 'focus' ? 0 : (children.props as any).tabIndex,
          })}
        </div>

        {visible && !disabled && (
          <div
            ref={tooltipRef}
            className={cn(
              'fixed',
              'z-50',
              'px-2 py-1',
              'text-sm',
              'rounded',
              'whitespace-nowrap',
              'pointer-events-none',
              'duration-200',
              'transition-opacity',
              'opacity-0',
              'animate-in',
              'fade-in',
              variantStyles[variant],
              tooltipClassName,
              className
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
            }}
            {...props}
          >
            {content}
            {showArrow && (
              <div
                className={cn(
                  'absolute',
                  'w-2 h-2',
                  arrowStyles[placement],
                  variantStyles[variant]
                )}
              />
            )}
          </div>
        )}
      </>
    )
  }
)

Tooltip.displayName = 'Tooltip'

export default Tooltip
