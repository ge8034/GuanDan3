import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './Progress'

const meta: Meta<typeof Progress> = {
  title: 'Design System/Atoms/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: '进度值 (0-100)',
    },
    max: {
      control: 'number',
      description: '最大值',
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
    showLabel: {
      control: 'boolean',
      description: '显示百分比标签',
    },
    indeterminate: {
      control: 'boolean',
      description: '不确定进度（加载动画）',
    },
  },
}

export default meta
type Story = StoryObj<typeof Progress>

export const Default: Story = {
  args: {
    value: 50,
  },
}

export const Zero: Story = {
  args: {
    value: 0,
  },
}

export const Half: Story = {
  args: {
    value: 50,
  },
}

export const Complete: Story = {
  args: {
    value: 100,
  },
}

export const WithLabel: Story = {
  args: {
    value: 75,
    showLabel: true,
  },
}

export const Small: Story = {
  args: {
    value: 50,
    size: 'sm',
  },
}

export const Large: Story = {
  args: {
    value: 50,
    size: 'lg',
  },
}

export const Success: Story = {
  args: {
    value: 100,
    variant: 'success',
    showLabel: true,
  },
}

export const Warning: Story = {
  args: {
    value: 60,
    variant: 'warning',
    showLabel: true,
  },
}

export const Error: Story = {
  args: {
    value: 30,
    variant: 'error',
    showLabel: true,
  },
}

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
}

export const CustomMax: Story = {
  args: {
    value: 150,
    max: 200,
    showLabel: true,
  },
  parameters: {
    docs: {
      description: {
        story: '当 max 不是默认值 100 时，百分比会相应计算。150/200 = 75%',
      },
    },
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ width: '300px' }}>
      <Progress value={50} variant="default" showLabel />
      <Progress value={100} variant="success" showLabel />
      <Progress value={60} variant="warning" showLabel />
      <Progress value={30} variant="error" showLabel />
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

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4" style={{ width: '300px' }}>
      <Progress value={50} size="sm" showLabel />
      <Progress value={50} size="md" showLabel />
      <Progress value={50} size="lg" showLabel />
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
