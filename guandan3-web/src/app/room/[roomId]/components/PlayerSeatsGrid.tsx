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
      <div className="col-start-2 row-start-1 flex justify-center pt-2 sm:pt-4 pb-1 sm:pb-2 z-10 md:pt-6 md:pb-3 lg:pt-8 lg:pb-4 2xl:pt-10 2xl:pb-5">
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
      <div className="col-start-1 row-start-2 flex items-center justify-start pl-2 sm:pl-4 z-10 md:pl-6 lg:pl-8 2xl:pl-10">
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
      <div className="col-start-3 row-start-2 flex items-center justify-end pr-2 sm:pr-4 z-10 md:pr-6 lg:pr-8 2xl:pr-10">
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
