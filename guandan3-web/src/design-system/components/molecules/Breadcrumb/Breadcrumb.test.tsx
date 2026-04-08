/**
 * Breadcrumb 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 链接和当前页
 * - 自定义分隔符
 * - 可访问性
 * - 辅助函数
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Breadcrumb, BreadcrumbItem, createBreadcrumbItems } from './Breadcrumb'

describe('Breadcrumb - 基础渲染', () => {
  it('渲染面包屑导航', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
        <BreadcrumbItem current>当前页</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('有正确的 aria-label', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '面包屑导航')
  })

  it('渲染列表元素', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
        <BreadcrumbItem>分类</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByRole('list')).toBeInTheDocument()
  })
})

describe('BreadcrumbItem', () => {
  it('渲染普通项', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByText('首页')).toBeInTheDocument()
  })

  it('带链接的项', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
      </Breadcrumb>
    )
    const link = screen.getByRole('link', { name: '首页' })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
  })

  it('当前页有正确的样式', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem current>当前页</BreadcrumbItem>
      </Breadcrumb>
    )
    const current = screen.getByText('当前页')
    expect(current).toHaveClass('text-neutral-900', 'font-medium')
  })

  it('当前页设置 aria-current', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
        <BreadcrumbItem current>当前页</BreadcrumbItem>
      </Breadcrumb>
    )

    const link = screen.getByRole('link')
    expect(link).not.toHaveAttribute('aria-current')

    const current = screen.getByText('当前页')
    expect(current).toHaveAttribute('aria-current', 'page')
  })

  it('显示分隔符', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
        <BreadcrumbItem>分类</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByText('/')).toBeInTheDocument()
  })

  it('最后一项不显示分隔符', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
      </Breadcrumb>
    )
    // 只有一项，没有分隔符
    expect(screen.queryByText('/')).not.toBeInTheDocument()
  })
})

describe('Breadcrumb - 自定义分隔符', () => {
  it('支持自定义分隔符', () => {
    render(
      <Breadcrumb separator=">">
        <BreadcrumbItem>首页</BreadcrumbItem>
        <BreadcrumbItem>分类</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByText('>')).toBeInTheDocument()
  })

  it('分隔符有 aria-hidden', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
        <BreadcrumbItem>分类</BreadcrumbItem>
      </Breadcrumb>
    )
    const separator = screen.getByText('/')
    expect(separator).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('Breadcrumb - 辅助函数', () => {
  it('createBreadcrumbItems 创建面包屑列表', () => {
    const items = [
      { label: '首页', href: '/' },
      { label: '分类', href: '/category' },
      { label: '当前页' },
    ]

    render(<Breadcrumb>{createBreadcrumbItems(items)}</Breadcrumb>)

    expect(screen.getByRole('link', { name: '首页' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '分类' })).toBeInTheDocument()
    expect(screen.getByText('当前页')).toBeInTheDocument()
  })

  it('createBreadcrumbItems 正确标记当前页', () => {
    const items = [
      { label: '首页', href: '/' },
      { label: '当前页' },
    ]

    render(<Breadcrumb>{createBreadcrumbItems(items)}</Breadcrumb>)

    const current = screen.getByText('当前页')
    expect(current).toHaveAttribute('aria-current', 'page')
  })
})

describe('Breadcrumb - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(
      <Breadcrumb className="custom-breadcrumb">
        <BreadcrumbItem>首页</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByRole('navigation')).toHaveClass('custom-breadcrumb')
  })

  it('BreadcrumbItem 支持自定义 className', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem className="custom-item">首页</BreadcrumbItem>
      </Breadcrumb>
    )
    const item = screen.getByRole('listitem')
    expect(item).toHaveClass('custom-item')
  })

  it('传递其他 HTML 属性', () => {
    render(
      <Breadcrumb data-testid="test-breadcrumb">
        <BreadcrumbItem>首页</BreadcrumbItem>
      </Breadcrumb>
    )
    expect(screen.getByTestId('test-breadcrumb')).toBeInTheDocument()
  })
})

describe('Breadcrumb - 可访问性', () => {
  it('使用语义化 HTML 元素', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
        <BreadcrumbItem current>当前页</BreadcrumbItem>
      </Breadcrumb>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
    expect(screen.getByRole('list')).toBeInTheDocument()
  })

  it('链接项使用 <a> 标签', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
      </Breadcrumb>
    )

    expect(screen.getByRole('link')).toBeInTheDocument()
  })
})

describe('Breadcrumb - 样式', () => {
  it('有正确的默认样式', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem>首页</BreadcrumbItem>
      </Breadcrumb>
    )

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('flex', 'items-center', 'gap-2', 'text-sm')
  })

  it('链接有 hover 状态', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
      </Breadcrumb>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveClass('hover:text-neutral-900')
  })
})

describe('Breadcrumb - 完整示例', () => {
  it('渲染多级面包屑', () => {
    render(
      <Breadcrumb>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
        <BreadcrumbItem href="/products">产品</BreadcrumbItem>
        <BreadcrumbItem href="/products/electronics">电子产品</BreadcrumbItem>
        <BreadcrumbItem current>手机</BreadcrumbItem>
      </Breadcrumb>
    )

    expect(screen.getByRole('link', { name: '首页' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '产品' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '电子产品' })).toBeInTheDocument()
    expect(screen.getByText('手机')).toBeInTheDocument()
  })
})
