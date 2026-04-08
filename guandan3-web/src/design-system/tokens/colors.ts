/**
 * Design Tokens - Colors
 *
 * 基于Impeccable Design规范：
 * - 使用OKLCH色彩空间（感知均匀）
 * - 染色中性色（添加品牌色微量）
 * - 60-30-10规则（60%背景，30%次要，10%强调）
 * - 保留Poker主题品牌色
 */

// ============================================
// 染色中性色（添加品牌绿色微量）
// ============================================
/**
 * 染色中性色系统
 * 纯灰色会显得单调，添加微量品牌色创造更有机的视觉
 * 色相250（蓝色冷调）适合科技产品，可替换为品牌色
 */
export const neutral = {
  50: 'oklch(98% 0.005 250)',
  100: 'oklch(96% 0.008 250)',
  200: 'oklch(92% 0.01 250)',
  300: 'oklch(85% 0.015 250)',
  400: 'oklch(70% 0.02 250)',
  500: 'oklch(55% 0.025 250)',
  600: 'oklch(40% 0.03 250)',
  700: 'oklch(30% 0.035 250)',
  800: 'oklch(20% 0.04 250)',
  900: 'oklch(12% 0.05 250)',
  950: 'oklch(8% 0.055 250)',
} as const

// ============================================
// Poker 主题品牌色
// ============================================
/**
 * 扑克牌桌主题色
 * 保留原有品牌识别，转换为OKLCH色彩空间
 */
export const poker = {
  // 牌桌绿色系
  table: {
    50: 'oklch(95% 0.03 150)',
    100: 'oklch(90% 0.05 150)',
    200: 'oklch(82% 0.06 150)',
    300: 'oklch(72% 0.07 150)',
    400: 'oklch(58% 0.08 150)',
    500: 'oklch(45% 0.09 150)',    // 主绿色
    600: 'oklch(35% 0.08 150)',    // 深绿牌桌
    700: 'oklch(28% 0.07 150)',
    800: 'oklch(20% 0.06 150)',
    900: 'oklch(15% 0.05 150)',
  },

  // 卡牌颜色
  card: {
    bg: 'oklch(100% 0 0)',         // 白色背景
    textBlack: 'oklch(20% 0.02 250)',  // 黑桃/梅花
    textRed: 'oklch(50% 0.2 25)',   // 红桃/方块
    borderInner: 'oklch(85% 0.01 250)',
  },

  // 卡牌背面
  cardBack: {
    blue: {
      start: 'oklch(45% 0.12 250)',
      mid: 'oklch(40% 0.11 250)',
      end: 'oklch(30% 0.10 250)',
    },
    red: {
      start: 'oklch(45% 0.15 25)',
      mid: 'oklch(40% 0.14 25)',
      end: 'oklch(30% 0.12 25)',
    },
  },

  // 木质边框
  wood: {
    light: 'oklch(45% 0.08 60)',
    mid: 'oklch(35% 0.10 55)',
    dark: 'oklch(25% 0.12 50)',
    grain: 'oklch(20% 0.15 50)',
  },

  // 金色装饰
  gold: {
    DEFAULT: 'oklch(70% 0.15 85)',
    light: 'oklch(80% 0.12 85)',
    shimmer: 'oklch(85% 0.10 85)',
    dark: 'oklch(55% 0.18 85)',
  },
} as const

// ============================================
// 语义色 - 状态反馈
// ============================================
/**
 * 状态颜色
 * 确保足够的对比度（WCAG AA: 4.5:1）
 */
export const semantic = {
  // 成功 - 绿色系
  success: {
    DEFAULT: 'oklch(65% 0.15 145)',
    light: 'oklch(85% 0.08 145)',
    dark: 'oklch(45% 0.12 145)',
    text: 'oklch(35% 0.10 145)',
  },

  // 错误 - 红色系
  error: {
    DEFAULT: 'oklch(55% 0.20 25)',
    light: 'oklch(85% 0.10 25)',
    dark: 'oklch(40% 0.18 25)',
    text: 'oklch(35% 0.15 25)',
  },

  // 警告 - 黄色/橙色系
  warning: {
    DEFAULT: 'oklch(75% 0.15 85)',
    light: 'oklch(90% 0.08 85)',
    dark: 'oklch(55% 0.18 85)',
    text: 'oklch(45% 0.15 75)',
  },

  // 信息 - 蓝色系
  info: {
    DEFAULT: 'oklch(60% 0.15 250)',
    light: 'oklch(85% 0.08 250)',
    dark: 'oklch(45% 0.12 250)',
    text: 'oklch(35% 0.10 250)',
  },
} as const

// ============================================
// 60-30-10 语义比例
// ============================================
/**
 * 色彩使用比例规则
 * - 60% 背景色（中性色）
 * - 30% 次要色（浅色中性）
 * - 10% 强调色（品牌色/金色）
 */
export const ratio = {
  // 60% - 主要背景
  bg: neutral[50],

  // 30% - 次要表面
  surface: neutral[100],

  // 10% - 强调元素
  accent: poker.gold.DEFAULT,

  // 交互元素
  primary: poker.table[500],
  primaryHover: poker.table[400],
  primaryActive: poker.table[600],

  // 文本
  text: {
    primary: neutral[900],
    secondary: neutral[600],
    disabled: neutral[400],
    inverse: neutral[50],
  },
} as const

// ============================================
// 完整色彩系统导出
// ============================================
export const colors = {
  neutral,
  poker,
  semantic,
  ratio,
} as const

// 类型导出
export type ColorName = keyof typeof colors
export type NeutralColor = keyof typeof neutral
export type PokerTableColor = keyof typeof poker.table
export type SemanticColor = keyof typeof semantic
