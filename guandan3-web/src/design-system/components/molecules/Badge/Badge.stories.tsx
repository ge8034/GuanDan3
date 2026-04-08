import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Molecules/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: 'number',
      description: '显示的数字',
    },
    max: {
      control: 'number',
      description: '最大显示数字',
    },
    dot: {
      control: 'boolean',
      description: '是否显示为圆点',
    },
    color: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'error'],
      description: '徽章颜色',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '徽章大小',
    },
    position: {
      control: 'select',
      options: ['top-right', 'top-left', 'bottom-right', 'bottom-left'],
      description: '徽章位置',
    },
    showZero: {
      control: 'boolean',
      description: '是否为零时显示',
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  render: () => <Badge count={5} />,
}

export const WithChildren: Story = {
  render: () => (
    <div className="p-8 flex gap-8 items-center">
      <Badge count={5}>
        <button className="px-4 py-2 bg-neutral-100 rounded">消息</button>
      </Badge>

      <Badge count={10}>
        <button className="px-4 py-2 bg-neutral-100 rounded">通知</button>
      </Badge>

      <Badge count={99}>
        <button className="px-4 py-2 bg-neutral-100 rounded">邮件</button>
      </Badge>
    </div>
  ),
}

export const Dot: Story = {
  render: () => (
    <div className="p-8 flex gap-8 items-center">
      <Badge dot count={1}>
        <button className="px-4 py-2 bg-neutral-100 rounded">消息</button>
      </Badge>

      <Badge dot count={5}>
        <button className="px-4 py-2 bg-neutral-100 rounded">通知</button>
      </Badge>

      <Badge dot count={0}>
        <button className="px-4 py-2 bg-neutral-100 rounded">已读</button>
      </Badge>
    </div>
  ),
}

export const Colors: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex gap-4">
        <Badge count={5} color="neutral">
          <button className="px-4 py-2 bg-neutral-100 rounded">Neutral</button>
        </Badge>

        <Badge count={5} color="primary">
          <button className="px-4 py-2 bg-neutral-100 rounded">Primary</button>
        </Badge>

        <Badge count={5} color="success">
          <button className="px-4 py-2 bg-neutral-100 rounded">Success</button>
        </Badge>

        <Badge count={5} color="warning">
          <button className="px-4 py-2 bg-neutral-100 rounded">Warning</button>
        </Badge>

        <Badge count={5} color="error">
          <button className="px-4 py-2 bg-neutral-100 rounded">Error</button>
        </Badge>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="flex gap-6 items-center">
        <span className="text-sm text-neutral-600">Small:</span>
        <Badge count={5} size="small">
          <button className="px-3 py-1.5 bg-neutral-100 rounded text-sm">小按钮</button>
        </Badge>
      </div>

      <div className="flex gap-6 items-center">
        <span className="text-sm text-neutral-600">Medium:</span>
        <Badge count={5} size="medium">
          <button className="px-4 py-2 bg-neutral-100 rounded">中按钮</button>
        </Badge>
      </div>

      <div className="flex gap-6 items-center">
        <span className="text-sm text-neutral-600">Large:</span>
        <Badge count={5} size="large">
          <button className="px-5 py-2.5 bg-neutral-100 rounded text-lg">大按钮</button>
        </Badge>
      </div>
    </div>
  ),
}

export const Max: Story = {
  render: () => (
    <div className="p-8 flex gap-8 items-center">
      <Badge count={99} max={99}>
        <button className="px-4 py-2 bg-neutral-100 rounded">99</button>
      </Badge>

      <Badge count={100} max={99}>
        <button className="px-4 py-2 bg-neutral-100 rounded">100</button>
      </Badge>

      <Badge count={1000} max={99}>
        <button className="px-4 py-2 bg-neutral-100 rounded">1000</button>
      </Badge>

      <Badge count={1000} max={999}>
        <button className="px-4 py-2 bg-neutral-100 rounded">max=999</button>
      </Badge>
    </div>
  ),
}

export const Positions: Story = {
  render: () => (
    <div className="p-8 grid grid-cols-2 gap-8">
      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600 w-24">Top-Right:</span>
        <Badge count={5} position="top-right">
          <button className="px-4 py-2 bg-neutral-100 rounded">按钮</button>
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600 w-24">Top-Left:</span>
        <Badge count={5} position="top-left">
          <button className="px-4 py-2 bg-neutral-100 rounded">按钮</button>
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600 w-24">Bottom-Right:</span>
        <Badge count={5} position="bottom-right">
          <button className="px-4 py-2 bg-neutral-100 rounded">按钮</button>
        </Badge>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm text-neutral-600 w-24">Bottom-Left:</span>
        <Badge count={5} position="bottom-left">
          <button className="px-4 py-2 bg-neutral-100 rounded">按钮</button>
        </Badge>
      </div>
    </div>
  ),
}

export const Status: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex gap-8">
        <Badge status="default" content="默认" />
        <Badge status="success" content="成功" />
        <Badge status="processing" content="处理中" />
        <Badge status="error" content="错误" />
        <Badge status="warning" content="警告" />
      </div>
    </div>
  ),
}

export const CustomContent: Story = {
  render: () => (
    <div className="p-8 flex gap-8 items-center">
      <Badge content="NEW">
        <button className="px-4 py-2 bg-neutral-100 rounded">商品</button>
      </Badge>

      <Badge content="HOT">
        <button className="px-4 py-2 bg-neutral-100 rounded">商品</button>
      </Badge>

      <Badge content="SALE">
        <button className="px-4 py-2 bg-neutral-100 rounded">商品</button>
      </Badge>

      <Badge content={<span className="text-xs">🔥</span>}>
        <button className="px-4 py-2 bg-neutral-100 rounded">商品</button>
      </Badge>
    </div>
  ),
}

export const Standalone: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex gap-4 items-center">
        <span className="text-sm text-neutral-600">数字徽章:</span>
        <Badge count={5} />
        <Badge count={10} color="primary" />
        <Badge count={99} color="success" />
      </div>

      <div className="flex gap-4 items-center">
        <span className="text-sm text-neutral-600">圆点徽章:</span>
        <Badge dot count={1} />
        <Badge dot count={1} color="primary" />
        <Badge dot count={1} color="success" />
      </div>

      <div className="flex gap-4 items-center">
        <span className="text-sm text-neutral-600">自定义内容:</span>
        <Badge content="NEW" />
        <Badge content="HOT" color="error" />
      </div>
    </div>
  ),
}

export const NavigationBadges: Story = {
  render: () => {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">导航栏</h2>
        <nav className="flex gap-6">
          <Badge count={5}>
            <button className="px-4 py-2 hover:bg-neutral-100 rounded flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              邮件
            </button>
          </Badge>

          <Badge count={12}>
            <button className="px-4 py-2 hover:bg-neutral-100 rounded flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              通知
            </button>
          </Badge>

          <Badge dot>
            <button className="px-4 py-2 hover:bg-neutral-100 rounded flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              消息
            </button>
          </Badge>

          <button className="px-4 py-2 hover:bg-neutral-100 rounded flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            个人
          </button>
        </nav>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：导航栏徽章',
      },
    },
  },
}

export const NotificationList: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">通知中心</h2>
        <div className="space-y-2">
          <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <Badge dot count={1} color="primary" />
              <span>系统消息</span>
            </div>
            <Badge count={3} size="small" />
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <Badge dot count={1} />
              <span>评论回复</span>
            </div>
            <Badge count={12} size="small" color="success" />
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <Badge dot count={0} />
              <span>点赞通知</span>
            </div>
            <Badge count={0} size="small" showZero />
          </div>

          <div className="flex items-center justify-between p-3 hover:bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <Badge dot count={1} color="error" />
              <span>@我的</span>
            </div>
            <Badge count={5} size="small" color="error" />
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：通知列表',
      },
    },
  },
}

export const ProductTags: Story = {
  render: () => {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">商品列表</h2>
        <div className="grid grid-cols-4 gap-6">
          {[
            { name: '商品 A', badge: 'NEW', color: 'primary' as const },
            { name: '商品 B', badge: 'HOT', color: 'error' as const },
            { name: '商品 C', badge: 'SALE', color: 'success' as const },
            { name: '商品 D', badge: null },
          ].map((product) => (
            <div key={product.name} className="relative p-4 border rounded-lg">
              {product.badge && (
                <Badge
                  content={product.badge}
                  color={product.color}
                  position="top-right"
                  className="absolute top-2 right-2"
                />
              )}
              <div className="h-32 bg-neutral-100 rounded mb-3" />
              <h3 className="font-medium">{product.name}</h3>
              <p className="text-sm text-neutral-500">¥99.00</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：商品标签',
      },
    },
  },
}

export const StatusIndicators: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-6">服务器状态</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>Web 服务器</span>
            <Badge status="success" content="运行中" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>数据库</span>
            <Badge status="processing" content="备份中" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>缓存服务</span>
            <Badge status="success" content="运行中" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>消息队列</span>
            <Badge status="error" content="离线" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>CDN 节点</span>
            <Badge status="warning" content="延迟" />
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：状态指示器',
      },
    },
  },
}
