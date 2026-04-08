import { useState, useEffect } from 'react'
import { BREAKPOINTS, getBreakpointRange, type Breakpoint } from '@/lib/constants/breakpoints'

/**
 * 获取当前断点
 * @returns 当前断点值
 *
 * @example
 * const breakpoint = useBreakpoint()
 * if (breakpoint === 'sm') {
 *   // 小屏幕逻辑
 * }
 */
export function useBreakpoint(): Breakpoint {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(() => {
    if (typeof window === 'undefined') return 'md'
    return getBreakpointRange(window.innerWidth)
  })

  useEffect(() => {
    const updateBreakpoint = () => {
      setBreakpoint(getBreakpointRange(window.innerWidth))
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return breakpoint
}

/**
 * 媒体查询Hook
 * @param query 媒体查询字符串
 * @returns 是否匹配查询
 *
 * @example
 * const isMobile = useMediaQuery('(max-width: 767px)')
 * const isDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const media = window.matchMedia(query)
    setMatches(media.matches)

    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [query])

  return matches
}

/**
 * 断点匹配Hook
 * @param breakpoint 要检查的断点
 * @returns 是否达到或超过该断点
 *
 * @example
 * const isTablet = useMinBreakpoint('md') // >= 768px
 * const isDesktop = useMinBreakpoint('lg') // >= 1024px
 */
export function useMinBreakpoint(breakpoint: Breakpoint): boolean {
  const query = `(min-width: ${BREAKPOINTS[breakpoint]})`
  return useMediaQuery(query)
}

/**
 * 最大断点匹配Hook
 * @param breakpoint 要检查的断点
 * @returns 是否小于该断点
 *
 * @example
 * const isMobile = useMaxBreakpoint('sm') // < 640px
 * const isNotDesktop = useMaxBreakpoint('lg') // < 1024px
 */
export function useMaxBreakpoint(breakpoint: Breakpoint): boolean {
  const query = `(max-width: ${parseInt(BREAKPOINTS[breakpoint]) - 1}px)`
  return useMediaQuery(query)
}

/**
 * 断点范围Hook
 * @param min 最小断点
 * @param max 最大断点
 * @returns 是否在断点范围内
 *
 * @example
 * const isTabletOnly = useBreakpointRange('md', 'lg') // 768px - 1279px
 */
export function useBreakpointRange(min: Breakpoint, max: Breakpoint): boolean {
  const query = `(min-width: ${BREAKPOINTS[min]}) and (max-width: ${parseInt(BREAKPOINTS[max]) - 1}px)`
  return useMediaQuery(query)
}

/**
 * 响应式值Hook
 * 根据断点返回不同的值
 *
 * @param values 响应式值映射
 * @returns 当前断点对应的值
 *
 * @example
 * const fontSize = useResponsiveValue({
 *   sm: '14px',
 *   md: '16px',
 *   lg: '18px',
 * })
 */
export function useResponsiveValue<T>(values: Partial<Record<Breakpoint, T>>, defaultValue: T): T {
  const breakpoint = useBreakpoint()

  // 按断点从大到小检查
  const orderedBreakpoints: Breakpoint[] = ['3xl', '2xl', 'xl', 'lg', 'md', 'sm', 'xs']

  for (const bp of orderedBreakpoints) {
    if (values[bp] !== undefined) {
      const bpValue = parseInt(BREAKPOINTS[bp])
      const currentValue = parseInt(BREAKPOINTS[breakpoint])
      if (currentValue >= bpValue) {
        return values[bp]!
      }
    }
  }

  return defaultValue
}
