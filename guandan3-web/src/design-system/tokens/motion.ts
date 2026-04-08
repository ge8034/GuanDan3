/**
 * Design Tokens - Motion
 *
 * 基于Impeccable Design规范：
 * - 100/300/500 规则（时长）
 * - ease-out 优先（缓动函数）
 * - 仅动画 transform 和 opacity
 * - 支持 prefers-reduced-motion
 */

// ============================================
// 时长：100/300/500 规则
// ============================================
/**
 * 动画时长比缓动更重要
 * 这些时长对大多数UI感觉"正确"
 *
 * 注意：退出动画应比进入动画快（~75%）
 */
export const duration = {
  // 100ms - 微交互（即时反馈）
  instant: '100ms',
  hover: '100ms',
  focus: '100ms',
  active: '100ms',

  // 200ms - 状态变化（标准）
  fast: '200ms',
  base: '200ms',
  toggle: '200ms',

  // 300ms - 布局变化
  normal: '300ms',
  slow: '300ms',
  layout: '300ms',

  // 400ms - 大型布局变化
  slower: '400ms',

  // 500ms - 进场动画
  entrance: '500ms',
  modal: '500ms',

  // 退出动画（比进入快）
  exit: '150ms',     // 约75%的200ms
  exitFast: '100ms', // 约75%的150ms
} as const

// ============================================
// 缓动函数：避免使用 ease
// ============================================
/**
 * ❌ 不要使用 ease
 * 它是妥协方案，很少是最优选择
 *
 * ✅ 使用专门的缓动：
 * - ease-out: 元素进入（自然减速）
 * - ease-in: 元素离开（自然加速）
 * - ease-in-out: 状态切换
 */
export const easing = {
  // ease-out - 元素进入（推荐默认）
  // 使用指数曲线，模仿物理摩擦
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',        // Expo out（推荐）
  outQuart: 'cubic-bezier(0.25, 1, 0.5, 1)',   // Quart out
  outQuint: 'cubic-bezier(0.22, 1, 0.36, 1)',  // Quint out

  // ease-in - 元素离开
  in: 'cubic-bezier(0.7, 0, 0.84, 0)',         // Expo in

  // ease-in-out - 状态切换（来回）
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',     // 标准

  // 避免使用（显得业余）
  // ease: 'ease',           // ❌ 太通用
  // bounce: 'bounce',       // ❌ 2015年风格
  // elastic: 'elastic',     // ❌ 不自然
} as const

// ============================================
// 组合过渡
// ============================================
/**
 * 常见过渡组合
 * 快速应用一致的动画效果
 */
export const transition = {
  // 颜色过渡（快速）
  colors: {
    property: 'color, background-color, border-color',
    duration: duration.base,
    easing: easing.out,
  },

  // 透明度过渡（快速）
  opacity: {
    property: 'opacity',
    duration: duration.fast,
    easing: easing.out,
  },

  // 变换过渡（标准）
  transform: {
    property: 'transform',
    duration: duration.base,
    easing: easing.out,
  },

  // 阴影过渡（标准）
  shadow: {
    property: 'box-shadow',
    duration: duration.base,
    easing: easing.out,
  },

  // 布局过渡（慢速）
  layout: {
    property: 'all', // 使用transform布局
    duration: duration.normal,
    easing: easing.out,
  },

  // 组合过渡（元素进入）
  enter: {
    property: 'opacity, transform',
    duration: duration.base,
    easing: easing.out,
  },

  // 组合过渡（元素离开）
  exit: {
    property: 'opacity, transform',
    duration: duration.exit,
    easing: easing.in,
  },
} as const

// ============================================
// 允许动画的属性
// ============================================
/**
 * 性能优化原则：
 * - ✅ 只动画 transform 和 opacity
 * - ❌ 避免动画其他属性（触发重绘）
 *
 * 需要动画高度时，使用：
 * grid-template-rows: 0fr → 1fr
 */
export const allowedProperties = [
  'transform',
  'opacity',
] as const

export const avoidedProperties = [
  'width',
  'height',
  'top',
  'left',
  'right',
  'bottom',
  'margin',
  'padding',
] as const

// ============================================
// 常见动画预设
// ============================================
/**
 * 预定义动画
 * 确保整个应用的动画一致
 */
export const animations = {
  // 淡入
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  // 淡出
  fadeOut: {
    from: { opacity: 1 },
    to: { opacity: 0 },
  },

  // 上滑进入
  slideUp: {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },

  // 下滑进入
  slideDown: {
    from: {
      opacity: 0,
      transform: 'translateY(-20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },

  // 缩放进入
  scaleIn: {
    from: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
    to: {
      opacity: 1,
      transform: 'scale(1)',
    },
  },

  // 缩放退出
  scaleOut: {
    from: {
      opacity: 1,
      transform: 'scale(1)',
    },
    to: {
      opacity: 0,
      transform: 'scale(0.95)',
    },
  },

  // 脉冲（用于强调）
  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.7 },
  },
} as const

// ============================================
// Reduced Motion 支持
// ============================================
/**
 * 无障碍要求：
 * - 前庭障碍影响约35%的40岁以上成人
 * - 尊重用户的系统偏好设置
 *
 * 策略：
 * - 保留功能性动画（进度条、加载）
 * - 使用交叉淡入淡出替代移动
 * - 或完全禁用动画
 */
export const reducedMotion = {
  // 保留功能性的淡入淡出
  fadeOnly: {
    duration: '150ms',
    easing: easing.out,
  },

  // 完全禁用
  disabled: {
    duration: '0.01ms',
    easing: easing.out,
  },
} as const

// ============================================
// 交错动画
// ============================================
/**
 * 列表项交错进入
 * 使用CSS变量实现灵活的延迟
 *
 * 使用方式：
 * style={{ animationDelay: `calc(var(--i, 0) * 50ms)` }}
 */
export const stagger = {
  // 每项延迟
  delay: '50ms',

  // 最大总延迟（10项 × 50ms = 500ms）
  maxTotal: '500ms',

  // CSS变量名
  varIndex: '--i',

  // 完整样式
  style: {
    animationDelay: 'calc(var(--stagger-index, 0) * 50ms)',
  } as const,
} as const

// ============================================
// Spring 动画参数（用于 Framer Motion）
// ============================================
/**
 * Spring动画参数
 * 比固定时长感觉更自然
 */
export const spring = {
  // 柔和（适合大多数情况）
  gentle: {
    type: 'spring',
    stiffness: 300,
    damping: 25,
  },

  // 标准
  base: {
    type: 'spring',
    stiffness: 400,
    damping: 30,
  },

  // 有弹性（用于强调）
  bouncy: {
    type: 'spring',
    stiffness: 500,
    damping: 20,
  },

  // 僵硬（快速响应）
  stiff: {
    type: 'spring',
    stiffness: 600,
    damping: 35,
  },
} as const

// ============================================
// 完整动效系统导出
// ============================================
export const motion = {
  duration,
  easing,
  transition,
  allowedProperties,
  avoidedProperties,
  animations,
  reducedMotion,
  stagger,
  spring,
} as const

// 类型导出
export type Duration = keyof typeof duration
export type Easing = keyof typeof easing
export type Animation = keyof typeof animations
