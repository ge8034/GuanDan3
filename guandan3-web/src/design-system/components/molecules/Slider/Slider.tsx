/**
 * Slider 滑块组件
 *
 * 数值选择滑块
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useRef, useEffect, useCallback } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface SliderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'value'> {
  /**
   * 当前值
   */
  value?: number

  /**
   * 默认值
   * @default 0
   */
  defaultValue?: number

  /**
   * 最小值
   * @default 0
   */
  min?: number

  /**
   * 最大值
   * @default 100
   */
  max?: number

  /**
   * 步长
   * @default 1
   */
  step?: number

  /**
   * 是否禁用
   */
  disabled?: boolean

  /**
   * 是否显示数值
   */
  showValue?: boolean

  /**
   * 数值格式化
   */
  formatValue?: (value: number) => string

  /**
   * 变化回调
   */
  onChange?: (value: number) => void

  /**
   * 拖拽结束回调
   */
  onChangeComplete?: (value: number) => void

  /**
   * 滑块颜色
   */
  color?: 'primary' | 'success' | 'warning' | 'error'
}

// ============================================
// 颜色样式
// ============================================
const colorStyles: Record<string, { bg: string; track: string; border: string }> = {
  primary: { bg: 'bg-primary-500', track: 'bg-primary-200', border: 'border-primary-500' },
  success: { bg: 'bg-success-500', track: 'bg-success-200', border: 'border-success-500' },
  warning: { bg: 'bg-warning-500', track: 'bg-warning-200', border: 'border-warning-500' },
  error: { bg: 'bg-error-500', track: 'bg-error-200', border: 'border-error-500' },
}

// ============================================
// Slider 主组件
// ============================================
export const Slider = forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      value: controlledValue,
      defaultValue = 0,
      min = 0,
      max = 100,
      step = 1,
      disabled = false,
      showValue = false,
      formatValue,
      onChange,
      onChangeComplete,
      color = 'primary',
      className,
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = useState(defaultValue)
    const [isDragging, setIsDragging] = useState(false)

    // 确定当前值
    const currentValue = controlledValue !== undefined ? controlledValue : internalValue

    // 确保值在范围内
    const clampedValue = Math.max(min, Math.min(max, currentValue))

    const trackRef = useRef<HTMLDivElement>(null)
    const thumbRef = useRef<HTMLDivElement>(null)

    // 计算滑块位置百分比
    // 处理 min === max 的边界情况
    const percentage = max === min ? 0 : ((clampedValue - min) / (max - min)) * 100

    // 从像素位置计算值
    const calculateValueFromPosition = useCallback(
      (clientX: number) => {
        if (!trackRef.current) return clampedValue

        const rect = trackRef.current.getBoundingClientRect()
        const position = clientX - rect.left
        const percentage = Math.max(0, Math.min(1, position / rect.width))
        const rawValue = min + percentage * (max - min)

        // 根据步长调整值
        const steppedValue = Math.round(rawValue / step) * step
        return Math.max(min, Math.min(max, steppedValue))
      },
      [min, max, step, clampedValue]
    )

    // 处理鼠标/触摸事件
    const handleStart = (clientX: number) => {
      if (disabled) return

      setIsDragging(true)
      const newValue = calculateValueFromPosition(clientX)

      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const handleMove = (clientX: number) => {
      if (!isDragging || disabled) return

      const newValue = calculateValueFromPosition(clientX)

      if (controlledValue === undefined) {
        setInternalValue(newValue)
      }
      onChange?.(newValue)
    }

    const handleEnd = () => {
      if (isDragging) {
        setIsDragging(false)
        onChangeComplete?.(clampedValue)
      }
    }

    // 鼠标事件
    const handleMouseDown = (e: React.MouseEvent) => {
      e.preventDefault()
      handleStart(e.clientX)
    }

    // 触摸事件
    const handleTouchStart = (e: React.TouchEvent) => {
      e.preventDefault()
      handleStart(e.touches[0].clientX)
    }

    // 全局事件监听
    useEffect(() => {
      if (!isDragging) return

      const handleMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX)
      }

      const handleTouchMove = (e: TouchEvent) => {
        handleMove(e.touches[0].clientX)
      }

      const handleMouseUp = () => {
        handleEnd()
      }

      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('mouseup', handleMouseUp)
      document.addEventListener('touchend', handleMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.removeEventListener('touchend', handleMouseUp)
      }
    }, [isDragging, handleMove, handleEnd])

    // 格式化显示值
    const displayValue = formatValue ? formatValue(clampedValue) : clampedValue.toString()

    return (
      <div
        ref={ref}
        className={cn('flex items-center gap-3', className)}
        {...props}
      >
        {/* 滑块轨道 */}
        <div
          ref={trackRef}
          className={cn(
            'relative',
            'flex-1',
            'h-2',
            'rounded-full',
            'cursor-pointer',
            disabled && 'cursor-not-allowed opacity-50',
            colorStyles[color].track
          )}
          onMouseDown={disabled ? undefined : handleMouseDown}
          onTouchStart={disabled ? undefined : handleTouchStart}
          role="slider"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={clampedValue}
          aria-disabled={disabled}
        >
          {/* 已填充部分 */}
          <div
            className={cn(
              'absolute',
              'left-0',
              'top-0',
              'bottom-0',
              'rounded-full',
              colorStyles[color].bg,
              'transition-colors',
              'duration-150'
            )}
            style={{ width: `${percentage}%` }}
          />

          {/* 滑块按钮 */}
          <div
            ref={thumbRef}
            className={cn(
              'absolute',
              'top-1/2',
              '-translate-y-1/2',
              'w-5',
              'h-5',
              'rounded-full',
              'bg-white',
              'shadow-sm',
              'border-2',
              colorStyles[color].border,
              'cursor-grab',
              'transition-transform',
              'duration-150',
              !disabled && 'hover:scale-110',
              isDragging && 'cursor-grabbing scale-110'
            )}
            style={{ left: `calc(${percentage}% - 10px)` }}
            onMouseDown={disabled ? undefined : (e) => {
              e.stopPropagation()
              handleMouseDown(e)
            }}
          />
        </div>

        {/* 数值显示 */}
        {showValue && (
          <div className="text-sm font-medium tabular-nums min-w-[3ch] text-right">
            {displayValue}
          </div>
        )}
      </div>
    )
  }
)

Slider.displayName = 'Slider'

export default Slider
