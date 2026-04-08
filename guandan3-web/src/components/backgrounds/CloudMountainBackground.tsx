'use client'

import React, { useMemo } from 'react'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface CloudMountainBackgroundProps {
  children: React.ReactNode
  className?: string
  theme?: 'classic' | 'poker'
}

export default function CloudMountainBackground({
  children,
  className = '',
  theme = 'classic'
}: CloudMountainBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const animationEnabled = useMemo(() => !prefersReducedMotion, [prefersReducedMotion])

  const isPokerTheme = theme === 'poker'

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isPokerTheme ? 'bg-emerald-950' : 'bg-background-primary'
    } ${className}`}>
      {/* 基础背景层 */}
      {isPokerTheme ? (
        // Poker主题：牌桌绿色渐变 - 增强不透明度
        <div
          className="absolute inset-0 opacity-100 pointer-events-none"
          style={{
            background: `
              linear-gradient(145deg, #1a472a 0%, #0d2818 100%)
            `,
          }}
        />
      ) : (
        // Classic主题：原有水墨设计
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            background: `
              radial-gradient(circle at 15% 50%, var(--color-secondary), transparent 25%),
              radial-gradient(circle at 85% 30%, var(--color-primary), transparent 25%)
            `,
            filter: 'blur(100px)',
            transform: 'translateZ(0)',
          }}
        />
      )}

      {/* 动态流动光斑 - 仅Classic主题 */}
      {animationEnabled && !isPokerTheme && (
        <div
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{
            background: `
              conic-gradient(from 0deg at 50% 50%, var(--bg-primary), var(--bg-secondary), var(--bg-primary))
            `,
            filter: 'blur(80px)',
            mixBlendMode: 'overlay',
            animation: 'rotate 20s linear infinite',
          }}
        />
      )}

      {/* Poker主题：牌桌纹理 */}
      {isPokerTheme && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `
              repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)
            `,
          }}
        />
      )}

      {/* Poker主题：金色边框装饰 */}
      {isPokerTheme && (
        <>
          <div
            className="absolute inset-8 pointer-events-none border-4 border-yellow-600/30 rounded-lg"
            style={{
              boxShadow: 'inset 0 0 30px rgba(234, 179, 8, 0.2)',
            }}
          />
          <div
            className="absolute inset-12 pointer-events-none border-2 border-yellow-700/20 rounded-lg"
          />
        </>
      )}

      {/* Poker主题：中心聚光灯效果 */}
      {isPokerTheme && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `
              radial-gradient(ellipse at 50% 40%, rgba(234, 179, 8, 0.15) 0%, transparent 50%)
            `,
            filter: 'blur(40px)',
          }}
        />
      )}

      <div className="relative z-10">
        {children}
      </div>

      {/* CSS 动画定义 */}
      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  )
}
