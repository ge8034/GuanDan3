import type { Meta, StoryObj } from '@storybook/react'
import { Empty } from './Empty'

const meta: Meta<typeof Empty> = {
  title: 'Design System/Molecules/Empty',
  component: Empty,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: '标题',
    },
    description: {
      control: 'text',
      description: '描述文本',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '尺寸',
    },
  },
}

export default meta
type Story = StoryObj<typeof Empty>

export const Default: Story = {
  args: {},
}

export const NoData: Story = {
  args: {
    title: '暂无数据',
    description: '还没有任何数据，请稍后再来',
  },
}

export const NoSearchResults: Story = {
  args: {
    title: '搜索无结果',
    description: '没有找到匹配的内容，请尝试其他关键词',
  },
}

export const EmptyCart: Story = {
  args: {
    title: '购物车为空',
    description: '购物车还是空的，快去选购心仪的商品吧',
    action: <button type="button" className="px-4 py-2 bg-poker-table-500 text-white rounded">去购物</button>,
  },
}

export const EmptyList: Story = {
  args: {
    title: '列表为空',
    description: '还没有任何项目，点击下方按钮创建',
    action: <button type="button" className="px-4 py-2 bg-poker-table-500 text-white rounded">新建项目</button>,
  },
}

export const Small: Story = {
  args: {
    size: 'small',
    title: '小尺寸空状态',
  },
}

export const Large: Story = {
  args: {
    size: 'large',
    title: '大尺寸空状态',
    description: '这是一个较大的空状态展示区域',
  },
}

export const CustomImage: Story = {
  args: {
    title: '暂无通知',
    description: '您暂时没有收到任何通知',
    image: (
      <div className="text-6xl">🔔</div>
    ),
  },
}

export const NoAction: Story = {
  args: {
    title: '权限不足',
    description: '您没有权限访问此内容',
  },
}

export const TableEmpty: Story = {
  render: () => {
    return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-neutral-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">名称</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-neutral-700">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={3} className="px-4 py-8">
                <Empty
                  title="暂无数据"
                  description="表格中没有显示任何数据"
                  size="small"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：表格内空状态',
      },
    },
  },
}

export const CardEmpty: Story = {
  render: () => {
    return (
    <div className="p-8">
      <div className="bg-white rounded-lg border border-neutral-200 p-8">
        <Empty
          title="没有收藏内容"
          description="您还没有收藏任何内容，去发现更多精彩内容吧"
          action={
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 border border-neutral-300 rounded">浏览推荐</button>
              <button type="button" className="px-4 py-2 bg-poker-table-500 text-white rounded">去发现</button>
            </div>
          }
        />
      </div>
    </div>
  )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：卡片内空状态',
      },
    },
  },
}

export const PageEmpty: Story = {
  render: () => {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Empty
          title="页面不存在"
          description="您访问的页面可能已被删除或暂时不可用"
          action={
            <div className="flex gap-2">
              <button type="button" className="px-4 py-2 border border-neutral-300 rounded">返回首页</button>
              <button type="button" className="px-4 py-2 bg-poker-table-500 text-white rounded">刷新页面</button>
            </div>
          }
        />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：404页面',
      },
    },
  },
}
