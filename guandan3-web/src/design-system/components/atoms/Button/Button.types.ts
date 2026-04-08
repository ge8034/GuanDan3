/**
 * Button 组件类型定义
 *
 * 8种交互状态：
 * 1. Default - 默认状态
 * 2. Hover - 悬停状态
 * 3. Focus - 焦点状态（键盘）
 * 4. Active - 激活状态（按下）
 * 5. Disabled - 禁用状态
 * 6. Loading - 加载状态
 * 7. Error - 错误状态
 * 8. Success - 成功状态
 */

import { ButtonHTMLAttributes, ReactNode } from 'react'

// ============================================
// 按钮变体
// ============================================
export type ButtonVariant =
  | 'primary'      // 主要按钮（品牌色）
  | 'secondary'    // 次要按钮（灰色）
  | 'outline'      // 轮廓按钮
  | 'ghost'        // 幽灵按钮（透明背景）
  | 'danger'       // 危险按钮（红色）
  | 'success'      // 成功按钮（绿色）
  | 'gold'         // 金色按钮（Poker主题）

// ============================================
// 按钮大小
// ============================================
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

// ============================================
// Props 接口
// ============================================
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * 按钮变体
   * @default 'primary'
   */
  variant?: ButtonVariant

  /**
   * 按钮大小
   * @default 'md'
   */
  size?: ButtonSize

  /**
   * 是否禁用
   * @default false
   */
  disabled?: boolean

  /**
   * 是否加载中
   * @default false
   */
  loading?: boolean

  /**
   * 是否为错误状态
   * @default false
   */
  error?: boolean

  /**
   * 是否为成功状态
   * @default false
   */
  success?: boolean

  /**
   * 是否为全宽按钮
   * @default false
   */
  fullWidth?: boolean

  /**
   * 按钮内容
   */
  children: ReactNode

  /**
   * 左侧图标
   */
  leftIcon?: ReactNode

  /**
   * 右侧图标
   */
  rightIcon?: ReactNode

  /**
   * 加载状态下的文本（可选）
   */
  loadingText?: string
}

// ============================================
// 样式变体类型
// ============================================
export interface ButtonVariants {
  variant: ButtonVariant
  size: ButtonSize
  disabled: boolean
  loading: boolean
  error: boolean
  success: boolean
  fullWidth: boolean
}

// ============================================
// 视觉状态映射
// ============================================
/**
 * 8种交互状态的类名映射
 */
export interface ButtonStates {
  default: string
  hover: string
  focus: string
  active: string
  disabled: string
  loading: string
  error: string
  success: string
}
