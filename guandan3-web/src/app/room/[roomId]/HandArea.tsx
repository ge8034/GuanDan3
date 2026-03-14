'use client'

import { Card } from '@/lib/store/game'
import { CardView } from './CardView'

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
}

export const HandArea = ({
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
}: HandAreaProps) => {
  return (
    <>
      <div className="flex justify-center gap-4 mb-4 z-20">
        {isMyTurn && (
          <>
            <button
              onClick={onPlay}
              disabled={selectedCardIds.length === 0}
              data-testid="room-play"
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-2 rounded-full font-bold shadow-lg transition transform active:scale-95"
            >
              出牌
            </button>
            <button
              onClick={onPass}
              data-testid="room-pass"
              className="bg-gray-600 hover:bg-gray-500 text-white px-8 py-2 rounded-full font-bold shadow-lg transition transform active:scale-95"
            >
              过牌
            </button>
          </>
        )}
      </div>

      <div data-testid="room-hand" className="flex justify-center -space-x-12 hover:-space-x-8 transition-all duration-300 pb-4 overflow-x-auto px-12">
        {rankings.includes(mySeat) ? (
          <div className="flex flex-col items-center justify-center h-32 animate-in zoom-in">
            <div className="text-6xl mb-2">
              {rankings.indexOf(mySeat) === 0 ? '👑' : rankings.indexOf(mySeat) === 1 ? '🥈' : rankings.indexOf(mySeat) === 2 ? '🥉' : '🥔'}
            </div>
            <div className="text-2xl font-bold text-yellow-400 drop-shadow-md">{getRankTitle(mySeat)}</div>
            <div className="text-white/60 text-sm mt-1">等待其他玩家...</div>
          </div>
        ) : (
          <>
            {myHand.length === 0 && gameStatus === 'playing' && !rankings.includes(mySeat) ? (
              <div className="text-white/50 animate-pulse">正在确认终局状态...</div>
            ) : (
              myHand.map((card, i) => (
                <CardView
                  key={card.id}
                  card={card}
                  variant="hand"
                  selected={selectedCardIds.includes(card.id)}
                  disabled={!isMyTurn}
                  onClick={() => onCardClick(card.id)}
                  style={{ zIndex: i }}
                />
              ))
            )}
          </>
        )}
      </div>
    </>
  )
}
