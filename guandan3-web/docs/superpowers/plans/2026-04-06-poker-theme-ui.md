# 经典深绿牌桌UI主题实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-step. Steps use checkbox (`- [ ]`) syntax for tracking.

**目标:** 将现有富春山居图（水墨风格）主题转换为专业扑克风格，提升整体美观度

**架构:** 通过更新CSS变量、Tailwind配置和组件样式，实现深绿牌桌背景、真实扑克牌样式和专业按钮设计

**技术栈:** Next.js 16, React 19, TypeScript, Tailwind CSS, Zustand

---

## 文件结构

### 需要修改的文件

| 文件 | 职责 | 更改类型 |
|------|------|----------|
| `src/app/globals.css` | CSS变量定义 | 更新 poker 主题变量 |
| `tailwind.config.ts` | Tailwind主题配置 | 扩展 poker 颜色 |
| `src/components/ui/Button/Button.tsx` | 按钮组件 | 更新样式变体 |
| `src/components/game/PlayingCard.tsx` | 扑克牌组件 | 重构为真实扑克牌样式 |
| `src/app/room/[roomId]/page.tsx` | 游戏房间页面 | 更新背景组件 |
| `src/components/backgrounds/SimpleEnvironmentBackground.tsx` | 背景组件 | 添加 poker 主题 |

---

## Task 1: 更新CSS变量（poker主题）

**Files:**
- Modify: `src/app/globals.css:5-75`

- [ ] **Step 1: 备份当前CSS变量**

打开 `src/app/globals.css`，找到 `:root` 选择器（大约第5行），将现有变量注释掉作为备份：

```css
/* :root { */
/*   Design Tokens - Default Theme (Classic) */
/*   --color-primary: #6BA539; */
/*   ... 其他现有变量 ... */
/* } */
```

- [ ] **Step 2: 添加新的poker主题CSS变量**

在注释的变量下方添加新的 `:root` 块：

```css
:root {
  /* ======================================== */
  /* Poker Theme - 经典深绿牌桌主题          */
  /* ======================================== */

  /* --- 牌桌背景 --- */
  --poker-table-bg-start: #1a472a;
  --poker-table-bg-end: #0d2818;
  --poker-table-border: #2d5a3d;
  --poker-table-light: #1e5634;

  /* --- 卡牌样式 --- */
  --card-bg: #ffffff;
  --card-bg-gradient-start: #ffffff;
  --card-bg-gradient-end: #f5f5f5;
  --card-text-black: #1f2937;
  --card-text-red: #dc2626;
  --card-border-radius: 8px;

  /* --- 卡牌背面 --- */
  --card-back-blue-start: #1e40af;
  --card-back-blue-end: #1e3a8a;
  --card-back-red-start: #991b1b;
  --card-back-red-end: #7f1d1d;

  /* --- 装饰色 --- */
  --accent-gold: #d4af37;
  --accent-gold-light: #e5c158;
  --state-success: #4ade80;
  --state-error: #f87171;
  --state-warning: #fbbf24;
  --state-info: #60a5fa;

  /* --- 阴影 --- */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.7);
  --shadow-card: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-card-hover: 0 12px 28px rgba(0, 0, 0, 0.6);

  /* --- 动画时长 --- */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 400ms;

  /* --- 字体 --- */
  --font-card: 'Georgia', 'Times New Roman', serif;

  /* --- 兼容性别名（保持现有代码工作） --- */
  --color-primary: #1a472a;
  --color-secondary: #2d5a3d;
  --color-accent: #d4af37;
  --color-success: #4ade80;
  --color-warning: #fbbf24;
  --color-error: #f87171;
  --color-border: #2d5a3d;
  --color-card: #ffffff;
  --color-card-hover: #f5f5f5;
  --bg-primary: #0d2818;
  --bg-secondary: #1a472a;
  --text-primary: #e5e7eb;
  --text-secondary: #9ca3af;
  --gradient-primary: linear-gradient(135deg, #1a472a 0%, #0d2818 100%);
  --gradient-secondary: linear-gradient(135deg, #2d5a3d 0%, #1a472a 100%);
  --gradient-background: linear-gradient(180deg, #1a472a 0%, #0d2818 100%);
}
```

- [ ] **Step 3: 验证CSS文件语法**

运行: `npm run typecheck`

预期: 无类型错误

- [ ] **Step 4: 提交更改**

```bash
git add src/app/globals.css
git commit -m "feat(poker-theme): 添加poker主题CSS变量

- 添加牌桌背景渐变颜色
- 添加卡牌样式颜色（真实扑克牌）
- 添加装饰色（金色、成功、错误等）
- 添加阴影系统（三级阴影）
- 添加动画时长变量
- 添加卡牌专用字体
- 保持兼容性别名
"
```

---

## Task 2: 更新Tailwind配置

**Files:**
- Modify: `tailwind.config.ts:22-70`

- [ ] **Step 1: 更新颜色扩展**

打开 `tailwind.config.ts`，找到 `theme.extend.colors` 部分（大约第22行），替换为以下内容：

```typescript
colors: {
  // Poker主题颜色
  poker: {
    table: {
      DEFAULT: '#1a472a',
      light: '#1e5634',
      dark: '#0d2818',
      border: '#2d5a3d',
    },
    card: {
      bg: '#ffffff',
      bgGradientStart: '#ffffff',
      bgGradientEnd: '#f5f5f5',
      textBlack: '#1f2937',
      textRed: '#dc2626',
    },
  },
  // 装饰色
  accent: {
    gold: '#d4af37',
    goldLight: '#e5c158',
  },
  // 状态色
  success: '#4ade80',
  warning: '#fbbf24',
  error: '#f87171',
  info: '#60a5fa',
  // 原有颜色（保持兼容）
  primary: {
    DEFAULT: 'var(--color-primary)',
    50: '#e8f3e0',
    100: '#d4e7c0',
    200: '#b8d6a0',
    300: '#9bc27b',
    400: '#6ba539',
    500: '#4a7a2a',
    600: '#2d5a1d',
    700: '#1a4a0a',
    foreground: '#0d2818',
  },
  secondary: {
    DEFAULT: '#2d5a3d',
    foreground: '#ffffff',
  },
  background: {
    primary: '#0d2818',
    secondary: '#1a472a',
  },
  surface: '#1a472a',
  beige: {
    DEFAULT: '#f5f5dc',
    light: '#fef3c7',
    dark: '#e8e8e0',
  },
  muted: {
    DEFAULT: '#6b7280',
    foreground: '#9ca3af',
  },
  text: {
    primary: '#e5e7eb',
    secondary: '#9ca3af',
    foreground: '#1f2937',
    muted: '#9ca3af',
  },
  border: '#2d5a3d',
  card: {
    DEFAULT: '#ffffff',
    hover: '#f5f5f5',
  },
},
```

- [ ] **Step 2: 添加阴影扩展**

在 `theme.extend` 中添加阴影定义：

```typescript
boxShadow: {
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  card: 'var(--shadow-card)',
  'card-hover': 'var(--shadow-card-hover)',
  'card-selected': '0 12px 28px rgba(0, 0, 0, 0.6), 0 0 0 3px #d4af37, 0 0 20px rgba(212, 175, 55, 0.5)',
},
```

- [ ] **Step 3: 添加动画时长扩展**

在 `theme.extend` 中添加：

```typescript
transitionDuration: {
  fast: '150ms',
  normal: '250ms',
  slow: '400ms',
},
```

- [ ] **Step 4: 添加字体家族**

在 `theme.extend.fontFamily` 中添加：

```typescript
fontFamily: {
  serif: ['var(--font-noto-serif-sc)', 'Noto Serif SC', 'Source Han Serif SC', '思源宋体', 'SimSun', 'serif'],
  card: ['Georgia', 'Times New Roman', 'serif'],
},
```

- [ ] **Step 5: 验证Tailwind配置**

运行: `npm run typecheck`

预期: 无类型错误

- [ ] **Step 6: 提交更改**

```bash
git add tailwind.config.ts
git commit -m "feat(poker-theme): 更新Tailwind配置支持poker主题

- 添加poker.table颜色系列
- 添加poker.card颜色系列
- 添加accent.gold装饰色
- 添加状态色（success/warning/error/info）
- 添加阴影扩展（sm/md/lg/card/card-hover/selected）
- 添加动画时长（fast/normal/slow）
- 添加card字体家族
- 保持原有颜色兼容性
"
```

---

## Task 3: 重构Button组件（poker主题样式）

**Files:**
- Modify: `src/components/ui/Button/Button.tsx:9-49`
- Test: `src/components/ui/Button/Button.test.tsx`

- [ ] **Step 1: 更新buttonVariants定义**

打开 `src/components/ui/Button/Button.tsx`，找到 `buttonVariants` 定义（第9行），替换为：

```typescript
const buttonVariants = cva(
  // 基础样式 - poker主题
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium ring-offset-background transition-all duration-[250ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // 主要按钮 - 深绿渐变
        primary: 'bg-gradient-to-br from-poker-table to-poker-table-dark border border-poker-table-border text-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:-translate-y-px hover:text-white active:translate-y-px active:shadow-[0_2px_6px_rgba(0,0,0,0.4)]',
        // 次要按钮 - 中绿色
        secondary: 'bg-gradient-to-br from-poker-table-light to-poker-table border border-poker-table-border text-gray-200 shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)] hover:-translate-y-px hover:text-white active:translate-y-px',
        // 轮廓按钮 - 金色边框
        outline: 'bg-transparent border-2 border-accent-gold text-accent-gold shadow-[0_2px_6px_rgba(0,0,0,0.3)] hover:bg-accent-gold/10 hover:shadow-[0_4px_10px_rgba(212,175,55,0.3)] active:translate-y-px',
        // 幽灵按钮
        ghost: 'bg-transparent text-gray-200 hover:bg-white/10 active:bg-white/20',
        // 危险按钮
        danger: 'bg-gradient-to-br from-[#991b1b] to-[#7f1d1d] border border-[#dc2626] text-white shadow-[0_4px_10px_rgba(0,0,0,0.5)] hover:shadow-[0_6px_16px_rgba(220,38,38,0.4)] hover:-translate-y-px active:translate-y-px',
        // 链接样式
        link: 'text-accent-gold underline-offset-4 hover:underline',
      },
      size: {
        // 小尺寸 - 13px字体，padding适配
        sm: 'h-8 px-[12px] py-[6px] text-[13px] min-h-[32px]',
        // 中尺寸 - 15px字体，padding适配（默认）
        md: 'h-10 px-[18px] py-[10px] text-[15px] min-h-[40px]',
        // 大尺寸 - 17px字体，padding适配
        lg: 'h-12 px-[24px] py-[14px] text-[17px] min-h-[48px]',
        // 特大尺寸 - 19px字体，主操作按钮
        xl: 'h-14 px-[32px] py-[18px] text-[19px] font-semibold min-h-[56px] bg-gradient-to-br from-accent-gold to-[#b8962e] border border-accent-goldLight text-gray-900 shadow-[0_6px_14px_rgba(0,0,0,0.5)] hover:shadow-[0_8px_18px_rgba(0,0,0,0.6)] hover:-translate-y-px active:translate-y-px',
        // 图标按钮
        icon: 'h-10 w-10',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      fullWidth: false,
    },
  }
)
```

- [ ] **Step 2: 运行类型检查**

运行: `npm run typecheck`

预期: 无类型错误

- [ ] **Step 3: 提交更改**

```bash
git add src/components/ui/Button/Button.tsx
git commit -m "feat(poker-theme): 更新Button组件为poker主题样式

- 深绿渐变背景（primary/secondary）
- 金色轮廓边框（outline）
- 更新4种尺寸（sm/md/lg/xl）与文字比例匹配
- 添加悬停/激活状态阴影和变换效果
- 危险按钮使用红色渐变
- xl尺寸作为主操作按钮（金色）
"
```

---

## Task 4: 重构PlayingCard组件（真实扑克牌样式）

**Files:**
- Create: `src/components/game/PlayingCard.types.ts`
- Modify: `src/components/game/PlayingCard.tsx`

- [ ] **Step 1: 创建类型定义文件**

创建 `src/components/game/PlayingCard.types.ts`：

```typescript
export type CardSuit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type CardRank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'
export type CardSize = 'sm' | 'md' | 'lg'

export interface PlayingCardProps {
  suit: CardSuit
  rank: CardRank
  faceDown?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  size?: CardSize
  className?: string
}

export interface CardBackProps {
  size?: CardSize
  className?: string
  backColor?: 'blue' | 'red'
}
```

- [ ] **Step 2: 重构PlayingCard组件**

完全替换 `src/components/game/PlayingCard.tsx` 的内容：

```typescript
'use client'

import React, { useMemo } from 'react'
import { cn } from '@/lib/utils'
import RippleEffect from '@/components/effects/RippleEffect'
import type { CardSuit, CardRank, CardSize, PlayingCardProps, CardBackProps } from './PlayingCard.types'

// ============================================
// 尺寸规格 - 符合真实扑克牌比例 1:1.4
// ============================================

const CARD_SIZES: Record<CardSize, { width: string; height: string; cornerRank: string; cornerSuit: string; centerSuit: string }> = {
  sm: {
    width: '56px',
    height: '78px',
    cornerRank: 'text-[11px]',
    cornerSuit: 'text-[9px]',
    centerSuit: 'text-[28px]',
  },
  md: {
    width: '80px',
    height: '112px',
    cornerRank: 'text-[14px]',
    cornerSuit: 'text-[10px]',
    centerSuit: 'text-[40px]',
  },
  lg: {
    width: '100px',
    height: '140px',
    cornerRank: 'text-[16px]',
    cornerSuit: 'text-[12px]',
    centerSuit: 'text-[48px]',
  },
}

// ============================================
// 花色符号和颜色
// ============================================

const SUIT_SYMBOLS: Record<CardSuit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
}

const SUIT_COLORS: Record<CardSuit, string> = {
  spades: 'text-[#1f2937]',
  hearts: 'text-[#dc2626]',
  diamonds: 'text-[#dc2626]',
  clubs: 'text-[#1f2937]',
}

// ============================================
// 人头牌判断
// ============================================

function isFaceCard(rank: CardRank): boolean {
  return ['J', 'Q', 'K'].includes(rank)
}

// ============================================
// 主组件
// ============================================

export default function PlayingCard({
  suit,
  rank,
  faceDown = false,
  selected = false,
  disabled = false,
  onClick,
  size = 'md',
  className = '',
}: PlayingCardProps) {
  const sizeConfig = CARD_SIZES[size]
  const suitColor = SUIT_COLORS[suit]
  const suitSymbol = SUIT_SYMBOLS[suit]
  const isFace = isFaceCard(rank)

  // 状态样式
  const stateClass = useMemo(() => {
    if (disabled) {
      return 'opacity-60 cursor-not-allowed'
    }
    if (selected) {
      return '-translate-y-3 shadow-card-selected ring-0'
    }
    return 'hover:-translate-y-1 hover:shadow-card-hover cursor-pointer transition-transform duration-[150ms]'
  }, [selected, disabled])

  const baseClass = cn(
    // 基础样式
    'relative rounded-lg shadow-card transition-all duration-[250ms] select-none overflow-hidden',
    // 字体 - 使用衬线字体
    'font-card',
    // 尺寸
    sizeConfig.width,
    sizeConfig.height,
    // 状态
    stateClass,
    className
  )

  // 卡牌正面内容
  const faceContent = (
    <div className={cn(
      baseClass,
      'bg-gradient-to-br from-white to-[#f5f5f5]'
    )}>
      {/* 左上角 - 数字 + 小符号 */}
      <div className={cn(
        'absolute top-1 left-1 flex flex-col items-center leading-none',
        suitColor
      )}>
        <span className={cn('font-bold', sizeConfig.cornerRank)}>{rank}</span>
        <span className={sizeConfig.cornerSuit}>{suitSymbol}</span>
      </div>

      {/* 中央图案 */}
      {isFace ? (
        // 人头牌 - 简化的人物图案
        <div className={cn(
          'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
          'w-[50px] h-[70px] rounded border-2 flex items-center justify-center',
          suit === 'hearts' || suit === 'diamonds'
            ? 'bg-gradient-to-b from-[#fee2e2] to-[#fecaca] border-[#dc2626]'
            : 'bg-gradient-to-b from-[#e8f3e0] to-[#d4e7c0] border-[#1a472a]'
        )}>
          <span className={cn(
            'text-[32px] font-bold',
            suit === 'hearts' || suit === 'diamonds' ? 'text-[#991b1b]' : 'text-[#1a4a0a]'
          )}>{rank}</span>
        </div>
      ) : (
        // 普通牌 - 大花色符号
        <div className={cn(
          'absolute inset-0 flex items-center justify-center',
          suitColor,
          sizeConfig.centerSuit
        )}>
          {suitSymbol}
        </div>
      )}

      {/* 右下角 - 旋转180度的数字 + 小符号 */}
      <div className={cn(
        'absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180',
        suitColor
      )}>
        <span className={cn('font-bold', sizeConfig.cornerRank)}>{rank}</span>
        <span className={sizeConfig.cornerSuit}>{suitSymbol}</span>
      </div>
    </div>
  )

  // 卡牌背面内容
  const backContent = (
    <div className={cn(
      baseClass,
      'bg-gradient-to-br from-[#1e40af] to-[#1e3a8a] border-3 border-[#3b82f6]'
    )}>
      {/* 外边框 */}
      <div className="absolute inset-0 border-2 border-[#60a5fa] rounded-md m-[6px]"></div>
      {/* 中央图案 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-[#93c5fd] text-lg opacity-80">
          ♠♥♦♣
        </div>
      </div>
    </div>
  )

  const cardContent = faceDown ? backContent : faceContent

  // 可点击状态
  if (onClick && !disabled) {
    return (
      <RippleEffect className="relative inline-block">
        <div onClick={onClick}>
          {cardContent}
        </div>
      </RippleEffect>
    )
  }

  return cardContent
}

// ============================================
// CardBack 子组件
// ============================================

export function CardBack({ size = 'md', className = '', backColor = 'blue' }: CardBackProps) {
  const sizeConfig = CARD_SIZES[size]

  const backGradient = backColor === 'blue'
    ? 'from-[#1e40af] to-[#1e3a8a]'
    : 'from-[#991b1b] to-[#7f1d1d]'

  const borderColor = backColor === 'blue' ? '#3b82f6' : '#dc2626'
  const innerBorderColor = backColor === 'blue' ? '#60a5fa' : '#f87171'
  const textColor = backColor === 'blue' ? '#93c5fd' : '#fca5a5'

  return (
    <div
      className={cn(
        'relative rounded-lg shadow-card overflow-hidden',
        sizeConfig.width,
        sizeConfig.height,
        'bg-gradient-to-br',
        backGradient,
        'border-3',
        className
      )}
      style={{ borderColor }}
    >
      {/* 内边框 */}
      <div
        className="absolute inset-0 border-2 rounded-md m-[6px]"
        style={{ borderColor: innerBorderColor }}
      ></div>
      {/* 中央图案 */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-lg opacity-80" style={{ color: textColor }}>
          ♠♥♦♣
        </div>
      </div>
    </div>
  )
}

// ============================================
// 导出类型
// ============================================

export type { CardSuit, CardRank, CardSize, PlayingCardProps, CardBackProps }
```

- [ ] **Step 3: 运行类型检查**

运行: `npm run typecheck`

预期: 无类型错误

- [ ] **Step 4: 提交更改**

```bash
git add src/components/game/PlayingCard.tsx src/components/game/PlayingCard.types.ts
git commit -m "feat(poker-theme): 重构PlayingCard为真实扑克牌样式

- 创建PlayingCard.types.ts类型定义文件
- 实现1:1.4标准扑克牌比例
- 添加三段式布局（角落+中央+旋转180度）
- 使用Georgia衬线字体
- 黑桃/梅花深灰色，红心/方片鲜红色
- 人头牌（J/Q/K）简化人物图案
- 卡牌背面经典蓝/红渐变样式
- 选中状态金色边框+发光效果
- 悬停状态上浮效果
"
```

---

## Task 5: 更新背景组件（poker主题）

**Files:**
- Modify: `src/components/backgrounds/SimpleEnvironmentBackground.tsx`

- [ ] **Step 1: 读取现有背景组件**

打开 `src/components/backgrounds/SimpleEnvironmentBackground.tsx`

- [ ] **Step 2: 添加poker主题背景**

在组件中添加对poker主题的支持，找到背景渲染部分，添加：

```typescript
// 检测当前主题
const isPokerTheme = process.env.NEXT_PUBLIC_THEME === 'poker'

// 背景样式
const backgroundStyle = isPokerTheme
  ? 'bg-gradient-to-br from-poker-table via-poker-table-light to-poker-table-dark'
  : 'bg-gradient-to-br from-background-start to-background-end'

return (
  <div className={cn('fixed inset-0 -z-10', backgroundStyle)}>
    {/* poker主题添加纹理效果 */}
    {isPokerTheme && (
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(ellipse at center, #ffffff 0%, transparent 70%)',
      }}></div>
    )}
  </div>
)
```

- [ ] **Step 3: 提交更改**

```bash
git add src/components/backgrounds/SimpleEnvironmentBackground.tsx
git commit -m "feat(poker-theme): 添加poker主题背景支持

- 添加NEXT_PUBLIC_THEME环境变量检测
- 深绿渐变背景（from-poker-table to-poker-table-dark）
- 添加微妙纹理效果
"
```

---

## Task 6: 更新游戏房间页面

**Files:**
- Modify: `src/app/room/[roomId]/page.tsx:226-227`

- [ ] **Step 1: 更新背景组件引用**

找到 `SimpleEnvironmentBackground` 组件的使用（约第226行），确保使用新的poker主题背景。

- [ ] **Step 2: 提交更改**

```bash
git add src/app/room/[roomId]/page.tsx
git commit -m "feat(poker-theme): 游戏房间使用poker主题背景

- 更新背景组件引用
"
```

---

## Task 7: 创建环境变量配置

**Files:**
- Create: `.env.local`

- [ ] **Step 1: 添加主题环境变量**

创建或更新 `.env.local`：

```env
# 主题选择: classic | poker
NEXT_PUBLIC_THEME=poker
```

- [ ] **Step 2: 提交更改**

```bash
git add .env.local
git commit -m "feat(poker-theme): 设置默认主题为poker"
```

---

## Task 8: 验收测试

**Files:**
- None (手动验证)

- [ ] **Step 1: 启动开发服务器**

运行: `npm run dev`

- [ ] **Step 2: 视觉验收清单**

在浏览器中打开游戏房间，检查以下项目：

- [ ] 背景为深绿色渐变，无明显断层
- [ ] 卡牌为白色背景，红黑花色分明
- [ ] 卡牌布局符合真实扑克牌（角落数字+符号、中央图案、右下角旋转）
- [ ] 使用衬线字体（Georgia）
- [ ] 花色符号清晰，使用标准 Unicode 符号
- [ ] 人头牌（J/Q/K）有独特的人物图案
- [ ] 卡牌背面有经典图案和边框
- [ ] 卡牌宽高比约为 1:1.4
- [ ] 所有按钮有统一的阴影和悬停效果
- [ ] 选中状态有明显视觉反馈（金色边框+发光）
- [ ] 文字与背景对比度清晰可读

- [ ] **Step 3: 交互验收清单**

- [ ] 悬停效果流畅（150-250ms）
- [ ] 点击有即时反馈
- [ ] 动画不卡顿（60fps）
- [ ] 触摸目标 ≥44px × 44px（移动端）

- [ ] **Step 4: 运行测试套件**

运行: `npm test`

预期: 所有测试通过

- [ ] **Step 5: 运行类型检查**

运行: `npm run typecheck`

预期: 无类型错误

- [ ] **Step 6: 构建生产版本**

运行: `npm run build`

预期: 构建成功，无错误

---

## Task 9: 最终提交和标签

- [ ] **Step 1: 查看所有更改**

运行: `git status`

- [ ] **Step 2: 提交所有剩余更改**

```bash
git add .
git commit -m "feat(poker-theme): 完成poker主题UI实现

P0任务完成:
✓ CSS变量更新（poker主题颜色）
✓ Tailwind配置扩展
✓ Button组件样式更新
✓ PlayingCard重构为真实扑克牌
✓ 背景组件poker主题支持
✓ 环境变量配置

验收标准:
✓ 深绿牌桌背景
✓ 真实扑克牌样式（1:1.4比例，衬线字体）
✓ 按钮尺寸与文字比例匹配
✓ 阴影和深度效果
✓ 悬停/选中状态反馈
"
```

- [ ] **Step 3: 创建版本标签**

```bash
git tag -a v1.0.0-poker-theme -m "经典深绿牌桌UI主题"
git push origin main --tags
```

---

## 后续优化（P1-P3）

### P1 - 本周完成
- 游戏房间背景优化
- 覆盖层样式统一
- 动画过渡效果
- 状态反馈样式

### P2 - 后续优化
- 微交互细节
- 特效优化
- 响应式调整

### P3 - 锦上添花
- 主题切换功能
- 个性化设置
- 高级动画效果

---

**计划完成！准备开始实施。**
