/**
 * Pagination 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 页码计算
 * - 省略号显示
 * - 禁用状态
 * - 回调函数
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Pagination } from './Pagination'

describe('Pagination - 基础渲染', () => {
  it('渲染分页导航', () => {
    render(<Pagination current={1} total={10} />)
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('有正确的 aria-label', () => {
    render(<Pagination current={1} total={10} />)
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '分页导航')
  })

  it('渲染上一页和下一页按钮', () => {
    render(<Pagination current={5} total={10} />)
    expect(screen.getByRole('button', { name: '上一页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument()
  })
})

describe('Pagination - 页码计算', () => {
  it('显示当前页周围的页码', () => {
    render(<Pagination current={5} total={10} pageSize={7} />)
    expect(screen.getByRole('button', { name: '第 2 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 5 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 8 页' })).toBeInTheDocument()
  })

  it('当前页为第一页时正确显示', () => {
    render(<Pagination current={1} total={5} />)
    expect(screen.getByRole('button', { name: '第 1 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 1 页' })).toHaveClass('bg-poker-table-500')
  })

  it('当前页为最后一页时正确显示', () => {
    render(<Pagination current={5} total={5} />)
    expect(screen.getByRole('button', { name: '第 5 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 5 页' })).toHaveClass('bg-poker-table-500')
  })

  it('总页数小于 pageSize 时显示所有页码', () => {
    render(<Pagination current={1} total={3} pageSize={7} />)
    expect(screen.getByRole('button', { name: '第 1 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 2 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 3 页' })).toBeInTheDocument()
  })
})

describe('Pagination - 省略号', () => {
  it('页码较多时显示省略号', () => {
    render(<Pagination current={5} total={20} pageSize={5} />)
    const ellipsis = screen.queryAllByText('...')
    expect(ellipsis.length).toBeGreaterThan(0)
  })

  it('showEllipsis=false 时不显示省略号', () => {
    render(<Pagination current={5} total={20} pageSize={5} showEllipsis={false} />)
    // 没有省略号
    const ellipsis = screen.queryAllByText('...')
    expect(ellipsis.length).toBe(0)
  })

  it('在开头和结尾显示省略号', () => {
    render(<Pagination current={10} total={20} pageSize={5} />)
    const ellipsis = screen.queryAllByText('...')
    expect(ellipsis.length).toBeGreaterThan(0)
  })
})

describe('Pagination - 禁用状态', () => {
  it('第一页时上一页按钮禁用', () => {
    render(<Pagination current={1} total={5} />)
    const prevButton = screen.getByRole('button', { name: '上一页' })
    expect(prevButton).toBeDisabled()
  })

  it('最后一页时下一页按钮禁用', () => {
    render(<Pagination current={5} total={5} />)
    const nextButton = screen.getByRole('button', { name: '下一页' })
    expect(nextButton).toBeDisabled()
  })

  it('disabled=true 时所有按钮禁用', () => {
    render(<Pagination current={3} total={10} disabled />)
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toBeDisabled()
    })
  })
})

describe('Pagination - 回调函数', () => {
  it('点击页码触发 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Pagination current={1} total={10} onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: '第 3 页' }))
    expect(handleChange).toHaveBeenCalledWith(3)
  })

  it('点击上一页触发 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Pagination current={5} total={10} onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: '上一页' }))
    expect(handleChange).toHaveBeenCalledWith(4)
  })

  it('点击下一页触发 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Pagination current={5} total={10} onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: '下一页' }))
    expect(handleChange).toHaveBeenCalledWith(6)
  })

  it('点击当前页不触发 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(<Pagination current={5} total={10} onChange={handleChange} />)

    await user.click(screen.getByRole('button', { name: '第 5 页' }))
    expect(handleChange).not.toHaveBeenCalled()
  })
})

describe('Pagination - 自定义配置', () => {
  it('自定义上一页/下一页文本', () => {
    render(
      <Pagination current={2} total={5} prevText="<" nextText=">" />
    )
    // 通过查找包含文本的按钮来验证
    const buttons = screen.getAllByRole('button')
    const prevButton = buttons.find(btn => btn.textContent === '<')
    const nextButton = buttons.find(btn => btn.textContent === '>')
    expect(prevButton).toBeInTheDocument()
    expect(nextButton).toBeInTheDocument()
  })

  it('showTotal=true 时显示总数', () => {
    render(<Pagination current={1} total={10} showTotal />)
    expect(screen.getByText('共 10 页')).toBeInTheDocument()
  })

  it('自定义 pageSize', () => {
    render(<Pagination current={5} total={20} pageSize={3} />)
    // pageSize=3 应该只显示 3 个页码（加上可能的首尾页）
    const pageButtons = screen.queryAllByRole('button').filter(
      btn => btn.getAttribute('aria-label')?.startsWith('第')
    )
    expect(pageButtons.length).toBeLessThanOrEqual(5)
  })
})

describe('Pagination - 可访问性', () => {
  it('页码按钮有正确的 aria-label', () => {
    render(<Pagination current={1} total={5} />)
    expect(screen.getByRole('button', { name: '第 1 页' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '第 2 页' })).toBeInTheDocument()
  })

  it('当前页有 aria-current="page"', () => {
    render(<Pagination current={3} total={5} />)
    expect(screen.getByRole('button', { name: '第 3 页' })).toHaveAttribute('aria-current', 'page')
  })
})

describe('Pagination - 样式', () => {
  it('当前页有高亮样式', () => {
    render(<Pagination current={3} total={5} />)
    const currentPage = screen.getByRole('button', { name: '第 3 页' })
    expect(currentPage).toHaveClass('bg-poker-table-500', 'text-white', 'font-medium')
  })

  it('非当前页有默认样式', () => {
    render(<Pagination current={3} total={5} />)
    const otherPage = screen.getByRole('button', { name: '第 1 页' })
    expect(otherPage).toHaveClass('text-neutral-700', 'hover:bg-neutral-100')
  })
})

describe('Pagination - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Pagination current={1} total={5} className="custom-pagination" />)
    expect(screen.getByRole('navigation')).toHaveClass('custom-pagination')
  })

  it('传递其他 HTML 属性', () => {
    render(<Pagination current={1} total={5} data-testid="test-pagination" />)
    expect(screen.getByTestId('test-pagination')).toBeInTheDocument()
  })
})

describe('Pagination - 边缘情况', () => {
  it('只有一页时显示页码', () => {
    render(<Pagination current={1} total={1} />)
    expect(screen.getByRole('button', { name: '第 1 页' })).toBeInTheDocument()
  })

  it('总页数为0时不显示内容', () => {
    const { container } = render(<Pagination current={1} total={0} />)
    expect(container.querySelector('nav')).toBeNull()
  })
})
