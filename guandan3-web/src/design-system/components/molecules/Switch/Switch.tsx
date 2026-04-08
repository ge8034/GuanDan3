/**
 * Switch 开关组件
 *
 * 切换开关
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useEffect } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface SwitchProps extends Omit<HTMLAttributes<HTMLInputElement>, 'type' | 'checked' | 'onChange'> {
  /**
   * 是否选中
   */
  checked?: boolean

  /**
   * 默认是否选中（非受控）
   */
  defaultChecked?: boolean

  /**
   * 禁用状态
   */
  disabled?: boolean

  /**
   * 加载状态
   */
  loading?: boolean

  /**
   * 变化回调
   */
  onChange?: (checked: boolean) => void

  /**
   * 尺寸
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'

  /**
   * 颜色
   */
  color?: 'primary' | 'success' | 'warning' | 'error'

  /**
   * 是否显示标签
   */
  checkedChildren?: React.ReactNode

  /**
   * 未选中时显示的标签
   */
  unCheckedChildren?: React.ReactNode

  /**
   * 自动聚焦
   */
  autoFocus?: boolean

  /**
   * 表单名称
   */
  name?: string

  /**
   * 表单值
   */
  value?: string | number | readonly string[]
}

// ============================================
// Switch 主组件
// ============================================
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      disabled = false,
      loading = false,
      onChange,
      size = 'medium',
      color = 'primary',
      checkedChildren,
      unCheckedChildren,
      autoFocus,
      name,
      value,
      className,
      ...props
    },
    ref
  ) => {
    // 内部状态（非受控）
    const [internalChecked, setInternalChecked] = useState(defaultChecked)

    // 确定当前是否选中
    const checked = controlledChecked !== undefined ? controlledChecked : internalChecked

    // 处理变化
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (disabled || loading) {
        e.preventDefault()
        return
      }

      const newChecked = e.target.checked

      // 更新内部状态
      if (controlledChecked === undefined) {
        setInternalChecked(newChecked)
      }

      // 触发回调
      onChange?.(newChecked)
    }

    // 尺寸样式
    const sizeStyles: Record<typeof size, string> = {
      small: 'w-8 h-5',
      medium: 'w-11 h-6',
      large: 'w-14 h-7',
    }

    // 圆点尺寸
    const dotSizeStyles: Record<typeof size, string> = {
      small: 'w-3.5 h-3.5',
      medium: 'w-5 h-5',
      large: 'w-6 h-6',
    }

    // 圆点位移
    const dotTranslateStyles: Record<typeof size, string> = {
      small: checked ? 'translate-x-3.5' : 'translate-x-0.5',
      medium: checked ? 'translate-x-5' : 'translate-x-0.5',
      large: checked ? 'translate-x-7' : 'translate-x-0.5',
    }

    // 颜色样式
    const colorStyles: Record<typeof color, string> = {
      primary: checked
        ? 'bg-primary-500 border-primary-500'
        : 'bg-neutral-200 border-neutral-200',
      success: checked
        ? 'bg-success-500 border-success-500'
        : 'bg-neutral-200 border-neutral-200',
      warning: checked
        ? 'bg-warning-500 border-warning-500'
        : 'bg-neutral-200 border-neutral-200',
      error: checked
        ? 'bg-error-500 border-error-500'
        : 'bg-neutral-200 border-neutral-200',
    }

    return (
      <label
        className={cn(
          'inline-flex',
          'items-center',
          'gap-2',
          'cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <span className="relative">
          {/* 隐藏的原生 input */}
          <input
            ref={ref}
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            onChange={handleChange}
            disabled={disabled || loading}
            autoFocus={autoFocus}
            className="sr-only"
            {...props}
          />

          {/* 开关轨道 */}
          <span
            className={cn(
              'block',
              'rounded-full',
              'border',
              'transition-colors',
              'duration-200',
              'ease-in-out',
              sizeStyles[size],
              colorStyles[color],
              loading && 'opacity-70'
            )}
          >
            {/* 圆点 */}
            <span
              className={cn(
                'absolute',
                'top-0.5',
                'block',
                'rounded-full',
                'bg-white',
                'shadow-sm',
                'transition-transform',
                'duration-200',
                'ease-in-out',
                dotSizeStyles[size],
                dotTranslateStyles[size]
              )}
            />
          </span>

          {/* 加载动画 */}
          {loading && (
            <svg
              className={cn(
                'absolute',
                'top-1/2',
                'left-1/2',
                '-translate-x-1/2',
                '-translate-y-1/2',
                'w-3/4',
                'h-3/4',
                'animate-spin',
                'text-white'
              )}
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.411-3.589-8-8-8v4.291z"
              />
            </svg>
          )}
        </span>

        {/* 标签 */}
        {(checkedChildren || unCheckedChildren) && (
          <span className="text-sm text-neutral-700 select-none">
            {checked ? checkedChildren : unCheckedChildren}
          </span>
        )}
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export default Switch
