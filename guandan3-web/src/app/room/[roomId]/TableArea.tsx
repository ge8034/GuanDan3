'use client'

import { memo, useCallback, useState } from 'react'
import { Card } from '@/lib/store/game'
import { CardView } from './CardView'

export type TableAreaProps = {
  roomStatus?: string | null
  membersCount: number
  myMemberReady: boolean | null
  onToggleReady: (nextReady: boolean) => void
  lastAction: { seatNo: number; type: 'play' | 'pass'; cards?: Card[] } | null
  mySeat: number
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

  const baseStyle: React.CSSProperties = {
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '2px solid',
    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: disabled ? 0.5 : 1,
    transform: !disabled ? 'scale(1.05)' : 'scale(1)',
    ...style,
  }

  const variantStyles = {
    primary: {
      backgroundColor: isHovered && !disabled ? '#10b981' : '#059669',
      borderColor: '#059669',
      color: 'white',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    },
    outline: {
      backgroundColor: isHovered && !disabled ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
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

function TableAreaComponent({
  roomStatus,
  membersCount,
  myMemberReady,
  onToggleReady,
  lastAction,
  mySeat,
}: TableAreaProps) {
  const isPass = lastAction?.type === 'pass'

  const handleToggleReady = useCallback(() => {
    if (myMemberReady !== null) {
      onToggleReady(!myMemberReady)
    }
  }, [myMemberReady, onToggleReady])

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '384px',
        height: '192px',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        transition: 'all 0.3s ease-out',
        backdropFilter: 'blur(4px)',
        boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.1)',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '2px solid rgba(255, 255, 255, 0.1)',
        overflow: 'hidden',
      }}
    >
      {/* 背景装饰 */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: 0.1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: '128px',
            height: '128px',
            border: '2px solid white',
            borderRadius: '50%',
          }}
        />
      </div>

      {roomStatus === 'open' ? (
        <div
          style={{
            textAlign: 'center',
            zIndex: 10,
            padding: '0.5rem',
          }}
        >
          <div
            style={{
              color: 'rgba(255, 255, 255, 0.8)',
              marginBottom: '1rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              fontWeight: 500,
              filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
            }}
          >
            等待玩家加入...（{membersCount}/4）
          </div>
          {myMemberReady !== null && (
            <InlineButton
              onClick={handleToggleReady}
              data-testid="room-ready-toggle"
              variant={myMemberReady ? 'outline' : 'primary'}
              style={{
                borderColor: myMemberReady ? 'rgba(255, 255, 255, 0.5)' : '#059669',
                backgroundColor: myMemberReady ? 'transparent' : '#059669',
                color: 'white',
              }}
            >
              {myMemberReady ? '取消准备' : '准备'}
            </InlineButton>
          )}
        </div>
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          {lastAction ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                zIndex: 10,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '12px',
                  fontSize: '0.625rem',
                  fontFamily: 'monospace',
                  color: 'rgba(255, 255, 255, 0.9)',
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '6px',
                  zIndex: 20,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(4px)',
                  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)',
                }}
              >
                上一手：{lastAction.seatNo === mySeat ? '我' : `座位 ${lastAction.seatNo}`}
              </div>

              {isPass ? (
                <div
                  style={{
                    color: 'rgba(255, 255, 255, 0.8)',
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    letterSpacing: '0.25em',
                    fontFamily: 'serif',
                    filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2))',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }}
                >
                  过牌
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    paddingLeft: '2rem',
                    paddingRight: '2rem',
                    paddingTop: '0.25rem',
                    paddingBottom: '0.5rem',
                    overflow: 'visible',
                    maxWidth: '100%',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                    gap: '0.5rem',
                  }}
                >
                  {lastAction.cards?.map((card, i) => (
                    <div
                      key={card.id}
                      style={{
                        transform: `rotate(${(i - (lastAction.cards!.length - 1) / 2) * 5}deg)`,
                      }}
                    >
                      <CardView card={card} variant="table" index={i} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pointerEvents: 'none',
              }}
            >
              <div
                style={{
                  color: 'white',
                  fontSize: '3.5rem',
                  marginBottom: '0.5rem',
                  opacity: 0.5,
                  animation: 'pulse 1.5s ease-in-out infinite',
                }}
              >
                ♣
              </div>
              <div
                style={{
                  color: 'white',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  opacity: 0.7,
                }}
              >
                新一轮
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const TableArea = memo(TableAreaComponent)
