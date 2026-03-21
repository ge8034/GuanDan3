import React, { useEffect } from 'react'
import { colors, borderRadius, typography } from '@/lib/design-tokens'
import RippleEffect from '@/components/effects/RippleEffect'
import { CloseIcon } from '@/components/icons/LandscapeIcons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleEscapeKey = React.useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    }
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [handleEscapeKey])

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        className={`bg-[#F5F5DC] rounded-xl shadow-2xl w-full ${sizeStyles[size]} transform transition-all duration-300 ease-ripple max-h-[90vh] overflow-hidden flex flex-col font-[family-name:var(--font-serif)]`}
        role="document"
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-[#D3D3D3]">
            {title && (
              <h2 id="modal-title" className="text-xl font-semibold text-[#1A4A0A]">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <RippleEffect className="relative inline-block">
                <button
                  onClick={onClose}
                  className="p-2 text-[#2D5A1D] hover:text-[#1A4A0A] hover:bg-[#A8C8A8]/30 rounded-lg transition-colors duration-300"
                  aria-label="关闭"
                >
                  <CloseIcon size="sm" />
                </button>
              </RippleEffect>
            )}
          </div>
        )}
        <div className="flex-1 overflow-y-auto p-6 text-[#2D2D2D]">
          {children}
        </div>
      </div>
    </div>
  )
}
