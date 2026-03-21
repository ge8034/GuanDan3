'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'

interface DealAnimationProps {
  cards: Array<{ suit: string; rank: string }>
  onComplete?: () => void
  dealSpeed?: number
}

export default function DealAnimation({ cards, onComplete, dealSpeed = 100 }: DealAnimationProps) {
  const [dealtCards, setDealtCards] = useState<Array<{ suit: string; rank: string; index: number }>>([])
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (currentIndex < cards.length) {
      const timer = setTimeout(() => {
        setDealtCards(prev => [...prev, { ...cards[currentIndex], index: currentIndex }])
        setCurrentIndex(prev => prev + 1)
      }, dealSpeed)

      return () => clearTimeout(timer)
    } else if (onComplete) {
      const timer = setTimeout(onComplete, dealSpeed)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, cards, dealSpeed, onComplete])

  return (
    <div className="relative w-full h-full">
      <AnimatePresence>
        {dealtCards.map((card, i) => (
          <motion.div
            key={card.index}
            initial={{
              x: '50%',
              y: '-50%',
              rotate: -180,
              scale: 0.5,
              opacity: 0
            }}
            animate={{
              x: `${(i % 10) * 10 - 45}%`,
              y: `${Math.floor(i / 10) * 15 - 10}%`,
              rotate: 0,
              scale: 1,
              opacity: 1
            }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 20,
              delay: i * 0.02
            }}
            className="absolute w-12 h-16 bg-white rounded-lg shadow-lg border-2 border-gray-300 flex items-center justify-center text-2xl font-bold"
            style={{
              color: card.suit === '♥' || card.suit === '♦' ? '#FF0000' : '#000000'
            }}
          >
            <div className="text-center">
              <div className="text-sm">{card.rank}</div>
              <div>{card.suit}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
