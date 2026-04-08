/**
 * Dropdown 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 打开/关闭
 * - 对齐方式
 * - 禁用状态
 * - DropdownItem
 * - DropdownSeparator
 * - 点击外部关闭
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Dropdown, DropdownItem, DropdownSeparator } from './Dropdown'

describe('Dropdown - 基础渲染', () => {
  it('渲染触发元素', () => {
    render(
      <Dropdown content={<div>菜单内容</div>}>
        <button type="button">打开菜单</button>
      </Dropdown>
    )
    expect(screen.getByRole('button', { name: '打开菜单' })).toBeInTheDocument()
  })

  it('初始状态不显示菜单', () => {
    render(
      <Dropdown content={<div>菜单内容</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('触发元素有正确的 ARIA 属性', () => {
    render(
      <Dropdown content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )
    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-haspopup', 'true')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })
})

describe('Dropdown - 打开/关闭', () => {
  it('点击触发元素打开菜单', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown content={<div>菜单内容</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('menu')).toBeInTheDocument()
    expect(screen.getByText('菜单内容')).toBeInTheDocument()
  })

  it('再次点击关闭菜单', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByRole('button'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('点击外部区域关闭菜单', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Dropdown content={<div>菜单</div>}>
          <button type="button">打开</button>
        </Dropdown>
        <div data-testid="outside">外部区域</div>
      </div>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()

    await user.click(screen.getByTestId('outside'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('调用 onOpenChange 回调', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <div>
        <Dropdown content={<div>菜单</div>} onOpenChange={handleChange}>
          <button type="button">打开</button>
        </Dropdown>
        <div data-testid="outside">外部区域</div>
      </div>
    )

    await user.click(screen.getByRole('button'))
    expect(handleChange).toHaveBeenCalledWith(true)

    await user.click(screen.getByTestId('outside'))
    expect(handleChange).toHaveBeenCalledWith(false)
  })
})

describe('Dropdown - 对齐方式', () => {
  it('应用 start 对齐（左对齐）', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown align="start" content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toHaveClass('left-0')
  })

  it('应用 center 对齐（居中）', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown align="center" content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toHaveClass('left-1/2', '-translate-x-1/2')
  })

  it('应用 end 对齐（右对齐）', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown align="end" content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toHaveClass('right-0')
  })
})

describe('Dropdown - 禁用状态', () => {
  it('禁用时不打开菜单', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown disabled content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('DropdownItem', () => {
  it('渲染菜单项', () => {
    render(
      <div role="menu">
        <DropdownItem>选项1</DropdownItem>
      </div>
    )
    expect(screen.getByRole('menuitem', { name: '选项1' })).toBeInTheDocument()
  })

  it('有正确的角色属性', () => {
    render(
      <div role="menu">
        <DropdownItem>选项</DropdownItem>
      </div>
    )
    expect(screen.getByRole('menuitem')).toBeInTheDocument()
  })

  it('禁用时不响应点击', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <div role="menu">
        <DropdownItem disabled onClick={handleClick}>
          禁用选项
        </DropdownItem>
      </div>
    )

    const item = screen.getByRole('menuitem')
    await user.click(item)

    expect(handleClick).not.toHaveBeenCalled()
  })

  it('danger=true 时应用危险样式', () => {
    render(
      <div role="menu">
        <DropdownItem danger>删除</DropdownItem>
      </div>
    )
    expect(screen.getByRole('menuitem')).toHaveClass('text-error')
  })

  it('渲染图标', () => {
    const icon = <span data-testid="icon">★</span>
    render(
      <div role="menu">
        <DropdownItem icon={icon}>带图标</DropdownItem>
      </div>
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })
})

describe('DropdownSeparator', () => {
  it('渲染分隔线', () => {
    render(
      <div role="menu">
        <DropdownSeparator />
      </div>
    )
    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('有正确的样式', () => {
    render(
      <div role="menu">
        <DropdownSeparator />
      </div>
    )
    expect(screen.getByRole('separator')).toHaveClass('border-t', 'border-neutral-200')
  })
})

describe('Dropdown - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(
      <Dropdown data-testid="dropdown-wrapper" content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )
    // data-testid 传递到外层 div
    expect(screen.getByTestId('dropdown-wrapper')).toBeInTheDocument()
  })

  it('传递其他 HTML 属性', () => {
    render(
      <Dropdown data-testid="test-dropdown" content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )
    expect(screen.getByTestId('test-dropdown')).toBeInTheDocument()
  })
})

describe('Dropdown - 可访问性', () => {
  it('打开时更新 aria-expanded', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    const trigger = screen.getByRole('button')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await user.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('菜单有 role="menu"', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown content={<div>菜单</div>}>
        <button type="button">打开</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
})

describe('Dropdown - 事件传播', () => {
  it('保留触发元素原有的 onClick', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <Dropdown content={<div>菜单</div>}>
        <button type="button" onClick={handleClick}>
          打开
        </button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('Dropdown - 完整示例', () => {
  it('渲染完整的下拉菜单', async () => {
    const user = userEvent.setup()
    render(
      <Dropdown
        content={
          <div className="p-2 bg-white rounded-lg shadow-lg" role="menu">
            <DropdownItem>选项1</DropdownItem>
            <DropdownItem>选项2</DropdownItem>
            <DropdownSeparator />
            <DropdownItem danger>删除</DropdownItem>
          </div>
        }
      >
        <button type="button">菜单</button>
      </Dropdown>
    )

    await user.click(screen.getByRole('button'))

    expect(screen.getByRole('menuitem', { name: '选项1' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '选项2' })).toBeInTheDocument()
    expect(screen.getByRole('separator')).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: '删除' })).toBeInTheDocument()
  })
})
