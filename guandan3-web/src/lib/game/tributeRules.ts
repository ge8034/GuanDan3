import { Card } from '@/lib/store/game'
import { getCardValue } from './rules'

export interface TributeResult {
  canResist: boolean
  tributeCard: Card | null
  returnCard: Card | null
  reason: string
}

export interface TributeState {
  isTributePhase: boolean
  tributeFrom: number[] // Seats that need to tribute
  tributeTo: number[] // Seats that receive tribute
  resistTribute: number[] // Seats that resist tribute
}

export interface ResistResult {
  canResist: boolean
  reason: string
  strategy: 'aggressive' | 'defensive' | 'balanced'
}

export function canResistTribute(hand: Card[]): boolean {
  // 抗贡需要双王（红大王+黑小王）
  const jokers = hand.filter(c => c.suit === 'J')
  // 检查是否同时有红王和黑王
  const hasRedJoker = jokers.some(c => c.rank === 'hr')
  const hasBlackJoker = jokers.some(c => c.rank === 'hb' || c.rank === 'sb')
  return hasRedJoker && hasBlackJoker
}

export function analyzeResistCapability(hand: Card[], levelRank: number): ResistResult {
  if (!canResistTribute(hand)) {
    return {
      canResist: false,
      reason: '没有双王，无法抗贡',
      strategy: 'defensive'
    }
  }

  const jokers = hand.filter(c => c.suit === 'J')
  const nonJokerCards = hand.filter(c => c.suit !== 'J')

  if (nonJokerCards.length === 0) {
    return {
      canResist: true,
      reason: '只有双王，必须抗贡',
      strategy: 'aggressive'
    }
  }

  // 检查是否所有非王牌都是级牌
  const allNonJokersAreLevelCards = nonJokerCards.every(card => card.val === levelRank)
  if (allNonJokersAreLevelCards) {
    return {
      canResist: true,
      reason: '都是级牌，必须抗贡',
      strategy: 'aggressive'
    }
  }

  // 检查最大牌的值
  const sortedCards = nonJokerCards.sort((a, b) => b.val - a.val)
  const bestCard = sortedCards[0]

  if (bestCard.val >= 14) { // A or higher
    return {
      canResist: true,
      reason: '最大进贡牌为A或更大，建议抗贡',
      strategy: 'aggressive'
    }
  }

  const highCards = nonJokerCards.filter(card => card.val >= 10)
  if (highCards.length >= 3) {
    return {
      canResist: true,
      reason: '有3张以上大牌（10及以上），建议抗贡',
      strategy: 'balanced'
    }
  }

  const veryHighCards = nonJokerCards.filter(card => card.val >= 12) // Q and above
  if (veryHighCards.length >= 2) {
    return {
      canResist: true,
      reason: '有2张以上大牌（Q及以上），可以抗贡',
      strategy: 'balanced'
    }
  }

  return {
    canResist: false,
    reason: '牌力不足，不建议抗贡',
    strategy: 'defensive'
  }
}

export function shouldResistTribute(hand: Card[], levelRank: number): boolean {
  const analysis = analyzeResistCapability(hand, levelRank)
  return analysis.canResist
}

export function findBestTributeCard(hand: Card[], levelRank: number): Card | null {
  if (hand.length === 0) return null

  const validCards = hand.filter(card => {
    // 不能进贡王
    if (card.suit === 'J') return false
    // 级牌可以进贡（新规则）
    // 进贡牌必须>=10（新规则）
    if (card.val < 10) return false
    return true
  })

  if (validCards.length === 0) return null

  const sortedHand = validCards.sort((a, b) => {
    const valueA = getCardValue(a, levelRank)
    const valueB = getCardValue(b, levelRank)

    if (valueA !== valueB) {
      return valueB - valueA
    }

    const suitOrder = { 'S': 4, 'H': 3, 'C': 2, 'D': 1 }
    return suitOrder[b.suit as keyof typeof suitOrder] - suitOrder[a.suit as keyof typeof suitOrder]
  })

  return sortedHand[0]
}

export function findBestReturnCard(
  hand: Card[], 
  levelRank: number, 
  excludeCard: Card | null,
  tributeCard: Card | null
): Card | null {
  if (hand.length === 0) return null
  
  const availableHand = excludeCard 
    ? hand.filter(c => c.id !== excludeCard.id)
    : [...hand]
  
  if (availableHand.length === 0) return null
  
  const sortedHand = availableHand.sort((a, b) => {
    const valueA = getCardValue(a, levelRank)
    const valueB = getCardValue(b, levelRank)
    
    if (valueA !== valueB) {
      return valueA - valueB
    }
    
    const suitOrder = { 'D': 4, 'C': 3, 'H': 2, 'S': 1 }
    return suitOrder[b.suit as keyof typeof suitOrder] - suitOrder[a.suit as keyof typeof suitOrder]
  })
  
  if (tributeCard) {
    const tributeValue = getCardValue(tributeCard, levelRank)
    
    const suitableCards = sortedHand.filter(card => {
      const cardValue = getCardValue(card, levelRank)
      return cardValue <= tributeValue + 2
    })
    
    if (suitableCards.length > 0) {
      return suitableCards[0]
    }
  }
  
  return sortedHand[0]
}

export function calculateTribute(
  winnerSeat: number,
  loserSeat: number,
  winnerHand: Card[],
  loserHand: Card[],
  levelRank: number
): TributeResult {
  const resistAnalysis = analyzeResistCapability(loserHand, levelRank)
  
  if (resistAnalysis.canResist) {
    return {
      canResist: true,
      tributeCard: null,
      returnCard: null,
      reason: resistAnalysis.reason
    }
  }
  
  const tributeCard = findBestTributeCard(loserHand, levelRank)
  
  if (!tributeCard) {
    return {
      canResist: false,
      tributeCard: null,
      returnCard: null,
      reason: '无法完成进贡还贡（没有有效的进贡牌）'
    }
  }
  
  const returnCard = findBestReturnCard(winnerHand, levelRank, null, tributeCard)
  
  if (!returnCard) {
    return {
      canResist: false,
      tributeCard: null,
      returnCard: null,
      reason: '无法完成进贡还贡（没有有效的还贡牌）'
    }
  }
  
  return {
    canResist: false,
    tributeCard,
    returnCard,
    reason: `进贡：${tributeCard.rank}${getSuitSymbol(tributeCard.suit)}，还贡：${returnCard.rank}${getSuitSymbol(returnCard.suit)}`
  }
}

export function calculateTeamTribute(
  winningTeam: number,
  losingTeam: number,
  winnerHands: Record<number, Card[]>,
  loserHands: Record<number, Card[]>,
  levelRank: number
): TributeState {
  const tributeFrom: number[] = []
  const tributeTo: number[] = []
  const resistTribute: number[] = []
  
  for (const [seat, hand] of Object.entries(loserHands)) {
    const seatNum = parseInt(seat)
    const team = seatNum % 2
    
    if (team === losingTeam) {
      const resistAnalysis = analyzeResistCapability(hand, levelRank)
      if (resistAnalysis.canResist) {
        resistTribute.push(seatNum)
      } else {
        tributeFrom.push(seatNum)
      }
    }
  }
  
  for (const [seat, hand] of Object.entries(winnerHands)) {
    const seatNum = parseInt(seat)
    const team = seatNum % 2
    
    if (team === winningTeam) {
      tributeTo.push(seatNum)
    }
  }
  
  return {
    isTributePhase: tributeFrom.length > 0 || resistTribute.length > 0,
    tributeFrom,
    tributeTo,
    resistTribute
  }
}

export function applyTribute(
  hand: Card[],
  tributeCard: Card,
  returnCard: Card | null
): Card[] {
  const newHand = [...hand]
  
  const tributeIndex = newHand.findIndex(c => c.id === tributeCard.id)
  if (tributeIndex !== -1) {
    newHand.splice(tributeIndex, 1)
  }
  
  if (returnCard) {
    newHand.push(returnCard)
  }
  
  return newHand.sort((a, b) => {
    const valueA = getCardValue(a, 2)
    const valueB = getCardValue(b, 2)
    return valueB - valueA
  })
}

export function validateTributeCard(
  card: Card,
  hand: Card[],
  levelRank: number
): { valid: boolean; reason: string } {
  const cardInHand = hand.some(c => c.id === card.id)

  if (!cardInHand) {
    return { valid: false, reason: '进贡牌不在手中' }
  }

  if (card.suit === 'J') {
    return { valid: false, reason: '不能进贡王' }
  }

  // 级牌不能进贡
  if (card.val === levelRank) {
    return { valid: false, reason: '不能进贡级牌' }
  }

  // 进贡牌必须>=10
  if (card.val < 10) {
    return { valid: false, reason: '进贡牌必须大于等于10' }
  }

  return { valid: true, reason: '有效进贡牌' }
}

export function validateReturnCard(
  card: Card,
  hand: Card[],
  levelRank: number,
  excludeCard: Card | null
): { valid: boolean; reason: string } {
  const availableHand = excludeCard 
    ? hand.filter(c => c.id !== excludeCard.id)
    : hand
  
  const cardInHand = availableHand.some(c => c.id === card.id)
  
  if (!cardInHand) {
    return { valid: false, reason: '还贡牌不在手中' }
  }
  
  return { valid: true, reason: '有效还贡牌' }
}

function getSuitSymbol(suit: Card['suit']): string {
  const symbols = {
    'H': '♥',
    'D': '♦',
    'C': '♣',
    'S': '♠',
    'J': '★'
  }
  return symbols[suit] || suit
}

export function getTributePairs(
  tributeFrom: number[],
  tributeTo: number[],
  rankings: number[]
): Array<{ from: number; to: number }> {
  const pairs: Array<{ from: number; to: number }> = []

  // rankings[0] = 头游, rankings[1] = 二游, rankings[2] = 三游, rankings[3] = 四游
  // 输家按排名顺序排序（从前到后）
  const sortedFrom = [...tributeFrom].sort((a, b) => {
    const rankA = rankings.indexOf(a)
    const rankB = rankings.indexOf(b)
    return rankA - rankB
  })

  // 赢家按排名顺序排序（从前到后）
  const sortedTo = [...tributeTo].sort((a, b) => {
    const rankA = rankings.indexOf(a)
    const rankB = rankings.indexOf(b)
    return rankA - rankB
  })

  // 按顺序配对：第一个输家向第一个赢家进贡，以此类推
  for (let i = 0; i < Math.min(sortedFrom.length, sortedTo.length); i++) {
    pairs.push({
      from: sortedFrom[i],
      to: sortedTo[i]
    })
  }

  return pairs
}

export function calculateTributeAdvantage(
  tributeCard: Card,
  returnCard: Card,
  levelRank: number
): { advantage: number; description: string } {
  const tributeValue = getCardValue(tributeCard, levelRank)
  const returnValue = getCardValue(returnCard, levelRank)
  const advantage = returnValue - tributeValue
  
  if (advantage > 5) {
    return {
      advantage,
      description: '还贡方大优'
    }
  } else if (advantage > 2) {
    return {
      advantage,
      description: '还贡方小优'
    }
  } else if (advantage > -2) {
    return {
      advantage,
      description: '双方平衡'
    }
  } else if (advantage > -5) {
    return {
      advantage,
      description: '进贡方小优'
    }
  } else {
    return {
      advantage,
      description: '进贡方大优'
    }
  }
}
