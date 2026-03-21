# 前端开发标准规范

## 概述

本文档定义了掼蛋3.0项目的前端开发标准，涵盖代码规范、组件架构、状态管理、性能优化、测试策略等方面。所有前端开发人员必须遵守这些标准。

## 技术栈

- **框架**: Next.js 16.1.6 (App Router)
- **UI库**: React 19.2.4
- **类型系统**: TypeScript 5
- **样式**: Tailwind CSS 4
- **状态管理**: Zustand 5.0.11
- **图标**: Lucide React 0.577.0
- **动画**: Framer Motion 12.36.0
- **3D渲染**: Three.js + React Three Fiber
- **测试**: Vitest + Playwright

## 代码规范

### 文件命名规范

1. **组件文件**: `PascalCase.tsx`
   - 示例: `GameTable.tsx`, `PlayerAvatar.tsx`
   - 测试文件: `GameTable.test.tsx`

2. **工具函数/钩子**: `camelCase.ts`
   - 示例: `formatCard.ts`, `useGame.ts`
   - 测试文件: `formatCard.test.ts`

3. **常量文件**: `UPPER_SNAKE_CASE.ts`
   - 示例: `GAME_CONSTANTS.ts`

4. **类型定义**: `camelCase.ts` 或 `types.ts`
   - 示例: `gameTypes.ts`, `apiTypes.ts`

5. **配置文件**: `kebab-case.config.ts`
   - 示例: `tailwind.config.ts`, `vitest.config.ts`

### 目录结构规范

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   ├── error.tsx          # 错误边界
│   ├── loading.tsx        # 加载状态
│   ├── api/               # API路由（代理Edge Functions）
│   ├── lobby/             # 对战大厅
│   │   ├── page.tsx
│   │   ├── components/
│   │   └── hooks/
│   └── room/[roomId]/     # 游戏房间
│       ├── page.tsx
│       ├── components/
│       └── hooks/
├── components/            # 可复用UI组件
│   ├── ui/               # 基础UI组件
│   │   ├── Button/
│   │   │   ├── index.tsx
│   │   │   ├── Button.tsx
│   │   │   └── Button.test.tsx
│   │   ├── Card/
│   │   └── Modal/
│   ├── game/             # 游戏相关组件
│   ├── chat/             # 聊天组件
│   └── effects/          # 特效组件
├── lib/                  # 核心业务逻辑
│   ├── game/             # 游戏逻辑
│   │   ├── ai.ts         # AI逻辑
│   │   ├── rules.ts      # 游戏规则
│   │   ├── types.ts      # 类型定义
│   │   └── constants.ts  # 游戏常量
│   ├── api/              # API客户端
│   │   ├── supabase.ts   # Supabase配置
│   │   ├── rpc.ts        # RPC调用封装
│   │   └── errors.ts     # 错误处理
│   ├── hooks/            # 自定义钩子
│   │   ├── useGame.ts    # 游戏状态钩子
│   │   ├── useSound.ts   # 音效钩子
│   │   └── useToast.ts   # 通知钩子
│   ├── store/            # Zustand状态管理
│   │   ├── auth.ts       # 认证状态
│   │   ├── game.ts       # 游戏状态
│   │   ├── room.ts       # 房间状态
│   │   └── ui.ts         # UI状态
│   └── utils/            # 工具函数
│       ├── index.ts      # 工具函数汇总
│       ├── card.ts       # 卡牌工具
│       └── format.ts     # 格式化工具
└── test/                 # 测试文件
    ├── unit/             # 单元测试
    ├── integration/      # 集成测试
    └── e2e/              # E2E测试
```

### TypeScript规范

1. **严格模式**: 必须启用所有严格类型检查
2. **类型注解**: 所有函数参数和返回值必须有类型注解
3. **接口优先**: 优先使用`interface`定义对象类型
4. **类型导入**: 使用`import type`导入类型
5. **避免any**: 尽量避免使用`any`类型，使用`unknown`或具体类型

```typescript
// 正确示例
import type { Card } from '@/lib/game/types'

interface Player {
  id: string
  name: string
  score: number
}

export const calculateScore = (cards: Card[]): number => {
  // 实现逻辑
}
```

### 组件开发规范

#### 1. 组件设计原则

- **单一职责**: 每个组件只负责一个功能
- **可组合性**: 组件应该易于组合和重用
- **无副作用**: 纯UI组件不应该有副作用
- **受控组件**: 优先使用受控组件模式

#### 2. 组件结构

```tsx
// Button组件示例
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none',
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
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <LoadingSpinner className="mr-2 h-4 w-4" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
```

#### 3. Props设计规范

- **清晰的接口**: 使用TypeScript接口定义props
- **默认值**: 为可选props提供合理的默认值
- **文档注释**: 使用JSDoc注释说明props用途
- **验证**: 使用`zod`或`class-variance-authority`进行运行时验证

#### 4. 样式规范

- **Tailwind优先**: 优先使用Tailwind CSS utility classes
- **设计令牌**: 使用设计系统定义的颜色、间距等令牌
- **响应式设计**: 使用Tailwind的响应式前缀
- **暗色模式**: 支持暗色模式切换

```tsx
// 样式示例
<div className="flex flex-col md:flex-row gap-4 p-4 bg-background text-foreground">
  <div className="w-full md:w-1/2">
    {/* 内容 */}
  </div>
</div>
```

### 状态管理规范

#### 1. Zustand Store设计

- **切片模式**: 按功能模块划分store
- **选择器优化**: 使用选择器避免不必要重渲染
- **不可变性**: 保持状态不可变
- **中间件**: 使用devtools、persist等中间件

```typescript
// store示例
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface GameState {
  gameId: string | null
  status: 'deal' | 'playing' | 'finished'
  myHand: Card[]
  // 状态更新方法
  setGame: (data: Partial<GameState>) => void
  updateHand: (cards: Card[]) => void
  playTurn: (cards: Card[]) => Promise<void>
}

export const useGameStore = create<GameState>()(
  devtools(
    persist(
      (set, get) => ({
        gameId: null,
        status: 'deal',
        myHand: [],

        setGame: (data) => set((state) => ({ ...state, ...data })),
        updateHand: (cards) => set({ myHand: cards }),

        playTurn: async (cards) => {
          // 乐观更新
          set((state) => ({
            myHand: state.myHand.filter(c => !cards.some(pc => pc.id === c.id))
          }))

          // API调用
          const result = await api.submitTurn(cards)

          // 错误回滚
          if (result.error) {
            set({ myHand: get().myHand })
          }
        }
      }),
      { name: 'game-storage' }
    )
  )
)
```

#### 2. 状态选择器

```typescript
// 使用选择器避免不必要重渲染
const useGameStatus = () => useGameStore((state) => state.status)
const useMyHand = () => useGameStore((state) => state.myHand)

// 派生状态
const useHandCount = () => useGameStore((state) => state.myHand.length)
```

### 性能优化规范

#### 1. 渲染优化

- **React.memo**: 对纯展示组件使用`React.memo`
- **useMemo/useCallback**: 缓存计算和函数
- **虚拟列表**: 长列表使用虚拟滚动
- **懒加载**: 使用`React.lazy`和`Suspense`

```tsx
// 懒加载示例
const HeavyComponent = React.lazy(() => import('./HeavyComponent'))

function MyComponent() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  )
}
```

#### 2. 代码分割

- **路由级分割**: Next.js自动路由级代码分割
- **组件级分割**: 大型组件使用动态导入
- **库分割**: 第三方库按需加载

#### 3. 图片优化

- **Next.js Image**: 使用`next/image`组件
- **尺寸优化**: 提供适当尺寸的图片
- **格式选择**: 使用WebP等现代格式
- **懒加载**: 图片懒加载

### 错误处理规范

#### 1. 错误边界

```tsx
// 错误边界组件
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    // 发送错误到监控服务
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>
    }

    return this.props.children
  }
}

export default ErrorBoundary
```

#### 2. API错误处理

```typescript
// API错误处理
const handleApiError = (error: unknown) => {
  if (error instanceof SupabaseError) {
    switch (error.code) {
      case 'P0001':
        showToast('操作失败，请重试')
        break
      case '23505':
        showToast('重复操作')
        break
      default:
        showToast('系统错误')
    }
  } else {
    showToast('网络错误')
  }

  // 记录错误
  console.error('API Error:', error)
}
```

### 测试规范

#### 1. 单元测试

- **覆盖率要求**: ≥85%
- **测试文件**: 与源文件同目录，后缀`.test.ts`
- **测试框架**: Vitest + Testing Library

```typescript
// 单元测试示例
import { describe, it, expect } from 'vitest'
import { isValidCardCombination } from '@/lib/game/rules'

describe('游戏规则验证', () => {
  it('应该验证单张牌', () => {
    const cards = [{ suit: 'H', rank: 'A', val: 14 }]
    expect(isValidCardCombination(cards)).toBe(true)
  })

  it('应该验证对子', () => {
    const cards = [
      { suit: 'H', rank: 'A', val: 14 },
      { suit: 'D', rank: 'A', val: 14 }
    ]
    expect(isValidCardCombination(cards)).toBe(true)
  })
})
```

#### 2. 组件测试

```tsx
// 组件测试示例
import { render, screen, fireEvent } from '@testing-library/react'
import { Button } from '@/components/ui/Button'

describe('Button组件', () => {
  it('应该渲染按钮文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByText('点击我')).toBeInTheDocument()
  })

  it('应该处理点击事件', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>点击我</Button>)

    fireEvent.click(screen.getByText('点击我'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

#### 3. E2E测试

- **测试框架**: Playwright
- **测试场景**: 核心用户路径
- **设备覆盖**: 桌面端和移动端

```typescript
// E2E测试示例
import { test, expect } from '@playwright/test'

test('用户从首页进入游戏房间', async ({ page }) => {
  await page.goto('/')

  // 点击练习按钮
  await page.getByTestId('home-practice').click()

  // 等待进入房间
  await expect(page).toHaveURL(/\/room\/[a-f0-9-]+/)

  // 验证房间组件
  await expect(page.getByText('游戏房间')).toBeVisible()
})
```

### 可访问性规范

#### 1. ARIA属性

- **语义化HTML**: 使用正确的HTML标签
- **ARIA标签**: 为交互元素提供ARIA标签
- **键盘导航**: 支持键盘操作
- **焦点管理**: 合理的焦点顺序

#### 2. 颜色对比度

- **WCAG AA**: 文本对比度至少4.5:1
- **非文本对比度**: 至少3:1
- **焦点指示**: 清晰的焦点指示器

#### 3. 屏幕阅读器支持

- **alt文本**: 为图片提供alt文本
- **aria-live**: 动态内容使用aria-live
- **跳过链接**: 提供跳过导航的链接

### 安全规范

#### 1. XSS防护

- **React自动转义**: React默认转义HTML
- **dangerouslySetInnerHTML**: 避免使用，如必须使用则清理内容
- **URL验证**: 验证用户输入的URL

#### 2. CSRF防护

- **SameSite Cookie**: 使用SameSite属性
- **CORS配置**: 正确配置CORS
- **API安全**: 使用Supabase Auth进行认证

#### 3. 数据安全

- **敏感数据**: 不在客户端存储敏感数据
- **环境变量**: 使用环境变量存储密钥
- **HTTPS**: 生产环境强制使用HTTPS

### 开发工作流

#### 1. Git提交规范

```
类型(范围): 描述

feat: 添加新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建过程或辅助工具变动
```

#### 2. 代码审查

- **自审**: 提交前运行测试和lint
- **互审**: 至少一人审查
- **重点**: 安全性、性能、可维护性

#### 3. CI/CD

- **自动化测试**: 提交时自动运行测试
- **代码质量**: ESLint、Prettier检查
- **部署**: 自动部署到测试环境

### 性能指标

#### 1. 核心指标

- **首屏加载**: ≤2秒（3G网络）
- **交互响应**: ≤100ms
- **FPS**: ≥60fps
- **包大小**: 主包≤200KB

#### 2. 监控指标

- **Web Vitals**: LCP、FID、CLS
- **错误率**: ≤0.1%
- **API响应时间**: P95≤100ms

### 文档规范

#### 1. 代码注释

- **JSDoc**: 公共API使用JSDoc注释
- **复杂逻辑**: 复杂算法添加注释
- **TODO/FIXME**: 使用TODO/FIXME标记待办事项

#### 2. 组件文档

- **Props文档**: 所有props必须有文档
- **示例代码**: 提供使用示例
- **注意事项**: 说明使用限制和注意事项

### 工具配置

#### 1. ESLint配置

```json
{
  "extends": [
    "next/core-web-vitals",
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn"
  }
}
```

#### 2. Prettier配置

```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 总结

本规范是掼蛋3.0项目前端开发的基础标准，所有开发人员必须严格遵守。规范将根据项目发展和最佳实践持续更新。

---
**版本**: 1.0
**更新日期**: 2026-03-19
**负责人**: 前端架构师