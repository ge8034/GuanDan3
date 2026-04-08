/**
 * Design Tokens - Typography
 *
 * 基于Impeccable Design规范：
 * - 5级字体系统（模块化比例 1.25）
 * - 垂直节奏（行高作为间距基础单位）
 * - 避免默认字体（Inter/Roboto/Open Sans）
 * - 使用系统字体栈保证性能
 */

// ============================================
// 字体家族
// ============================================
/**
 * 字体选择原则：
 * - 避免过度使用的字体（Inter, Roboto, Open Sans）
 * - 优先使用系统字体（性能最佳）
 * - 使用Web字体时考虑加载性能
 */
export const fontFamily = {
  // 系统字体栈（推荐用于产品UI）
  sans: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    '"Segoe UI"',
    'sans-serif',
  ].join(', '),

  // 保留原有中文字体
  serif: [
    'var(--font-noto-serif-sc)',
    '"Noto Serif SC"',
    '"Source Han Serif SC"',
    '思源宋体',
    'SimSun',
    'serif',
  ].join(', '),

  // 扑克牌字体（等宽数字）
  card: [
    'Georgia',
    '"Times New Roman"',
    'serif',
  ].join(', '),

  // 代码字体
  mono: [
    'ui-monospace',
    'SFMono-Regular',
    '"SF Mono"',
    'Menlo',
    'Monaco',
    '"Cascadia Code"',
    '"Courier New"',
    'monospace',
  ].join(', '),
} as const

// ============================================
// 字体大小 - 5级系统
// ============================================
/**
 * 模块化比例 1.25（Major Third）
 * 避免太多接近的字体大小，创造清晰层次
 */
export const fontSize = {
  // 12px - 说明文字、法律条款
  xs: '0.75rem',

  // 14px - 次要UI、元数据
  sm: '0.875rem',

  // 16px - 正文（基准）
  base: '1rem',

  // 20px - 小标题、引导文本
  lg: '1.25rem',

  // 24px - 标题
  xl: '1.5rem',

  // 32px - 大标题
  '2xl': '2rem',

  // 40px - 英雄标题
  '3xl': '2.5rem',

  // 48px - 超大标题
  '4xl': '3rem',
} as const

// ============================================
// 行高 - 垂直节奏
// ============================================
/**
 * 行高原则：
 * - 正文：1.6（16px × 1.6 = 25.6px ≈ 24px 垂直节奏）
 * - 深色背景：增加0.1（提升可读性）
 * - 标题：更紧凑的1.25
 */
export const lineHeight = {
  // 1.25 - 标题（紧凑）
  tight: 1.25,

  // 1.5 - 短文本
  snug: 1.5,

  // 1.6 - 正文标准（推荐）
  normal: 1.6,

  // 1.7 - 深色背景/长文
  relaxed: 1.7,

  // 2 - 松散（特殊场景）
  loose: 2,
} as const

// ============================================
// 字重
// ============================================
/**
 * 字重选择：
 * - 使用有限字重创造层次
 * - 避免Medium与Regular过于接近
 */
export const fontWeight = {
  // 300 - 细体（少用）
  light: 300,

  // 400 - 常规（正文）
  normal: 400,

  // 500 - 中等（次要强调）
  medium: 500,

  // 600 - 半粗（标题）
  semibold: 600,

  // 700 - 粗体（强强调）
  bold: 700,

  // 800 - 超粗（少用）
  extrabold: 800,
} as const

// ============================================
// 字母间距
// ============================================
/**
 * 字母间距微调：
 * - 大写文字：增加间距
 * - 标题：略微收紧
 */
export const letterSpacing = {
  // 紧凑
  tighter: '-0.025em',

  // 略紧
  tight: '-0.0125em',

  // 正常
  normal: '0',

  // 略宽
  wide: '0.0125em',

  // 宽松（大写）
  wider: '0.025em',

  // 最宽
  widest: '0.05em',
} as const

// ============================================
// 行长限制
// ============================================
/**
 * 行长（Measure）原则：
 * - 使用ch单位（字符数）
 * - 正文：45-75字符（最佳60-65）
 * - 过长：眼睛疲劳
 * - 过短：频繁换行
 */
export const measure = {
  // 侧边栏/窄栏
  narrow: '45ch',

  // 正文标准
  normal: '65ch',

  // 宽栏
  wide: '75ch',
} as const

// ============================================
// 排版组合
// ============================================
/**
 * 预设排版组合
 * 快速应用一致的字体样式
 */
export const textStyles = {
  // 正文
  body: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // 大号正文
  bodyLarge: {
    fontSize: fontSize.lg,
    lineHeight: lineHeight.relaxed,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // 小号正文
  bodySmall: {
    fontSize: fontSize.sm,
    lineHeight: lineHeight.snug,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // 标题
  heading: {
    fontSize: fontSize.xl,
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.tight,
  },

  // 大标题
  headingLarge: {
    fontSize: fontSize['2xl'],
    lineHeight: lineHeight.tight,
    fontWeight: fontWeight.bold,
    letterSpacing: letterSpacing.tight,
  },

  // 说明文字
  caption: {
    fontSize: fontSize.xs,
    lineHeight: lineHeight.snug,
    fontWeight: fontWeight.normal,
    letterSpacing: letterSpacing.normal,
  },

  // 按钮文字
  button: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.semibold,
    letterSpacing: letterSpacing.wide,
  },

  // 卡牌文字
  card: {
    fontSize: fontSize.base,
    lineHeight: lineHeight.normal,
    fontWeight: fontWeight.normal,
    fontFamily: fontFamily.card,
    letterSpacing: letterSpacing.normal,
  },
} as const

// ============================================
// OpenType 特性
// ============================================
/**
 * 现代Web排版特性
 * 提升字体渲染质量
 */
export const fontFeatureSettings = {
  // 表格数字（等宽数字，数据对齐）
  tabular: '"tnum" 1',

  // 对角分数
  fractional: '"frac" 1',

  // 小型大写字母
  smallCaps: '"smcp" 1',

  // 禁用连字（代码）
  noLigatures: '"liga" 0, "dlig" 0',

  // 标准连字（正文）
  standardLigatures: '"liga" 1, "dlig" 1',

  // 字距调整
  kerning: '"kern" 1',
} as const

// ============================================
// 完整排版系统导出
// ============================================
export const typography = {
  fontFamily,
  fontSize,
  lineHeight,
  fontWeight,
  letterSpacing,
  measure,
  textStyles,
  fontFeatureSettings,
} as const

// 类型导出
export type FontFamily = keyof typeof fontFamily
export type FontSize = keyof typeof fontSize
export type LineHeight = keyof typeof lineHeight
export type FontWeight = keyof typeof fontWeight
export type TextStyle = keyof typeof textStyles
