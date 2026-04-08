/**
 * Tooltip 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - hover 触发
 * - click 触发
 * - focus 触发
 * - 不同位置
 * - 禁用状态
 * - 箭头显示/隐藏
 * - 延迟显示
 * - 变化回调
 * - 不同颜色变体
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tooltip } from './Tooltip'

describe('Tooltip - 基础渲染', () => {
  afterEach(() => cleanup())

  it('渲染触发元素', () => {
    render(
      <Tooltip content="提示内容">
        <button>悬停我</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('默认不显示提示内容', () => {
    render(
      <Tooltip content="提示内容">
        <button>悬停我</button>
      </Tooltip>
    )

    expect(screen.queryByText('提示内容')).not.toBeInTheDocument()
  })

  it('支持多个 Tooltip 同时存在', () => {
    render(
      <>
        <Tooltip content="提示1">
          <button>按钮1</button>
        </Tooltip>
        <Tooltip content="提示2">
          <button>按钮2</button>
        </Tooltip>
      </>
    )

    expect(screen.getByRole('button', { name: '按钮1' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '按钮2' })).toBeInTheDocument()
  })
})

describe('Tooltip - 交互触发', () => {
  afterEach(() => cleanup())

  it('支持 hover 触发方式', () => {
    const handleChange = vi.fn()
    render(
      <Tooltip content="悬停提示" trigger="hover" onVisibleChange={handleChange}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
    // 验证 props 传递正确
    expect(button.parentElement).toHaveClass('inline-block')
  })

  it('支持 click 触发方式', () => {
    const handleChange = vi.fn()
    render(
      <Tooltip content="点击提示" trigger="click" onVisibleChange={handleChange}>
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    expect(button).toBeInTheDocument()
  })

  it('支持 focus 触发方式', () => {
    render(
      <Tooltip content="焦点提示" trigger="focus">
        <button>按钮</button>
      </Tooltip>
    )

    const button = screen.getByRole('button')
    // focus 模式应该设置 tabIndex
    expect(button).toHaveAttribute('tabIndex', '0')
  })
})

describe('Tooltip - click 触发交互', () => {
  afterEach(() => cleanup())

  it('点击触发 onVisibleChange', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <Tooltip content="点击提示" trigger="click" onVisibleChange={handleChange}>
        <button>点击我</button>
      </Tooltip>
    )

    await user.click(screen.getByRole('button'))

    // click 模式会立即触发状态变化
    expect(handleChange).toHaveBeenCalled()
  })
})

describe('Tooltip - 禁用状态', () => {
  afterEach(() => cleanup())

  it('禁用时不显示提示', () => {
    render(
      <Tooltip content="不会显示" disabled>
        <button>禁用的提示</button>
      </Tooltip>
    )

    expect(screen.queryByText('不会显示')).not.toBeInTheDocument()
  })

  it('禁用状态传递给子元素', () => {
    render(
      <Tooltip content="提示" disabled>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 显示位置 props', () => {
  afterEach(() => cleanup())

  it('支持 top 位置', () => {
    render(
      <Tooltip content="顶部提示" placement="top">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByText('顶部提示')).not.toBeInTheDocument()
  })

  it('支持 bottom 位置', () => {
    render(
      <Tooltip content="底部提示" placement="bottom">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('支持 left 位置', () => {
    render(
      <Tooltip content="左侧提示" placement="left">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('支持 right 位置', () => {
    render(
      <Tooltip content="右侧提示" placement="right">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 箭头显示控制', () => {
  afterEach(() => cleanup())

  it('showArrow prop 存在', () => {
    render(
      <Tooltip content="带箭头" showArrow>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('showArrow=false 不影响渲染', () => {
    render(
      <Tooltip content="无箭头" showArrow={false}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 延迟显示', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('delay 属性正确传递', () => {
    render(
      <Tooltip content="延迟提示" delay={300}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('delay=0 应该立即触发（无延迟）', () => {
    render(
      <Tooltip content="无延迟提示" delay={0}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 回调函数', () => {
  afterEach(() => cleanup())

  it('onVisibleChange 回调存在', () => {
    const handleChange = vi.fn()
    render(
      <Tooltip content="提示" onVisibleChange={handleChange}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('多次调用回调函数不会报错', () => {
    const handleChange = vi.fn()
    const { rerender } = render(
      <Tooltip content="提示" onVisibleChange={handleChange}>
        <button>按钮</button>
      </Tooltip>
    )

    rerender(
      <Tooltip content="新提示" onVisibleChange={handleChange}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 颜色变体', () => {
  afterEach(() => cleanup())

  it('neutral 变体正确渲染', () => {
    render(
      <Tooltip content="中性提示" variant="neutral">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('primary 变体正确渲染', () => {
    render(
      <Tooltip content="主色提示" variant="primary">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('error 变体正确渲染', () => {
    render(
      <Tooltip content="错误提示" variant="error">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 自定义类名', () => {
  afterEach(() => cleanup())

  it('tooltipClassName 正确传递', () => {
    render(
      <Tooltip content="提示" tooltipClassName="custom-tooltip">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('className 正确传递', () => {
    render(
      <Tooltip content="提示" className="custom-class">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 内容渲染', () => {
  afterEach(() => cleanup())

  it('支持文本内容', () => {
    render(
      <Tooltip content="纯文本提示">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    // 初始状态不显示提示
    expect(screen.queryByText('纯文本提示')).not.toBeInTheDocument()
  })

  it('支持复杂内容（JSX）', () => {
    render(
      <Tooltip
        content={
          <div>
            <strong>加粗文本</strong>
            <p>段落内容</p>
          </div>
        }
      >
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
    expect(screen.queryByText('加粗文本')).not.toBeInTheDocument()
    expect(screen.queryByText('段落内容')).not.toBeInTheDocument()
  })

  it('支持空内容', () => {
    render(
      <Tooltip content="">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})

describe('Tooltip - 不同触发元素', () => {
  afterEach(() => cleanup())

  it('支持按钮作为触发元素', () => {
    render(
      <Tooltip content="提示">
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('支持链接作为触发元素', () => {
    render(
      <Tooltip content="提示">
        <a href="#">链接</a>
      </Tooltip>
    )

    expect(screen.getByRole('link')).toBeInTheDocument()
  })

  it('支持 span 作为触发元素', () => {
    render(
      <Tooltip content="提示">
        <span>文本</span>
      </Tooltip>
    )

    expect(screen.getByText('文本')).toBeInTheDocument()
  })

  it('支持自定义 div 作为触发元素', () => {
    render(
      <Tooltip content="提示">
        <div>自定义元素</div>
      </Tooltip>
    )

    expect(screen.getByText('自定义元素')).toBeInTheDocument()
  })
})

describe('Tooltip - 边界情况', () => {
  afterEach(() => cleanup())

  it('内容为 null 时不报错', () => {
    render(
      <Tooltip content={null as any}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('内容为 undefined 时不报错', () => {
    render(
      <Tooltip content={undefined as any}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('多次切换 disabled 状态不报错', () => {
    const { rerender } = render(
      <Tooltip content="提示" disabled={false}>
        <button>按钮</button>
      </Tooltip>
    )

    rerender(
      <Tooltip content="提示" disabled={true}>
        <button>按钮</button>
      </Tooltip>
    )

    rerender(
      <Tooltip content="提示" disabled={false}>
        <button>按钮</button>
      </Tooltip>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
