import { logger } from '@/lib/utils/logger'

interface ResourceLoadConfig {
  preload: boolean
  priority: 'high' | 'low' | 'auto'
  fetchPriority?: 'high' | 'low' | 'auto'
}

interface ResourceMetrics {
  name: string
  type: string
  loadTime: number
  size: number
  cached: boolean
}

class ResourceOptimizer {
  private metrics: ResourceMetrics[] = []
  private preloadedResources: Set<string> = new Set()
  private readonly MAX_METRICS = 50

  preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font', config: ResourceLoadConfig = { preload: true, priority: 'auto' }): void {
    if (!config.preload || this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = url

    switch (type) {
      case 'script':
        link.as = 'script'
        break
      case 'style':
        link.as = 'style'
        break
      case 'image':
        link.as = 'image'
        break
      case 'font':
        link.as = 'font'
        link.type = 'font/woff2'
        link.crossOrigin = 'anonymous'
        break
    }

    if (config.fetchPriority) {
      link.setAttribute('fetchpriority', config.fetchPriority)
    }

    document.head.appendChild(link)
    this.preloadedResources.add(url)
  }

  prefetchResource(url: string): void {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
    this.preloadedResources.add(url)
  }

  async measureResourceLoad(url: string, type: string): Promise<ResourceMetrics> {
    const startTime = performance.now()
    let size = 0
    let cached = false

    try {
      const response = await fetch(url, { cache: 'force-cache' })
      const blob = await response.blob()
      size = blob.size
      cached = response.headers.get('X-Cache') === 'HIT'
    } catch (error) {
      logger.warn('[ResourceOptimizer] Failed to measure resource:', { url, error })
    }

    const loadTime = performance.now() - startTime
    const metrics: ResourceMetrics = {
      name: url,
      type,
      loadTime,
      size,
      cached
    }

    this.recordMetrics(metrics)
    return metrics
  }

  private recordMetrics(metrics: ResourceMetrics): void {
    this.metrics.push(metrics)
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }
  }

  getMetrics(): ResourceMetrics[] {
    return [...this.metrics]
  }

  getAverageLoadTime(type?: string): number {
    const filtered = type 
      ? this.metrics.filter(m => m.type === type)
      : this.metrics

    if (filtered.length === 0) return 0

    const total = filtered.reduce((sum, m) => sum + m.loadTime, 0)
    return total / filtered.length
  }

  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0

    const hits = this.metrics.filter(m => m.cached).length
    return (hits / this.metrics.length) * 100
  }

  optimizeImageLoading(): void {
    if ('loading' in HTMLImageElement.prototype) {
      const images = document.querySelectorAll('img:not([loading])')
      images.forEach(img => {
        if (img.getBoundingClientRect().top > window.innerHeight) {
          img.setAttribute('loading', 'lazy')
        }
      })
    }
  }

  setupIntersectionObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.01
    })
  }

  clearMetrics(): void {
    this.metrics = []
  }

  reset(): void {
    this.clearMetrics()
    this.preloadedResources.clear()
  }
}

export const resourceOptimizer = new ResourceOptimizer()

export function setupResourcePreloading(): void {
  if (typeof window === 'undefined') return

  const criticalResources = [
    { url: '/fonts/noto-serif-sc.woff2', type: 'font' as const, priority: 'high' as const },
  ]

  criticalResources.forEach(resource => {
    resourceOptimizer.preloadResource(resource.url, resource.type, {
      preload: true,
      priority: resource.priority,
      fetchPriority: resource.priority
    })
  })
}

export function setupPerformanceObserver(): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'resource') {
        const resource = entry as PerformanceResourceTiming
        const metrics: ResourceMetrics = {
          name: resource.name,
          type: resource.initiatorType,
          loadTime: resource.duration,
          size: resource.transferSize,
          cached: resource.transferSize === 0
        }
        resourceOptimizer['recordMetrics'](metrics)
      }
    }
  })

  observer.observe({ entryTypes: ['resource'] })
}
