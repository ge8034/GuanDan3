/**
 * Progress 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 进度值
 * - 尺寸变化
 * - 颜色变体
 * - 标签显示
 * - 不确定进度
 * - 可访问性
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './Progress'

describe('Progress - 基础渲染', () => {
  it('渲染进度条', () => {
    render(<Progress value={50} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toBeInTheDocument()
  })

  it('使用默认值0', () => {
    render(<Progress />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('使用默认尺寸 (md)', () => {
    render(<Progress value={50} />)
    const container = screen.getByRole('progressbar').parentElement
    expect(container?.querySelector('.bg-neutral-200'))?.toHaveClass('h-2')
  })
})

describe('Progress - 进度值', () => {
  it('正确设置进度值', () => {
    render(<Progress value={75} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '75')
  })

  it('值超过100时被限制为100', () => {
    render(<Progress value={150} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '100')
  })

  it('负值被限制为0', () => {
    render(<Progress value={-10} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('自定义max值', () => {
    render(<Progress value={50} max={200} />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuemax', '200')
    expect(progress).toHaveAttribute('aria-valuenow', '50')
  })
})

describe('Progress - 尺寸变化', () => {
  it('应用 sm 尺寸', () => {
    render(<Progress value={50} size="sm" />)
    const container = screen.getByRole('progressbar').parentElement
    expect(container?.querySelector('.bg-neutral-200'))?.toHaveClass('h-1')
  })

  it('应用 md 尺寸', () => {
    render(<Progress value={50} size="md" />)
    const container = screen.getByRole('progressbar').parentElement
    expect(container?.querySelector('.bg-neutral-200'))?.toHaveClass('h-2')
  })

  it('应用 lg 尺寸', () => {
    render(<Progress value={50} size="lg" />)
    const container = screen.getByRole('progressbar').parentElement
    expect(container?.querySelector('.bg-neutral-200'))?.toHaveClass('h-3')
  })
})

describe('Progress - 颜色变体', () => {
  it('应用 default 变体', () => {
    render(<Progress value={50} variant="default" />)
    const container = screen.getByRole('progressbar').parentElement
    const fill = container?.querySelector('.bg-poker-table-500')
    expect(fill).toBeInTheDocument()
  })

  it('应用 success 变体', () => {
    render(<Progress value={50} variant="success" />)
    const container = screen.getByRole('progressbar').parentElement
    const fill = container?.querySelector('.bg-success')
    expect(fill).toBeInTheDocument()
  })

  it('应用 warning 变体', () => {
    render(<Progress value={50} variant="warning" />)
    const container = screen.getByRole('progressbar').parentElement
    const fill = container?.querySelector('.bg-warning')
    expect(fill).toBeInTheDocument()
  })

  it('应用 error 变体', () => {
    render(<Progress value={50} variant="error" />)
    const container = screen.getByRole('progressbar').parentElement?.parentElement
    const fill = container?.parentElement?.querySelector('.bg-error')
    expect(fill).toBeInTheDocument()
  })
})

describe('Progress - 标签显示', () => {
  it('showLabel=false时不显示百分比', () => {
    render(<Progress value={50} showLabel={false} />)
    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('showLabel=true时显示百分比', () => {
    render(<Progress value={50} showLabel />)
    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('百分比有正确样式', () => {
    render(<Progress value={75} showLabel variant="success" />)
    const label = screen.getByText('75%')
    expect(label).toHaveClass('text-success')
  })

  it('百分比为整数', () => {
    render(<Progress value={33.33} showLabel />)
    expect(screen.getByText('33%')).toBeInTheDocument()
  })

  it('0进度显示0%', () => {
    render(<Progress value={0} showLabel />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('100进度显示100%', () => {
    render(<Progress value={100} showLabel />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})

describe('Progress - 不确定进度', () => {
  it('indeterminate=true时显示动画', () => {
    render(<Progress indeterminate />)
    const container = screen.getByRole('progressbar').parentElement
    const fill = container?.querySelector('[class*="animate-"]')
    expect(fill).toBeInTheDocument()
  })

  it('indeterminate时不显示百分比标签', () => {
    render(<Progress indeterminate showLabel />)
    expect(screen.queryByText('%')).not.toBeInTheDocument()
  })

  it('indeterminate时不设置aria-valuenow', () => {
    render(<Progress indeterminate />)
    const progress = screen.getByRole('progressbar')
    expect(progress).not.toHaveAttribute('aria-valuenow')
  })
})

describe('Progress - 可访问性', () => {
  it('有正确的role属性', () => {
    render(<Progress value={50} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })

  it('设置正确的ARIA属性', () => {
    render(<Progress value={50} max={200} showLabel />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '50')
    expect(progress).toHaveAttribute('aria-valuemax', '200')
    expect(progress).toHaveAttribute('aria-valuetext', '25%')
  })

  it('showLabel时更新aria-valuetext', () => {
    render(<Progress value={75} showLabel />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuetext', '75%')
  })
})

describe('Progress - 过渡动画', () => {
  it('进度填充应用过渡效果', () => {
    render(<Progress value={50} />)
    const container = screen.getByRole('progressbar').parentElement
    const fill = container?.querySelector('.transition-all')
    expect(fill).toHaveClass('duration-300')
  })

  it('过渡使用正确的缓动函数', () => {
    render(<Progress value={50} />)
    const container = screen.getByRole('progressbar').parentElement
    const fill = container?.querySelector('.transition-all')
    expect(fill).toHaveClass('ease-[cubic-bezier(0.16,1,0.3,1)]')
  })
})

describe('Progress - 自定义类名', () => {
  it('支持自定义className', () => {
    render(<Progress value={50} className="custom-progress" />)
    const wrapper = screen.getByRole('progressbar').parentElement
    expect(wrapper).toHaveClass('custom-progress')
  })

  it('传递其他HTML属性', () => {
    render(<Progress data-testid="test-progress" value={50} />)
    expect(screen.getByTestId('test-progress')).toBeInTheDocument()
  })
})

describe('Progress - 圆角样式', () => {
  it('进度条和填充都是圆角', () => {
    render(<Progress value={50} />)
    const container = screen.getByRole('progressbar').parentElement
    const track = container?.querySelector('.bg-neutral-200')
    const fill = container?.querySelector('.bg-poker-table-500')

    expect(track).toHaveClass('rounded-full')
    expect(fill).toHaveClass('rounded-full')
  })
})

describe('Progress - 边缘情况', () => {
  it('value为undefined时默认为0', () => {
    render(<Progress />)
    const progress = screen.getByRole('progressbar')
    expect(progress).toHaveAttribute('aria-valuenow', '0')
  })

  it('空进度显示0%', () => {
    render(<Progress value={0} showLabel />)
    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('满进度显示100%', () => {
    render(<Progress value={100} showLabel />)
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
