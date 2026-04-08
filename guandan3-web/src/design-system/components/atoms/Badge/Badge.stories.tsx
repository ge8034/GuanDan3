import type { Meta, StoryObj } from '@storybook/react'
import { Badge } from './Badge'

const meta: Meta<typeof Badge> = {
  title: 'Design System/Atoms/Badge',
  component: Badge,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Badge>

export const Default: Story = {
  args: {
    children: 'Badge',
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge variant="default">Default</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="success">Success</Badge>
      <Badge variant="warning">Warning</Badge>
      <Badge variant="error">Error</Badge>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Badge size="sm">Small</Badge>
      <Badge size="md">Medium</Badge>
      <Badge size="lg">Large</Badge>
    </div>
  ),
}

export const Dot: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <Badge className="absolute -top-1 -right-1" dot />
      </div>
      <div className="relative">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <Badge className="absolute -top-1 -right-1" dot variant="success" />
      </div>
      <div className="relative">
        <div className="w-10 h-10 bg-gray-200 rounded-full" />
        <Badge className="absolute -top-1 -right-1" dot variant="error" />
      </div>
    </div>
  ),
}

export const WithCount: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <div className="relative inline-block">
        <button className="px-4 py-2 bg-gray-100 rounded">Messages</button>
        <Badge className="absolute -top-2 -right-2">5</Badge>
      </div>
      <div className="relative inline-block">
        <button className="px-4 py-2 bg-gray-100 rounded">Notifications</button>
        <Badge className="absolute -top-2 -right-2" variant="error">99+</Badge>
      </div>
    </div>
  ),
}
