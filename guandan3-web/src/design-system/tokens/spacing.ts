/**
 * Design Tokens - Spacing
 *
 * 基于Impeccable Design规范：
 * - 4pt基数系统（替代8pt，更精细）
 * - 语义化命名（sm/md/lg而非数值）
 * - gap优于margin（避免margin collapse）
 * - 多维度层次创造视觉分组
 */

// ============================================
// 4pt 基数系统
// ============================================
/**
 * 为什么是4pt而不是8pt？
 * - 8pt系统太粗糙，经常需要12px（8和16之间）
 * - 4pt提供足够精细度：4, 8, 12, 16, 24, 32, 48, 64, 96
 * - 所有值都是4的倍数，保持和谐
 */
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px   - 最小间距
  2: '0.5rem',    // 8px   - 紧凑间距
  3: '0.75rem',   // 12px  - 中小间距
  4: '1rem',      // 16px  - 标准间距（基准）
  5: '1.25rem',   // 20px  - 略大于标准
  6: '1.5rem',    // 24px  - 中等间距
  8: '2rem',      // 32px  - 大间距
  10: '2.5rem',   // 40px  - 更大间距
  12: '3rem',     // 48px  - 超大间距
  16: '4rem',     // 64px  - 区块间距
  20: '5rem',     // 80px  - 大区块间距
  24: '6rem',     // 96px  - 页面级间距
  32: '8rem',     // 128px - 特大间距
} as const

// ============================================
// 语义化间距命名
// ============================================
/**
 * 语义化命名优势：
 * - 代码可读性更好
 * - 全局调整更容易
 * - 表达设计意图而非数值
 */
export const semanticSpacing = {
  // 组件内部
  xs: spacing[1],     // 4px   - 元素间最小间距
  sm: spacing[2],     // 8px   - 紧密关联元素
  md: spacing[4],     // 16px  - 标准组件间距
  lg: spacing[6],     // 24px  - 分组间距
  xl: spacing[8],     // 32px  - 区块间距
  '2xl': spacing[12], // 48px  - 大区块间距
  '3xl': spacing[16], // 64px  - 页面区域间距
} as const

// ============================================
// 响应式间距
// ============================================
/**
 * 响应式间距规则：
 * - 移动端：更紧凑
 * - 桌面端：更宽松
 * - 使用媒体查询自动切换
 */
export const responsiveSpacing = {
  // 移动端（默认）
  mobile: {
    padding: spacing[4],     // 16px
    margin: spacing[4],      // 16px
    gap: spacing[3],         // 12px
  },

  // 平板端
  tablet: {
    padding: spacing[6],     // 24px
    margin: spacing[6],      // 24px
    gap: spacing[4],         // 16px
  },

  // 桌面端
  desktop: {
    padding: spacing[8],     // 32px
    margin: spacing[8],      // 32px
    gap: spacing[6],         // 24px
  },
} as const

// ============================================
// 组件内间距预设
// ============================================
/**
 * 常见组件间距模式
 * 快速应用一致的内部间距
 */
export const componentSpacing = {
  // 按钮内边距
  button: {
    sm: { x: spacing[3], y: spacing[1] },     // 12px × 4px
    md: { x: spacing[4], y: spacing[2] },     // 16px × 8px
    lg: { x: spacing[6], y: spacing[3] },     // 24px × 12px
  },

  // 输入框内边距
  input: {
    sm: { x: spacing[3], y: spacing[2] },     // 12px × 8px
    md: { x: spacing[4], y: spacing[3] },     // 16px × 12px
    lg: { x: spacing[5], y: spacing[4] },     // 20px × 16px
  },

  // 卡片内边距
  card: {
    sm: spacing[4],      // 16px
    md: spacing[6],      // 24px
    lg: spacing[8],      // 32px
  },

  // 模态框内边距
  modal: {
    sm: spacing[6],      // 24px
    md: spacing[8],      // 32px
    lg: spacing[12],     // 48px
  },

  // 列表项间距
  list: {
    compact: spacing[2],     // 8px
    normal: spacing[3],      // 12px
    relaxed: spacing[4],     // 16px
  },
} as const

// ============================================
// Gap优于Margin
// ============================================
/**
 * 为什么使用gap？
 * - 避免margin collapse问题
 * - 更可预测的布局
 * - Flexbox和Grid都支持
 *
 * ❌ 错误：使用margin
 * ✅ 正确：使用gap
 */
export const gap = {
  // Flex/Grid gap
  xs: spacing[1],     // 4px
  sm: spacing[2],     // 8px
  md: spacing[4],     // 16px
  lg: spacing[6],     // 24px
  xl: spacing[8],     // 32px
} as const

// ============================================
// 触摸目标
// ============================================
/**
 * 触摸目标最小尺寸
 * - Apple HIG: 44×44pt
 * - Material Design: 48×48dp
 * - WCAG: 至少44×44px
 *
 * 小图标可通过padding扩展触摸区域
 */
export const touchTarget = {
  min: '2.75rem',   // 44px - 最小触摸目标
  comfortable: '3rem',  // 48px - 舒适触摸目标
  large: '3.5rem',  // 56px - 大触摸目标
} as const

// ============================================
// 视觉分组间距
// ============================================
/**
 * 视觉分组原则：
 * - 组内元素间距小
 * - 组间间距大
 * - 使用3:1比例创造层次
 */
export const grouping = {
  // 组内间距（紧密）
  inline: spacing[2],     // 8px

  // 组间间距（宽松）
  stack: spacing[6],      // 24px

  // 分组比例（3:1）
  ratio: 3,
} as const

// ============================================
// 完整间距系统导出
// ============================================
export const spacingTokens = {
  spacing,
  semantic: semanticSpacing,
  responsive: responsiveSpacing,
  component: componentSpacing,
  gap,
  touchTarget,
  grouping,
} as const

// 类型导出
export type Spacing = keyof typeof spacing
export type SemanticSpacing = keyof typeof semanticSpacing
export type Gap = keyof typeof gap
