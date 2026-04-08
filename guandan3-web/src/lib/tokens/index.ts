/**
 * Impeccable Design Tokens
 *
 * 基于 Impeccable Frontend Design Principles 的设计变量
 * 参考: .claude/skills/impeccable-design/
 *
 * 使用方法:
 * import { tokens } from '@/lib/tokens'
 * className={tokens.spacing.md}
 */

/* ======================================== */
/* 间距系统 - 4pt 基数                                 */
/* ======================================== */
/** 4px */
export const spacing1 = '0.25rem'
/** 8px */
export const spacing2 = '0.5rem'
/** 12px */
export const spacing3 = '0.75rem'
/** 16px */
export const spacing4 = '1rem'
/** 20px - 避免使用，使用 16px 或 24px */
export const spacing5 = '1.25rem'
/** 24px */
export const spacing6 = '1.5rem'
/** 32px */
export const spacing8 = '2rem'
/** 48px */
export const spacing12 = '3rem'
/** 64px */
export const spacing16 = '4rem'
/** 96px */
export const spacing24 = '6rem'

/* ======================================== */
/* 字体大小 - 模块化比例 (1.25)                       */
/* ======================================== */
/** 12px - captions, legal */
export const textXs = '0.75rem'
/** 14px - secondary UI, metadata */
export const textSm = '0.875rem'
/** 16px - body text */
export const textBase = '1rem'
/** 20px - subheadings, lead text */
export const textLg = '1.25rem'
/** 24px - headings */
export const textXl = '1.5rem'
/** 32px - hero text */
export const text2xl = '2rem'
/** 40px - display */
export const text3xl = '2.5rem'
/** 48px - hero title */
export const text4xl = '3rem'

/* ======================================== */
/* 行高                                               */
/* ======================================== */
/** 正文标准行高 (16px × 1.6 = 25.6px ≈ 24px 垂直节奏) */
export const leadingNormal = 1.6
/** 深色背景行高 (增加可读性) */
export const leadingRelaxed = 1.7
/** 标题行高 */
export const leadingTight = 1.25

/* ======================================== */
/* 过渡时间                                            */
/* ======================================== */
/** 100ms - 即时反馈 (按钮点击、切换) */
export const durationFast = 100
/** 200ms - 状态变化 (菜单、提示、悬停) */
export const durationBase = 200
/** 300ms - 布局变化 (手风琴、模态) */
export const durationSlow = 300
/** 500ms+ - 进入动画 */
export const durationSlower = 500

/* ======================================== */
/* 缓动函数                                            */
/* ======================================== */
/** 进入动画 (推荐) */
export const easeOut = 'cubic-bezier(0.16, 1, 0.3, 1)'
/** 离开动画 */
export const easeIn = 'cubic-bezier(0.7, 0, 0.84, 0)'
/** 状态切换 (往返) */
export const easeInOut = 'cubic-bezier(0.65, 0, 0.35, 1)'

/* ======================================== */
/* 行长限制                                            */
/* ======================================== */
/** 约 65 个字符 (正文) */
export const measureWide = '65ch'
/** 约 45 个字符 (侧边栏) */
export const measureNarrow = '45ch'

/* ======================================== */
/* 圆角                                                */
/* ======================================== */
export const radiusSm = '0.25rem'  /* 4px */
export const radiusMd = '0.5rem'   /* 8px */
export const radiusLg = '0.75rem'  /* 12px */
export const radiusXl = '1rem'     /* 16px */
export const radiusFull = '9999px' /* 完全圆角 */

/* ======================================== */
/* 阴影层级                                            */
/* ======================================== */
export const shadowSm = '0 1px 3px rgba(0, 0, 0, 0.1)'
export const shadowMd = '0 4px 12px rgba(0, 0, 0, 0.15)'
export const shadowLg = '0 8px 24px rgba(0, 0, 0, 0.2)'
export const shadowXl = '0 12px 48px rgba(0, 0, 0, 0.25)'

/* ======================================== */
/* Z-index 层级                                        */
/* ======================================== */
export const zDropdown = 10
export const zSticky = 20
export const zModalBackdrop = 30
export const zModal = 40
export const zToast = 50
export const zTooltip = 60

// 导出为对象以便于使用
export const tokens = {
  spacing: {
    '1': spacing1,
    '2': spacing2,
    '3': spacing3,
    '4': spacing4,
    '6': spacing6,
    '8': spacing8,
    '12': spacing12,
    '16': spacing16,
    '24': spacing24,
  },
  text: {
    xs: textXs,
    sm: textSm,
    base: textBase,
    lg: textLg,
    xl: textXl,
    '2xl': text2xl,
    '3xl': text3xl,
    '4xl': text4xl,
  },
  duration: {
    fast: durationFast,
    base: durationBase,
    slow: durationSlow,
    slower: durationSlower,
  },
  easing: {
    easeOut,
    easeIn,
    easeInOut,
  },
  radius: {
    sm: radiusSm,
    md: radiusMd,
    lg: radiusLg,
    xl: radiusXl,
    full: radiusFull,
  },
  shadow: {
    sm: shadowSm,
    md: shadowMd,
    lg: shadowLg,
    xl: shadowXl,
  },
  zIndex: {
    dropdown: zDropdown,
    sticky: zSticky,
    modalBackdrop: zModalBackdrop,
    modal: zModal,
    toast: zToast,
    tooltip: zTooltip,
  },
}
