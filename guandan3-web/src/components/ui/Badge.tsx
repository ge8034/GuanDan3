import React from 'react'
import { colors, borderRadius, typography } from '@/lib/design-tokens'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export default function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
}: BadgeProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 font-[family-name:var(--font-serif)]'

  const variantStyles = {
    primary: 'bg-gradient-to-r from-poker-table to-poker-table-dark border-2 border-poker-table-border text-white shadow-md',
    secondary: 'bg-gradient-to-r from-poker-table-light to-poker-table border border-poker-table-border text-gray-200 shadow-sm',
    success: 'bg-gradient-to-r from-success to-[#22c55e] border-2 border-success/30 text-white shadow-md',
    warning: 'bg-gradient-to-r from-warning to-[#f59e0b] border-2 border-warning/30 text-white shadow-md',
    error: 'bg-gradient-to-r from-error to-[#ef4444] border-2 border-error/30 text-white shadow-md',
    info: 'bg-gradient-to-r from-info to-[#3b82f6] border-2 border-info/30 text-white shadow-md',
  }

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-2.5 py-1 text-sm rounded-lg',
    lg: 'px-3 py-1.5 text-base rounded-lg',
  }

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  return (
    <span className={combinedClassName}>
      {children}
    </span>
  )
}
