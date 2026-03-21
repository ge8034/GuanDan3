'use client'

import { forwardRef } from 'react'

export type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onChange, options, disabled = false, className = '' }, ref) => {
    return (
      <select
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={`bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5 text-white text-sm font-medium shadow-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-gray-900 text-white"
          >
            {option.label}
          </option>
        ))}
      </select>
    )
  }
)

Select.displayName = 'Select'
