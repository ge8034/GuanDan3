import { memo, useMemo } from 'react'
import type { Card } from '@/lib/store/game'

type CardViewVariant = 'hand' | 'table'

export type CardViewProps = {
  card: Card
  variant: CardViewVariant
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  style?: React.CSSProperties
  index?: number
}

// 扑克牌花色颜色
const SUIT_COLORS: Record<string, string> = {
  H: '#dc2626',
  D: '#dc2626',
  C: '#1a1a1a',
  S: '#1a1a1a',
  J: '#1a1a1a',
}

// 扑克牌花色符号
const SUIT_SYMBOLS: Record<string, string> = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠',
  J: '★',
}

const getSuitIcon = (suit: Card['suit']) => {
  return SUIT_SYMBOLS[suit] || suit
}

const getCardColor = (card: Card) => {
  if (card.suit === 'H' || card.suit === 'D') return '#dc2626'
  if (card.suit === 'J' && card.rank === 'hr') return '#dc2626'
  return '#1a1a1a'
}

const getRankDisplay = (card: Card) => {
  if (card.suit === 'J') return card.rank === 'hr' ? '红' : '黑'
  return card.rank
}

// 扑克牌样式
function getCardStyles(
  variant: CardViewVariant,
  selected: boolean,
  color: string,
  rank: string,
  icon: string
): {
  container: React.CSSProperties
  topBottom: React.CSSProperties
  center: React.CSSProperties
} {
  const isHand = variant === 'hand'

  const baseWidth = isHand ? 80 : 64
  const baseHeight = isHand ? 112 : 96

  return {
    container: {
      width: `${baseWidth}px`,
      height: `${baseHeight}px`,
      borderRadius: '8px',
      border: selected ? '3px solid #facc15' : '2px solid #d1d5db',
      backgroundColor: 'white',
      boxShadow: selected
        ? '0 8px 16px rgba(250, 204, 21, 0.4)'
        : '0 2px 8px rgba(0, 0, 0, 0.15)',
      position: 'relative' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'serif',
      cursor: disabled ? 'default' : 'pointer',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      transform: selected ? 'translateY(-12px)' : 'translateY(0)',
      userSelect: 'none',
    },
    topBottom: {
      fontSize: isHand ? '14px' : '12px',
      fontWeight: 600,
      color,
    },
    center: {
      fontSize: isHand ? '40px' : '32px',
      color,
      fontWeight: 400,
    },
  }
}

const CardViewComponent = ({ card, variant, selected, disabled, onClick, style, index = 0 }: CardViewProps) => {
  const color = useMemo(() => getCardColor(card), [card])
  const rank = useMemo(() => getRankDisplay(card), [card])
  const icon = useMemo(() => getSuitIcon(card.suit), [card.suit])

  const { container: cardStyles, topBottom, center } = useMemo(
    () => getCardStyles(variant, selected || false, color, rank, icon),
    [variant, selected, color, rank, icon]
  )

  return (
    <div
      data-card-id={card.id}
      onClick={disabled ? undefined : onClick}
      aria-disabled={disabled || undefined}
      style={{ ...cardStyles, ...style, zIndex: index }}
      onMouseEnter={(e) => {
        if (!disabled && variant === 'hand' && !selected) {
          e.currentTarget.style.transform = 'translateY(-6px)'
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)'
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled && variant === 'hand' && !selected) {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'
        }
      }}
    >
      {/* 左上角 */}
      <div
        style={{
          position: 'absolute',
          top: '6px',
          left: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
        }}
      >
        <span style={topBottom}>{rank}</span>
        <span style={{ fontSize: '12px', color }}>{icon}</span>
      </div>

      {/* 中心花色 */}
      <span style={center}>{icon}</span>

      {/* 右下角（倒置） */}
      <div
        style={{
          position: 'absolute',
          bottom: '6px',
          right: '6px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          lineHeight: 1,
          transform: 'rotate(180deg)',
        }}
      >
        <span style={topBottom}>{rank}</span>
        <span style={{ fontSize: '12px', color }}>{icon}</span>
      </div>
    </div>
  )
}

export const CardView = memo(CardViewComponent, (prevProps, nextProps) => {
  return (
    prevProps.card.id === nextProps.card.id &&
    prevProps.card.suit === nextProps.card.suit &&
    prevProps.card.rank === nextProps.card.rank &&
    prevProps.card.val === nextProps.card.val &&
    prevProps.variant === nextProps.variant &&
    prevProps.selected === nextProps.selected &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.index === nextProps.index
  )
})
