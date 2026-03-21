import { buttonVariants } from './Button'

// 按钮变体类型
export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'link'

// 按钮尺寸类型
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon'

// 从cva变体中提取类型
export type ButtonVariantsProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  fullWidth?: boolean
}

// 按钮属性接口
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 加载状态 */
  isLoading?: boolean
  /** 左侧图标 */
  leftIcon?: React.ReactNode
  /** 右侧图标 */
  rightIcon?: React.ReactNode
  /** 是否启用水波纹效果 */
  ripple?: boolean
  /** 是否作为子元素渲染（用于Link等） */
  asChild?: boolean
}

// 按钮样式配置
export interface ButtonStyleConfig {
  /** 背景颜色 */
  backgroundColor: string
  /** 文字颜色 */
  textColor: string
  /** 边框颜色 */
  borderColor?: string
  /** 悬停背景颜色 */
  hoverBackgroundColor: string
  /** 激活背景颜色 */
  activeBackgroundColor: string
  /** 焦点环颜色 */
  focusRingColor: string
}

// 按钮变体样式映射
export const buttonStyleConfigs: Record<ButtonVariant, ButtonStyleConfig> = {
  primary: {
    backgroundColor: 'var(--color-primary)',
    textColor: '#FFFFFF',
    hoverBackgroundColor: 'var(--color-primary-dark)',
    activeBackgroundColor: 'var(--color-primary-darker)',
    focusRingColor: 'var(--color-primary)',
  },
  secondary: {
    backgroundColor: 'var(--color-secondary)',
    textColor: 'var(--text-primary)',
    hoverBackgroundColor: 'var(--color-secondary-dark)',
    activeBackgroundColor: 'var(--color-secondary-darker)',
    focusRingColor: 'var(--color-secondary)',
  },
  outline: {
    backgroundColor: 'transparent',
    textColor: 'var(--color-primary)',
    borderColor: 'var(--color-primary)',
    hoverBackgroundColor: 'var(--color-primary-light)',
    activeBackgroundColor: 'var(--color-primary-lighter)',
    focusRingColor: 'var(--color-primary)',
  },
  ghost: {
    backgroundColor: 'transparent',
    textColor: 'var(--color-primary)',
    hoverBackgroundColor: 'var(--color-primary-light)',
    activeBackgroundColor: 'var(--color-primary-lighter)',
    focusRingColor: 'var(--color-primary)',
  },
  danger: {
    backgroundColor: 'var(--color-error)',
    textColor: '#FFFFFF',
    hoverBackgroundColor: 'var(--color-error-dark)',
    activeBackgroundColor: 'var(--color-error-darker)',
    focusRingColor: 'var(--color-error)',
  },
  link: {
    backgroundColor: 'transparent',
    textColor: 'var(--color-primary)',
    hoverBackgroundColor: 'transparent',
    activeBackgroundColor: 'transparent',
    focusRingColor: 'var(--color-primary)',
  },
}

// 按钮尺寸配置
export interface ButtonSizeConfig {
  /** 高度 */
  height: string
  /** 水平内边距 */
  paddingX: string
  /** 垂直内边距 */
  paddingY: string
  /** 字体大小 */
  fontSize: string
  /** 最小宽度（触控目标） */
  minWidth: string
}

export const buttonSizeConfigs: Record<ButtonSize, ButtonSizeConfig> = {
  sm: {
    height: '2.25rem', // 36px
    paddingX: '0.75rem', // 12px
    paddingY: '0.5rem', // 8px
    fontSize: '0.75rem', // 12px
    minWidth: '2.75rem', // 44px
  },
  md: {
    height: '2.5rem', // 40px
    paddingX: '1rem', // 16px
    paddingY: '0.5rem', // 8px
    fontSize: '0.875rem', // 14px
    minWidth: '2.75rem', // 44px
  },
  lg: {
    height: '2.75rem', // 44px
    paddingX: '1.5rem', // 24px
    paddingY: '0.75rem', // 12px
    fontSize: '1rem', // 16px
    minWidth: '2.75rem', // 44px
  },
  icon: {
    height: '2.5rem', // 40px
    paddingX: '0',
    paddingY: '0',
    fontSize: '1rem', // 16px
    minWidth: '2.5rem', // 40px
  },
}

// 可访问性相关类型
export interface ButtonAccessibilityProps {
  /** ARIA标签 */
  'aria-label'?: string
  /** ARIA描述 */
  'aria-describedby'?: string
  /** ARIA当前状态 */
  'aria-current'?: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
  /** ARIA按下状态 */
  'aria-pressed'?: boolean | 'mixed'
  /** ARIA扩展状态 */
  'aria-expanded'?: boolean
  /** ARIA选中状态 */
  'aria-selected'?: boolean
  /** ARIA禁用状态 */
  'aria-disabled'?: boolean
  /** ARIA繁忙状态 */
  'aria-busy'?: boolean
}