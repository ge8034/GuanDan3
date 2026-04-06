'use client'

import { memo } from 'react'
import Badge from '@/components/ui/Badge'

export type PlayerAvatarProps = {
  seatNo: number
  isCurrentTurn: boolean
  cardCount: number
  memberType: string
  isMe: boolean
  rankTitle: string | null
  isReady: boolean
  isOnline: boolean
  roomStatus?: string | null
}

export const PlayerAvatar = memo(function PlayerAvatar({
  seatNo,
  isCurrentTurn,
  cardCount,
  memberType,
  isMe,
  rankTitle,
  isReady,
  isOnline,
  roomStatus,
}: PlayerAvatarProps) {
  return (
    <div
      className={`flex flex-col items-center p-1.5 sm:p-2 md:p-3 rounded-xl backdrop-blur-md border shadow-2xl transition-all duration-300 ${
        isCurrentTurn 
          ? 'scale-105 sm:scale-110 border-primary bg-primary/10 z-20 shadow-[0_0_30px_rgba(var(--color-primary),0.3)]' 
          : 'bg-surface/80 border-border z-10'
      }`}
    >
      <div className="relative">
        <div
          className={`w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center border-3 sm:border-4 transition-all duration-300 ${
            isCurrentTurn
              ? 'border-primary bg-primary/20 shadow-[0_0_20px_rgba(var(--color-primary),0.5)]'
              : 'border-border bg-surface'
          }`}
        >
          <span className="text-xl sm:text-2xl md:text-3xl filter drop-shadow-lg transform hover:scale-110 transition-transform cursor-default">
            {memberType === 'ai' ? '🤖' : '👤'}
          </span>
        </div>

        {isReady && !rankTitle && roomStatus === 'open' && (
          <div className="absolute -bottom-1 -right-1 bg-success text-white w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full border-2 border-white shadow-md z-30 animate-in zoom-in text-[10px] sm:text-xs md:text-sm">
            ✓
          </div>
        )}

        {memberType !== 'ai' && !isOnline && (
          <Badge variant="error" size="sm" className="absolute -bottom-1 -left-1 z-30 text-[8px] sm:text-[10px] md:text-xs">
            离线
          </Badge>
        )}

        {rankTitle && (
          <Badge variant="primary" size="sm" className="absolute -top-1.5 sm:-top-2 -right-1.5 sm:-right-2 z-30 animate-bounce text-[8px] sm:text-[10px] md:text-xs">
            {rankTitle.split(' ')[0]}
          </Badge>
        )}

        {isCurrentTurn && !rankTitle && (
          <div className="absolute -top-6 sm:-top-8 md:-top-9 left-1/2 -translate-x-1/2 bg-surface text-text-primary text-[8px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 md:px-3 py-0.5 sm:py-1 rounded-full shadow-lg whitespace-nowrap animate-pulse z-30 font-bold border border-primary">
            思考中...
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 border-3 sm:border-4 border-transparent border-t-primary"></div>
          </div>
        )}
      </div>

      <div className="mt-0.5 sm:mt-1 md:mt-2 text-center">
        <div className="font-bold text-[10px] sm:text-xs md:text-sm text-text-primary flex items-center justify-center gap-0.5 sm:gap-1 whitespace-nowrap">
          {isMe ? '我' : `座位 ${seatNo}`}
          {memberType === 'ai' && (
            <Badge variant="secondary" size="sm" className="text-[8px] sm:text-[10px] md:text-xs">AI</Badge>
          )}
        </div>

        {!rankTitle ? (
          <div className={`text-[8px] sm:text-[10px] md:text-xs font-mono mt-0.5 ${cardCount <= 5 ? 'text-error font-bold animate-pulse' : 'text-text-secondary'}`}>
            {cardCount} 张牌
          </div>
        ) : (
          <div className="text-accent font-bold text-[8px] sm:text-[10px] md:text-xs mt-0.5 drop-shadow-md">{rankTitle.split(' ')[1]}</div>
        )}
      </div>
    </div>
  )
})

