import React, { useMemo } from 'react'
import RippleEffect from '@/components/effects/RippleEffect'
import type {
  CardSuit,
  CardRank,
  CardSize,
  PlayingCardProps,
  CardBackProps
} from './PlayingCard.types'

const SIZE_STYLES = {
  sm: 'w-14 h-20 text-xs',
  md: 'w-20 h-28 text-sm',
  lg: 'w-24 h-32 text-base',
}

const SUIT_SYMBOLS: Record<CardSuit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const SUIT_COLORS: Record<CardSuit, string> = {
  spades: '#1a1a1a',
  hearts: '#dc2626',
  diamonds: '#dc2626',
  clubs: '#1a1a1a',
}

const BASE_STYLES = 'relative rounded-lg shadow-md transition-all duration-300 ease-ripple select-none font-serif bg-white border border-gray-300'

function FaceCardPattern({ rank, suit }: { rank: CardRank, suit: CardSuit }) {
  if (rank !== 'J' && rank !== 'Q' && rank !== 'K') {
    return null
  }

  const color = SUIT_COLORS[suit]
  const symbol = SUIT_SYMBOLS[suit]

  return (
    <div className="absolute inset-0 flex items-center justify-center opacity-20">
      <div className="text-center">
        <div className="text-4xl font-bold" style={{ color }}>
          {rank}
        </div>
        <div className="text-3xl" style={{ color }}>
          {symbol}
        </div>
      </div>
    </div>
  )
}

function CardCorner({ rank, suit, position }: { rank: CardRank, suit: CardSuit, position: 'top' | 'bottom' }) {
  const rotation = position === 'bottom' ? 'rotate-180' : ''
  const color = SUIT_COLORS[suit]
  const symbol = SUIT_SYMBOLS[suit]

  return (
    <div className={`absolute ${position === 'top' ? 'top-1.5 left-1.5' : 'bottom-1.5 right-1.5'} ${rotation}`}>
      <div className="flex flex-col items-center leading-none">
        <span className="font-bold text-lg" style={{ color }}>
          {rank}
        </span>
        <span className="text-base" style={{ color }}>
          {symbol}
        </span>
      </div>
    </div>
  )
}

export default function PlayingCard({
  suit,
  rank,
  faceDown = false,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
  className = '',
}: PlayingCardProps) {
  const combinedClassName = useMemo(() => {
    const stateStyles = selected
      ? 'transform -translate-y-4 ring-4 ring-yellow-400 ring-opacity-60 shadow-xl'
      : disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:transform hover:-translate-y-2 hover:shadow-lg cursor-pointer'

    return `${BASE_STYLES} ${stateStyles} ${SIZE_STYLES[size]} ${className}`
  }, [selected, disabled, size, className])

  const cardContent = faceDown ? (
    <div className={`${combinedClassName} bg-gradient-to-br from-blue-500 to-blue-700 border-blue-800`}>
      <div className="absolute inset-2 border-2 border-white/30 rounded"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/40 rounded-full"></div>
      </div>
    </div>
  ) : (
    <div className={combinedClassName}>
      <FaceCardPattern rank={rank} suit={suit} />
      <CardCorner rank={rank} suit={suit} position="top" />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-4xl" style={{ color: SUIT_COLORS[suit] }}>
          {SUIT_SYMBOLS[suit]}
        </span>
      </div>
      <CardCorner rank={rank} suit={suit} position="bottom" />
    </div>
  )

  if (onClick && !disabled) {
    return (
      <RippleEffect className="relative inline-block">
        <div onClick={onClick}>
          {cardContent}
        </div>
      </RippleEffect>
    )
  }

  return cardContent
}

export function CardBack({
  size = 'md',
  className = '',
  backColor = 'blue'
}: CardBackProps) {
  const gradientClass = backColor === 'red'
    ? 'from-red-500 to-red-700 border-red-800'
    : 'from-blue-500 to-blue-700 border-blue-800'

  return (
    <div
      className={`${SIZE_STYLES[size]} ${BASE_STYLES} bg-gradient-to-br ${gradientClass} ${className}`}
    >
      <div className="absolute inset-2 border-2 border-white/30 rounded"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/40 rounded-full"></div>
      </div>
    </div>
  )
}
