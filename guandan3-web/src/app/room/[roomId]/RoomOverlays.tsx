'use client'

import { useState } from 'react'

export type RoomOverlaysProps = {
  authReady: boolean
  roomLoaded: boolean
  hasRoom: boolean
  roomStatus?: string | null
  roomName?: string | null
  isMember: boolean
  membersCount: number
  onBackLobby: () => void
  onCopyLink: () => void
  onRefresh: () => void
  onJoin: () => void
  onCancelBack: () => void
}

// 内联样式按钮组件
function InlineButton({
  children,
  variant = 'primary',
  onClick,
  style,
  fullWidth = false
}: {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'outline' | 'muted'
  onClick: () => void
  style?: React.CSSProperties
  fullWidth?: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  const baseStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 600,
    cursor: 'pointer',
    border: '2px solid',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: fullWidth ? 'flex' : 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: fullWidth ? '100%' : 'auto',
    marginBottom: '0.75rem',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    ...style,
  }

  const variantStyles = {
    primary: {
      backgroundColor: isHovered ? '#2d5a3d' : '#1a472a',
      borderColor: '#1a472a',
      color: 'white',
    },
    secondary: {
      backgroundColor: isHovered ? '#f5f5dc' : '#fafaf0',
      borderColor: '#e5e7eb',
      color: '#374151',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },
    outline: {
      backgroundColor: isHovered ? '#f5f5dc' : 'transparent',
      borderColor: '#e5e7eb',
      color: '#6b7280',
      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
    },
    muted: {
      backgroundColor: isHovered ? '#d1d5db' : '#e5e7eb',
      borderColor: '#e5e7eb',
      color: '#111827',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    },
  }

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}

// 内联样式文本链接
function InlineTextLink({
  children,
  onClick
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        fontSize: '0.875rem',
        color: isHovered ? '#111827' : '#9ca3af',
        textDecoration: 'underline',
        cursor: 'pointer',
        padding: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  )
}

// 覆盖层容器
function OverlayContainer({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        zIndex: 1001,
      }}
    >
      <div
        style={{
          backgroundColor: '#fafaf0',
          color: '#111827',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '24rem',
          width: '100%',
          textAlign: 'center',
          margin: '1rem',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export const RoomOverlays = ({
  authReady,
  roomLoaded,
  hasRoom,
  roomStatus,
  roomName,
  isMember,
  membersCount,
  onBackLobby,
  onCopyLink,
  onRefresh,
  onJoin,
  onCancelBack,
}: RoomOverlaysProps) => {
  if (!authReady || !roomLoaded) return null

  if (!hasRoom) {
    return (
      <OverlayContainer>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          房间不存在或已关闭
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          请确认房间链接是否正确，或返回大厅重新加入。
        </p>
        <InlineButton variant="primary" onClick={onBackLobby} fullWidth data-testid="room-overlay-back-lobby">
          返回大厅
        </InlineButton>
        <InlineButton variant="outline" onClick={onCopyLink} fullWidth data-testid="room-overlay-copy-link">
          复制房间链接
        </InlineButton>
        <InlineTextLink onClick={onRefresh} data-testid="room-overlay-refresh">刷新重试</InlineTextLink>
      </OverlayContainer>
    )
  }

  if (roomStatus === 'open' && !isMember && membersCount >= 4) {
    return (
      <OverlayContainer>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          房间已满
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          房间：{roomName || '未命名'}
          <br />
          玩家：{membersCount}/4
        </p>
        <InlineButton variant="primary" onClick={onBackLobby} fullWidth data-testid="room-overlay-back-lobby">
          返回大厅
        </InlineButton>
        <InlineButton variant="outline" onClick={onCopyLink} fullWidth data-testid="room-overlay-copy-link">
          复制房间链接
        </InlineButton>
        <InlineTextLink onClick={onRefresh} data-testid="room-overlay-refresh">刷新重试</InlineTextLink>
      </OverlayContainer>
    )
  }

  if (roomStatus === 'open' && !isMember && membersCount < 4) {
    return (
      <OverlayContainer>
        <h2 style={{ fontSize: '1.875rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          加入对局？
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          房间：{roomName || '未命名'}
          <br />
          玩家：{membersCount}/4
        </p>
        <InlineButton variant="primary" onClick={onJoin} fullWidth data-testid="room-overlay-join">
          加入座位
        </InlineButton>
        <InlineButton variant="outline" onClick={onCopyLink} fullWidth data-testid="room-overlay-copy-link">
          复制房间链接
        </InlineButton>
        <InlineButton variant="muted" onClick={onBackLobby} fullWidth data-testid="room-overlay-back-lobby">
          返回大厅
        </InlineButton>
        <InlineTextLink onClick={onCancelBack} data-testid="room-overlay-cancel">取消并返回</InlineTextLink>
      </OverlayContainer>
    )
  }

  if (roomStatus === 'playing' && !isMember) {
    return (
      <OverlayContainer>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          无法加入进行中的对局
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          你当前账号不是该房间成员，无法在对局进行中加入。
        </p>
        <InlineButton variant="primary" onClick={onBackLobby} fullWidth data-testid="room-overlay-back-lobby">
          返回大厅
        </InlineButton>
        <InlineButton variant="outline" onClick={onCopyLink} fullWidth data-testid="room-overlay-copy-link">
          复制房间链接
        </InlineButton>
        <InlineTextLink onClick={onRefresh} data-testid="room-overlay-refresh">刷新重试</InlineTextLink>
      </OverlayContainer>
    )
  }

  if (roomStatus === 'closed') {
    return (
      <OverlayContainer>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
          房间已关闭
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          该房间已结束或已被关闭，请返回大厅重新加入。
        </p>
        <InlineButton variant="primary" onClick={onBackLobby} fullWidth data-testid="room-overlay-back-lobby">
          返回大厅
        </InlineButton>
        <InlineButton variant="outline" onClick={onCopyLink} fullWidth data-testid="room-overlay-copy-link">
          复制房间链接
        </InlineButton>
        <InlineTextLink onClick={onRefresh} data-testid="room-overlay-refresh">刷新重试</InlineTextLink>
      </OverlayContainer>
    )
  }

  return null
}
