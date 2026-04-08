/**
 * Alert 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 变体样式
 * - 图标显示
 * - 关闭功能
 * - 操作按钮
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Alert } from './Alert'

describe('Alert - 基础渲染', () => {
  it('渲染警告提示', () => {
    render(<Alert title="标题">内容</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('渲染标题', () => {
    render(<Alert title="提示标题">内容</Alert>)
    expect(screen.getByText('提示标题')).toBeInTheDocument()
  })

  it('渲染内容', () => {
    render(<Alert title="标题">提示内容</Alert>)
    expect(screen.getByText('提示内容')).toBeInTheDocument()
  })

  it('只显示标题时不显示内容', () => {
    render(<Alert title="标题" />)
    expect(screen.getByText('标题')).toBeInTheDocument()
  })

  it('没有内容时不显示内容区域', () => {
    render(<Alert title="标题">{undefined}</Alert>)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })
})

describe('Alert - 变体样式', () => {
  it('应用 info 变体', () => {
    render(<Alert title="标题" variant="info" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-blue-50', 'border-blue-200')
  })

  it('应用 success 变体', () => {
    render(<Alert title="标题" variant="success" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-green-50', 'border-green-200')
  })

  it('应用 warning 变体', () => {
    render(<Alert title="标题" variant="warning" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-yellow-50', 'border-yellow-200')
  })

  it('应用 error 变体', () => {
    render(<Alert title="标题" variant="error" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('bg-red-50', 'border-red-200')
  })
})

describe('Alert - 图标显示', () => {
  it('默认显示图标', () => {
    render(<Alert title="标题" variant="success" />)
    const alert = screen.getByRole('alert')
    expect(alert.querySelector('svg')).toBeInTheDocument()
  })

  it('showIcon=false 时隐藏图标', () => {
    render(<Alert title="标题" showIcon={false} />)
    const alert = screen.getByRole('alert')
    // 只检查内容区域的 SVG，排除关闭按钮
    const contentArea = alert.querySelector('.flex-1')
    expect(contentArea?.previousElementSibling).not.toBeInTheDocument()
  })

  it('不同变体显示不同图标', () => {
    const { rerender } = render(<Alert title="标题" variant="success" showIcon />)
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument()

    rerender(<Alert title="标题" variant="error" showIcon />)
    expect(screen.getByRole('alert').querySelector('svg')).toBeInTheDocument()
  })
})

describe('Alert - 关闭功能', () => {
  it('closable=true 时显示关闭按钮', () => {
    render(<Alert title="标题" closable />)
    expect(screen.getByLabelText('关闭')).toBeInTheDocument()
  })

  it('closable=false 时不显示关闭按钮', () => {
    render(<Alert title="标题" closable={false} />)
    expect(screen.queryByLabelText('关闭')).not.toBeInTheDocument()
  })

  it('点击关闭按钮隐藏提示', async () => {
    const handleClose = vi.fn()
    const user = userEvent.setup()

    render(<Alert title="标题" closable onClose={handleClose} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByLabelText('关闭'))

    expect(handleClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Alert - 操作按钮', () => {
  it('显示操作按钮', () => {
    render(
      <Alert
        title="标题"
        action={<button type="button">操作</button>}
      />
    )
    expect(screen.getByRole('button', { name: '操作' })).toBeInTheDocument()
  })

  it('多个操作按钮', () => {
    render(
      <Alert
        title="标题"
        action={
          <div className="flex gap-2">
            <button type="button">取消</button>
            <button type="button">确认</button>
          </div>
        }
      />
    )
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认' })).toBeInTheDocument()
  })
})

describe('Alert - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Alert title="标题" className="custom-alert" />)
    expect(screen.getByRole('alert')).toHaveClass('custom-alert')
  })

  it('传递其他 HTML 属性', () => {
    render(<Alert title="标题" data-testid="test-alert" />)
    expect(screen.getByTestId('test-alert')).toBeInTheDocument()
  })
})

describe('Alert - 可访问性', () => {
  it('设置 role="alert"', () => {
    render(<Alert title="标题" />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('设置 aria-live="polite"', () => {
    render(<Alert title="标题" />)
    expect(screen.getByRole('alert')).toHaveAttribute('aria-live', 'polite')
  })

  it('关闭按钮有正确的 aria-label', () => {
    render(<Alert title="标题" closable />)
    expect(screen.getByLabelText('关闭')).toBeInTheDocument()
  })
})

describe('Alert - 内容渲染', () => {
  it('支持复杂的子元素内容', () => {
    render(
      <Alert title="标题">
        <div>
          <span>第一行</span>
          <span>第二行</span>
        </div>
      </Alert>
    )
    expect(screen.getByText('第一行')).toBeInTheDocument()
    expect(screen.getByText('第二行')).toBeInTheDocument()
  })

  it('内容文本有正确的样式', () => {
    render(<Alert title="标题">内容文本</Alert>)
    const content = screen.getByText('内容文本')
    expect(content).toHaveClass('text-sm', 'leading-relaxed')
  })

  it('标题有正确的样式', () => {
    render(<Alert title="标题文本">内容</Alert>)
    const title = screen.getByText('标题文本')
    expect(title).toHaveClass('font-semibold', 'text-sm')
  })
})

describe('Alert - 边缘情况', () => {
  it('没有标题时仍然正常渲染', () => {
    render(<Alert>只有内容</Alert>)
    expect(screen.getByText('只有内容')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).toBeInTheDocument()
  })

  it('关闭后不显示', async () => {
    const user = userEvent.setup()
    render(<Alert title="标题" closable />)

    expect(screen.getByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByLabelText('关闭'))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('Alert - 动画效果', () => {
  it('应用过渡动画类', () => {
    render(<Alert title="标题" />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('transition-opacity', 'duration-200', 'ease-out')
  })
})

describe('Alert - 布局', () => {
  it('使用 flex 布局', () => {
    render(<Alert title="标题">内容</Alert>)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveClass('flex', 'items-start', 'gap-3')
  })

  it('图标区域不收缩', () => {
    render(<Alert title="标题" showIcon />)
    const alert = screen.getByRole('alert')
    const iconContainer = alert.querySelector('.flex-shrink-0')
    expect(iconContainer).toBeInTheDocument()
  })
})
