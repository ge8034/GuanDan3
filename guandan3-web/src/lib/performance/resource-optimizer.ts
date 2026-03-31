import { logger } from '@/lib/utils/logger'

/**
 * 资源预加载配置
 */
interface ResourceLoadConfig {
  /** 是否启用预加载，默认 true */
  preload: boolean
  /** 资源优先级 */
  priority: 'high' | 'low' | 'auto'
  /** fetch 优先级 */
  fetchPriority?: 'high' | 'low' | 'auto'
}

/**
 * 资源性能指标
 */
interface ResourceMetrics {
  /** 资源名称/URL */
  name: string
  /** 资源类型 */
  type: string
  /** 加载耗时（毫秒） */
  loadTime: number
  /** 资源大小（字节） */
  size: number
  /** 是否来自缓存 */
  cached: boolean
}

/**
 * 资源优化器
 *
 * 管理资源预加载、预取和性能监控。
 * 使用单例模式，通过 resourceOptimizer 实例访问。
 *
 * @example
 * ```ts
 * import { resourceOptimizer } from '@/lib/performance/resource-optimizer'
 *
 * // 预加载关键资源
 * resourceOptimizer.preloadResource('/fonts/main.woff2', 'font', {
 *   preload: true,
 *   priority: 'high',
 *   fetchPriority: 'high'
 * })
 *
 * // 预取未来可能需要的资源
 * resourceOptimizer.prefetchResource('/images/next-level.png')
 *
 * // 测量资源加载性能
 * const metrics = await resourceOptimizer.measureResourceLoad('/api/data', 'json')
 * console.log(`Loaded in ${metrics.loadTime}ms, cached: ${metrics.cached}`)
 *
 * // 获取平均加载时间
 * const avgTime = resourceOptimizer.getAverageLoadTime('image')
 *
 * // 获取缓存命中率
 * const hitRate = resourceOptimizer.getCacheHitRate()
 * ```
 *
 * @remarks
 * - 最多保存 50 条性能指标记录
 * - 预加载的资源会自动去重
 * - 图片懒加载自动优化
 */
class ResourceOptimizer {
  private metrics: ResourceMetrics[] = []
  private preloadedResources: Set<string> = new Set()
  private readonly MAX_METRICS = 50

  /**
   * 预加载资源
   *
   * 使用 `<link rel="preload">` 提前加载关键资源
   *
   * @param url - 资源 URL
   * @param type - 资源类型
   * @param config - 预加载配置
   */
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

  /**
   * 预取资源
   *
   * 使用 `<link rel="prefetch">` 标记未来可能需要的资源
   *
   * @param url - 资源 URL
   */
  prefetchResource(url: string): void {
    if (this.preloadedResources.has(url)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
    this.preloadedResources.add(url)
  }

  /**
   * 测量资源加载性能
   *
   * @param url - 资源 URL
   * @param type - 资源类型标识
   * @returns 性能指标
   */
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

  /**
   * 记录性能指标
   */
  private recordMetrics(metrics: ResourceMetrics): void {
    this.metrics.push(metrics)
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics.shift()
    }
  }

  /**
   * 获取所有性能指标
   */
  getMetrics(): ResourceMetrics[] {
    return [...this.metrics]
  }

  /**
   * 获取平均加载时间
   *
   * @param type - 可选的资源类型过滤
   * @returns 平均加载时间（毫秒）
   */
  getAverageLoadTime(type?: string): number {
    const filtered = type ? this.metrics.filter(m => m.type === type) : this.metrics

    if (filtered.length === 0) return 0

    const total = filtered.reduce((sum, m) => sum + m.loadTime, 0)
    return total / filtered.length
  }

  /**
   * 获取缓存命中率
   *
   * @returns 缓存命中百分比 (0-100)
   */
  getCacheHitRate(): number {
    if (this.metrics.length === 0) return 0

    const hits = this.metrics.filter(m => m.cached).length
    return (hits / this.metrics.length) * 100
  }

  /**
   * 优化图片加载（添加懒加载）
   */
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

  /**
   * 设置交叉观察器
   *
   * @param callback - 回调函数
   * @returns IntersectionObserver 实例
   */
  setupIntersectionObserver(callback: (entries: IntersectionObserverEntry[]) => void): IntersectionObserver {
    return new IntersectionObserver(callback, {
      rootMargin: '50px',
      threshold: 0.01
    })
  }

  /**
   * 清除性能指标
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * 重置优化器状态
   */
  reset(): void {
    this.clearMetrics()
    this.preloadedResources.clear()
  }
}

/**
 * 资源优化器单例实例
 */
export const resourceOptimizer = new ResourceOptimizer()

/**
 * 设置资源预加载
 *
 * 在应用启动时调用，预加载关键资源
 *
 * @example
 * ```ts
 * import { setupResourcePreloading } from '@/lib/performance/resource-optimizer'
 *
 * // 在 layout.tsx 或应用入口调用
 * setupResourcePreloading()
 * ```
 */
export function setupResourcePreloading(): void {
  if (typeof window === 'undefined') return

  // 暂时禁用字体预加载，因为字体文件不存在
  // TODO: 添加字体文件后重新启用
  const criticalResources: Array<{ url: string; type: 'script' | 'style' | 'image' | 'font'; priority: 'high' | 'low' | 'auto' }> = [
    // { url: '/fonts/noto-serif-sc.woff2', type: 'font' as const, priority: 'high' as const },
  ]

  criticalResources.forEach(resource => {
    resourceOptimizer.preloadResource(resource.url, resource.type, {
      preload: true,
      priority: resource.priority,
      fetchPriority: resource.priority
    })
  })
}

/**
 * 设置性能观察器
 *
 * 监听资源加载性能并自动记录指标
 *
 * @example
 * ```ts
 * import { setupPerformanceObserver } from '@/lib/performance/resource-optimizer'
 *
 * // 在应用启动时调用
 * setupPerformanceObserver()
 * ```
 */
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
