# 掼蛋3 UI开发标准规范

## 概述

本文档定义了掼蛋3项目的UI开发标准，确保所有开发人员遵循一致的设计和实现规范。标准基于现有的设计系统（富春山居图主题）和设计标记，涵盖组件设计、代码实现、可访问性、性能优化等方面。

## 1. 设计系统基础

### 1.1 设计标记使用

所有UI开发必须使用设计标记文件（`src/lib/design-tokens.ts`）中定义的值：

```typescript
import { colors, typography, spacing, borderRadius, shadows, animation } from '@/lib/design-tokens'

// 正确使用
const primaryColor = colors.primary[500] // #6BA539
const fontSize = typography.fontSize.base // 1rem
const padding = spacing[4] // 1rem
```

**禁止**在代码中硬编码颜色、尺寸、间距等值。

### 1.2 主题一致性

项目采用富春山居图主题，具有以下特点：
- **青绿山水基调**：以中国传统山水画为灵感
- **水墨意境**：低饱和度色彩，淡雅风格
- **现代简约**：结合现代UI设计原则

所有组件必须遵循此主题风格。

## 2. 组件设计规范

### 2.1 组件分类

#### 基础UI组件
- Button（按钮）
- Input（输入框）
- Card（卡片）
- Modal（模态框）
- Toast（提示）
- Avatar（头像）
- Badge（徽章）
- Select（选择器）

#### 游戏专用组件
- PlayingCard（扑克牌）
- GameTable（游戏桌）
- HandArea（手牌区）
- PlayerSeat（玩家座位）

#### 特效组件
- RippleEffect（水波纹效果）
- AnimatedCard（动画卡片）
- ParticleEffect（粒子效果）

### 2.2 组件状态规范

所有交互组件必须实现以下状态：

#### 按钮状态
```typescript
interface ButtonStates {
  default: '标准显示'
  hover: '背景色加深，轻微阴影'
  focus: '2px焦点环，外发光效果'
  active: '背景色进一步加深，轻微位移'
  disabled: '50%透明度，禁用交互'
  loading: '显示加载动画'
}
```

#### 输入框状态
```typescript
interface InputStates {
  default: '灰色边框'
  focus: '蓝色边框，外发光效果'
  error: '红色边框，错误提示'
  disabled: '灰色背景，降低透明度'
}
```

#### 卡片状态
```typescript
interface CardStates {
  default: '基础阴影'
  hover: '阴影加深，轻微上浮'
  clickable: '添加水波纹效果'
}
```

### 2.3 组件尺寸规范

#### 按钮尺寸
| 尺寸 | 内边距 | 字体大小 | 圆角 | 使用场景 |
|------|--------|----------|------|----------|
| sm | 12px 6px | 14px | 8px | 紧凑空间、表格操作 |
| md | 8px 16px | 16px | 10px | 标准按钮（默认） |
| lg | 12px 24px | 18px | 12px | 主要操作、CTA按钮 |

#### 输入框尺寸
| 尺寸 | 内边距 | 字体大小 | 圆角 | 使用场景 |
|------|--------|----------|------|----------|
| sm | 6px 12px | 14px | 8px | 紧凑表单 |
| md | 8px 16px | 16px | 10px | 标准输入框（默认） |
| lg | 12px 24px | 18px | 12px | 搜索框、大输入框 |

#### 卡片尺寸
| 尺寸 | 内边距 | 圆角 | 使用场景 |
|------|--------|------|----------|
| sm | 16px | 8px | 紧凑卡片、列表项 |
| md | 24px | 10px | 标准卡片（默认） |
| lg | 32px | 12px | 详情卡片、大内容卡片 |

### 2.4 组件变体规范

#### 按钮变体
```typescript
type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'

const buttonVariants: Record<ButtonVariant, ButtonStyle> = {
  primary: {
    background: colors.primary[500], // #6BA539
    text: colors.neutral[50], // #FAFAF8
    border: 'none'
  },
  secondary: {
    background: colors.secondary[500], // #A8C8A8
    text: colors.neutral[900], // #1A1A1A
    border: 'none'
  },
  outline: {
    background: 'transparent',
    text: colors.primary[500], // #6BA539
    border: `2px solid ${colors.primary[500]}`
  },
  ghost: {
    background: 'transparent',
    text: colors.primary[500], // #6BA539
    border: 'none'
  },
  danger: {
    background: colors.error[500], // #EF4444
    text: colors.neutral[50], // #FAFAF8
    border: 'none'
  }
}
```

## 3. 代码实现标准

### 3.1 文件结构规范

#### 组件目录结构
```
src/components/
├── ui/                    # 基础UI组件
│   ├── Button/
│   │   ├── index.tsx     # 组件主文件
│   │   ├── Button.tsx    # 组件实现
│   │   ├── Button.test.tsx # 测试文件
│   │   ├── Button.stories.tsx # Storybook故事
│   │   └── types.ts      # 类型定义
│   ├── Input/
│   └── Card/
├── game/                  # 游戏专用组件
│   ├── PlayingCard/
│   └── GameTable/
├── effects/               # 特效组件
│   ├── RippleEffect/
│   └── ParticleEffect/
└── index.ts              # 组件导出
```

### 3.2 组件实现规范

#### 类型定义优先
```typescript
// 在组件文件顶部定义类型
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

// 使用TypeScript类型注解
const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  // 组件实现
}
```

#### 样式实现规范
```typescript
// 使用设计标记
const buttonStyles = {
  padding: spacing[4],
  fontSize: typography.fontSize.base,
  borderRadius: borderRadius.md,
  backgroundColor: colors.primary[500],
  color: colors.neutral[50],
}

// 使用Tailwind CSS类名（优先）
const buttonClasses = clsx(
  'px-4 py-2 rounded-md transition-all duration-300',
  'bg-primary-500 text-neutral-50',
  'hover:bg-primary-600 focus:ring-2 focus:ring-primary-500',
  'disabled:opacity-50 disabled:cursor-not-allowed',
  fullWidth && 'w-full',
  className
)
```

#### 可访问性实现
```typescript
// 所有交互元素必须有适当的ARIA属性
<button
  aria-label={isLoading ? '加载中' : ariaLabel}
  aria-busy={isLoading}
  disabled={disabled || isLoading}
  className={buttonClasses}
  {...props}
>
  {isLoading ? (
    <span className="sr-only">加载中</span>
  ) : (
    <>
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </>
  )}
</button>
```

### 3.3 状态管理规范

#### 使用Zustand状态切片
```typescript
// store/ui.ts
import { create } from 'zustand'

interface UIState {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  notifications: Notification[]

  // Actions
  setTheme: (theme: UIState['theme']) => void
  toggleSidebar: () => void
  addNotification: (notification: Notification) => void
  removeNotification: (id: string) => void
}

export const useUIStore = create<UIState>((set) => ({
  theme: 'light',
  sidebarOpen: false,
  notifications: [],

  setTheme: (theme) => set({ theme }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  addNotification: (notification) =>
    set((state) => ({ notifications: [...state.notifications, notification] })),
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    })),
}))
```

#### 使用选择器优化性能
```typescript
// 避免不必要的重渲染
export const useSidebarOpen = () =>
  useUIStore((state) => state.sidebarOpen)

export const useTheme = () =>
  useUIStore((state) => state.theme)
```

## 4. 可访问性标准

### 4.1 WCAG 2.1 AA合规性

#### 对比度要求
- **正常文本**：对比度 ≥ 4.5:1
- **大文本（18px+或14px+粗体）**：对比度 ≥ 3:1
- **UI组件**：对比度 ≥ 3:1

#### 颜色使用检查
```typescript
// 使用设计标记中的颜色，已确保对比度合规
const compliantColors = {
  primaryText: colors.neutral[900], // 对比度 9.8:1 ✓
  secondaryText: colors.neutral[700], // 对比度 4.5:1 ✓
  errorText: colors.error[600], // 对比度 5.5:1 ✓
}
```

### 4.2 键盘导航

#### 所有交互元素必须支持
- **Tab键导航**：逻辑的Tab顺序
- **Enter/Space键激活**：按钮、链接等
- **箭头键导航**：下拉菜单、列表等
- **Escape键关闭**：模态框、弹出框等

#### 焦点管理
```typescript
// 清晰的焦点指示器
const focusStyles = {
  outline: '2px solid',
  outlineColor: colors.primary[500],
  outlineOffset: '2px',
}

// 模态框焦点陷阱
const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (isOpen && modalRef.current) {
      // 保存当前焦点元素
      const previousActiveElement = document.activeElement as HTMLElement

      // 将焦点移到模态框
      modalRef.current.focus()

      // 设置焦点陷阱
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          const focusableElements = modalRef.current?.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )

          if (focusableElements && focusableElements.length > 0) {
            const firstElement = focusableElements[0] as HTMLElement
            const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement

            if (e.shiftKey && document.activeElement === firstElement) {
              lastElement.focus()
              e.preventDefault()
            } else if (!e.shiftKey && document.activeElement === lastElement) {
              firstElement.focus()
              e.preventDefault()
            }
          }
        }
      }

      document.addEventListener('keydown', handleTabKey)

      return () => {
        document.removeEventListener('keydown', handleTabKey)
        // 恢复焦点
        previousActiveElement?.focus()
      }
    }
  }, [isOpen])

  return isOpen ? (
    <div ref={modalRef} tabIndex={-1} role="dialog" aria-modal="true">
      {children}
    </div>
  ) : null
}
```

### 4.3 屏幕阅读器支持

#### ARIA属性规范
```typescript
// 图标必须有aria-label
<button aria-label="搜索">
  <SearchIcon />
</button>

// 表单元素必须关联label
<>
  <label htmlFor="username" id="username-label">用户名</label>
  <input id="username" aria-labelledby="username-label" />
</>

// 状态变化通知
<div aria-live="polite" aria-atomic="true">
  {notification && <span>{notification}</span>}
</div>
```

#### 隐藏内容处理
```typescript
// 视觉隐藏，屏幕阅读器可读
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

// 使用示例
<button>
  <TrashIcon />
  <span className="sr-only">删除</span>
</button>
```

## 5. 响应式设计标准

### 5.1 断点系统

使用Tailwind CSS默认断点：
```css
/* tailwind.config.ts */
screens: {
  'sm': '640px',   // 手机横屏
  'md': '768px',   // 平板竖屏
  'lg': '1024px',  // 平板横屏、小型笔记本
  'xl': '1280px',  // 桌面显示器
  '2xl': '1536px', // 大型显示器
  '3xl': '1920px', // 1080P全屏
  '4xl': '2560px', // 2K/4K显示器
}
```

### 5.2 移动优先策略

#### 样式编写顺序
```typescript
// 移动端样式（默认）
const baseStyles = 'flex flex-col p-4'

// 平板端增强
const tabletStyles = 'md:flex-row md:p-6'

// 桌面端增强
const desktopStyles = 'lg:p-8 xl:max-w-6xl'

// 组合使用
const containerClasses = `${baseStyles} ${tabletStyles} ${desktopStyles}`
```

#### 组件响应式设计
```typescript
const ResponsiveCard: React.FC = () => {
  return (
    <div className="
      /* 移动端：垂直布局 */
      flex flex-col gap-4 p-4

      /* 平板端：水平布局 */
      md:flex-row md:gap-6 md:p-6

      /* 桌面端：更大间距 */
      lg:gap-8 lg:p-8
    ">
      <div className="
        /* 移动端：全宽 */
        w-full
        /* 平板端：固定宽度 */
        md:w-1/3
      ">
        {/* 图片区域 */}
      </div>
      <div className="
        /* 移动端：全宽 */
        w-full
        /* 平板端：弹性宽度 */
        md:flex-1
      ">
        {/* 内容区域 */}
      </div>
    </div>
  )
}
```

### 5.3 触控优化

#### 触控目标尺寸
- **最小触控目标**：44×44px（iOS标准）
- **按钮内边距**：至少12px
- **链接间距**：至少8px

#### 触控反馈
```typescript
// 使用水波纹效果
<RippleEffect>
  <button className="
    active:scale-95          /* 按压缩放 */
    transition-transform     /* 平滑过渡 */
    duration-200             /* 适当时长 */
  ">
    点击我
  </button>
</RippleEffect>
```

## 6. 性能优化指南

### 6.1 渲染性能

#### 组件优化
```typescript
// 使用React.memo避免不必要的重渲染
const MemoizedButton = React.memo(Button)

// 使用useCallback缓存回调函数
const handleClick = useCallback(() => {
  // 处理点击
}, [dependencies])

// 使用useMemo缓存计算结果
const processedData = useMemo(() => {
  return data.map(item => transform(item))
}, [data])
```

#### 虚拟滚动
```typescript
// 长列表使用虚拟滚动
import { FixedSizeList as List } from 'react-window'

const VirtualList: React.FC<{ items: Item[] }> = ({ items }) => {
  const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => (
    <div style={style}>
      {items[index].name}
    </div>
  )

  return (
    <List
      height={400}
      itemCount={items.length}
      itemSize={50}
      width="100%"
    >
      {Row}
    </List>
  )
}
```

### 6.2 资源优化

#### 图片优化
```typescript
// 使用Next.js Image组件
import Image from 'next/image'

<Image
  src="/path/to/image.jpg"
  alt="描述文字"
  width={500}
  height={300}
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  priority={false} // 仅首屏图片设为true
/>
```

#### 代码分割
```typescript
// 动态导入重型组件
import dynamic from 'next/dynamic'

const HeavyComponent = dynamic(
  () => import('@/components/HeavyComponent'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false, // 如果需要
  }
)
```

#### 字体优化
```typescript
// 使用next/font优化字体加载
import { Noto_Serif_SC } from 'next/font/google'

const notoSerifSC = Noto_Serif_SC({
  subsets: ['latin', 'chinese-simplified'],
  weight: ['400', '600', '700'],
  display: 'swap',
})

// 在组件中使用
<div className={notoSerifSC.className}>
  {/* 内容 */}
</div>
```

### 6.3 动画性能

#### 使用CSS硬件加速
```css
/* 优先使用transform和opacity */
.animate-card {
  transform: translateX(100px);
  opacity: 0;
  transition: transform 300ms ease-out, opacity 300ms ease-out;
}

.animate-card.visible {
  transform: translateX(0);
  opacity: 1;
}

/* 启用GPU加速 */
.gpu-accelerated {
  transform: translateZ(0);
  will-change: transform;
}
```

#### 限制动画数量
```typescript
// 避免同时运行过多动画
const AnimatedList: React.FC<{ items: Item[] }> = ({ items }) => {
  return (
    <StaggerContainer staggerDelay={50}>
      {items.map((item, index) => (
        <FadeIn key={item.id} delay={index * 50}>
          <ListItem item={item} />
        </FadeIn>
      ))}
    </StaggerContainer>
  )
}
```

## 7. 测试标准

### 7.1 组件测试

#### 单元测试要求
```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react'
import Button from './Button'

describe('Button', () => {
  test('渲染正确文本', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByText('点击我')).toBeInTheDocument()
  })

  test('点击触发回调', () => {
    const handleClick = jest.fn()
    render(<Button onClick={handleClick}>点击我</Button>)

    fireEvent.click(screen.getByText('点击我'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  test('禁用状态不触发回调', () => {
    const handleClick = jest.fn()
    render(<Button disabled onClick={handleClick}>点击我</Button>)

    fireEvent.click(screen.getByText('点击我'))
    expect(handleClick).not.toHaveBeenCalled()
  })
})
```

#### 可访问性测试
```typescript
import { axe } from 'jest-axe'

test('组件符合可访问性标准', async () => {
  const { container } = render(<Button>测试按钮</Button>)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

### 7.2 视觉测试

#### Storybook故事
```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react'
import Button from './Button'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Button>

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按钮',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
}

export const Loading: Story = {
  args: {
    isLoading: true,
    children: '加载中',
  },
}
```

## 8. 代码审查清单

### 8.1 设计一致性检查
- [ ] 使用设计标记中的颜色、间距、圆角
- [ ] 遵循组件尺寸规范
- [ ] 实现所有必要的组件状态
- [ ] 保持主题风格一致性

### 8.2 可访问性检查
- [ ] 对比度符合WCAG 2.1 AA标准
- [ ] 支持键盘导航
- [ ] 提供适当的ARIA属性
- [ ] 屏幕阅读器友好

### 8.3 性能检查
- [ ] 避免不必要的重渲染
- [ ] 使用代码分割优化加载
- [ ] 图片优化处理
- [ ] 动画性能优化

### 8.4 代码质量检查
- [ ] TypeScript类型定义完整
- [ ] 错误处理完善
- [ ] 测试覆盖率达标
- [ ] 代码注释清晰

## 9. 实施路线图

### 阶段1：基础组件标准化（当前）
- [ ] 完善Button组件规范
- [ ] 完善Input组件规范
- [ ] 完善Card组件规范
- [ ] 创建组件文档

### 阶段2：游戏组件标准化
- [ ] 标准化PlayingCard组件
- [ ] 标准化GameTable组件
- [ ] 标准化PlayerSeat组件
- [ ] 创建游戏组件文档

### 阶段3：主题系统完善
- [ ] 实现深色主题
- [ ] 完善主题切换功能
- [ ] 创建主题定制指南

### 阶段4：性能优化
- [ ] 实施代码分割策略
- [ ] 优化图片资源
- [ ] 实施虚拟滚动
- [ ] 性能监控集成

## 10. 参考资料

1. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 设计系统文档
2. [DESIGN_TOKENS.md](./DESIGN_TOKENS.md) - 设计标记文档
3. [src/lib/design-tokens.ts](../src/lib/design-tokens.ts) - 设计标记实现
4. [Tailwind CSS文档](https://tailwindcss.com/docs) - 样式框架
5. [WCAG 2.1指南](https://www.w3.org/WAI/WCAG21/quickref/) - 可访问性标准
6. [React性能优化](https://react.dev/learn/render-and-commit) - React官方文档

---

**版本历史**
| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-19 | 初始版本，制定UI开发标准规范 |

**维护者**
UI/UX设计团队 - 负责设计系统维护和标准制定

**更新频率**
- 每月审查一次标准
- 根据项目需求及时更新
- 重大变更需团队评审通过