import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Pagination } from './Pagination'

const meta: Meta<typeof Pagination> = {
  title: 'Design System/Molecules/Pagination',
  component: Pagination,
  tags: ['autodocs'],
  argTypes: {
    current: {
      control: 'number',
      description: '当前页码',
    },
    total: {
      control: 'number',
      description: '总页数',
    },
    pageSize: {
      control: 'number',
      description: '每页显示的页码数量',
    },
    showEllipsis: {
      control: 'boolean',
      description: '是否显示省略号',
    },
    showTotal: {
      control: 'boolean',
      description: '是否显示总数信息',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
  },
}

export default meta
type Story = StoryObj<typeof Pagination>

export const Default: Story = {
  args: {
    current: 1,
    total: 10,
  },
}

export const Middle: Story = {
  args: {
    current: 5,
    total: 10,
  },
}

export const FirstPage: Story = {
  args: {
    current: 1,
    total: 5,
  },
}

export const LastPage: Story = {
  args: {
    current: 5,
    total: 5,
  },
}

export const ManyPages: Story = {
  args: {
    current: 10,
    total: 50,
  },
}

export const WithTotal: Story = {
  args: {
    current: 3,
    total: 10,
    showTotal: true,
  },
}

export const Compact: Story = {
  args: {
    current: 5,
    total: 20,
    pageSize: 5,
  },
}

export const NoEllipsis: Story = {
  args: {
    current: 5,
    total: 20,
    showEllipsis: false,
  },
}

export const Disabled: Story = {
  args: {
    current: 3,
    total: 10,
    disabled: true,
  },
}

export const CustomArrows: Story = {
  args: {
    current: 3,
    total: 10,
    prevText: '<',
    nextText: '>',
  },
}

export const Interactive: Story = {
  render: () => {
    const [current, setCurrent] = useState(1)

    return (
      <div className="p-8">
        <div className="mb-4">
          当前页: <strong>{current}</strong>
        </div>
        <Pagination current={current} total={10} onChange={setCurrent} />
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '交互示例：点击页码切换',
      },
    },
  },
}

export const DataTableExample: Story = {
  render: () => {
    const [current, setCurrent] = useState(1)
    const total = 20
    const pageSize = 10
    const startIndex = (current - 1) * pageSize + 1
    const endIndex = Math.min(current * pageSize, 100) // 假设100条数据

    return (
      <div className="p-8">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left">ID</th>
                <th className="px-4 py-2 text-left">名称</th>
                <th className="px-4 py-2 text-left">状态</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(10, endIndex - startIndex + 1) }, (_, i) => (
                <tr key={i} className="border-t">
                  <td className="px-4 py-2">{startIndex + i}</td>
                  <td className="px-4 py-2">项目 {startIndex + i}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded text-xs ${i % 3 === 0 ? 'bg-green-100 text-green-800' : i % 3 === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {i % 3 === 0 ? '已完成' : i % 3 === 1 ? '进行中' : '待处理'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            显示 {startIndex}-{endIndex} 条，共 100 条
          </div>
          <Pagination current={current} total={total} onChange={setCurrent} showTotal={false} />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：数据表格分页',
      },
    },
  },
}

export const SearchResults: Story = {
  render: () => {
    const [current, setCurrent] = useState(1)

    return (
      <div className="p-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-4">搜索结果</h1>
        <p className="text-gray-600 mb-6">找到 95 个结果</p>

        <div className="space-y-4 mb-8">
          {Array.from({ length: 10 }, (_, i) => (
            <div key={i} className="p-4 bg-white rounded-lg border border-gray-200">
              <h3 className="font-medium text-blue-600 hover:underline cursor-pointer">
                搜索结果 {current * 10 + i + 1} - 标题
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                这是搜索结果 {current * 10 + i + 1} 的描述内容...
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Pagination current={current} total={10} onChange={setCurrent} showTotal />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：搜索结果分页',
      },
    },
  },
}
