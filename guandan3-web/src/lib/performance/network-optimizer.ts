export interface NetworkMetrics {
  requestCount: number
  totalBytes: number
  averageLatency: number
  p95Latency: number
  p99Latency: number
  errorRate: number
}

export interface RequestMetrics {
  url: string
  method: string
  duration: number
  status: number
  bytes: number
  timestamp: number
}

class NetworkOptimizer {
  private metrics: RequestMetrics[] = []
  private maxMetricsSize: number = 1000

  recordRequest(metrics: RequestMetrics) {
    this.metrics.push(metrics)
    if (this.metrics.length > this.maxMetricsSize) {
      this.metrics.shift()
    }
  }

  getMetrics(): NetworkMetrics {
    if (this.metrics.length === 0) {
      return {
        requestCount: 0,
        totalBytes: 0,
        averageLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
        errorRate: 0
      }
    }

    const sortedLatencies = [...this.metrics]
      .map(m => m.duration)
      .sort((a, b) => a - b)

    const p95Index = Math.floor(sortedLatencies.length * 0.95)
    const p99Index = Math.floor(sortedLatencies.length * 0.99)

    const errorCount = this.metrics.filter(m => m.status >= 400).length

    return {
      requestCount: this.metrics.length,
      totalBytes: this.metrics.reduce((sum, m) => sum + m.bytes, 0),
      averageLatency: this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length,
      p95Latency: sortedLatencies[p95Index] || 0,
      p99Latency: sortedLatencies[p99Index] || 0,
      errorRate: errorCount / this.metrics.length
    }
  }

  clearMetrics() {
    this.metrics = []
  }

  getSlowRequests(threshold: number = 1000): RequestMetrics[] {
    return this.metrics.filter(m => m.duration > threshold)
  }

  getFailedRequests(): RequestMetrics[] {
    return this.metrics.filter(m => m.status >= 400)
  }

  getMetricsByUrl(url: string): RequestMetrics[] {
    return this.metrics.filter(m => m.url.includes(url))
  }
}

export const networkOptimizer = new NetworkOptimizer()

export function optimizeFetch(url: string, options?: RequestInit): Promise<Response> {
  const startTime = performance.now()
  
  const optimizedOptions: RequestInit = {
    ...options,
    headers: {
      ...options?.headers,
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  }

  return fetch(url, optimizedOptions).then(response => {
    const duration = performance.now() - startTime
    const contentLength = response.headers.get('content-length')
    const bytes = contentLength ? parseInt(contentLength, 10) : 0

    networkOptimizer.recordRequest({
      url,
      method: options?.method || 'GET',
      duration,
      status: response.status,
      bytes,
      timestamp: Date.now()
    })

    return response
  }).catch(error => {
    const duration = performance.now() - startTime

    networkOptimizer.recordRequest({
      url,
      method: options?.method || 'GET',
      duration,
      status: 0,
      bytes: 0,
      timestamp: Date.now()
    })

    throw error
  })
}

export function createPerformanceMiddleware() {
  return async (request: Request, response: Response) => {
    const startTime = performance.now()
    const url = request.url
    const method = request.method

    const clonedResponse = response.clone()
    const contentLength = clonedResponse.headers.get('content-length')
    const bytes = contentLength ? parseInt(contentLength, 10) : 0

    const duration = performance.now() - startTime

    networkOptimizer.recordRequest({
      url,
      method,
      duration,
      status: response.status,
      bytes,
      timestamp: Date.now()
    })

    return response
  }
}
