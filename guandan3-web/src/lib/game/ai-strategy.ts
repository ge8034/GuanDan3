import { Card } from '@/lib/store/game'
import { getCardValue, analyzeMove, canBeat } from './rules'
import { AIMove, AIDifficulty, MoveEvaluation, TeammateSituation } from './ai-types'
import { 
  calculateHandStrength, 
  assessRisk, 
  calculateControlScore,
  analyzeCardDistribution,
  estimateMovesToClear
} from './ai-utils'
import { analyzeHand } from './ai-pattern-recognition'

export function shouldPlayAggressive(
  handStrength: number,
  controlScore: number,
  isLeading: boolean
): boolean {
  if (isLeading) {
    return handStrength > 60 && controlScore > 50
  }
  return handStrength > 80 && controlScore > 70
}

export function shouldPlayDefensive(
  handStrength: number,
  controlScore: number,
  isLeading: boolean
): boolean {
  if (isLeading) {
    return handStrength < 40 || controlScore < 30
  }
  return handStrength < 50 || controlScore < 40
}

export function shouldPlayAggressiveAdjusted(
  handStrength: number,
  controlScore: number,
  isLeading: boolean,
  difficulty: AIDifficulty
): boolean {
  const baseAggressive = shouldPlayAggressive(handStrength, controlScore, isLeading)
  
  if (difficulty === 'easy') {
    return baseAggressive && Math.random() > 0.3
  } else if (difficulty === 'medium') {
    return baseAggressive && Math.random() > 0.15
  } else {
    return baseAggressive
  }
}

export function shouldPlayDefensiveAdjusted(
  handStrength: number,
  controlScore: number,
  isLeading: boolean,
  difficulty: AIDifficulty
): boolean {
  const baseDefensive = shouldPlayDefensive(handStrength, controlScore, isLeading)
  
  if (difficulty === 'easy') {
    return baseDefensive && Math.random() > 0.3
  } else if (difficulty === 'medium') {
    return baseDefensive && Math.random() > 0.15
  } else {
    return baseDefensive
  }
}

export function assessTeammateSituation(
  teammateCards: Card[],
  levelRank: number,
  lastPlay: Card[] | null
): TeammateSituation {
  const distribution = analyzeCardDistribution(teammateCards, levelRank)
  const controlScore = calculateControlScore(
    teammateCards.length,
    distribution.strongCards,
    distribution.hasJokers,
    levelRank
  )
  
  const isLeading = !lastPlay || lastPlay.length === 0
  const isStrong = controlScore > 50
  const needsSupport = controlScore < 30 || distribution.weakCards > 5
  const canLead = isLeading || (lastPlay && lastPlay.length > 0)
  
  return { isLeading, isStrong, needsSupport, canLead }
}

export function findBestSupportMove(
  hand: Card[],
  lastPlay: Card[],
  levelRank: number,
  teammateSituation: TeammateSituation
): AIMove {
  const analysis = analyzeHand(hand, levelRank)
  const validMoves: AIMove[] = []
  const lastMove = analyzeMove(lastPlay, levelRank)
  if (!lastMove) return { type: 'pass' }
  
  if (teammateSituation.needsSupport) {
    analysis.bombs.forEach(bomb => {
      const move = analyzeMove(bomb, levelRank)
      if (move && canBeat(move, lastMove)) {
        validMoves.push({ type: 'play', cards: bomb })
      }
    })
  }
  
  if (validMoves.length === 0) {
    analysis.sequenceTriplesWithWings.forEach(move => {
      const m = analyzeMove(move, levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    analysis.fullHouses.forEach(move => {
      const m = analyzeMove(move, levelRank)
      if (m && canBeat(m, lastMove)) {
        validMoves.push({ type: 'play', cards: move })
      }
    })
  }
  
  if (validMoves.length === 0) {
    return { type: 'pass' }
  }
  
  return validMoves[Math.floor(Math.random() * validMoves.length)]
}

export function evaluateMove(
  move: AIMove,
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty,
  isLeading: boolean
): MoveEvaluation {
  if (move.type === 'pass') {
    return {
      move,
      score: 0,
      risk: 0,
      benefit: 0,
      reasoning: 'No valid moves available'
    }
  }
  
  const moveCards = move.cards!
  const analysis = analyzeMove(moveCards, levelRank)
  const distribution = analyzeCardDistribution(hand, levelRank)
  const controlScore = calculateControlScore(
    hand.length,
    distribution.strongCards,
    distribution.hasJokers,
    levelRank
  )
  
  let score = 0
  let risk = 0
  let benefit = 0
  const reasoning: string[] = []
  
  const handStrength = calculateHandStrength(
    hand.length,
    moveCards.reduce((sum, card) => sum + getCardValue(card, levelRank), 0),
    analysis?.type || 'unknown'
  )
  
  if (isLeading) {
    score += 20
    reasoning.push('Leading play')
  }
  
  const moveValue = moveCards.reduce((sum, card) => sum + getCardValue(card, levelRank), 0)
  score += moveValue * 2
  reasoning.push(`Move value: ${moveValue}`)
  
  const cardsPlayed = moveCards.length
  score += cardsPlayed * 5
  reasoning.push(`Cards played: ${cardsPlayed}`)
  
  const riskAssessment = assessRisk(moveCards, hand, levelRank, isLeading)
  risk = riskAssessment
  score -= risk * 0.5
  reasoning.push(`Risk: ${riskAssessment}`)
  
  const estimatedMoves = estimateMovesToClear(hand, levelRank)
  benefit = estimatedMoves * 3
  reasoning.push(`Estimated moves to clear: ${estimatedMoves}`)
  
  if (analysis?.type === 'bomb') {
    score += 30
    reasoning.push('Bomb play')
  }
  
  if (analysis?.type === 'sequenceTriplesWithWings') {
    score += 25
    reasoning.push('Sequence triple with wing')
  }
  
  if (analysis?.type === 'bomb' && moveCards.length === 6) {
    score += 20
    reasoning.push('Quad with two')
  }
  
  const remainingCards = hand.length - cardsPlayed
  if (remainingCards <= 5) {
    score += 15
    reasoning.push('Near end of hand')
  }
  
  if (difficulty === 'easy') {
    score *= 0.7
  } else if (difficulty === 'medium') {
    score *= 0.85
  }
  
  return {
    move,
    score: Math.max(0, score),
    risk,
    benefit,
    reasoning: reasoning.join(', ')
  }
}

export function findOptimalMove(
  hand: Card[],
  lastPlay: Card[] | null,
  levelRank: number,
  difficulty: AIDifficulty,
  isLeading: boolean,
  teammateSituation?: TeammateSituation
): AIMove {
  const analysis = analyzeHand(hand, levelRank)
  const validMoves: AIMove[] = []
  const lastMove = lastPlay && lastPlay.length > 0 ? analyzeMove(lastPlay, levelRank) : null
  
  const allPossibleMoves = [
    ...analysis.singles,
    ...analysis.pairs,
    ...analysis.triples,
    ...analysis.bombs,
    ...analysis.straights,
    ...analysis.fullHouses,
    ...analysis.sequencePairs,
    ...analysis.sequenceTriples,
    ...analysis.sequenceTriplesWithWings,
    ...analysis.quadsWithTwo
  ]
  
  allPossibleMoves.forEach(move => {
    const m = analyzeMove(move, levelRank)
    if (!m) return
    if (!lastMove) {
      validMoves.push({ type: 'play', cards: move })
      return
    }
    if (canBeat(m, lastMove)) validMoves.push({ type: 'play', cards: move })
  })
  
  if (validMoves.length === 0) {
    return { type: 'pass' }
  }
  
  if (teammateSituation && teammateSituation.needsSupport && lastPlay && lastPlay.length > 0) {
    const supportMove = findBestSupportMove(hand, lastPlay, levelRank, teammateSituation)
    if (supportMove.type === 'play') {
      return supportMove
    }
  }
  
  const evaluatedMoves = validMoves.map(move => 
    evaluateMove(move, hand, lastPlay, levelRank, difficulty, isLeading)
  )
  
  evaluatedMoves.sort((a, b) => b.score - a.score)
  
  const topMoves = evaluatedMoves.slice(0, Math.min(3, evaluatedMoves.length))
  
  if (difficulty === 'easy') {
    return topMoves[Math.floor(Math.random() * topMoves.length)].move
  } else if (difficulty === 'medium') {
    const randomIndex = Math.random() < 0.7 ? 0 : Math.floor(Math.random() * topMoves.length)
    return topMoves[randomIndex].move
  } else {
    return topMoves[0].move
  }
}

export function adjustDifficulty(
  currentDifficulty: AIDifficulty,
  winRate: number,
  recentPerformance: number[]
): AIDifficulty {
  if (recentPerformance.length === 0) return currentDifficulty

  if (winRate > 0.7 && recentPerformance.every(p => p > 0.8)) {
    if (currentDifficulty !== 'hard') {
      return 'hard'
    }
  } else if (winRate < 0.3 && recentPerformance.every(p => p < 0.4)) {
    if (currentDifficulty !== 'easy') {
      return 'easy'
    }
  }
  
  return currentDifficulty
}
