import React, { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'
import RippleEffect from '@/components/effects/RippleEffect'
import type { ButtonProps as ButtonPropsType } from './types'

// 使用class-variance-authority定义按钮变体
const buttonVariants = cva(
  // 基础样式 - poker主题
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ring-offset-background transition-all duration-[250ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // 主要按钮 - 深绿渐变
        primary: 'bg-gradient-to-br from-poker-table to-poker-table-dark border border-poker-table-border text-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:from-poker-table-light hover:to-poker-table-hoverDark hover:border-poker-table-hoverBorder hover:text-white hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:-translate-y-px active:from-poker-table-activeLight active:to-poker-table-activeDark active:border-poker-table-border active:text-gray-300 active:translate-y-px active:shadow-[0_2px_6px_rgba(0,0,0,0.4)]',
        // 次要按钮 - 中绿色
        secondary: 'bg-gradient-to-br from-poker-table-light to-poker-table border border-poker-table-border text-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:-translate-y-px hover:text-white active:translate-y-px',
        // 轮廓按钮 - 金色边框
        outline: 'bg-transparent border-2 border-accent-gold text-accent-gold shadow-[0_2px_6px_rgba(0,0,0,0.3)] hover:bg-accent-gold/10 hover:shadow-[0_4px_10px_rgba(212,175,55,0.3)] active:translate-y-px',
        // 幽灵按钮
        ghost: 'bg-transparent text-gray-200 hover:bg-white/10 active:bg-white/20',
        // 危险按钮
        danger: 'bg-gradient-to-br from-[#991b1b] to-[#7f1d1d] border border-[#dc2626] text-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(220,38,38,0.4)] hover:-translate-y-px active:translate-y-px',
        // 链接样式
        link: 'text-accent-gold underline-offset-4 hover:underline',
      },
      size: {
        // 小尺寸 - 13px字体，padding适配
        sm: 'h-8 px-[12px] py-[6px] text-[13px] min-h-[32px]',
        // 中尺寸 - 15px字体，padding适配（默认）
        md: 'h-10 px-[18px] py-[10px] text-[15px] min-h-[40px]',
        // 大尺寸 - 17px字体，padding适配
        lg: 'h-12 px-[24px] py-[14px] text-[17px] min-h-[48px]',
        // 特大尺寸 - 19px字体，主操作按钮
        xl: 'h-14 px-[32px] py-[18px] text-[19px] font-semibold min-h-[56px] bg-gradient-to-br from-poker-table to-poker-table-dark border border-poker-table-border text-gray-200 hover:from-poker-table-light hover:to-poker-table-hoverDark hover:border-poker-table-hoverBorder hover:text-white hover:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:-translate-y-px active:from-poker-table-activeLight active:to-poker-table-activeDark active:border-poker-table-border active:text-gray-300 active:translate-y-px',
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