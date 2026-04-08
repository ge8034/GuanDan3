/**
 * Spacer - 基于 4pt 间距系统的空白组件
 *
 * 基于 Impeccable Design 原则：
 * - 4pt 基数系统 (4, 8, 12, 16, 24, 32, 48, 64px)
 * - gap 优于 margin
 * - 使用 CSS 变量保持一致性
 *
 * @example
 * <Spacer size={4} /> // 16px 垂直间距
 * <Spacer size={6} horizontal /> // 24px 水平间距
 */

import React from 'react'
import { cn } from '@/lib/utils'

type SpacerSize = 1 | 2 | 3 | 4 | 6 | 8 | 12 | 16 | 24

interface SpacerProps {
  size?: SpacerSize
  horizontal?: boolean
  className?: string
}

const sizeToClass: Record<SpacerSize, string> = {
  1: 'h-1 w-1',   // 4px
  2: 'h-2 w-2',   // 8px
  3: 'h-3 w-3',   // 12px
  4: 'h-4 w-4',   // 16px
  6: 'h-6 w-6',   // 24px
  8: 'h-8 w-8',   // 32px
  12: 'h-12 w-12', // 48px
  16: 'h-16 w-16', // 64px
  24: 'h-24 w-24', // 96px
}

export function Spacer({ size = 4, horizontal = false, className }: SpacerProps) {
  const dimensionClass = horizontal
    ? sizeToClass[size].replace('h-', 'w-').replace(' w-1', '')
    : sizeToClass[size].replace(' w-1', '')

  return <div className={cn(dimensionClass, 'flex-shrink-0', className)} aria-hidden="true" />
}

/**
 * 预定义间距组件 - 快捷使用
 */
export const Spacers = {
  xs: () => <Spacer size={1} />,    // 4px
  sm: () => <Spacer size={2} />,    // 8px
  md: () => <Spacer size={3} />,    // 12px
  lg: () => <Spacer size={4} />,    // 16px
  xl: () => <Spacer size={6} />,    // 24px
  '2xl': () => <Spacer size={8} />,  // 32px
  '3xl': () => <Spacer size={12} />, // 48px
}
