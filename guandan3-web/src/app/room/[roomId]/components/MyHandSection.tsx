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
    <div
      style={{
        gridColumn: '1 / -1',
        gridRow: '3',
        width: '100%',
        height: '192px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        padding: '0.5rem 1rem',
        background: 'linear-gradient(to top, rgba(26, 71, 42, 0.1), transparent)',
        position: 'relative',
      }}
    >
      {/* My Avatar (Bottom Left Overlay) */}
      <div
        style={{
          position: 'absolute',
          bottom: '8px',
          left: '8px',
          transform: 'scale(0.9)',
          transformOrigin: 'bottom left',
          opacity: 0.8,
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0.8'
        }}
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
