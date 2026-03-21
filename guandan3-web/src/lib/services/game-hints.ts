import { CardHint, PlaySuggestion, StrategyAdvice, WinProbability, TeammateAnalysis, OpponentAnalysis, GameHintContext } from '@/types/game-hints'
import { getCardType, getCardTypeStrength } from '@/lib/utils/card-utils'
import { analyzeHandStrength } from '@/lib/utils/hand-analysis'
import { analyzeMove, canBeat } from '@/lib/game/rules'
import { Card } from '@/lib/store/game'

export class GameHintsService {
  private static instance: GameHintsService
  private hintHistory: Map<string, CardHint[]> = new Map()
  private suggestionHistory: Map<string, PlaySuggestion[]> = new Map()

  private constructor() {}

  static getInstance(): GameHintsService {
    if (!GameHintsService.instance) {
      GameHintsService.instance = new GameHintsService()
    }
    return GameHintsService.instance
  }

  generateCardHints(context: GameHintContext): CardHint[] {
    const hints: CardHint[] = []
    const { currentHand, lastPlay, gamePhase } = context

    if (lastPlay && lastPlay.length > 0) {
      const lastPlayType = getCardType(lastPlay)
      const validPlays = this.findValidPlays(currentHand, lastPlay)

      if (validPlays.length === 0) {
        hints.push({
          cards: [],
          hintType: 'warning',
          reason: '没有能压过上家的牌，建议过牌',
          confidence: 1.0,
          impact: 'negative'
        })
      } else {
        const bestPlay = this.selectBestPlay(validPlays, context)
        hints.push({
          cards: bestPlay,
          hintType: 'suggested',
          reason: this.getPlayReason(bestPlay, lastPlayType || 'unknown', gamePhase),
          confidence: this.calculateConfidence(bestPlay, context),
          impact: 'positive'
        })

        if (validPlays.length > 1) {
          const alternativePlay = validPlays[1]
          hints.push({
            cards: alternativePlay,
            hintType: 'info',
            reason: '备选方案：保留大牌用于后续',
            confidence: this.calculateConfidence(alternativePlay, context) * 0.8,
            impact: 'neutral'
          })
        }
      }
    } else {
      const suggestedPlay = this.suggestFirstPlay(currentHand, context)
      hints.push({
        cards: suggestedPlay,
        hintType: 'suggested',
        reason: '建议先出小牌试探对手',
        confidence: 0.7,
        impact: 'positive'
      })
    }

    const specialHints = this.generateSpecialHints(context)
    hints.push(...specialHints)

    return hints
  }

  generatePlaySuggestions(context: GameHintContext): PlaySuggestion[] {
    const suggestions: PlaySuggestion[] = []
    const { currentHand, lastPlay, teamScore, opponentScore, gamePhase } = context

    if (lastPlay && lastPlay.length > 0) {
      const validPlays = this.findValidPlays(currentHand, lastPlay)
      
      for (const play of validPlays) {
        const suggestion = this.analyzePlay(play, context)
        suggestions.push(suggestion)
      }
    } else {
      const firstPlays = this.generateFirstPlaySuggestions(currentHand, context)
      suggestions.push(...firstPlays)
    }

    suggestions.sort((a, b) => b.confidence - a.confidence)
    return suggestions.slice(0, 5)
  }

  generateStrategyAdvice(context: GameHintContext): StrategyAdvice[] {
    const advices: StrategyAdvice[] = []
    const { teamScore, opponentScore, gamePhase, turnNo } = context

    const scoreDiff = teamScore - opponentScore

    if (gamePhase === 'early') {
      advices.push({
        type: 'balanced',
        advice: '游戏初期，保持牌力平衡，不要过早暴露实力',
        priority: 1,
        context: 'early_game'
      })
    } else if (gamePhase === 'mid') {
      if (scoreDiff > 0) {
        advices.push({
          type: 'defensive',
          advice: '领先时保持稳健，避免冒险出牌',
          priority: 1,
          context: 'leading'
        })
      } else {
        advices.push({
          type: 'offensive',
          advice: '落后时需要积极进攻，寻找机会反超',
          priority: 1,
          context: 'trailing'
        })
      }
    } else {
      if (scoreDiff > 0) {
        advices.push({
          type: 'defensive',
          advice: '游戏后期领先，优先保证不失误',
          priority: 1,
          context: 'late_leading'
        })
      } else {
        advices.push({
          type: 'offensive',
          advice: '游戏后期落后，需要冒险出牌争取翻盘',
          priority: 1,
          context: 'late_trailing'
        })
      }
    }

    if (turnNo > 20) {
      advices.push({
        type: 'balanced',
        advice: '注意观察对手出牌模式，寻找破绽',
        priority: 2,
        context: 'observation'
      })
    }

    return advices
  }

  calculateWinProbability(context: GameHintContext, proposedPlay: number[] | null): WinProbability {
    const { currentHand, teamScore, opponentScore, gamePhase } = context
    const handStrength = analyzeHandStrength(currentHand)
    
    let currentProb = 0.5
    const factors: { factor: string; impact: number; description: string }[] = []

    const scoreDiff = teamScore - opponentScore
    if (scoreDiff > 50) {
      currentProb += 0.2
      factors.push({ factor: 'score_advantage', impact: 0.2, description: '分数领先' })
    } else if (scoreDiff < -50) {
      currentProb -= 0.2
      factors.push({ factor: 'score_disadvantage', impact: -0.2, description: '分数落后' })
    }

    if (handStrength > 0.7) {
      currentProb += 0.15
      factors.push({ factor: 'hand_strength', impact: 0.15, description: '手牌强度高' })
    } else if (handStrength < 0.3) {
      currentProb -= 0.15
      factors.push({ factor: 'hand_weakness', impact: -0.15, description: '手牌强度低' })
    }

    if (gamePhase === 'late' && scoreDiff > 0) {
      currentProb += 0.1
      factors.push({ factor: 'late_game_leading', impact: 0.1, description: '后期领先优势' })
    }

    currentProb = Math.max(0.1, Math.min(0.9, currentProb))

    let afterPlayProb = currentProb
    if (proposedPlay && proposedPlay.length > 0) {
      const playStrength = this.calculatePlayStrength(proposedPlay)
      if (playStrength > 0.8) {
        afterPlayProb += 0.05
        factors.push({ factor: 'strong_play', impact: 0.05, description: '强力出牌' })
      } else if (playStrength < 0.3) {
        afterPlayProb -= 0.05
        factors.push({ factor: 'weak_play', impact: -0.05, description: '弱势出牌' })
      }
    }

    return {
      current: currentProb,
      afterPlay: afterPlayProb,
      change: afterPlayProb - currentProb,
      factors
    }
  }

  analyzeTeammate(context: GameHintContext, teammateId: string): TeammateAnalysis {
    return {
      userId: teammateId,
      handStrength: 0.5,
      playStyle: 'balanced',
      suggestions: [
        '观察队友出牌，配合其策略',
        '在队友需要时提供支持'
      ],
      cooperationLevel: 0.7
    }
  }

  analyzeOpponent(context: GameHintContext, opponentId: string): OpponentAnalysis {
    return {
      userId: opponentId,
      handStrength: 0.5,
      playStyle: 'balanced',
      weaknesses: [
        '可能缺乏大牌',
        '出牌模式可预测'
      ],
      threats: [
        '可能保留炸弹',
        '可能等待时机'
      ]
    }
  }

  private findValidPlays(hand: number[], lastPlay: number[]): number[][] {
    const validPlays: number[][] = []
    const lastPlayType = getCardType(lastPlay)

    if (!lastPlayType) return validPlays

    const combinations = this.generateCombinations(hand, lastPlay.length)
    const lastPlayMove = this.numberArrayToMove(lastPlay)
    
    for (const combo of combinations) {
      const comboMove = this.numberArrayToMove(combo)
      if (lastPlayMove && comboMove && canBeat(comboMove, lastPlayMove)) {
        validPlays.push(combo)
      }
    }

    return validPlays
  }

  private numberArrayToMove(cards: number[]): any {
    if (!cards || cards.length === 0) return null

    const rankMap: Record<number, string> = {
      2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
      11: 'J', 12: 'Q', 13: 'K', 14: 'A', 15: '2', 16: 'S', 17: 'B'
    }

    const cardObjects: Card[] = cards.map(id => ({
      id,
      suit: ['S', 'H', 'C', 'D'][Math.floor(id / 100)] as any,
      val: id % 100,
      rank: rankMap[id % 100] || '2'
    }))

    return analyzeMove(cardObjects, 2)
  }

  private generateCombinations(hand: number[], size: number): number[][] {
    const combinations: number[][] = []
    
    if (size === 1) {
      for (const card of hand) {
        combinations.push([card])
      }
    } else if (size === 2) {
      for (let i = 0; i < hand.length; i++) {
        for (let j = i + 1; j < hand.length; j++) {
          combinations.push([hand[i], hand[j]])
        }
      }
    } else if (size === 3) {
      for (let i = 0; i < hand.length; i++) {
        for (let j = i + 1; j < hand.length; j++) {
          for (let k = j + 1; k < hand.length; k++) {
            combinations.push([hand[i], hand[j], hand[k]])
          }
        }
      }
    }

    return combinations
  }

  private selectBestPlay(validPlays: number[][], context: GameHintContext): number[] {
    if (validPlays.length === 0) return []

    let bestPlay = validPlays[0]
    let bestScore = -Infinity

    for (const play of validPlays) {
      const score = this.evaluatePlay(play, context)
      if (score > bestScore) {
        bestScore = score
        bestPlay = play
      }
    }

    return bestPlay
  }

  private evaluatePlay(play: number[], context: GameHintContext): number {
    let score = 0
    const { gamePhase, teamScore, opponentScore } = context

    const playStrength = this.calculatePlayStrength(play)
    score += playStrength * 40

    const cardValues = play.map(c => c % 100)
    const avgValue = cardValues.reduce((a, b) => a + b, 0) / cardValues.length
    score += (1 - avgValue / 15) * 30

    if (gamePhase === 'late' && teamScore > opponentScore) {
      score += (1 - avgValue / 15) * 20
    }

    return score
  }

  private calculatePlayStrength(play: number[]): number {
    const playType = getCardType(play)
    if (!playType) return 0

    const strength = getCardTypeStrength(playType)
    return strength / 10
  }

  private getPlayReason(play: number[], lastPlayType: string, gamePhase: string): string {
    const playType = getCardType(play)
    if (!playType) return '建议出牌'

    const cardValues = play.map(c => c % 100)
    const avgValue = cardValues.reduce((a, b) => a + b, 0) / cardValues.length

    if (avgValue < 5) {
      return '出小牌试探，保留实力'
    } else if (avgValue > 10) {
      return '出大牌压制对手'
    } else {
      return '中等牌力，稳健出牌'
    }
  }

  private calculateConfidence(play: number[], context: GameHintContext): number {
    const playStrength = this.calculatePlayStrength(play)
    const { gamePhase } = context

    let confidence = playStrength

    if (gamePhase === 'early') {
      confidence *= 0.8
    } else if (gamePhase === 'late') {
      confidence *= 1.2
    }

    return Math.min(1.0, confidence)
  }

  private suggestFirstPlay(hand: number[], context: GameHintContext): number[] {
    const sortedHand = [...hand].sort((a, b) => (a % 100) - (b % 100))
    return [sortedHand[0]]
  }

  private generateFirstPlaySuggestions(hand: number[], context: GameHintContext): PlaySuggestion[] {
    const suggestions: PlaySuggestion[] = []
    const sortedHand = [...hand].sort((a, b) => (a % 100) - (b % 100))

    for (let i = 0; i < Math.min(3, sortedHand.length); i++) {
      const play = [sortedHand[i]]
      suggestions.push({
        cards: play,
        playType: 'single',
        reason: i === 0 ? '出最小牌试探' : '备选方案',
        confidence: 0.7 - i * 0.1,
        expectedOutcome: 'draw',
        riskLevel: 'low'
      })
    }

    return suggestions
  }

  private analyzePlay(play: number[], context: GameHintContext): PlaySuggestion {
    const playType = getCardType(play) || 'unknown'
    const confidence = this.calculateConfidence(play, context)
    const winProb = this.calculateWinProbability(context, play)

    let riskLevel: 'low' | 'medium' | 'high' = 'medium'
    if (confidence > 0.8) riskLevel = 'low'
    else if (confidence < 0.4) riskLevel = 'high'

    let expectedOutcome: 'win' | 'lose' | 'draw' = 'draw'
    if (winProb.afterPlay > 0.6) expectedOutcome = 'win'
    else if (winProb.afterPlay < 0.4) expectedOutcome = 'lose'

    return {
      cards: play,
      playType,
      reason: this.getPlayReason(play, playType, context.gamePhase),
      confidence,
      expectedOutcome,
      riskLevel
    }
  }

  private generateSpecialHints(context: GameHintContext): CardHint[] {
    const hints: CardHint[] = []
    const { currentHand, gamePhase, teamScore, opponentScore } = context

    const bombs = this.findBombs(currentHand)
    if (bombs.length > 0 && gamePhase === 'late') {
      hints.push({
        cards: bombs[0],
        hintType: 'info',
        reason: '保留炸弹用于关键时刻',
        confidence: 0.9,
        impact: 'positive'
      })
    }

    if (teamScore - opponentScore > 100 && gamePhase === 'late') {
      hints.push({
        cards: [],
        hintType: 'info',
        reason: '大幅领先，保持稳健策略',
        confidence: 0.95,
        impact: 'positive'
      })
    }

    return hints
  }

  private findBombs(hand: number[]): number[][] {
    const bombs: number[][] = []
    const valueCount = new Map<number, number[]>()

    for (const card of hand) {
      const value = card % 100
      if (!valueCount.has(value)) {
        valueCount.set(value, [])
      }
      valueCount.get(value)!.push(card)
    }

    Array.from(valueCount.entries()).forEach(([value, cards]) => {
      if (cards.length === 4) {
        bombs.push(cards)
      }
    })

    return bombs
  }

  clearHistory(): void {
    this.hintHistory.clear()
    this.suggestionHistory.clear()
  }
}

export const gameHintsService = GameHintsService.getInstance()
