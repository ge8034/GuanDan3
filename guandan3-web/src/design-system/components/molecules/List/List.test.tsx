/**
 * List 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 列表项内容
 * - 尺寸变化
 * - 边框样式
 * - 交互状态
 * - 头像和额外内容
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { List, ListItem } from './List'

describe('List - 基础渲染', () => {
  it('渲染列表', () => {
    render(
      <List>
        <ListItem title="项目1">描述1</ListItem>
        <ListItem title="项目2">描述2</ListItem>
      </List>
    )

    const list = screen.getByRole('list')
    expect(list).toBeInTheDocument()
    expect(screen.getByText('项目1')).toBeInTheDocument()
    expect(screen.getByText('项目2')).toBeInTheDocument()
  })

  it('使用正确的 role 属性', () => {
    render(
      <List>
        <ListItem title="项目1" />
      </List>
    )

    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})

describe('ListItem - 内容显示', () => {
  it('显示标题', () => {
    render(
      <List>
        <ListItem title="列表项标题" />
      </List>
    )

    expect(screen.getByText('列表项标题')).toBeInTheDocument()
  })

  it('显示描述', () => {
    render(
      <List>
        <ListItem title="标题" description="这是描述内容" />
      </List>
    )

    expect(screen.getByText('这是描述内容')).toBeInTheDocument()
  })

  it('显示额外内容', () => {
    render(
      <List>
        <ListItem
          title="标题"
          extra={<span data-testid="extra">额外内容</span>}
        />
      </List>
    )

    expect(screen.getByTestId('extra')).toBeInTheDocument()
  })

  it('显示头像', () => {
    render(
      <List>
        <ListItem
          title="标题"
          avatar={<div data-testid="avatar">头像</div>}
        />
      </List>
    )

    expect(screen.getByTestId('avatar')).toBeInTheDocument()
  })
})

describe('List - 尺寸变化', () => {
  it('应用 small 尺寸', () => {
    const { container } = render(
      <List size="small">
        <ListItem title="项目" />
      </List>
    )

    const list = container.querySelector('.space-y-1')
    expect(list).toBeInTheDocument()
  })

  it('应用 medium 尺寸（默认）', () => {
    const { container } = render(
      <List size="medium">
        <ListItem title="项目" />
      </List>
    )

    const list = container.querySelector('.space-y-2')
    expect(list).toBeInTheDocument()
  })

  it('应用 large 尺寸', () => {
    const { container } = render(
      <List size="large">
        <ListItem title="项目" />
      </List>
    )

    const list = container.querySelector('.space-y-3')
    expect(list).toBeInTheDocument()
  })
})

describe('List - 边框样式', () => {
  it('bordered=false 时不显示分隔线', () => {
    const { container } = render(
      <List bordered={false}>
        <ListItem title="项目1" />
        <ListItem title="项目2" />
      </List>
    )

    const list = container.querySelector('.divide-y')
    expect(list).not.toBeInTheDocument()
  })

  it('bordered=true 时显示分隔线', () => {
    const { container } = render(
      <List bordered={true}>
        <ListItem title="项目1" />
        <ListItem title="项目2" />
      </List>
    )

    const list = container.querySelector('.divide-y')
    expect(list).toBeInTheDocument()
  })
})

describe('ListItem - 交互状态', () => {
  it('clickable=true 时可点击', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(
      <List>
        <ListItem title="项目" clickable onClick={handleClick} />
      </List>
    )

    const item = screen.getByRole('listitem')
    await user.click(item)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled=true 时有视觉反馈', () => {
    render(
      <List>
        <ListItem title="项目" disabled />
      </List>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('opacity-50')
  })

  it('disabled 时有视觉反馈', () => {
    render(
      <List>
        <ListItem title="项目" disabled />
      </List>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('opacity-50')
  })

  it('clickable 时有 hover 效果', () => {
    render(
      <List>
        <ListItem title="项目" clickable />
      </List>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('hover:bg-neutral-50')
  })
})

describe('List - 样式', () => {
  it('列表项有正确的布局', () => {
    render(
      <List>
        <ListItem title="项目" />
      </List>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('flex', 'items-center', 'gap-3')
  })

  it('标题有正确的样式', () => {
    render(
      <List>
        <ListItem title="标题文本" />
      </List>
    )

    expect(screen.getByText('标题文本')).toHaveClass('text-base', 'font-medium')
  })

  it('描述有正确的样式', () => {
    render(
      <List>
        <ListItem title="标题" description="描述文本" />
      </List>
    )

    expect(screen.getByText('描述文本')).toHaveClass('text-sm', 'text-neutral-500')
  })
})

describe('List - 自定义类名', () => {
  it('List 支持自定义 className', () => {
    render(
      <List className="custom-list">
        <ListItem title="项目" />
      </List>
    )

    expect(screen.getByRole('list')).toHaveClass('custom-list')
  })

  it('ListItem 支持自定义 className', () => {
    render(
      <List>
        <ListItem className="custom-item" title="项目" />
      </List>
    )

    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('custom-item')
  })

  it('传递其他 HTML 属性', () => {
    render(
      <List data-testid="test-list">
        <ListItem title="项目" />
      </List>
    )

    expect(screen.getByTestId('test-list')).toBeInTheDocument()
  })
})

describe('List - 完整示例', () => {
  it('渲染联系人列表', () => {
    render(
      <List bordered>
        <ListItem
          title="张三"
          description="zhang@example.com"
          extra={<button type="button">编辑</button>}
          avatar={<div className="w-10 h-10 bg-blue-500 rounded-full" />}
        />
        <ListItem
          title="李四"
          description="lisi@example.com"
          extra={<button type="button">编辑</button>}
          avatar={<div className="w-10 h-10 bg-green-500 rounded-full" />}
        />
      </List>
    )

    expect(screen.getByText('张三')).toBeInTheDocument()
    expect(screen.getByText('李四')).toBeInTheDocument()
    expect(screen.getAllByText('编辑')).toHaveLength(2)
  })

  it('渲染新闻列表', () => {
    render(
      <List size="large">
        <ListItem
          title="重要新闻标题"
          description="新闻描述内容，包含更多详细信息"
          extra={<span className="text-sm text-neutral-500">1小时前</span>}
        />
        <ListItem
          title="普通新闻标题"
          description="普通新闻描述"
          extra={<span className="text-sm text-neutral-500">昨天</span>}
        />
      </List>
    )
  })
})
