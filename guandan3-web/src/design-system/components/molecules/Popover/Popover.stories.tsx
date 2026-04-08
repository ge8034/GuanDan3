import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Popover } from './Popover'

const meta: Meta<typeof Popover> = {
  title: 'Design System/Molecules/Popover',
  component: Popover,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: '弹出位置',
    },
    triggerMode: {
      control: 'select',
      options: ['click', 'hover'],
      description: '触发方式',
    },
    showArrow: {
      control: 'boolean',
      description: '是否显示箭头',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    closeOnClick: {
      control: 'boolean',
      description: '点击内容时是否关闭',
    },
  },
}

export default meta
type Story = StoryObj<typeof Popover>

export const Default: Story = {
  render: () => (
    <div className="p-8">
      <Popover
        trigger={<button className="px-4 py-2 bg-primary-500 text-white rounded">点击我</button>}
        content={
          <div>
            <h3 className="font-semibold mb-2">标题</h3>
            <p className="text-sm text-neutral-600">这是弹出框的内容</p>
          </div>
        }
      />
    </div>
  ),
}

export const Click: Story = {
  render: () => {
    return (
      <div className="p-8">
        <Popover
          trigger={<button className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">点击触发</button>}
          content={
            <div className="space-y-2">
              <p className="text-sm">点击触发模式的弹出框</p>
              <p className="text-xs text-neutral-500">再次点击触发器可关闭</p>
            </div>
          }
          triggerMode="click"
        />
      </div>
    )
  },
}

export const Hover: Story = {
  render: () => {
    return (
      <div className="p-8">
        <Popover
          trigger={<button className="px-4 py-2 bg-success-500 text-white rounded hover:bg-success-600">悬停触发</button>}
          content={
            <div className="space-y-2">
              <p className="text-sm">悬停触发模式的弹出框</p>
              <p className="text-xs text-neutral-500">鼠标移开后自动关闭</p>
            </div>
          }
          triggerMode="hover"
        />
      </div>
    )
  },
}

export const Positions: Story = {
  render: () => {
    return (
      <div className="p-16 grid grid-cols-2 gap-8 max-w-lg">
        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-4">Top</p>
          <div className="flex justify-center">
            <Popover
              trigger={<button className="px-4 py-2 border rounded">Top</button>}
              content={<div className="p-2">上方内容</div>}
              placement="top"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-4">Bottom</p>
          <div className="flex justify-center">
            <Popover
              trigger={<button className="px-4 py-2 border rounded">Bottom</button>}
              content={<div className="p-2">下方内容</div>}
              placement="bottom"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-4">Left</p>
          <div className="flex justify-center">
            <Popover
              trigger={<button className="px-4 py-2 border rounded">Left</button>}
              content={<div className="p-2">左侧内容</div>}
              placement="left"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-neutral-600 mb-4">Right</p>
          <div className="flex justify-center">
            <Popover
              trigger={<button className="px-4 py-2 border rounded">Right</button>}
              content={<div className="p-2">右侧内容</div>}
              placement="right"
            />
          </div>
        </div>
      </div>
    )
  },
}

export const RichContent: Story = {
  render: () => {
    return (
      <div className="p-8">
        <Popover
          trigger={
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">
              <span>用户信息</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          }
          content={
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                  JD
                </div>
                <div>
                  <p className="font-medium">John Doe</p>
                  <p className="text-xs text-neutral-500">john@example.com</p>
                </div>
              </div>
              <div className="pt-3 border-t">
                <button className="w-full text-sm text-primary-600 hover:text-primary-700">查看个人资料</button>
              </div>
            </div>
          }
        />
      </div>
    )
  },
}

export const Actions: Story = {
  render: () => {
    return (
      <div className="p-8">
        <Popover
          trigger={<button className="px-4 py-2 border rounded hover:bg-neutral-50">操作</button>}
          content={
            <div className="space-y-1">
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded">编辑</button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded">复制</button>
              <button className="w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 rounded">删除</button>
            </div>
          }
          closeOnClick={false}
        />
      </div>
    )
  },
}

export const FormPopover: Story = {
  render: () => {
    const [email, setEmail] = useState('')

    return (
      <div className="p-8">
        <Popover
          trigger={<button className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">订阅</button>}
          content={
            <div className="w-64">
              <h3 className="font-semibold mb-3">订阅新闻通讯</h3>
              <form onSubmit={(e) => e.preventDefault()} className="space-y-3">
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="submit"
                  className="w-full px-4 py-2 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600"
                >
                  订阅
                </button>
              </form>
            </div>
          }
          closeOnClick={false}
        />
      </div>
    )
  },
}

export const NotificationPopover: Story = {
  render: () => {
    return (
      <div className="p-8">
        <Popover
          trigger={
            <button className="relative px-4 py-2 border rounded hover:bg-neutral-50">
              通知
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-error-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          }
          content={
            <div className="w-72">
              <h3 className="font-semibold mb-3">通知</h3>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-primary-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">系统更新</p>
                    <p className="text-xs text-neutral-500">5分钟前</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-success-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">任务完成</p>
                    <p className="text-xs text-neutral-500">1小时前</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-2 h-2 mt-2 bg-warning-500 rounded-full" />
                  <div className="flex-1">
                    <p className="text-sm">即将到期</p>
                    <p className="text-xs text-neutral-500">2天前</p>
                  </div>
                </div>
              </div>
              <button className="w-full text-center text-sm text-primary-600 hover:text-primary-700 mt-3">
                查看全部
              </button>
            </div>
          }
          closeOnClick={false}
        />
      </div>
    )
  },
}

export const CustomWidth: Story = {
  render: () => {
    return (
      <div className="p-8 space-y-8">
        <div>
          <p className="text-sm text-neutral-600 mb-2">Auto Width</p>
          <Popover
            trigger={<button className="px-4 py-2 border rounded">自动宽度</button>}
            content={<div className="p-4">内容根据文字自动调整宽度</div>}
            contentWidth="auto"
          />
        </div>

        <div>
          <p className="text-sm text-neutral-600 mb-2">Trigger Width</p>
          <Popover
            trigger={<button className="px-8 py-2 border rounded">触发器宽度</button>}
            content={<div className="p-4">弹出层宽度与触发器相同</div>}
            contentWidth="trigger"
          />
        </div>

        <div>
          <p className="text-sm text-neutral-600 mb-2">Fixed Width (300px)</p>
          <Popover
            trigger={<button className="px-4 py-2 border rounded">固定宽度</button>}
            content={<div className="p-4">弹出层宽度固定为 300px</div>}
            contentWidth={300}
          />
        </div>
      </div>
    )
  },
}

export const NoArrow: Story = {
  render: () => {
    return (
      <div className="p-8">
        <Popover
          trigger={<button className="px-4 py-2 border rounded">无箭头</button>}
          content={<div className="p-4">没有箭头的弹出框</div>}
          showArrow={false}
        />
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => {
    return (
      <div className="p-8 space-y-4">
        <Popover
          trigger={<button className="px-4 py-2 border rounded">正常状态</button>}
          content={<div className="p-4">可以点击触发</div>}
        />

        <Popover
          trigger={<button className="px-4 py-2 border rounded">禁用状态</button>}
          content={<div className="p-4">这个内容无法显示</div>}
          disabled
        />
      </div>
    )
  },
}

export const Controlled: Story = {
  render: () => {
    const [open, setOpen] = useState(false)

    return (
      <div className="p-8">
        <Popover
          trigger={<button className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600">切换弹出</button>}
          content={
            <div className="space-y-3">
              <p className="text-sm">受控模式的弹出框</p>
              <button
                onClick={() => setOpen(false)}
                className="w-full px-4 py-2 bg-neutral-200 rounded hover:bg-neutral-300"
              >
                关闭
              </button>
            </div>
          }
          open={open}
          onOpenChange={setOpen}
        />
      </div>
    )
  },
}
