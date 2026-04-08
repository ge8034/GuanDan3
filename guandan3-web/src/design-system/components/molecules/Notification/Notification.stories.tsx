import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Notification } from './Notification'

const meta: Meta<typeof Notification> = {
  title: 'Design System/Molecules/Notification',
  component: Notification,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['success', 'info', 'warning', 'error'],
      description: '消息类型',
    },
    closable: {
      control: 'boolean',
      description: '是否显示关闭按钮',
    },
    showIcon: {
      control: 'boolean',
      description: '是否显示图标',
    },
    duration: {
      control: 'number',
      description: '自动关闭时间（毫秒）',
    },
  },
}

export default meta
type Story = StoryObj<typeof Notification>

export const Success: Story = {
  args: {
    type: 'success',
    title: '成功',
    message: '操作已成功完成',
  },
}

export const Info: Story = {
  args: {
    type: 'info',
    title: '提示',
    message: '这是一条提示信息',
  },
}

export const Warning: Story = {
  args: {
    type: 'warning',
    title: '警告',
    message: '请注意这个潜在问题',
  },
}

export const Error: Story = {
  args: {
    type: 'error',
    title: '错误',
    message: '操作失败，请重试',
  },
}

export const WithoutTitle: Story = {
  args: {
    type: 'info',
    message: '没有标题的消息通知',
  },
}

export const NoIcon: Story = {
  args: {
    type: 'info',
    title: '无图标',
    message: '这条消息没有显示图标',
    showIcon: false,
  },
}

export const NoClose: Story = {
  args: {
    type: 'info',
    title: '不可关闭',
    message: '这条消息没有关闭按钮',
    closable: false,
  },
}

export const CustomIcon: Story = {
  args: {
    type: 'info',
    title: '自定义图标',
    message: '使用自定义图标的消息',
    icon: <span style={{ fontSize: '20px' }}>🎉</span>,
  },
}

export const LongMessage: Story = {
  args: {
    type: 'info',
    title: '长消息',
    message: '这是一条比较长的消息内容，用来测试消息组件在处理长文本时的表现。长消息通常会自动换行，保持良好的阅读体验。组件应该能够正确处理各种长度的文本内容。',
  },
}

export const Interactive: Story = {
  render: () => {
    const [notifications, setNotifications] = useState<Array<{ id: number; type: 'success' | 'info' | 'warning' | 'error' }>>([])

    const addNotification = (type: 'success' | 'info' | 'warning' | 'error') => {
      const id = Date.now()
      setNotifications((prev) => [...prev, { id, type }])
      // 3秒后自动移除
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id))
      }, 3000)
    }

    const messages = {
      success: '操作成功！',
      info: '这是一条信息',
      warning: '请注意！',
      error: '出错了！',
    }

    return (
      <div className="p-8 space-y-4">
        <h2 className="text-xl font-semibold mb-6">消息通知示例</h2>

        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-success-500 text-white rounded hover:bg-success-600 transition-colors"
            onClick={() => addNotification('success')}
          >
            Success
          </button>
          <button
            className="px-4 py-2 bg-primary-500 text-white rounded hover:bg-primary-600 transition-colors"
            onClick={() => addNotification('info')}
          >
            Info
          </button>
          <button
            className="px-4 py-2 bg-warning-500 text-white rounded hover:bg-warning-600 transition-colors"
            onClick={() => addNotification('warning')}
          >
            Warning
          </button>
          <button
            className="px-4 py-2 bg-error-500 text-white rounded hover:bg-error-600 transition-colors"
            onClick={() => addNotification('error')}
          >
            Error
          </button>
        </div>

        <div className="space-y-2 max-w-md">
          {notifications.map((notification) => (
            <Notification
              key={notification.id}
              type={notification.type}
              title={notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
              message={messages[notification.type]}
              onClose={() => {
                setNotifications((prev) => prev.filter((n) => n.id !== notification.id))
              }}
            />
          ))}
        </div>
      </div>
    )
  },
}

export const Multiple: Story = {
  render: () => {
    return (
      <div className="p-8 space-y-3 max-w-md">
        <h2 className="text-xl font-semibold mb-6">多条消息</h2>

        <Notification type="success" title="成功" message="数据已保存" />
        <Notification type="info" title="提示" message="系统将于今晚维护" />
        <Notification type="warning" title="警告" message="密码即将过期" />
        <Notification type="error" title="错误" message="上传失败，请重试" />
      </div>
    )
  },
}

export const Placement: Story = {
  render: () => {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">消息位置示例</h2>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="text-sm font-medium mb-3">顶部居中</h3>
            <div className="flex justify-center">
              <Notification type="info" message="顶部居中消息" />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3">靠右对齐</h3>
            <div className="flex justify-end">
              <Notification type="success" message="靠右对齐消息" />
            </div>
          </div>
        </div>
      </div>
    )
  },
}
