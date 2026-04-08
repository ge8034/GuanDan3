/**
 * Design Tokens - Z-Index
 *
 * 基于Impeccable Design规范：
 * - 语义化命名（dropdown、modal等）
 * - 避免任意数字
 * - 创建清晰的层级体系
 */

// ============================================
// 语义化 Z-Index 层级
// ============================================
/**
 * Z-Index 层级原则：
 * - 从低到高：dropdown → sticky → modal → toast → tooltip
 * - 使用语义化命名，方便理解和维护
 * - 避免使用随意的大数字（9999）
 */
export const zIndex = {
  // 基础层
  base: 0,

  // 上升层（用于临时提升元素）
  raised: 10,

  // 下拉菜单
  dropdown: 100,

  // 粘性元素（导航栏等）
  sticky: 200,

  // 固定元素（侧边栏等）
  fixed: 300,

  // 模态框背景遮罩
  modalBackdrop: 400,

  // 模态框内容
  modal: 500,

  // 通知/提示（Toast）
  toast: 600,

  // 工具提示（Tooltip）
  tooltip: 700,

  // 最高层（紧急通知等）
  top: 800,
} as const

// ============================================
// 特殊用途层级
// ============================================
/**
 * 游戏相关组件的层级
 * 确保游戏元素正确叠加
 */
export const gameZIndex = {
  // 牌桌背景
  table: 1,

  // 牌桌装饰
  tableDecoration: 2,

  // 卡牌（默认）
  card: 10,

  // 选中的卡牌
  cardSelected: 20,

  // 拖拽中的卡牌
  cardDragging: 100,

  // 特效层
  effects: 50,

  // UI 覆盖层
  uiOverlay: 200,

  // 模态框
  modal: 500,
} as const

// ============================================
// Framer Motion 层级
// ============================================
/**
 * 动画组件使用的层级
 * 确保动画元素在正确的层级上
 */
export const motionZIndex = {
  // 动画容器
  container: 1,

  // 动画元素
  element: 10,

  // 动画覆盖层
  overlay: 100,
} as const

// ============================================
// 完整层级系统导出
// ============================================
export const zIndices = {
  ...zIndex,
  game: gameZIndex,
  motion: motionZIndex,
} as const

// 类型导出
export type ZIndex = keyof typeof zIndex
export type GameZIndex = keyof typeof gameZIndex
