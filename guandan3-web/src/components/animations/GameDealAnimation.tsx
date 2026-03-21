'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card } from '@/lib/store/game'
import { usePrefersReducedMotion } from '@/lib/performance/optimization'

interface GameDealAnimationProps {
  visible: boolean
  onComplete?: () => void
  dealSpeed?: number
}

export default function GameDealAnimation({ visible, onComplete, dealSpeed = 100 }: GameDealAnimationProps) {
  const [dealtCards, setDealtCards] = useState<Card[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [cardRotations, setCardRotations] = useState<number[]>([])
  const prefersReducedMotion = usePrefersReducedMotion()
  
  const totalCards = 108
  const cardsPerPlayer = 27

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        setCardRotations(Array.from({ length: totalCards }, () => Math.random() * 360 - 180))
      }, 0)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setCardRotations([])
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [visible, totalCards])

  const positions = useMemo(() => [
    { x: 50, y: 80 },
    { x: 85, y: 50 },
    { x: 50, y: 20 },
    { x: 15, y: 50 }
  ], [])

  const getCardPosition = useCallback((index: number) => {
    const playerIndex = Math.floor(index / cardsPerPlayer)
    const cardIndexInHand = index % cardsPerPlayer
    
    const basePos = positions[playerIndex]
    const offset = (cardIndexInHand - cardsPerPlayer / 2) * 2
    
    return {
      x: basePos.x + (playerIndex % 2 === 0 ? offset : 0),
      y: basePos.y + (playerIndex % 2 === 1 ? offset : 0)
    }
  }, [positions, cardsPerPlayer])

  const getCardColor = useCallback((suit: string) => {
    return suit === 'H' || suit === 'D' ? '#FF0000' : '#000000'
  }, [])

  const getSuitSymbol = useCallback((suit: string) => {
    const symbols: Record<string, string> = {
      'H': '♥',
      'D': '♦',
      'C': '♣',
      'S': '♠'
    }
    return symbols[suit] || suit
  }, [])

  const generateRandomCard = useCallback((id: number): Card => {
    const suits = ['H', 'D', 'C', 'S'] as const
    const ranks = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const
    
    return {
      id,
      suit: suits[Math.floor(Math.random() * suits.length)],
      rank: ranks[Math.floor(Math.random() * ranks.length)],
      val: Math.floor(Math.random() * 13) + 2
    }
  }, [])

  useEffect(() => {
    if (!visible) {
      const timer = setTimeout(() => {
        setDealtCards([])
        setCurrentIndex(0)
      }, 0)
      return () => clearTimeout(timer)
    }

    if (currentIndex < totalCards) {
      const timer = setTimeout(() => {
        const playerIndex = Math.floor(currentIndex / cardsPerPlayer)
        const cardIndexInHand = currentIndex % cardsPerPlayer
        
        const newCard = generateRandomCard(currentIndex)
        
        setDealtCards(prev => [...prev, newCard])
        setCurrentIndex(prev => prev + 1)
      }, dealSpeed)

      return () => clearTimeout(timer)
    } else if (onComplete) {
      const timer = setTimeout(onComplete, 500)
      return () => clearTimeout(timer)
    }
  }, [currentIndex, visible, dealSpeed, onComplete, totalCards, cardsPerPlayer, generateRandomCard])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
      <div className="relative w-full h-full max-w-4xl max-h-4xl">
        <AnimatePresence>
          {dealtCards.map((card, i) => {
            const pos = getCardPosition(i)
            return (
              <motion.div
                key={card.id}
                initial={{
                  x: '50%',
                  y: '50%',
                  rotate: cardRotations[i] || 0,
                  scale: 0.3,
                  opacity: 0
                }}
                animate={{
                  x: `${pos.x}%`,
                  y: `${pos.y}%`,
                  rotate: 0,
                  scale: 0.8,
                  opacity: 1
                }}
                transition={{
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                  delay: i * 0.01
                }}
                className="absolute w-10 h-14 bg-white rounded-lg shadow-xl border-2 border-gray-300 flex items-center justify-center"
                style={{
                  transform: 'translate(-50%, -50%)',
                  color: getCardColor(card.suit)
                }}
              >
                <div className="text-center">
                  <div className="text-xs font-bold">{card.rank}</div>
                  <div className="text-lg">{getSuitSymbol(card.suit)}</div>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
        
        {currentIndex < totalCards && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
          >
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl px-8 py-4 shadow-2xl">
              <div className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                发牌中...
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                {currentIndex} / {totalCards}
              </div>
              <div className="w-64 h-2 bg-gray-200 dark:bg-gray-700 rounded-full mt-3 overflow-hidden">
                <motion.div
                  className="h-full bg-blue-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentIndex / totalCards) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
