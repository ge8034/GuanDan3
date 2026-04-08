/**
 * Design System - 统一导出
 *
 * 完整的设计系统导出
 * 基于 Impeccable Design 规范
 */

// ============================================
// Design Tokens
// ============================================
export * from './tokens'

// ============================================
// Utils
// ============================================
export { cn, createVariants, cnResponsive, cnWhen } from './utils/cn'

// ============================================
// Components
// ============================================
export * from './components/atoms'
export * from './components/molecules'

// ============================================
// 类型导出
// ============================================
export type {
  SizeVariant,
  ColorVariant,
  RadiusVariant,
  ShadowVariant,
} from './tokens'

// ============================================
// 设计系统版本
// ============================================
export const DESIGN_SYSTEM_VERSION = '1.0.0' as const

/**
 * 设计系统信息
 */
export const designSystemInfo = {
  name: '掼蛋3 Design System',
  version: DESIGN_SYSTEM_VERSION,
  basedOn: 'Impeccable Design',
  description: '基于 Impeccable Design 规范的设计系统',
  url: 'https://github.com/pbakaus/impeccable',
} as const
