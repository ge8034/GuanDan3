/**
 * Popover 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 点击触发
 * - 悬停触发
 * - 位置变化
 * - 箭头显示
 * - 外部点击关闭
 * - ESC 键关闭
 * - 禁用状态
 * - 受控模式
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Popover } from './Popover'

describe('Popover - 基础渲染', () => {
  it('渲染触发器和内容', () => {
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>弹出内容</div>}
      />
    )

    expect(screen.getByText('触发器')).toBeInTheDocument()
    // 默认不显示内容
    expect(screen.queryByText('弹出内容')).not.toBeInTheDocument()
  })

  it('使用 children 作为触发器', () => {
    render(
      <Popover content={<div>内容</div>}>
        <button>按钮</button>
      </Popover>
    )

    expect(screen.getByText('按钮')).toBeInTheDocument()
  })
})

describe('Popover - 点击触发', () => {
  it('点击打开弹出层', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>弹出内容</div>}
        triggerMode="click"
      />
    )

    await user.click(screen.getByText('触发器'))

    expect(screen.getByText('弹出内容')).toBeInTheDocument()
  })

  it('再次点击关闭弹出层', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>弹出内容</div>}
        triggerMode="click"
      />
    )

    const trigger = screen.getByText('触发器')
    await user.click(trigger)
    expect(screen.getByText('弹出内容')).toBeInTheDocument()

    await user.click(trigger)
    expect(screen.queryByText('弹出内容')).not.toBeInTheDocument()
  })

  it('closeOnClick=false 点击内容不关闭', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={
          <div>
            <button>内容按钮</button>
          </div>
        }
        triggerMode="click"
        closeOnClick={false}
      />
    )

    await user.click(screen.getByText('触发器'))
    expect(screen.getByText('内容按钮')).toBeInTheDocument()

    await user.click(screen.getByText('内容按钮'))
    // 内容应该仍然显示
    expect(screen.getByText('内容按钮')).toBeInTheDocument()
  })
})

describe('Popover - 悬停触发', () => {
  it('鼠标悬停打开弹出层', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>弹出内容</div>}
        triggerMode="hover"
      />
    )

    const trigger = screen.getByText('触发器')
    await user.hover(trigger)

    await waitFor(() => {
      expect(screen.getByText('弹出内容')).toBeInTheDocument()
    })
  })

  it('鼠标离开关闭弹出层', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>弹出内容</div>}
        triggerMode="hover"
      />
    )

    const trigger = screen.getByText('触发器')
    await user.hover(trigger)

    await waitFor(() => {
      expect(screen.getByText('弹出内容')).toBeInTheDocument()
    })

    await user.unhover(trigger)

    await waitFor(() => {
      expect(screen.queryByText('弹出内容')).not.toBeInTheDocument()
    })
  })
})

describe('Popover - 位置变化', () => {
  it('placement=top', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        placement="top"
      />
    )

    await user.click(screen.getByText('触发器'))

    const popover = screen.getByText('内容').closest('.fixed')
    expect(popover).toBeInTheDocument()
  })

  it('placement=bottom', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        placement="bottom"
      />
    )

    await user.click(screen.getByText('触发器'))

    const popover = screen.getByText('内容').closest('.fixed')
    expect(popover).toBeInTheDocument()
  })
})

describe('Popover - 箭头显示', () => {
  it('showArrow=true 显示箭头', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        showArrow
      />
    )

    await user.click(screen.getByText('触发器'))

    const arrow = document.querySelector('.rotate-45')
    expect(arrow).toBeInTheDocument()
  })

  it('showArrow=false 不显示箭头', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        showArrow={false}
      />
    )

    await user.click(screen.getByText('触发器'))

    const arrow = document.querySelector('.rotate-45')
    expect(arrow).not.toBeInTheDocument()
  })
})

describe('Popover - 外部点击关闭', () => {
  it('点击外部区域关闭弹出层', async () => {
    const user = userEvent.setup()
    render(
      <div>
        <Popover
          trigger={<button>触发器</button>}
          content={<div>弹出内容</div>}
        />
        <button>外部按钮</button>
      </div>
    )

    // 打开弹出层
    await user.click(screen.getByText('触发器'))
    expect(screen.getByText('弹出内容')).toBeInTheDocument()

    // 点击外部
    await user.click(screen.getByText('外部按钮'))

    expect(screen.queryByText('弹出内容')).not.toBeInTheDocument()
  })
})

describe('Popover - ESC 键关闭', () => {
  it('按 ESC 键关闭弹出层', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>弹出内容</div>}
      />
    )

    await user.click(screen.getByText('触发器'))
    expect(screen.getByText('弹出内容')).toBeInTheDocument()

    await user.keyboard('{Escape}')

    expect(screen.queryByText('弹出内容')).not.toBeInTheDocument()
  })
})

describe('Popover - 禁用状态', () => {
  it('disabled=true 禁用弹出层', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        disabled
      />
    )

    await user.click(screen.getByText('触发器'))

    expect(screen.queryByText('内容')).not.toBeInTheDocument()
  })

  it('disabled 触发器有禁用样式', () => {
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        disabled
      />
    )

    const trigger = screen.getByText('触发器').closest('.cursor-not-allowed')
    expect(trigger).toBeInTheDocument()
  })
})

describe('Popover - 受控模式', () => {
  it('open 属性控制显示状态', () => {
    const { rerender } = render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        open={false}
      />
    )

    expect(screen.queryByText('内容')).not.toBeInTheDocument()

    rerender(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        open={true}
      />
    )

    expect(screen.getByText('内容')).toBeInTheDocument()
  })

  it('点击时调用 onOpenChange', async () => {
    const user = userEvent.setup()
    const handleOpenChange = vi.fn()

    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        open={false}
        onOpenChange={handleOpenChange}
      />
    )

    await user.click(screen.getByText('触发器'))

    // 由于是受控模式，需要父组件更新 open 属性
    expect(handleOpenChange).toHaveBeenCalledWith(true)
  })
})

describe('Popover - 非受控模式', () => {
  it('defaultOpen 设置初始状态', () => {
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        defaultOpen
      />
    )

    expect(screen.getByText('内容')).toBeInTheDocument()
  })
})

describe('Popover - 自定义类名', () => {
  it('支持 popoverClassName', () => {
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        open={true}
        popoverClassName="custom-popover"
      />
    )

    const popover = document.querySelector('.custom-popover')
    expect(popover).toBeInTheDocument()
  })

  it('支持 triggerClassName', () => {
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        triggerClassName="custom-trigger"
      />
    )

    const trigger = screen.getByText('触发器').closest('.custom-trigger')
    expect(trigger).toBeInTheDocument()
  })
})

describe('Popover - 内容宽度', () => {
  it('contentWidth=auto 自动宽度', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        contentWidth="auto"
      />
    )

    await user.click(screen.getByText('触发器'))

    const popover = screen.getByText('内容').closest('.fixed') as HTMLElement
    expect(popover).toBeInTheDocument()
  })

  it('contentWidth 为数字时设置固定宽度', async () => {
    const user = userEvent.setup()
    render(
      <Popover
        trigger={<button>触发器</button>}
        content={<div>内容</div>}
        contentWidth={300}
      />
    )

    await user.click(screen.getByText('触发器'))

    const popover = screen.getByText('内容').closest('.fixed') as HTMLElement
    expect(popover.style.width).toBe('300px')
  })
})
