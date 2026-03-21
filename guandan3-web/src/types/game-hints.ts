export interface CardHint {
  cards: number[]
  hintType: 'suggested' | 'warning' | 'info'
  reason: string
  confidence: number
  impact: 'positive' | 'negative' | 'neutral'
}

export interface PlaySuggestion {
  cards: number[]
  playType: string
  reason: string
  confidence: number
  expectedOutcome: 'win' | 'lose' | 'draw'
  riskLevel: 'low' | 'medium' | 'high'
}

export interface StrategyAdvice {
  type: 'offensive' | 'defensive' | 'balanced'
  advice: string
  priority: number
  context: string
}

export interface WinProbability {
  current: number
  afterPlay: number
  change: number
  factors: {
    factor: string
    impact: number
    description: string
  }[]
}

export interface TeammateAnalysis {
  userId: string
  handStrength: number
  playStyle: 'aggressive' | 'conservative' | 'balanced'
  suggestions: string[]
  cooperationLevel: number
}

export interface OpponentAnalysis {
  userId: string
  handStrength: number
  playStyle: 'aggressive' | 'conservative' | 'balanced'
  weaknesses: string[]
  threats: string[]
}

export interface GameHintContext {
  currentHand: number[]
  lastPlay: number[] | null
  teamScore: number
  opponentScore: number
  turnNo: number
  isTeammateTurn: boolean
  gamePhase: 'early' | 'mid' | 'late'
}
