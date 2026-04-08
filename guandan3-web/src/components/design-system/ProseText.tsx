/**
 * ProseText - 行高优化的文本组件
 *
 * 基于 Impeccable Design 原则：
 * - 正文标准行高 (16px × 1.6 = 25.6px)
 * - 深色背景行高 (1.7)
 * - 标题行高 (1.25)
 */

import React from 'react'
import { cn } from '@/lib/utils'

interface ProseTextProps {
  children: React.ReactNode
  variant?: 'normal' | 'relaxed' | 'tight'
  className?: string
  as?: 'p' | 'span' | 'div' | 'article'
}

export function ProseText({
  children,
  variant = 'normal',
  className,
  as: Component = 'p',
}: ProseTextProps) {
  const variantStyles = {
    normal: 'leading-impeccable',      /* 1.6 - 正文标准 */
    relaxed: 'leading-impeccable-relaxed', /* 1.7 - 深色背景 */
    tight: 'leading-tight',            /* 1.25 - 标题 */
  }

  return (
    <Component className={cn(variantStyles[variant], className)}>
      {children}
    </Component>
  )
}

/**
 * 快捷组件 - 常见文本样式
 */
export function Paragraph({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ProseText as="p" className={cn('text-base text-text-primary', className)}>{children}</ProseText>
}

export function Lead({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ProseText as="p" variant="relaxed" className={cn('text-lg text-text-secondary', className)}>{children}</ProseText>
}

export function Caption({ children, className }: { children: React.ReactNode; className?: string }) {
  return <ProseText as="p" variant="tight" className={cn('text-xs text-text-secondary', className)}>{children}</ProseText>
}
