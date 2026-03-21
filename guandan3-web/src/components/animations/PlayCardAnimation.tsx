'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo } from 'react'
import { Card } from '@/lib/store/game'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface PlayCardAnimationProps {
  visible: boolean
  cards: Card[]
  fromSeat: number
  toSeat: number
  mySeat: number
  onComplete?: () => void
  duration?: number
}

const getStartPosition = (seat: number, mySeat: number) => {
  const relativeSeat = (seat - mySeat + 4) % 4
  
  switch (relativeSeat) {
    case 0:
      return { x: '50%', y: '90%' }
    case 1:
      return { x: '90%', y: '50%' }
    case 2:
      return { x: '50%', y: '10%' }
    case 3:
      return { x: '10%', y: '50%' }
    default:
      return { x: '50%', y: '50%' }
  }
}

const getEndPosition = (seat: number, mySeat: number) => {
  const relativeSeat = (seat - mySeat + 4) % 4
  
  switch (relativeSeat) {
    case 0:
      return { x: '50%', y: '70%' }
    case 1:
      return { x: '70%', y: '50%' }
    case 2:
      return { x: '50%', y: '30%' }
    case 3:
      return { x: '30%', y: '50%' }
    default:
      return { x: '50%', y: '50%' }
  }
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

export default function PlayCardAnimation({
  visible,
  cards,
  fromSeat,
  toSeat,
  mySeat,
  onComplete,
  duration = 0.6
}: PlayCardAnimationProps) {
  const [completed, setCompleted] = useState(false)
  const [cardRotations, setCardRotations] = useState<number[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()

  const startPos = useMemo(() => getStartPosition(fromSeat, mySeat), [fromSeat, mySeat])
  const endPos = useMemo(() => getEndPosition(toSeat, mySeat), [toSeat, mySeat])

  const shouldReset = useMemo(() => !visible, [visible])

  useEffect(() => {
    if (shouldReset) {
      const timer = setTimeout(() => {
        setCompleted(false)
        setCardRotations([])
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [shouldReset])

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setCardRotations(cards.map(() => (Math.random() - 0.5) * 20))
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [visible, cards])

  const handleAnimationComplete = () => {
    if (!completed) {
      setCompleted(true)
      onComplete?.()
    }
  }

  return (
    <AnimatePresence>
      {visible && !completed && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {cards.map((card, index) => (
            <motion.div
              key={`play-${card.id}-${index}`}
              initial={{
                left: startPos.x,
                top: startPos.y,
                x: '-50%',
                y: '-50%',
                rotate: cardRotations[index],
                scale: 0.8,
                opacity: 0
              }}
              animate={{
                left: endPos.x,
                top: endPos.y,
                x: '-50%',
                y: '-50%',
                rotate: (index - (cards.length - 1) / 2) * 8,
                scale: 1,
                opacity: 1
              }}
              transition={{
                duration: prefersReducedMotion ? 0.2 : duration,
                ease: [0.25, 0.1, 0.25, 1],
                delay: prefersReducedMotion ? 0 : index * 0.08
              }}
              onAnimationComplete={index === cards.length - 1 ? handleAnimationComplete : undefined}
              className="absolute w-16 h-24 bg-white rounded-lg shadow-2xl border-2 border-gray-300 flex flex-col items-center justify-between p-1.5 select-none"
              style={{
                zIndex: 100 + index
              }}
            >
              <div className="w-full text-left text-xs font-bold leading-none">
                <span className={getCardColor(card)}>{getRankDisplay(card)}</span>
              </div>
              <div className={`text-2xl ${getCardColor(card)}`}>
                {getSuitIcon(card.suit)}
              </div>
              <div className="w-full text-right text-xs font-bold leading-none">
                <span className={getCardColor(card)}>{getRankDisplay(card)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
