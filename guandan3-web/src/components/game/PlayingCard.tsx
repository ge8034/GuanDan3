import React, { useMemo } from 'react'
import RippleEffect from '@/components/effects/RippleEffect'

export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

interface PlayingCardProps {
  suit: CardSuit
  rank: CardRank
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZE_STYLES = {
  sm: 'w-12 h-16 text-xs',
  md: 'w-16 h-24 text-sm',
  lg: 'w-20 h-28 text-base',
}

const SUIT_SYMBOLS = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const SUIT_COLORS = {
  spades: 'text-[#4A4A4A]',
  hearts: 'text-[#CC0000]',
  diamonds: 'text-[#CC0000]',
  clubs: 'text-[#4A4A4A]',
}

const BASE_STYLES = 'relative rounded-xl shadow-md transition-all duration-300 ease-ripple select-none font-[family-name:var(--font-serif)]'

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
      ? 'transform -translate-y-4 ring-4 ring-[#6BA539] ring-opacity-50'
      : disabled
      ? 'opacity-50 cursor-not-allowed'
      : 'hover:transform hover:-translate-y-2 hover:shadow-lg cursor-pointer'

    return `${BASE_STYLES} ${stateStyles} ${SIZE_STYLES[size]} ${className}`
  }, [selected, disabled, size, className])

  const cardContent = faceDown ? (
    <div className={`${combinedClassName} bg-gradient-to-br from-[#6BA539]/80 to-[#4A7A2A]/80 border-2 border-[#4A7A2A]`}>
      <div className="absolute inset-2 border-2 border-[#A8C8A8]/50 rounded-lg opacity-30"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#A8C8A8]/70 rounded-full opacity-50"></div>
      </div>
    </div>
  ) : (
    <div className={`${combinedClassName} bg-[#F5F5DC] border-2 border-[#D3D3D3]`}>
      <div className={`absolute top-1 left-1.5 font-bold ${SUIT_COLORS[suit]}`}>
        {rank}
      </div>
      <div className={`absolute top-4 left-1.5 ${SUIT_COLORS[suit]}`}>
        {SUIT_SYMBOLS[suit]}
      </div>
      <div className={`absolute inset-0 flex items-center justify-center text-2xl ${SUIT_COLORS[suit]}`}>
        {SUIT_SYMBOLS[suit]}
      </div>
      <div className={`absolute bottom-1 right-1.5 font-bold ${SUIT_COLORS[suit]} rotate-180`}>
        {rank}
      </div>
      <div className={`absolute bottom-4 right-1.5 ${SUIT_COLORS[suit]} rotate-180`}>
        {SUIT_SYMBOLS[suit]}
      </div>
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

interface CardBackProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function CardBack({ size = 'md', className = '' }: CardBackProps) {
  return (
    <div
      className={`${SIZE_STYLES[size]} relative rounded-xl shadow-md bg-gradient-to-br from-[#6BA539]/80 to-[#4A7A2A]/80 border-2 border-[#4A7A2A] ${className}`}
    >
      <div className="absolute inset-2 border-2 border-[#A8C8A8]/50 rounded-lg opacity-30"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#A8C8A8]/70 rounded-full opacity-50"></div>
      </div>
    </div>
  )
}
