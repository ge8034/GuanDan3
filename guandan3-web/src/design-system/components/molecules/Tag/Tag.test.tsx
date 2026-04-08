/**
 * Tag 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 不同颜色
 * - 不同变体
 * - 不同尺寸
 * - 可关闭功能
 * - 图标显示
 * - 可点击状态
 * - 选中状态
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tag } from './Tag'

describe('Tag - 基础渲染', () => {
  it('渲染标签内容', () => {
    render(<Tag>标签文本</Tag>)

    expect(screen.getByText('标签文本')).toBeInTheDocument()
  })

  it('默认使用 neutral 颜色', () => {
    render(<Tag>默认标签</Tag>)

    const tag = screen.getByText('默认标签').parentElement
    expect(tag).toHaveClass('bg-neutral-600')
  })
})

describe('Tag - 颜色变体', () => {
  it('neutral 颜色', () => {
    render(<Tag color="neutral">中性</Tag>)

    const tag = screen.getByText('中性').parentElement
    expect(tag).toHaveClass('bg-neutral-600')
  })

  it('primary 颜色', () => {
    render(<Tag color="primary">主要</Tag>)

    const tag = screen.getByText('主要').parentElement
    expect(tag).toHaveClass('bg-primary-500')
  })

  it('success 颜色', () => {
    render(<Tag color="success">成功</Tag>)

    const tag = screen.getByText('成功').parentElement
    expect(tag).toHaveClass('bg-success-500')
  })

  it('warning 颜色', () => {
    render(<Tag color="warning">警告</Tag>)

    const tag = screen.getByText('警告').parentElement
    expect(tag).toHaveClass('bg-warning-500')
  })

  it('error 颜色', () => {
    render(<Tag color="error">错误</Tag>)

    const tag = screen.getByText('错误').parentElement
    expect(tag).toHaveClass('bg-error-500')
  })
})

describe('Tag - variant 变体', () => {
  it('filled 变体（默认）', () => {
    render(<Tag variant="filled">填充</Tag>)

    const tag = screen.getByText('填充').parentElement
    expect(tag).toHaveClass('bg-neutral-600')
  })

  it('outlined 变体', () => {
    render(<Tag variant="outlined">轮廓</Tag>)

    const tag = screen.getByText('轮廓').parentElement
    expect(tag).toHaveClass('border-neutral-300')
    expect(tag).toHaveClass('bg-transparent')
  })

  it('soft 变体', () => {
    render(<Tag variant="soft">柔和</Tag>)

    const tag = screen.getByText('柔和').parentElement
    expect(tag).toHaveClass('bg-neutral-100')
  })
})

describe('Tag - 尺寸变体', () => {
  it('small 尺寸', () => {
    render(<Tag size="small">小</Tag>)

    const tag = screen.getByText('小').parentElement
    expect(tag).toHaveClass('h-5')
  })

  it('medium 尺寸（默认）', () => {
    render(<Tag size="medium">中</Tag>)

    const tag = screen.getByText('中').parentElement
    expect(tag).toHaveClass('h-6')
  })

  it('large 尺寸', () => {
    render(<Tag size="large">大</Tag>)

    const tag = screen.getByText('大').parentElement
    expect(tag).toHaveClass('h-7')
  })
})

describe('Tag - closable 属性', () => {
  it('closable=true 显示关闭按钮', () => {
    render(<Tag closable>可关闭</Tag>)

    const closeButton = document.querySelector('button')
    expect(closeButton).toBeInTheDocument()
  })

  it('closable=false 不显示关闭按钮', () => {
    render(<Tag closable={false}>不可关闭</Tag>)

    const closeButton = document.querySelector('button')
    expect(closeButton).not.toBeInTheDocument()
  })

  it('点击关闭按钮触发 onClose', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(<Tag closable onClose={handleClose}>标签</Tag>)

    const closeButton = document.querySelector('button')
    if (closeButton) {
      await user.click(closeButton)
    }

    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('点击关闭按钮不触发 tag onClick', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    const handleClose = vi.fn()
    render(
      <Tag closable onClose={handleClose} onClick={handleClick}>
        标签
      </Tag>
    )

    const closeButton = document.querySelector('button')
    if (closeButton) {
      await user.click(closeButton)
    }

    expect(handleClose).toHaveBeenCalledTimes(1)
    expect(handleClick).not.toHaveBeenCalled()
  })
})

describe('Tag - 图标', () => {
  it('显示图标', () => {
    const icon = <span data-testid="test-icon">★</span>
    render(<Tag icon={icon}>带图标</Tag>)

    expect(document.querySelector('[data-testid="test-icon"]')).toBeInTheDocument()
  })

  it('图标在文本前面', () => {
    const icon = <span data-testid="icon">●</span>
    render(<Tag icon={icon}>标签</Tag>)

    const tag = screen.getByText('标签').parentElement
    const iconElement = document.querySelector('[data-testid="icon"]')

    expect(tag).toContainElement(iconElement)
  })
})

describe('Tag - 可点击状态', () => {
  it('clickable=true 添加点击样式', () => {
    render(<Tag clickable>可点击</Tag>)

    const tag = screen.getByText('可点击')
    expect(tag.parentElement).toHaveClass('cursor-pointer')
  })

  it('点击触发 onClick', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Tag clickable onClick={handleClick}>点击我</Tag>)

    const tag = screen.getByText('点击我')
    await user.click(tag)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('Tag - 选中状态', () => {
  it('selected=true 应用选中样式', () => {
    render(<Tag selected>选中</Tag>)

    const tag = screen.getByText('选中').parentElement
    expect(tag).toHaveClass('ring-2')
  })

  it('选中状态使用 selectedColor', () => {
    render(<Tag selected selectedColor="success">选中</Tag>)

    const tag = screen.getByText('选中').parentElement
    expect(tag).toHaveClass('bg-success-500')
  })
})

describe('Tag - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Tag className="custom-tag">标签</Tag>)

    const tag = screen.getByText('标签').parentElement
    expect(tag).toHaveClass('custom-tag')
  })
})

describe('Tag - 长文本处理', () => {
  it('超长文本显示省略号', () => {
    render(
      <Tag>
        这是一个非常非常非常非常非常非常长的标签文本应该被截断
      </Tag>
    )

    // truncate 类应用在内部 span 上
    const textSpan = screen.getByText(/这是一个非常非常/)
    expect(textSpan).toHaveClass('truncate')
  })
})

describe('Tag - 多个标签', () => {
  it('可以同时渲染多个标签', () => {
    render(
      <div>
        <Tag>标签1</Tag>
        <Tag>标签2</Tag>
        <Tag>标签3</Tag>
      </div>
    )

    expect(screen.getByText('标签1')).toBeInTheDocument()
    expect(screen.getByText('标签2')).toBeInTheDocument()
    expect(screen.getByText('标签3')).toBeInTheDocument()
  })
})

describe('Tag - 组合功能', () => {
  it('可关闭 + 可点击 + 图标', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    const handleClick = vi.fn()
    const icon = <span>★</span>

    render(
      <Tag
        icon={icon}
        closable
        onClose={handleClose}
        clickable
        onClick={handleClick}
      >
        组合标签
      </Tag>
    )

    // 显示图标
    expect(screen.getByText('★')).toBeInTheDocument()

    // 显示关闭按钮
    const closeButton = document.querySelector('button')
    expect(closeButton).toBeInTheDocument()

    // 点击标签触发 onClick
    const tag = screen.getByText('组合标签')
    await user.click(tag)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('不同颜色 + 不同尺寸 + 不同变体', () => {
    render(
      <div>
        <Tag color="primary" size="small" variant="filled">
          小-填充-主色
        </Tag>
        <Tag color="success" size="medium" variant="outlined">
          中-轮廓-成功
        </Tag>
        <Tag color="error" size="large" variant="soft">
          大-柔和-错误
        </Tag>
      </div>
    )

    expect(screen.getByText('小-填充-主色')).toBeInTheDocument()
    expect(screen.getByText('中-轮廓-成功')).toBeInTheDocument()
    expect(screen.getByText('大-柔和-错误')).toBeInTheDocument()
  })
})
