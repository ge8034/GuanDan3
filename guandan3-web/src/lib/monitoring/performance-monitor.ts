import { logger } from '@/lib/utils/logger'

export interface PerformanceMetrics {
  page: string
  timestamp: number
  fcp?: number
  lcp?: number
  fid?: number
  cls?: number
  ttfb?: number
  loadTime?: number
}

export interface ErrorData {
  message: string
  stack?: string
  timestamp: number
  userAgent: string
  url: string
  userId?: string
  level: 'error' | 'warning' | 'info'
}

export interface UserAction {
  type: string
  page: string
  timestamp: number
  userId?: string
  metadata?: Record<string, any>
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor
  private metrics: PerformanceMetrics[] = []
  private errors: ErrorData[] = []
  private actions: UserAction[] = []
  private userId?: string

  private constructor() {
    if (typeof window !== 'undefined') {
      this.initPerformanceObserver()
      this.initErrorTracking()
      this.initUserActionTracking()
    }
  }

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor()
    }
    return PerformanceMonitor.instance
  }

  setUserId(userId: string) {
    this.userId = userId
  }

  private initPerformanceObserver() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            const paintEntry = entry as PerformancePaintTiming
            if (paintEntry.name === 'first-contentful-paint') {
              this.trackFCP(paintEntry.startTime)
            }
          } else if (entry.entryType === 'largest-contentful-paint') {
            const lcpEntry = entry as any
            this.trackLCP(lcpEntry.startTime)
          }
        }
      })

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] })
    }

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'layout-shift') {
            const clsEntry = entry as any
            if (!clsEntry.hadRecentInput) {
              this.trackCLS(clsEntry.value)
            }
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })
    }

    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            const fidEntry = entry as any
            this.trackFID(fidEntry.processingStart - fidEntry.startTime)
          }
        }
      })

      observer.observe({ entryTypes: ['first-input'] })
    }
  }

  private initErrorTracking() {
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => {
        this.trackError({
          message: event.message || 'Unknown error',
          stack: event.error?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.userId,
          level: 'error'
        })
      })

      window.addEventListener('unhandledrejection', (event) => {
        this.trackError({
          message: event.reason?.message || 'Unhandled promise rejection',
          stack: event.reason?.stack,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href,
          userId: this.userId,
          level: 'error'
        })
      })
    }
  }

  private initUserActionTracking() {
    if (typeof window !== 'undefined') {
      const trackAction = (type: string, metadata?: Record<string, any>) => {
        this.trackUserAction({
          type,
          page: window.location.pathname,
          timestamp: Date.now(),
          userId: this.userId,
          metadata
        })
      }

      document.addEventListener('click', (e) => {
        const target = e.target as HTMLElement
        trackAction('click', {
          tagName: target.tagName,
          id: target.id,
          className: target.className
        })
      })

      document.addEventListener('submit', (e) => {
        const target = e.target as HTMLFormElement
        trackAction('submit', {
          action: target.action,
          method: target.method
        })
      })

      window.addEventListener('popstate', () => {
        trackAction('navigation', {
          url: window.location.href
        })
      })
    }
  }

  trackPageLoad(page: string) {
    const navigation = performance.getEntriesByType('navigation')[0] as any
    const metrics: PerformanceMetrics = {
      page,
      timestamp: Date.now(),
      fcp: this.getMetric('fcp'),
      lcp: this.getMetric('lcp'),
      fid: this.getMetric('fid'),
      cls: this.getMetric('cls'),
      ttfb: navigation?.responseStart - navigation?.requestStart,
      loadTime: navigation?.loadEventEnd - navigation?.fetchStart
    }

    this.metrics.push(metrics)
    this.sendMetrics(metrics)
  }

  private trackFCP(value: number) {
    this.setMetric('fcp', value)
  }

  private trackLCP(value: number) {
    this.setMetric('lcp', value)
  }

  private trackFID(value: number) {
    this.setMetric('fid', value)
  }

  private trackCLS(value: number) {
    const currentCLS = this.getMetric('cls') || 0
    this.setMetric('cls', currentCLS + value)
  }

  private metricsMap: Record<string, number> = {}

  private setMetric(key: string, value: number) {
    this.metricsMap[key] = value
  }

  private getMetric(key: string): number | undefined {
    return this.metricsMap[key]
  }

  trackError(error: ErrorData) {
    this.errors.push(error)
    this.sendError(error)
  }

  trackUserAction(action: UserAction) {
    this.actions.push(action)
    this.sendAction(action)
  }

  private async sendMetrics(metrics: PerformanceMetrics) {
    if (process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING !== 'true') {
      return
    }

    try {
      await fetch('/api/monitoring/performance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(metrics)
      })
    } catch (error) {
      logger.error('Failed to send performance metrics:', error)
    }
  }

  private async sendError(error: ErrorData) {
    if (process.env.NEXT_PUBLIC_ENABLE_ERROR_TRACKING !== 'true') {
      return
    }

    try {
      await fetch('/api/monitoring/error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(error)
      })
    } catch (err) {
      logger.error('Failed to send error data:', err)
    }
  }

  private async sendAction(action: UserAction) {
    if (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS !== 'true') {
      return
    }

    try {
      await fetch('/api/monitoring/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(action)
      })
    } catch (error) {
      logger.error('Failed to send analytics data:', error)
    }
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  getErrors(): ErrorData[] {
    return [...this.errors]
  }

  getActions(): UserAction[] {
    return [...this.actions]
  }

  clearMetrics() {
    this.metrics = []
    this.errors = []
    this.actions = []
    this.metricsMap = {}
  }
}

export const performanceMonitor = PerformanceMonitor.getInstance()
