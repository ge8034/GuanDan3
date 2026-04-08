import React, { useMemo } from 'react'

const GAME_TABLE_SHADOW = '0 25px 50px -12px rgba(107, 165, 57, 0.3), inset 0 0 100px rgba(0, 0, 0, 0.1)'
const DOT_PATTERN = 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)'

const POSITION_STYLES = {
  top: 'absolute top-4 left-1/2 transform -translate-x-1/2',
  left: 'absolute left-4 top-1/2 transform -translate-y-1/2',
  right: 'absolute right-4 top-1/2 transform -translate-y-1/2',
  bottom: 'absolute bottom-4 left-1/2 transform -translate-x-1/2',
} as const

interface GameTableProps {
  children: React.ReactNode
  className?: string
}

export default function GameTable({ children, className = '' }: GameTableProps) {
  return (
    <div
      className={`
        relative w-full max-w-4xl mx-auto
        bg-gradient-to-br from-primary-500/90 to-primary-700/90
        border-4 border-primary-700
        rounded-xl
        shadow-2xl
        overflow-hidden
        font-[family-name:var(--font-serif)]
        ${className}
      `}
      style={{
        boxShadow: GAME_TABLE_SHADOW,
      }}
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: DOT_PATTERN,
          backgroundSize: '32px 32px',
        }}></div>
      </div>

      <div className="relative z-10 p-8">
        {children}
      </div>
    </div>
  )
}

interface TableCenterProps {
  children: React.ReactNode
  className?: string
}

export function TableCenter({ children, className = '' }: TableCenterProps) {
  return (
    <div
      className={`
        relative
        bg-secondary-500/30
        rounded-xl
        border-2 border-primary-500/40
        p-8
        min-h-[200px]
        flex items-center justify-center
        font-[family-name:var(--font-serif)]
        ${className}
      `}
    >
      {children}
    </div>
  )
}

interface PlayerPositionProps {
  position: 'top' | 'left' | 'right' | 'bottom'
  children: React.ReactNode
  isActive?: boolean
  className?: string
}

export function PlayerPosition({
  position,
  children,
  isActive = false,
  className = '',
}: PlayerPositionProps) {
  const combinedClassName = useMemo(() => {
    const activeStyles = isActive
      ? 'ring-4 ring-primary-500 ring-opacity-75 scale-110'
      : ''

    return `
        ${POSITION_STYLES[position]}
        ${activeStyles}
        transition-all duration-300 ease-ripple
        ${className}
      `
  }, [position, isActive, className])

  return (
    <div className={combinedClassName}>
      {children}
    </div>
  )
}

interface PlayedCardsAreaProps {
  children: React.ReactNode
  className?: string
}

export function PlayedCardsArea({ children, className = '' }: PlayedCardsAreaProps) {
  return (
    <div
      className={`
        flex items-center justify-center gap-2
        font-[family-name:var(--font-serif)]
        ${className}
      `}
    >
      {children}
    </div>
  )
}
