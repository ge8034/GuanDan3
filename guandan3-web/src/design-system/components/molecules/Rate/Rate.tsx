/**
 * Rate 评分组件
 *
 * 星级评分
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface RateProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange'> {
  /**
   * 当前评分值
   */
  value?: number

  /**
   * 默认评分值
   * @default 0
   */
  defaultValue?: number

  /**
   * 最大评分值
   * @default 5
   */
  max?: number

  /**
   * 是否允许半星
   */
  allowHalf?: boolean

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 是否允许清除
   */
  allowClear?: boolean

  /**
   * 只读模式
   */
  readonly?: boolean

  /**
   * 字符图标
   */
  character?: ReactNode

  /**
   * 评分颜色
   */
  color?: 'primary' | 'success' | 'warning' | 'error' | 'gold'

  /**
   * 变化回调
   */
  onChange?: (value: number) => void

  /**
   * 悬停变化回调
   */
  onHoverChange?: (value: number) => void
}

// ============================================
// 辅助组件
// ============================================
interface StarProps {
  index: number
  filled: boolean
  half: boolean
  color: string
  disabled: boolean
  readonly: boolean
  character?: ReactNode
  onHover?: (value: number) => void
  onClick?: (value: number) => void
}

const Star = forwardRef<HTMLSpanElement, StarProps>(
  ({ index, filled, half, color, disabled, readonly, character, onHover, onClick }, ref) => {
    // 颜色样式
  const colorStyles: Record<string, string> = {
    primary: 'text-primary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    error: 'text-error-500',
    gold: 'text-yellow-400',
  }

  const defaultStar = (
    <svg
      className="w-full h-full"
      fill="currentColor"
      viewBox="0 0 24 24"
    >
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-3.01L12 2z" />
    </svg>
  )

  return (
    <span
      ref={ref}
      className={cn(
        'relative',
        'inline-block',
        'w-6 h-6',
        'cursor-pointer',
        'transition-transform',
        'duration-150',
        disabled && 'cursor-not-allowed opacity-50',
        readonly && 'cursor-default',
        !disabled && !readonly && 'hover:scale-110'
      )}
      onMouseEnter={() => !disabled && !readonly && onHover?.(index + 1)}
      onClick={() => !disabled && !readonly && onClick?.(index + 1)}
    >
      {/* 背景星（空心） */}
      <span className="absolute inset-0 text-neutral-300">{character || defaultStar}</span>

      {/* 前景星（填充） */}
      {filled && (
        <span
          className={cn(
            'absolute inset-0',
            'overflow-hidden',
            colorStyles[color]
          )}
          style={{ clipPath: half ? 'inset(0 50% 0 0)' : undefined }}
        >
          {character || defaultStar}
        </span>
      )}
    </span>
  )
})

Star.displayName = 'Star'

// ============================================
// Rate 主组件
// ============================================
export const Rate = forwardRef<HTMLDivElement, RateProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      max = 5,
      allowHalf = false,
      disabled = false,
      allowClear = false,
      readonly = false,
      character,
      color = 'gold',
      onChange,
      onHoverChange,
      className,
      ...props
    },
    ref
  ) => {
    // 内部状态
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [hoverValue, setHoverValue] = useState(0)

    // 确定当前值
    const currentValue = controlledValue !== undefined ? controlledValue : internalValue

    // 确定显示值（悬停值优先）
    const displayValue = hoverValue || currentValue

    // 计算每颗星的状态
    const getStarState = (index: number): { filled: boolean; half: boolean } => {
      const starValue = index + 1
      const value = allowHalf ? displayValue * 2 : displayValue

      if (allowHalf) {
        if (starValue <= Math.floor(value)) {
          return { filled: true, half: false }
        } else if (starValue === Math.ceil(value) && !Number.isInteger(value)) {
          return { filled: true, half: true }
        } else {
          return { filled: false, half: false }
        }
      } else {
        return { filled: starValue <= value, half: false }
      }
    }

    // 处理点击
    const handleClick = (value: number) => {
      // 允许清除且点击的是当前值
      if (allowClear && currentValue === value) {
        const newValue = 0
        if (controlledValue === undefined) {
          setInternalValue(newValue)
        }
        onChange?.(newValue)
        return
      }

      if (controlledValue === undefined) {
        setInternalValue(value)
      }
      onChange?.(value)
    }

    // 处理悬停
    const handleHover = (value: number) => {
      setHoverValue(value)
      onHoverChange?.(value)
    }

    // 处理鼠标离开
    const handleMouseLeave = () => {
      setHoverValue(0)
      onHoverChange?.(0)
    }

    return (
      <div
        ref={ref}
        className={cn('inline-flex gap-1', className)}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        {Array.from({ length: max }).map((_, index) => {
          const { filled, half } = getStarState(index)

          return (
            <Star
              key={index}
              index={index}
              filled={filled}
              half={half}
              color={color}
              disabled={disabled}
              readonly={readonly}
              character={character}
              onHover={handleHover}
              onClick={handleClick}
            />
          )
        })}
      </div>
    )
  }
)

Rate.displayName = 'Rate'

export default Rate
