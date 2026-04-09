/**
 * Popover 弹出框组件
 *
 * 浮层弹出内容
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useRef, useEffect, useId } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'
import { ChevronUp } from 'lucide-react'

// ============================================
// 类型定义
// ============================================
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, 'content'> {
  /**
   * 触发元素
   */
  trigger?: ReactNode

  /**
   * 弹出内容
   */
  content: ReactNode

  /**
   * 位置
   */
  placement?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 触发方式
   */
  triggerMode?: 'click' | 'hover'

  /**
   * 是否显示箭头
   */
  showArrow?: boolean

  /**
   * 偏移量（px）
   */
  offset?: number

  /**
   * 是否自动关闭
   */
  closeOnClick?: boolean

  /**
   * 打开状态
   */
  open?: boolean

  /**
   * 默认打开状态
   */
  defaultOpen?: boolean

  /**
   * 状态变化回调
   */
  onOpenChange?: (open: boolean) => void

  /**
   * 弹出层样式类名
   */
  popoverClassName?: string

  /**
   * 触发器样式类名
   */
  triggerClassName?: string

  /**
   * 内容宽度
   */
  contentWidth?: 'auto' | 'trigger' | number
}

// ============================================
// Popover 主组件
// ============================================
export const Popover = forwardRef<HTMLDivElement, PopoverProps>(
  (
    {
      trigger,
      content,
      placement = 'bottom',
      disabled = false,
      triggerMode = 'click',
      showArrow = true,
      offset = 8,
      closeOnClick = true,
      open: controlledOpen,
      defaultOpen = false,
      onOpenChange,
      popoverClassName,
      triggerClassName,
      contentWidth = 'auto',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalOpen, setInternalOpen] = useState(defaultOpen)
    const [position, setPosition] = useState({ top: 0, left: 0 })
    const triggerRef = useRef<HTMLDivElement>(null)
    const popoverRef = useRef<HTMLDivElement>(null)
    const id = useId()

    // 确定当前打开状态
    const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen

    // 更新位置
    const updatePosition = () => {
      if (!triggerRef.current || !popoverRef.current) return

      const triggerRect = triggerRef.current.getBoundingClientRect()
      const popoverRect = popoverRef.current.getBoundingClientRect()

      // 处理零大小元素（测试环境）
      if (triggerRect.width === 0 || triggerRect.height === 0) {
        return
      }

      let top = 0
      let left = 0

      // 根据位置计算坐标
      switch (placement) {
        case 'top':
          top = triggerRect.top - popoverRect.height - offset
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
          break
        case 'bottom':
          top = triggerRect.bottom + offset
          left = triggerRect.left + (triggerRect.width - popoverRect.width) / 2
          break
        case 'left':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
          left = triggerRect.left - popoverRect.width - offset
          break
        case 'right':
          top = triggerRect.top + (triggerRect.height - popoverRect.height) / 2
          left = triggerRect.right + offset
          break
      }

      // 边界检查
      const padding = 8
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      // 水平边界
      if (left < padding) {
        left = padding
      } else if (left + popoverRect.width > viewportWidth - padding) {
        left = viewportWidth - popoverRect.width - padding
      }

      // 垂直边界
      if (top < padding) {
        top = padding
      } else if (top + popoverRect.height > viewportHeight - padding) {
        top = viewportHeight - popoverRect.height - padding
      }

      setPosition({ top, left })
    }

    // 打开/关闭处理
    const handleOpen = () => {
      if (disabled) return

      if (controlledOpen === undefined) {
        setInternalOpen(true)
      }
      onOpenChange?.(true)
    }

    const handleClose = () => {
      if (controlledOpen === undefined) {
        setInternalOpen(false)
      }
      onOpenChange?.(false)
    }

    const handleToggle = () => {
      if (isOpen) {
        handleClose()
      } else {
        handleOpen()
      }
    }

    // 鼠标事件处理
    const handleMouseEnter = () => {
      if (triggerMode === 'hover') {
        handleOpen()
      }
    }

    const handleMouseLeave = () => {
      if (triggerMode === 'hover') {
        handleClose()
      }
    }

    // 点击外部关闭
    useEffect(() => {
      if (!isOpen) return

      const handleClickOutside = (e: MouseEvent) => {
        if (
          triggerRef.current &&
          popoverRef.current &&
          !triggerRef.current.contains(e.target as Node) &&
          !popoverRef.current.contains(e.target as Node)
        ) {
          handleClose()
        }
      }

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose()
        }
      }

      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)

      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('keydown', handleEscape)
      }
    }, [isOpen])

    // 更新位置
    useEffect(() => {
      if (isOpen) {
        // 使用 requestAnimationFrame 确保 DOM 更新完成
        const rafId = requestAnimationFrame(() => {
          updatePosition()
        })

        return () => cancelAnimationFrame(rafId)
      }
    }, [isOpen, placement, offset])

    // 窗口大小变化时更新位置
    useEffect(() => {
      if (!isOpen) return

      const handleResize = () => {
        updatePosition()
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }, [isOpen, placement, offset])

    // 计算宽度
    const getContentWidth = () => {
      if (contentWidth === 'auto') return 'auto'
      if (contentWidth === 'trigger' && triggerRef.current) {
        return `${triggerRef.current.offsetWidth}px`
      }
      return `${contentWidth}px`
    }

    // 箭头样式
    const arrowStyles: Record<string, string> = {
      top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full',
      bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full',
      left: 'right-0 top-1/2 -translate-y-1/2 translate-x-full',
      right: 'left-0 top-1/2 -translate-y-1/2 -translate-x-full',
    }

    return (
      <div ref={ref} className={cn('relative inline-block', className)} {...props}>
        {/* 触发器 */}
        <div
          ref={triggerRef}
          className={cn(
            'inline-block',
            disabled && 'cursor-not-allowed opacity-50',
            !disabled && triggerMode === 'click' && 'cursor-pointer',
            triggerClassName
          )}
          onClick={triggerMode === 'click' ? handleToggle : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {trigger || children}
        </div>

        {/* 弹出层 */}
        {isOpen && (
          <div
            ref={popoverRef}
            className={cn(
              'fixed',
              'z-50',
              'bg-white',
              'rounded-lg',
              'shadow-lg',
              'border',
              'border-neutral-200',
              'p-4',
              'max-w-sm',
              'animate-in',
              'fade-in',
              'zoom-in-95',
              'duration-200',
              popoverClassName
            )}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              width: getContentWidth(),
            }}
            onClick={closeOnClick ? handleClose : undefined}
            onMouseEnter={triggerMode === 'hover' ? handleOpen : undefined}
            onMouseLeave={triggerMode === 'hover' ? handleClose : undefined}
          >
            {/* 箭头 */}
            {showArrow && (
              <div
                className={cn(
                  'absolute',
                  'w-2',
                  'h-2',
                  'bg-white',
                  'border',
                  'border-neutral-200',
                  'rotate-45',
                  arrowStyles[placement]
                )}
              />
            )}

            {/* 内容 */}
            <div className="relative z-10">
              {content}
            </div>
          </div>
        )}
      </div>
    )
  }
)

Popover.displayName = 'Popover'

export default Popover
