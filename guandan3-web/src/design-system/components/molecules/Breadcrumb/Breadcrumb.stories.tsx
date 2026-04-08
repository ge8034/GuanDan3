import type { Meta, StoryObj } from '@storybook/react'
import { Breadcrumb, BreadcrumbItem, createBreadcrumbItems } from './Breadcrumb'

const meta: Meta<typeof Breadcrumb> = {
  title: 'Design System/Molecules/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  argTypes: {
    separator: {
      control: 'text',
      description: '分隔符',
    },
  },
}

export default meta
type Story = StoryObj<typeof Breadcrumb>

export const Default: Story = {
  args: {
    children: (
      <>
        <BreadcrumbItem href="/">首页</BreadcrumbItem>
        <BreadcrumbItem current>当前页</BreadcrumbItem>
      </>
    ),
  },
}

export const TwoLevels: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="/">首页</BreadcrumbItem>
      <BreadcrumbItem current>分类</BreadcrumbItem>
    </Breadcrumb>
  ),
}

export const ThreeLevels: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="/">首页</BreadcrumbItem>
      <BreadcrumbItem href="/products">产品</BreadcrumbItem>
      <BreadcrumbItem current>电子产品</BreadcrumbItem>
    </Breadcrumb>
  ),
}

export const DeepNesting: Story = {
  render: () => (
    <Breadcrumb>
      <BreadcrumbItem href="/">首页</BreadcrumbItem>
      <BreadcrumbItem href="/products">产品</BreadcrumbItem>
      <BreadcrumbItem href="/products/electronics">电子产品</BreadcrumbItem>
      <BreadcrumbItem href="/products/electronics/phones">手机</BreadcrumbItem>
      <BreadcrumbItem current>智能手机</BreadcrumbItem>
    </Breadcrumb>
  ),
}

export const ArrowSeparator: Story = {
  render: () => (
    <Breadcrumb separator="›">
      <BreadcrumbItem href="/">首页</BreadcrumbItem>
      <BreadcrumbItem href="/products">产品</BreadcrumbItem>
      <BreadcrumbItem current>详情</BreadcrumbItem>
    </Breadcrumb>
  ),
}

export const ChevronSeparator: Story = {
  render: () => (
    <Breadcrumb separator="»">
      <BreadcrumbItem href="/">首页</BreadcrumbItem>
      <BreadcrumbItem href="/products">产品</BreadcrumbItem>
      <BreadcrumbItem current>详情</BreadcrumbItem>
    </Breadcrumb>
  ),
}

export const DashSeparator: Story = {
  render: () => (
    <Breadcrumb separator="-">
      <BreadcrumbItem href="/">首页</BreadcrumbItem>
      <BreadcrumbItem current>分类</BreadcrumbItem>
    </Breadcrumb>
  ),
}

export const WithHelperFunction: Story = {
  render: () => {
    const items = [
      { label: '首页', href: '/' },
      { label: '产品', href: '/products' },
      { label: '详情页' },
    ]
    return <Breadcrumb>{createBreadcrumbItems(items)}</Breadcrumb>
  },
  parameters: {
    docs: {
      description: {
        story: '使用辅助函数创建面包屑',
      },
    },
  },
}

export const DynamicExample: Story = {
  render: () => {
    // 模拟动态路由数据
    const route = {
      path: ['home', 'shop', 'electronics', 'phones', 'smartphone'],
      labels: {
        home: '首页',
        shop: '商城',
        electronics: '电子产品',
        phones: '手机',
        smartphone: '智能手机',
      },
    }

    return (
      <div className="p-8">
        <Breadcrumb>
          {route.path.map((key, index) => {
            const isLast = index === route.path.length - 1
            const href = index === 0 ? '/' : `/${route.path.slice(1, index + 1).join('/')}`
            return (
              <BreadcrumbItem
                key={key}
                href={isLast ? undefined : href}
                current={isLast}
              >
                {route.labels[key as keyof typeof route.labels]}
              </BreadcrumbItem>
            )
          })}
        </Breadcrumb>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：动态路由面包屑',
      },
    },
  },
}

export const ProductPage: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-4xl">
        <Breadcrumb>
          <BreadcrumbItem href="/">首页</BreadcrumbItem>
          <BreadcrumbItem href="/products">产品中心</BreadcrumbItem>
          <BreadcrumbItem href="/products/electronics">电子数码</BreadcrumbItem>
          <BreadcrumbItem current>无线蓝牙耳机</BreadcrumbItem>
        </Breadcrumb>

        <div className="mt-6">
          <h1 className="text-2xl font-bold">无线蓝牙耳机 Pro</h1>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：产品页面',
      },
    },
  },
}

export const DocumentationStyle: Story = {
  render: () => {
    return (
      <div className="p-8 border-b">
        <Breadcrumb separator="/">
          <BreadcrumbItem href="/">Docs</BreadcrumbItem>
          <BreadcrumbItem href="/components">Components</BreadcrumbItem>
          <BreadcrumbItem href="/components/breadcrumb">Breadcrumb</BreadcrumbItem>
          <BreadcrumbItem current>API Reference</BreadcrumbItem>
        </Breadcrumb>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：文档导航',
      },
    },
  },
}
