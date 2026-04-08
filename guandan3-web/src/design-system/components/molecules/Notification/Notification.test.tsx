/**
 * Notification 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 不同类型
 * - 标题和消息
 * - 关闭功能
 * - 自动关闭
 * - 图标显示
 * - 自定义图标
 * - 可访问性
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Notification } from './Notification'

describe('Notification - 基础渲染', () => {
  it('渲染消息内容', () => {
    render(<Notification message="这是一条消息" />)

    expect(screen.getByText('这是一条消息')).toBeInTheDocument()
  })

  it('渲染标题和消息', () => {
    render(
      <Notification title="标题" message="这是一条消息" />
    )

    expect(screen.getByText('标题')).toBeInTheDocument()
    expect(screen.getByText('这是一条消息')).toBeInTheDocument()
  })

  it('默认类型为 info', () => {
    const { container } = render(<Notification message="消息" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).toHaveClass('bg-primary-50', 'border-primary-200', 'text-primary-800')
  })
})

describe('Notification - 类型样式', () => {
  it('success 类型样式', () => {
    const { container } = render(<Notification type="success" message="消息" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).toHaveClass('bg-success-50', 'border-success-200', 'text-success-800')
  })

  it('info 类型样式', () => {
    const { container } = render(<Notification type="info" message="消息" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).toHaveClass('bg-primary-50', 'border-primary-200', 'text-primary-800')
  })

  it('warning 类型样式', () => {
    const { container } = render(<Notification type="warning" message="消息" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).toHaveClass('bg-warning-50', 'border-warning-200', 'text-warning-800')
  })

  it('error 类型样式', () => {
    const { container } = render(<Notification type="error" message="消息" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).toHaveClass('bg-error-50', 'border-error-200', 'text-error-800')
  })
})

describe('Notification - 图标', () => {
  it('默认显示图标', () => {
    const { container } = render(<Notification type="success" message="消息" />)

    // 检查有成功类型的文字颜色（图标颜色）
    const successIcon = container.querySelector('.text-success-500 svg')
    expect(successIcon).toBeInTheDocument()
  })

  it('showIcon=false 隐藏图标', () => {
    const { container } = render(<Notification showIcon={false} message="消息" />)

    // 不应该有任何带颜色类的 svg
    const coloredIcon = container.querySelector('.text-success-500 svg, .text-primary-500 svg, .text-warning-500 svg, .text-error-500 svg')
    expect(coloredIcon).not.toBeInTheDocument()
  })

  it('使用自定义图标', () => {
    render(
      <Notification
        icon={<span data-testid="custom-icon">★</span>}
        message="消息"
      />
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })
})

describe('Notification - 关闭功能', () => {
  it('默认显示关闭按钮', () => {
    render(<Notification message="消息" />)

    const closeButton = screen.getByLabelText('关闭')
    expect(closeButton).toBeInTheDocument()
  })

  it('closable=false 隐藏关闭按钮', () => {
    render(<Notification closable={false} message="消息" />)

    const closeButton = screen.queryByLabelText('关闭')
    expect(closeButton).not.toBeInTheDocument()
  })

  it('点击关闭按钮调用 onClose', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()

    render(<Notification message="消息" onClose={handleClose} />)

    const closeButton = screen.getByLabelText('关闭')
    await user.click(closeButton)

    // 等待关闭动画完成（200ms）
    await waitFor(() => {
      expect(handleClose).toHaveBeenCalledTimes(1)
    })
  })
})

describe('Notification - 自动关闭', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('duration>0 时自动关闭', () => {
    const handleClose = vi.fn()

    render(<Notification message="消息" duration={3000} onClose={handleClose} />)

    // 快进所有定时器
    vi.advanceTimersByTime(3000)
    vi.advanceTimersByTime(200) // 关闭动画时间

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('duration=0 时不自动关闭', () => {
    vi.advanceTimersByTime(10000)

    const handleClose = vi.fn()

    render(<Notification message="消息" duration={0} onClose={handleClose} />)

    expect(handleClose).not.toHaveBeenCalled()
  })
})

describe('Notification - 可访问性', () => {
  it('设置 role="alert"', () => {
    const { container } = render(<Notification message="消息" />)

    const notification = container.querySelector('[role="alert"]')
    expect(notification).toBeInTheDocument()
  })

  it('设置 aria-live="polite"', () => {
    const { container } = render(<Notification message="消息" />)

    const notification = container.querySelector('[aria-live="polite"]')
    expect(notification).toBeInTheDocument()
  })

  it('关闭按钮有 aria-label', () => {
    render(<Notification message="消息" />)

    const closeButton = screen.getByLabelText('关闭')
    expect(closeButton).toBeInTheDocument()
  })
})

describe('Notification - 自定义类名', () => {
  it('支持自定义 className', () => {
    const { container } = render(<Notification message="消息" className="custom-notification" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).toHaveClass('custom-notification')
  })
})

describe('Notification - 关闭动画', () => {
  it('关闭时添加退出动画类', async () => {
    const user = userEvent.setup()
    const { container } = render(<Notification message="消息" />)

    const notification = container.firstChild as HTMLElement
    expect(notification).not.toHaveClass('opacity-0', 'scale-95')

    const closeButton = screen.getByLabelText('关闭')
    await user.click(closeButton)

    // 动画类被添加
    expect(notification).toHaveClass('opacity-0', 'scale-95')
  })
})

describe('Notification - 边界情况', () => {
  it('空消息也正常渲染', () => {
    const { container } = render(<Notification message="" />)

    const notification = container.firstChild
    expect(notification).toBeInTheDocument()
  })

  it('长消息文本正常显示', () => {
    const longMessage = '这是一条非常长的消息'.repeat(10)

    render(<Notification message={longMessage} />)

    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })
})
