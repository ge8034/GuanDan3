'use client'

import React, { useState } from 'react'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface TabsProps {
  defaultValue: string
  children: React.ReactNode
  className?: string
}

export function Tabs({ defaultValue, children, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div className={cn('space-y-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, { activeTab, setActiveTab })
        }
        return child
      })}
    </div>
  )
}

interface TabsListProps {
  children: React.ReactNode
  className?: string
  activeTab?: string
  setActiveTab?: (value: string) => void
}

export function TabsList({ children, className, activeTab, setActiveTab }: TabsListProps) {
  return (
    <div className={cn('flex border-b border-poker-table-border', className)} role="tablist">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as React.ReactElement<any>, {
            activeTab,
            setActiveTab
          })
        }
        return child
      })}
    </div>
  )
}

interface TabsTriggerProps {
  value: string
  children: React.ReactNode
  className?: string
  activeTab?: string
  setActiveTab?: (value: string) => void
}

export function TabsTrigger({ value, children, className, activeTab, setActiveTab }: TabsTriggerProps) {
  const isSelected = activeTab === value

  return (
    <button
      onClick={() => setActiveTab?.(value)}
      className={cn(
        'px-4 py-2 text-sm font-medium transition-colors',
        'border-b-2 -mb-px',
        isSelected
          ? 'border-accent-gold text-accent-gold'
          : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-poker-table-border',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold/50 focus-visible:ring-offset-2',
        className
      )}
      role="tab"
      aria-selected={isSelected}
      aria-controls={`panel-${value}`}
    >
      {children}
    </button>
  )
}

interface TabsContentProps {
  value: string
  children: React.ReactNode
  className?: string
  activeTab?: string
}

export function TabsContent({ value, children, className, activeTab }: TabsContentProps) {
  if (activeTab !== value) return null

  return (
    <div
      className={cn('space-y-4', className)}
      role="tabpanel"
      id={`panel-${value}`}
      aria-labelledby={`tab-${value}`}
    >
      {children}
    </div>
  )
}
