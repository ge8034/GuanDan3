export interface PerformanceMetrics {
  timestamp: number
  type: 'rpc' | 'realtime' | 'render' | 'network'
  name: string
  duration: number
  metadata?: Record<string, any>
}

export interface PerformanceBaseline {
  rpc: {
    submitTurn: { p50: number; p95: number; p99: number; errorRate: number }
  }
  realtime: {
    pushLatency: { p50: number; p95: number; p99: number }
    disconnectRate: number
  }
  render: {
    fcp: number
    lcp: number
    cls: number
    ttfb: number
  }
  resources: {
    cpu: { avg: number; max: number }
    memory: { avg: number; max: number }
  }
}

class PerformanceCollector {
  private metrics: PerformanceMetrics[] = []
  private startTime: number = Date.now()

  recordMetric(metric: PerformanceMetrics) {
    this.metrics.push({
      ...metric,
      timestamp: Date.now() - this.startTime
    })
  }

  recordRPC(name: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      timestamp: Date.now() - this.startTime,
      type: 'rpc',
      name,
      duration,
      metadata
    })
  }

  recordRealtimePush(name: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      timestamp: Date.now() - this.startTime,
      type: 'realtime',
      name,
      duration,
      metadata
    })
  }

  recordRender(name: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      timestamp: Date.now() - this.startTime,
      type: 'render',
      name,
      duration,
      metadata
    })
  }

  recordNetwork(name: string, duration: number, metadata?: Record<string, any>) {
    this.recordMetric({
      timestamp: Date.now() - this.startTime,
      type: 'network',
      name,
      duration,
      metadata
    })
  }

  getMetricsByType(type: PerformanceMetrics['type']): PerformanceMetrics[] {
    return this.metrics.filter(m => m.type === type)
  }

  calculatePercentiles(metrics: PerformanceMetrics[]): { p50: number; p95: number; p99: number } {
    if (metrics.length === 0) {
      return { p50: 0, p95: 0, p99: 0 }
    }

    const sorted = [...metrics].sort((a, b) => a.duration - b.duration)
    const p50Index = Math.floor(sorted.length * 0.5)
    const p95Index = Math.floor(sorted.length * 0.95)
    const p99Index = Math.floor(sorted.length * 0.99)

    return {
      p50: sorted[p50Index]?.duration || 0,
      p95: sorted[p95Index]?.duration || 0,
      p99: sorted[p99Index]?.duration || 0
    }
  }

  calculateErrorRate(metrics: PerformanceMetrics[]): number {
    if (metrics.length === 0) return 0
    const errorMetrics = metrics.filter(m => m.metadata?.error === true)
    return errorMetrics.length / metrics.length
  }

  generateBaseline(): PerformanceBaseline {
    const rpcMetrics = this.getMetricsByType('rpc')
    const realtimeMetrics = this.getMetricsByType('realtime')
    const renderMetrics = this.getMetricsByType('render')
    const networkMetrics = this.getMetricsByType('network')

    const submitTurnMetrics = rpcMetrics.filter(m => m.name === 'submit_turn')
    const pushMetrics = realtimeMetrics.filter(m => m.name === 'push')

    return {
      rpc: {
        submitTurn: {
          ...this.calculatePercentiles(submitTurnMetrics),
          errorRate: this.calculateErrorRate(submitTurnMetrics)
        }
      },
      realtime: {
        pushLatency: {
          ...this.calculatePercentiles(pushMetrics)
        },
        disconnectRate: this.calculateErrorRate(realtimeMetrics.filter(m => m.name === 'disconnect'))
      },
      render: {
        fcp: renderMetrics.find(m => m.name === 'fcp')?.duration || 0,
        lcp: renderMetrics.find(m => m.name === 'lcp')?.duration || 0,
        cls: renderMetrics.find(m => m.name === 'cls')?.duration || 0,
        ttfb: networkMetrics.find(m => m.name === 'ttfb')?.duration || 0
      },
      resources: {
        cpu: {
          avg: 0,
          max: 0
        },
        memory: {
          avg: 0,
          max: 0
        }
      }
    }
  }

  exportMetrics(): string {
    return JSON.stringify({
      baseline: this.generateBaseline(),
      rawMetrics: this.metrics
    }, null, 2)
  }

  reset() {
    this.metrics = []
    this.startTime = Date.now()
  }
}

export const performanceCollector = new PerformanceCollector()
