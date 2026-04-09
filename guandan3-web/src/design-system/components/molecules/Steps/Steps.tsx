/**
 * Steps 组件
 *
 * 步骤条组件
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, Children, isValidElement, cloneElement, ReactElement } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes, type ReactNode } from 'react'

// ============================================
// 类型定义
// ============================================
export interface StepsProps extends Omit<HTMLAttributes<HTMLElement>, 'onChange'> {
  /**
   * 当前步骤（从0开始）
   */
  current: number

  /**
   * 方向
   * @default 'horizontal'
   */
  direction?: 'horizontal' | 'vertical'

  /**
   * 步骤变化回调
   */
  onChange?: (step: number) => void
}

export interface StepProps extends HTMLAttributes<HTMLLIElement> {
  /**
   * 步骤标题
   */
  title: string

  /**
   * 步骤描述
   */
  description?: string

  /**
   * 步骤图标
   */
  icon?: ReactNode

  /**
   * 步骤状态
   */
  status?: 'wait' | 'process' | 'finish' | 'error'

  /**
   * 是否可点击
   * @default true
   */
  clickable?: boolean
}

// ============================================
// Step 内部组件
// ============================================
const StepInner = forwardRef<HTMLLIElement, StepProps & { index?: number; direction?: 'horizontal' | 'vertical'; onStepClick?: (index: number) => void }>(
  ({ title, description, icon, status, index = 0, direction = 'horizontal', onStepClick, clickable = true, className, ...props }, ref) => {
    // 根据 index 和 current 确定状态
    const getStatus = (): 'wait' | 'process' | 'finish' | 'error' => {
      if (status) return status
      const currentStep = (props as { currentStep?: number }).currentStep ?? 0
      if (index < currentStep) return 'finish'
      if (index === currentStep) return 'process'
      return 'wait'
    }

    const stepStatus = getStatus()

    // 渲染步骤图标/数字
    const renderIcon = () => {
      if (icon) {
        return <span className="flex items-center justify-center">{icon}</span>
      }

      if (stepStatus === 'finish') {
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )
      }

      if (stepStatus === 'error') {
        return (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )
      }

      return <span className="text-sm font-medium">{index + 1}</span>
    }

    // 状态样式
    const statusStyles = {
      wait: 'text-neutral-400 bg-neutral-100 border-neutral-300',
      process: 'text-white bg-poker-table-500 border-poker-table-500',
      finish: 'text-success bg-success/20 border-success',
      error: 'text-error bg-error/20 border-error',
    }

    const titleStyles = {
      wait: 'text-neutral-500',
      process: 'text-neutral-900 font-medium',
      finish: 'text-success',
      error: 'text-error',
    }

    const isClickable = clickable && stepStatus !== 'process' && onStepClick

    return (
      <li
        ref={ref}
        className={cn(
          // 布局
          'flex',
          direction === 'horizontal' ? 'flex-row' : 'flex-col',
          'gap-3',
          'relative',
          className
        )}
        {...props}
      >
        {/* 步骤图标 */}
        <div
          className={cn(
            'flex-shrink-0',
            'w-8',
            'h-8',
            'rounded-full',
            'border-2',
            'flex',
            'items-center',
            'justify-center',
            'transition-colors',
            'duration-200',
            statusStyles[stepStatus],
            isClickable && 'cursor-pointer hover:opacity-80'
          )}
          onClick={() => isClickable && onStepClick?.(index)}
        >
          {renderIcon()}
        </div>

        {/* 步骤内容 */}
        <div
          className={cn(
            'flex',
            direction === 'horizontal' ? 'flex-row' : 'flex-col',
            'gap-1',
            'min-w-0'
          )}
        >
          <div className={cn('text-sm', titleStyles[stepStatus])}>
            {title}
          </div>
          {description && (
            <div className="text-xs text-neutral-500">{description}</div>
          )}
        </div>
      </li>
    )
  }
)

StepInner.displayName = 'StepInner'

// ============================================
// 导出的 Step 组件
// ============================================
export const Step = forwardRef<HTMLLIElement, StepProps>((props, ref) => {
  return <StepInner ref={ref} {...props} />
})

Step.displayName = 'Step'

// ============================================
// Steps 主组件
// ============================================
export const Steps = forwardRef<HTMLElement, StepsProps>(
  ({ current, direction = 'horizontal', onChange, children, className, ...props }, ref) => {
    const childArray = Children.toArray(children)

    const enhancedChildren = childArray.map((child, index) => {
      if (isValidElement(child)) {
        return cloneElement(child as ReactElement, {
          key: child.key || `step-${index}`,
          index,
          direction,
          currentStep: current,
          onStepClick: onChange,
        } as any)
      }
      return child
    })

    return (
      <nav
        ref={ref}
        className={cn('flex', direction === 'horizontal' ? 'flex-row' : 'flex-col', 'gap-1', className)}
        aria-label="步骤"
        {...props}
      >
        <ul className={cn('flex', direction === 'horizontal' ? 'flex-row' : 'flex-col', 'gap-2')}>
          {enhancedChildren}
        </ul>
      </nav>
    )
  }
)

Steps.displayName = 'Steps'

export default Steps
