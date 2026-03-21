# 组件开发指南

## 概述

本文档提供掼蛋3.0项目的组件开发详细指南，包括组件设计模式、最佳实践、性能优化技巧等。

## 组件分类

### 1. 基础UI组件 (`src/components/ui/`)

基础UI组件是构建界面的原子组件，应该高度可复用、无业务逻辑。

#### 设计原则
- **单一职责**: 每个组件只负责一个UI功能
- **可组合性**: 易于与其他组件组合
- **无副作用**: 纯展示组件，不包含业务逻辑
- **完整类型**: 完整的TypeScript类型定义

#### 示例: Button组件

```tsx
// src/components/ui/Button/Button.tsx
import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'
import { Loader2 } from 'lucide-react'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

#### 示例: Card组件

```tsx
// src/components/ui/Card/Card.tsx
import * as React from 'react'
import { cn } from '@/lib/utils/cn'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'rounded-xl border bg-card text-card-foreground shadow',
      className
    )}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('font-semibold leading-none tracking-tight', className)}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
```

### 2. 游戏组件 (`src/components/game/`)

游戏组件包含游戏特定的业务逻辑和交互。

#### 设计原则
- **领域驱动**: 反映游戏领域概念
- **状态感知**: 与游戏状态紧密集成
- **性能优化**: 高频更新组件需要特别优化
- **可测试性**: 易于单元测试和集成测试

#### 示例: PlayingCard组件

```tsx
// src/components/game/PlayingCard.tsx
'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils/cn'
import type { Card } from '@/lib/game/types'

interface PlayingCardProps {
  card: Card
  isSelected?: boolean
  isPlayable?: boolean
  isHighlighted?: boolean
  onClick?: (card: Card) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

const SUIT_COLORS = {
  H: 'text-red-500', // 红桃
  D: 'text-red-400', // 方块
  C: 'text-gray-700', // 梅花
  S: 'text-gray-800', // 黑桃
  J: 'text-yellow-600', // 王牌
}

const SUIT_SYMBOLS = {
  H: '♥',
  D: '♦',
  C: '♣',
  S: '♠',
  J: '🃏',
}

const SIZE_CLASSES = {
  sm: 'w-12 h-16 text-sm',
  md: 'w-16 h-24 text-base',
  lg: 'w-20 h-28 text-lg',
}

export function PlayingCard({
  card,
  isSelected = false,
  isPlayable = false,
  isHighlighted = false,
  onClick,
  className,
  size = 'md',
}: PlayingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = () => {
    if (isPlayable && onClick) {
      onClick(card)
    }
  }

  return (
    <motion.div
      className={cn(
        'relative rounded-lg border-2 bg-white shadow-lg transition-all duration-200 cursor-pointer select-none',
        isSelected && 'border-primary shadow-xl -translate-y-2',
        isPlayable && 'hover:shadow-2xl hover:-translate-y-1',
        isHighlighted && 'ring-2 ring-yellow-400 ring-offset-2',
        isHovered && 'z-10',
        SIZE_CLASSES[size],
        className
      )}
      whileHover={isPlayable ? { scale: 1.05 } : {}}
      whileTap={isPlayable ? { scale: 0.95 } : {}}
      onClick={handleClick}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      layoutId={`card-${card.id}`}
    >
      {/* 左上角标识 */}
      <div className="absolute left-1 top-1 flex flex-col items-center">
        <div className={cn('font-bold', SUIT_COLORS[card.suit])}>
          {card.rank}
        </div>
        <div className={cn('text-xs', SUIT_COLORS[card.suit])}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>

      {/* 中央大符号 */}
      <div className="flex h-full items-center justify-center">
        <div className={cn('text-3xl font-bold', SUIT_COLORS[card.suit])}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>

      {/* 右下角标识（旋转180度） */}
      <div className="absolute right-1 bottom-1 flex flex-col items-center rotate-180">
        <div className={cn('font-bold', SUIT_COLORS[card.suit])}>
          {card.rank}
        </div>
        <div className={cn('text-xs', SUIT_COLORS[card.suit])}>
          {SUIT_SYMBOLS[card.suit]}
        </div>
      </div>

      {/* 选择指示器 */}
      {isSelected && (
        <div className="absolute inset-0 rounded-lg border-2 border-primary" />
      )}

      {/* 可出牌指示器 */}
      {isPlayable && !isSelected && (
        <div className="absolute inset-0 rounded-lg border border-dashed border-primary/30" />
      )}
    </motion.div>
  )
}
```

### 3. 页面组件 (`src/app/`)

页面组件是Next.js App Router中的路由组件。

#### 设计原则
- **服务端组件优先**: 默认使用服务端组件
- **客户端交互**: 交互逻辑使用'use client'
- **数据获取**: 使用Next.js数据获取模式
- **错误处理**: 实现完整的错误边界

#### 示例: 房间页面

```tsx
// src/app/room/[roomId]/page.tsx
import { notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import RoomClient from './RoomClient'

interface RoomPageProps {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params

  // 服务端数据获取
  const supabase = createServerSupabaseClient()

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', roomId)
    .single()

  if (error || !room) {
    notFound()
  }

  // 检查用户权限
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // 重定向到登录或匿名认证
  }

  const { data: members } = await supabase
    .from('room_members')
    .select('*')
    .eq('room_id', roomId)

  // 传递给客户端组件
  return (
    <RoomClient
      room={room}
      members={members || []}
      currentUserId={user.id}
    />
  )
}
```

## 组件模式

### 1. 复合组件模式

使用复合组件模式创建灵活的组件API。

```tsx
// 使用示例
<Card>
  <CardHeader>
    <CardTitle>房间信息</CardTitle>
    <CardDescription>房间ID: {roomId}</CardDescription>
  </CardHeader>
  <CardContent>
    {/* 内容 */}
  </CardContent>
  <CardFooter>
    <Button>准备</Button>
  </CardFooter>
</Card>
```

### 2. Render Props模式

用于共享逻辑的组件模式。

```tsx
interface HoverProps {
  isHovered: boolean
  hoverProps: React.HTMLAttributes<HTMLElement>
}

interface HoverableProps {
  children: (props: HoverProps) => React.ReactNode
}

function Hoverable({ children }: HoverableProps) {
  const [isHovered, setIsHovered] = useState(false)

  const hoverProps = {
    onMouseEnter: () => setIsHovered(true),
    onMouseLeave: () => setIsHovered(false),
  }

  return children({ isHovered, hoverProps })
}

// 使用示例
<Hoverable>
  {({ isHovered, hoverProps }) => (
    <div {...hoverProps} className={cn(isHovered && 'bg-gray-100')}>
      悬停效果
    </div>
  )}
</Hoverable>
```

### 3. 自定义Hook模式

将组件逻辑提取到自定义Hook中。

```tsx
// 自定义Hook
export function useCardSelection(initialCards: Card[] = []) {
  const [selectedCards, setSelectedCards] = useState<Card[]>([])

  const toggleCard = (card: Card) => {
    setSelectedCards(prev => {
      const isSelected = prev.some(c => c.id === card.id)
      if (isSelected) {
        return prev.filter(c => c.id !== card.id)
      } else {
        return [...prev, card]
      }
    })
  }

  const clearSelection = () => setSelectedCards([])

  return {
    selectedCards,
    toggleCard,
    clearSelection,
    isSelected: (card: Card) => selectedCards.some(c => c.id === card.id),
  }
}

// 组件中使用
function CardHand({ cards }: { cards: Card[] }) {
  const { selectedCards, toggleCard, isSelected } = useCardSelection()

  return (
    <div className="flex gap-2">
      {cards.map(card => (
        <PlayingCard
          key={card.id}
          card={card}
          isSelected={isSelected(card)}
          onClick={() => toggleCard(card)}
        />
      ))}
    </div>
  )
}
```

## 性能优化

### 1. 记忆化优化

```tsx
import { memo, useMemo, useCallback } from 'react'

// 使用React.memo避免不必要重渲染
const ExpensiveComponent = memo(function ExpensiveComponent({ data }: { data: Data[] }) {
  // 使用useMemo缓存计算结果
  const processedData = useMemo(() => {
    return data.map(item => expensiveProcessing(item))
  }, [data])

  // 使用useCallback缓存函数
  const handleClick = useCallback(() => {
    // 处理点击
  }, [])

  return <div>{/* 渲染 */}</div>
})
```

### 2. 虚拟列表

对于长列表使用虚拟滚动。

```tsx
import { useVirtualizer } from '@tanstack/react-virtual'

function VirtualList({ items }: { items: Item[] }) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(virtualItem => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}
```

### 3. 懒加载

```tsx
import { lazy, Suspense } from 'react'

// 动态导入
const HeavyComponent = lazy(() => import('./HeavyComponent'))

function MyPage() {
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <HeavyComponent />
      </Suspense>
    </div>
  )
}
```

## 测试策略

### 1. 单元测试

```tsx
// PlayingCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { PlayingCard } from './PlayingCard'
import type { Card } from '@/lib/game/types'

const mockCard: Card = {
  id: 1,
  suit: 'H',
  rank: 'A',
  val: 14,
}

describe('PlayingCard', () => {
  it('应该渲染卡牌', () => {
    render(<PlayingCard card={mockCard} />)

    expect(screen.getByText('A')).toBeInTheDocument()
    expect(screen.getByText('♥')).toBeInTheDocument()
  })

  it('应该处理点击事件', () => {
    const handleClick = vi.fn()
    render(<PlayingCard card={mockCard} isPlayable onClick={handleClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledWith(mockCard)
  })

  it('选中状态应该显示边框', () => {
    render(<PlayingCard card={mockCard} isSelected />)

    const card = screen.getByRole('button')
    expect(card).toHaveClass('border-primary')
  })
})
```

### 2. 集成测试

```tsx
// CardHand.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import { CardHand } from './CardHand'
import type { Card } from '@/lib/game/types'

const mockCards: Card[] = [
  { id: 1, suit: 'H', rank: 'A', val: 14 },
  { id: 2, suit: 'D', rank: 'K', val: 13 },
  { id: 3, suit: 'C', rank: 'Q', val: 12 },
]

describe('CardHand', () => {
  it('应该渲染所有卡牌', () => {
    render(<CardHand cards={mockCards} />)

    expect(screen.getAllByRole('button')).toHaveLength(3)
  })

  it('应该可以选中卡牌', () => {
    render(<CardHand cards={mockCards} />)

    const firstCard = screen.getAllByRole('button')[0]
    fireEvent.click(firstCard)

    expect(firstCard).toHaveClass('border-primary')
  })
})
```

## 可访问性

### 1. ARIA属性

```tsx
function AccessibleButton({ children, ...props }: ButtonProps) {
  return (
    <button
      role="button"
      aria-label={props['aria-label'] || '按钮'}
      aria-disabled={props.disabled}
      tabIndex={props.disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  )
}
```

### 2. 键盘导航

```tsx
function KeyboardNavigableList({ items }: { items: Item[] }) {
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setFocusedIndex(prev => Math.min(prev + 1, items.length - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setFocusedIndex(prev => Math.max(prev - 1, 0))
        break
      case 'Enter':
        if (focusedIndex >= 0) {
          // 执行操作
        }
        break
    }
  }, [focusedIndex, items.length])

  return (
    <div role="listbox" onKeyDown={handleKeyDown} tabIndex={0}>
      {items.map((item, index) => (
        <div
          key={item.id}
          role="option"
          aria-selected={index === focusedIndex}
          tabIndex={-1}
          className={cn(
            'p-2',
            index === focusedIndex && 'bg-blue-100'
          )}
        >
          {item.name}
        </div>
      ))}
    </div>
  )
}
```

## 总结

本指南提供了掼蛋3.0项目的组件开发最佳实践。开发人员应该：

1. **遵循组件分类原则**
2. **使用合适的组件模式**
3. **实施性能优化策略**
4. **编写全面的测试**
5. **确保可访问性**

通过遵循这些指南，可以确保组件的一致性、可维护性和高性能。

---
**版本**: 1.0
**更新日期**: 2026-03-19
**负责人**: 前端架构师