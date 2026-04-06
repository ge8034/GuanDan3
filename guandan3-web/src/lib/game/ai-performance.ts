import { AIDecisionMetrics, AIDifficulty } from './ai-types'

// ============================================================================
// 性能监控配置
// ============================================================================

/** 性能指标最大存储数量 */
const MAX_METRICS_SIZE = 1000

/** 性能指标最大保留时间（毫秒）- 默认24小时 */
const MAX_METRICS_AGE_MS = 24 * 60 * 60 * 1000

/** 自动清理触发频率（每N次记录后清理一次） */
const AUTO_CLEANUP_FREQUENCY = 100

// ============================================================================
// 状态
// ============================================================================

let performanceMetrics: AIDecisionMetrics[] = []
let recordCount = 0 // 记录次数计数器，用于触发自动清理

// ============================================================================
// 自动清理功能
// ============================================================================

/**
 * 清理过期的性能指标
 * 基于数量和时间的双重清理策略
 */
function cleanupPerformanceMetrics(): void {
  const now = Date.now()
  const originalLength = performanceMetrics.length

  // 1. 清理超过最大年龄的指标
  performanceMetrics = performanceMetrics.filter(
    m => now - m.timestamp <= MAX_METRICS_AGE_MS
  )

  // 2. 如果仍然超过最大数量，保留最新的N条
  if (performanceMetrics.length > MAX_METRICS_SIZE) {
    performanceMetrics = performanceMetrics.slice(-MAX_METRICS_SIZE)
  }

  // 如果清理了数据，记录日志
  const cleanedCount = originalLength - performanceMetrics.length
  if (cleanedCount > 0) {
    // 可以在这里添加日志记录
    // console.debug(`Cleaned ${cleanedCount} old performance metrics`)
  }
}

/**
 * 获取性能统计信息
 * 包括缓存状态和清理配置
 */
export function getPerformanceMetricsInfo() {
  const now = Date.now()
  const oldestMetric = performanceMetrics[0]
  const ageOfOldest = oldestMetric ? now - oldestMetric.timestamp : 0

  return {
    size: performanceMetrics.length,
    maxSize: MAX_METRICS_SIZE,
    maxAgeMs: MAX_METRICS_AGE_MS,
    ageOfOldestMs: ageOfOldest,
    recordCount,
  }
}

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
  recordCount++

  // 立即检查并裁剪：如果超过最大大小，裁剪到最大大小
  if (performanceMetrics.length > MAX_METRICS_SIZE) {
    performanceMetrics = performanceMetrics.slice(-MAX_METRICS_SIZE)
  }

  // 定期触发自动清理（基于时间和大小）
  if (recordCount % AUTO_CLEANUP_FREQUENCY === 0) {
    cleanupPerformanceMetrics()
  }

  // 紧急清理：如果超过最大大小的20%，立即清理
  if (performanceMetrics.length > MAX_METRICS_SIZE * 1.2) {
    cleanupPerformanceMetrics()
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
