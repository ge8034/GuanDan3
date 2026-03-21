export interface DatabaseMetrics {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  averageDuration: number
  p95Duration: number
  p99Duration: number
  cacheHitRate: number
  connectionPoolUsage: number
}

export interface QueryMetrics {
  query: string
  duration: number
  success: boolean
  timestamp: number
  cached: boolean
  error?: string
}

export interface CacheEntry {
  key: string
  value: any
  timestamp: number
  ttl: number
  hits: number
}

class DatabaseOptimizer {
  private metrics: QueryMetrics[] = []
  private cache: Map<string, CacheEntry> = new Map()
  private maxMetricsSize: number = 1000
  private maxCacheSize: number = 1000
  private defaultCacheTTL: number = 60000

  private readonly SLOW_QUERY_THRESHOLD = 1000
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_BASE = 100

  recordQuery(metrics: QueryMetrics) {
    this.metrics.push(metrics)
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift()
    }
  }

  getMetrics(): DatabaseMetrics {
    if (this.metrics.length === 0) {
      return {
        totalQueries: 0,
        successfulQueries: 0,
        failedQueries: 0,
        averageDuration: 0,
        p95Duration: 0,
        p99Duration: 0,
        cacheHitRate: 0,
        connectionPoolUsage: 0
      }
    }

    const successfulQueries = this.metrics.filter(m => m.success)
    const failedQueries = this.metrics.filter(m => !m.success)
    const durations = this.metrics.map(m => m.duration).sort((a, b) => a - b)

    const p95Index = Math.floor(durations.length * 0.95)
    const p99Index = Math.floor(durations.length * 0.99)

    const cachedQueries = this.metrics.filter(m => m.cached)
    const cacheHitRate = cachedQueries.length / this.metrics.length

    return {
      totalQueries: this.metrics.length,
      successfulQueries: successfulQueries.length,
      failedQueries: failedQueries.length,
      averageDuration: durations.reduce((sum, d) => sum + d, 0) / durations.length,
      p95Duration: durations[p95Index] || 0,
      p99Duration: durations[p99Index] || 0,
      cacheHitRate,
      connectionPoolUsage: 0
    }
  }

  setCache(key: string, value: any, ttl?: number) {
    const entry: CacheEntry = {
      key,
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultCacheTTL,
      hits: 0
    }

    this.cache.set(key, entry)

    if (this.cache.size > this.maxCacheSize) {
      this.evictOldestEntries()
    }
  }

  getCache(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    entry.hits++
    return entry.value
  }

  clearCache(pattern?: string) {
    if (!pattern) {
      this.cache.clear()
      return
    }

    const regex = new RegExp(pattern)
    Array.from(this.cache.keys()).forEach(key => {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    })
  }

  private evictOldestEntries() {
    const entries = Array.from(this.cache.entries())
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp)

    const toRemove = entries.slice(0, Math.floor(this.maxCacheSize * 0.1))
    toRemove.forEach(([key]) => this.cache.delete(key))
  }

  getSlowQueries(threshold?: number): QueryMetrics[] {
    const slowThreshold = threshold || this.SLOW_QUERY_THRESHOLD
    return this.metrics
      .filter(m => m.duration > slowThreshold)
      .sort((a, b) => b.duration - a.duration)
  }

  getFailedQueries(): QueryMetrics[] {
    return this.metrics.filter(m => !m.success)
  }

  getMostFrequentQueries(limit: number = 10): Array<{ query: string; count: number }> {
    const queryCounts = new Map<string, number>()

    this.metrics.forEach(m => {
      const count = queryCounts.get(m.query) || 0
      queryCounts.set(m.query, count + 1)
    })

    return Array.from(queryCounts.entries())
      .map(([query, count]) => ({ query, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
  }

  getCacheStats() {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0)
    const avgHits = totalHits / entries.length || 0

    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      totalHits,
      avgHits,
      hitRate: this.getMetrics().cacheHitRate
    }
  }

  clearMetrics() {
    this.metrics = []
  }

  reset() {
    this.metrics = []
    this.cache.clear()
  }

  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.getMetrics(),
      cacheStats: this.getCacheStats(),
      slowQueries: this.getSlowQueries().slice(0, 10),
      failedQueries: this.getFailedQueries().slice(0, 10),
      timestamp: Date.now()
    }, null, 2)
  }
}

export const databaseOptimizer = new DatabaseOptimizer()

export function withDatabaseOptimization<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  query: string,
  cacheKey?: string,
  cacheTTL?: number
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now()
    const timestamp = Date.now()

    if (cacheKey) {
      const cached = databaseOptimizer.getCache(cacheKey)
      if (cached !== null) {
        databaseOptimizer.recordQuery({
          query,
          duration: performance.now() - startTime,
          success: true,
          timestamp,
          cached: true
        })
        return cached
      }
    }

    let lastError: Error | null = null
    let attempt = 0

    while (attempt < databaseOptimizer['MAX_RETRIES']) {
      try {
        const result = await fn(...args)
        const duration = performance.now() - startTime

        databaseOptimizer.recordQuery({
          query,
          duration,
          success: true,
          timestamp,
          cached: false
        })

        if (cacheKey) {
          databaseOptimizer.setCache(cacheKey, result, cacheTTL)
        }

        return result
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        attempt++

        if (attempt < databaseOptimizer['MAX_RETRIES']) {
          const delay = databaseOptimizer['RETRY_DELAY_BASE'] * Math.pow(2, attempt)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    const duration = performance.now() - startTime

    databaseOptimizer.recordQuery({
      query,
      duration,
      success: false,
      timestamp,
      cached: false,
      error: lastError?.message
    })

    throw lastError
  }
}

export function createDatabaseConnectionPool(config: {
  maxConnections: number
  minConnections: number
  connectionTimeout: number
  idleTimeout: number
}) {
  return {
    config,
    stats: {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingRequests: 0
    }
  }
}

export function getDatabasePerformanceReport() {
  const metrics = databaseOptimizer.getMetrics()
  const slowQueries = databaseOptimizer.getSlowQueries()
  const failedQueries = databaseOptimizer.getFailedQueries()
  const cacheStats = databaseOptimizer.getCacheStats()
  const frequentQueries = databaseOptimizer.getMostFrequentQueries()

  return {
    metrics,
    slowQueries: slowQueries.slice(0, 10),
    failedQueries: failedQueries.slice(0, 10),
    cacheStats,
    frequentQueries: frequentQueries.slice(0, 10),
    recommendations: generateDatabaseRecommendations(metrics, cacheStats)
  }
}

function generateDatabaseRecommendations(
  metrics: DatabaseMetrics,
  cacheStats: ReturnType<typeof databaseOptimizer.getCacheStats>
): string[] {
  const recommendations: string[] = []

  if (metrics.p99Duration > 1000) {
    recommendations.push(`P99 查询延迟过高 (${metrics.p99Duration.toFixed(2)}ms)，建议优化慢查询和添加索引`)
  }

  if (metrics.cacheHitRate < 0.5) {
    recommendations.push(`缓存命中率过低 (${(metrics.cacheHitRate * 100).toFixed(2)}%)，建议增加缓存策略和调整 TTL`)
  }

  if (metrics.failedQueries / metrics.totalQueries > 0.01) {
    recommendations.push(`查询失败率过高 (${((metrics.failedQueries / metrics.totalQueries) * 100).toFixed(2)}%)，建议检查数据库连接和查询语法`)
  }

  if (cacheStats.size >= cacheStats.maxSize * 0.9) {
    recommendations.push(`缓存使用率过高 (${((cacheStats.size / cacheStats.maxSize) * 100).toFixed(2)}%)，建议增加缓存大小或优化缓存策略`)
  }

  if (metrics.averageDuration > 200) {
    recommendations.push(`平均查询延迟过高 (${metrics.averageDuration.toFixed(2)}ms)，建议优化数据库查询和连接池配置`)
  }

  return recommendations
}
