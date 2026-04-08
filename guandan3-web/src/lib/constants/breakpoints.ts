/**
 * 响应式断点系统
 *
 * 断点定义基于常见设备尺寸：
 * - xs: < 640px (手机竖屏)
 * - sm: 640px - 768px (手机横屏/小平板)
 * - md: 768px - 1024px (平板竖屏)
 * - lg: 1024px - 1280px (平板横屏/小笔记本)
 * - xl: 1280px - 1536px (桌面)
 * - 2xl: 1536px - 1920px (大桌面)
 * - 3xl: > 1920px (超大屏幕/4K)
 */

export const BREAKPOINTS = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  '3xl': '1920px',
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * 响应式容器最大宽度
 */
export const CONTAINER_WIDTHS = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const

/**
 * 组件响应式尺寸映射
 */
export const RESPONSIVE_SIZES = {
  // 按钮尺寸
  button: {
    mobile: 'sm',
    desktop: 'md',
  },
  // 字体尺寸
  heading: {
    mobile: '2xl',
    tablet: '3xl',
    desktop: '4xl',
  },
  // 间距
  spacing: {
    mobile: 4,
    tablet: 6,
    desktop: 8,
  },
  // 卡片网格
  grid: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
  },
} as const

/**
 * 媒体查询辅助函数
 */
export const mediaQuery = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  '3xl': '(min-width: 1920px)',

  // 范围查询
  'sm-only': '(min-width: 640px) and (max-width: 767px)',
  'md-only': '(min-width: 768px) and (max-width: 1023px)',
  'lg-only': '(min-width: 1024px) and (max-width: 1279px)',

  // 最大宽度查询
  'max-sm': '(max-width: 639px)',
  'max-md': '(max-width: 767px)',
  'max-lg': '(max-width: 1023px)',
} as const

/**
 * 获取当前断点范围
 */
export function getBreakpointRange(width: number): Breakpoint {
  if (width < 640) return 'xs'
  if (width < 768) return 'sm'
  if (width < 1024) return 'md'
  if (width < 1280) return 'lg'
  if (width < 1536) return 'xl'
  if (width < 1920) return '2xl'
  return '3xl'
}

/**
 * 响应式间距值（单位：rem）
 */
export const SPACING = {
  mobile: {
    xs: 0.5,
    sm: 1,
    md: 1.5,
    lg: 2,
    xl: 3,
  },
  desktop: {
    xs: 0.75,
    sm: 1.25,
    md: 2,
    lg: 2.5,
    xl: 4,
  },
} as const
