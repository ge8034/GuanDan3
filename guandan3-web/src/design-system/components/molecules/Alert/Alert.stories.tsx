import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Alert } from './Alert'

const meta: Meta<typeof Alert> = {
  title: 'Design System/Molecules/Alert',
  component: Alert,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['info', 'success', 'warning', 'error'],
      description: '提示类型',
    },
    title: {
      control: 'text',
      description: '标题',
    },
    showIcon: {
      control: 'boolean',
      description: '是否显示图标',
    },
    closable: {
      control: 'boolean',
      description: '是否可关闭',
    },
  },
}

export default meta
type Story = StoryObj<typeof Alert>

export const Default: Story = {
  args: {
    variant: 'info',
    title: '提示',
    children: '这是一条提示信息',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    title: '信息提示',
    children: '这是一条普通的信息提示',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: '操作成功',
    children: '您的更改已成功保存',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: '注意事项',
    children: '请注意此操作可能会影响其他功能',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    title: '操作失败',
    children: '保存失败，请检查网络连接后重试',
  },
}

export const NoIcon: Story = {
  args: {
    title: '无图标',
    children: '这条提示没有图标',
    showIcon: false,
  },
}

export const Closable: Story = {
  args: {
    title: '可关闭的提示',
    children: '点击右上角的关闭按钮可以关闭此提示',
    closable: true,
  },
}

export const WithAction: Story = {
  args: {
    variant: 'info',
    title: '系统更新',
    children: '有新版本可用，建议更新到最新版本',
    action: <button type="button" className="px-3 py-1 bg-blue-500 text-white rounded text-sm">立即更新</button>,
  },
}

export const WithMultipleActions: Story = {
  args: {
    variant: 'warning',
    title: '确认删除',
    children: '删除后无法恢复，确定要继续吗？',
    action: (
      <div className="flex gap-2">
        <button type="button" className="px-3 py-1 border border-gray-300 rounded text-sm">取消</button>
        <button type="button" className="px-3 py-1 bg-red-500 text-white rounded text-sm">确认删除</button>
      </div>
    ),
  },
}

export const TitleOnly: Story = {
  args: {
    variant: 'success',
    title: '操作成功！',
  },
}

export const ContentOnly: Story = {
  args: {
    variant: 'info',
    children: '没有标题的提示信息',
  },
}

export const LongContent: Story = {
  args: {
    variant: 'info',
    title: '详细说明',
    children: (
      <div>
        <p>这是第一段详细说明内容，包含了较多文字信息。</p>
        <p>这是第二段内容，用于展示多行文本的渲染效果。</p>
      </div>
    ),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 p-8">
      <Alert variant="info" title="信息">
        这是一条信息提示
      </Alert>
      <Alert variant="success" title="成功">
        操作已成功完成
      </Alert>
      <Alert variant="warning" title="警告">
        请注意此操作的风险
      </Alert>
      <Alert variant="error" title="错误">
        操作失败，请稍后重试
      </Alert>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示所有变体样式',
      },
    },
  },
}

export const InteractiveExample: Story = {
  render: () => {
    const [closedAlerts, setClosedAlerts] = useState<Set<string>>(new Set())

    const handleClose = (id: string) => {
      setClosedAlerts(prev => new Set([...prev, id]))
    }

    const alerts = [
      { id: '1', variant: 'success' as const, title: '保存成功', message: '您的设置已成功保存' },
      { id: '2', variant: 'warning' as const, title: '存储空间不足', message: '您的存储空间即将用完，请及时清理' },
      { id: '3', variant: 'error' as const, title: '连接失败', message: '无法连接到服务器，请检查网络' },
    ]

    return (
      <div className="p-8 space-y-3">
        {alerts
          .filter(alert => !closedAlerts.has(alert.id))
          .map(alert => (
            <Alert
              key={alert.id}
              variant={alert.variant}
              title={alert.title}
              closable
              onClose={() => handleClose(alert.id)}
            >
              {alert.message}
            </Alert>
        ))}
        {closedAlerts.size === alerts.length && (
          <div className="text-neutral-500 text-sm">所有提示已关闭</div>
        )}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '交互示例：可关闭的多个提示',
      },
    },
  },
}

export const FormContext: Story = {
  render: () => {
    return (
      <div className="p-8">
        <div className="max-w-md mx-auto space-y-4">
          <Alert variant="info" title="表单提示">
            请填写所有必填项，标有 * 的字段为必填
          </Alert>

          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  用户名 *
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="请输入用户名"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  邮箱 *
                </label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  placeholder="请输入邮箱"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：表单中的提示信息',
      },
    },
  },
}
