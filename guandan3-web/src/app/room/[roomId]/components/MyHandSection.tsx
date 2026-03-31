/**
 * 我的手牌区域组件
 *
 * 显示玩家的手牌和控制按钮
 */

import { memo } from 'react'
import { PlayerAvatar } from '../PlayerAvatar'
import { HandArea } from '../HandArea'
import type { Card } from '@/lib/store/game'

interface MyHandSectionProps {
  mySeat: number
  isMyTurn: boolean
  myHand: Card[]
  selectedCardIds: number[]
  rankings: number[]
  gameStatus: string
  canPass: boolean
  getRankTitle: (seat: number) => string
  isReady?: boolean
  isOnline?: boolean
  roomStatus?: 'open' | 'playing' | 'closed'
  onCardClick: (id: number) => void
  onPlay: () => void
  onPass: () => void
}

export const MyHandSection = memo(function MyHandSection({
  mySeat,
  isMyTurn,
  myHand,
  selectedCardIds,
  rankings,
  gameStatus,
  canPass,
  getRankTitle,
  isReady = false,
  isOnline = true,
  roomStatus,
  onCardClick,
  onPlay,
  onPass,
}: MyHandSectionProps) {
  return (
    <div className="col-start-1 col-span-3 row-start-3 w-full h-48 sm:h-56 md:h-64 lg:h-72 xl:h-80 2xl:h-96 flex flex-col justify-end p-2 sm:p-4 md:p-5 lg:p-6 2xl:p-8 bg-gradient-to-t from-primary/10 to-transparent z-20 relative">
      {/* My Avatar (Bottom Left Overlay) */}
      <div className="absolute bottom-2 sm:bottom-4 left-2 sm:left-4 z-30 transform scale-60 sm:scale-75 md:scale-90 lg:scale-100 2xl:scale-110 origin-bottom-left opacity-80 hover:opacity-100 transition-opacity">
        <PlayerAvatar
          seatNo={mySeat}
          isCurrentTurn={isMyTurn}
          cardCount={myHand.length}
          memberType="human"
          isMe={true}
          rankTitle={getRankTitle(mySeat)}
          isReady={isReady}
          isOnline={isOnline}
          roomStatus={roomStatus}
        />
      </div>

      <HandArea
        isMyTurn={isMyTurn}
        selectedCardIds={selectedCardIds}
        onPlay={onPlay}
        onPass={onPass}
        onCardClick={onCardClick}
        myHand={myHand}
        rankings={rankings}
        mySeat={mySeat}
        gameStatus={gameStatus}
        getRankTitle={getRankTitle}
        canPass={canPass}
      />
    </div>
  )
})
