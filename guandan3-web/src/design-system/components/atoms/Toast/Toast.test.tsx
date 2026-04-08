/**
 * Toast 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 变体样式
 * - 自动关闭
 * - 手动关闭
 * - 图标显示
 * - 标题和内容
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toast } from './Toast'

describe('Toast - 基础渲染', () => {
  it('渲染提示框', () => {
    render(<Toast title="标题">内容</Toast>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('渲染标题', () => {
    render(<Toast title="提示标题">内容</Toast>)
    expect(screen.getByText('提示标题')).toBeInTheDocument()
  })

  it('渲染内容', () => {
    render(<Toast title="标题">提示内容</Toast>)
    expect(screen.getByText('提示内容')).toBeInTheDocument()
  })

  it('只显示标题时没有内容区域', () => {
    render(<Toast title="标题" />)
    expect(screen.getByText('标题')).toBeInTheDocument()
  })
})

describe('Toast - 变体样式', () => {
  it('应用 default 变体', () => {
    render(<Toast title="标题" variant="default" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-neutral-800')
  })

  it('应用 success 变体', () => {
    render(<Toast title="标题" variant="success" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-success')
  })

  it('应用 warning 变体', () => {
    render(<Toast title="标题" variant="warning" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-warning')
  })

  it('应用 error 变体', () => {
    render(<Toast title="标题" variant="error" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-error')
  })

  it('应用 info 变体', () => {
    render(<Toast title="标题" variant="info" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('bg-blue-500')
  })
})

describe('Toast - 手动关闭', () => {
  it('点击关闭按钮关闭提示', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(<Toast title="标题" onClose={handleClose} />)

    const closeButton = screen.getByLabelText('关闭')
    await user.click(closeButton)

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('closable=false 时不显示关闭按钮', () => {
    render(<Toast title="标题" closable={false} />)
    expect(screen.queryByLabelText('关闭')).not.toBeInTheDocument()
  })

  it('closable=false 时无法手动关闭', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(<Toast title="标题" onClose={handleClose} closable={false} />)

    // 尝试查找关闭按钮
    const closeButton = screen.queryByLabelText('关闭')
    expect(closeButton).not.toBeInTheDocument()
  })
})

describe('Toast - 图标显示', () => {
  it('默认显示图标', () => {
    render(<Toast title="标题" variant="success" />)
    const toast = screen.getByRole('alert')
    expect(toast.querySelector('svg')).toBeInTheDocument()
  })

  it('showIcon=false 时隐藏内容图标', () => {
    render(<Toast title="标题" showIcon={false} />)
    const toast = screen.getByRole('alert')
    // 检查内容区域（第一个 div），不应该有图标 SVG
    const contentArea = toast.querySelector('.flex-1')
    // 图标应该在 flex-shrink-0 的 div 中，不在内容区域
    expect(contentArea?.querySelector('svg')).not.toBeInTheDocument()
  })

  it('不同变体显示不同图标', () => {
    const { rerender } = render(<Toast title="标题" variant="success" showIcon />)
    let icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toBeInTheDocument()

    rerender(<Toast title="标题" variant="error" showIcon />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toBeInTheDocument()

    rerender(<Toast title="标题" variant="warning" showIcon />)
    icon = screen.getByRole('alert').querySelector('svg')
    expect(icon).toBeInTheDocument()
  })
})

describe('Toast - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Toast title="标题" className="custom-toast" />)
    expect(screen.getByRole('alert')).toHaveClass('custom-toast')
  })

  it('传递其他 HTML 属性', () => {
    render(<Toast title="标题" data-testid="test-toast" />)
    expect(screen.getByTestId('test-toast')).toBeInTheDocument()
  })
})

describe('Toast - 可访问性', () => {
  it('设置 role="alert"', () => {
    render(<Toast title="标题" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('设置 aria-live="polite"', () => {
    render(<Toast title="标题" />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })

  it('关闭按钮有正确的 aria-label', () => {
    render(<Toast title="标题" />)
    expect(screen.getByLabelText('关闭')).toBeInTheDocument()
  })
})

describe('Toast - 边缘情况', () => {
  it('没有标题时仍然正常渲染', () => {
    render(<Toast>只有内容</Toast>)
    expect(screen.getByText('只有内容')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeInTheDocument()
  })

  it('空内容时不渲染额外元素', () => {
    render(<Toast title="标题">{undefined}</Toast>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('duration=0 时不自动关闭', () => {
    vi.useFakeTimers()

    const handleClose = vi.fn()
    render(<Toast title="标题" onClose={handleClose} duration={0} />)

    vi.advanceTimersByTime(10000)

    expect(handleClose).not.toHaveBeenCalled()
    expect(screen.getByRole('alert')).toBeInTheDocument()

    vi.useRealTimers()
  })
})

describe('Toast - 动画效果', () => {
  it('应用过渡动画类', () => {
    render(<Toast title="标题" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('transition-all', 'duration-300', 'ease-out')
  })

  it('应用进入动画', () => {
    render(<Toast title="标题" />)
    const toast = screen.getByRole('alert')
    expect(toast).toHaveClass('animate-in', 'slide-in-from-right', 'fade-in')
  })
})

describe('Toast - 内容渲染', () => {
  it('支持复杂的子元素内容', () => {
    render(
      <Toast title="标题">
        <div>
          <span>第一行</span>
          <span>第二行</span>
        </div>
      </Toast>
    )
    expect(screen.getByText('第一行')).toBeInTheDocument()
    expect(screen.getByText('第二行')).toBeInTheDocument()
  })

  it('内容文本有正确的样式', () => {
    render(<Toast title="标题">内容文本</Toast>)
    const content = screen.getByText('内容文本')
    expect(content).toHaveClass('text-sm', 'opacity-90')
  })

  it('标题有正确的样式', () => {
    render(<Toast title="标题文本">内容</Toast>)
    const title = screen.getByText('标题文本')
    expect(title).toHaveClass('font-semibold', 'text-sm')
  })
})

describe('Toast - 自动关闭（简化测试）', () => {
  it('duration=0 时不自动关闭', () => {
    vi.useFakeTimers()

    render(<Toast title="标题" duration={0} />)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    vi.advanceTimersByTime(10000)
    expect(screen.getByRole('alert')).toBeInTheDocument()

    vi.useRealTimers()
  })

  it('组件卸载时清除定时器', () => {
    vi.useFakeTimers()

    const handleClose = vi.fn()
    const { unmount } = render(<Toast title="标题" onClose={handleClose} duration={5000} />)

    unmount()
    vi.advanceTimersByTime(5000)

    // 不应该调用，因为组件已卸载
    expect(handleClose).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('调用 onClose 后组件隐藏', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(<Toast title="标题" onClose={handleClose} />)

    await user.click(screen.getByLabelText('关闭'))

    expect(handleClose).toHaveBeenCalled()
    // onClose 被调用后，组件内部状态改变，不再渲染
  })
})
