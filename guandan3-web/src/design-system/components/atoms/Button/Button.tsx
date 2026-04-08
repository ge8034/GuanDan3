/**
 * Button 组件
 *
 * 完整的8种交互状态实现：
 * 1. Default - 默认状态
 * 2. Hover - 悬停状态
 * 3. Focus - 焦点状态（键盘）
 * 4. Active - 激活状态（按下）
 * 5. Disabled - 禁用状态
 * 6. Loading - 加载状态
 * 7. Error - 错误状态
 * 8. Success - 成功状态
 *
 * @example
 * ```tsx
 * <Button variant="primary" size="md">
 *   点击我
 * </Button>
 *
 * <Button variant="primary" loading>
 *   加载中...
 * </Button>
 *
 * <Button variant="secondary" leftIcon={<Icon />}>
 *   带图标
 * </Button>
 * ```
 */

'use client'

import { forwardRef } from 'react'
import { cn } from '@/design-system/utils/cn'
import { buttonVariants, iconSizes, type ButtonVariantsProps } from './Button.styles'
import type { ButtonProps } from './Button.types'
import { Loader2 } from 'lucide-react'

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      disabled = false,
      loading = false,
      error = false,
      success = false,
      fullWidth = false,
      children,
      leftIcon,
      rightIcon,
      loadingText,
      className,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // 判断是否应禁用（loading或disabled）
    const isDisabled = disabled || loading

    // 获取图标尺寸
    const iconSize = iconSizes[size]

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          buttonVariants({
            variant,
            size,
            fullWidth,
            loading,
            error,
            success,
          }),
          className
        )}
        // 8种交互状态处理
        aria-busy={loading}
        aria-disabled={isDisabled}
        aria-invalid={error}
        aria-live="polite"
        {...props}
      >
        {/* 左侧图标 */}
        {leftIcon && !loading && (
          <span className={cn('flex-shrink-0', iconSize)} aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* 加载状态 */}
        {loading && (
          <span className={cn('flex-shrink-0 animate-spin', iconSize)} aria-hidden="true">
            <Loader2 className="h-full w-full" />
          </span>
        )}

        {/* 按钮文本 */}
        <span className="truncate">
          {loading && loadingText ? loadingText : children}
        </span>

        {/* 右侧图标 */}
        {rightIcon && !loading && (
          <span className={cn('flex-shrink-0', iconSize)} aria-hidden="true">
            {rightIcon}
          </span>
        )}
      </button>
    )
  }
)

// 显示名称（用于调试）
Button.displayName = 'Button'

// 默认导出
export default Button

// 导出类型
export type { ButtonProps, ButtonVariantsProps }
