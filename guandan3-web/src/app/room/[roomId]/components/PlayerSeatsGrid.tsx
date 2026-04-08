/**
 * 玩家座位网格组件
 *
 * 显示所有其他玩家的座位（上家、下家、对家）
 */

import { memo } from 'react'
import { PlayerAvatar } from '../PlayerAvatar'
import type { Room } from '@/lib/store/room'
import type { MemoizedPlayerAvatar } from '../hooks/useMemoizedPlayerAvatars'

interface PlayerSeatsGridProps {
  roomStatus?: Room['status']
  memoizedPlayerAvatars: MemoizedPlayerAvatar[]
}

export const PlayerSeatsGrid = memo(function PlayerSeatsGrid({
  roomStatus,
  memoizedPlayerAvatars,
}: PlayerSeatsGridProps) {
  // 对家（上方）
  const oppositeAvatar = memoizedPlayerAvatars.find(
    (a) => a.position === 'opposite'
  )

  // 上家（左侧）
  const leftAvatar = memoizedPlayerAvatars.find((a) => a.position === 'left')

  // 下家（右侧）
  const rightAvatar = memoizedPlayerAvatars.find((a) => a.position === 'right')

  return (
    <>
      {/* Row 1: Top (Opposite) - 对家 */}
      <div
        style={{
          gridColumn: '2',
          gridRow: '1',
          display: 'flex',
          justifyContent: 'center',
          paddingTop: '0.5rem',
          paddingBottom: '0.25rem',
          zIndex: 10,
        }}
      >
        {oppositeAvatar ? (
          <PlayerAvatar
            seatNo={oppositeAvatar.seat}
            isCurrentTurn={oppositeAvatar.isCurrentTurn}
            cardCount={oppositeAvatar.cardCount}
            memberType={oppositeAvatar.memberType}
            isMe={false}
            rankTitle={oppositeAvatar.rankTitle}
            isReady={oppositeAvatar.isReady}
            isOnline={oppositeAvatar.isOnline}
            roomStatus={roomStatus}
          />
        ) : null}
      </div>

      {/* Row 2 Left: Left (Previous) - 上家 */}
      <div
        style={{
          gridColumn: '1',
          gridRow: '2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          paddingLeft: '0.5rem',
          zIndex: 10,
        }}
      >
        {leftAvatar ? (
          <PlayerAvatar
            seatNo={leftAvatar.seat}
            isCurrentTurn={leftAvatar.isCurrentTurn}
            cardCount={leftAvatar.cardCount}
            memberType={leftAvatar.memberType}
            isMe={false}
            rankTitle={leftAvatar.rankTitle}
            isReady={leftAvatar.isReady}
            isOnline={leftAvatar.isOnline}
            roomStatus={roomStatus}
          />
        ) : null}
      </div>

      {/* Row 2 Right: Right (Next) - 下家 */}
      <div
        style={{
          gridColumn: '3',
          gridRow: '2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '0.5rem',
          zIndex: 10,
        }}
      >
        {rightAvatar ? (
          <PlayerAvatar
            seatNo={rightAvatar.seat}
            isCurrentTurn={rightAvatar.isCurrentTurn}
            cardCount={rightAvatar.cardCount}
            memberType={rightAvatar.memberType}
            isMe={false}
            rankTitle={rightAvatar.rankTitle}
            isReady={rightAvatar.isReady}
            isOnline={rightAvatar.isOnline}
            roomStatus={roomStatus}
          />
        ) : null}
      </div>
    </>
  )
})

export type { MemoizedPlayerAvatar }
