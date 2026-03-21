'use client'

import React, { useEffect, useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface Cloud {
  id: number
  x: number
  y: number
  size: number
  speed: number
  opacity: number
  delay: number
}

interface LightRay {
  id: number
  x: number
  y: number
  angle: number
  length: number
  opacity: number
  delay: number
}

interface EnhancedEnvironmentBackgroundProps {
  children: React.ReactNode
  className?: string
  showClouds?: boolean
  showLightRays?: boolean
  showParticles?: boolean
}

const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    speed: Math.random() * 0.5 + 0.2,
    opacity: Math.random() * 0.5 + 0.2,
    delay: Math.random() * 5
  }))
}

export default function EnhancedEnvironmentBackground({
  children,
  className = '',
  showClouds = true,
  showLightRays = true,
  showParticles = true
}: EnhancedEnvironmentBackgroundProps) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const animationEnabled = useMemo(() => !prefersReducedMotion, [prefersReducedMotion])
  const [time, setTime] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const particles = useMemo(() => generateParticles(20), [])

  useEffect(() => {
    if (!animationEnabled) return

    let animationFrame: number
    const animate = () => {
      setTime(prev => prev + 0.01)
      animationFrame = requestAnimationFrame(animate)
    }
    animationFrame = requestAnimationFrame(animate)

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame)
      }
    }
  }, [animationEnabled])

  const clouds: Cloud[] = [
    { id: 1, x: 10, y: 15, size: 120, speed: 0.3, opacity: 0.6, delay: 0 },
    { id: 2, x: 60, y: 25, size: 150, speed: 0.2, opacity: 0.5, delay: 2 },
    { id: 3, x: 85, y: 10, size: 100, speed: 0.4, opacity: 0.7, delay: 4 },
    { id: 4, x: 30, y: 80, size: 130, speed: 0.25, opacity: 0.55, delay: 1 },
    { id: 5, x: 75, y: 70, size: 110, speed: 0.35, opacity: 0.65, delay: 3 },
  ]

  const lightRays: LightRay[] = [
    { id: 1, x: 20, y: 0, angle: 45, length: 60, opacity: 0.3, delay: 0 },
    { id: 2, x: 50, y: 0, angle: 30, length: 80, opacity: 0.25, delay: 1.5 },
    { id: 3, x: 80, y: 0, angle: 60, length: 50, opacity: 0.35, delay: 3 },
  ]

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen relative overflow-hidden bg-background-primary transition-colors duration-500 ${className}`}
    >
      {/* 基础背景层 */}
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
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

      {/* 云朵层 */}
      {showClouds && animationEnabled && (
        <AnimatePresence>
          {clouds.map(cloud => (
            <motion.div
              key={cloud.id}
              initial={{ opacity: 0, x: cloud.x - 20 }}
              animate={{ 
                opacity: cloud.opacity,
                x: cloud.x + (time * cloud.speed * 10) % 120 - 20
              }}
              transition={{
                duration: 0,
                ease: 'linear'
              }}
              className="absolute pointer-events-none"
              style={{
                top: `${cloud.y}%`,
                width: `${cloud.size}px`,
                height: `${cloud.size * 0.6}px`,
              }}
            >
              <div 
                className="w-full h-full rounded-full"
                style={{
                  background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.2) 100%)',
                  filter: 'blur(20px)',
                  boxShadow: '0 0 40px rgba(255,255,255,0.3)',
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      {/* 光线层 */}
      {showLightRays && animationEnabled && (
        <AnimatePresence>
          {lightRays.map(ray => (
            <motion.div
              key={ray.id}
              initial={{ opacity: 0, scaleY: 0 }}
              animate={{ 
                opacity: ray.opacity * (0.5 + Math.sin(time + ray.delay) * 0.3),
                scaleY: 1
              }}
              transition={{
                duration: 0,
                ease: 'linear'
              }}
              className="absolute pointer-events-none origin-top"
              style={{
                left: `${ray.x}%`,
                top: `${ray.y}%`,
                width: '2px',
                height: `${ray.length}%`,
                transform: `rotate(${ray.angle}deg)`,
                background: `linear-gradient(180deg, rgba(255,255,255,0.6) 0%, transparent 100%)`,
                filter: 'blur(2px)',
              }}
            />
          ))}
        </AnimatePresence>
      )}

      {/* 粒子层 */}
      {showParticles && animationEnabled && (
        <AnimatePresence>
          {particles.map(particle => (
            <motion.div
              key={particle.id}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ 
                opacity: particle.opacity * (0.5 + Math.sin(time * 2 + particle.delay) * 0.3),
                scale: 1,
                y: particle.y + Math.sin(time * particle.speed + particle.delay) * 5
              }}
              transition={{
                duration: 0,
                ease: 'linear'
              }}
              className="absolute pointer-events-none rounded-full"
              style={{
                left: `${particle.x}%`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                background: 'rgba(255,255,255,0.6)',
                filter: 'blur(1px)',
                boxShadow: '0 0 10px rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </AnimatePresence>
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
      `}</style>
    </div>
  )
}
