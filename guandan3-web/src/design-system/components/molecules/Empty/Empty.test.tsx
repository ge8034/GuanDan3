/**
 * Empty 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 内容显示
 * - 自定义图片
 * - 操作按钮
 * - 尺寸变化
 * - 样式
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Empty } from './Empty'

describe('Empty - 基础渲染', () => {
  it('渲染空状态组件', () => {
    render(<Empty />)
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })

  it('使用默认标题', () => {
    render(<Empty />)
    expect(screen.getByText('暂无数据')).toBeInTheDocument()
  })
})

describe('Empty - 内容显示', () => {
  it('显示自定义标题', () => {
    render(<Empty title="搜索无结果" />)
    expect(screen.getByText('搜索无结果')).toBeInTheDocument()
  })

  it('显示描述文本', () => {
    render(
      <Empty
        title="标题"
        description="这是描述信息"
      />
    )
    expect(screen.getByText('这是描述信息')).toBeInTheDocument()
  })

  it('不显示描述时只显示标题', () => {
    render(<Empty title="只有标题" />)
    expect(screen.getByText('只有标题')).toBeInTheDocument()
    const description = screen.queryByText('暂无描述')
    expect(description).not.toBeInTheDocument()
  })
})

describe('Empty - 自定义图片', () => {
  it('显示默认插图', () => {
    render(<Empty />)
    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('显示自定义图片', () => {
    const customImage = <div data-testid="custom-image">自定义图片</div>
    render(<Empty image={customImage} />)
    expect(screen.getByTestId('custom-image')).toBeInTheDocument()
  })

  it('不显示默认插图时使用自定义图片', () => {
    const customImage = <div data-testid="custom-image">图片</div>
    render(<Empty image={customImage} />)
    expect(screen.getByTestId('custom-image')).toBeInTheDocument()
    const defaultSvg = document.querySelector('svg[viewBox="0 0 200 200"]')
    expect(defaultSvg).not.toBeInTheDocument()
  })
})

describe('Empty - 操作按钮', () => {
  it('显示操作按钮', () => {
    render(
      <Empty
        title="标题"
        action={<button type="button">创建</button>}
      />
    )
    expect(screen.getByRole('button', { name: '创建' })).toBeInTheDocument()
  })

  it('不显示操作按钮时只显示内容', () => {
    render(<Empty />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})

describe('Empty - 尺寸变化', () => {
  it('应用 small 尺寸', () => {
    const { container } = render(<Empty size="small" />)
    const wrapper = container.querySelector('.py-8')
    expect(wrapper).toBeInTheDocument()
  })

  it('应用 medium 尺寸（默认）', () => {
    const { container } = render(<Empty size="medium" />)
    const wrapper = container.querySelector('.py-12')
    expect(wrapper).toBeInTheDocument()
  })

  it('应用 large 尺寸', () => {
    const { container } = render(<Empty size="large" />)
    const wrapper = container.querySelector('.py-16')
    expect(wrapper).toBeInTheDocument()
  })
})

describe('Empty - 样式', () => {
  it('有正确的布局样式', () => {
    const { container } = render(<Empty />)
    const wrapper = container.querySelector('.flex.flex-col.items-center')
    expect(wrapper).toBeInTheDocument()
  })

  it('标题有正确的样式', () => {
    render(<Empty title="标题文本" />)
    const title = screen.getByText('标题文本')
    expect(title).toHaveClass('text-base', 'font-medium')
  })

  it('描述有正确的样式', () => {
    render(
      <Empty
        title="标题"
        description="描述文本"
      />
    )
    const description = screen.getByText('描述文本')
    expect(description).toHaveClass('text-sm', 'text-neutral-500')
  })
})

describe('Empty - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Empty className="custom-empty" />)
    const wrapper = document.querySelector('.custom-empty')
    expect(wrapper).toBeInTheDocument()
  })

  it('传递其他 HTML 属性', () => {
    render(<Empty data-testid="test-empty" />)
    expect(screen.getByTestId('test-empty')).toBeInTheDocument()
  })
})

describe('Empty - 完整示例', () => {
  it('渲染完整的空状态', () => {
    render(
      <Empty
        title="购物车为空"
        description="快去选购心仪的商品吧"
        action={<button type="button">去购物</button>}
      />
    )

    expect(screen.getByText('购物车为空')).toBeInTheDocument()
    expect(screen.getByText('快去选购心仪的商品吧')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '去购物' })).toBeInTheDocument()
  })
})
