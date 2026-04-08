import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './Tooltip'

const meta: Meta<typeof Tooltip> = {
  title: 'Design System/Atoms/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    content: {
      control: 'text',
      description: '提示内容',
    },
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: '显示位置',
    },
    delay: {
      control: 'number',
      description: '延迟显示时间 (ms)',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    showArrow: {
      control: 'boolean',
      description: '是否显示箭头',
    },
  },
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  args: {
    content: '这是一个提示信息',
    children: <button>悬停查看提示</button>,
  },
}

export const Top: Story = {
  args: {
    placement: 'top',
    content: '顶部提示',
    children: <button>悬停查看</button>,
  },
}

export const Bottom: Story = {
  args: {
    placement: 'bottom',
    content: '底部提示',
    children: <button>悬停查看</button>,
  },
}

export const Left: Story = {
  args: {
    placement: 'left',
    content: '左侧提示',
    children: <button>悬停查看</button>,
  },
}

export const Right: Story = {
  args: {
    placement: 'right',
    content: '右侧提示',
    children: <button>悬停查看</button>,
  },
}

export const NoDelay: Story = {
  args: {
    content: '立即显示',
    delay: 0,
    children: <button>立即悬停</button>,
  },
}

export const LongDelay: Story = {
  args: {
    content: '延迟1秒显示',
    delay: 1000,
    children: <button>长延迟悬停</button>,
  },
}

export const Disabled: Story = {
  args: {
    content: '不会显示的提示',
    disabled: true,
    children: <button>禁用的提示</button>,
  },
}

export const NoArrow: Story = {
  args: {
    content: '无箭头提示',
    showArrow: false,
    children: <button>无箭头</button>,
  },
}

export const RichContent: Story = {
  args: {
    content: (
      <div className="text-left">
        <div className="font-bold">标题</div>
        <div>这是详细说明内容</div>
        <div className="text-xs text-neutral-400 mt-1">额外信息</div>
      </div>
    ),
    children: <button>丰富内容</button>,
  },
}

export const WithLink: Story = {
  args: {
    content: '点击了解更多',
    children: <a href="#">链接提示</a>,
  },
}

export const AllPlacements: Story = {
  render: () => (
    <div className="flex flex-col gap-8 items-center p-20">
      <Tooltip content="顶部提示" placement="top">
        <button>Top</button>
      </Tooltip>
      <div className="flex gap-20">
        <Tooltip content="左侧提示" placement="left">
          <button>Left</button>
        </Tooltip>
        <Tooltip content="右侧提示" placement="right">
          <button>Right</button>
        </Tooltip>
      </div>
      <Tooltip content="底部提示" placement="bottom">
        <button>Bottom</button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示所有位置选项',
      },
    },
  },
}

export const InteractiveExample: Story = {
  render: () => (
    <div className="flex gap-4 p-8">
      <Tooltip content="这是主要操作">
        <button className="px-4 py-2 bg-blue-500 text-white rounded">保存</button>
      </Tooltip>
      <Tooltip content="取消当前操作">
        <button className="px-4 py-2 bg-neutral-500 text-white rounded">取消</button>
      </Tooltip>
      <Tooltip content="删除后无法恢复" placement="bottom">
        <button className="px-4 py-2 bg-red-500 text-white rounded">删除</button>
      </Tooltip>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '实际应用场景示例',
      },
    },
  },
}
