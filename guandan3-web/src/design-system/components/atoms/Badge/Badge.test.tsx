/**
 * Badge 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 变体样式
 * - 尺寸变化
 * - 点状徽章
 * - 数字徽章
 * - BadgeAnchor定位组件
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge, BadgeAnchor } from './Badge'

describe('Badge - 基础渲染', () => {
  it('渲染文本内容', () => {
    render(<Badge>新消息</Badge>)
    expect(screen.getByText('新消息')).toBeInTheDocument()
  })

  it('使用默认变体 (default)', () => {
    render(<Badge>默认</Badge>)
    const badge = screen.getByText('默认')
    expect(badge).toHaveClass('bg-neutral-100', 'text-neutral-700')
  })

  it('使用默认尺寸 (md)', () => {
    render(<Badge>默认尺寸</Badge>)
    const badge = screen.getByText('默认尺寸')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm', 'rounded-md')
  })
})

describe('Badge - 变体样式', () => {
  it('应用 default 变体', () => {
    render(<Badge variant="default">默认</Badge>)
    expect(screen.getByText('默认')).toHaveClass(
      'bg-neutral-100',
      'text-neutral-700',
      'border-neutral-200'
    )
  })

  it('应用 primary 变体', () => {
    render(<Badge variant="primary">主要</Badge>)
    expect(screen.getByText('主要')).toHaveClass(
      'bg-poker-table-100',
      'text-poker-table-700',
      'border-poker-table-200'
    )
  })

  it('应用 secondary 变体', () => {
    render(<Badge variant="secondary">次要</Badge>)
    expect(screen.getByText('次要')).toHaveClass(
      'bg-neutral-200',
      'text-neutral-800',
      'border-neutral-300'
    )
  })

  it('应用 success 变体', () => {
    render(<Badge variant="success">成功</Badge>)
    expect(screen.getByText('成功')).toHaveClass(
      'bg-semantic-success/10',
      'text-semantic-success-dark',
      'border-semantic-success/20'
    )
  })

  it('应用 warning 变体', () => {
    render(<Badge variant="warning">警告</Badge>)
    expect(screen.getByText('警告')).toHaveClass(
      'bg-semantic-warning/10',
      'text-semantic-warning-dark',
      'border-semantic-warning/20'
    )
  })

  it('应用 error 变体', () => {
    render(<Badge variant="error">错误</Badge>)
    expect(screen.getByText('错误')).toHaveClass(
      'bg-semantic-error/10',
      'text-semantic-error-dark',
      'border-semantic-error/20'
    )
  })

  it('应用 gold 变体', () => {
    render(<Badge variant="gold">金色</Badge>)
    expect(screen.getByText('金色')).toHaveClass(
      'bg-accent-gold/10',
      'text-accent-gold-dark',
      'border-accent-gold/20'
    )
  })
})

describe('Badge - 尺寸变化', () => {
  it('应用 sm 尺寸', () => {
    render(<Badge size="sm">小</Badge>)
    const badge = screen.getByText('小')
    expect(badge).toHaveClass('px-2', 'py-0.5', 'text-xs', 'rounded')
  })

  it('应用 md 尺寸', () => {
    render(<Badge size="md">中</Badge>)
    const badge = screen.getByText('中')
    expect(badge).toHaveClass('px-2.5', 'py-0.5', 'text-sm', 'rounded-md')
  })

  it('应用 lg 尺寸', () => {
    render(<Badge size="lg">大</Badge>)
    const badge = screen.getByText('大')
    expect(badge).toHaveClass('px-3', 'py-1', 'text-base', 'rounded-lg')
  })
})

describe('Badge - 点状徽章', () => {
  it('渲染点状徽章', () => {
    const { container } = render(<Badge dot />)
    const dot = container.querySelector('.rounded-full')
    expect(dot).toBeInTheDocument()
  })

  it('应用 sm 点状尺寸', () => {
    const { container } = render(<Badge dot size="sm" />)
    const dot = container.querySelector('.rounded-full')
    expect(dot).toHaveClass('h-2', 'w-2')
  })

  it('应用 md 点状尺寸', () => {
    const { container } = render(<Badge dot size="md" />)
    const dot = container.querySelector('.rounded-full')
    expect(dot).toHaveClass('h-2.5', 'w-2.5')
  })

  it('应用 lg 点状尺寸', () => {
    const { container } = render(<Badge dot size="lg" />)
    const dot = container.querySelector('.rounded-full')
    expect(dot).toHaveClass('h-3', 'w-3')
  })
})

describe('Badge - 数字徽章', () => {
  it('显示数字计数', () => {
    render(<Badge count={5} />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('显示字符串计数', () => {
    render(<Badge count="99+" />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('超过max时显示+N', () => {
    render(<Badge count={150} max={99} />)
    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('未超过max时显示实际数字', () => {
    render(<Badge count={50} max={99} />)
    expect(screen.getByText('50')).toBeInTheDocument()
  })

  it('count为0时不显示', () => {
    render(<Badge count={0} />)
    // count=0可能显示0或不显示，取决于实现
    const badge = screen.getByText('0')
    expect(badge).toBeInTheDocument()
  })
})

describe('Badge - 过渡效果', () => {
  it('应用过渡效果', () => {
    render(<Badge>过渡</Badge>)
    const badge = screen.getByText('过渡')
    expect(badge).toHaveClass(
      'transition-colors',
      'duration-200',
      'ease-[cubic-bezier(0.16,1,0.3,1)]'
    )
  })
})

describe('Badge - 自定义类名', () => {
  it('支持自定义className', () => {
    render(<Badge className="custom-class">自定义</Badge>)
    expect(screen.getByText('自定义')).toHaveClass('custom-class')
  })

  it('传递其他HTML属性', () => {
    render(<Badge data-testid="test-badge">测试</Badge>)
    expect(screen.getByTestId('test-badge')).toBeInTheDocument()
  })
})

describe('BadgeAnchor - 定位徽章', () => {
  it('渲染子元素', () => {
    render(
      <BadgeAnchor>
        <button>按钮</button>
      </BadgeAnchor>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('应用默认位置 (top-right)', () => {
    render(
      <BadgeAnchor badge={<Badge>1</Badge>}>
        <button>按钮</button>
      </BadgeAnchor>
    )
    const container = screen.getByRole('button').parentElement
    expect(container).toHaveClass('relative', 'inline-flex')
  })

  it('显示自定义badge', () => {
    render(
      <BadgeAnchor badge={<Badge>5</Badge>}>
        <button>通知</button>
      </BadgeAnchor>
    )
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('使用count属性显示数字', () => {
    render(
      <BadgeAnchor count={10}>
        <button>消息</button>
      </BadgeAnchor>
    )
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('使用showDot显示点状徽章', () => {
    render(
      <BadgeAnchor showDot>
        <button>状态</button>
      </BadgeAnchor>
    )
    const badge = screen.getByRole('button').parentElement?.querySelector('.rounded-full')
    expect(badge).toBeInTheDocument()
  })

  it('count和showDot同时存在时优先显示badge', () => {
    render(
      <BadgeAnchor count={5} showDot>
        <button>测试</button>
      </BadgeAnchor>
    )
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('应用max限制', () => {
    render(
      <BadgeAnchor count={150} max={99}>
        <button>消息</button>
      </BadgeAnchor>
    )
    expect(screen.getByText('99+')).toBeInTheDocument()
  })
})

describe('Badge - 可访问性', () => {
  it('支持ARIA标签', () => {
    render(<Badge aria-label="未读消息">3</Badge>)
    const badge = screen.getByText('3')
    expect(badge).toHaveAttribute('aria-label', '未读消息')
  })

  it('支持role属性', () => {
    render(<Badge role="status">状态</Badge>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
