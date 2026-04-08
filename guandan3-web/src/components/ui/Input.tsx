import React, { useId } from 'react'
import { colors, borderRadius, typography } from '@/lib/design-tokens'
import RippleEffect from '@/components/effects/RippleEffect'
import { SearchIcon, UserIcon, SettingsIcon, FilterIcon, SortIcon, CloseIcon, CheckIcon, InfoIcon, WarningIcon, ErrorIcon, RefreshIcon, DocumentIcon } from '@/components/icons/LandscapeIcons'

type IconType = React.ComponentType<{ size?: 'sm' | 'md' | 'lg', className?: string }>

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
  icon?: IconType
  onIconClick?: () => void
}

export default function Input({
  label,
  error,
  helperText,
  fullWidth = false,
  icon,
  onIconClick,
  className = '',
  id,
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id || `input-${generatedId}`

  const baseStyles = 'px-4 py-2 border-2 rounded-lg transition-all duration-200 ease-ripple focus:outline-none focus:ring-2 focus:ring-offset-1 font-[family-name:var(--font-serif)] bg-gradient-to-br from-poker-table to-poker-table-dark border-poker-table-border text-text-primary placeholder:text-text-secondary'

  const stateStyles = error
    ? 'border-error focus:ring-error focus:border-error'
    : 'focus:border-accent-gold focus:ring-accent-gold/30 focus:shadow-[0_0_0_3px_rgba(212,175,55,0.2)]'

  const widthStyles = fullWidth ? 'w-full' : ''

  const disabledStyles = props.disabled ? 'bg-poker-table/30 cursor-not-allowed opacity-50 border-poker-table-border' : ''

  const combinedClassName = `${baseStyles} ${stateStyles} ${widthStyles} ${disabledStyles} ${className}`

  const inputPadding = icon ? 'pr-10' : ''

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-text-secondary mb-1 font-[family-name:var(--font-serif)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <RippleEffect disabled={props.disabled} className="relative inline-block w-full">
          <input
            id={inputId}
            className={`${combinedClassName} ${inputPadding}`}
            aria-invalid={!!error}
            aria-describedby={error || helperText ? `${inputId}-description` : undefined}
            {...props}
          />
        </RippleEffect>
        {icon && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
            disabled={props.disabled}
            aria-label={onIconClick ? '触发图标操作' : undefined}
            tabIndex={onIconClick ? 0 : -1}
          >
            {React.createElement(icon, { size: 'sm', className: 'w-5 h-5' })}
          </button>
        )}
      </div>
      {error && (
        <p id={`${inputId}-description`} className="mt-1 text-sm text-error font-[family-name:var(--font-serif)]" role="alert">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p id={`${inputId}-description`} className="mt-1 text-sm text-text-secondary font-[family-name:var(--font-serif)]">
          {helperText}
        </p>
      )}
    </div>
  )
}
