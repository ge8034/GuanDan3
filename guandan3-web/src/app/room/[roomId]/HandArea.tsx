'use client'

import { memo, useCallback, useMemo } from 'react'
import { Card } from '@/lib/store/game'
import { CardView } from './CardView'
import { Button } from '@/components/ui/Button'
import { AnimatePresence, motion } from 'framer-motion'

export type HandAreaProps = {
  isMyTurn: boolean
  selectedCardIds: number[]
  onPlay: () => void
  onPass: () => void
  onCardClick: (id: number) => void
  myHand: Card[]
  rankings: number[]
  mySeat: number
  gameStatus: string
  getRankTitle: (seatNo: number) => string | null
  canPass: boolean
}

export const HandArea = memo(function HandArea({
  isMyTurn,
  selectedCardIds,
  onPlay,
  onPass,
  onCardClick,
  myHand,
  rankings,
  mySeat,
  gameStatus,
  getRankTitle,
  canPass,
}: HandAreaProps) {
  const handleCardClick = useCallback((id: number) => {
    onCardClick(id)
  }, [onCardClick])

  const isFinished = rankings.includes(mySeat)
  const showWaiting = useMemo(() => {
    return myHand.length === 0 && gameStatus === 'playing' && !isFinished
  }, [myHand.length, gameStatus, isFinished])

  const rankIndex = useMemo(() => {
    return rankings.indexOf(mySeat)
  }, [rankings, mySeat])

  const rankEmoji = useMemo(() => {
    if (rankIndex === 0) return '👑'
    if (rankIndex === 1) return '🥈'
    if (rankIndex === 2) return '🥉'
    return '🥔'
  }, [rankIndex])

  const rankTitle = useMemo(() => {
    return getRankTitle(mySeat)
  }, [getRankTitle, mySeat])

  return (
    <>
      <div className="flex justify-center gap-2 sm:gap-4 mb-2 sm:mb-4 z-20 h-10 sm:h-10">
        <AnimatePresence>
          {isMyTurn && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="flex gap-2 sm:gap-4"
            >
              <Button
                onClick={onPlay}
                disabled={selectedCardIds.length === 0}
                data-testid="room-play"
                variant="primary"
                size="md"
                className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2 min-h-[44px] touch-manipulation active:scale-95"
              >
                出牌
              </Button>
              <Button
                onClick={onPass}
                disabled={!canPass}
                data-testid="room-pass"
                variant="outline"
                size="md"
                className="text-sm sm:text-base px-3 sm:px-4 py-2 sm:py-2 min-h-[44px] touch-manipulation active:scale-95"
              >
                过牌
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div 
        data-testid="room-hand" 
        className="flex justify-center -space-x-8 sm:-space-x-12 hover:-space-x-6 sm:hover:-space-x-8 transition-all duration-300 pb-2 sm:pb-4 overflow-x-auto px-4 sm:px-12 min-h-[120px] sm:min-h-[160px]"
        layout
      >
        <AnimatePresence mode='popLayout'>
          {isFinished ? (
            <motion.div 
              key="ranking"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center h-32"
            >
              <div className="text-4xl sm:text-5xl md:text-6xl mb-2">
                {rankEmoji}
              </div>
              <div className="text-xl sm:text-2xl font-semibold text-accent drop-shadow-md">{rankTitle}</div>
              <div className="text-text-secondary text-xs sm:text-sm mt-1">等待其他玩家...</div>
            </motion.div>
          ) : (
            <>
              {showWaiting ? (
                <div className="text-text-secondary animate-pulse mt-8 sm:mt-12 font-mono text-sm sm:text-base">正在确认终局状态...</div>
              ) : (
                myHand.map((card, i) => (
                  <CardView
                    key={card.id}
                    card={card}
                    variant="hand"
                    selected={selectedCardIds.includes(card.id)}
                    disabled={!isMyTurn}
                    onClick={() => handleCardClick(card.id)}
                    style={{ zIndex: i }}
                    index={i}
                  />
                ))
              )}
            </>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  )
})
