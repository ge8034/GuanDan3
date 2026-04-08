/**
 * Card 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 变体样式
 * - 内边距变化
 * - 圆角变化
 * - 交互状态（悬停、点击）
 * - 子组件
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './Card'

describe('Card - 基础渲染', () => {
  it('渲染子内容', () => {
    render(<Card>卡片内容</Card>)
    expect(screen.getByText('卡片内容')).toBeInTheDocument()
  })

  it('使用默认变体 (default)', () => {
    render(<Card>默认卡片</Card>)
    const card = screen.getByText('默认卡片')
    expect(card).toHaveClass('bg-white', 'border-neutral-200')
  })

  it('使用默认内边距 (md)', () => {
    render(<Card>默认内边距</Card>)
    const card = screen.getByText('默认内边距')
    expect(card).toHaveClass('p-6')
  })

  it('使用默认圆角 (lg)', () => {
    render(<Card>默认圆角</Card>)
    const card = screen.getByText('默认圆角')
    expect(card).toHaveClass('rounded-lg')
  })
})

describe('Card - 变体样式', () => {
  it('应用 default 变体', () => {
    render(<Card variant="default">默认</Card>)
    expect(screen.getByText('默认')).toHaveClass(
      'bg-white',
      'border',
      'shadow-sm'
    )
  })

  it('应用 elevated 变体', () => {
    render(<Card variant="elevated">提升</Card>)
    expect(screen.getByText('提升')).toHaveClass('bg-white', 'shadow-lg', 'border-0')
  })

  it('应用 outlined 变体', () => {
    render(<Card variant="outlined">轮廓</Card>)
    expect(screen.getByText('轮廓')).toHaveClass(
      'bg-transparent',
      'border-2',
      'border-neutral-300',
      'shadow-none'
    )
  })

  it('应用 flat 变体', () => {
    render(<Card variant="flat">扁平</Card>)
    expect(screen.getByText('扁平')).toHaveClass(
      'bg-neutral-50',
      'border-0',
      'shadow-none'
    )
  })
})

describe('Card - 内边距变化', () => {
  it('应用 none 内边距', () => {
    render(<Card padding="none">无内边距</Card>)
    const card = screen.getByText('无内边距')
    // 检查没有p-开头的类
    expect(card.className).not.toMatch(/p-\d/)
  })

  it('应用 sm 内边距', () => {
    render(<Card padding="sm">小内边距</Card>)
    expect(screen.getByText('小内边距')).toHaveClass('p-4')
  })

  it('应用 md 内边距', () => {
    render(<Card padding="md">中内边距</Card>)
    expect(screen.getByText('中内边距')).toHaveClass('p-6')
  })

  it('应用 lg 内边距', () => {
    render(<Card padding="lg">大内边距</Card>)
    expect(screen.getByText('大内边距')).toHaveClass('p-8')
  })
})

describe('Card - 圆角变化', () => {
  it('应用 none 圆角', () => {
    render(<Card radius="none">无圆角</Card>)
    expect(screen.getByText('无圆角')).not.toHaveClass(/rounded/)
  })

  it('应用 sm 圆角', () => {
    render(<Card radius="sm">小圆角</Card>)
    expect(screen.getByText('小圆角')).toHaveClass('rounded-sm')
  })

  it('应用 md 圆角', () => {
    render(<Card radius="md">中圆角</Card>)
    expect(screen.getByText('中圆角')).toHaveClass('rounded-md')
  })

  it('应用 lg 圆角', () => {
    render(<Card radius="lg">大圆角</Card>)
    expect(screen.getByText('大圆角')).toHaveClass('rounded-lg')
  })

  it('应用 xl 圆角', () => {
    render(<Card radius="xl">超大圆角</Card>)
    expect(screen.getByText('超大圆角')).toHaveClass('rounded-xl')
  })
})

describe('Card - 交互状态', () => {
  it('hoverable 时应用悬停样式', () => {
    render(<Card hoverable>可悬停</Card>)
    expect(screen.getByText('可悬停')).toHaveClass(
      'hover:shadow-md',
      'hover:-translate-y-0.5'
    )
  })

  it('clickable 时应用点击样式', () => {
    render(<Card clickable>可点击</Card>)
    const card = screen.getByText('可点击')
    expect(card).toHaveClass(
      'cursor-pointer',
      'hover:shadow-md',
      'active:scale-[0.98]',
      'active:shadow-sm'
    )
  })

  it('clickable 时触发点击事件', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Card clickable onClick={handleClick}>点击我</Card>)

    await user.click(screen.getByText('点击我'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('同时支持 hoverable 和 clickable', () => {
    render(
      <Card hoverable clickable>
        悬停且可点击
      </Card>
    )
    const card = screen.getByText('悬停且可点击')
    expect(card).toHaveClass('cursor-pointer', 'hover:shadow-md')
  })
})

describe('Card - 子组件', () => {
  it('渲染完整的卡片结构', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>标题</CardTitle>
          <CardDescription>描述</CardDescription>
        </CardHeader>
        <CardContent>内容</CardContent>
        <CardFooter>底部</CardFooter>
      </Card>
    )

    expect(screen.getByText('标题')).toBeInTheDocument()
    expect(screen.getByText('描述')).toBeInTheDocument()
    expect(screen.getByText('内容')).toBeInTheDocument()
    expect(screen.getByText('底部')).toBeInTheDocument()
  })

  it('CardTitle 应用正确样式', () => {
    render(<CardTitle>测试标题</CardTitle>)
    expect(screen.getByText('测试标题')).toHaveClass(
      'text-lg',
      'font-semibold',
      'leading-none'
    )
  })

  it('CardDescription 应用正确样式', () => {
    render(<CardDescription>测试描述</CardDescription>)
    expect(screen.getByText('测试描述')).toHaveClass(
      'text-sm',
      'text-neutral-600'
    )
  })

  it('CardHeader 应用 flex 布局', () => {
    render(
      <CardHeader>
        <CardTitle>标题</CardTitle>
      </CardHeader>
    )
    const header = screen.getByText('标题').parentElement
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5')
  })

  it('CardContent 移除顶部内边距', () => {
    render(<CardContent>内容</CardContent>)
    expect(screen.getByText('内容')).toHaveClass('pt-0')
  })

  it('CardFooter 应用 flex 布局和顶部内边距', () => {
    render(<CardFooter>底部</CardFooter>)
    expect(screen.getByText('底部')).toHaveClass('flex', 'items-center', 'pt-4')
  })
})

describe('Card - 可访问性', () => {
  it('传递自定义ARIA属性', () => {
    render(<Card role="article">可访问卡片</Card>)
    expect(screen.getByRole('article')).toBeInTheDocument()
  })

  it('传递自定义data属性', () => {
    render(<Card data-testid="custom-card">测试卡片</Card>)
    expect(screen.getByTestId('custom-card')).toBeInTheDocument()
  })

  it('clickable 卡片有正确的键盘交互', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(
      <Card clickable onClick={handleClick} tabIndex={0}>
        可键盘聚焦
      </Card>
    )

    const card = screen.getByText('可键盘聚焦')
    await user.click(card)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('Card - 过渡效果', () => {
  it('应用正确的过渡时长和缓动函数', () => {
    render(<Card>过渡测试</Card>)
    const card = screen.getByText('过渡测试')
    expect(card).toHaveClass(
      'transition-all',
      'duration-200',
      'ease-[cubic-bezier(0.16,1,0.3,1)]'
    )
  })
})

describe('Card - 自定义类名', () => {
  it('支持自定义className', () => {
    render(<Card className="custom-class">自定义</Card>)
    expect(screen.getByText('自定义')).toHaveClass('custom-class')
  })

  it('自定义类名与默认样式共存', () => {
    render(
      <Card variant="elevated" className="bg-red-500">
        混合样式
      </Card>
    )
    const card = screen.getByText('混合样式')
    expect(card).toHaveClass('shadow-lg', 'bg-red-500')
  })
})
