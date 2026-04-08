'use client'

import { Pause } from 'lucide-react'

export type GamePausedOverlayProps = {
  visible: boolean
  pausedBy?: string | null
  pausedAt?: Date | null
  pauseReason?: string | null
  onResume: () => void
}

export const GamePausedOverlay = ({
  visible,
  pausedBy,
  pausedAt,
  pauseReason,
  onResume,
}: GamePausedOverlayProps) => {
  if (!visible) return null

  const formatPausedTime = (timestamp: Date | null | undefined) => {
    if (!timestamp) return ''
    return timestamp.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          color: 'black',
          padding: '2rem',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          maxWidth: '28rem',
          width: '100%',
          textAlign: 'center',
          margin: '1rem',
        }}
      >
        <div style={{ marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 1rem',
              backgroundColor: '#fef3c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Pause style={{ width: '40px', height: '40px', color: '#f59e0b' }} strokeWidth={2} />
          </div>
          <h2
            style={{
              fontSize: '1.875rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
              color: '#111827',
            }}
          >
            游戏已暂停
          </h2>
          <p style={{ color: '#6b7280' }}>
            {pauseReason ? `暂停原因：${pauseReason}` : '游戏暂时暂停'}
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#f9fafb',
            borderRadius: '8px',
            padding: '1rem',
            marginBottom: '1.5rem',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ color: '#6b7280' }}>暂停时间：</span>
            <span style={{ fontWeight: 600, color: '#111827' }}>{formatPausedTime(pausedAt)}</span>
          </div>
          {pausedBy && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span style={{ color: '#6b7280' }}>暂停玩家：</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>
                玩家 {pausedBy.slice(0, 8)}...
              </span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={onResume}
            data-testid="game-paused-resume"
            style={{
              width: '100%',
              backgroundColor: '#10b981',
              color: 'white',
              fontWeight: 600,
              padding: '0.75rem 1.5rem',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '1rem',
              border: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1'
            }}
          >
            恢复游戏
          </button>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
            点击"恢复游戏"按钮继续对局
          </p>
        </div>
      </div>
    </div>
  )
}
