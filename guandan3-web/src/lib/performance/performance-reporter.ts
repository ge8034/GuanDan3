import { logger } from '@/lib/utils/logger'
import { performanceCollector, PerformanceBaseline } from './metrics-collector'
import { performanceMonitor, getPerformanceReport } from './performance-monitor'
import { apiPerformanceMonitor, getAPIPerformanceReport } from './api-performance'
import { networkOptimizer } from './network-optimizer'
import { realtimeOptimizer, getRealtimePerformanceReport } from './realtime-optimizer'
import { databaseOptimizer, getDatabasePerformanceReport } from './database-optimizer'
import { performanceBudgetManager, generatePerformanceBudgetReport } from './performance-budget'

export interface ComprehensivePerformanceReport {
  timestamp: string
  environment: string
  duration: number
  summary: PerformanceSummary
  webVitals: any
  apiPerformance: any
  networkMetrics: any
  realtimeMetrics: any
  databaseMetrics: any
  budgetReport: any
  recommendations: string[]
  alerts: Alert[]
}

export interface PerformanceSummary {
  overallScore: number
  categoryScores: {
    frontend: number
    api: number
    network: number
    realtime: number
    database: number
  }
  status: 'excellent' | 'good' | 'fair' | 'poor'
}

export interface Alert {
  level: 'info' | 'warning' | 'critical'
  category: string
  message: string
  metric: string
  value: number
  threshold: number
}

class PerformanceReporter {
  private startTime: number = Date.now()
  private alerts: Alert[] = []
  private reportInterval: NodeJS.Timeout | null = null

  startReporting(interval: number = 60000) {
    this.startTime = Date.now()
    this.reportInterval = setInterval(() => {
      this.collectAndReport()
    }, interval)
  }

  stopReporting() {
    if (this.reportInterval) {
      clearInterval(this.reportInterval)
      this.reportInterval = null
    }
  }

  private collectAndReport() {
    const report = this.generateReport()
    logger.debug('[PerformanceReporter] Generated report:', report)
    this.checkThresholds(report)
  }

  generateReport(): ComprehensivePerformanceReport {
    const webVitals = getPerformanceReport()
    const apiPerformance = getAPIPerformanceReport()
    const networkMetrics = networkOptimizer.getMetrics()
    const realtimeMetrics = getRealtimePerformanceReport()
    const databaseMetrics = getDatabasePerformanceReport()
    const budgetReport = generatePerformanceBudgetReport({})

    const summary = this.calculateSummary({
      webVitals,
      apiPerformance,
      networkMetrics,
      realtimeMetrics,
      databaseMetrics,
      budgetReport
    })

    const recommendations = this.generateRecommendations({
      webVitals,
      apiPerformance,
      networkMetrics,
      realtimeMetrics,
      databaseMetrics,
      budgetReport
    })

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      duration: Date.now() - this.startTime,
      summary,
      webVitals,
      apiPerformance,
      networkMetrics,
      realtimeMetrics,
      databaseMetrics,
      budgetReport,
      recommendations,
      alerts: this.alerts
    }
  }

  private calculateSummary(data: any): PerformanceSummary {
    const scores = {
      frontend: this.calculateFrontendScore(data.webVitals),
      api: this.calculateAPIScore(data.apiPerformance),
      network: this.calculateNetworkScore(data.networkMetrics),
      realtime: this.calculateRealtimeScore(data.realtimeMetrics),
      database: this.calculateDatabaseScore(data.databaseMetrics)
    }

    const overallScore = Object.values(scores).reduce((sum, score) => sum + score, 0) / 5

    let status: PerformanceSummary['status'] = 'poor'
    if (overallScore >= 90) status = 'excellent'
    else if (overallScore >= 75) status = 'good'
    else if (overallScore >= 60) status = 'fair'

    return {
      overallScore,
      categoryScores: scores,
      status
    }
  }

  private calculateFrontendScore(webVitals: any): number {
    if (!webVitals.webVitals) return 0

    const { fcp, lcp, cls, fid, ttfb } = webVitals.webVitals
    let score = 100

    if (fcp && fcp > 2000) score -= Math.min(30, (fcp - 2000) / 100)
    if (lcp && lcp > 2500) score -= Math.min(30, (lcp - 2500) / 100)
    if (cls && cls > 0.1) score -= Math.min(30, (cls - 0.1) * 100)
    if (fid && fid > 100) score -= Math.min(20, (fid - 100) / 10)
    if (ttfb && ttfb > 800) score -= Math.min(20, (ttfb - 800) / 50)

    return Math.max(0, Math.min(100, score))
  }

  private calculateAPIScore(apiPerformance: any): number {
    if (!apiPerformance.summary) return 0

    const { averageDuration, p99Duration, errorRate } = apiPerformance.summary
    let score = 100

    if (averageDuration > 200) score -= Math.min(30, (averageDuration - 200) / 20)
    if (p99Duration > 500) score -= Math.min(30, (p99Duration - 500) / 50)
    if (errorRate > 0.01) score -= Math.min(40, errorRate * 1000)

    return Math.max(0, Math.min(100, score))
  }

  private calculateNetworkScore(networkMetrics: any): number {
    if (!networkMetrics.averageLatency) return 0

    const { averageLatency, p99Latency, errorRate } = networkMetrics
    let score = 100

    if (averageLatency > 100) score -= Math.min(30, (averageLatency - 100) / 10)
    if (p99Latency > 200) score -= Math.min(30, (p99Latency - 200) / 20)
    if (errorRate > 0.001) score -= Math.min(40, errorRate * 10000)

    return Math.max(0, Math.min(100, score))
  }

  private calculateRealtimeScore(realtimeMetrics: any): number {
    if (!realtimeMetrics.metrics) return 0

    const { averageLatency, reconnectRate, errorRate } = realtimeMetrics.metrics
    let score = 100

    if (averageLatency > 100) score -= Math.min(30, (averageLatency - 100) / 10)
    if (reconnectRate > 0.1) score -= Math.min(30, reconnectRate * 100)
    if (errorRate > 0.05) score -= Math.min(40, errorRate * 200)

    return Math.max(0, Math.min(100, score))
  }

  private calculateDatabaseScore(databaseMetrics: any): number {
    if (!databaseMetrics.metrics) return 0

    const { averageDuration, p99Duration, cacheHitRate } = databaseMetrics.metrics
    let score = 100

    if (averageDuration > 200) score -= Math.min(30, (averageDuration - 200) / 20)
    if (p99Duration > 500) score -= Math.min(30, (p99Duration - 500) / 50)
    if (cacheHitRate < 0.7) score -= Math.min(40, (0.7 - cacheHitRate) * 100)

    return Math.max(0, Math.min(100, score))
  }

  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = []

    const { webVitals, apiPerformance, realtimeMetrics, databaseMetrics, budgetReport } = data

    if (apiPerformance?.recommendations) {
      recommendations.push(...apiPerformance.recommendations)
    }

    if (realtimeMetrics?.recommendations) {
      recommendations.push(...realtimeMetrics.recommendations)
    }

    if (databaseMetrics?.recommendations) {
      recommendations.push(...databaseMetrics.recommendations)
    }

    if (budgetReport?.recommendations) {
      recommendations.push(...budgetReport.recommendations)
    }

    return recommendations
  }

  private checkThresholds(report: ComprehensivePerformanceReport) {
    this.alerts = []

    const { webVitals, apiPerformance, realtimeMetrics, databaseMetrics } = report

    if (webVitals.webVitals?.lcp > 4000) {
      this.alerts.push({
        level: 'critical',
        category: 'frontend',
        message: 'LCP 超过 4 秒，严重影响用户体验',
        metric: 'lcp',
        value: webVitals.webVitals.lcp,
        threshold: 4000
      })
    }

    if (apiPerformance.summary?.errorRate > 0.05) {
      this.alerts.push({
        level: 'critical',
        category: 'api',
        message: 'API 错误率超过 5%',
        metric: 'errorRate',
        value: apiPerformance.summary.errorRate,
        threshold: 0.05
      })
    }

    if (realtimeMetrics.metrics?.errorRate > 0.1) {
      this.alerts.push({
        level: 'critical',
        category: 'realtime',
        message: 'Realtime 错误率超过 10%',
        metric: 'errorRate',
        value: realtimeMetrics.metrics.errorRate,
        threshold: 0.1
      })
    }

    if (databaseMetrics.metrics?.cacheHitRate < 0.3) {
      this.alerts.push({
        level: 'warning',
        category: 'database',
        message: '数据库缓存命中率低于 30%',
        metric: 'cacheHitRate',
        value: databaseMetrics.metrics.cacheHitRate,
        threshold: 0.3
      })
    }
  }

  exportReport(format: 'json' | 'csv' = 'json'): string {
    const report = this.generateReport()

    if (format === 'json') {
      return JSON.stringify(report, null, 2)
    }

    return this.convertToCSV(report)
  }

  private convertToCSV(report: ComprehensivePerformanceReport): string {
    const headers = [
      'timestamp',
      'environment',
      'overallScore',
      'frontendScore',
      'apiScore',
      'networkScore',
      'realtimeScore',
      'databaseScore',
      'status',
      'fcp',
      'lcp',
      'cls',
      'apiAverageDuration',
      'apiErrorRate',
      'realtimeAverageLatency',
      'realtimeErrorRate',
      'databaseAverageDuration',
      'databaseCacheHitRate'
    ]

    const row = [
      report.timestamp,
      report.environment,
      report.summary.overallScore.toFixed(2),
      report.summary.categoryScores.frontend.toFixed(2),
      report.summary.categoryScores.api.toFixed(2),
      report.summary.categoryScores.network.toFixed(2),
      report.summary.categoryScores.realtime.toFixed(2),
      report.summary.categoryScores.database.toFixed(2),
      report.summary.status,
      report.webVitals.webVitals?.fcp || '',
      report.webVitals.webVitals?.lcp || '',
      report.webVitals.webVitals?.cls || '',
      report.apiPerformance.summary?.averageDuration || '',
      report.apiPerformance.summary?.errorRate || '',
      report.realtimeMetrics.metrics?.averageLatency || '',
      report.realtimeMetrics.metrics?.errorRate || '',
      report.databaseMetrics.metrics?.averageDuration || '',
      report.databaseMetrics.metrics?.cacheHitRate || ''
    ]

    return [headers.join(','), row.join(',')].join('\n')
  }

  async sendReportToSentry(report: ComprehensivePerformanceReport) {
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      try {
        (window as any).Sentry.captureMessage('Performance Report', {
          level: report.summary.status === 'poor' ? 'error' : 'info',
          extra: report
        })
      } catch (error) {
        logger.error('Failed to send report to Sentry:', error)
      }
    }
  }

  async sendReportToAnalytics(report: ComprehensivePerformanceReport) {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      try {
        (window as any).gtag('event', 'performance_report', {
          event_category: 'performance',
          event_label: report.summary.status,
          value: Math.round(report.summary.overallScore),
          custom_map: {
            frontend_score: report.summary.categoryScores.frontend,
            api_score: report.summary.categoryScores.api,
            network_score: report.summary.categoryScores.network,
            realtime_score: report.summary.categoryScores.realtime,
            database_score: report.summary.categoryScores.database
          }
        })
      } catch (error) {
        logger.error('Failed to send report to Analytics:', error)
      }
    }
  }

  reset() {
    this.startTime = Date.now()
    this.alerts = []
    performanceCollector.reset()
    performanceMonitor.reset()
    apiPerformanceMonitor.clearMetrics()
    networkOptimizer.clearMetrics()
    realtimeOptimizer.reset()
    databaseOptimizer.reset()
    performanceBudgetManager.reset()
  }
}

export const performanceReporter = new PerformanceReporter()

export function generatePerformanceReport(): ComprehensivePerformanceReport {
  return performanceReporter.generateReport()
}

export function exportPerformanceReport(format: 'json' | 'csv' = 'json'): string {
  return performanceReporter.exportReport(format)
}

export function startPerformanceReporting(interval: number = 60000) {
  return performanceReporter.startReporting(interval)
}

export function stopPerformanceReporting() {
  return performanceReporter.stopReporting()
}
