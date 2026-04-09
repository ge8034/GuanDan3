/**
 * PlayerAvatar 组件
 * 使用设计系统组件重构版本
 */

'use client'

import { memo } from 'react'
import { Bot, User } from 'lucide-react'
import { Badge } from '@/design-system/components/atoms'
import { cn } from '@/design-system/utils/cn'

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
      className={cn(
        'flex flex-col items-center p-2 rounded-xl backdrop-blur-md',
        'transition-all duration-300 ease-out',
        'border-2',
        'z-10',
        isCurrentTurn ? [
          'scale-105 z-20',
          'bg-poker-table-500/10',
          'border-poker-table-500',
          'shadow-[0_0_30px_rgba(26,71,42,0.3)]',
        ] : [
          'scale-100 z-10',
          'bg-white/80',
          'border-neutral-200',
          'shadow',
        ]
      )}
    >
      <div className="relative">
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center border-3',
            'transition-all duration-300 ease-out',
            isCurrentTurn ? [
              'border-poker-table-500',
              'bg-poker-table-500/20',
              'shadow-[0_0_20px_rgba(26,71,42,0.5)]',
            ] : [
              'border-neutral-200',
              'bg-white/80',
            ]
          )}
        >
          <span className="drop-shadow-sm">
            {memberType === 'ai' ? (
              <Bot className="w-8 h-8" strokeWidth={2} />
            ) : (
              <User className="w-8 h-8" strokeWidth={2} />
            )}
          </span>
        </div>

        {isReady && !rankTitle && roomStatus === 'open' && (
          <div
            className={cn(
              'absolute bottom-[-4px] right-[-4px]',
              'w-5 h-5',
              'flex items-center justify-center rounded-full',
              'bg-success-500 text-white',
              'border-2 border-white',
              'shadow-sm',
              'z-30',
              'text-xs font-semibold'
            )}
          >
            ✓
          </div>
        )}

        {memberType !== 'ai' && !isOnline && (
          <Badge
            variant="error"
            size="sm"
            className="absolute bottom-[-4px] left-[-4px] z-30 text-[10px]"
          >
            离线
          </Badge>
        )}

        {rankTitle && (
          <Badge
            variant="primary"
            size="sm"
            className="absolute top-[-6px] right-[-6px] z-30 text-[10px]"
          >
            {rankTitle.split(' ')[0]}
          </Badge>
        )}

        {isCurrentTurn && !rankTitle && (
          <div className="absolute top-[-24px] left-1/2 -translate-x-1/2 z-30">
            <div className="relative bg-white/90 text-neutral-900 text-xs px-2 py-1 rounded-full shadow-sm font-semibold border-2 border-poker-table-500 whitespace-nowrap">
              思考中...
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
                style={{
                  border: '3px solid transparent',
                  borderTopColor: '#1a472a',
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-1 text-center">
        <div className="flex items-center justify-center gap-1 font-semibold text-xs text-neutral-900 whitespace-nowrap">
          {isMe ? '我' : `座位 ${seatNo}`}
          {memberType === 'ai' && (
            <Badge variant="secondary" size="sm" className="text-[10px]">
              AI
            </Badge>
          )}
        </div>

        {!rankTitle ? (
          <div
            className={cn(
              'text-[10px] font-mono mt-0.5',
              cardCount <= 5 ? [
                'text-error-500 font-semibold animate-pulse',
              ] : [
                'text-neutral-600 font-normal',
              ]
            )}
          >
            {cardCount} 张牌
          </div>
        ) : (
          <div className="text-amber-400 font-semibold text-[10px] mt-0.5 drop-shadow-sm">
            {rankTitle.split(' ')[1]}
          </div>
        )}
      </div>
    </div>
  )
})
