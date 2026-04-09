/**
 * 我的手牌区域组件
 * 使用设计系统组件重构版本
 *
 * 显示玩家的手牌和控制按钮
 */

import { memo } from 'react'
import { PlayerAvatar } from '../PlayerAvatar'
import { HandArea } from '../HandArea'
import type { Card } from '@/lib/store/game'
import { cn } from '@/design-system/utils/cn'

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
    <div
      className={cn(
        'col-span-full row-3',
        'w-full h-48',
        'flex flex-col justify-end',
        'p-2 px-4',
        'relative',
        'bg-gradient-to-t from-poker-table-500/10 to-transparent'
      )}
    >
      {/* My Avatar (Bottom Left Overlay) */}
      <div
        className="absolute bottom-2 left-2 scale-90 origin-bottom-left opacity-80 transition-opacity hover:opacity-100"
      >
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
