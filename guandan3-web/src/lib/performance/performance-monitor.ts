import { logger } from '@/lib/utils/logger'

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  category: 'render' | 'network' | 'memory' | 'custom'
}

interface PerformanceReport {
  timestamp: number
  metrics: PerformanceMetric[]
  summary: {
    avgRenderTime: number
    avgNetworkTime: number
    memoryUsage: number
    fps: number
  }
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private fps: number = 60
  private frameCount: number = 0
  private lastFrameTime: number = performance.now()
  private lastUpdate: number = performance.now()
  private updateInterval: number = 1000
  private observers: PerformanceObserver[] = []

  constructor() {
    this.setupFPSTracking()
    this.setupPerformanceObservers()
  }

  private setupFPSTracking(): void {
    const trackFrame = () => {
      this.frameCount++
      const now = performance.now()
      const elapsed = now - this.lastUpdate

      if (elapsed >= this.updateInterval) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed)
        this.frameCount = 0
        this.lastUpdate = now

        this.recordMetric('fps', this.fps, 'render')
      }

      requestAnimationFrame(trackFrame)
    }

    requestAnimationFrame(trackFrame)
  }

  private setupPerformanceObservers(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

    try {
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            this.recordMetric(entry.name, entry.startTime, 'render')
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(paintObserver)
    } catch (e) {
      logger.warn('[PerformanceMonitor] Paint observer not supported')
    }

    try {
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift' && !(entry as any).hadRecentInput) {
            this.recordMetric('layout-shift', (entry as any).value, 'render')
          }
        }
      })
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(layoutShiftObserver)
    } catch (e) {
      logger.warn('[PerformanceMonitor] Layout shift observer not supported')
    }

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'largest-contentful-paint') {
            this.recordMetric('LCP', entry.startTime, 'render')
          }
        }
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)
    } catch (e) {
      logger.warn('[PerformanceMonitor] LCP observer not supported')
    }
  }

  recordMetric(name: string, value: number, category: PerformanceMetric['category']): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: performance.now(),
      category
    }

    this.metrics.push(metric)
    this.cleanupOldMetrics()
  }

  private cleanupOldMetrics(): void {
    const maxAge = 5 * 60 * 1000
    const now = performance.now()
    this.metrics = this.metrics.filter(m => now - m.timestamp < maxAge)
  }

  getMetrics(category?: PerformanceMetric['category']): PerformanceMetric[] {
    if (category) {
      return this.metrics.filter(m => m.category === category)
    }
    return [...this.metrics]
  }

  getMetric(name: string): number | null {
    const metric = this.metrics.find(m => m.name === name)
    return metric ? metric.value : null
  }

  getAverageMetric(name: string, timeWindow: number = 5000): number {
    const now = performance.now()
    const recentMetrics = this.metrics.filter(
      m => m.name === name && now - m.timestamp < timeWindow
    )

    if (recentMetrics.length === 0) return 0

    const sum = recentMetrics.reduce((acc, m) => acc + m.value, 0)
    return sum / recentMetrics.length
  }

  getFPS(): number {
    return this.fps
  }

  getMemoryUsage(): number {
    if (typeof window === 'undefined' || !(performance as any).memory) {
      return 0
    }

    const memory = (performance as any).memory
    return memory.usedJSHeapSize / 1024 / 1024
  }

  generateReport(): PerformanceReport {
    const renderMetrics = this.getMetrics('render')
    const networkMetrics = this.getMetrics('network')

    const avgRenderTime = this.calculateAverage(renderMetrics.map(m => m.value))
    const avgNetworkTime = this.calculateAverage(networkMetrics.map(m => m.value))
    const memoryUsage = this.getMemoryUsage()

    return {
      timestamp: performance.now(),
      metrics: [...this.metrics],
      summary: {
        avgRenderTime,
        avgNetworkTime,
        memoryUsage,
        fps: this.fps
      }
    }
  }

  private calculateAverage(values: number[]): number {
    if (values.length === 0) return 0
    const sum = values.reduce((acc, v) => acc + v, 0)
    return sum / values.length
  }

  measurePerformance<T>(name: string, fn: () => T): T {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start

    this.recordMetric(name, duration, 'custom')

    if (duration > 100) {
      logger.warn(`[PerformanceMonitor] ${name} took ${duration.toFixed(2)}ms`)
    }

    return result
  }

  async measureAsyncPerformance<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start

    this.recordMetric(name, duration, 'custom')

    if (duration > 100) {
      logger.warn(`[PerformanceMonitor] ${name} took ${duration.toFixed(2)}ms`)
    }

    return result
  }

  reset(): void {
    this.metrics = []
    this.frameCount = 0
    this.lastFrameTime = performance.now()
    this.lastUpdate = performance.now()
  }

  destroy(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.reset()
  }
}

export const performanceMonitor = new PerformanceMonitor()

export function usePerformanceTracking(componentName: string) {
  return {
    trackRender: () => {
      const start = performance.now()
      return () => {
        const duration = performance.now() - start
        performanceMonitor.recordMetric(`${componentName}-render`, duration, 'render')
      }
    },
    trackOperation: (operationName: string, fn: () => any) => {
      return performanceMonitor.measurePerformance(`${componentName}-${operationName}`, fn)
    },
    getMetrics: () => performanceMonitor.getMetrics(),
    getFPS: () => performanceMonitor.getFPS()
  }
}

export function getWebVitals() {
  const metrics = performanceMonitor.getMetrics('render')
  
  const fcp = metrics.find(m => m.name === 'first-contentful-paint')?.value || 0
  const lcp = metrics.find(m => m.name === 'LCP')?.value || 0
  const cls = metrics.find(m => m.name === 'layout-shift')?.value || 0
  const fid = metrics.find(m => m.name === 'FID')?.value || 0
  const ttfb = metrics.find(m => m.name === 'TTFB')?.value || 0

  return {
    fcp,
    lcp,
    cls,
    fid,
    ttfb
  }
}

export function getPerformanceReport() {
  return performanceMonitor.generateReport()
}
