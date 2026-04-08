import type { Meta, StoryObj } from '@storybook/react'
import { Toast } from './Toast'

const meta: Meta<typeof Toast> = {
  title: 'Design System/Atoms/Toast',
  component: Toast,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error', 'info'],
      description: '提示类型',
    },
    title: {
      control: 'text',
      description: '标题',
    },
    duration: {
      control: 'number',
      description: '自动关闭时间 (ms)',
    },
    closable: {
      control: 'boolean',
      description: '是否显示关闭按钮',
    },
    showIcon: {
      control: 'boolean',
      description: '是否显示图标',
    },
  },
}

export default meta
type Story = StoryObj<typeof Toast>

export const Default: Story = {
  args: {
    title: '提示',
    children: '这是一条提示信息',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    title: '成功',
    children: '操作已成功完成',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    title: '警告',
    children: '请注意此操作的风险',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    title: '错误',
    children: '操作失败，请稍后重试',
  },
}

export const Info: Story = {
  args: {
    variant: 'info',
    title: '信息',
    children: '这是一条信息提示',
  },
}

export const NoClose: Story = {
  args: {
    title: '无法关闭的提示',
    children: '这条提示会自动关闭，但不能手动关闭',
    closable: false,
  },
}

export const NoAutoClose: Story = {
  args: {
    title: '长时间提示',
    children: '这条提示会显示很久',
    duration: 10000,
  },
}

export const NoIcon: Story = {
  args: {
    title: '无图标',
    children: '这条提示没有图标',
    showIcon: false,
  },
}

export const CustomDuration: Story = {
  args: {
    title: '短时间提示',
    children: '这条提示只会显示 2 秒',
    duration: 2000,
  },
}

export const TitleOnly: Story = {
  args: {
    title: '只有标题',
  },
}

export const ComplexContent: Story = {
  args: {
    variant: 'info',
    title: '详细说明',
    children: (
      <div className="flex flex-col gap-1">
        <span>这是第一条详细信息</span>
        <span>这是第二条详细信息</span>
        <span className="text-xs opacity-75">这是补充说明</span>
      </div>
    ),
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-3 items-start p-8 bg-neutral-100 min-h-screen">
      <Toast variant="default" title="默认" children="默认样式的提示" />
      <Toast variant="success" title="成功" children="操作成功" />
      <Toast variant="warning" title="警告" children="需要注意" />
      <Toast variant="error" title="错误" children="发生错误" />
      <Toast variant="info" title="信息" children="提示信息" />
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
    return (
      <div className="p-8">
        <p className="text-neutral-600 mb-4">
          这些示例会在指定时间后自动消失。在 Storybook 中刷新页面可以重新查看动画效果。
        </p>
        <div className="space-y-3">
          <Toast
            variant="success"
            title="保存成功"
            duration={5000}
          >
            您的更改已成功保存到服务器
          </Toast>
          <Toast
            variant="warning"
            title="网络连接不稳定"
            duration={7000}
          >
            检测到网络连接不稳定，部分功能可能受影响
          </Toast>
          <Toast
            variant="error"
            title="上传失败"
            duration={10000}
          >
            文件上传失败，请检查网络连接后重试
          </Toast>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景示例',
      },
    },
  },
}
