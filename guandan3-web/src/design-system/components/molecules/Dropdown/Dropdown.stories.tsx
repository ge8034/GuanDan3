import type { Meta, StoryObj } from '@storybook/react'
import { Dropdown, DropdownItem, DropdownSeparator } from './Dropdown'

const meta: Meta<typeof Dropdown> = {
  title: 'Design System/Molecules/Dropdown',
  component: Dropdown,
  tags: ['autodocs'],
  argTypes: {
    align: {
      control: 'select',
      options: ['start', 'center', 'end'],
      description: '对齐方式',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
  },
}

export default meta
type Story = StoryObj<typeof Dropdown>

export const Default: Story = {
  args: {
    content: (
      <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]">
        <button type="button" className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-neutral-100">
          选项1
        </button>
        <button type="button" className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-neutral-100">
          选项2
        </button>
        <button type="button" className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-neutral-100">
          选项3
        </button>
      </div>
    ),
    children: <button type="button">打开菜单</button>,
  },
}

export const WithDropdownItems: Story = {
  render: () => (
    <Dropdown
      content={
        <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]" role="menu">
          <DropdownItem>编辑</DropdownItem>
          <DropdownItem>复制</DropdownItem>
          <DropdownItem>分享</DropdownItem>
          <DropdownSeparator />
          <DropdownItem danger>删除</DropdownItem>
        </div>
      }
    >
      <button type="button">操作菜单</button>
    </Dropdown>
  ),
  parameters: {
    docs: {
      description: {
        story: '使用 DropdownItem 和 DropdownSeparator 组件构建菜单',
      },
    },
  },
}

export const LeftAligned: Story = {
  args: {
    align: 'start',
    content: (
      <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]">
        <DropdownItem>选项1</DropdownItem>
        <DropdownItem>选项2</DropdownItem>
      </div>
    ),
    children: <button type="button">左对齐</button>,
  },
}

export const CenterAligned: Story = {
  args: {
    align: 'center',
    content: (
      <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]">
        <DropdownItem>选项1</DropdownItem>
        <DropdownItem>选项2</DropdownItem>
      </div>
    ),
    children: <button type="button">居中对齐</button>,
  },
}

export const RightAligned: Story = {
  args: {
    align: 'end',
    content: (
      <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]">
        <DropdownItem>选项1</DropdownItem>
        <DropdownItem>选项2</DropdownItem>
      </div>
    ),
    children: <button type="button">右对齐</button>,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    content: (
      <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]">
        <DropdownItem>选项1</DropdownItem>
      </div>
    ),
    children: <button type="button">禁用菜单</button>,
  },
}

export const WithIcons: Story = {
  render: () => (
    <Dropdown
      content={
        <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[180px]" role="menu">
          <DropdownItem icon={<span>📝</span>}>编辑</DropdownItem>
          <DropdownItem icon={<span>📋</span>}>复制</DropdownItem>
          <DropdownItem icon={<span>📤</span>}>导出</DropdownItem>
          <DropdownSeparator />
          <DropdownItem icon={<span>🗑️</span>} danger>
            删除
          </DropdownItem>
        </div>
      }
    >
      <button type="button">带图标的菜单</button>
    </Dropdown>
  ),
  parameters: {
    docs: {
      description: {
        story: '使用 emoji 或图标组件作为菜单项图标',
      },
    },
  },
}

export const UserMenu: Story = {
  render: () => (
    <div className="p-8">
      <Dropdown
        content={
          <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[200px]" role="menu">
            <div className="px-3 py-2 border-b border-neutral-200">
              <div className="font-medium text-sm">user@example.com</div>
            </div>
            <DropdownItem>个人资料</DropdownItem>
            <DropdownItem>账户设置</DropdownItem>
            <DropdownItem>帮助中心</DropdownItem>
            <DropdownSeparator />
            <DropdownItem>退出登录</DropdownItem>
          </div>
        }
      >
        <button type="button" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-neutral-100">
          <div className="w-8 h-8 bg-poker-table-500 rounded-full flex items-center justify-center text-white text-sm">
            U
          </div>
          <span>用户菜单</span>
        </button>
      </Dropdown>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：用户菜单',
      },
    },
  },
}

export const ActionMenu: Story = {
  render: () => (
    <div className="p-8">
      <div className="flex gap-4">
        <Dropdown
          align="end"
          content={
            <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]" role="menu">
              <DropdownItem icon={<span>📝</span>}>编辑</DropdownItem>
              <DropdownItem icon={<span>📋</span>}>复制</DropdownItem>
              <DropdownItem icon={<span>📤</span>}>分享</DropdownItem>
              <DropdownSeparator />
              <DropdownItem icon={<span>🗑️</span>} danger>
                删除
              </DropdownItem>
            </div>
          }
        >
          <button type="button" className="p-2 rounded hover:bg-neutral-100">
            ⋯
          </button>
        </Dropdown>

        <Dropdown
          align="end"
          content={
            <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]" role="menu">
              <DropdownItem>标记为未读</DropdownItem>
              <DropdownItem>归档</DropdownItem>
              <DropdownItem>移动到...</DropdownItem>
              <DropdownSeparator />
              <DropdownItem danger>删除</DropdownItem>
            </div>
          }
        >
          <button type="button" className="p-2 rounded hover:bg-neutral-100">
            ⋯
          </button>
        </Dropdown>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：表格行操作菜单',
      },
    },
  },
}

export const SortMenu: Story = {
  render: () => (
    <div className="p-8">
      <Dropdown
        align="end"
        content={
          <div className="p-2 bg-white rounded-lg shadow-lg border border-neutral-200 min-w-[160px]" role="menu">
            <div className="px-3 py-2 text-xs text-neutral-500 font-medium">排序方式</div>
            <DropdownItem>按名称</DropdownItem>
            <DropdownItem>按日期</DropdownItem>
            <DropdownItem>按大小</DropdownItem>
            <DropdownSeparator />
            <DropdownItem>升序</DropdownItem>
            <DropdownItem>降序</DropdownItem>
          </div>
        }
      >
        <button type="button" className="flex items-center gap-1 px-3 py-2 text-sm rounded hover:bg-neutral-100">
          <span>排序</span>
          <span>▼</span>
        </button>
      </Dropdown>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：排序菜单',
      },
    },
  },
}
