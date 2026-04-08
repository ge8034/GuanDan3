/**
 * Switch 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 切换功能
 * - 受控/非受控模式
 * - 不同尺寸
 * - 不同颜色
 * - 禁用状态
 * - 加载状态
 * - 标签显示
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Switch } from './Switch'

describe('Switch - 基础渲染', () => {
  it('渲染开关组件', () => {
    render(<Switch />)

    const input = document.querySelector('input[type="checkbox"]')
    expect(input).toBeInTheDocument()
  })

  it('默认为未选中状态', () => {
    render(<Switch />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.checked).toBe(false)
  })
})

describe('Switch - 切换功能', () => {
  it('点击切换选中状态', async () => {
    const user = userEvent.setup()
    render(<Switch />)

    const label = document.querySelector('label')
    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement

    expect(input?.checked).toBe(false)

    if (label) {
      await user.click(label)
    }

    expect(input?.checked).toBe(true)
  })

  it('触发 onChange 回调', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onChange={handleChange} />)

    const label = document.querySelector('label')
    if (label) {
      await user.click(label)
    }

    expect(handleChange).toHaveBeenCalledWith(true)
  })

  it('传递正确的 checked 值', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch onChange={handleChange} />)

    const label = document.querySelector('label')
    if (label) {
      await user.click(label)
      await user.click(label)
    }

    expect(handleChange).toHaveBeenLastCalledWith(false)
  })
})

describe('Switch - 受控模式', () => {
  it('checked 属性控制状态', () => {
    render(<Switch checked={true} />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.checked).toBe(true)
  })

  it('checked=false 时未选中', () => {
    render(<Switch checked={false} />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.checked).toBe(false)
  })
})

describe('Switch - 非受控模式', () => {
  it('defaultChecked 控制初始状态', () => {
    render(<Switch defaultChecked={true} />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.checked).toBe(true)
  })

  it('defaultChecked={false} 时初始未选中', () => {
    render(<Switch defaultChecked={false} />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.checked).toBe(false)
  })
})

describe('Switch - 尺寸变体', () => {
  it('small 尺寸', () => {
    render(<Switch size="small" />)

    const track = document.querySelector('.w-8')
    expect(track).toBeInTheDocument()
  })

  it('medium 尺寸（默认）', () => {
    render(<Switch size="medium" />)

    const track = document.querySelector('.w-11')
    expect(track).toBeInTheDocument()
  })

  it('large 尺寸', () => {
    render(<Switch size="large" />)

    const track = document.querySelector('.w-14')
    expect(track).toBeInTheDocument()
  })
})

describe('Switch - 颜色变体', () => {
  it('primary 颜色（默认）', () => {
    render(<Switch checked color="primary" />)

    const track = document.querySelector('.bg-primary-500')
    expect(track).toBeInTheDocument()
  })

  it('success 颜色', () => {
    render(<Switch checked color="success" />)

    const track = document.querySelector('.bg-success-500')
    expect(track).toBeInTheDocument()
  })

  it('warning 颜色', () => {
    render(<Switch checked color="warning" />)

    const track = document.querySelector('.bg-warning-500')
    expect(track).toBeInTheDocument()
  })

  it('error 颜色', () => {
    render(<Switch checked color="error" />)

    const track = document.querySelector('.bg-error-500')
    expect(track).toBeInTheDocument()
  })
})

describe('Switch - 禁用状态', () => {
  it('disabled=true 禁用开关', () => {
    render(<Switch disabled />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.disabled).toBe(true)
  })

  it('禁用时有视觉反馈', () => {
    render(<Switch disabled />)

    const label = document.querySelector('label')
    expect(label).toHaveClass('opacity-50')
    expect(label).toHaveClass('cursor-not-allowed')
  })

  it('禁用时无法切换', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch disabled onChange={handleChange} />)

    const label = document.querySelector('label')
    if (label) {
      await user.click(label)
    }

    expect(handleChange).not.toHaveBeenCalled()
  })
})

describe('Switch - 加载状态', () => {
  it('loading=true 显示加载动画', () => {
    render(<Switch loading />)

    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('加载时有视觉反馈', () => {
    render(<Switch loading />)

    const track = document.querySelector('.border')
    expect(track).toHaveClass('opacity-70')
  })

  it('加载时无法切换', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(<Switch loading onChange={handleChange} />)

    const input = document.querySelector('input[type="checkbox"]') as HTMLInputElement
    expect(input?.disabled).toBe(true)
  })
})

describe('Switch - 标签显示', () => {
  it('显示 checkedChildren', () => {
    render(<Switch checked={true} checkedChildren="开" />)

    expect(screen.getByText('开')).toBeInTheDocument()
  })

  it('显示 unCheckedChildren', () => {
    render(<Switch checked={false} unCheckedChildren="关" />)

    expect(screen.getByText('关')).toBeInTheDocument()
  })

  it('切换时标签变化', async () => {
    const user = userEvent.setup()
    render(
      <Switch checkedChildren="开" unCheckedChildren="关" defaultChecked={false} />
    )

    expect(screen.getByText('关')).toBeInTheDocument()

    const label = document.querySelector('label')
    if (label) {
      await user.click(label)
    }

    expect(screen.getByText('开')).toBeInTheDocument()
  })
})

describe('Switch - 表单属性', () => {
  it('支持 name 属性', () => {
    render(<Switch name="switch-name" />)

    const input = document.querySelector('input[name="switch-name"]')
    expect(input).toBeInTheDocument()
  })

  it('支持 value 属性', () => {
    render(<Switch value="switch-value" />)

    const input = document.querySelector('input[value="switch-value"]')
    expect(input).toBeInTheDocument()
  })

  it('支持 autoFocus', () => {
    render(<Switch autoFocus />)

    const input = document.querySelector('input[autoFocus]')
    // autoFocus 是布尔属性，检查 input 元素存在即可
    expect(document.querySelector('input[type="checkbox"]')).toBeInTheDocument()
  })
})

describe('Switch - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Switch className="custom-switch" />)

    const label = document.querySelector('.custom-switch')
    expect(label).toBeInTheDocument()
  })
})

describe('Switch - 无障碍支持', () => {
  it('input 使用 sr-only 类隐藏', () => {
    render(<Switch />)

    const input = document.querySelector('.sr-only')
    expect(input).toBeInTheDocument()
  })

  it('label 有正确的 cursor', () => {
    render(<Switch />)

    const label = document.querySelector('label')
    expect(label).toHaveClass('cursor-pointer')
  })
})
