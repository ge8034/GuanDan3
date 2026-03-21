import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import RippleEffect from '@/components/effects/RippleEffect'
import type { ButtonProps as ButtonPropsType } from './types'

// 使用class-variance-authority定义按钮变体
const buttonVariants = cva(
  // 基础样式
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        // 主要按钮 - 使用设计标记中的主色调
        primary: 'bg-primary-500 text-primary-foreground hover:bg-primary-600 active:bg-primary-700',
        // 次要按钮 - 使用设计标记中的辅助色
        secondary: 'bg-secondary-500 text-secondary-foreground hover:bg-secondary-600 active:bg-secondary-700',
        // 轮廓按钮
        outline: 'border-2 border-primary-500 bg-transparent text-primary-500 hover:bg-primary-50 active:bg-primary-100',
        // 幽灵按钮
        ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 active:bg-primary-100',
        // 危险按钮
        danger: 'bg-error-500 text-error-foreground hover:bg-error-600 active:bg-error-700',
        // 链接样式
        link: 'text-primary-500 underline-offset-4 hover:underline',
      },
      size: {
        // 小尺寸 - 符合触控目标最小44px要求
        sm: 'h-9 px-3 py-2 text-xs min-w-[44px]',
        // 中尺寸 - 默认尺寸
        md: 'h-10 px-4 py-2 text-sm min-w-[44px]',
        // 大尺寸
        lg: 'h-11 px-6 py-3 text-base min-w-[44px]',
        // 图标按钮
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)

export type ButtonProps = ButtonPropsType & VariantProps<typeof buttonVariants> & {
  asChild?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      fullWidth,
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      ripple = true,
      type = 'button',
      asChild = false,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading

    // 构建按钮内容
    const buttonContent = (
      <>
        {isLoading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        )}

        {isLoading ? (
          <span>{children}</span>
        ) : (
          <>
            {leftIcon && (
              <span className="mr-2" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children}
            {rightIcon && (
              <span className="ml-2" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}

        {/* 屏幕阅读器专用文本 */}
        {isLoading && <span className="sr-only">加载中</span>}
      </>
    )

    // 按钮元素
    const buttonElement = (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={isDisabled}
        aria-busy={isLoading}
        aria-disabled={isDisabled}
        {...props}
      >
        {buttonContent}
      </button>
    )

    // 根据是否需要水波纹效果包装
    if (asChild) {
      const child = React.Children.only(children) as React.ReactElement<any>
      return React.cloneElement(child, {
        className: cn(buttonVariants({ variant, size, fullWidth, className }), child.props.className),
        disabled: isDisabled,
        'aria-busy': isLoading,
        'aria-disabled': isDisabled,
        ...props
      })
    }

    return ripple && !isDisabled ? (
      <RippleEffect disabled={isDisabled}>{buttonElement}</RippleEffect>
    ) : (
      buttonElement
    )
  }
)

Button.displayName = 'Button'

export { Button, buttonVariants }