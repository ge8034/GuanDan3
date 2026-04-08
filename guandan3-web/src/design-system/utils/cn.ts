/**
 * Design System - Class Name Utility
 *
 * 合并className的工具函数
 * 基于clsx和tailwind-merge
 */

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * 合并Tailwind CSS类名
 *
 * 功能：
 * 1. 合并多个className
 * 2. 处理条件类名
 * 3. 智能合并冲突的Tailwind类
 *
 * @example
 * ```ts
 * cn('px-4 py-2', 'px-6') // 'py-2 px-6'（px-4被覆盖）
 * cn('text-sm', isActive && 'font-bold') // 条件类名
 * cn({ 'bg-red-500': hasError }) // 对象语法
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

/**
 * 类型：类名输入
 */
export type ClassNameInput = ClassValue

/**
 * 类型：样式变体函数
 */
export type VariantProps<T extends (...args: any) => string> = Parameters<T>[0]

/**
 * 创建样式变体函数
 *
 * 用于构建可组合的样式变体系统
 *
 * @example
 * ```ts
 * const buttonVariants = createVariants({
 *   variant: {
 *     primary: 'bg-blue-500 text-white',
 *     secondary: 'bg-gray-200 text-gray-800',
 *   },
 *   size: {
 *     sm: 'px-3 py-1 text-sm',
 *     md: 'px-4 py-2 text-base',
 *   },
 * })
 *
 * buttonVariants({ variant: 'primary', size: 'sm' })
 * // => 'bg-blue-500 text-white px-3 py-1 text-sm'
 * ```
 */
export function createVariants<T extends Record<string, Record<string, string>>>(
  variants: T
): (props: {
  [K in keyof T]?: keyof T[K]
} & { className?: string }) => string {
  return (props) => {
    const { className, ...variantProps } = props
    const classes: string[] = []

    for (const [key, value] of Object.entries(variantProps)) {
      const variant = value as string
      const variantClass = variants[key]?.[variant]
      if (variantClass) {
        classes.push(variantClass)
      }
    }

    if (className) {
      classes.push(className)
    }

    return cn(...classes)
  }
}

/**
 * 响应式类名合并
 *
 * 为不同断点应用不同类名
 *
 * @example
 * ```ts
 * cnResponsive({
 *   base: 'p-4',
 *   md: 'p-6',
 *   lg: 'p-8',
 * })
 * // => 'p-4 md:p-6 lg:p-8'
 * ```
 */
export function cnResponsive(breakpoints: {
  base?: string
  sm?: string
  md?: string
  lg?: string
  xl?: string
  '2xl'?: string
}): string {
  const classes: string[] = []

  if (breakpoints.base) {
    classes.push(breakpoints.base)
  }

  for (const bp of ['sm', 'md', 'lg', 'xl', '2xl'] as const) {
    if (breakpoints[bp]) {
      classes.push(`${bp}:${breakpoints[bp]}`)
    }
  }

  return cn(...classes)
}

/**
 * 条件类名工具
 *
 * 更简洁的条件类名语法
 *
 * @example
 * ```ts
 * cnWhen({
 *   'bg-red-500': hasError,
 *   'bg-green-500': isSuccess,
 *   'opacity-50': isDisabled,
 * })
 * ```
 */
export function cnWhen(
  conditions: Record<string, boolean | undefined | null>
): string {
  const classes: string[] = []

  for (const [className, condition] of Object.entries(conditions)) {
    if (condition) {
      classes.push(className)
    }
  }

  return cn(...classes)
}

/**
 * 延迟加载类名
 *
 * 用于代码分割的组件
 */
export function lazyClass(
  loader: () => Promise<{ default: string }>,
  fallback: string = ''
): string {
  // 在实际使用中，这个函数会被替换为动态导入的类名
  // 这里主要用于类型提示
  return fallback
}

export default cn
