/**
 * Select 组件
 *
 * 下拉选择组件 - 使用内联样式确保可见
 */

'use client'

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react'
import { ChevronDown, Check } from 'lucide-react'

// ============================================
// 类型定义
// ============================================
export interface SelectProps {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  error?: boolean
  children: ReactNode
  className?: string
}

export interface SelectTriggerProps {
  children: ReactNode
  className?: string
  disabled?: boolean
  error?: boolean
}

export interface SelectContentProps {
  children: ReactNode
  className?: string
}

export interface SelectItemProps {
  value: string
  children: ReactNode
  disabled?: boolean
  className?: string
}

export interface SelectValueProps {
  placeholder?: string
  className?: string
}

// ============================================
// Context
// ============================================
interface SelectContextValue {
  value: string
  onValueChange: (value: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
  disabled: boolean
  error: boolean
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

const SelectContext = createContext<SelectContextValue | null>(null)

function useSelect() {
  const context = useContext(SelectContext)
  if (!context) {
    throw new Error('Select components must be used within a Select provider')
  }
  return context
}

// ============================================
// SelectTrigger 组件 - 使用内联样式
// ============================================
export function SelectTrigger({
  children,
  className,
  disabled = false,
  error = false,
}: SelectTriggerProps) {
  const { open, onOpenChange, disabled: contextDisabled, error: contextError, triggerRef } = useSelect()
  const isDisabled = disabled || contextDisabled
  const hasError = error || contextError

  return (
    <button
      ref={triggerRef}
      type="button"
      role="combobox"
      aria-expanded={open}
      aria-disabled={isDisabled}
      disabled={isDisabled}
      onClick={() => !isDisabled && onOpenChange(!open)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        borderRadius: '12px',
        border: `2px solid ${hasError ? '#ef4444' : (open ? '#a78bfa' : '#e5e7eb')}`,
        padding: '0.75rem 1rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        backgroundColor: isDisabled ? '#f9fafb' : 'white',
        color: '#111827',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: isDisabled ? 0.5 : 1,
        boxShadow: open ? '0 0 0 3px rgba(167, 139, 250, 0.2)' : 'none',
      }}
    >
      {children}
      <ChevronDown
        style={{
          height: '16px',
          width: '16px',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      />
    </button>
  )
}

// ============================================
// SelectValue 组件
// ============================================
export function SelectValue({ placeholder, className }: SelectValueProps) {
  const { value } = useSelect()

  return (
    <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', ...(!value && { color: '#9ca3af' }) }}>
      {value || placeholder}
    </span>
  )
}

// ============================================
// SelectContent 组件 - 使用内联样式
// ============================================
export function SelectContent({ children, className }: SelectContentProps) {
  const { open, triggerRef } = useSelect()
  const contentRef = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

  useEffect(() => {
    if (open && triggerRef.current && contentRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect()
      setPosition({
        top: triggerRect.bottom + 4,
        left: triggerRect.left,
        width: triggerRect.width,
      })
    }
  }, [open, triggerRef])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        // 由 SelectRoot 处理关闭
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open, triggerRef])

  if (!open) return null

  return (
    <div
      ref={contentRef}
      style={{
        position: 'fixed',
        zIndex: 50,
        maxHeight: '240px',
        overflowY: 'auto',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        backgroundColor: 'white',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        padding: '0.5rem',
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${position.width}px`,
        animation: 'fadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      role="listbox"
    >
      {children}
    </div>
  )
}

// ============================================
// SelectItem 组件 - 使用内联样式
// ============================================
export function SelectItem({
  value: itemValue,
  children,
  disabled = false,
  className,
}: SelectItemProps) {
  const { value, onValueChange, onOpenChange } = useSelect()
  const isSelected = value === itemValue

  return (
    <div
      role="option"
      aria-selected={isSelected}
      aria-disabled={disabled}
      onClick={() => {
        if (!disabled) {
          onValueChange(itemValue)
          onOpenChange(false)
        }
      }}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        cursor: disabled ? 'not-allowed' : 'pointer',
        margin: '0 0.5rem',
        padding: '0.625rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 500,
        transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: isSelected ? '#1a472a' : 'transparent',
        color: isSelected ? 'white' : '#374151',
        boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.backgroundColor = '#f9fafb'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
        }
      }}
    >
      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      {isSelected && (
        <Check style={{ height: '16px', width: '16px', color: 'white' }} />
      )}
    </div>
  )
}

// ============================================
// SelectGroup 组件
// ============================================
export interface SelectGroupProps {
  label?: string
  children: ReactNode
  className?: string
}

export function SelectGroup({ label, children, className }: SelectGroupProps) {
  return (
    <div className={className} role="group">
      {label && (
        <div style={{
          padding: '0.5rem 1rem',
          fontSize: '0.75rem',
          fontWeight: 600,
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  )
}

// ============================================
// SelectSeparator 组件
// ============================================
export interface SelectSeparatorProps {
  className?: string
}

export function SelectSeparator({ className }: SelectSeparatorProps) {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: '#e5e7eb',
        margin: '0.5rem 0.75rem',
      }}
      role="separator"
    />
  )
}

// ============================================
// Root Select 组件
// ============================================
export function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  placeholder = '请选择...',
  disabled = false,
  error = false,
  children,
  className,
}: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '')
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement | null>(null)

  const currentValue = controlledValue ?? uncontrolledValue
  const handleValueChange = useCallback(
    (newValue: string) => {
      onValueChange?.(newValue)
      if (controlledValue === undefined) {
        setUncontrolledValue(newValue)
      }
    },
    [controlledValue, onValueChange]
  )

  useEffect(() => {
    if (!open) return

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  useEffect(() => {
    if (!open) return

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <SelectContext.Provider
      value={{
        value: currentValue,
        onValueChange: handleValueChange,
        open,
        onOpenChange: setOpen,
        disabled,
        error,
        triggerRef,
      }}
    >
      <div className={className}>{children}</div>
    </SelectContext.Provider>
  )
}

Select.displayName = 'Select'

// 默认导出
export default Select
