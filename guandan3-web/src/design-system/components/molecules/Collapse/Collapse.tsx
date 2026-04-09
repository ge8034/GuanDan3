/**
 * Collapse 组件
 *
 * 折叠面板组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, createContext, useContext } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface CollapseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * 默认展开的项
   */
  defaultActiveKey?: string | string[]

  /**
   * 手风琴模式（每次只展开一项）
   * @default false
   */
  accordion?: boolean

  /**
   * 变化回调
   */
  onChange?: (activeKey: string | string[]) => void
}

export interface CollapseItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'title'> {
  /**
   * 唯一标识
   */
  itemKey: string

  /**
   * 面板标题
   */
  title: ReactNode

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean

  /**
   * 是否可关闭
   * @default true
   */
  closable?: boolean

  /**
   * 额外内容（标题右侧）
   */
  extra?: ReactNode

  /**
   * 展开时的图标
   */
  expandIcon?: ReactNode
}

// ============================================
// Collapse 上下文
// ============================================
interface CollapseContextValue {
  activeKeys: string[]
  toggleItem: (key: string) => void
  accordion?: boolean
}

const CollapseContext = createContext<CollapseContextValue | null>(null)

// ============================================
// CollapseItem 内部组件
// ============================================
const CollapseItemInner = forwardRef<HTMLDivElement, CollapseItemProps & { isActive?: boolean; onToggle?: () => void }>(
  (
    {
      itemKey,
      title,
      disabled = false,
      closable = true,
      extra,
      expandIcon,
      isActive = false,
      onToggle,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const context = useContext(CollapseContext)
    const accordion = context?.accordion || false

    // 默认展开图标
    const defaultExpandIcon = (
      <svg
        className="w-4 h-4 transition-transform duration-200"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        style={isActive ? { transform: 'rotate(180deg)' } : undefined}
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    )

    return (
      <div
        ref={ref}
        className={cn('border-b border-neutral-200 last:border-0', className)}
        {...props}
      >
        {/* 面板头部 */}
        <div
          className={cn(
            'flex',
            'items-center',
            'justify-between',
            'py-3',
            'cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50',
            className
          )}
          onClick={() => !disabled && onToggle?.()}
        >
          {/* 左侧：图标 + 标题 */}
          <div className="flex items-center gap-2">
            {expandIcon || defaultExpandIcon}
            <span className="font-medium text-neutral-900">{title}</span>
          </div>

          {/* 右侧：额外内容 */}
          {extra && <div className="text-sm text-neutral-500">{extra}</div>}
        </div>

        {/* 面板内容 */}
        {(isActive || !closable) && (
          <div className="py-3 text-neutral-600">
            {children}
          </div>
        )}
      </div>
    )
  }
)

CollapseItemInner.displayName = 'CollapseItemInner'

// ============================================
// Collapse 主组件
// ============================================
export const Collapse = forwardRef<HTMLDivElement, CollapseProps>(
  (
    {
      defaultActiveKey = [],
      accordion = false,
      onChange,
      children,
      className,
      ...props
    },
    ref
  ) => {
    // 初始化激活状态
    const defaultKeys = Array.isArray(defaultActiveKey) ? defaultActiveKey : [defaultActiveKey]
    const [activeKeys, setActiveKeys] = useState<string[]>(defaultKeys)

    // 统一处理状态变化
    const handleToggle = (key: string) => {
      let newKeys: string[]

      if (accordion) {
        // 手风琴模式：只展开一项
        newKeys = activeKeys.includes(key) ? [] : [key]
      } else {
        // 普通模式：切换该项
        newKeys = activeKeys.includes(key)
          ? activeKeys.filter(k => k !== key)
          : [...activeKeys, key]
      }

      setActiveKeys(newKeys)
      onChange?.(accordion ? newKeys[0] : newKeys)
    }

    const contextValue: CollapseContextValue = {
      activeKeys,
      toggleItem: handleToggle,
      accordion,
    }

    return (
      <CollapseContext.Provider value={contextValue}>
        <div ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </div>
      </CollapseContext.Provider>
    )
  }
)

Collapse.displayName = 'Collapse'

// ============================================
// CollapseItem 导出组件
// ============================================
export const CollapseItem = forwardRef<HTMLDivElement, CollapseItemProps>((props, ref) => {
  const context = useContext(CollapseContext)

  if (!context) {
    console.warn('CollapseItem must be used within Collapse component')
    return null
  }

  const { activeKeys, toggleItem } = context
  const isActive = activeKeys.includes(props.itemKey)

  return (
    <CollapseItemInner
      ref={ref}
      {...props}
      isActive={isActive}
      onToggle={() => toggleItem(props.itemKey)}
    />
  )
})

CollapseItem.displayName = 'CollapseItem'

export default Collapse
