/**
 * Switch 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 受控模式
 * - 非受控模式
 * - 尺寸变化
 * - 颜色变体
 * - 禁用状态
 * - 标签和描述
 * - 事件回调
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

describe('Switch - 基础渲染', () => {
  it('渲染开关', () => {
    render(<Switch />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('默认未选中', () => {
    render(<Switch />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('默认使用 md 尺寸', () => {
    render(<Switch />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('w-11', 'h-6')
  })
})

describe('Switch - 受控模式', () => {
  it('使用 controlled checked 属性', () => {
    render(<Switch checked={true} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('checked=false 时未选中', () => {
    render(<Switch checked={false} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('点击时调用 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Switch checked={false} onChange={handleChange} />)

    await user.click(screen.getByRole('switch'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('controlled 模式下不改变内部状态', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    const { rerender } = render(<Switch checked={false} onChange={handleChange} />)

    await user.click(screen.getByRole('switch'))
    expect(handleChange).toHaveBeenCalledWith(true)

    // 不重新渲染，checked 仍然由父组件控制
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })
})

describe('Switch - 非受控模式', () => {
  it('使用 defaultChecked 设置初始状态', () => {
    render(<Switch defaultChecked={true} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('点击时切换状态', async () => {
    const user = userEvent.setup()
    render(<Switch />)

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')

    await user.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')

    await user.click(screen.getByRole('switch'))
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  it('非受控模式也触发 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Switch onChange={handleChange} />)

    await user.click(screen.getByRole('switch'))
    expect(handleChange).toHaveBeenCalledWith(true)
  })
})

describe('Switch - 尺寸变化', () => {
  it('应用 sm 尺寸', () => {
    render(<Switch size="sm" />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('w-9', 'h-5')
  })

  it('应用 md 尺寸', () => {
    render(<Switch size="md" />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('w-11', 'h-6')
  })

  it('应用 lg 尺寸', () => {
    render(<Switch size="lg" />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('w-14', 'h-7')
  })
})

describe('Switch - 颜色变体', () => {
  it('应用 default 变体（未选中）', () => {
    render(<Switch variant="default" checked={false} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('bg-neutral-300')
  })

  it('应用 default 变体（已选中）', () => {
    render(<Switch variant="default" checked={true} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('bg-poker-table-500')
  })

  it('应用 success 变体（已选中）', () => {
    render(<Switch variant="success" checked={true} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('bg-success')
  })

  it('应用 warning 变体（已选中）', () => {
    render(<Switch variant="warning" checked={true} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('bg-warning')
  })

  it('应用 error 变体（已选中）', () => {
    render(<Switch variant="error" checked={true} />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('bg-error')
  })
})

describe('Switch - 禁用状态', () => {
  it('禁用时不响应点击', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Switch disabled onChange={handleChange} />)

    await user.click(screen.getByRole('switch'))
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('禁用时设置 aria-disabled', () => {
    render(<Switch disabled />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true')
  })

  it('禁用时有视觉反馈', () => {
    render(<Switch disabled />)
    const label = screen.getByRole('switch').parentElement
    expect(label).toHaveClass('cursor-not-allowed', 'opacity-50')
  })
})

describe('Switch - 标签和描述', () => {
  it('显示标签', () => {
    render(<Switch label="启用通知" />)
    expect(screen.getByText('启用通知')).toBeInTheDocument()
  })

  it('显示描述', () => {
    render(<Switch description="接收推送通知" />)
    expect(screen.getByText('接收推送通知')).toBeInTheDocument()
  })

  it('同时显示标签和描述', () => {
    render(
      <Switch label="启用通知" description="接收推送通知" />
    )
    expect(screen.getByText('启用通知')).toBeInTheDocument()
    expect(screen.getByText('接收推送通知')).toBeInTheDocument()
  })

  it('禁用时标签变灰', () => {
    render(<Switch label="标签" disabled />)
    expect(screen.getByText('标签')).toHaveClass('text-neutral-400')
  })
})

describe('Switch - 表单支持', () => {
  it('渲染隐藏的 input', () => {
    render(<Switch name="notifications" value="yes" checked={true} />)
    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input).toBeInTheDocument()
    expect(input?.name).toBe('notifications')
    expect(input?.value).toBe('yes')
    expect(input?.checked).toBe(true)
  })

  it('不设置 name 时不渲染 input', () => {
    render(<Switch checked={true} />)
    const input = document.querySelector('input[type="checkbox"]')
    expect(input).not.toBeInTheDocument()
  })
})

describe('Switch - 自定义属性', () => {
  it('支持自定义 className', () => {
    render(<Switch className="custom-switch" />)
    const label = screen.getByRole('switch').parentElement
    expect(label).toHaveClass('custom-switch')
  })

  it('传递其他 HTML 属性', () => {
    render(<Switch data-testid="test-switch" />)
    expect(screen.getByTestId('test-switch')).toBeInTheDocument()
  })

  it('支持自定义 id', () => {
    render(<Switch id="my-switch" />)
    expect(screen.getByRole('switch')).toHaveAttribute('id', 'my-switch')
  })
})

describe('Switch - 过渡动画', () => {
  it('应用过渡效果', () => {
    render(<Switch />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveClass('transition-colors', 'duration-200')
  })

  it('滑块有过渡动画', () => {
    render(<Switch />)
    const thumb = screen.getByRole('switch').querySelector('span[class*="bg-white"]')
    expect(thumb).toHaveClass('transition-transform', 'duration-200')
  })
})

describe('Switch - 可访问性', () => {
  it('有正确的 role 属性', () => {
    render(<Switch />)
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })

  it('设置 aria-checked 属性', () => {
    render(<Switch checked={true} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('设置 aria-disabled 属性', () => {
    render(<Switch disabled />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-disabled', 'true')
  })

  it('label 关联到 switch', () => {
    render(<Switch label="开关" />)
    const switchEl = screen.getByRole('switch')
    expect(switchEl).toHaveAttribute('id')
  })
})

describe('Switch - 边缘情况', () => {
  it('defaultChecked 和 checked 同时使用时 controlled 优先', () => {
    render(<Switch defaultChecked={false} checked={true} />)
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  it('频繁点击时状态正确', async () => {
    const user = userEvent.setup()
    render(<Switch />)

    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('switch'))
    await user.click(screen.getByRole('switch'))

    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })
})
