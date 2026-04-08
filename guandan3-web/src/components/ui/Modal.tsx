import React, { useEffect, useRef, useCallback } from 'react'
import { colors, borderRadius, typography } from '@/lib/design-tokens'
import RippleEffect from '@/components/effects/RippleEffect'
import { CloseIcon } from '@/components/icons/LandscapeIcons'
import { generateAriaId, FocusManager } from '@/lib/utils/accessibility'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

const focusManager = new FocusManager()

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const titleId = useRef(generateAriaId('modal-title'))
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  // 管理body滚动
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // 保存当前焦点元素
      previouslyFocusedElement.current = document.activeElement as HTMLElement
    } else {
      document.body.style.overflow = 'unset'
      // 恢复焦点
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus()
      }
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  // ESC键关闭
  const handleEscapeKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      onClose()
    }
  }, [isOpen, onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [handleEscapeKey])

  // 焦点陷阱
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 设置焦点到模态框
      const focusableElement = modalRef.current.querySelector(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as HTMLElement
      focusableElement?.focus()

      // 创建焦点陷阱
      const cleanup = focusManager.createFocusTrap(modalRef.current)
      return cleanup
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? titleId.current : undefined}
    >
      <div
        ref={modalRef}
        className={`bg-gradient-to-br from-poker-table to-poker-table-dark border-2 border-accent-gold shadow-[0_8px_24px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.3)] text-text-primary rounded-xl w-full ${sizeStyles[size]} transform transition-all duration-200 ease-ripple max-h-[90vh] overflow-hidden flex flex-col font-[family-name:var(--font-serif)]`}
        role="document"
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 md:p-6 border-b-2 border-poker-table-border/50 bg-poker-table/30">
            {title && (
              <h2 id={titleId.current} className="text-xl font-semibold text-accent-gold">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <RippleEffect className="relative inline-block">
                <button
                  onClick={onClose}
                  className="p-2 text-text-secondary hover:text-accent-gold hover:bg-accent-gold/10 rounded-lg transition-colors duration-200 border-2 border-transparent hover:border-accent-gold/30"
                  aria-label="关闭对话框"
                >
                  <CloseIcon size="sm" className="text-accent-gold" />
                </button>
              </RippleEffect>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 text-gray-200">
          {children}
        </div>
      </div>
    </div>
  )
}
