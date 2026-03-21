import { networkOptimizer } from './network-optimizer'

export interface APIPerformanceMetrics {
  endpoint: string
  method: string
  duration: number
  status: number
  timestamp: number
  success: boolean
  error?: string
}

export interface APIPerformanceSummary {
  totalRequests: number
  successRequests: number
  failedRequests: number
  averageDuration: number
  p95Duration: number
  p99Duration: number
  errorRate: number
  slowestEndpoints: Array<{ endpoint: string; duration: number }>
  mostFrequentErrors: Array<{ error: string; count: number }>
}

class APIPerformanceMonitor {
  private metrics: APIPerformanceMetrics[] = []
  private maxMetricsSize: number = 1000

  recordAPICall(metrics: APIPerformanceMetrics) {
    this.metrics.push(metrics)
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift()
    }
  }

  getSummary(): APIPerformanceSummary {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        successRequests: 0,
        failedRequests: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        errorRate: 0,
        slowestEndpoints: [],
        mostFrequentErrors: []
      }
    }

    const successRequests = this.metrics.filter(m => m.success)
    const failedRequests = this.metrics.filter(m => !m.success)
    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b)

    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    const errorCounts = new Map<string, number>()
    failedRequests.forEach(m => {
      const error = m.error || 'Unknown error'
      errorCounts.set(error, (errorCounts.get(error) || 0) + 1)
    })

    const mostFrequentErrors = Array.from(errorCounts.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    const endpointDurations = new Map<string, number[]>()
    this.metrics.forEach(m => {
      const durations = endpointDurations.get(m.endpoint) || []
      durations.push(m.duration)
      endpointDurations.set(m.endpoint, durations)
    })

    const slowestEndpoints = Array.from(endpointDurations.entries())
      .map(([endpoint, durations]) => ({
        endpoint,
        duration: Math.max(...durations)
      }))
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 5)

    return {
      totalRequests: this.metrics.length,
      successRequests: successRequests.length,
      failedRequests: failedRequests.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95Duration: durations[p95Index] || 0,
      p99Duration: durations[p99Index] || 0,
      errorRate: failedRequests.length / this.metrics.length,
      slowestEndpoints,
      mostFrequentErrors
    }
  }

  getMetricsByEndpoint(endpoint: string): APIPerformanceMetrics[] {
    return this.metrics.filter(m => m.endpoint === endpoint)
  }

  getFailedRequests(): APIPerformanceMetrics[] {
    return this.metrics.filter(m => !m.success)
  }

  getSlowRequests(threshold: number = 1000): APIPerformanceMetrics[] {
    return this.metrics.filter(m => m.duration > threshold)
  }

  clearMetrics() {
    this.metrics = []
  }

  exportMetrics(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      rawMetrics: this.metrics
    }, null, 2)
  }
}

export const apiPerformanceMonitor = new APIPerformanceMonitor()

export function withAPIMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  endpoint: string,
  method: string = 'GET'
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now()
    const timestamp = Date.now()

    try {
      const result = await fn(...args)
      const duration = performance.now() - startTime

      apiPerformanceMonitor.recordAPICall({
        endpoint,
        method,
        duration,
        status: 200,
        timestamp,
        success: true
      })

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      apiPerformanceMonitor.recordAPICall({
        endpoint,
        method,
        duration,
        status: 500,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }
}

export function createAPIPerformanceMiddleware() {
  return async (request: Request, response: Response) => {
    const startTime = performance.now()
    const url = new URL(request.url)
    const endpoint = url.pathname
    const method = request.method
    const timestamp = Date.now()

    try {
      const clonedResponse = response.clone()
      const duration = performance.now() - startTime

      apiPerformanceMonitor.recordAPICall({
        endpoint,
        method,
        duration,
        status: response.status,
        timestamp,
        success: response.status >= 200 && response.status < 300
      })

      return response
    } catch (error) {
      const duration = performance.now() - startTime

      apiPerformanceMonitor.recordAPICall({
        endpoint,
        method,
        duration,
        status: 500,
        timestamp,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      throw error
    }
  }
}

export function getAPIPerformanceReport() {
  const summary = apiPerformanceMonitor.getSummary()
  const slowRequests = apiPerformanceMonitor.getSlowRequests(1000)
  const failedRequests = apiPerformanceMonitor.getFailedRequests()

  return {
    summary,
    slowRequests: slowRequests.slice(0, 10),
    failedRequests: failedRequests.slice(0, 10),
    recommendations: generatePerformanceRecommendations(summary)
  }
}

function generatePerformanceRecommendations(summary: APIPerformanceSummary): string[] {
  const recommendations: string[] = []

  if (summary.errorRate > 0.05) {
    recommendations.push(`错误率过高 (${(summary.errorRate * 100).toFixed(2)}%)，建议检查错误日志和异常处理`)
  }

  if (summary.p99Duration > 500) {
    recommendations.push(`P99 延迟过高 (${summary.p99Duration.toFixed(2)}ms)，建议优化慢查询和复杂计算`)
  }

  if (summary.averageDuration > 200) {
    recommendations.push(`平均延迟过高 (${summary.averageDuration.toFixed(2)}ms)，建议添加缓存和优化数据库查询`)
  }

  if (summary.slowestEndpoints.length > 0) {
    const slowest = summary.slowestEndpoints[0]
    if (slowest.duration > 1000) {
      recommendations.push(`端点 ${slowest.endpoint} 响应过慢 (${slowest.duration.toFixed(2)}ms)，建议优先优化`)
    }
  }

  if (summary.mostFrequentErrors.length > 0) {
    const topError = summary.mostFrequentErrors[0]
    if (topError.count > 10) {
      recommendations.push(`错误 "${topError.error}" 频繁出现 (${topError.count}次)，建议重点排查`)
    }
  }

  return recommendations
}
