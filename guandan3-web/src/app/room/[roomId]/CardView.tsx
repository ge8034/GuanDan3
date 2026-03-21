import { memo, useMemo, type CSSProperties } from 'react'
import { motion } from 'framer-motion'
import type { Card } from '@/lib/store/game'
import RippleEffect from '@/components/effects/RippleEffect'

type CardViewVariant = 'hand' | 'table'

export type CardViewProps = {
  card: Card
  variant: CardViewVariant
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  style?: CSSProperties
  index?: number
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

const getCardClassName = (variant: CardViewVariant, selected: boolean) => {
  if (variant === 'hand') {
    return `w-16 sm:w-20 md:w-24 h-24 sm:h-30 md:h-36 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col items-center justify-between p-1.5 sm:p-2 cursor-pointer relative shrink-0 select-none transition-all touch-manipulation active:scale-95 ${
      selected ? 'ring-3 sm:ring-4 ring-yellow-400 z-10 shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'hover:shadow-2xl active:shadow-lg'
    }`
  }
  return 'w-14 sm:w-16 md:w-20 h-20 sm:h-24 md:h-28 bg-white border border-gray-300 rounded-lg shadow-xl flex flex-col items-center justify-between p-1 sm:p-1.5 select-none'
}

const getTopBottomClassName = (variant: CardViewVariant) => {
  return variant === 'hand' ? 'text-sm sm:text-base md:text-lg font-bold' : 'text-xs sm:text-sm md:text-sm font-bold leading-none'
}

const getCenterClassName = (variant: CardViewVariant) => {
  return variant === 'hand' ? 'text-3xl sm:text-4xl md:text-5xl' : 'text-2xl sm:text-2xl md:text-3xl'
}

const CardViewComponent = ({ card, variant, selected, disabled, onClick, style, index = 0 }: CardViewProps) => {
  const color = useMemo(() => getCardColor(card), [card])
  const rank = useMemo(() => getRankDisplay(card), [card])
  const icon = useMemo(() => getSuitIcon(card.suit), [card.suit])

  const base = useMemo(() => getCardClassName(variant, selected || false), [variant, selected])
  const topBottom = useMemo(() => getTopBottomClassName(variant), [variant])
  const center = useMemo(() => getCenterClassName(variant), [variant])

  return (
    <motion.div
      layout
      initial={variant === 'hand' ? { opacity: 0, y: 100, rotate: -5 } : { opacity: 0, scale: 0.5, y: 20 }}
      animate={{ 
        opacity: 1, 
        y: selected ? -30 : 0, 
        scale: 1,
        rotate: 0,
        transition: { 
          type: 'spring', 
          stiffness: 400, 
          damping: 25,
          mass: 0.8,
          delay: index * 0.05 
        } 
      }}
      exit={{ opacity: 0, y: -50, scale: 0.8, transition: { duration: 0.2 } }}
      whileHover={!disabled && variant === 'hand' ? { y: selected ? -40 : -15, scale: 1.05, zIndex: 20 } : {}}
      whileTap={!disabled && variant === 'hand' ? { scale: 0.95 } : {}}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      className={base}
      style={style}
    >
      <RippleEffect className="absolute inset-0 rounded-lg overflow-hidden">
        <div className="w-full h-full">
          <div className={`${topBottom} w-full text-left ${color}`}>{rank}</div>
          <div className={`${center} ${color}`}>{icon}</div>
          <div className={`${topBottom} w-full text-right ${color}`}>{rank}</div>
        </div>
      </RippleEffect>
    </motion.div>
  )
}

export const CardView = memo(CardViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.suit === nextProps.card.suit &&
    prevProps.card.rank === nextProps.card.rank &&
    prevProps.card.val === nextProps.card.val &&
    prevProps.variant === nextProps.variant &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.index === nextProps.index
  )
})
