/**
 * RoomHeader 组件
 * 使用设计系统组件重构版本
 */

'use client'

import { useState } from 'react'
import { Copy, UserPlus, Share2 } from 'lucide-react'
import { cn } from '@/design-system/utils/cn'

// 设计系统组件
import { Button } from '@/design-system/components/atoms'
import { Badge } from '@/design-system/components/atoms'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/design-system/components/molecules'

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

// HUD 容器样式 - 带悬停效果的半透明背景
function HUDContainer({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={cn(
        'pointer-events-auto',
        'bg-black/30',
        'backdrop-blur-md',
        'rounded-2xl',
        'border border-white/10',
        'shadow-lg',
        'transition-all',
        'duration-200',
        'hover:bg-black/40',
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </div>
  )
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
  onAddAI,
  difficulty = 'medium',
  onDifficultyChange,
  difficultyDisabled = false,
  isPaused = false,
  onPause,
  onResume,
  canPauseResume = false,
}: RoomHeaderProps) => {
  const levelLabel =
    levelRank === 11
      ? 'J'
      : levelRank === 12
        ? 'Q'
        : levelRank === 13
          ? 'K'
          : levelRank === 14
            ? 'A'
            : String(levelRank)

  const difficultyOptions = [
    { value: 'easy', label: '简单' },
    { value: 'medium', label: '中等' },
    { value: 'hard', label: '困难' },
  ]

  // 复制房间链接功能
  const handleCopyLink = () => {
    const link = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(link).catch(() => {})
  }

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex flex-row justify-between items-center gap-3 p-4 pointer-events-none">
      {/* Room Info HUD */}
      <HUDContainer className="text-left p-4">
        <h1 className="text-lg font-bold text-white drop-shadow-md">
          房间：{roomId?.slice(0, 8)}...
        </h1>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Badge
            variant="default"
            className="bg-white/10 border-white/20 text-white/90 backdrop-blur-sm"
            size="sm"
          >
            状态：{roomStatus}
          </Badge>
          <Badge
            variant="default"
            className="bg-white/10 border-white/20 text-white/90 backdrop-blur-sm"
            size="sm"
          >
            牌局：{gameStatus}
          </Badge>
          <Badge
            variant="warning"
            className="backdrop-blur-sm"
            size="sm"
          >
            级牌：{levelLabel}
          </Badge>
          <Badge
            variant="success"
            className="backdrop-blur-sm"
            size="sm"
          >
            座位：{seatText}
          </Badge>
        </div>
      </HUDContainer>

      {/* Controls HUD */}
      <HUDContainer
        className="flex flex-wrap gap-2 justify-center p-2"
        data-testid="room-header-controls"
        data-is-owner={isOwner}
        data-show-start={showStart}
        data-has-add-ai={!!onAddAI}
      >
        {showLeave && (
          <Button
            onClick={onLeave}
            data-testid="room-leave"
            variant="ghost"
            size="sm"
            className="border-2 border-error-500 text-error-500 hover:bg-error-500/20"
          >
            离开房间
          </Button>
        )}
        {canPauseResume && !showStart && (
          <Button
            onClick={isPaused ? onResume : onPause}
            data-testid={isPaused ? 'room-resume' : 'room-pause'}
            variant={isPaused ? 'primary' : 'secondary'}
            size="sm"
          >
            {isPaused ? '恢复游戏' : '暂停游戏'}
          </Button>
        )}
        <Button
          onClick={handleCopyLink}
          variant="secondary"
          size="sm"
          leftIcon={<Share2 className="w-4 h-4" />}
        >
          分享
        </Button>
        {showStart && isOwner && onAddAI && (
          <Button
            onClick={onAddAI}
            data-testid="room-add-ai"
            variant="secondary"
            size="sm"
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            添加机器人
          </Button>
        )}
        {showStart && isOwner && onDifficultyChange && (
          <Select
            value={difficulty}
            onValueChange={(value) => onDifficultyChange(value as 'easy' | 'medium' | 'hard')}
            disabled={difficultyDisabled}
          >
            <SelectTrigger
              className="bg-white/80 border-white/30 text-neutral-900 h-9 px-3"
              data-testid="room-difficulty-select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {difficultyOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
      </HUDContainer>
    </header>
  )
}
