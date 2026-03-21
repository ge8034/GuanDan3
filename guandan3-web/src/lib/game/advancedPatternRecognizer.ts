import { Card } from '@/lib/store/game'
import { getCardValue } from './rules'

export interface AdvancedPattern {
  type: string
  cards: Card[]
  primaryValue: number
  secondaryValue?: number
  complexity: number
  isWildCardUsed: boolean
  wildCards: Card[]
}

export interface PatternAnalysisResult {
  patterns: AdvancedPattern[]
  bestPattern: AdvancedPattern | null
  alternativePatterns: AdvancedPattern[]
  hasWildCardPotential: boolean
  wildCards: Card[]
  wildCardCombinations: Card[][]
}

export class AdvancedPatternRecognizer {
  private levelRank: number

  constructor(levelRank: number) {
    this.levelRank = levelRank
  }

  analyzeCards(cards: Card[]): PatternAnalysisResult {
    const patterns: AdvancedPattern[] = []
    const wildCards = this.getWildCards(cards)
    const hasWildCardPotential = wildCards.length > 0

    // 基础牌型识别
    patterns.push(...this.recognizeBasicPatterns(cards, wildCards))

    // 高级牌型识别
    patterns.push(...this.recognizeAdvancedPatterns(cards, wildCards))

    // 炸弹识别
    patterns.push(...this.recognizeBombs(cards, wildCards))

    // 逢人配组合识别
    const wildCardCombinations = this.generateWildCardCombinations(cards, wildCards)

    return {
      patterns,
      bestPattern: this.selectBestPattern(patterns),
      alternativePatterns: patterns.filter(p => p !== this.selectBestPattern(patterns)),
      hasWildCardPotential,
      wildCards,
      wildCardCombinations
    }
  }

  private getWildCards(cards: Card[]): Card[] {
    return cards.filter(c => c.suit === 'H' && c.val === this.levelRank)
  }

  private recognizeBasicPatterns(cards: Card[], wildCards: Card[]): AdvancedPattern[] {
    const patterns: AdvancedPattern[] = []
    const values = cards.map(c => getCardValue(c, this.levelRank)).sort((a, b) => a - b)
    const uniqueValues = Array.from(new Set(values))

    // 单张
    if (cards.length === 1) {
      patterns.push({
        type: 'single',
        cards,
        primaryValue: values[0],
        complexity: 1,
        isWildCardUsed: wildCards.length > 0,
        wildCards
      })
    }

    // 对子
    if (cards.length === 2 && uniqueValues.length === 1) {
      patterns.push({
        type: 'pair',
        cards,
        primaryValue: values[0],
        complexity: 2,
        isWildCardUsed: wildCards.length > 0,
        wildCards
      })
    }

    // 三张
    if (cards.length === 3 && uniqueValues.length === 1) {
      patterns.push({
        type: 'triple',
        cards,
        primaryValue: values[0],
        complexity: 3,
        isWildCardUsed: wildCards.length > 0,
        wildCards
      })
    }

    return patterns
  }

  private recognizeAdvancedPatterns(cards: Card[], wildCards: Card[]): AdvancedPattern[] {
    const patterns: AdvancedPattern[] = []
    const rawVals = cards.map(c => c.val).sort((a, b) => a - b)
    const uniqueRawVals = Array.from(new Set(rawVals))
    const hasJoker = cards.some(c => c.suit === 'J')
    const hasLevel = cards.some(c => c.val === this.levelRank)

    if (!hasJoker && !hasLevel) {
      // 三带二
      if (cards.length === 5 && uniqueRawVals.length === 2) {
        const countsByVal = uniqueRawVals
          .map(v => ({ v, c: rawVals.filter(x => x === v).length }))
          .sort((a, b) => b.c - a.c)
        if (countsByVal[0].c === 3 && countsByVal[1].c === 2) {
          patterns.push({
            type: 'fullhouse',
            cards,
            primaryValue: countsByVal[0].v,
            secondaryValue: countsByVal[1].v,
            complexity: 5,
            isWildCardUsed: false,
            wildCards: []
          })
        }
      }

      // 顺子
      if (cards.length >= 5 && uniqueRawVals.length === cards.length) {
        let isStraight = true
        for (let i = 1; i < rawVals.length; i++) {
          if (rawVals[i] !== rawVals[i - 1] + 1) {
            isStraight = false
            break
          }
        }
        if (isStraight) {
          patterns.push({
            type: 'straight',
            cards,
            primaryValue: rawVals[rawVals.length - 1],
            complexity: cards.length,
            isWildCardUsed: false,
            wildCards: []
          })
        }
      }

      // 连对
      if (cards.length >= 4 && cards.length % 2 === 0) {
        const counts: Record<number, number> = {}
        for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
        if (Object.values(counts).every(c => c === 2)) {
          const pairVals = Object.keys(counts)
            .map(v => Number(v))
            .sort((a, b) => a - b)
          let isSeq = true
          for (let i = 1; i < pairVals.length; i++) {
            if (pairVals[i] !== pairVals[i - 1] + 1) {
              isSeq = false
              break
            }
          }
          if (isSeq) {
            patterns.push({
              type: 'sequencePairs',
              cards,
              primaryValue: pairVals[pairVals.length - 1],
              complexity: cards.length / 2,
              isWildCardUsed: false,
              wildCards: []
            })
          }
        }
      }

      // 飞机（三顺）
      if (cards.length >= 6 && cards.length % 3 === 0) {
        const counts: Record<number, number> = {}
        for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
        const tripleVals = Object.keys(counts)
          .map(v => Number(v))
          .filter(v => counts[v] === 3)
          .sort((a, b) => a - b)
        
        if (tripleVals.length >= 2 && tripleVals.length * 3 === cards.length) {
          let isSeq = true
          for (let i = 1; i < tripleVals.length; i++) {
            if (tripleVals[i] !== tripleVals[i - 1] + 1) {
              isSeq = false
              break
            }
          }
          if (isSeq) {
            patterns.push({
              type: 'sequenceTriples',
              cards,
              primaryValue: tripleVals[tripleVals.length - 1],
              complexity: tripleVals.length,
              isWildCardUsed: false,
              wildCards: []
            })
          }
        }
      }

      // 飞机带翅膀
      if (cards.length >= 8) {
        const counts: Record<number, number> = {}
        for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
        const tripleVals = Object.keys(counts)
          .map(v => Number(v))
          .filter(v => counts[v] === 3)
          .sort((a, b) => a - b)
        
        if (tripleVals.length >= 2) {
          let isSeq = true
          for (let i = 1; i < tripleVals.length; i++) {
            if (tripleVals[i] !== tripleVals[i - 1] + 1) {
              isSeq = false
              break
            }
          }
          
          if (isSeq) {
            const tripleCount = tripleVals.length
            const expectedWings = tripleCount
            const actualWings = cards.length - tripleCount * 3
            
            if (actualWings === expectedWings || actualWings === expectedWings * 2) {
              const wingVals = Object.keys(counts)
                .map(v => Number(v))
                .filter(v => counts[v] !== 3)
              
              if (actualWings === expectedWings && wingVals.length === expectedWings) {
                patterns.push({
                  type: 'sequenceTriplesWithWings',
                  cards,
                  primaryValue: tripleVals[tripleVals.length - 1],
                  complexity: tripleCount + 1,
                  isWildCardUsed: false,
                  wildCards: []
                })
              } else if (actualWings === expectedWings * 2) {
                const pairWings = wingVals.filter(v => counts[v] === 2)
                if (pairWings.length === expectedWings) {
                  patterns.push({
                    type: 'sequenceTriplesWithWings',
                    cards,
                    primaryValue: tripleVals[tripleVals.length - 1],
                    complexity: tripleCount + 2,
                    isWildCardUsed: false,
                    wildCards: []
                  })
                }
              }
            }
          }
        }
      }
    }

    return patterns
  }

  private recognizeBombs(cards: Card[], wildCards: Card[]): AdvancedPattern[] {
    const patterns: AdvancedPattern[] = []
    const values = cards.map(c => getCardValue(c, this.levelRank)).sort((a, b) => a - b)
    const uniqueValues = Array.from(new Set(values))
    const rawVals = cards.map(c => c.val).sort((a, b) => a - b)
    const hasJoker = cards.some(c => c.suit === 'J')

    // 普通炸弹（4张及以上）
    if (cards.length >= 4 && uniqueValues.length === 1) {
      patterns.push({
        type: 'bomb',
        cards,
        primaryValue: 1000 * cards.length + values[0],
        complexity: cards.length,
        isWildCardUsed: wildCards.length > 0,
        wildCards
      })
    }

    // 王炸
    if (cards.length === 2 && hasJoker && uniqueValues.length === 2) {
      patterns.push({
        type: 'rocket',
        cards,
        primaryValue: 10000,
        complexity: 10,
        isWildCardUsed: false,
        wildCards: []
      })
    }

    // 四带二
    if (cards.length === 6 && !hasJoker) {
      const counts: Record<number, number> = {}
      for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
      
      const quadVals = Object.keys(counts)
        .map(v => Number(v))
        .filter(v => counts[v] === 4)
      
      if (quadVals.length === 1) {
        const remainingVals = Object.keys(counts)
          .map(v => Number(v))
          .filter(v => counts[v] !== 4)
        
        if (remainingVals.length === 2 || (remainingVals.length === 1 && counts[remainingVals[0]] === 2)) {
          patterns.push({
            type: 'bombWithTwo',
            cards,
            primaryValue: 1000 * 4 + quadVals[0],
            secondaryValue: remainingVals.length === 1 ? remainingVals[0] : Math.max(...remainingVals),
            complexity: 6,
            isWildCardUsed: false,
            wildCards: []
          })
        }
      }
    }

    return patterns
  }

  private generateWildCardCombinations(cards: Card[], wildCards: Card[]): Card[][] {
    const combinations: Card[][] = []
    const nonWildCards = cards.filter(c => !wildCards.includes(c))

    if (wildCards.length === 0) return combinations

    // 生成逢人配的各种组合
    for (let i = 0; i < wildCards.length; i++) {
      const wildCard = wildCards[i]
      
      // 与每张非级牌组合
      for (const card of nonWildCards) {
        if (card.val !== this.levelRank) {
          combinations.push([wildCard, card])
        }
      }
      
      // 单独使用
      combinations.push([wildCard])
    }

    return combinations
  }

  private selectBestPattern(patterns: AdvancedPattern[]): AdvancedPattern | null {
    if (patterns.length === 0) return null

    // 优先级：炸弹 > 复杂牌型 > 简单牌型
    const priorityOrder = ['rocket', 'bomb', 'bombWithTwo', 'sequenceTriplesWithWings', 'sequenceTriples', 'sequencePairs', 'straight', 'fullhouse', 'triple', 'pair', 'single']

    for (const type of priorityOrder) {
      const pattern = patterns.find(p => p.type === type)
      if (pattern) return pattern
    }

    return patterns[0]
  }

  findBestMove(cards: Card[], targetPattern?: { type: string; primaryValue: number; cardCount: number }): AdvancedPattern | null {
    const analysis = this.analyzeCards(cards)

    if (!targetPattern) {
      return analysis.bestPattern
    }

    // 如果目标牌型是炸弹或王炸，只能用更大的炸弹压过
    if (targetPattern.type === 'bomb' || targetPattern.type === 'rocket') {
      const bombPatterns = analysis.patterns.filter(p => {
        if (p.type !== 'bomb' && p.type !== 'rocket') return false
        if (p.cards.length !== targetPattern.cardCount) return false
        return p.primaryValue > targetPattern.primaryValue
      })
      
      if (bombPatterns.length === 0) {
        return null
      }
      
      return this.selectBestPattern(bombPatterns)
    }

    // 寻找能够压过目标牌型的最佳牌型
    const validPatterns = analysis.patterns.filter(p => {
      if (p.type !== targetPattern.type) return false
      if (p.cards.length !== targetPattern.cardCount) return false
      return p.primaryValue > targetPattern.primaryValue
    })

    if (validPatterns.length === 0) {
      // 检查炸弹
      const bombPatterns = analysis.patterns.filter(p => p.type === 'bomb' || p.type === 'rocket')
      if (bombPatterns.length > 0) {
        return this.selectBestPattern(bombPatterns)
      }
      return null
    }

    return this.selectBestPattern(validPatterns)
  }

  calculatePatternStrength(pattern: AdvancedPattern): number {
    let strength = pattern.primaryValue

    // 根据牌型复杂度调整强度
    strength += pattern.complexity * 10

    // 炸牌额外加分
    if (pattern.type === 'bomb' || pattern.type === 'rocket') {
      strength += 1000
    }

    // 使用逢人配的牌型略微降低强度（因为消耗了特殊牌）
    if (pattern.isWildCardUsed) {
      strength -= 5
    }

    return strength
  }
}