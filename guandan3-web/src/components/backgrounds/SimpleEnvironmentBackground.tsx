'use client'

import React, { useMemo } from 'react'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface SimpleEnvironmentBackgroundProps {
  children: React.ReactNode
  className?: string
  showClouds?: boolean
  showLighting?: boolean
}

export default function SimpleEnvironmentBackground({
  children,
  className = '',
  showClouds = true,
  showLighting = true
}: SimpleEnvironmentBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const animationEnabled = useMemo(() => !prefersReducedMotion, [prefersReducedMotion])

  return (
    <div className={`min-h-screen relative overflow-hidden bg-background-primary transition-colors duration-500 ${className}`}>
      {/* 基础背景层 */}
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

      {/* 动态流动光斑 */}
      {animationEnabled && showLighting && (
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

      {/* 云朵层 */}
      {showClouds && animationEnabled && (
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

      {/* 光线效果 */}
      {animationEnabled && showLighting && (
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
