import { Card } from '@/lib/store/game'
import { TRIBUTE_THRESHOLDS } from './rules-constants'
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
  // 抗贡需要双大王（两张红大王 hr）
  const jokers = hand.filter(c => c.suit === 'J')
  // 检查是否同时有两张红大王
  const redJokerCount = jokers.filter(c => c.rank === 'hr').length
  return redJokerCount >= 2
}

export function analyzeResistCapability(hand: Card[], levelRank: number): ResistResult {
  // 新规则：需要双红大王才能抗贡
  const redJokerCount = hand.filter(c => c.suit === 'J' && c.rank === 'hr').length

  if (redJokerCount < 2) {
    return {
      canResist: false,
      reason: '没有双红大王，无法抗贡',
      strategy: 'defensive'
    }
  }

  // 有双红大王，可以抗贡
  const nonJokerCards = hand.filter(c => c.suit !== 'J')

  if (nonJokerCards.length === 0) {
    return {
      canResist: true,
      reason: '只有双红大王，必须抗贡',
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

  if (bestCard.val >= TRIBUTE_THRESHOLDS.AGGRESSIVE_CARD) { // A or higher
    return {
      canResist: true,
      reason: '最大进贡牌为A或更大，建议抗贡',
      strategy: 'aggressive'
    }
  }

  const highCards = nonJokerCards.filter(card => card.val >= TRIBUTE_THRESHOLDS.MEDIUM_HIGH_CARD)
  if (highCards.length >= TRIBUTE_THRESHOLDS.HIGH_CARD_COUNT) {
    return {
      canResist: true,
      reason: '有3张以上大牌（10及以上），建议抗贡',
      strategy: 'balanced'
    }
  }

  const veryHighCards = nonJokerCards.filter(card => card.val >= TRIBUTE_THRESHOLDS.HIGH_CARD) // Q and above
  if (veryHighCards.length >= TRIBUTE_THRESHOLDS.VERY_HIGH_CARD_COUNT) {
    return {
      canResist: true,
      reason: '有2张以上大牌（Q及以上），可以抗贡',
      strategy: 'balanced'
    }
  }

  // 有双红大王，即使牌力不足也可以抗贡
  return {
    canResist: true,
    reason: '有双红大王，可以抗贡',
    strategy: 'aggressive'
  }
}

export function shouldResistTribute(hand: Card[], levelRank: number): boolean {
  const analysis = analyzeResistCapability(hand, levelRank)
  return analysis.canResist
}

export function findBestTributeCard(hand: Card[], levelRank: number): Card | null {
  if (hand.length === 0) return null

  // 检查是否有王，新规则：有王必须进贡
  const jokers = hand.filter(c => c.suit === 'J')

  const validCards = hand.filter(card => {
    // 不能进逢人配（红桃级牌）
    if (card.suit === 'H' && card.val === levelRank) return false
    // 王可以进贡（新规则：有王必须进贡）
    // 进贡牌必须>=10
    if (card.val < TRIBUTE_THRESHOLDS.MIN_CARD_VALUE) return false
    return true
  })

  if (validCards.length === 0) return null

  // 如果手中有王，优先进贡王
  const validJokers = jokers.filter(card => {
    return validCards.some(c => c.id === card.id)
  })

  if (validJokers.length > 0) {
    return validJokers[0]
  }

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

  // 新规则：还贡一张小于10的牌
  const validCards = availableHand.filter(card => card.val < 10)

  if (validCards.length === 0) return null

  const sortedHand = validCards.sort((a, b) => {
    const valueA = getCardValue(a, levelRank)
    const valueB = getCardValue(b, levelRank)

    if (valueA !== valueB) {
      return valueA - valueB
    }

    const suitOrder = { 'D': 4, 'C': 3, 'H': 2, 'S': 1 }
    return suitOrder[b.suit as keyof typeof suitOrder] - suitOrder[a.suit as keyof typeof suitOrder]
  })

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

  // 新规则：检查失败方是否有双王
  let losingTeamHasJoker = false
  for (const [seat, hand] of Object.entries(loserHands)) {
    if (canResistTribute(hand)) {
      losingTeamHasJoker = true
      break
    }
  }

  // 如果失败方有双王，两人都无需进贡
  if (losingTeamHasJoker) {
    return {
      isTributePhase: false,
      tributeFrom: [],
      tributeTo,
      resistTribute: []
    }
  }

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
    // 新规则：有王必须进贡，所以王是有效的进贡牌
    return { valid: true, reason: '王可以进贡' }
  }

  // 不能进逢人配（红桃级牌）
  if (card.suit === 'H' && card.val === levelRank) {
    return { valid: false, reason: '不能进逢人配（红桃级牌）' }
  }

  // 进贡牌必须>=10
  if (card.val < TRIBUTE_THRESHOLDS.MIN_CARD_VALUE) {
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

  // 新规则：还贡牌必须小于10
  if (card.val >= 10) {
    return { valid: false, reason: '还贡牌必须小于10' }
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
  // V2 规则：末游 (4th) 向头游 (1st) 进贡，三游 (3rd) 向二游 (2nd) 进贡

  // 从rankings中提取需要进贡的座位（保持排名顺序：从头游到末游）
  const rankedFrom: number[] = rankings.filter(r => tributeFrom.includes(r))
  // 从rankings中提取接收进贡的座位（保持排名顺序：从头游到末游）
  const rankedTo: number[] = rankings.filter(r => tributeTo.includes(r))

  // 末游向头游进贡：反转进贡方，使末游在前
  const reversedFrom = [...rankedFrom].reverse()

  for (let i = 0; i < Math.min(reversedFrom.length, rankedTo.length); i++) {
    pairs.push({
      from: reversedFrom[i],    // 末游、三游...
      to: rankedTo[i]           // 头游、二游...
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
