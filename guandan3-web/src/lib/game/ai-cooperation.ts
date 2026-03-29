import { Card } from '@/lib/store/game'
import { AIMove, AIDifficulty } from './ai-types'
import { analyzeMove, canBeat, getCardValue } from './rules'
import { analyzeHand } from './ai-pattern-recognition'
import { calculateControlScore, analyzeCardDistribution } from './ai-utils'

export interface CooperationStrategy {
  shouldSupport: boolean
  supportType: 'aggressive' | 'defensive' | 'balanced'
  priority: number
  reasoning: string
}

export interface TeammateAnalysis {
  seat: number
  handSize: number
  controlScore: number
  isLeading: boolean
  isStrong: boolean
  needsSupport: boolean
  canLead: boolean
  estimatedMoves: number
  hasBombs: boolean
  hasJokers: boolean
}

export interface GameContext {
  currentSeat: number
  mySeat: number
  levelRank: number
  lastPlay: Card[] | null
  lastPlaySeat: number | null
  turnNo: number
  cardsPlayed: number
}

export function analyzeTeammate(
  teammateHand: Card[],
  context: GameContext
): TeammateAnalysis {
  const distribution = analyzeCardDistribution(teammateHand, context.levelRank)
  const controlScore = calculateControlScore(
    teammateHand.length,
    distribution.strongCards,
    distribution.hasJokers,
    context.levelRank
  )
  
  const analysis = analyzeHand(teammateHand, context.levelRank)
  const isLeading = !context.lastPlay || context.lastPlay.length === 0
  const isStrong = controlScore > 50
  const needsSupport = controlScore < 30 || distribution.weakCards > 5
  const canLead = isLeading || (!context.lastPlay || context.lastPlay.length === 0)
  
  const estimatedMoves = Math.ceil(teammateHand.length / 3)
  const hasBombs = analysis.bombs.length > 0
  const hasJokers = distribution.hasJokers
  
  return {
    seat: context.mySeat,
    handSize: teammateHand.length,
    controlScore,
    isLeading,
    isStrong,
    needsSupport,
    canLead,
    estimatedMoves,
    hasBombs,
    hasJokers
  }
}

export function evaluateCooperationStrategy(
  myHand: Card[],
  teammateAnalysis: TeammateAnalysis,
  context: GameContext,
  difficulty: AIDifficulty
): CooperationStrategy {
  const myDistribution = analyzeCardDistribution(myHand, context.levelRank)
  const myControlScore = calculateControlScore(
    myHand.length,
    myDistribution.strongCards,
    myDistribution.hasJokers,
    context.levelRank
  )
  
  const myAnalysis = analyzeHand(myHand, context.levelRank)
  const isTeammateLeading = context.lastPlaySeat === teammateAnalysis.seat
  
  let shouldSupport = false
  let supportType: 'aggressive' | 'defensive' | 'balanced' = 'balanced'
  let priority = 0
  const reasoning: string[] = []
  
  if (teammateAnalysis.needsSupport) {
    shouldSupport = true
    priority += 30
    reasoning.push('队友需要支持')
    
    if (myControlScore > 60 && myAnalysis.bombs.length > 0) {
      supportType = 'aggressive'
      priority += 20
      reasoning.push('我有强力牌型可以支持')
    } else if (myControlScore < 40) {
      supportType = 'defensive'
      priority -= 10
      reasoning.push('我牌力较弱，保守支持')
    }
  }
  
  if (isTeammateLeading && teammateAnalysis.isStrong) {
    shouldSupport = true
    priority += 25
    reasoning.push('队友领先且强势')
    
    if (teammateAnalysis.handSize <= 5) {
      supportType = 'aggressive'
      priority += 15
      reasoning.push('队友接近胜利，全力支持')
    }
  }
  
  if (teammateAnalysis.handSize <= 3 && !teammateAnalysis.isLeading) {
    shouldSupport = true
    priority += 35
    supportType = 'aggressive'
    reasoning.push('队友手牌很少，全力支持')
  }
  
  if (context.turnNo > 10 && teammateAnalysis.handSize > myHand.length + 5) {
    shouldSupport = false
    priority -= 20
    reasoning.push('游戏后期，队友手牌太多，优先自己出牌')
  }
  
  if (myHand.length <= 3) {
    shouldSupport = false
    priority -= 30
    reasoning.push('我手牌很少，优先自己出牌')
  }
  
  if (difficulty === 'easy') {
    priority *= 0.7
    reasoning.push('简单难度，降低支持优先级')
  } else if (difficulty === 'hard') {
    priority *= 1.2
    reasoning.push('困难难度，提高支持优先级')
  }
  
  return {
    shouldSupport: priority > 0,
    supportType,
    priority: Math.max(0, priority),
    reasoning: reasoning.join('; ')
  }
}

export function findCooperativeMove(
  myHand: Card[],
  teammateAnalysis: TeammateAnalysis,
  context: GameContext,
  strategy: CooperationStrategy
): AIMove {
  if (!strategy.shouldSupport) {
    return { type: 'pass' }
  }
  
  const myAnalysis = analyzeHand(myHand, context.levelRank)
  const lastMove = context.lastPlay && context.lastPlay.length > 0 
    ? analyzeMove(context.lastPlay, context.levelRank) 
    : null
  
  if (!lastMove) {
    return { type: 'pass' }
  }
  
  const validMoves: AIMove[] = []
  
  if (strategy.supportType === 'aggressive') {
    myAnalysis.bombs.forEach(bomb => {
      const move = analyzeMove(bomb, context.levelRank)
      if (move && canBeat(move, lastMove)) {
        validMoves.push({ type: 'play', cards: bomb })
      }
    })
  }

  if (validMoves.length === 0) {
    myAnalysis.sequenceTriples.forEach(move => {
      const m = analyzeMove(move, context.levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    myAnalysis.sequencePairs.forEach(move => {
      const m = analyzeMove(move, context.levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    myAnalysis.triples.forEach(move => {
      const m = analyzeMove(move, context.levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    myAnalysis.pairs.forEach(move => {
      const m = analyzeMove(move, context.levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    myAnalysis.singles.forEach(move => {
      const m = analyzeMove(move, context.levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    return { type: 'pass' }
  }
  
  const scoredMoves = validMoves.map(move => {
    const moveCards = move.cards!
    const moveAnalysis = analyzeMove(moveCards, context.levelRank)
    
    let score = 0
    
    if (moveAnalysis?.type === 'bomb') {
      score += 30
    }

    const cardsPlayed = moveCards.length
    score += cardsPlayed * 5
    
    const remainingCards = myHand.length - cardsPlayed
    if (remainingCards <= 5) {
      score += 15
    }
    
    if (strategy.supportType === 'aggressive') {
      score *= 1.3
    } else if (strategy.supportType === 'defensive') {
      score *= 0.7
    }
    
    return { move, score }
  })
  
  scoredMoves.sort((a, b) => b.score - a.score)
  
  return scoredMoves[0].move
}

export function shouldPassForTeammate(
  myHand: Card[],
  teammateAnalysis: TeammateAnalysis,
  context: GameContext
): boolean {
  if (!context.lastPlay || context.lastPlay.length === 0) {
    return false
  }
  
  const isTeammateNext = (context.currentSeat + 1) % 4 === teammateAnalysis.seat
  const isTeammateLeading = context.lastPlaySeat === teammateAnalysis.seat
  
  if (isTeammateLeading && teammateAnalysis.isStrong) {
    return true
  }
  
  if (teammateAnalysis.handSize <= 3 && isTeammateNext) {
    return true
  }
  
  if (myHand.length > 10 && teammateAnalysis.handSize <= 5) {
    return true
  }
  
  return false
}

export function calculateCooperationScore(
  myHand: Card[],
  teammateHand: Card[],
  context: GameContext
): number {
  const myAnalysis = analyzeTeammate(myHand, context)
  const teammateAnalysis = analyzeTeammate(teammateHand, context)
  
  let score = 0
  
  if (teammateAnalysis.needsSupport && myAnalysis.isStrong) {
    score += 30
  }
  
  if (myAnalysis.needsSupport && teammateAnalysis.isStrong) {
    score += 25
  }
  
  if (myAnalysis.hasBombs && teammateAnalysis.hasBombs) {
    score += 20
  }
  
  const handSizeDiff = Math.abs(myAnalysis.handSize - teammateAnalysis.handSize)
  if (handSizeDiff <= 3) {
    score += 15
  }
  
  if (myAnalysis.controlScore > 50 && teammateAnalysis.controlScore > 50) {
    score += 25
  }
  
  return Math.min(100, score)
}

export function getCooperationAdvice(
  myHand: Card[],
  teammateHand: Card[],
  context: GameContext
): string[] {
  const advice: string[] = []
  
  const myAnalysis = analyzeTeammate(myHand, context)
  const teammateAnalysis = analyzeTeammate(teammateHand, context)
  const cooperationScore = calculateCooperationScore(myHand, teammateHand, context)
  
  if (cooperationScore > 70) {
    advice.push('团队配合度很高，可以积极协作')
  } else if (cooperationScore > 40) {
    advice.push('团队配合度中等，适度协作')
  } else {
    advice.push('团队配合度较低，优先个人出牌')
  }
  
  if (teammateAnalysis.needsSupport && myAnalysis.isStrong) {
    advice.push('队友需要支持，可以考虑用强力牌型帮助')
  }
  
  if (myAnalysis.handSize <= 3) {
    advice.push('你手牌很少，优先争取自己出完')
  }
  
  if (teammateAnalysis.handSize <= 3) {
    advice.push('队友手牌很少，全力支持队友获胜')
  }
  
  if (myAnalysis.hasBombs && teammateAnalysis.hasBombs) {
    advice.push('双方都有炸弹，可以配合控制局面')
  }
  
  return advice
}
