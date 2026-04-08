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
      bg: 'bg-emerald-600/95',
      border: 'border-emerald-500',
      icon: 'text-white',
      iconBg: 'bg-emerald-700',
    },
    error: {
      bg: 'bg-red-600/95',
      border: 'border-red-500',
      icon: 'text-white',
      iconBg: 'bg-red-700',
    },
    warning: {
      bg: 'bg-amber-600/95',
      border: 'border-amber-500',
      icon: 'text-white',
      iconBg: 'bg-amber-700',
    },
    info: {
      bg: 'bg-blue-600/95',
      border: 'border-blue-500',
      icon: 'text-white',
      iconBg: 'bg-blue-700',
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
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border shadow-[0_4px_12px_rgba(0,0,0,0.5)] ${styles.bg} ${styles.border} animate-slide-in font-[family-name:var(--font-serif)]`}
      role="alert"
      aria-live={kind === 'error' ? 'assertive' : 'polite'}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${styles.iconBg}`}>
        <span className={styles.icon} aria-hidden="true">
          {icon}
        </span>
      </div>
      <p className="flex-1 text-sm font-medium text-text-primary">
        {message}
      </p>
      {onClose && (
        <RippleEffect className="relative inline-block">
          <button
            onClick={onClose}
            className="flex-shrink-0 text-primary-700 hover:text-primary-900 transition-colors"
            aria-label="关闭通知"
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
