import { useEffect, useRef } from 'react'
import { createPerformanceMonitor } from '@/lib/utils/performance'

interface PerformanceMonitorOptions {
  componentName: string
  threshold?: number
  onSlowRender?: (duration: number) => void
}

export const usePerformanceMonitor = ({
  componentName,
  threshold = 16,
  onSlowRender
}: PerformanceMonitorOptions) => {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(0)

  useEffect(() => {
    renderCount.current++
    const now = Date.now()
    
    if (lastRenderTime.current > 0) {
      const duration = now - lastRenderTime.current
      
      if (duration > threshold) {
        if (process.env.NODE_ENV === 'development') {
          console.warn(
            `[Performance] ${componentName} slow render detected: ${duration}ms (threshold: ${threshold}ms)`
          )
        }
        
        onSlowRender?.(duration)
      }
    }
    
    lastRenderTime.current = now
  })

  return {
    getRenderCount: () => renderCount.current,
    getLastRenderTime: () => lastRenderTime.current
  }
}

export const useMeasureRender = (componentName: string) => {
  const startTime = useRef<number>(0)

  useEffect(() => {
    startTime.current = typeof window !== 'undefined' ? window.performance.now() : 0
    
    return () => {
      if (startTime.current) {
        const duration = (typeof window !== 'undefined' ? window.performance.now() : 0) - startTime.current
        
        if (process.env.NODE_ENV === 'development' && duration > 16) {
          console.warn(
            `[Performance] ${componentName} render took ${duration.toFixed(2)}ms`
          )
        }
      }
    }
  }, [componentName])
}

export const useDebounce = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T => {
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return ((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    timeoutRef.current = setTimeout(() => {
      fn(...args)
    }, delay)
  }) as T
}

export const useThrottle = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T => {
  const lastCallRef = useRef(0)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return ((...args: Parameters<T>) => {
    const now = Date.now()
    const timeSinceLastCall = now - lastCallRef.current

    if (timeSinceLastCall >= delay) {
      fn(...args)
      lastCallRef.current = now
    } else if (!timeoutRef.current) {
      timeoutRef.current = setTimeout(() => {
        fn(...args)
        lastCallRef.current = Date.now()
        timeoutRef.current = undefined
      }, delay - timeSinceLastCall)
    }
  }) as T
}

export const useIdleCallback = <T extends (...args: any[]) => any>(
  fn: T,
  options?: { timeout?: number }
): void => {
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(
          () => {
            fnRef.current()
          },
          options
        )
      } else {
        fnRef.current()
      }
    }, 0)

    return () => clearTimeout(timeoutId)
  }, [options])
}
