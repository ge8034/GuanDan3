'use client'

import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { RoomInvitationPanel } from '@/components/room/RoomInvitationPanel'

export type RoomHeaderProps = {
  roomId: string
  roomStatus?: string | null
  gameStatus: string
  levelRank: number
  seatText: string
  isOwner: boolean
  showLeave: boolean
  onLeave: () => void
  showStart: boolean
  startDisabled: boolean
  startLabel: string
  onStart: () => void
  currentSeat: number
  onAddAI?: () => void
  difficulty?: 'easy' | 'medium' | 'hard'
  onDifficultyChange?: (difficulty: 'easy' | 'medium' | 'hard') => void
  difficultyDisabled?: boolean
  isPaused?: boolean
  onPause?: () => void
  onResume?: () => void
  canPauseResume?: boolean
}

export const RoomHeader = ({
  roomId,
  roomStatus,
  gameStatus,
  levelRank,
  seatText,
  isOwner,
  showLeave,
  onLeave,
  showStart,
  startDisabled,
  startLabel,
  onStart,
  currentSeat,
  onAddAI,
  difficulty = 'medium',
  onDifficultyChange,
  difficultyDisabled = false,
  isPaused = false,
  onPause,
  onResume,
  canPauseResume = false,
}: RoomHeaderProps) => {
  const levelLabel = levelRank === 11 ? 'J' : levelRank === 12 ? 'Q' : levelRank === 13 ? 'K' : levelRank === 14 ? 'A' : String(levelRank)

  const difficultyOptions = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' },
  ]

  return (
    <header className="absolute top-0 left-0 right-0 p-4 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none z-40 gap-3 md:gap-0">
      {/* Room Info HUD */}
      <div className="pointer-events-auto bg-black/30 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10 shadow-lg transition-all hover:bg-black/40 text-left">
        <h1 className="text-lg md:text-xl font-bold text-white drop-shadow-md">房间：{roomId?.slice(0, 8)}...</h1>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/90 font-medium shadow-sm backdrop-blur-sm">状态：{roomStatus}</span>
          <span className="px-2 py-0.5 rounded-full bg-white/10 border border-white/20 text-xs text-white/90 font-medium shadow-sm backdrop-blur-sm">牌局：{gameStatus}</span>
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-xs text-amber-300 font-bold shadow-sm backdrop-blur-sm">级牌：{levelLabel}</span>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-xs text-emerald-300 font-bold shadow-sm backdrop-blur-sm">座位：{seatText}</span>
        </div>
      </div>
      
      {/* Controls HUD */}
      <div className="pointer-events-auto flex flex-wrap gap-2 justify-center bg-black/30 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10 shadow-lg transition-all hover:bg-black/40" data-testid="room-header-controls" data-is-owner={isOwner} data-show-start={showStart} data-has-add-ai={!!onAddAI}>
        {showLeave && (
          <Button
            onClick={onLeave}
            data-testid="room-leave"
            variant="danger"
            size="sm"
          >
            离开房间
          </Button>
        )}
        {canPauseResume && !showStart && (
          <Button
            onClick={isPaused ? onResume : onPause}
            data-testid={isPaused ? "room-resume" : "room-pause"}
            variant={isPaused ? "primary" : "secondary"}
            size="sm"
          >
            {isPaused ? "恢复游戏" : "暂停游戏"}
          </Button>
        )}
        <RoomInvitationPanel roomId={roomId} isOwner={isOwner} />
        {showStart && isOwner && onAddAI && (
          <Button
            onClick={onAddAI}
            data-testid="room-add-ai"
            variant="secondary"
            size="sm"
          >
            添加机器人
          </Button>
        )}
        {showStart && isOwner && onDifficultyChange && (
          <Select
            value={difficulty}
            onChange={(value) => onDifficultyChange(value as 'easy' | 'medium' | 'hard')}
            options={difficultyOptions}
            disabled={difficultyDisabled}
            data-testid="room-difficulty-select"
          />
        )}
        {showStart && isOwner && (
          <Button
            onClick={onStart}
            data-testid="room-start"
            disabled={startDisabled}
            variant="primary"
            size="sm"
          >
            {startLabel}
          </Button>
        )}
      </div>
    </header>
  )
}

