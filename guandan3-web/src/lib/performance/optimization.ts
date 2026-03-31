import { useEffect, useRef, useCallback, useState, useMemo } from 'react'

import { logger } from '@/lib/utils/logger'
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    },
    [callback, delay]
  ) as T
  
  return debouncedCallback
}

export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)
    
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])
  
  return debouncedValue
}

export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const lastRunRef = useRef<number>(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  
  const throttledCallback = useCallback(
    (...args: Parameters<T>) => {
      const now = Date.now()
      const timeSinceLastRun = now - lastRunRef.current
      
      if (timeSinceLastRun >= delay) {
        callback(...args)
        lastRunRef.current = now
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args)
          lastRunRef.current = Date.now()
        }, delay - timeSinceLastRun)
      }
    },
    [callback, delay]
  ) as T
  
  return throttledCallback
}

export function useIntersectionObserver(
  targetRef: React.RefObject<Element>,
  callback: IntersectionObserverCallback,
  options?: IntersectionObserverInit
) {
  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    
    const observer = new IntersectionObserver(callback, options)
    observer.observe(target)
    
    return () => {
      observer.disconnect()
    }
  }, [targetRef, callback, options])
}

export function useLazyLoad<T>(
  loader: () => Promise<T>,
  options?: {
    threshold?: number
    rootMargin?: string
  }
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const elementRef = useRef<HTMLDivElement | null>(null)
  const [hasLoaded, setHasLoaded] = useState(false)
  
  useIntersectionObserver(
    elementRef as React.RefObject<Element>,
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !hasLoaded) {
          setHasLoaded(true)
          setLoading(true)
          setError(null)
          
          loader()
            .then((result) => {
              setData(result)
              setLoading(false)
            })
            .catch((err) => {
              setError(err)
              setLoading(false)
            })
        }
      })
    },
    {
      threshold: options?.threshold || 0.1,
      rootMargin: options?.rootMargin || '50px'
    }
  )
  
  return { data, loading, error, elementRef }
}

export function useVirtualScroll<T>(
  items: T[],
  itemHeight: number,
  containerHeight: number
) {
  const [scrollTop, setScrollTop] = useState(0)
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null)
  
  const visibleStart = Math.floor(scrollTop / itemHeight)
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 2,
    items.length
  )
  
  const visibleItems = items.slice(visibleStart, visibleEnd)
  const offsetY = visibleStart * itemHeight
  
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])
  
  return {
    visibleItems,
    offsetY,
    containerRef,
    handleScroll,
    totalHeight: items.length * itemHeight
  }
}

export function usePerformanceMonitor(componentName: string) {
  const renderCountRef = useRef(0)
  const mountTimeRef = useRef<number>(0)
  
  useEffect(() => {
    if (mountTimeRef.current === 0) {
      mountTimeRef.current = Date.now()
    }
    renderCountRef.current += 1
    
    if (process.env.NODE_ENV === 'development') {
      const renderTime = Date.now() - mountTimeRef.current
      logger.debug(
        `[Performance] ${componentName} rendered ${renderCountRef.current} times, ` +
        `current render took ${renderTime}ms`
      )
    }
  })
  
  useEffect(() => {
    return () => {
      const totalTime = Date.now() - mountTimeRef.current
      if (process.env.NODE_ENV === 'development') {
        logger.debug(
          `[Performance] ${componentName} unmounted after ${totalTime}ms, ` +
          `total renders: ${renderCountRef.current}`
        )
      }
    }
  }, [componentName])
}

export function useRequestAnimationFrame(callback: () => void) {
  const requestRef = useRef<number>(0)
  const previousTimeRef = useRef<number | undefined>(undefined)
  
  useEffect(() => {
    const animate = (time: number) => {
      if (previousTimeRef.current !== undefined) {
        callback()
      }
      previousTimeRef.current = time
      requestRef.current = requestAnimationFrame(animate)
    }
    
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [callback])
}

export function useIdleCallback(callback: () => void, timeout: number = 5000) {
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => callback())
      } else {
        callback()
      }
    }, timeout)
    
    return () => clearTimeout(timeoutId)
  }, [callback, timeout])
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches
    }
    return false
  })
  
  useEffect(() => {
    const mediaQuery = window.matchMedia(query)
    
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches)
    }
    
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])
  
  return matches
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}

export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)')
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [effectiveType, setEffectiveType] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'connection' in navigator) {
      const connection = (navigator as any).connection
      return connection?.effectiveType || ''
    }
    return ''
  })
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      
      const handleConnectionChange = () => {
        setEffectiveType(connection?.effectiveType || '')
      }
      
      connection?.addEventListener('change', handleConnectionChange)
      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection?.removeEventListener('change', handleConnectionChange)
      }
    }
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return { isOnline, effectiveType }
}

export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)
  
  useEffect(() => {
    if ('memory' in performance) {
      const updateMemory = () => {
        const memory = (performance as any).memory
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
      }
      
      const interval = setInterval(updateMemory, 5000)
      updateMemory()
      
      return () => clearInterval(interval)
    }
  }, [])
  
  return memoryInfo
}

export function useFPSMonitor() {
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)
  
  useEffect(() => {
    lastTimeRef.current = Date.now()
    
    const updateFPS = () => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      
      if (delta >= 1000) {
        const currentFPS = Math.round((frameCountRef.current * 1000) / delta)
        setFps(currentFPS)
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
    }
    
    const interval = setInterval(updateFPS, 1000)
    
    const handleFrame = () => {
      frameCountRef.current++
      requestAnimationFrame(handleFrame)
    }
    
    requestAnimationFrame(handleFrame)
    
    return () => {
      clearInterval(interval)
    }
  }, [])
  
  return fps
}

export function useOptimizedImage(src: string, options?: {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png'
}) {
  const optimizedSrc = useMemo(() => {
    const params = new URLSearchParams()
    
    if (options?.width) params.append('w', options.width.toString())
    if (options?.height) params.append('h', options.height.toString())
    if (options?.quality) params.append('q', options.quality.toString())
    if (options?.format) params.append('f', options.format)
    
    const queryString = params.toString()
    return queryString ? `${src}?${queryString}` : src
  }, [src, options])
  
  return optimizedSrc
}
