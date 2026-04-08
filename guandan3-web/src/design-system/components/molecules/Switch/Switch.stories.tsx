import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Design System/Molecules/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: '是否选中',
    },
    defaultChecked: {
      control: 'boolean',
      description: '默认是否选中',
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
    },
    loading: {
      control: 'boolean',
      description: '加载状态',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '尺寸',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error'],
      description: '颜色',
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  render: () => <Switch />,
}

export const Sizes: Story = {
  render: () => (
    <div className="p-8 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Switch size="small" />
        <span className="text-sm text-neutral-600">Small</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch size="medium" />
        <span className="text-sm text-neutral-600">Medium</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch size="large" />
        <span className="text-sm text-neutral-600">Large</span>
      </div>
    </div>
  ),
}

export const Colors: Story = {
  render: () => (
    <div className="p-8 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Switch defaultChecked color="primary" />
        <span className="text-sm text-neutral-600">Primary</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch defaultChecked color="success" />
        <span className="text-sm text-neutral-600">Success</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch defaultChecked color="warning" />
        <span className="text-sm text-neutral-600">Warning</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch defaultChecked color="error" />
        <span className="text-sm text-neutral-600">Error</span>
      </div>
    </div>
  ),
}

export const WithLabels: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
      <div className="p-8 flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <Switch
            checked={checked}
            onChange={setChecked}
            checkedChildren="开"
            unCheckedChildren="关"
          />
          <span className="text-sm text-neutral-600">状态: {checked ? '开' : '关'}</span>
        </div>
      </div>
    )
  },
}

export const Disabled: Story = {
  render: () => (
    <div className="p-8 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Switch disabled />
        <span className="text-sm text-neutral-600">禁用（未选中）</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch disabled defaultChecked />
        <span className="text-sm text-neutral-600">禁用（已选中）</span>
      </div>
    </div>
  ),
}

export const Loading: Story = {
  render: () => (
    <div className="p-8 flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Switch loading />
        <span className="text-sm text-neutral-600">加载中（未选中）</span>
      </div>

      <div className="flex items-center gap-4">
        <Switch loading defaultChecked />
        <span className="text-sm text-neutral-600">加载中（已选中）</span>
      </div>
    </div>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)

    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded">
          <span className="text-sm">通知</span>
          <Switch checked={checked} onChange={setChecked} />
        </div>

        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded">
          <span className="text-sm">自动更新</span>
          <Switch checked={checked} onChange={setChecked} />
        </div>

        <div className="flex items-center justify-between p-4 bg-neutral-50 rounded">
          <span className="text-sm">显示隐藏文件</span>
          <Switch checked={checked} onChange={setChecked} />
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded text-sm text-blue-700">
          当前状态: {checked ? '开启' : '关闭'}
        </div>
      </div>
    )
  },
}

export const Settings: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">设置</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">推送通知</div>
              <div className="text-sm text-neutral-500">接收推送消息</div>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">邮件订阅</div>
              <div className="text-sm text-neutral-500">订阅每周通讯</div>
            </div>
            <Switch color="success" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">自动保存</div>
              <div className="text-sm text-neutral-500">每30秒自动保存</div>
            </div>
            <Switch defaultChecked color="primary" />
          </div>

          <div className="flex items-center justify-between py-3 border-b">
            <div>
              <div className="font-medium">暗黑模式</div>
              <div className="text-sm text-neutral-500">使用暗黑主题</div>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="font-medium">公开个人资料</div>
              <div className="text-sm text-neutral-500">让所有人可见</div>
            </div>
            <Switch color="warning" />
          </div>
        </div>
      </div>
    )
  },
}

export const Permissions: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-6">权限设置</h2>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <div className="font-medium">读取权限</div>
                <div className="text-sm text-neutral-500">查看文件和内容</div>
              </div>
            </div>
            <Switch defaultChecked color="success" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-3h2l1.172-1.172a2 2 0 012.828 0z" />
              </svg>
              <div>
                <div className="font-medium">写入权限</div>
                <div className="text-sm text-neutral-500">编辑和修改内容</div>
              </div>
            </div>
            <Switch defaultChecked color="success" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <div className="font-medium">删除权限</div>
                <div className="text-sm text-neutral-500">删除文件和内容</div>
              </div>
            </div>
            <Switch color="error" />
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <div>
                <div className="font-medium">管理权限</div>
                <div className="text-sm text-neutral-500">管理用户和设置</div>
              </div>
            </div>
            <Switch disabled />
          </div>
        </div>
      </div>
    )
  },
}

export const ToggleStates: Story = {
  render: () => {
    const [notifications, setNotifications] = useState(true)
    const [autoSave, setAutoSave] = useState(false)

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">偏好设置</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">通知</div>
              <div className="text-sm text-neutral-500">
                {notifications ? '已开启' : '已关闭'}
              </div>
            </div>
            <Switch
              checked={notifications}
              onChange={setNotifications}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">自动保存</div>
              <div className="text-sm text-neutral-500">
                {autoSave ? '已开启' : '已关闭'}
              </div>
            </div>
            <Switch
              checked={autoSave}
              onChange={setAutoSave}
              checkedChildren="开"
              unCheckedChildren="关"
            />
          </div>
        </div>

        <div className="mt-6 p-4 bg-neutral-50 rounded">
          <div className="text-sm font-medium mb-2">状态预览</div>
          <div className="space-y-1 text-sm">
            <div>通知: {notifications ? '✅' : '❌'}</div>
            <div>自动保存: {autoSave ? '✅' : '❌'}</div>
          </div>
        </div>
      </div>
    )
  },
}

export const LoadingStates: Story = {
  render: () => {
    const [loading, setLoading] = useState(false)

    const handleClick = () => {
      setLoading(true)
      setTimeout(() => {
        setLoading(false)
      }, 2000)
    }

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">加载状态示例</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded">
            <div>
              <div className="font-medium">模拟网络请求</div>
              <div className="text-sm text-neutral-500">点击切换体验加载状态</div>
            </div>
            <Switch loading={loading} checked={loading} onChange={handleClick} />
          </div>

          <div className="flex items-center justify-between p-4 bg-neutral-50 rounded">
            <div>
              <div className="font-medium">保存中...</div>
              <div className="text-sm text-neutral-500">正在保存到服务器</div>
            </div>
            <Switch loading={true} defaultChecked />
          </div>
        </div>
      </div>
    )
  },
}
