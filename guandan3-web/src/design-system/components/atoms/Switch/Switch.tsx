/**
 * Switch 组件
 *
 * 开关切换组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useId } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface SwitchProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'onChange'> {
  /**
   * 是否选中
   */
  checked?: boolean

  /**
   * 默认是否选中（非受控）
   */
  defaultChecked?: boolean

  /**
   * 变化回调
   */
  onChange?: (checked: boolean) => void

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean

  /**
   * 尺寸
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 颜色变体
   * @default 'default'
   */
  variant?: 'default' | 'success' | 'warning' | 'error'

  /**
   * 标签文本
   */
  label?: string

  /**
   * 描述文本
   */
  description?: string

  /**
   * 名称（表单）
   */
  name?: string

  /**
   * 值（表单）
   */
  value?: string
}

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  sm: {
    track: 'w-9 h-5',
    thumb: 'w-3.5 h-3.5 data-[checked=true]:translate-x-4',
  },
  md: {
    track: 'w-11 h-6',
    thumb: 'w-4 h-4 data-[checked=true]:translate-x-5',
  },
  lg: {
    track: 'w-14 h-7',
    thumb: 'w-5 h-5 data-[checked=true]:translate-x-7',
  },
}

// ============================================
// 颜色变体
// ============================================
const variantClasses = {
  default: {
    checked: 'bg-poker-table-500',
    unchecked: 'bg-neutral-300',
  },
  success: {
    checked: 'bg-success',
    unchecked: 'bg-neutral-300',
  },
  warning: {
    checked: 'bg-warning',
    unchecked: 'bg-neutral-300',
  },
  error: {
    checked: 'bg-error',
    unchecked: 'bg-neutral-300',
  },
}

/**
 * Switch 组件
 *
 * @example
 * ```tsx
 * <Switch />
 *
 * <Switch checked={isEnabled} onChange={setIsEnabled} />
 *
 * <Switch label="启用通知" description="接收推送通知" />
 *
 * <Switch variant="success" size="lg" />
 * ```
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      onChange,
      disabled = false,
      size = 'md',
      variant = 'default',
      label,
      description,
      name,
      value,
      className,
      ...props
    },
    ref
  ) => {
    // 内部状态（非受控模式）
    const [internalChecked, setInternalChecked] = useState(defaultChecked)
    const isControlled = controlledChecked !== undefined
    const checked = isControlled ? controlledChecked : internalChecked

    const id = useId()
    const switchId = props.id || `switch-${id}`

    const handleChange = () => {
      if (disabled) return

      const newChecked = !checked

      if (!isControlled) {
        setInternalChecked(newChecked)
      }

      onChange?.(newChecked)
    }

    const { track, thumb } = sizeClasses[size]
    const { checked: checkedClass, unchecked: uncheckedClass } = variantClasses[variant]

    return (
      <label
        className={cn(
          'inline-flex',
          'items-start',
          'gap-3',
          'cursor-pointer',
          disabled && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        {/* 隐藏的 input 用于表单提交 */}
        {name && (
          <input
            type="checkbox"
            name={name}
            value={value}
            checked={checked}
            readOnly
            className="hidden"
          />
        )}

        {/* 开关按钮 */}
        <button
          ref={ref}
          type="button"
          id={switchId}
          role="switch"
          aria-checked={checked}
          aria-disabled={disabled}
          disabled={disabled}
          onClick={handleChange}
          className={cn(
            // 基础样式
            'relative',
            'inline-flex',
            'flex-shrink-0',
            'rounded-full',
            'border-2',
            'border-transparent',
            // 颜色
            checked ? checkedClass : uncheckedClass,
            // 过渡动画
            'transition-colors',
            'duration-200',
            'ease-out',
            // 焦点样式
            'focus:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-poker-table-500',
            'focus-visible:ring-offset-2',
            // 尺寸
            track
          )}
          {...props}
        >
          {/* 滑块 */}
          <span
            className={cn(
              // 基础样式
              'pointer-events-none',
              'inline-block',
              'rounded-full',
              'bg-white',
              'shadow-lg',
              // 过渡动画
              'transition-transform',
              'duration-200',
              'ease-out',
              // 尺寸
              thumb
            )}
            data-checked={checked}
          />
        </button>

        {/* 标签和描述 */}
        {(label || description) && (
          <div className="flex flex-col gap-1">
            {label && (
              <span
                className={cn(
                  'text-sm',
                  'font-medium',
                  'text-neutral-900',
                  disabled && 'text-neutral-400'
                )}
              >
                {label}
              </span>
            )}
            {description && (
              <span
                className={cn(
                  'text-xs',
                  'text-neutral-600',
                  disabled && 'text-neutral-400'
                )}
              >
                {description}
              </span>
            )}
          </div>
        )}
      </label>
    )
  }
)

Switch.displayName = 'Switch'

export default Switch
