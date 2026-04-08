/**
 * SafeMotion - Reduced Motion 安全的动画组件
 *
 * 基于 Impeccable Design 原则：
 * - 响应 prefers-reduced-motion
 * - 100/300/500 规则 (微交互100-150ms, 状态变化200-300ms)
 * - 仅动画 transform 和 opacity
 * - 使用 ease-out 缓动
 *
 * @example
 * <SafeMotion delay={0.1}>
 *   <div>淡入动画</div>
 * </SafeMotion>
 */

'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type AnimationType = 'fade-in' | 'fade-out' | 'slide-up' | 'slide-down' | 'scale-in'

interface SafeMotionProps {
  children: React.ReactNode
  type?: AnimationType
  delay?: number
  duration?: number
  className?: string
}

// 检测用户是否偏好减少动画
let prefersReducedMotion: boolean | null = null

function checkPrefersReducedMotion() {
  if (prefersReducedMotion !== null) return prefersReducedMotion

  if (typeof window === 'undefined') return false

  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
  prefersReducedMotion = mediaQuery.matches

  // 监听变化
  mediaQuery.addEventListener('change', () => {
    prefersReducedMotion = mediaQuery.matches
  })

  return prefersReducedMotion
}

export function SafeMotion({
  children,
  type = 'fade-in',
  delay = 0,
  duration = 200,
  className,
}: SafeMotionProps) {
  const [shouldAnimate, setShouldAnimate] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
    const reducedMotion = checkPrefersReducedMotion()
    setShouldAnimate(!reducedMotion)
  }, [])

  // 服务端渲染时不显示动画
  if (!hasMounted) {
    return <>{children}</>
  }

  // 用户偏好减少动画时直接渲染
  if (!shouldAnimate) {
    return <>{children}</>
  }

  const animations: Record<AnimationType, string> = {
    'fade-in': 'animate-in fade-in',
    'fade-out': 'animate-out fade-out',
    'slide-up': 'animate-in slide-in-from-bottom',
    'slide-down': 'animate-in slide-in-from-top',
    'scale-in': 'animate-in zoom-in',
  }

  const style = delay > 0 ? { animationDelay: `${delay}ms` } : undefined

  return (
    <div
      className={cn(animations[type], className)}
      style={{
        animationDuration: `${duration}ms`,
        animationTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)', // ease-out
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * 快捷组件 - 常见动画类型
 */
export function FadeIn({ children, delay = 0, className }: Omit<SafeMotionProps, 'type'>) {
  return (
    <SafeMotion type="fade-in" delay={delay} duration={150} className={className}>
      {children}
    </SafeMotion>
  )
}

export function SlideUp({ children, delay = 0, className }: Omit<SafeMotionProps, 'type'>) {
  return (
    <SafeMotion type="slide-up" delay={delay} duration={200} className={className}>
      {children}
    </SafeMotion>
  )
}

export function ScaleIn({ children, delay = 0, className }: Omit<SafeMotionProps, 'type'>) {
  return (
    <SafeMotion type="scale-in" delay={delay} duration={200} className={className}>
      {children}
    </SafeMotion>
  )
}
