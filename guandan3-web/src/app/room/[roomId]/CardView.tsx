import type { CSSProperties } from 'react'
import type { Card } from '@/lib/store/game'

type CardViewVariant = 'hand' | 'table'

export type CardViewProps = {
  card: Card
  variant: CardViewVariant
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  style?: CSSProperties
}

const getSuitIcon = (suit: Card['suit']) => {
  switch (suit) {
    case 'H':
      return '♥'
    case 'D':
      return '♦'
    case 'C':
      return '♣'
    case 'S':
      return '♠'
    case 'J':
      return '★'
    default:
      return suit
  }
}

const getCardColor = (card: Card) => {
  if (card.suit === 'H' || card.suit === 'D') return 'text-red-600'
  if (card.suit === 'J' && card.rank === 'hr') return 'text-red-600'
  return 'text-black'
}

const getRankDisplay = (card: Card) => {
  if (card.suit === 'J') return card.rank === 'hr' ? '红' : '黑'
  return card.rank
}

export const CardView = ({ card, variant, selected, disabled, onClick, style }: CardViewProps) => {
  const color = getCardColor(card)
  const rank = getRankDisplay(card)
  const icon = getSuitIcon(card.suit)

  const base =
    variant === 'hand'
      ? `w-24 h-36 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col items-center justify-between p-2 transform hover:-translate-y-8 transition-transform cursor-pointer relative shrink-0 ${
          selected ? '-translate-y-8 ring-4 ring-yellow-400' : ''
        }`
      : 'w-20 h-28 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col items-center justify-between p-1.5 transform hover:-translate-y-2 transition-transform'

  const topBottom = variant === 'hand' ? 'text-lg font-bold' : 'text-sm font-bold leading-none'
  const center = variant === 'hand' ? 'text-5xl' : 'text-3xl'

  return (
    <div
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={base}
      style={style}
    >
      <div className={`${topBottom} w-full text-left ${color}`}>{rank}</div>
      <div className={`${center} ${color}`}>{icon}</div>
      <div className={`${topBottom} w-full text-right ${color}`}>{rank}</div>
    </div>
  )
}
