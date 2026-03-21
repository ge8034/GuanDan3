import { AIDecisionMetrics, AIDifficulty } from './ai-types'

let performanceMetrics: AIDecisionMetrics[] = []
let maxMetricsSize = 1000

export function recordDecisionMetrics(
  decisionType: 'lead' | 'follow' | 'pass',
  cardType: string | undefined,
  handSize: number,
  difficulty: AIDifficulty,
  controlScore: number,
  startTime: number
): void {
  const metrics: AIDecisionMetrics = {
    decisionTime: Date.now() - startTime,
    decisionType,
    cardType,
    handSize,
    difficulty,
    controlScore,
    timestamp: Date.now()
  }
  
  performanceMetrics.push(metrics)
  
  if (performanceMetrics.length > maxMetricsSize) {
    performanceMetrics = performanceMetrics.slice(-maxMetricsSize)
  }
}

export function getPerformanceStats() {
  if (performanceMetrics.length === 0) {
    return {
      totalDecisions: 0,
      averageDecisionTime: 0,
      winRate: 0,
      leadDecisions: 0,
      followDecisions: 0,
      passDecisions: 0,
      recentPerformance: []
    }
  }
  
  const totalDecisions = performanceMetrics.length
  const averageDecisionTime = performanceMetrics.reduce(
    (sum, m) => sum + m.decisionTime,
    0
  ) / totalDecisions
  
  const leadDecisions = performanceMetrics.filter(m => m.decisionType === 'lead').length
  const followDecisions = performanceMetrics.filter(m => m.decisionType === 'follow').length
  const passDecisions = performanceMetrics.filter(m => m.decisionType === 'pass').length
  
  const recentMetrics = performanceMetrics.slice(-20)
  const recentPerformance = recentMetrics.map(m => ({
    timestamp: m.timestamp,
    decisionTime: m.decisionTime,
    controlScore: m.controlScore
  }))
  
  return {
    totalDecisions,
    averageDecisionTime,
    winRate: 0,
    leadDecisions,
    followDecisions,
    passDecisions,
    recentPerformance
  }
}

export function clearPerformanceMetrics(): void {
  performanceMetrics = []
}

export function getRecentPerformance(count: number = 10): number[] {
  const recentMetrics = performanceMetrics.slice(-count)
  return recentMetrics.map(m => {
    const normalizedScore = Math.min(1, m.controlScore / 100)
    return normalizedScore
  })
}

export function calculateWinRate(): number {
  if (performanceMetrics.length === 0) return 0
  
  const recentMetrics = performanceMetrics.slice(-50)
  const goodDecisions = recentMetrics.filter(m => 
    m.decisionTime < 2000 && m.controlScore > 30
  ).length
  
  return goodDecisions / recentMetrics.length
}
