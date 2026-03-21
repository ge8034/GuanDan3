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
  
  const baseStyles = 'px-4 py-2 border rounded-lg transition-all duration-300 ease-ripple focus:outline-none focus:ring-2 focus:ring-offset-1 font-[family-name:var(--font-serif)]'
  
  const stateStyles = error
    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
    : 'border-[#D3D3D3] focus:ring-[#6BA539] focus:border-[#6BA539]'
  
  const widthStyles = fullWidth ? 'w-full' : ''
  
  const disabledStyles = props.disabled ? 'bg-[#F5F5DC]/50 cursor-not-allowed opacity-50' : ''

  const combinedClassName = `${baseStyles} ${stateStyles} ${widthStyles} ${disabledStyles} ${className}`

  const inputPadding = icon ? 'pr-10' : ''

  return (
    <div className={fullWidth ? 'w-full' : ''}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-gray-700 mb-1 font-[family-name:var(--font-serif)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <RippleEffect disabled={props.disabled} className="relative inline-block w-full">
          <input
            id={inputId}
            className={`${combinedClassName} ${inputPadding}`}
            {...props}
          />
        </RippleEffect>
        {icon && (
          <button
            type="button"
            onClick={onIconClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[#6BA539] transition-colors focus:outline-none focus:ring-2 focus:ring-[#6BA539] rounded"
            disabled={props.disabled}
          >
            {React.createElement(icon, { size: 'sm', className: 'w-5 h-5' })}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-700 font-[family-name:var(--font-serif)]">
          {error}
        </p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-700 font-[family-name:var(--font-serif)]">
          {helperText}
        </p>
      )}
    </div>
  )
}
