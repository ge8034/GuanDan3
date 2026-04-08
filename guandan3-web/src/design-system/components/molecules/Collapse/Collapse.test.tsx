/**
 * Collapse 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 展开收起功能
 * - 手风琴模式
 * - 禁用状态
 * - 关闭功能
 * - 额外内容
 * - 自定义图标
 * - 变化回调
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Collapse, CollapseItem } from './Collapse'

describe('Collapse - 基础渲染', () => {
  it('渲染折叠面板', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1">
          内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          内容2
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('面板1')).toBeInTheDocument()
    expect(screen.getByText('面板2')).toBeInTheDocument()
  })

  it('默认不展开任何面板', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1">
          隐藏内容
        </CollapseItem>
      </Collapse>
    )

    // 默认情况下内容不显示（因为不在 activeKeys 中）
    expect(screen.queryByText('隐藏内容')).not.toBeInTheDocument()
  })
})

describe('Collapse - 默认展开', () => {
  it('支持 defaultActiveKey 为字符串', () => {
    render(
      <Collapse defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1">
          展开内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          隐藏内容2
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('展开内容1')).toBeInTheDocument()
    expect(screen.queryByText('隐藏内容2')).not.toBeInTheDocument()
  })

  it('支持 defaultActiveKey 为数组', () => {
    render(
      <Collapse defaultActiveKey={['1', '2']}>
        <CollapseItem itemKey="1" title="面板1">
          展开内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          展开内容2
        </CollapseItem>
        <CollapseItem itemKey="3" title="面板3">
          隐藏内容3
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('展开内容1')).toBeInTheDocument()
    expect(screen.getByText('展开内容2')).toBeInTheDocument()
    expect(screen.queryByText('隐藏内容3')).not.toBeInTheDocument()
  })
})

describe('Collapse - 点击展开收起', () => {
  it('点击面板头部可展开', async () => {
    const user = userEvent.setup()
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1">
          可展开内容
        </CollapseItem>
      </Collapse>
    )

    expect(screen.queryByText('可展开内容')).not.toBeInTheDocument()

    await user.click(screen.getByText('面板1'))

    expect(screen.getByText('可展开内容')).toBeInTheDocument()
  })

  it('点击已展开面板可收起', async () => {
    const user = userEvent.setup()
    render(
      <Collapse defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1">
          可收起内容
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('可收起内容')).toBeInTheDocument()

    await user.click(screen.getByText('面板1'))

    expect(screen.queryByText('可收起内容')).not.toBeInTheDocument()
  })

  it('触发 onChange 回调', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <Collapse onChange={handleChange}>
        <CollapseItem itemKey="1" title="面板1">
          内容
        </CollapseItem>
      </Collapse>
    )

    await user.click(screen.getByText('面板1'))

    // 非手风琴模式返回数组
    expect(handleChange).toHaveBeenCalledWith(['1'])
  })
})

describe('Collapse - 手风琴模式', () => {
  it('手风琴模式只展开一项', async () => {
    const user = userEvent.setup()
    render(
      <Collapse accordion>
        <CollapseItem itemKey="1" title="面板1">
          内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          内容2
        </CollapseItem>
        <CollapseItem itemKey="3" title="面板3">
          内容3
        </CollapseItem>
      </Collapse>
    )

    // 点击面板1
    await user.click(screen.getByText('面板1'))
    expect(screen.getByText('内容1')).toBeInTheDocument()
    expect(screen.queryByText('内容2')).not.toBeInTheDocument()
    expect(screen.queryByText('内容3')).not.toBeInTheDocument()

    // 点击面板2
    await user.click(screen.getByText('面板2'))
    expect(screen.queryByText('内容1')).not.toBeInTheDocument()
    expect(screen.getByText('内容2')).toBeInTheDocument()
    expect(screen.queryByText('内容3')).not.toBeInTheDocument()
  })

  it('手风琴模式点击已展开项会收起', async () => {
    const user = userEvent.setup()
    render(
      <Collapse accordion defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1">
          内容1
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('内容1')).toBeInTheDocument()

    await user.click(screen.getByText('面板1'))

    expect(screen.queryByText('内容1')).not.toBeInTheDocument()
  })

  it('手风琴模式 onChange 返回单个 key', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <Collapse accordion onChange={handleChange}>
        <CollapseItem itemKey="1" title="面板1">
          内容
        </CollapseItem>
      </Collapse>
    )

    await user.click(screen.getByText('面板1'))

    expect(handleChange).toHaveBeenCalledWith('1')
  })
})

describe('CollapseItem - 禁用状态', () => {
  it('禁用的面板无法点击', async () => {
    const user = userEvent.setup()
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1" disabled>
          内容
        </CollapseItem>
      </Collapse>
    )

    // 找到包含禁用样式的元素
    const header = screen.getByText('面板1').closest('.cursor-not-allowed')
    expect(header).toBeInTheDocument()
    expect(header).toHaveClass('opacity-50')

    // 点击后内容不应该显示
    await user.click(screen.getByText('面板1'))
    expect(screen.queryByText('内容')).not.toBeInTheDocument()
  })

  it('禁用面板有视觉反馈', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1" disabled>
          内容
        </CollapseItem>
      </Collapse>
    )

    const header = screen.getByText('面板1').closest('.cursor-not-allowed')
    expect(header).toHaveClass('opacity-50')
  })
})

describe('CollapseItem - closable 属性', () => {
  it('closable=true 时可以收起', async () => {
    const user = userEvent.setup()
    render(
      <Collapse defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1" closable>
          内容
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('内容')).toBeInTheDocument()

    await user.click(screen.getByText('面板1'))

    expect(screen.queryByText('内容')).not.toBeInTheDocument()
  })

  it('closable=false 时始终显示内容', async () => {
    const user = userEvent.setup()
    render(
      <Collapse defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1" closable={false}>
          始终显示
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByText('始终显示')).toBeInTheDocument()

    // 点击不应该隐藏内容
    await user.click(screen.getByText('面板1'))

    expect(screen.getByText('始终显示')).toBeInTheDocument()
  })
})

describe('CollapseItem - 额外内容', () => {
  it('显示额外内容', () => {
    render(
      <Collapse>
        <CollapseItem
          itemKey="1"
          title="面板1"
          extra={<span data-testid="extra">额外内容</span>}
        >
          内容
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByTestId('extra')).toBeInTheDocument()
    expect(screen.getByText('额外内容')).toBeInTheDocument()
  })

  it('额外内容有正确的样式', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1" extra={<span>额外</span>}>
          内容
        </CollapseItem>
      </Collapse>
    )

    // 样式应用在父容器上
    const extraContainer = screen.getByText('额外').closest('.text-sm')
    expect(extraContainer).toBeInTheDocument()
    expect(extraContainer).toHaveClass('text-neutral-500')
  })
})

describe('CollapseItem - 自定义展开图标', () => {
  it('使用默认展开图标', () => {
    render(
      <Collapse defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1">
          内容
        </CollapseItem>
      </Collapse>
    )

    // 检查是否有默认的 SVG 图标
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
    // 展开状态下图标应该旋转
    expect(svg).toHaveStyle({ transform: 'rotate(180deg)' })
  })

  it('支持自定义展开图标', () => {
    render(
      <Collapse>
        <CollapseItem
          itemKey="1"
          title="面板1"
          expandIcon={<span data-testid="custom-icon">★</span>}
        >
          内容
        </CollapseItem>
      </Collapse>
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    expect(screen.getByText('★')).toBeInTheDocument()
  })

  it('收起状态图标不旋转', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1">
          内容
        </CollapseItem>
      </Collapse>
    )

    const svg = document.querySelector('svg')
    const style = svg?.getAttribute('style')
    // 收起状态没有 style 或不包含 rotate(180deg)
    expect(!style || !style.includes('rotate(180deg)')).toBe(true)
  })
})

describe('Collapse - 多面板同时展开', () => {
  it('非手风琴模式可同时展开多项', async () => {
    const user = userEvent.setup()
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1">
          内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          内容2
        </CollapseItem>
        <CollapseItem itemKey="3" title="面板3">
          内容3
        </CollapseItem>
      </Collapse>
    )

    // 展开面板1
    await user.click(screen.getByText('面板1'))
    expect(screen.getByText('内容1')).toBeInTheDocument()

    // 展开面板2
    await user.click(screen.getByText('面板2'))
    expect(screen.getByText('内容1')).toBeInTheDocument() // 面板1仍然展开
    expect(screen.getByText('内容2')).toBeInTheDocument()

    // 展开面板3
    await user.click(screen.getByText('面板3'))
    expect(screen.getByText('内容1')).toBeInTheDocument() // 面板1仍然展开
    expect(screen.getByText('内容2')).toBeInTheDocument() // 面板2仍然展开
    expect(screen.getByText('内容3')).toBeInTheDocument()
  })

  it('非手风琴模式 onChange 返回数组', async () => {
    const user = userEvent.setup()
    const handleChange = vi.fn()
    render(
      <Collapse onChange={handleChange}>
        <CollapseItem itemKey="1" title="面板1">
          内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          内容2
        </CollapseItem>
      </Collapse>
    )

    await user.click(screen.getByText('面板1'))
    expect(handleChange).toHaveBeenLastCalledWith(['1'])

    await user.click(screen.getByText('面板2'))
    expect(handleChange).toHaveBeenLastCalledWith(['1', '2'])
  })
})

describe('Collapse - 样式和布局', () => {
  it('面板之间有分隔线', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板1">
          内容1
        </CollapseItem>
        <CollapseItem itemKey="2" title="面板2">
          内容2
        </CollapseItem>
      </Collapse>
    )

    const borders = document.querySelectorAll('.border-b')
    expect(borders.length).toBeGreaterThan(0)
  })

  it('标题有正确的样式', () => {
    render(
      <Collapse>
        <CollapseItem itemKey="1" title="面板标题">
          内容
        </CollapseItem>
      </Collapse>
    )

    const title = screen.getByText('面板标题')
    expect(title).toHaveClass('font-medium', 'text-neutral-900')
  })

  it('内容有正确的样式', () => {
    render(
      <Collapse defaultActiveKey="1">
        <CollapseItem itemKey="1" title="面板1">
          内容文本
        </CollapseItem>
      </Collapse>
    )

    const content = screen.getByText('内容文本')
    expect(content).toHaveClass('text-neutral-600')
  })
})

describe('Collapse - 自定义类名', () => {
  it('Collapse 支持自定义 className', () => {
    render(
      <Collapse className="custom-collapse">
        <CollapseItem itemKey="1" title="面板1">
          内容
        </CollapseItem>
      </Collapse>
    )

    const container = document.querySelector('.custom-collapse')
    expect(container).toBeInTheDocument()
  })

  it('CollapseItem 支持自定义 className', () => {
    render(
      <Collapse>
        <CollapseItem className="custom-item" itemKey="1" title="面板1">
          内容
        </CollapseItem>
      </Collapse>
    )

    const item = document.querySelector('.custom-item')
    expect(item).toBeInTheDocument()
  })
})

describe('CollapseItem - 警告处理', () => {
  it('在 Collapse 外使用时显示警告', () => {
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    render(
      <CollapseItem itemKey="1" title="面板1">
        内容
      </CollapseItem>
    )

    expect(consoleWarn).toHaveBeenCalledWith(
      'CollapseItem must be used within Collapse component'
    )

    consoleWarn.mockRestore()
  })
})
