'use client'

import { Copy, UserPlus, Share2 } from 'lucide-react'

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

// 内联样式按钮组件
function InlineButton({
  children,
  variant = 'primary',
  disabled = false,
  size = 'md',
  onClick,
  style
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'danger' | 'outline'
  disabled?: boolean
  size?: 'sm' | 'md'
  onClick: () => void
  style?: React.CSSProperties
}) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    padding: size === 'sm' ? '0.5rem 0.75rem' : '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: size === 'sm' ? '0.875rem' : '0.9375rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '2px solid',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    minHeight: '36px',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }

  const variantStyles = {
    primary: {
      backgroundColor: isHovered && !disabled ? '#2d5a3d' : '#1a472a',
      borderColor: '#1a472a',
      color: 'white',
    },
    secondary: {
      backgroundColor: isHovered && !disabled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      color: '#111827',
    },
    danger: {
      backgroundColor: isHovered && !disabled ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
      borderColor: '#ef4444',
      color: '#ef4444',
    },
    outline: {
      backgroundColor: isHovered && !disabled ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
      borderColor: 'rgba(255, 255, 255, 0.5)',
      color: 'white',
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}

// 内联样式选择组件
function InlineSelect({
  value,
  onChange,
  disabled = false,
  options,
  style
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  options: { value: string; label: string }[]
  style?: React.CSSProperties
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{
        padding: '0.5rem 0.75rem',
        borderRadius: '8px',
        fontSize: '0.875rem',
        fontWeight: 500,
        cursor: disabled ? 'not-allowed' : 'pointer',
        border: '2px solid',
        backgroundColor: isHovered && !disabled ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.8)',
        borderColor: 'rgba(255, 255, 255, 0.3)',
        color: '#111827',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        minHeight: '36px',
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

import { useState } from 'react'

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
    <header
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        padding: '1rem',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '0.75rem',
        zIndex: 50,
        pointerEvents: 'none',
      }}
    >
      {/* Room Info HUD */}
      <div
        style={{
          pointerEvents: 'auto',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '0.5rem 1rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
        }}
      >
        <h1
          style={{
            fontSize: '1.125rem',
            fontWeight: 700,
            color: 'white',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
          }}
        >
          房间：{roomId?.slice(0, 8)}...
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            flexWrap: 'wrap',
            marginTop: '0.25rem',
          }}
        >
          <span
            style={{
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            状态：{roomStatus}
          </span>
          <span
            style={{
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              fontSize: '0.75rem',
              color: 'rgba(255, 255, 255, 0.9)',
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            牌局：{gameStatus}
          </span>
          <span
            style={{
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(245, 158, 11, 0.2)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              fontSize: '0.75rem',
              color: '#fcd34d',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            级牌：{levelLabel}
          </span>
          <span
            style={{
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              fontSize: '0.75rem',
              color: '#6ee7b7',
              fontWeight: 600,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(4px)',
            }}
          >
            座位：{seatText}
          </span>
        </div>
      </div>

      {/* Controls HUD */}
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(12px)',
          borderRadius: '16px',
          padding: '0.5rem 0.75rem',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.4)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.3)'
        }}
        data-testid="room-header-controls"
        data-is-owner={isOwner}
        data-show-start={showStart}
        data-has-add-ai={!!onAddAI}
      >
        {showLeave && (
          <InlineButton onClick={onLeave} data-testid="room-leave" variant="danger" size="sm">
            离开房间
          </InlineButton>
        )}
        {canPauseResume && !showStart && (
          <InlineButton
            onClick={isPaused ? onResume : onPause}
            data-testid={isPaused ? 'room-resume' : 'room-pause'}
            variant={isPaused ? 'primary' : 'secondary'}
            size="sm"
          >
            {isPaused ? '恢复游戏' : '暂停游戏'}
          </InlineButton>
        )}
        <InlineButton onClick={handleCopyLink} variant="secondary" size="sm">
          <Share2 style={{ width: '16px', height: '16px' }} />
          分享
        </InlineButton>
        {showStart && isOwner && onAddAI && (
          <InlineButton onClick={onAddAI} data-testid="room-add-ai" variant="secondary" size="sm">
            <UserPlus style={{ width: '16px', height: '16px' }} />
            添加机器人
          </InlineButton>
        )}
        {showStart && isOwner && onDifficultyChange && (
          <InlineSelect
            value={difficulty}
            onChange={(value) => onDifficultyChange(value as 'easy' | 'medium' | 'hard')}
            options={difficultyOptions}
            disabled={difficultyDisabled}
            data-testid="room-difficulty-select"
          />
        )}
        {showStart && isOwner && (
          <InlineButton
            onClick={onStart}
            data-testid="room-start"
            disabled={startDisabled}
            variant="primary"
            size="sm"
          >
            {startLabel}
          </InlineButton>
        )}
      </div>
    </header>
  )
}
