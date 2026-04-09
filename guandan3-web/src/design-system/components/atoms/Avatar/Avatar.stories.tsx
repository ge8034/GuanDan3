import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Design System/Atoms/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['circle', 'square'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Circle: Story = {
  args: {
    size: 'md',
    variant: 'circle',
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    alt: 'User avatar',
  },
}

export const Square: Story = {
  args: {
    size: 'md',
    variant: 'square',
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    alt: 'User avatar',
  },
}

export const Sizes: Story = {
  args: {
    variant: 'circle',
    src: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
    alt: 'User avatar',
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      <Avatar {...args} size="xs" />
      <Avatar {...args} size="sm" />
      <Avatar {...args} size="md" />
      <Avatar {...args} size="lg" />
      <Avatar {...args} size="xl" />
    </div>
  ),
}

export const Fallback: Story = {
  args: {
    size: 'md',
    variant: 'circle',
    alt: 'User avatar',
  },
}

export const WithText: Story = {
  render: () => (
    <div className="flex items-center gap-4">
      <Avatar size="md" alt="AB" />
      <Avatar size="lg" alt="CD" />
      <Avatar size="xl" alt="EF" />
    </div>
  ),
}
