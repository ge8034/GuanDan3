import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Switch } from './Switch'

const meta: Meta<typeof Switch> = {
  title: 'Design System/Atoms/Switch',
  component: Switch,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: '是否选中（受控）',
    },
    defaultChecked: {
      control: 'boolean',
      description: '默认是否选中（非受控）',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: '尺寸',
    },
    variant: {
      control: 'select',
      options: ['default', 'success', 'warning', 'error'],
      description: '颜色变体',
    },
    label: {
      control: 'text',
      description: '标签文本',
    },
    description: {
      control: 'text',
      description: '描述文本',
    },
  },
}

export default meta
type Story = StoryObj<typeof Switch>

export const Default: Story = {
  args: {},
}

export const Uncontrolled: Story = {
  args: {
    defaultChecked: false,
  },
}

export const Controlled: Story = {
  render: () => {
    const [checked, setChecked] = useState(false)
    return (
      <Switch checked={checked} onChange={setChecked} label="受控开关" />
    )
  },
  parameters: {
    docs: {
      description: {
        story: '使用 `checked` 和 `onChange` 实现受控模式',
      },
    },
  },
}

export const Checked: Story = {
  args: {
    checked: true,
    label: '已选中',
  },
}

export const WithLabel: Story = {
  args: {
    label: '启用通知',
  },
}

export const WithDescription: Story = {
  args: {
    label: '启用通知',
    description: '接收推送通知和更新提醒',
  },
}

export const Small: Story = {
  args: {
    size: 'sm',
    label: '小尺寸',
  },
}

export const Medium: Story = {
  args: {
    size: 'md',
    label: '中等尺寸',
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    label: '大尺寸',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    checked: true,
    label: '成功状态',
  },
}

export const Warning: Story = {
  args: {
    variant: 'warning',
    checked: true,
    label: '警告状态',
  },
}

export const Error: Story = {
  args: {
    variant: 'error',
    checked: true,
    label: '错误状态',
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    label: '禁用状态',
  },
}

export const DisabledChecked: Story = {
  args: {
    disabled: true,
    checked: true,
    label: '禁用且选中',
  },
}

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch size="sm" label="小尺寸开关" />
      <Switch size="md" label="中等尺寸开关" />
      <Switch size="lg" label="大尺寸开关" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示所有尺寸选项',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Switch variant="default" checked label="默认变体" />
      <Switch variant="success" checked label="成功变体" />
      <Switch variant="warning" checked label="警告变体" />
      <Switch variant="error" checked label="错误变体" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示所有颜色变体',
      },
    },
  },
}

export const InteractiveExample: Story = {
  render: () => {
    const [settings, setSettings] = useState({
      notifications: true,
      email: false,
      sms: true,
      marketing: false,
    })

    const handleChange = (key: string, value: boolean) => {
      setSettings(prev => ({ ...prev, [key]: value }))
    }

    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">通知设置</h2>
        <div className="flex flex-col gap-4">
          <Switch
            checked={settings.notifications}
            onChange={(v) => handleChange('notifications', v)}
            label="推送通知"
            description="在浏览器中接收推送通知"
          />
          <Switch
            checked={settings.email}
            onChange={(v) => handleChange('email', v)}
            label="邮件通知"
            description="接收重要更新的邮件通知"
          />
          <Switch
            checked={settings.sms}
            onChange={(v) => handleChange('sms', v)}
            label="短信通知"
            description="接收短信验证码和重要提醒"
          />
          <Switch
            checked={settings.marketing}
            onChange={(v) => handleChange('marketing', v)}
            variant="warning"
            label="营销信息"
            description="接收产品推广和优惠信息"
          />
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：设置面板',
      },
    },
  },
}

export const FormExample: Story = {
  render: () => {
    return (
      <form className="p-6 bg-white rounded-lg shadow" onSubmit={(e) => e.preventDefault()}>
        <h2 className="text-lg font-semibold mb-4">用户偏好</h2>
        <div className="flex flex-col gap-4">
          <Switch
            name="darkMode"
            value="enabled"
            defaultChecked={false}
            label="深色模式"
            description="启用深色主题"
          />
          <Switch
            name="compactView"
            value="enabled"
            defaultChecked={false}
            label="紧凑视图"
            description="显示更紧凑的界面布局"
          />
          <Switch
            name="animations"
            value="enabled"
            defaultChecked={true}
            label="动画效果"
            description="启用界面动画过渡效果"
          />
        </div>
        <button
          type="submit"
          className="mt-6 px-4 py-2 bg-poker-table-500 text-white rounded"
        >
          保存设置
        </button>
      </form>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '表单集成示例，使用 name 和 value 属性',
      },
    },
  },
}
