import React, { useMemo } from 'react'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface CloudMountainBackgroundProps {
  children: React.ReactNode
  className?: string
}

export default function CloudMountainBackground({
  children,
  className = '',
}: CloudMountainBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const animationEnabled = useMemo(() => !prefersReducedMotion, [prefersReducedMotion])

  return (
    <div className={`min-h-screen relative overflow-hidden bg-background-primary transition-colors duration-500 ${className}`}>
      {/* 抽象水墨背景层 */}
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
      
      {/* 动态流动光斑 - 仅在非减少动画模式下启用 */}
      {animationEnabled && (
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

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
