/**
 * ContentWidth - 行长限制组件
 *
 * 基于 Impeccable Design 原则：
 * - 正文行长约 65 字符 (measure-wide)
 * - 侧边栏行长约 45 字符 (measure-narrow)
 * - 使用 max-width 而非固定宽度
 * - 响应式设计
 *
 * @example
 * <ContentWidth>
 *   <p>这段文字将被限制在最优行长内...</p>
 * </ContentWidth>
 */

import React from 'react'
import { cn } from '@/lib/utils'

type ContentSize = 'narrow' | 'normal' | 'wide' | 'full'

interface ContentWidthProps {
  children: React.ReactNode
  size?: ContentSize
  className?: string
}

const sizeStyles: Record<ContentSize, string> = {
  narrow: 'max-w-measure-narrow', // 约 45 字符
  normal: 'max-w-measure-wide',   // 约 65 字符
  wide: 'max-w-4xl',              // 更宽内容
  full: 'max-w-none',             // 无限制
}

export function ContentWidth({
  children,
  size = 'normal',
  className,
}: ContentWidthProps) {
  return (
    <div className={cn(
      'mx-auto px-4', // 响应式水平内边距
      sizeStyles[size],
      className
    )}>
      {children}
    </div>
  )
}

/**
 * 快捷组件 - 常见内容宽度
 */
export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ContentWidth size="normal" className={cn('prose', className)}>
      {children}
    </ContentWidth>
  )
}

export function NarrowContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ContentWidth size="narrow" className={className}>
      {children}
    </ContentWidth>
  )
}

export function WideContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <ContentWidth size="wide" className={className}>
      {children}
    </ContentWidth>
  )
}
