/**
 * 无障碍工具函数
 * 用于统一管理ARIA属性和键盘导航
 */

/**
 * 生成唯一的ID用于aria-labelledby等属性
 * @param prefix ID前缀
 * @returns 唯一ID
 *
 * @example
 * const titleId = generateAriaId('modal-title')
 * // => 'modal-title-a3f2c1b5'
 */
export function generateAriaId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 递增ID生成器
 * 用于为列表中的每个元素生成唯一ID
 */
export class AriaIdGenerator {
  private prefix: string
  private counter: number

  constructor(prefix: string) {
    this.prefix = prefix
    this.counter = 0
  }

  /**
   * 生成下一个ID
   */
  next(): string {
    return `${this.prefix}-${this.counter++}`
  }

  /**
   * 重置计数器
   */
  reset(): void {
    this.counter = 0
  }
}

/**
 * 为组件添加基础ARIA属性
 */
export interface AriaProps {
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-expanded'?: boolean
  'aria-disabled'?: boolean
  'aria-readonly'?: boolean
  'aria-required'?: boolean
  'aria-invalid'?: boolean
  'aria-hidden'?: boolean
  'aria-live'?: 'polite' | 'assertive' | 'off'
  'aria-atomic'?: boolean
  'aria-busy'?: boolean
  'aria-haspopup'?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
  'aria-orientation'?: 'horizontal' | 'vertical'
  'aria-selected'?: boolean
}

/**
 * 生成标准ARIA属性
 */
export function getAriaProps(props: {
  label?: string
  describedBy?: string
  expanded?: boolean
  disabled?: boolean
  required?: boolean
  invalid?: boolean
  readonly?: boolean
  busy?: boolean
  hidden?: boolean
  hasPopup?: AriaProps['aria-haspopup']
}): Partial<AriaProps> {
  const ariaProps: Partial<AriaProps> = {}

  if (props.label) ariaProps['aria-label'] = props.label
  if (props.describedBy) ariaProps['aria-describedby'] = props.describedBy
  if (props.expanded !== undefined) ariaProps['aria-expanded'] = props.expanded
  if (props.disabled) ariaProps['aria-disabled'] = true
  if (props.required) ariaProps['aria-required'] = true
  if (props.invalid) ariaProps['aria-invalid'] = true
  if (props.readonly) ariaProps['aria-readonly'] = true
  if (props.busy) ariaProps['aria-busy'] = true
  if (props.hidden) ariaProps['aria-hidden'] = true
  if (props.hasPopup !== undefined) ariaProps['aria-haspopup'] = props.hasPopup

  return ariaProps
}

/**
 * 键盘导航键码常量
 */
export const KEY_CODES = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  ARROW_DOWN: 'ArrowDown',
  ARROW_UP: 'ArrowUp',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
  TAB: 'Tab',
} as const

export type KeyCode = typeof KEY_CODES[keyof typeof KEY_CODES]

/**
 * 检查键盘事件是否为指定键
 */
export function isKey(event: KeyboardEvent, key: KeyCode): boolean {
  return event.key === key
}

/**
 * 检查是否为激活键（Enter或Space）
 */
export function isActivationKey(event: KeyboardEvent): boolean {
  return isKey(event, KEY_CODES.ENTER) || isKey(event, KEY_CODES.SPACE)
}

/**
 * 检查是否为导航键
 */
export function isNavigationKey(event: KeyboardEvent): boolean {
  const navigationKeys: KeyCode[] = [
    KEY_CODES.ARROW_UP,
    KEY_CODES.ARROW_DOWN,
    KEY_CODES.ARROW_LEFT,
    KEY_CODES.ARROW_RIGHT,
    KEY_CODES.HOME,
    KEY_CODES.END,
  ]
  return navigationKeys.includes(event.key as KeyCode)
}

/**
 * 焦点管理工具
 */
export class FocusManager {
  private previouslyFocusedElement: HTMLElement | null = null

  /**
   * 保存当前焦点元素
   */
  saveFocus(): void {
    this.previouslyFocusedElement = document.activeElement as HTMLElement
  }

  /**
   * 恢复之前保存的焦点
   */
  restoreFocus(): void {
    if (this.previouslyFocusedElement) {
      this.previouslyFocusedElement.focus()
    }
  }

  /**
   * 将焦点设置到指定元素
   */
  setFocus(element: HTMLElement | null): void {
    if (element) {
      element.focus()
    }
  }

  /**
   * 创建焦点陷阱
   * 防止Tab键焦点移出容器
   */
  createFocusTrap(container: HTMLElement | null): () => void {
    if (!container) return () => {}

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      const focusableElements = container.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) as NodeListOf<HTMLElement>

      if (!focusableElements.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTab)
    return () => document.removeEventListener('keydown', handleTab)
  }
}

/**
 * 屏幕阅读器公告
 * 用于向屏幕阅读器用户宣布状态变化
 */
export function announceToScreenReader(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  const announcement = document.createElement('div')
  announcement.setAttribute('role', 'status')
  announcement.setAttribute('aria-live', priority)
  announcement.setAttribute('aria-atomic', 'true')
  announcement.className = 'sr-only'

  document.body.appendChild(announcement)
  announcement.textContent = message

  // 延迟移除以确保屏幕阅读器读取
  setTimeout(() => {
    document.body.removeChild(announcement)
  }, 1000)
}

/**
 * 检查元素是否可见（用于无障碍）
 */
export function isElementVisible(element: HTMLElement): boolean {
  return (
    element.offsetWidth > 0 ||
    element.offsetHeight > 0 ||
    element.getClientRects().length > 0
  )
}

/**
 * 获取元素的文本内容（用于无障碍标签）
 */
export function getAccessibleText(element: HTMLElement): string {
  // 优先使用aria-label
  if (element.getAttribute('aria-label')) {
    return element.getAttribute('aria-label')!
  }

  // 其次使用aria-labelledby
  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const labelElement = document.getElementById(labelledBy)
    if (labelElement) {
      return labelElement.textContent?.trim() || ''
    }
  }

  // 最后使用元素内容
  return element.textContent?.trim() || ''
}
