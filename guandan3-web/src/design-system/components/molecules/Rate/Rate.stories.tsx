import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Rate } from './Rate'

const meta: Meta<typeof Rate> = {
  title: 'Design System/Molecules/Rate',
  component: Rate,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: '当前评分值',
    },
    defaultValue: {
      control: 'number',
      description: '默认评分值',
    },
    max: {
      control: 'number',
      description: '最大评分值',
    },
    allowHalf: {
      control: 'boolean',
      description: '是否允许半星',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    allowClear: {
      control: 'boolean',
      description: '是否允许清除',
    },
    readonly: {
      control: 'boolean',
      description: '只读模式',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error', 'gold'],
      description: '评分颜色',
    },
  },
}

export default meta
type Story = StoryObj<typeof Rate>

export const Default: Story = {
  render: () => <Rate />,
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState(0)

    return (
      <div className="p-8 space-y-4">
        <Rate value={value} onChange={setValue} />
        <div className="text-sm text-neutral-600">当前评分: {value}</div>
      </div>
    )
  },
}

export const HalfStar: Story = {
  render: () => {
    const [value, setValue] = useState(2.5)

    return (
      <div className="p-8 space-y-4">
        <Rate value={value} onChange={setValue} allowHalf />
        <div className="text-sm text-neutral-600">当前评分: {value}</div>
      </div>
    )
  },
}

export const Colors: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Rate defaultValue={3} color="gold" />
        <span className="text-sm text-neutral-600">Gold</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} color="primary" />
        <span className="text-sm text-neutral-600">Primary</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} color="success" />
        <span className="text-sm text-neutral-600">Success</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} color="warning" />
        <span className="text-sm text-neutral-600">Warning</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} color="error" />
        <span className="text-sm text-neutral-600">Error</span>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 w-16">3星:</span>
        <Rate defaultValue={3} max={3} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 w-16">5星:</span>
        <Rate defaultValue={4} max={5} />
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600 w-16">10星:</span>
        <Rate defaultValue={7} max={10} />
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-4">
        <Rate disabled value={3} />
        <span className="text-sm text-neutral-600">禁用（3星）</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate disabled value={5} />
        <span className="text-sm text-neutral-600">禁用（5星）</span>
      </div>
    </div>
  ),
}

export const Readonly: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-4">
        <Rate readonly value={3} />
        <span className="text-sm text-neutral-600">只读（3星）</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate readonly value={5} />
        <span className="text-sm text-neutral-600">只读（5星）</span>
      </div>
    </div>
  ),
}

export const AllowClear: Story = {
  render: () => {
    const [value, setValue] = useState(3)

    return (
      <div className="p-8 space-y-4">
        <Rate value={value} onChange={setValue} allowClear />
        <div className="text-sm text-neutral-600">
          当前评分: {value} （点击相同分数可清除）
        </div>
      </div>
    )
  },
}

export const CustomCharacter: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex items-center gap-4">
        <Rate defaultValue={3} character="★" />
        <span className="text-sm text-neutral-600">星星</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} character="♥" color="error" />
        <span className="text-sm text-neutral-600">爱心</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} character="●" color="primary" />
        <span className="text-sm text-neutral-600">圆点</span>
      </div>

      <div className="flex items-center gap-4">
        <Rate defaultValue={3} character="▲" color="success" />
        <span className="text-sm text-neutral-600">箭头</span>
      </div>
    </div>
  ),
}

export const ProductReview: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-xl font-semibold mb-6">商品评价</h2>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded">
            <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium mb-1">用户 A</div>
              <Rate defaultValue={5} readonly />
              <p className="mt-2 text-sm text-neutral-600">
                非常满意！质量很好，物流也很快。
              </p>
            </div>
            <div className="text-xs text-neutral-500">2024-01-15</div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded">
            <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium mb-1">用户 B</div>
              <Rate defaultValue={4} readonly />
              <p className="mt-2 text-sm text-neutral-600">
                整体不错，但有些细节可以改进。
              </p>
            </div>
            <div className="text-xs text-neutral-500">2024-01-14</div>
          </div>

          <div className="flex items-start gap-4 p-4 bg-neutral-50 rounded">
            <div className="w-10 h-10 bg-neutral-200 rounded-full"></div>
            <div className="flex-1">
              <div className="font-medium mb-1">用户 C</div>
              <Rate defaultValue={3} readonly />
              <p className="mt-2 text-sm text-neutral-600">
                一般般，符合预期吧。
              </p>
            </div>
            <div className="text-xs text-neutral-500">2024-01-13</div>
          </div>
        </div>
      </div>
    )
  },
}

export const ServiceRating: Story = {
  render: () => {
    const [service, setService] = useState(0)
    const [environment, setEnvironment] = useState(0)
    const [attitude, setAttitude] = useState(0)

    const total = service + environment + attitude
    const average = total > 0 ? (total / 3).toFixed(1) : '0.0'

    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-6">服务评价</h2>

        <div className="space-y-4 p-6 bg-white border rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">服务质量</span>
            <Rate value={service} onChange={setService} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">环境氛围</span>
            <Rate value={environment} onChange={setEnvironment} />
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">服务态度</span>
            <Rate value={attitude} onChange={setAttitude} />
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <div className="text-sm text-neutral-600 mb-2">综合评分</div>
            <div className="text-3xl font-bold text-primary-600">{average}</div>
            <div className="text-xs text-neutral-500">基于 {total} 星的评价</div>
          </div>
        </div>
      </div>
    )
  },
}

export const RatingList: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-xl">
        <h2 className="text-xl font-semibold mb-6">评分列表</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span className="text-sm">商品质量</span>
            <Rate defaultValue={5} color="gold" readonly />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span className="text-sm">物流速度</span>
            <Rate defaultValue={4} color="gold" readonly />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span className="text-sm">客服态度</span>
            <Rate defaultValue={5} color="gold" readonly />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span className="text-sm">性价比</span>
            <Rate defaultValue={3} color="gold" readonly />
          </div>
        </div>
      </div>
    )
  },
}

export const InteractiveRating: Story = {
  render: () => {
    const [value, setValue] = useState(0)

    const descriptions = ['极差', '较差', '一般', '推荐', '极力推荐']

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">请为本服务评分</h2>

        <div className="space-y-4">
          <Rate value={value} onChange={setValue} color="gold" />

          <div className="text-center py-4">
            <div className="text-2xl font-bold mb-1">{descriptions[value - 1] || '未评分'}</div>
            <div className="text-sm text-neutral-500">
              {value > 0 ? `您打了 ${value} 星` : '请点击星星进行评分'}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            <button
              className="px-4 py-2 bg-neutral-200 rounded hover:bg-neutral-300 transition-colors"
              onClick={() => setValue(0)}
              disabled={value === 0}
            >
              重置
            </button>
            <button
              className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
              disabled={value === 0}
            >
              提交
            </button>
          </div>
        </div>
      </div>
    )
  },
}
