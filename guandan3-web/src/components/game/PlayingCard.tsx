import React, { useMemo } from 'react'
import RippleEffect from '@/components/effects/RippleEffect'
import type {
  CardSuit,
  CardRank,
  CardSize,
  PlayingCardProps,
  CardBackProps
} from './PlayingCard.types'

const CARD_SIZES = {
  sm: {
    container: 'w-14 h-20',
    cornerRank: 'text-sm', // 14px
    cornerSuit: 'text-xs', // 12px
    centerSuit: 'text-3xl', // 32px
    borderRadius: 'rounded-md', // 6px
  },
  md: {
    container: 'w-20 h-28',
    cornerRank: 'text-base', // 16px
    cornerSuit: 'text-sm', // 14px
    centerSuit: 'text-5xl', // 48px
    borderRadius: 'rounded-lg', // 8px
  },
  lg: {
    container: 'w-24 h-32',
    cornerRank: 'text-base', // 16px
    cornerSuit: 'text-sm', // 14px
    centerSuit: 'text-5xl', // 48px
    borderRadius: 'rounded-lg', // 8px
  },
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

// 卡牌背景渐变
const CARD_BACKGROUND = 'linear-gradient(145deg, #ffffff, #e5e7eb)'

// 人头牌背景色
const FACE_CARD_BACKGROUNDS = {
  spades: 'linear-gradient(145deg, #e8f3e0, #d4e7c0)', // 绿色调
  clubs: 'linear-gradient(145deg, #e8f3e0, #d4e7c0)', // 绿色调
  hearts: 'linear-gradient(145deg, #fee2e2, #fecaca)', // 红色调
  diamonds: 'linear-gradient(145deg, #fee2e2, #fecaca)', // 红色调
}

const BASE_STYLES = 'relative shadow-md transition-all duration-300 ease-ripple select-none font-serif border border-gray-300'

function FaceCardPattern({ rank, suit }: { rank: CardRank, suit: CardSuit }) {
  if (rank !== 'J' && rank !== 'Q' && rank !== 'K') {
    return null
  }

  const color = SUIT_COLORS[suit]
  const symbol = SUIT_SYMBOLS[suit]
  const background = FACE_CARD_BACKGROUNDS[suit]

  return (
    <div
      className="absolute inset-0 flex items-center justify-center opacity-20"
      style={{ background }}
    >
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

function CardCorner({
  rank,
  suit,
  position,
  size = 'md'
}: {
  rank: CardRank
  suit: CardSuit
  position: 'top' | 'bottom'
  size?: CardSize
}) {
  const rotation = position === 'bottom' ? 'rotate-180' : ''
  const color = SUIT_COLORS[suit]
  const symbol = SUIT_SYMBOLS[suit]
  const sizeConfig = CARD_SIZES[size]

  return (
    <div className={`absolute ${position === 'top' ? 'top-1.5 left-1.5' : 'bottom-1.5 right-1.5'} ${rotation}`}>
      <div className="flex flex-col items-center leading-none">
        <span className={`font-bold ${sizeConfig.cornerRank}`} style={{ color }}>
          {rank}
        </span>
        <span className={sizeConfig.cornerSuit} style={{ color }}>
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
  const sizeConfig = CARD_SIZES[size]

  const cardContent = faceDown ? (
    <div
      className={`${BASE_STYLES} ${sizeConfig.container} ${sizeConfig.borderRadius} ${selected ? 'transform -translate-y-4 ring-4 ring-yellow-400 ring-opacity-60 shadow-xl' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:-translate-y-2 hover:shadow-lg cursor-pointer'} bg-gradient-to-br from-blue-500 to-blue-700 border-blue-800 ${className}`}
      style={{ background: 'linear-gradient(145deg, #3b82f6, #1d4ed8)' }}
    >
      <div className="absolute inset-2 border-2 border-white/30 rounded"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/40 rounded-full"></div>
      </div>
    </div>
  ) : (
    <div
      className={`${BASE_STYLES} ${sizeConfig.container} ${sizeConfig.borderRadius} ${selected ? 'transform -translate-y-4 ring-4 ring-yellow-400 ring-opacity-60 shadow-xl' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:transform hover:-translate-y-2 hover:shadow-lg cursor-pointer'} ${className}`}
      style={{ background: CARD_BACKGROUND }}
    >
      <FaceCardPattern rank={rank} suit={suit} />
      <CardCorner rank={rank} suit={suit} position="top" size={size} />
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={sizeConfig.centerSuit} style={{ color: SUIT_COLORS[suit] }}>
          {SUIT_SYMBOLS[suit]}
        </span>
      </div>
      <CardCorner rank={rank} suit={suit} position="bottom" size={size} />
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
  const sizeConfig = CARD_SIZES[size]

  const gradientStyle = backColor === 'red'
    ? 'linear-gradient(145deg, #ef4444, #b91c1c)'
    : 'linear-gradient(145deg, #3b82f6, #1d4ed8)'

  const borderClass = backColor === 'red' ? 'border-red-800' : 'border-blue-800'

  return (
    <div
      className={`${BASE_STYLES} ${sizeConfig.container} ${sizeConfig.borderRadius} ${borderClass} ${className}`}
      style={{ background: gradientStyle }}
    >
      <div className="absolute inset-2 border-2 border-white/30 rounded"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-white/40 rounded-full"></div>
      </div>
    </div>
  )
}
