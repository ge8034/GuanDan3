/**
 * Button 组件样式变体
 *
 * 基于 Impeccable Design 规范：
 * - 100/300/500 动效规则
 * - ease-out 缓动函数
 * - 8种交互状态
 */

import { cva, type VariantProps } from 'class-variance-authority'
import { tokens } from '@/design-system/tokens'

// ============================================
// 基础样式
// ============================================
const baseStyles = [
  // 字体
  'font-semibold',
  'text-center',
  'whitespace-nowrap',

  // 布局
  'inline-flex',
  'items-center',
  'justify-center',
  'gap-2',

  // 过渡（200ms + ease-out）- 包括边框颜色
  'transition-all',
  'duration-200',
  'ease-[cubic-bezier(0.16,1,0.3,1)]',
  'transition-colors',
  'transition-shadow',
  'transition-transform',

  // 焦点环（可访问性）
  'focus-visible:outline-2',
  'focus-visible:outline-offset-2',
  'focus-visible:outline-accent-gold',

  // 禁用状态
  'disabled:cursor-not-allowed',
  'disabled:opacity-50',
  'disabled:pointer-events-none',

  // 触摸目标（最小44px）
  'min-h-[44px]',
]

// ============================================
// 变体样式
// ============================================
export const buttonVariants = cva(baseStyles, {
  variants: {
    // 视觉变体
    variant: {
      // 主要按钮
      primary: [
        // 背景
        'bg-poker-table',
        'hover:bg-poker-table-light',
        'active:bg-poker-table-dark',

        // 文本
        'text-white',

        // 边框
        'border-2',
        'border-poker-table-dark',

        // 阴影
        'shadow-md',
        'hover:shadow-lg',
      ],

      // 次要按钮
      secondary: [
        'bg-neutral-200',
        'hover:bg-neutral-300',
        'active:bg-neutral-400',
        'text-neutral-900',
        'border-2',
        'border-neutral-300',
        'shadow-sm',
        'hover:shadow-md',
      ],

      // 轮廓按钮
      outline: [
        'bg-transparent',
        'hover:bg-poker-table/10',
        'active:bg-poker-table/20',
        'text-poker-table',
        'border-2',
        'border-poker-table',
        'shadow-sm',
      ],

      // 幽灵按钮
      ghost: [
        'bg-transparent',
        'hover:bg-poker-table/10',
        'active:bg-poker-table/20',
        'text-poker-table',
        'border-2',
        'border-transparent',
      ],

      // 危险按钮
      danger: [
        'bg-error',
        'hover:bg-error/80',
        'active:opacity-70',
        'text-white',
        'border-2',
        'border-error/80',
        'shadow-md',
      ],

      // 成功按钮
      success: [
        'bg-success',
        'hover:bg-success/80',
        'active:opacity-70',
        'text-white',
        'border-2',
        'border-success/80',
        'shadow-md',
      ],

      // 柔和紫色按钮
      soft: [
        'bg-[#a78bfa]',
        'hover:bg-[#8b5cf6]',
        'active:bg-[#7c3aed]',
        'text-white',
        'border-2',
        'border-[#8b5cf6]',
        'shadow-md',
        'hover:shadow-lg',
      ],
    },

    // 大小变体
    size: {
      xs: [
        'px-3',
        'py-1',
        'text-xs',
        'rounded-md', // 6px - 更圆润
      ],
      sm: [
        'px-4',
        'py-2',
        'text-sm',
        'rounded-lg', // 8px - 更圆润
      ],
      md: [
        'px-6',
        'py-3',
        'text-base',
        'rounded-xl', // 12px - 更圆润
      ],
      lg: [
        'px-8',
        'py-4',
        'text-lg',
        'rounded-2xl', // 16px - 更圆润
      ],
      xl: [
        'px-10',
        'py-5',
        'text-xl',
        'rounded-3xl', // 24px - 更圆润
      ],
    },

    // 全宽
    fullWidth: {
      true: 'w-full',
      false: 'w-auto',
    },

    // 加载状态
    loading: {
      true: 'cursor-wait',
      false: '',
    },

    // 错误状态
    error: {
      true: 'border-error text-error',
      false: '',
    },

    // 成功状态
    success: {
      true: 'border-success text-success',
      false: '',
    },
  },

  // 默认值
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
    loading: false,
    error: false,
    success: false,
  },

  // 复合变体（特殊组合）
  compoundVariants: [
    // 主要按钮 + 加载中
    {
      variant: 'primary',
      loading: true,
      class: 'opacity-80',
    },

    // 危险按钮 + 错误状态
    {
      variant: 'danger',
      error: true,
      class: 'ring-2 ring-error ring-offset-2',
    },

    // 成功按钮 + 成功状态
    {
      variant: 'success',
      success: true,
      class: 'ring-2 ring-success ring-offset-2',
    },
  ],
})

// ============================================
// 类型导出
// ============================================
export type ButtonVariantsProps = VariantProps<typeof buttonVariants>

// ============================================
// 图标大小映射
// ============================================
export const iconSizes: Record<string, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-7 w-7',
}
