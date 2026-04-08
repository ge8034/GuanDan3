/**
 * Spinner 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 尺寸变化
 * - 颜色变体
 * - 可访问性
 * - 动画效果
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Spinner } from './Spinner'

describe('Spinner - 基础渲染', () => {
  it('渲染Spinner组件', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toBeInTheDocument()
  })

  it('使用默认尺寸 (md)', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-6', 'w-6', 'border-3')
  })

  it('使用默认变体 (primary)', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('border-poker-table-200', 'border-t-poker-table-500')
  })
})

describe('Spinner - 尺寸变化', () => {
  it('应用 xs 尺寸', () => {
    render(<Spinner size="xs" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-4', 'w-4', 'border-2')
  })

  it('应用 sm 尺寸', () => {
    render(<Spinner size="sm" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-5', 'w-5', 'border-2')
  })

  it('应用 md 尺寸', () => {
    render(<Spinner size="md" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-6', 'w-6', 'border-3')
  })

  it('应用 lg 尺寸', () => {
    render(<Spinner size="lg" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-8', 'w-8', 'border-4')
  })

  it('应用 xl 尺寸', () => {
    render(<Spinner size="xl" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-12', 'w-12', 'border-4')
  })
})

describe('Spinner - 颜色变体', () => {
  it('应用 primary 变体', () => {
    render(<Spinner variant="primary" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('border-poker-table-200', 'border-t-poker-table-500')
  })

  it('应用 secondary 变体', () => {
    render(<Spinner variant="secondary" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('border-neutral-200', 'border-t-neutral-400')
  })

  it('应用 white 变体', () => {
    render(<Spinner variant="white" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('border-white/30', 'border-t-white')
  })

  it('应用 gold 变体', () => {
    render(<Spinner variant="gold" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('border-accent-gold/30', 'border-t-accent-gold')
  })
})

describe('Spinner - 可访问性', () => {
  it('有正确的role属性', () => {
    render(<Spinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('有正确的aria-label', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', '加载中')
  })

  it('有屏幕阅读器文本', () => {
    render(<Spinner />)
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  it('屏幕阅读器文本是隐藏的', () => {
    render(<Spinner />)
    const srText = screen.getByText('加载中...')
    expect(srText).toHaveClass('sr-only')
  })

  it('支持自定义aria-label', () => {
    render(<Spinner aria-label="正在加载" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveAttribute('aria-label', '正在加载')
  })
})

describe('Spinner - 动画效果', () => {
  it('应用旋转动画', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('animate-spin')
  })

  it('是圆形的', () => {
    render(<Spinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('rounded-full')
  })
})

describe('Spinner - 自定义类名', () => {
  it('支持自定义className', () => {
    render(<Spinner className="custom-spinner" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('custom-spinner')
  })

  it('自定义类名与默认样式共存', () => {
    render(<Spinner className="custom-class" variant="gold" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('animate-spin', 'custom-class', 'border-accent-gold/30')
  })

  it('传递其他HTML属性', () => {
    render(<Spinner data-testid="test-spinner" />)
    expect(screen.getByTestId('test-spinner')).toBeInTheDocument()
  })
})

describe('Spinner - 尺寸和变体组合', () => {
  it('正确应用xs和gold组合', () => {
    render(<Spinner size="xs" variant="gold" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-4', 'w-4', 'border-accent-gold/30')
  })

  it('正确应用xl和white组合', () => {
    render(<Spinner size="xl" variant="white" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('h-12', 'w-12', 'border-white/30')
  })
})
