'use client'

import React, { useMemo } from 'react'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'
import { GameTheme } from '@/lib/theme/theme-types'

interface SimpleEnvironmentBackgroundProps {
  children: React.ReactNode
  className?: string
  showClouds?: boolean
  showLighting?: boolean
  theme?: GameTheme
}

export default function SimpleEnvironmentBackground({
  children,
  className = '',
  showClouds = true,
  showLighting = true,
  theme = 'classic'
}: SimpleEnvironmentBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const animationEnabled = useMemo(() => !prefersReducedMotion, [prefersReducedMotion])

  // poker主题使用poker样式，其他主题使用classic样式
  const isPokerTheme = theme === 'poker'

  // 调试日志
  if (typeof window !== 'undefined') {
    console.log('[SimpleEnvironmentBackground] theme:', theme, 'isPokerTheme:', isPokerTheme)
  }

  return (
    <div className={`min-h-screen relative overflow-hidden transition-colors duration-500 ${
      isPokerTheme ? 'poker-table-bg poker-table-border' : 'bg-background-primary'
    } ${className}`}>
      {/* 基础背景层 - Poker主题使用增强CSS类 */}
      {isPokerTheme ? (
        // Poker主题：使用增强的CSS类（已在globals.css中定义）
        <div className="absolute inset-0 pointer-events-none" />
      ) : (
        // Classic主题：原有设计
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

      {/* 动态流动光斑 */}
      {animationEnabled && showLighting && !isPokerTheme && (
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

      {/* Poker主题：毛呢纹理（使用CSS变量） */}
      {isPokerTheme && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'var(--felt-texture)',
            opacity: 0.15,
            mixBlendMode: 'overlay',
          }}
        />
      )}

      {/* 云朵层 - Classic主题 */}
      {showClouds && animationEnabled && !isPokerTheme && (
        <>
          <div
            className="absolute pointer-events-none"
            style={{
              top: '15%',
              left: '10%',
              width: '120px',
              height: '72px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)',
              borderRadius: '50%',
              filter: 'blur(20px)',
              boxShadow: '0 0 40px rgba(255,255,255,0.3)',
              animation: 'float1 30s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '25%',
              left: '60%',
              width: '150px',
              height: '90px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.15) 100%)',
              borderRadius: '50%',
              filter: 'blur(25px)',
              boxShadow: '0 0 50px rgba(255,255,255,0.25)',
              animation: 'float2 40s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none"
            style={{
              top: '10%',
              left: '85%',
              width: '100px',
              height: '60px',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.2) 100%)',
              borderRadius: '50%',
              filter: 'blur(15px)',
              boxShadow: '0 0 30px rgba(255,255,255,0.35)',
              animation: 'float3 25s ease-in-out infinite',
            }}
          />
        </>
      )}

      {/* Poker主题：金色边框装饰（增强版） */}
      {isPokerTheme && (
        <>
          {/* 外层金色边框 - 带发光效果 */}
          <div
            className="absolute inset-6 pointer-events-none border-[3px] rounded-2xl gold-border gold-glow"
            style={{
              borderColor: 'rgba(212, 175, 55, 0.4)',
              boxShadow: `
                inset 0 0 20px rgba(212, 175, 55, 0.15),
                0 0 30px rgba(212, 175, 55, 0.2)
              `,
            }}
          />
          {/* 中层装饰线 */}
          <div
            className="absolute inset-10 pointer-events-none border-2 rounded-xl"
            style={{
              borderColor: 'rgba(212, 175, 55, 0.25)',
              boxShadow: 'inset 0 0 15px rgba(212, 175, 55, 0.1)',
            }}
          />
          {/* 内层细线 */}
          <div
            className="absolute inset-14 pointer-events-none border rounded-lg"
            style={{
              borderColor: 'rgba(212, 175, 55, 0.15)',
            }}
          />
        </>
      )}

      {/* 光线效果 - Classic主题 */}
      {animationEnabled && showLighting && !isPokerTheme && (
        <>
          <div
            className="absolute pointer-events-none origin-top"
            style={{
              left: '20%',
              top: '0%',
              width: '2px',
              height: '60%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, transparent 100%)',
              filter: 'blur(3px)',
              transform: 'rotate(45deg)',
              animation: 'lightPulse1 8s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none origin-top"
            style={{
              left: '50%',
              top: '0%',
              width: '2px',
              height: '80%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
              filter: 'blur(2px)',
              transform: 'rotate(30deg)',
              animation: 'lightPulse2 10s ease-in-out infinite',
            }}
          />
          <div
            className="absolute pointer-events-none origin-top"
            style={{
              left: '80%',
              top: '0%',
              width: '2px',
              height: '50%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, transparent 100%)',
              filter: 'blur(2px)',
              transform: 'rotate(60deg)',
              animation: 'lightPulse3 6s ease-in-out infinite',
            }}
          />
        </>
      )}

      {/* Poker主题：中心聚光灯效果（增强版） */}
      {isPokerTheme && (
        <>
          {/* 主聚光灯 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(ellipse at 50% 35%, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.1) 25%, transparent 50%)
              `,
              filter: 'blur(30px)',
            }}
          />
          {/* 次级光晕 - 增加层次感 */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `
                radial-gradient(circle at 30% 60%, rgba(30, 86, 52, 0.3) 0%, transparent 40%),
                radial-gradient(circle at 70% 50%, rgba(30, 86, 52, 0.25) 0%, transparent 35%)
              `,
              filter: 'blur(50px)',
            }}
          />
          {/* 顶部暗角 - 增加深邃感 */}
          <div
            className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(13, 40, 24, 0.6) 0%, transparent 100%)',
            }}
          />
        </>
      )}

      {/* 内容层 */}
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
        
        @keyframes float1 {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(30px);
          }
        }
        
        @keyframes float2 {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(-20px);
          }
        }
        
        @keyframes float3 {
          0%, 100% {
            transform: translateX(0px);
          }
          50% {
            transform: translateX(15px);
          }
        }
        
        @keyframes lightPulse1 {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        @keyframes lightPulse2 {
          0%, 100% {
            opacity: 0.25;
          }
          50% {
            opacity: 0.4;
          }
        }
        
        @keyframes lightPulse3 {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  )
}
