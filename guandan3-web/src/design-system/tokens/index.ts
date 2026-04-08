/**
 * Design Tokens - 统一导出
 *
 * 完整的设计Token系统
 * 基于Impeccable Design规范
 */

// ============================================
// 导出所有Token
// ============================================
export * from './colors'
export * from './typography'
export * from './spacing'
export * from './motion'
export * from './z-index'

// ============================================
// 类型定义
// ============================================
/**
 * 组件大小变体
 */
export type SizeVariant = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

/**
 * 组件颜色变体
 */
export type ColorVariant =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'

/**
 * 圆角变体
 */
export type RadiusVariant = 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'

/**
 * 阴影变体
 */
export type ShadowVariant = 'none' | 'sm' | 'md' | 'lg' | 'xl'

// ============================================
// 圆角系统
// ============================================
/**
 * 圆角半径
 * 与4pt间距系统保持一致
 */
export const radius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.25rem',    // 4px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',   // 完全圆形
} as const

// ============================================
// 阴影系统
// ============================================
/**
 * 阴影层级
 * 创造深度和层次感
 * 阴影应该微妙——如果明显可见，可能太强了
 */
export const shadow = {
  none: 'none',

  // 小阴影（微妙）
  sm: '0 1px 2px rgba(0, 0, 0, 0.05)',

  // 中阴影（标准）
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',

  // 大阴影（明显）
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',

  // 超大阴影（强调）
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',

  // 内阴影
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',

  // 焦点环（可访问性）
  focus: '0 0 0 3px rgba(212, 175, 55, 0.3)',

  // 金色发光（Poker主题）
  goldGlow: '0 0 20px rgba(212, 175, 55, 0.5), 0 0 40px rgba(212, 175, 55, 0.3)',
} as const

// ============================================
// 断点系统
// ============================================
/**
 * 响应式断点
 * 移动优先策略
 */
export const breakpoint = {
  // 移动端（默认）
  sm: '640px',    // 小手机

  // 平板（竖屏）
  md: '768px',    // 平板

  // 平板（横屏）/ 小笔记本
  lg: '1024px',   // 桌面

  // 桌面
  xl: '1280px',   // 大桌面

  // 超大屏
  '2xl': '1536px', // 超大桌面
} as const

// ============================================
// 完整Token系统导出
// ============================================
/**
 * Design Tokens 主导出
 * 包含所有设计Token
 */
export const tokens = {
  // 颜色
  colors: {
    neutral,
    poker,
    semantic,
    ratio,
  },

  // 排版
  typography: {
    fontFamily,
    fontSize,
    lineHeight,
    fontWeight,
    letterSpacing,
    measure,
    textStyles,
  },

  // 间距
  spacing: {
    spacing,
    semantic: semanticSpacing,
    responsive: responsiveSpacing,
    component: componentSpacing,
    gap,
    touchTarget,
  },

  // 动效
  motion: {
    duration,
    easing,
    transition,
    animations,
    spring,
  },

  // 其他
  radius,
  shadow,
  zIndex: zIndices,
  breakpoint,
} as const

// 重新导入各个模块的内容
import {
  neutral,
  poker,
  semantic,
  ratio,
  colors,
} from './colors'

import {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  measure,
  textStyles,
  typography,
} from './typography'

import {
  spacing,
  semanticSpacing,
  responsiveSpacing,
  componentSpacing,
  gap,
  touchTarget,
  grouping,
  spacingTokens,
} from './spacing'

import {
  duration,
  easing,
  transition,
  allowedProperties,
  avoidedProperties,
  animations,
  reducedMotion,
  stagger,
  spring,
  motion,
} from './motion'

import {
  zIndex,
  gameZIndex,
  motionZIndex,
  zIndices,
} from './z-index'

// 默认导出
export default tokens
