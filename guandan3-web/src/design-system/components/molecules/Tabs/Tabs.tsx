/**
 * Tabs 组件
 *
 * 选项卡组件 - 使用内联样式确保可见
 */

'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { cn } from '@/design-system/utils/cn'

// ============================================
// 类型定义
// ============================================
export interface TabsProps {
  defaultValue?: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

export interface TabsListProps {
  children: ReactNode
  className?: string
}

export interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  disabled?: boolean
}

export interface TabsContentProps {
  value: string
  children: ReactNode
  className?: string
}

// ============================================
// Context
// ============================================
interface TabsContextValue {
  value: string
  onValueChange: (value: string) => void
}

const TabsContext = createContext<TabsContextValue | null>(null)

function useTabs() {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider')
  }
  return context
}

// ============================================
// TabsList 组件 - 使用内联样式
// ============================================
export function TabsList({ children, className }: TabsListProps) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.375rem',
        backgroundColor: 'white',
        borderRadius: '12px',
        border: '2px solid #e5e7eb',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
      role="tablist"
    >
      {children}
    </div>
  )
}

// ============================================
// TabsTrigger 组件 - 使用内联样式
// ============================================
export function TabsTrigger({
  value,
  children,
  className,
  disabled = false,
}: TabsTriggerProps) {
  const { value: selectedValue, onValueChange } = useTabs()
  const isSelected = selectedValue === value

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isSelected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        whiteSpace: 'nowrap',
        padding: '0.625rem 1rem',
        borderRadius: '8px',
        border: 'none',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        backgroundColor: isSelected ? '#1a472a' : 'transparent',
        color: isSelected ? 'white' : '#4b5563',
        boxShadow: isSelected ? '0 4px 6px -1px rgba(0,0,0,0.1)' : 'none',
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.backgroundColor = '#f9fafb'
          e.currentTarget.style.color = '#111827'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && !isSelected) {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.color = '#4b5563'
        }
      }}
    >
      {children}
    </button>
  )
}

// ============================================
// TabsContent 组件
// ============================================
export function TabsContent({
  value,
  children,
  className,
}: TabsContentProps) {
  const { value: selectedValue } = useTabs()

  if (value !== selectedValue) {
    return null
  }

  return (
    <div
      role="tabpanel"
      className={className}
    >
      {children}
    </div>
  )
}

// ============================================
// Root Tabs 组件
// ============================================
export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  children,
  className,
}: TabsProps) {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue || '')

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

  return (
    <TabsContext.Provider value={{ value: currentValue, onValueChange: handleValueChange }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  )
}

Tabs.displayName = 'Tabs'

// 默认导出
export default Tabs
