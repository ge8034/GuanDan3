/**
 * Input 组件
 *
 * 文本输入组件
 * 基于 Impeccable Design 规范
 * 8种交互状态
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type InputHTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  /**
   * 输入框尺寸
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg'

  /**
   * 变体
   * @default 'default'
   */
  variant?: 'default' | 'filled' | 'outlined'

  /**
   * 是否错误状态
   * @default false
   */
  error?: boolean

  /**
   * 错误信息
   */
  errorMessage?: string

  /**
   * 左侧图标
   */
  leftIcon?: React.ReactNode

  /**
   * 右侧图标
   */
  rightIcon?: React.ReactNode

  /**
   * 是否全宽
   * @default false
   */
  fullWidth?: boolean
}

// ============================================
// 尺寸样式
// ============================================
const sizeClasses = {
  sm: 'px-3 py-2 text-sm',
  md: 'px-4 py-3 text-base',
  lg: 'px-5 py-4 text-lg',
}

const iconSizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
}

// ============================================
// 变体样式
// ============================================
const variantClasses = {
  default: [
    'bg-white',
    'border',
    'border-neutral-300',
    'focus:border-poker-table-500',
    'focus:ring-2',
    'focus:ring-poker-table-500/20',
  ],
  filled: [
    'bg-neutral-100',
    'border-2',
    'border-transparent',
    'focus:bg-white',
    'focus:border-poker-table-500',
  ],
  outlined: [
    'bg-transparent',
    'border-2',
    'border-neutral-400',
    'focus:border-poker-table-500',
  ],
}

/**
 * Input 组件
 *
 * @example
 * ```tsx
 * <Input placeholder="请输入..." />
 *
 * <Input
 *   size="lg"
 *   variant="outlined"
 *   leftIcon={<Search />}
 *   placeholder="搜索..."
 * />
 *
 * <Input
 *   error
 *   errorMessage="用户名不能为空"
 *   placeholder="用户名"
 * />
 * ```
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'default',
      error = false,
      errorMessage,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <div className={cn('relative', fullWidth && 'w-full')}>
        {/* 左侧图标 */}
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none">
            <span className={cn(iconSizeClasses[size])}>{leftIcon}</span>
          </div>
        )}

        {/* 输入框 */}
        <input
          ref={ref}
          disabled={disabled}
          className={cn(
            // 基础样式
            'w-full',
            'rounded-lg',
            'text-neutral-900',
            'placeholder:text-neutral-400',

            // 过渡
            'transition-all',
            'duration-200',
            'ease-[cubic-bezier(0.16,1,0.3,1)]',

            // 焦点环（可访问性）
            'focus:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-poker-table-500',
            'focus-visible:ring-offset-2',

            // 禁用状态
            'disabled:cursor-not-allowed',
            'disabled:bg-neutral-100',
            'disabled:opacity-50',

            // 错误状态
            error && [
              'border-semantic-error',
              'focus:border-semantic-error',
              'focus:ring-semantic-error/20',
            ],

            // 左侧图标时增加左边距
            leftIcon && 'pl-10',

            // 右侧图标时增加右边距
            rightIcon && 'pr-10',

            // 尺寸
            sizeClasses[size],

            // 变体
            ...variantClasses[variant],

            // 自定义类名
            className
          )}
          aria-invalid={error}
          aria-describedby={errorMessage ? 'input-error' : undefined}
          {...props}
        />

        {/* 右侧图标 */}
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <span className={cn(iconSizeClasses[size])}>{rightIcon}</span>
          </div>
        )}

        {/* 错误信息 */}
        {error && errorMessage && (
          <p
            id="input-error"
            className="mt-1.5 text-sm text-semantic-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input
