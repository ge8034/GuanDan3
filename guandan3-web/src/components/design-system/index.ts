/**
 * Design System Components
 *
 * 基于 Impeccable Frontend Design Principles 的可复用组件
 *
 * 使用方法:
 * import { ProseText, SafeMotion, Spacer, ContentWidth } from '@/components/design-system'
 */

// ProseText - 行高优化的文本组件
export { ProseText, Paragraph, Lead, Caption } from './ProseText'

// SafeMotion - Reduced Motion 安全的动画组件
export { SafeMotion, FadeIn, SlideUp, ScaleIn } from './SafeMotion'

// Spacer - 基于 4pt 间距系统的空白组件
export { Spacer, Spacers } from './Spacer'

// ContentWidth - 行长限制组件
export { ContentWidth, Prose, NarrowContent, WideContent } from './ContentWidth'
