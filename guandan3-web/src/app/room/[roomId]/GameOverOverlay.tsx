'use client'

export type GameOverOverlayProps = {
  visible: boolean
  rankings: number[]
  mySeat: number
  isOwner: boolean
  onRestart: () => void
}

export const GameOverOverlay = ({ visible, rankings, mySeat, isOwner, onRestart }: GameOverOverlayProps) => {
  if (!visible) return null

  const getRankEmoji = (index: number) => {
    if (index === 0) return '👑'
    if (index === 1) return '🥈'
    if (index === 2) return '🥉'
    return '🥔'
  }

  const getRankTitle = (index: number) => {
    if (index === 0) return '头游'
    if (index === 1) return '二游'
    if (index === 2) return '三游'
    return '末游'
  }

  return (
    <div
      data-testid="game-over-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(12px)',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(to bottom right, #78350f, #000000)',
          border: '2px solid #eab308',
          borderRadius: '12px',
          padding: '2rem',
          maxWidth: '28rem',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          textAlign: 'center',
          margin: '1rem',
        }}
      >
        <h2
          style={{
            fontSize: '2.25rem',
            fontWeight: 700,
            color: '#facc15',
            marginBottom: '1.5rem',
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2))',
          }}
        >
          游戏结束
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {rankings.map((seat, index) => (
            <div
              key={seat}
              data-testid={`ranking-${index}`}
              data-seat={seat}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '0.75rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getRankEmoji(index)}</span>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: '1.125rem',
                    color: 'white',
                  }}
                >
                  {seat === mySeat ? '我' : `座位 ${seat}`}
                </span>
              </div>
              <span
                style={{
                  color: '#fef08a',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                {getRankTitle(index)}
              </span>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: '2rem',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {isOwner ? (
            <button
              onClick={onRestart}
              style={{
                backgroundColor: '#eab308',
                color: 'black',
                fontWeight: 600,
                padding: '0.75rem 2rem',
                borderRadius: '9999px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                cursor: 'pointer',
                fontSize: '1rem',
                border: 'none',
                transition: 'opacity 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.opacity = '0.9'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = '1'
              }}
            >
              再来一局
            </button>
          ) : (
            <div style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              等待房主开始新游戏...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
