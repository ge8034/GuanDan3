/**
 * Progress 进度条组件
 *
 * 显示任务完成进度
 * 基于 Impeccable Design 规范
 */

'use client'

import { forwardRef, useState, useEffect } from 'react'
import { cn } from '@/design-system/utils/cn'
import { type HTMLAttributes } from 'react'

// ============================================
// 类型定义
// ============================================
export interface ProgressProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * 进度百分比（0-100）
   */
  percent: number

  /**
   * 进度条类型
   * @default 'line'
   */
  type?: 'line' | 'circle' | 'dashboard'

  /**
   * 进度条尺寸（圆形/仪表盘类型）
   * @default 120
   */
  size?: number

  /**
   * 进度条粗细
   * @default 8
   */
  strokeWidth?: number

  /**
   * 是否显示百分比文字
   * @default true
   */
  showInfo?: boolean

  /**
   * 自定义状态文字
   */
  format?: (percent: number) => string

  /**
   * 状态
   */
  status?: 'normal' | 'exception' | 'active' | 'success'

  /**
   * 颜色（line 类型支持渐变）
   */
  strokeColor?: string | { from: string; to: string }

  /**
   * 背景颜色
   */
  trailColor?: string

  /**
   * 是否为仪表盘类型（缺口角度）
   */
  gapDegree?: number

  /**
   * 仪表盘缺口位置
   * @default 'bottom'
   */
  gapPosition?: 'top' | 'bottom' | 'left' | 'right'

  /**
   * 动画持续时间（毫秒）
   */
  animationDuration?: number
}

// ============================================
// 辅助函数
// ============================================
/**
 * 计算圆形进度条的路径描述
 */
function calculateCirclePath(
  percent: number,
  radius: number,
  gapDegree = 0
): string {
  const circumference = 2 * Math.PI * radius
  const gapLength = (gapDegree / 360) * circumference
  const visibleLength = circumference - gapLength
  const dashLength = (percent / 100) * visibleLength

  return `${dashLength} ${circumference}`
}

/**
 * 计算圆形进度条的旋转角度
 */
function calculateCircleRotation(
  gapPosition: string,
  gapDegree: number
): number {
  const rotations: Record<string, number> = {
    top: -90,
    bottom: 90,
    left: 180,
    right: 0,
  }
  return rotations[gapPosition] || -90
}

// ============================================
// Progress 主组件
// ============================================
export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      percent = 0,
      type = 'line',
      size = 120,
      strokeWidth = 8,
      showInfo = true,
      format,
      status,
      strokeColor,
      trailColor = 'rgba(0, 0, 0, 0.06)',
      gapDegree = 0,
      gapPosition = 'bottom',
      animationDuration = 300,
      className,
      ...props
    },
    ref
  ) => {
    // 动画进度
    const [animatedPercent, setAnimatedPercent] = useState(0)

    useEffect(() => {
      setAnimatedPercent(0)
      const timer = setTimeout(() => {
        setAnimatedPercent(Math.min(100, Math.max(0, percent)))
      }, 50)
      return () => clearTimeout(timer)
    }, [percent])

    // 限制 percent 在 0-100 之间
    const safePercent = Math.min(100, Math.max(0, animatedPercent))

    // 确定状态
    const finalStatus = status || (safePercent >= 100 ? 'success' : 'normal')

    // 格式化显示文字
    const infoText = format ? format(safePercent) : `${safePercent}%`

    // 状态颜色
    const statusColors: Record<string, string> = {
      normal: 'stroke-color: var(--color-primary-500)',
      exception: 'stroke-color: var(--color-error-500)',
      active: 'stroke-color: var(--color-primary-500)',
      success: 'stroke-color: var(--color-success-500)',
    }

    // ============================================
    // Line 类型进度条
    // ============================================
    if (type === 'line') {
      const gradientStyle =
        typeof strokeColor === 'object' && strokeColor.from && strokeColor.to
          ? { backgroundImage: `linear-gradient(to right, ${strokeColor.from}, ${strokeColor.to})` }
          : {}

      const barStyle =
        typeof strokeColor === 'string'
          ? { backgroundColor: strokeColor }
          : gradientStyle

      return (
        <div
          ref={ref}
          className={cn(
            'w-full',
            'flex',
            'items-center',
            'gap-3',
            className
          )}
          {...props}
        >
          {/* 进度条轨道 */}
          <div className="flex-1 relative">
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: trailColor }}
            >
              {/* 进度条 */}
              <div
                className={cn(
                  'h-full',
                  'rounded-full',
                  'transition-all',
                  'duration-300',
                  'ease-out',
                  finalStatus === 'exception' && 'bg-error-500',
                  finalStatus === 'success' && 'bg-success-500',
                  !strokeColor && finalStatus === 'normal' && 'bg-primary-500',
                  !strokeColor && finalStatus === 'active' && 'bg-primary-500'
                )}
                style={{
                  width: `${safePercent}%`,
                  transitionDuration: `${animationDuration}ms`,
                  ...barStyle,
                }}
              />
            </div>
          </div>

          {/* 进度信息 */}
          {showInfo && (
            <div
              className={cn(
                'text-sm',
                'font-medium',
                'min-w-[3rem]',
                'text-right',
                finalStatus === 'exception' && 'text-error-500',
                finalStatus === 'success' && 'text-success-500'
              )}
            >
              {infoText}
            </div>
          )}
        </div>
      )
    }

    // ============================================
    // Circle 类型进度条
    // ============================================
    if (type === 'circle' || type === 'dashboard') {
      const radius = (size - strokeWidth) / 2
      const center = size / 2
      const gap = type === 'dashboard' ? gapDegree : 0
      const rotation = calculateCircleRotation(gapPosition, gap)

      const gradientId = `progress-gradient-${Math.random().toString(36).substr(2, 9)}`
      const isGradient = typeof strokeColor === 'object' && strokeColor.from && strokeColor.to

      return (
        <div
          ref={ref}
          className={cn('inline-flex', 'flex-col', 'items-center', 'gap-2', className)}
          {...props}
        >
          <div className="relative" style={{ width: size, height: size }}>
            <svg width={size} height={size}>
              <defs>
                {isGradient && (
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={strokeColor.from} />
                    <stop offset="100%" stopColor={strokeColor.to} />
                  </linearGradient>
                )}
              </defs>

              {/* 背景圆环 */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={trailColor}
                strokeWidth={strokeWidth}
                strokeDasharray={calculateCirclePath(100, radius, gap)}
                strokeLinecap="round"
                transform={`rotate(${rotation} ${center} ${center})`}
              />

              {/* 进度圆环 */}
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={isGradient ? `url(#${gradientId})` : (typeof strokeColor === 'string' ? strokeColor : 'currentColor')}
                strokeWidth={strokeWidth}
                strokeDasharray={calculateCirclePath(safePercent, radius, gap)}
                strokeLinecap="round"
                transform={`rotate(${rotation} ${center} ${center})`}
                className={cn(
                  'transition-all',
                  'duration-300',
                  'ease-out',
                  finalStatus === 'exception' && 'text-error-500',
                  finalStatus === 'success' && 'text-success-500',
                  !strokeColor && (finalStatus === 'normal' || finalStatus === 'active') && 'text-primary-500'
                )}
                style={{
                  transitionDuration: `${animationDuration}ms`,
                }}
              />
            </svg>

            {/* 中心文字 */}
            {showInfo && (
              <div
                className={cn(
                  'absolute',
                  'inset-0',
                  'flex',
                  'items-center',
                  'justify-center',
                  'text-lg',
                  'font-semibold',
                  finalStatus === 'exception' && 'text-error-500',
                  finalStatus === 'success' && 'text-success-500'
                )}
              >
                {infoText}
              </div>
            )}
          </div>
        </div>
      )
    }

    return null
  }
)

Progress.displayName = 'Progress'

export default Progress
