'use client'

import { memo, useCallback, useMemo, useState, useEffect } from 'react'
import { Card } from '@/lib/store/game'
import { CardView } from './CardView'

export type HandAreaProps = {
  isMyTurn: boolean
  selectedCardIds: number[]
  onPlay: () => void
  onPass: () => void
  onCardClick: (id: number) => void
  myHand: Card[]
  rankings: number[]
  mySeat: number
  gameStatus: string
  getRankTitle: (seatNo: number) => string | null
  canPass: boolean
}

// 内联样式按钮组件
function InlineButton({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  style
}: {
  children: React.ReactNode
  variant?: 'primary' | 'outline'
  disabled?: boolean
  onClick: () => void
  style?: React.CSSProperties
}) {
  const [isHovered, setIsHovered] = useState(false)
  const [isPressed, setIsPressed] = useState(false)

  const baseStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '2px solid',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    minHeight: '44px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    transform: isPressed ? 'scale(0.95)' : 'scale(1)',
    ...style,
  }

  const variantStyles = {
    primary: {
      backgroundColor: isHovered && !disabled ? '#2d5a3d' : '#1a472a',
      borderColor: '#1a472a',
      color: 'white',
    },
    outline: {
      backgroundColor: isHovered && !disabled ? 'rgba(26, 71, 42, 0.1)' : 'transparent',
      borderColor: '#1a472a',
      color: '#1a472a',
    },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        setIsPressed(false)
      }}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
    >
      {children}
    </button>
  )
}

export const HandArea = memo(function HandArea({
  isMyTurn,
  selectedCardIds,
  onPlay,
  onPass,
  onCardClick,
  myHand,
  rankings,
  mySeat,
  gameStatus,
  getRankTitle,
  canPass,
}: HandAreaProps) {
  const handleCardClick = useCallback((id: number) => {
    onCardClick(id)
  }, [onCardClick])

  const isFinished = rankings.includes(mySeat)
  const showWaiting = useMemo(() => {
    return myHand.length === 0 && gameStatus === 'playing' && !isFinished
  }, [myHand.length, gameStatus, isFinished])

  const rankIndex = useMemo(() => {
    return rankings.indexOf(mySeat)
  }, [rankings, mySeat])

  const rankEmoji = useMemo(() => {
    if (rankIndex === 0) return '👑'
    if (rankIndex === 1) return '🥈'
    if (rankIndex === 2) return '🥉'
    return '🥔'
  }, [rankIndex])

  const rankTitle = useMemo(() => {
    return getRankTitle(mySeat)
  }, [getRankTitle, mySeat])

  return (
    <>
      {/* 控制按钮区域 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '1rem',
          marginBottom: '1rem',
          zIndex: 20,
          height: '40px',
        }}
      >
        {isMyTurn && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <InlineButton
              onClick={onPlay}
              disabled={selectedCardIds.length === 0}
              variant="primary"
            >
              出牌
            </InlineButton>
            <InlineButton
              onClick={onPass}
              disabled={!canPass}
              variant="outline"
            >
              过牌
            </InlineButton>
          </div>
        )}
      </div>

      {/* 手牌区域 */}
      <div
        data-testid="room-hand"
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingBottom: '1rem',
          paddingLeft: '3rem',
          paddingRight: '3rem',
          minHeight: '120px',
          overflowX: 'auto',
          gap: '0.5rem',
        }}
      >
        {isFinished ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '128px',
              width: '100%',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>{rankEmoji}</div>
            <div
              style={{
                fontSize: '1.25rem',
                fontWeight: 600,
                color: '#d4af37',
                filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
              }}
            >
              {rankTitle}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              等待其他玩家...
            </div>
          </div>
        ) : showWaiting ? (
          <div
            style={{
              color: '#6b7280',
              marginTop: '2rem',
              fontFamily: 'monospace',
              fontSize: '0.9375rem',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          >
            正在确认终局状态...
          </div>
        ) : (
          myHand.map((card, i) => (
            <CardView
              key={card.id}
              card={card}
              variant="hand"
              selected={selectedCardIds.includes(card.id)}
              disabled={!isMyTurn}
              onClick={() => handleCardClick(card.id)}
              style={{ zIndex: i }}
              index={i}
            />
          ))
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </>
  )
})
