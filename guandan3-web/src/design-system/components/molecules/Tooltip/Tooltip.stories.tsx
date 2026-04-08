import type { Meta, StoryObj } from '@storybook/react'
import { Tooltip } from './Tooltip'

const meta: Meta<typeof Tooltip> = {
  title: 'Design System/Molecules/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  argTypes: {
    placement: {
      control: 'select',
      options: ['top', 'bottom', 'left', 'right'],
      description: '显示位置',
    },
    trigger: {
      control: 'select',
      options: ['hover', 'click', 'focus'],
      description: '触发方式',
    },
    variant: {
      control: 'select',
      options: ['neutral', 'primary', 'error'],
      description: '颜色变体',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    showArrow: {
      control: 'boolean',
      description: '是否显示箭头',
    },
    delay: {
      control: 'number',
      description: '延迟显示时间（毫秒）',
    },
  },
}

export default meta
type Story = StoryObj<typeof Tooltip>

export const Default: Story = {
  render: () => (
    <div className="p-20 flex justify-center">
      <Tooltip content="这是一个提示">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          悬停查看提示
        </button>
      </Tooltip>
    </div>
  ),
}

export const Placements: Story = {
  render: () => (
    <div className="p-20 flex flex-wrap gap-8 justify-center">
      <Tooltip content="顶部提示" placement="top">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Top
        </button>
      </Tooltip>

      <Tooltip content="底部提示" placement="bottom">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Bottom
        </button>
      </Tooltip>

      <Tooltip content="左侧提示" placement="left">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Left
        </button>
      </Tooltip>

      <Tooltip content="右侧提示" placement="right">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Right
        </button>
      </Tooltip>
    </div>
  ),
}

export const Triggers: Story = {
  render: () => (
    <div className="p-20 flex flex-wrap gap-8 justify-center">
      <Tooltip content="悬停触发提示" trigger="hover">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Hover
        </button>
      </Tooltip>

      <Tooltip content="点击触发提示" trigger="click">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Click
        </button>
      </Tooltip>

      <Tooltip content="聚焦触发提示" trigger="focus">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Focus
        </button>
      </Tooltip>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="p-20 flex flex-wrap gap-8 justify-center">
      <Tooltip content="中性色提示" variant="neutral">
        <button type="button" className="px-4 py-2 bg-neutral-500 text-white rounded">
          Neutral
        </button>
      </Tooltip>

      <Tooltip content="主色提示" variant="primary">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          Primary
        </button>
      </Tooltip>

      <Tooltip content="错误提示" variant="error">
        <button type="button" className="px-4 py-2 bg-error-500 text-white rounded">
          Error
        </button>
      </Tooltip>
    </div>
  ),
}

export const WithDelay: Story = {
  render: () => (
    <div className="p-20 flex flex-wrap gap-8 justify-center">
      <Tooltip content="无延迟提示" delay={0}>
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          无延迟
        </button>
      </Tooltip>

      <Tooltip content="300ms 延迟提示" delay={300}>
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          300ms 延迟
        </button>
      </Tooltip>

      <Tooltip content="500ms 延迟提示" delay={500}>
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          500ms 延迟
        </button>
      </Tooltip>
    </div>
  ),
}

export const NoArrow: Story = {
  render: () => (
    <div className="p-20 flex justify-center">
      <Tooltip content="无箭头提示" showArrow={false}>
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          无箭头
        </button>
      </Tooltip>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="p-20 flex flex-wrap gap-8 justify-center">
      <Tooltip content="这个提示不会显示" disabled>
        <button type="button" className="px-4 py-2 bg-neutral-400 text-white rounded">
          禁用状态
        </button>
      </Tooltip>

      <Tooltip content="正常提示">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          正常状态
        </button>
      </Tooltip>
    </div>
  ),
}

export const RichContent: Story = {
  render: () => (
    <div className="p-20 flex justify-center">
      <Tooltip
        content={
          <div className="text-left">
            <div className="font-semibold mb-1">详细信息</div>
            <div className="text-sm">这是多行提示内容</div>
            <div className="text-xs text-neutral-300 mt-1">辅助说明</div>
          </div>
        }
      >
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          复杂内容
        </button>
      </Tooltip>
    </div>
  ),
}

export const OnElements: Story = {
  render: () => (
    <div className="p-20 flex flex-wrap gap-8 justify-center items-start">
      <Tooltip content="按钮提示">
        <button type="button" className="px-4 py-2 bg-primary-500 text-white rounded">
          按钮
        </button>
      </Tooltip>

      <Tooltip content="链接提示">
        <a href="#" className="text-primary-500 underline">
          链接
        </a>
      </Tooltip>

      <Tooltip content="图标提示">
        <button type="button" className="p-2 bg-neutral-200 rounded">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </Tooltip>

      <Tooltip content="文本提示">
        <span className="px-2 py-1 bg-neutral-100 rounded cursor-help">
          悬停这段文本
        </span>
      </Tooltip>
    </div>
  ),
}

export const InteractiveExample: Story = {
  render: () => {
    return (
      <div className="p-8 space-y-8">
        <h2 className="text-2xl font-semibold">工具提示示例</h2>

        <section className="p-6 bg-neutral-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">用户界面工具提示</h3>
          <div className="flex flex-wrap gap-4">
            <Tooltip content="保存当前更改">
              <button type="button" className="flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-neutral-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                保存
              </button>
            </Tooltip>

            <Tooltip content="删除选中项目" variant="error">
              <button type="button" className="flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-neutral-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                删除
              </button>
            </Tooltip>

            <Tooltip content="下载文件到本地">
              <button type="button" className="flex items-center gap-2 px-3 py-2 bg-white border rounded hover:bg-neutral-50">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                下载
              </button>
            </Tooltip>
          </div>
        </section>

        <section className="p-6 bg-neutral-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">表单帮助提示</h3>
          <div className="space-y-4 max-w-md">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                密码
                <Tooltip content="密码必须包含至少8个字符，包括大小写字母和数字">
                  <svg className="w-4 h-4 text-neutral-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </label>
              <input type="password" className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="输入密码" />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                用户名
                <Tooltip
                  content={
                    <div>
                      <div className="font-medium">用户名规则</div>
                      <ul className="text-xs mt-1 list-disc list-inside">
                        <li>4-20个字符</li>
                        <li>只能使用字母、数字、下划线</li>
                        <li>必须以字母开头</li>
                      </ul>
                    </div>
                  }
                >
                  <svg className="w-4 h-4 text-neutral-400 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </Tooltip>
              </label>
              <input type="text" className="w-full mt-1 px-3 py-2 border rounded-md" placeholder="输入用户名" />
            </div>
          </div>
        </section>

        <section className="p-6 bg-neutral-50 rounded-lg">
          <h3 className="text-lg font-medium mb-4">状态指示器</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              <Tooltip content="服务器运行正常">
                <span className="text-sm">在线</span>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <Tooltip content="服务器负载较高" variant="primary">
                <span className="text-sm">繁忙</span>
              </Tooltip>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <Tooltip content="服务器连接失败" variant="error">
                <span className="text-sm">离线</span>
              </Tooltip>
            </div>
          </div>
        </section>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：各种工具提示的使用方式',
      },
    },
  },
}
