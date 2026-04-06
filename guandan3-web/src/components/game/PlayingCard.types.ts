export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export type CardSize = 'sm' | 'md' | 'lg'

export interface PlayingCardProps {
  suit: CardSuit
  rank: CardRank
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  size?: CardSize
  className?: string
}

export interface CardBackProps {
  size?: CardSize
  className?: string
  backColor?: 'blue' | 'red'
}
