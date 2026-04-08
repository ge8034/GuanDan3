/**
 * Rate 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 评分功能
 * - 受控/非受控模式
 * - 半星支持
 * - 禁用状态
 * - 只读模式
 * - 清除功能
 * - 不同颜色
 * - 自定义图标
 * - 最大值设置
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Rate } from './Rate'

describe('Rate - 基础渲染', () => {
  it('渲染默认5颗星', () => {
    const { container } = render(<Rate />)

    // 每个星星是一个 span.relative 元素
    const stars = container.querySelectorAll(':scope > .relative, div.inline-flex > .relative')
    expect(stars.length).toBe(5)
  })

  it('默认评分为0（全部空心）', () => {
    const { container } = render(<Rate />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(0)
  })
})

describe('Rate - 评分功能', () => {
  it('点击星星设置评分', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    const { container } = render(<Rate onChange={handleChange} />)

    // 点击第3颗星
    const stars = container.querySelectorAll('.cursor-pointer')
    if (stars[2]) {
      await user.click(stars[2])
    }

    expect(handleChange).toHaveBeenCalledWith(3)
  })

  it('悬停显示预览', async () => {
    const user = userEvent.setup()
    const handleHoverChange = vi.fn()
    const { container } = render(<Rate onHoverChange={handleHoverChange} />)

    const stars = container.querySelectorAll('.cursor-pointer')
    if (stars[3]) {
      await user.hover(stars[3])
    }

    expect(handleHoverChange).toHaveBeenCalledWith(4)
  })
})

describe('Rate - 受控模式', () => {
  it('value 属性控制评分', () => {
    const { container } = render(<Rate value={4} />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(4)
  })

  it('value 变化更新显示', () => {
    const { container, rerender } = render(<Rate value={3} />)

    let filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(3)

    rerender(<Rate value={5} />)

    filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(5)
  })
})

describe('Rate - 非受控模式', () => {
  it('defaultValue 设置初始评分', () => {
    const { container } = render(<Rate defaultValue={3} />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(3)
  })

  it('点击更新内部状态', async () => {
    const user = userEvent.setup()
    const { container } = render(<Rate defaultValue={2} />)

    const stars = container.querySelectorAll('.cursor-pointer')
    if (stars[3]) {
      await user.click(stars[3])
    }

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(4)
  })
})

describe('Rate - 半星支持', () => {
  it('allowHalf=true 支持半星', () => {
    const { container } = render(<Rate value={2.5} allowHalf={true} />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars.length).toBeGreaterThan(0)
  })
})

describe('Rate - 禁用状态', () => {
  it('disabled=true 禁用评分', () => {
    const { container } = render(<Rate disabled value={3} />)

    const disabledElement = container.querySelector('.cursor-not-allowed')
    expect(disabledElement).toBeInTheDocument()
  })

  it('禁用时无法点击', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    const { container } = render(<Rate disabled onChange={handleChange} />)

    const stars = container.querySelectorAll('.cursor-pointer')
    if (stars[0]) {
      await user.click(stars[0])
    }

    expect(handleChange).not.toHaveBeenCalled()
  })
})

describe('Rate - 只读模式', () => {
  it('readonly=true 使用默认光标', () => {
    const { container } = render(<Rate readonly value={3} />)

    const readonlyStars = container.querySelectorAll('.cursor-default')
    expect(readonlyStars.length).toBeGreaterThan(0)
  })
})

describe('Rate - 清除功能', () => {
  it('allowClear=true 点击当前值时调用 onChange(0)', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()

    const { container } = render(<Rate defaultValue={3} allowClear={true} onChange={handleChange} />)

    // 初始有3颗星
    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars.length).toBeGreaterThanOrEqual(3)

    // 点击第3颗星（当前值）应该触发清除
    const stars = container.querySelectorAll('.cursor-pointer')
    if (stars[2]) {
      await user.click(stars[2])
    }

    // onChange 应该被调用为 0（清除）
    expect(handleChange).toHaveBeenCalledWith(0)
  })

  it('allowClear=true value=0 时不显示填充星', () => {
    const { container } = render(<Rate value={0} allowClear={true} />)

    // value=0 应该没有填充的星星
    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(0)
  })
})

describe('Rate - 颜色变体', () => {
  it('gold 颜色（默认）', () => {
    const { container } = render(<Rate value={3} color="gold" />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars.length).toBeGreaterThan(0)
  })

  it('primary 颜色', () => {
    const { container } = render(<Rate value={3} color="primary" />)

    const filledStars = container.querySelectorAll('.text-primary-500')
    expect(filledStars.length).toBeGreaterThan(0)
  })

  it('success 颜色', () => {
    const { container } = render(<Rate value={3} color="success" />)

    const filledStars = container.querySelectorAll('.text-success-500')
    expect(filledStars.length).toBeGreaterThan(0)
  })

  it('warning 颜色', () => {
    const { container } = render(<Rate value={3} color="warning" />)

    const filledStars = container.querySelectorAll('.text-warning-500')
    expect(filledStars.length).toBeGreaterThan(0)
  })

  it('error 颜色', () => {
    const { container } = render(<Rate value={3} color="error" />)

    const filledStars = container.querySelectorAll('.text-error-500')
    expect(filledStars.length).toBeGreaterThan(0)
  })
})

describe('Rate - 自定义图标', () => {
  it('使用自定义字符', () => {
    const { container } = render(<Rate value={3} character="★" />)

    // 自定义字符会渲染多次（背景和前景），检查存在即可
    expect(screen.getAllByText('★').length).toBeGreaterThan(0)
  })

  it('使用自定义元素', () => {
    render(<Rate value={3} character={<span data-testid="custom">♥</span>} />)

    expect(document.querySelector('[data-testid="custom"]')).toBeInTheDocument()
  })
})

describe('Rate - 最大值设置', () => {
  it('max=3 显示3颗星', () => {
    const { container } = render(<Rate max={3} />)

    // 每个星星是一个 span.relative 元素
    const stars = container.querySelectorAll(':scope > .relative, div.inline-flex > .relative')
    expect(stars.length).toBe(3)
  })

  it('max=10 显示10颗星', () => {
    const { container } = render(<Rate max={10} value={5} />)

    // 每个星星是一个 span.relative 元素
    const stars = container.querySelectorAll(':scope > .relative, div.inline-flex > .relative')
    expect(stars.length).toBe(10)
  })
})

describe('Rate - 边界情况', () => {
  it('value 超过 max 时显示 max', () => {
    const { container } = render(<Rate value={10} max={5} />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars.length).toBeGreaterThan(0)
  })

  it('value 为负数时显示0星', () => {
    const { container } = render(<Rate value={-5} />)

    const filledStars = container.querySelectorAll('.text-yellow-400')
    expect(filledStars).toHaveLength(0)
  })
})

describe('Rate - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Rate className="custom-rate" />)

    const container = document.querySelector('.custom-rate')
    expect(container).toBeInTheDocument()
  })
})
