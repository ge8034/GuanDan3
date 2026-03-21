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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-300 font-[family-name:var(--font-serif)]'
  
  const variantStyles = {
    primary: 'bg-[#A8C8A8] text-[#1A4A0A]',
    secondary: 'bg-[#F5F5DC] text-[#2D5A1D]',
    success: 'bg-[#A8C8A8] text-[#1A4A0A]',
    warning: 'bg-[#F5F5DC] text-[#5D4037]',
    error: 'bg-[#FFB3B3] text-[#8B0000]',
    info: 'bg-[#E8F4F0] text-[#2D5A1D]',
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
