import React from 'react'
import { colors, borderRadius, typography } from '@/lib/design-tokens'
import RippleEffect from '@/components/effects/RippleEffect'
import { CheckIcon, ErrorIcon, WarningIcon, InfoIcon } from '@/components/icons/LandscapeIcons'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  message: string
  kind: ToastKind
  onClose?: () => void
  autoClose?: boolean
  duration?: number
}

export default function Toast({
  message,
  kind,
  onClose,
  autoClose = true,
  duration = 3000,
}: ToastProps) {
  React.useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [autoClose, duration, onClose])

  const kindStyles = {
    success: {
      bg: 'bg-[#A8C8A8]/95',
      border: 'border-[#6BA539]',
      icon: 'text-white',
      iconBg: 'bg-[#4A7A2A]',
    },
    error: {
      bg: 'bg-[#FFB3B3]/95',
      border: 'border-[#CC0000]',
      icon: 'text-white',
      iconBg: 'bg-[#CC0000]',
    },
    warning: {
      bg: 'bg-[#F5F5DC]/95',
      border: 'border-[#8B7355]',
      icon: 'text-white',
      iconBg: 'bg-[#8B7355]',
    },
    info: {
      bg: 'bg-[#E8F4F0]/95',
      border: 'border-[#6BA539]',
      icon: 'text-white',
      iconBg: 'bg-[#4A7A2A]',
    },
  }

  const icons = {
    success: <CheckIcon size="sm" />,
    error: <ErrorIcon size="sm" />,
    warning: <WarningIcon size="sm" />,
    info: <InfoIcon size="sm" />,
  }

  const styles = kindStyles[kind]
  const icon = icons[kind]

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg ${styles.bg} ${styles.border} animate-slide-in font-[family-name:var(--font-serif)]`}
      role="alert"
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.iconBg}`}>
        <span className={styles.icon}>
          {icon}
        </span>
      </div>
      <p className="flex-1 text-sm font-medium text-[#2D2D2D]">
        {message}
      </p>
      {onClose && (
        <RippleEffect className="relative inline-block">
          <button
            onClick={onClose}
            className="flex-shrink-0 text-[#2D5A1D] hover:text-[#1A4A0A] transition-colors"
            aria-label="关闭"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </RippleEffect>
      )}
    </div>
  )
}

interface ToastContainerProps {
  children: React.ReactNode
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center'
}

export function ToastContainer({ children, position = 'top-right' }: ToastContainerProps) {
  const positionStyles = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 transform -translate-x-1/2',
  }

  return (
    <div
      className={`fixed z-50 flex flex-col gap-2 ${positionStyles[position]}`}
      role="region"
      aria-live="polite"
      aria-label="通知"
    >
      {children}
    </div>
  )
}
