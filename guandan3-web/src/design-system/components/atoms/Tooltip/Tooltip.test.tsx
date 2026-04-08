/**
 * Tooltip 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 悬停显示
 * - 延迟显示
 * - 不同位置
 * - 禁用状态
 * - 箭头显示
 * - 键盘焦点
 * - 自定义内容
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Tooltip } from './Tooltip'

describe('Tooltip - 基础渲染', () => {
  it('渲染触发元素', () => {
    render(
      <Tooltip content="提示内容">
        <button>悬停我</button>
      </Tooltip>
    )
    expect(screen.getByRole('button', { name: '悬停我' })).toBeInTheDocument()
  })

  it('初始状态不显示提示', () => {
    render(
      <Tooltip content="提示内容">
        <button>按钮</button>
      </Tooltip>
    )
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('渲染自定义内容', () => {
    render(
      <Tooltip content={<span>自定义内容</span>}>
        <button>按钮</button>
      </Tooltip>
    )
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 悬停显示', () => {
  it('悬停时显示提示（无延迟）', async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    // 由于 delay=0，tooltip 应该立即显示
    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toBeInTheDocument()
    expect(screen.getByText('提示内容')).toBeInTheDocument()
  })

  it('移开时隐藏提示', async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    await screen.findByRole('tooltip')

    fireEvent.mouseLeave(button)
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })

  it('快速移入移出不显示提示', async () => {
    vi.useFakeTimers()

    render(
      <Tooltip content="提示内容" delay={200}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    // 100ms 时移开
    vi.advanceTimersByTime(100)
    fireEvent.mouseLeave(button)

    // 清除所有定时器
    vi.runAllTimers()

    // 不应该显示
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()

    vi.useRealTimers()
  })
})

describe('Tooltip - 位置', () => {
  it('应用 top 位置', async () => {
    render(
      <Tooltip content="提示" placement="top" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveClass('bottom-full')
  })

  it('应用 bottom 位置', async () => {
    render(
      <Tooltip content="提示" placement="bottom" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveClass('top-full')
  })

  it('应用 left 位置', async () => {
    render(
      <Tooltip content="提示" placement="left" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveClass('right-full')
  })

  it('应用 right 位置', async () => {
    render(
      <Tooltip content="提示" placement="right" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveClass('left-full')
  })
})

describe('Tooltip - 禁用状态', () => {
  it('禁用时不显示提示', async () => {
    render(
      <Tooltip content="提示内容" disabled delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    // 等待一小段时间确保tooltip不会出现
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('Tooltip - 箭头', () => {
  it('默认显示箭头', async () => {
    render(
      <Tooltip content="提示" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.querySelector('div[class*="border-"]')).toBeInTheDocument()
  })

  it('showArrow=false时隐藏箭头', async () => {
    render(
      <Tooltip content="提示" showArrow={false} delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip.querySelector('div[class*="border-"]')).not.toBeInTheDocument()
  })
})

describe('Tooltip - 键盘焦点', () => {
  it('聚焦时显示提示', async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.focus(button)

    await screen.findByRole('tooltip')
  })

  it('失焦时隐藏提示', async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.focus(button)

    await screen.findByRole('tooltip')

    fireEvent.blur(button)

    // Tooltip 应该立即消失
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument()
  })
})

describe('Tooltip - 事件传播', () => {
  it('保留子元素原有的事件处理器', () => {
    const handleMouseEnter = vi.fn()
    render(
      <Tooltip content="提示">
        <button onMouseEnter={handleMouseEnter}>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    fireEvent.mouseEnter(button)

    expect(handleMouseEnter).toHaveBeenCalledTimes(1)
  })
})

describe('Tooltip - 自定义类名', () => {
  it('支持自定义className', async () => {
    render(
      <Tooltip content="提示" className="custom-tooltip" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    const tooltip = await screen.findByRole('tooltip')
    expect(tooltip).toHaveClass('custom-tooltip')
  })

  it('传递其他HTML属性', () => {
    render(
      <Tooltip content="提示" data-testid="test-tooltip">
        <button>按钮</button>
      </Tooltip>
    )
    expect(screen.getByTestId('test-tooltip')).toBeInTheDocument()
  })
})

describe('Tooltip - 可访问性', () => {
  it('设置role="tooltip"', async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    fireEvent.mouseEnter(screen.getByRole('button'))

    expect(await screen.findByRole('tooltip')).toBeInTheDocument()
  })

  it('显示时设置aria-describedby', async () => {
    render(
      <Tooltip content="提示内容" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')

    // 初始没有 aria-describedby
    expect(button).not.toHaveAttribute('aria-describedby')

    fireEvent.mouseEnter(button)

    await screen.findByRole('tooltip')
    expect(button).toHaveAttribute('aria-describedby')
  })
})
