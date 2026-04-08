'use client'

import { forwardRef } from 'react'

export type SelectProps = {
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  disabled?: boolean
  className?: string
  label?: string
  id?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ value, onChange, options, disabled = false, className = '', label, id }, ref) => {
    const selectId = id || 'select'

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-gray-300 mb-1"
          >
            {label}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-disabled={disabled}
          className={`w-full bg-white/90 backdrop-blur-md border border-poker-table-border rounded-lg px-3 py-2 text-gray-900 text-sm font-medium shadow-sm hover:bg-white focus:outline-none focus:border-poker-table-light focus:ring-2 focus:ring-poker-table/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-white text-gray-900"
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)

Select.displayName = 'Select'
