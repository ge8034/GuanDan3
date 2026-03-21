export interface AIDecisionMetrics {
  totalDecisions: number
  successfulDecisions: number
  failedDecisions: number
  averageDecisionTime: number
  decisionTypeDistribution: Record<string, number>
  errorRate: number
  successRate: number
}

export interface AIDecisionRecord {
  timestamp: number
  seatNo: number
  difficulty: 'easy' | 'medium' | 'hard'
  moveType: string
  cardCount: number
  decisionTime: number
  success: boolean
  errorMessage?: string
}

export class AIPerformanceMonitor {
  private static instance: AIPerformanceMonitor
  private records: AIDecisionRecord[] = []
  private maxRecords = 1000

  private constructor() {}

  static getInstance(): AIPerformanceMonitor {
    if (!AIPerformanceMonitor.instance) {
      AIPerformanceMonitor.instance = new AIPerformanceMonitor()
    }
    return AIPerformanceMonitor.instance
  }

  recordDecision(record: AIDecisionRecord): void {
    this.records.push(record)
    if (this.records.length > this.maxRecords) {
      this.records.shift()
    }
  }

  getMetrics(difficulty?: 'easy' | 'medium' | 'hard'): AIDecisionMetrics {
    const filteredRecords = difficulty 
      ? this.records.filter(r => r.difficulty === difficulty)
      : this.records

    if (filteredRecords.length === 0) {
      return {
        totalDecisions: 0,
        successfulDecisions: 0,
        failedDecisions: 0,
        averageDecisionTime: 0,
        decisionTypeDistribution: {},
        errorRate: 0,
        successRate: 0
      }
    }

    const successfulDecisions = filteredRecords.filter(r => r.success).length
    const failedDecisions = filteredRecords.filter(r => !r.success).length
    const totalTime = filteredRecords.reduce((sum, r) => sum + r.decisionTime, 0)
    const averageDecisionTime = totalTime / filteredRecords.length

    const decisionTypeDistribution: Record<string, number> = {}
    filteredRecords.forEach(r => {
      decisionTypeDistribution[r.moveType] = (decisionTypeDistribution[r.moveType] || 0) + 1
    })

    return {
      totalDecisions: filteredRecords.length,
      successfulDecisions,
      failedDecisions,
      averageDecisionTime,
      decisionTypeDistribution,
      errorRate: failedDecisions / filteredRecords.length,
      successRate: successfulDecisions / filteredRecords.length
    }
  }

  getRecentRecords(count: number = 10): AIDecisionRecord[] {
    return this.records.slice(-count)
  }

  getRecordsByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): AIDecisionRecord[] {
    return this.records.filter(r => r.difficulty === difficulty)
  }

  clearRecords(): void {
    this.records = []
  }

  getErrorRecords(): AIDecisionRecord[] {
    return this.records.filter(r => !r.success)
  }

  getAverageDecisionTimeByDifficulty(): Record<string, number> {
    const difficulties: ('easy' | 'medium' | 'hard')[] = ['easy', 'medium', 'hard']
    const result: Record<string, number> = {}

    difficulties.forEach(diff => {
      const records = this.getRecordsByDifficulty(diff)
      if (records.length > 0) {
        const totalTime = records.reduce((sum, r) => sum + r.decisionTime, 0)
        result[diff] = totalTime / records.length
      } else {
        result[diff] = 0
      }
    })

    return result
  }
}