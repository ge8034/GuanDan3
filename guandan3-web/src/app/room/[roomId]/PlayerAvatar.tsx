'use client'

import { memo } from 'react'
import { Bot, User } from 'lucide-react'

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

// 徽章组件
function Badge({
  children,
  variant = 'primary',
  size = 'md',
  style
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'error'
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}) {
  const colors = {
    primary: { bg: '#1a472a', color: 'white' },
    secondary: { bg: '#f3f4f6', color: '#374151' },
    success: { bg: '#22c55e', color: 'white' },
    error: { bg: '#ef4444', color: 'white' },
  }

  const sizes = {
    sm: { fontSize: '0.625rem', padding: '0.125rem 0.375rem' },
    md: { fontSize: '0.75rem', padding: '0.25rem 0.5rem' },
  }

  const currentSize = sizes[size]
  const currentColor = colors[variant]

  return (
    <span
      style={{
        backgroundColor: currentColor.bg,
        color: currentColor.color,
        fontSize: currentSize.fontSize,
        padding: currentSize.padding,
        borderRadius: '4px',
        fontWeight: 500,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
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
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '0.375rem 0.5rem',
        borderRadius: '12px',
        backdropFilter: 'blur(12px)',
        boxShadow: isCurrentTurn ? '0 0 30px rgba(26, 71, 42, 0.3)' : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isCurrentTurn ? 'scale(1.05)' : 'scale(1)',
        border: isCurrentTurn ? '2px solid #1a472a' : '2px solid #e5e7eb',
        backgroundColor: isCurrentTurn ? 'rgba(26, 71, 42, 0.1)' : 'rgba(255, 255, 255, 0.8)',
        zIndex: isCurrentTurn ? 20 : 10,
      }}
    >
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: isCurrentTurn ? '3px solid #1a472a' : '3px solid #e5e7eb',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            backgroundColor: isCurrentTurn ? 'rgba(26, 71, 42, 0.2)' : 'rgba(255, 255, 255, 0.8)',
            boxShadow: isCurrentTurn ? '0 0 20px rgba(26, 71, 42, 0.5)' : 'none',
          }}
        >
          <span style={{ filter: 'drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1))' }}>
            {memberType === 'ai' ? (
              <Bot style={{ width: '32px', height: '32px', strokeWidth: 2 }} />
            ) : (
              <User style={{ width: '32px', height: '32px', strokeWidth: 2 }} />
            )}
          </span>
        </div>

        {isReady && !rankTitle && roomStatus === 'open' && (
          <div
            style={{
              position: 'absolute',
              bottom: '-4px',
              right: '-4px',
              backgroundColor: '#22c55e',
              color: 'white',
              width: '20px',
              height: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              border: '2px solid white',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              zIndex: 30,
              fontSize: '0.625rem',
              fontWeight: 600,
            }}
          >
            ✓
          </div>
        )}

        {memberType !== 'ai' && !isOnline && (
          <Badge
            variant="error"
            size="sm"
            style={{
              position: 'absolute',
              bottom: '-4px',
              left: '-4px',
              zIndex: 30,
              fontSize: '0.5rem',
            }}
          >
            离线
          </Badge>
        )}

        {rankTitle && (
          <Badge
            variant="primary"
            size="sm"
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              zIndex: 30,
              fontSize: '0.5rem',
            }}
          >
            {rankTitle.split(' ')[0]}
          </Badge>
        )}

        {isCurrentTurn && !rankTitle && (
          <div
            style={{
              position: 'absolute',
              top: '-24px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: '#111827',
              fontSize: '0.625rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '9999px',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              whiteSpace: 'nowrap',
              zIndex: 30,
              fontWeight: 600,
              border: '2px solid #1a472a',
            }}
          >
            思考中...
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%) translateY(50%)',
                border: '3px solid transparent',
                borderTopColor: '#1a472a',
              }}
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: '0.25rem', textAlign: 'center' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: '0.75rem',
            color: '#111827',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            whiteSpace: 'nowrap',
          }}
        >
          {isMe ? '我' : `座位 ${seatNo}`}
          {memberType === 'ai' && (
            <Badge variant="secondary" size="sm" style={{ fontSize: '0.5rem' }}>
              AI
            </Badge>
          )}
        </div>

        {!rankTitle ? (
          <div
            style={{
              fontSize: '0.625rem',
              fontFamily: 'monospace',
              marginTop: '0.125rem',
              color: cardCount <= 5 ? '#ef4444' : '#6b7280',
              fontWeight: cardCount <= 5 ? 600 : 400,
              animation: cardCount <= 5 ? 'pulse 1.5s ease-in-out infinite' : 'none',
            }}
          >
            {cardCount} 张牌
          </div>
        ) : (
          <div
            style={{
              color: '#d4af37',
              fontWeight: 600,
              fontSize: '0.625rem',
              marginTop: '0.125rem',
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
            }}
          >
            {rankTitle.split(' ')[1]}
          </div>
        )}
      </div>
    </div>
  )
})
