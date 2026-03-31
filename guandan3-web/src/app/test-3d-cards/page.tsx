'use client'

import { useState } from 'react'
import { GameTable3D } from '@/components/3d'

import { logger } from '@/lib/utils/logger'
export default function Test3DCardsPage() {
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set())
  
  const testCards = [
    { id: '1', suit: 'hearts', rank: 'A', position: [-4, 0, 0] as [number, number, number] },
    { id: '2', suit: 'hearts', rank: 'K', position: [-2, 0, 0] as [number, number, number] },
    { id: '3', suit: 'diamonds', rank: 'Q', position: [0, 0, 0] as [number, number, number] },
    { id: '4', suit: 'clubs', rank: 'J', position: [2, 0, 0] as [number, number, number] },
    { id: '5', suit: 'spades', rank: '10', position: [4, 0, 0] as [number, number, number] },
  ]

  const handleCardClick = (cardId: string) => {
    setSelectedCards(prev => {
      const newSet = new Set(prev)
      if (newSet.has(cardId)) {
        newSet.delete(cardId)
      } else {
        newSet.add(cardId)
      }
      return newSet
    })
  }

  const handleCardHover = (cardId: string, isHovered: boolean) => {
    logger.debug(`Card ${cardId} hovered: ${isHovered}`)
  }

  const cardsWithSelection = testCards.map(card => ({
    ...card,
    isSelected: selectedCards.has(card.id)
  }))

  return (
    <div className="relative">
      <GameTable3D 
        cards={cardsWithSelection}
        onCardClick={handleCardClick}
        onCardHover={handleCardHover}
      />
      
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm p-4 rounded-lg border border-border">
        <h2 className="text-lg font-semibold mb-2">3D扑克牌测试</h2>
        <p className="text-sm text-text-secondary mb-2">点击扑克牌选择/取消选择</p>
        <p className="text-sm text-text-secondary">已选择: {selectedCards.size} 张牌</p>
        <div className="mt-2 text-xs text-text-tertiary">
          <p>• 拖拽旋转视角</p>
          <p>• 滚轮缩放</p>
          <p>• 点击选择牌</p>
        </div>
      </div>
    </div>
  )
}
