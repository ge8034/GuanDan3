/**
 * Slider 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 值变化
 * - 受控/非受控模式
 * - 步长
 * - 禁用状态
 * - 数值显示
 * - 颜色变体
 * - 边界值
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Slider } from './Slider'

describe('Slider - 基础渲染', () => {
  it('渲染滑块', () => {
    const { container } = render(<Slider />)

    const track = container.querySelector('[role="slider"]')
    expect(track).toBeInTheDocument()
  })

  it('默认值为 0', () => {
    const { container } = render(<Slider />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '0')
  })

  it('设置 defaultValue', () => {
    const { container } = render(<Slider defaultValue={50} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '50')
  })
})

describe('Slider - 值变化', () => {
  it('点击轨道更新值', () => {
    const handleChange = vi.fn()
    const { container } = render(<Slider onChange={handleChange} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    fireEvent.mouseDown(track, { clientX: 100 })

    expect(handleChange).toHaveBeenCalled()
  })

  it('拖拽滑块更新值', () => {
    const handleChange = vi.fn()
    const { container } = render(<Slider defaultValue={50} onChange={handleChange} />)

    const thumb = container.querySelector('.rounded-full.bg-white') as HTMLElement
    fireEvent.mouseDown(thumb, { clientX: 100 })
    fireEvent.mouseMove(document, { clientX: 150 })

    expect(handleChange).toHaveBeenCalled()
  })

  it('拖拽结束调用 onChangeComplete', () => {
    const handleChangeComplete = vi.fn()
    const { container } = render(<Slider defaultValue={50} onChangeComplete={handleChangeComplete} />)

    const thumb = container.querySelector('.rounded-full.bg-white') as HTMLElement
    fireEvent.mouseDown(thumb, { clientX: 100 })
    fireEvent.mouseUp(document)

    expect(handleChangeComplete).toHaveBeenCalled()
  })
})

describe('Slider - 受控模式', () => {
  it('value 属性控制值', () => {
    const { container } = render(<Slider value={75} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '75')
  })

  it('value 变化更新显示', () => {
    const { container, rerender } = render(<Slider value={25} />)

    let track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '25')

    rerender(<Slider value={75} />)

    track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '75')
  })
})

describe('Slider - 非受控模式', () => {
  it('defaultValue 设置初始值', () => {
    const { container } = render(<Slider defaultValue={30} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '30')
  })
})

describe('Slider - 范围设置', () => {
  it('min=0 max=200', () => {
    const { container } = render(<Slider min={0} max={200} value={100} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuemin', '0')
    expect(track).toHaveAttribute('aria-valuemax', '200')
    expect(track).toHaveAttribute('aria-valuenow', '100')
  })

  it('min=10 max=50', () => {
    const { container } = render(<Slider min={10} max={50} value={30} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuemin', '10')
    expect(track).toHaveAttribute('aria-valuemax', '50')
    expect(track).toHaveAttribute('aria-valuenow', '30')
  })
})

describe('Slider - 步长', () => {
  it('step=5 按步长变化', () => {
    const { container } = render(<Slider step={5} defaultValue={10} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '10')
  })

  it('step=10 允许的值', () => {
    const { container } = render(<Slider step={10} max={100} value={50} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '50')
  })

  it('step=0.1 允许小数', () => {
    const { container } = render(<Slider step={0.1} max={1} value={0.5} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '0.5')
  })
})

describe('Slider - 禁用状态', () => {
  it('disabled=true 禁用交互', () => {
    const { container } = render(<Slider disabled />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-disabled', 'true')
    expect(track).toHaveClass('cursor-not-allowed')
  })

  it('disabled 时不响应点击', () => {
    const handleChange = vi.fn()
    const { container } = render(<Slider disabled onChange={handleChange} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    fireEvent.mouseDown(track, { clientX: 100 })

    expect(handleChange).not.toHaveBeenCalled()
  })
})

describe('Slider - 数值显示', () => {
  it('showValue=true 显示数值', () => {
    render(<Slider value={42} showValue />)

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('formatValue 自定义格式', () => {
    render(
      <Slider
        value={75}
        showValue
        formatValue={(v) => `${v}%`}
      />
    )

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('showValue=false 不显示数值', () => {
    render(<Slider value={42} />)

    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })
})

describe('Slider - 颜色变体', () => {
  it('primary 颜色（默认）', () => {
    const { container } = render(<Slider />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveClass('bg-primary-200')
  })

  it('success 颜色', () => {
    const { container } = render(<Slider color="success" />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveClass('bg-success-200')
  })

  it('warning 颜色', () => {
    const { container } = render(<Slider color="warning" />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveClass('bg-warning-200')
  })

  it('error 颜色', () => {
    const { container } = render(<Slider color="error" />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveClass('bg-error-200')
  })
})

describe('Slider - 边界情况', () => {
  it('value 超过 max 时显示 max', () => {
    const { container } = render(<Slider value={150} max={100} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '100')
  })

  it('value 小于 min 时显示 min', () => {
    const { container } = render(<Slider value={-10} min={0} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '0')
  })

  it('min=max 时显示该值', () => {
    const { container } = render(<Slider min={50} max={50} value={50} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuenow', '50')
  })
})

describe('Slider - 可访问性', () => {
  it('设置 role="slider"', () => {
    const { container } = render(<Slider />)

    const track = container.querySelector('[role="slider"]')
    expect(track).toBeInTheDocument()
  })

  it('设置 aria 属性', () => {
    const { container } = render(<Slider min={0} max={100} value={50} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    expect(track).toHaveAttribute('aria-valuemin', '0')
    expect(track).toHaveAttribute('aria-valuemax', '100')
    expect(track).toHaveAttribute('aria-valuenow', '50')
  })
})

describe('Slider - 自定义类名', () => {
  it('支持自定义 className', () => {
    const { container } = render(<Slider className="custom-slider" />)

    const wrapper = container.querySelector('.custom-slider')
    expect(wrapper).toBeInTheDocument()
  })
})

describe('Slider - 触摸事件', () => {
  it('支持触摸开始', () => {
    const handleChange = vi.fn()
    const { container } = render(<Slider onChange={handleChange} />)

    const track = container.querySelector('[role="slider"]') as HTMLElement
    fireEvent.touchStart(track, { touches: [{ clientX: 50 }] })

    expect(handleChange).toHaveBeenCalled()
  })

  it('支持触摸移动', () => {
    const handleChange = vi.fn()
    const { container } = render(<Slider defaultValue={50} onChange={handleChange} />)

    const thumb = container.querySelector('.rounded-full.bg-white') as HTMLElement
    fireEvent.mouseDown(thumb, { clientX: 100 })
    fireEvent.touchMove(document, { touches: [{ clientX: 150 }] })

    expect(handleChange).toHaveBeenCalled()
  })
})
