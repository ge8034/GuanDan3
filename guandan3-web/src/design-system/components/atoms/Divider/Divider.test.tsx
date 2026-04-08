/**
 * Divider 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 方向
 * - 虚线样式
 * - 文本标签
 * - 可访问性
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Divider } from './Divider'

describe('Divider - 基础渲染', () => {
  it('渲染分隔线', () => {
    render(<Divider />)
    const divider = screen.getByRole('separator')
    expect(divider).toBeInTheDocument()
  })

  it('使用默认方向 (horizontal)', () => {
    render(<Divider />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveClass('border-t', 'w-full')
  })

  it('使用默认实线样式', () => {
    render(<Divider />)
    const divider = screen.getByRole('separator')
    expect(divider).not.toHaveClass('border-dashed')
  })
})

describe('Divider - 方向', () => {
  it('应用 horizontal 方向', () => {
    render(<Divider orientation="horizontal" />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveClass('border-t')
  })

  it('应用 vertical 方向', () => {
    render(<Divider orientation="vertical" />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveClass('border-l')
  })
})

describe('Divider - 虚线样式', () => {
  it('应用虚线样式', () => {
    render(<Divider dashed />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveClass('border-dashed')
  })

  it('默认不应用虚线', () => {
    render(<Divider />)
    const divider = screen.getByRole('separator')
    expect(divider).not.toHaveClass('border-dashed')
  })
})

describe('Divider - 文本标签', () => {
  it('显示文本标签', () => {
    render(<Divider label="或" />)
    expect(screen.getByText('或')).toBeInTheDocument()
  })

  it('带标签时渲染两条分隔线', () => {
    render(<Divider label="标签" />)
    const dividers = screen.getAllByRole('separator')
    expect(dividers).toHaveLength(2)
  })

  it('标签文本有正确样式', () => {
    render(<Divider label="测试标签" />)
    const label = screen.getByText('测试标签')
    expect(label).toHaveClass('text-sm', 'text-neutral-600', 'font-medium')
  })
})

describe('Divider - 可访问性', () => {
  it('有正确的role属性', () => {
    render(<Divider />)
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('horizontal时有正确的aria-orientation', () => {
    render(<Divider orientation="horizontal" />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveAttribute('aria-orientation', 'horizontal')
  })

  it('vertical时有正确的aria-orientation', () => {
    render(<Divider orientation="vertical" />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveAttribute('aria-orientation', 'vertical')
  })
})

describe('Divider - 自定义类名', () => {
  it('支持自定义className', () => {
    render(<Divider className="custom-divider" />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveClass('custom-divider')
  })

  it('传递其他HTML属性', () => {
    render(<Divider data-testid="test-divider" />)
    expect(screen.getByTestId('test-divider')).toBeInTheDocument()
  })
})

describe('Divider - 组合测试', () => {
  it('vertical虚线分隔线', () => {
    render(<Divider orientation="vertical" dashed />)
    const divider = screen.getByRole('separator')
    expect(divider).toHaveClass('border-l', 'border-dashed')
  })

  it('horizontal虚线带标签', () => {
    render(<Divider label="分隔" dashed />)
    expect(screen.getByText('分隔')).toBeInTheDocument()
    const dividers = screen.getAllByRole('separator')
    dividers.forEach(d => expect(d).toHaveClass('border-dashed'))
  })
})
