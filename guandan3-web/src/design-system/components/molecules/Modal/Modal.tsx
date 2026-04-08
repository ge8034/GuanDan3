/**
 * Modal 组件
 *
 * 对话框组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useEffect } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'
import { X } from 'lucide-react'

// ============================================
// 类型定义
// ============================================
export interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 是否打开
   */
  open?: boolean

  /**
   * 打开状态改变回调
   */
  onOpenChange?: (open: boolean) => void

  /**
   * 标题
   */
  title?: React.ReactNode

  /**
   * 描述
   */
  description?: React.ReactNode

  /**
   * 是否显示关闭按钮
   * @default true
   */
  showCloseButton?: boolean

  /**
   * 点击遮罩是否关闭
   * @default true
   */
  closeOnOverlayClick?: boolean

  /**
   * 按ESC是否关闭
   * @default true
   */
  closeOnEscape?: boolean

  /**
   * 尺寸
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'

  /**
   * 是否显示遮罩
   * @default true
   */
  showOverlay?: boolean
}

// ============================================
// 尺寸样式
// ============================================
const sizeStyles = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-full mx-4',
}

/**
 * Modal 组件
 *
 * @example
 * ```tsx
 * <Modal open={isOpen} onOpenChange={setIsOpen} title="标题">
 *   <ModalDescription>描述内容</ModalDescription>
 *   <ModalContent>内容区域</ModalContent>
 *   <ModalFooter>
 *     <Button variant="secondary" onClick={() => setIsOpen(false)}>取消</Button>
 *     <Button>确认</Button>
 *   </ModalFooter>
 * </Modal>
 * ```
 */
export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  (
    {
      open = false,
      onOpenChange,
      title,
      description,
      showCloseButton = true,
      closeOnOverlayClick = true,
      closeOnEscape = true,
      size = 'md',
      showOverlay = true,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // ESC键关闭支持
    useEffect(() => {
      if (!closeOnEscape) return

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && open) {
          onOpenChange?.(false)
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }, [open, closeOnEscape, onOpenChange])

    // 防止页面滚动
    useEffect(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }

      return () => {
        document.body.style.overflow = ''
      }
    }, [open])

    if (!open) return null

    return (
      <div
        className="fixed inset-0 z-[modal] flex items-center justify-center p-4"
        onClick={() => closeOnOverlayClick && onOpenChange?.(false)}
      >
        {/* 遮罩 */}
        {showOverlay && (
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            style={{ animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
        )}

        {/* 对话框容器 */}
        <div
          ref={ref}
          className={cn(
            // 基础样式
            'relative',
            'bg-white',
            'rounded-2xl',
            'shadow-xl',
            'w-full',
            sizeStyles[size],

            // 动画（300ms - 布局变化）
            'animate-in',
            'fade-in',
            'slide-in-from-bottom-4',
            'duration-300',
            'ease-[cubic-bezier(0.16,1,0.3,1)]',
            'zoom-in-95',

            // 自定义类名
            className
          )}
          onClick={(e) => e.stopPropagation()}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
          {...props}
        >
          {/* 头部 */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-neutral-200">
              <div>
                {title && (
                  <h2
                    id="modal-title"
                    className="text-lg font-semibold text-neutral-900"
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id="modal-description"
                    className="text-sm text-neutral-600 mt-1"
                  >
                    {description}
                  </p>
                )}
              </div>

              {showCloseButton && (
                <button
                  onClick={() => onOpenChange?.(false)}
                  className="rounded-md p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors duration-200"
                  aria-label="关闭对话框"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          {/* 内容 */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    )
  }
)

Modal.displayName = 'Modal'

// ============================================
// Modal 子组件
// ============================================

/**
 * Modal 描述组件
 */
export const ModalDescription = forwardRef<
  HTMLParagraphElement,
  HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-neutral-600', className)}
    {...props}
  />
))
ModalDescription.displayName = 'ModalDescription'

/**
 * Modal 内容组件
 */
export const ModalContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('py-4', className)}
    {...props}
  />
))
ModalContent.displayName = 'ModalContent'

/**
 * Modal 底部组件
 */
export const ModalFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'flex items-center justify-end gap-3 pt-6 border-t border-neutral-200',
      className
    )}
    {...props}
  />
))
ModalFooter.displayName = 'ModalFooter'

export default Modal
