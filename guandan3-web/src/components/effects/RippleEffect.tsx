'use client'

import React, { useState, useRef, useEffect } from 'react'
import { colors } from '@/lib/design-tokens'

interface RippleProps {
  x: number
  y: number
  size: number
  onComplete: () => void
}

const Ripple: React.FC<RippleProps> = ({ x, y, size, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 300)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <span
      style={{
        position: 'absolute',
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: `rgba(107, 165, 57, 0.3)`,
        transform: 'scale(0)',
        animation: 'ripple 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards',
        pointerEvents: 'none',
      }}
    />
  )
}

interface RippleEffectProps {
  children: React.ReactElement
  className?: string
  disabled?: boolean
}

export default function RippleEffect({ children, className = '', disabled = false }: RippleEffectProps) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number; size: number }>>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const rippleIdRef = useRef(0)

  const addRipple = (event: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !containerRef.current) return

    const container = containerRef.current
    const rect = container.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const size = Math.max(rect.width, rect.height) * 2

    const id = rippleIdRef.current++
    setRipples(prev => [...prev, { id, x, y, size }])
  }

  const removeRipple = (id: number) => {
    setRipples(prev => prev.filter(ripple => ripple.id !== id))
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      onMouseDown={addRipple}
    >
      {children}
      {ripples.map(ripple => (
        <Ripple
          key={ripple.id}
          x={ripple.x}
          y={ripple.y}
          size={ripple.size}
          onComplete={() => removeRipple(ripple.id)}
        />
      ))}
      <style jsx global>{`
        @keyframes ripple {
          to {
            transform: scale(1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
