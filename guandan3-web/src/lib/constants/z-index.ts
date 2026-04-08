/**
 * Z-index 层级管理系统
 *
 * 统一管理所有UI元素的z-index值，确保元素不会互相覆盖
 *
 * 层级说明：
 * - 0-9: 基础内容层
 * - 10-19: 覆盖层和提示
 * - 20-29: 交互元素
 * - 30-39: 面板和侧边栏
 * - 40-49: 顶部导航和控制栏
 * - 50-59: 模态对话框和重要覆盖层
 * - 60+: 系统级最高优先级元素
 */

/**
 * Z-index 层级常量
 */
export const Z_INDEX = {
  // ========== 基础内容层 (0-9) ==========
  /** 默认内容层 */
  BASE: 0,
  /** 游戏桌面背景 */
  TABLE_BACKGROUND: 1,
  /** 游戏卡片 */
  GAME_CARDS: 2,
  /** 动画效果 */
  ANIMATIONS: 5,

  // ========== 覆盖层和提示 (10-19) ==========
  /** 玩家头像（基础） */
  PLAYER_AVATAR: 10,
  /** 手牌区域 */
  HAND_AREA: 15,
  /** 提示信息 */
  TOAST: 18,

  // ========== 交互元素 (20-29) ==========
  /** 玩家头像（激活状态） */
  PLAYER_AVATAR_ACTIVE: 20,
  /** 游戏控制按钮 */
  GAME_CONTROLS: 22,
  /** 聊天输入框 */
  CHAT_INPUT: 25,

  // ========== 面板和侧边栏 (30-39) ==========
  /** 聊天面板 */
  CHAT_PANEL: 30,
  /** 游戏提示面板 */
  HINTS_PANEL: 32,
  /** 房间邀请面板（底部） */
  ROOM_INVITATION_BOTTOM: 35,
  /** 性能监控面板 */
  PERFORMANCE_MONITOR: 36,
  /** AI调试面板 */
  AI_DEBUG_PANEL: 37,

  // ========== 顶部导航和控制栏 (40-49) ==========
  /** 房间头部信息栏 */
  ROOM_HEADER: 40,
  /** 系统导航栏 */
  NAVIGATION: 45,

  // ========== 模态对话框和重要覆盖层 (50-59) ==========
  /** 房间覆盖层（如：房间已满、加入确认） */
  ROOM_OVERLAYS: 50,
  /** 游戏结束覆盖层 */
  GAME_OVER_OVERLAY: 52,
  /** 游戏暂停覆盖层 */
  GAME_PAUSED_OVERLAY: 54,
  /** 语音通话面板 */
  VOICE_CALL_PANEL: 55,
  /** 房间邀请面板（浮动） */
  ROOM_INVITATION_FLOATING: 56,

  // ========== 系统级最高优先级 (60+) ==========
  /** 调试切换按钮 */
  DEBUG_TOGGLE: 60,
  /** 紧急错误覆盖层 */
  CRITICAL_ERROR: 70,
} as const

/**
 * Z-index 类型
 */
export type ZIndexValue = typeof Z_INDEX[keyof typeof Z_INDEX]

/**
 * 获取z-index值（用于className）
 * @param layer Z-index层级
 * @returns Tailwind CSS z-index类名
 */
export function getZIndexClass(layer: ZIndexValue): string {
  // 将数值转换为Tailwind支持的格式
  if (layer >= 60) return `z-[${layer}]`
  if (layer >= 50) return `z-50`
  if (layer >= 40) return `z-40`
  if (layer >= 30) return `z-30`
  if (layer >= 20) return `z-20`
  if (layer >= 10) return `z-10`
  return `z-0`
}

/**
 * 触摸目标最小尺寸
 */
export const TOUCH_TARGET = {
  MIN_SIZE: 44, // 44x44px (WCAG 2.1 AAA 标准)
  COMPACT_SIZE: 36, // 36x36px (紧凑布局最小值)
} as const

/**
 * 固定元素位置偏移
 * 防止多个固定元素互相重叠
 */
export const FIXED_POSITION = {
  // 底部元素垂直间距
  BOTTOM_SPACING: {
    /** 最低层：聊天/语音 */
    LOWEST: 80,
    /** 中间层：性能监控/AI面板 */
    MIDDLE: 140,
    /** 最高层：调试按钮 */
    HIGHEST: 200,
  },
  // 左侧元素水平间距
  LEFT_SPACING: {
    /** 第一个元素 */
    FIRST: 16, // left-4
    /** 第二个元素 */
    SECOND: 80, // left-20
    /** 第三个元素 */
    THIRD: 144, // left-36
  },
  // 右侧元素水平间距
  RIGHT_SPACING: {
    /** 最右侧 */
    FIRST: 16, // right-4
    /** 第二个 */
    SECOND: 80, // right-20
  },
} as const
