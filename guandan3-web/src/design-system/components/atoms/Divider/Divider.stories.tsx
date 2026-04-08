import type { Meta, StoryObj } from '@storybook/react'
import { Divider } from './Divider'

const meta: Meta<typeof Divider> = {
  title: 'Design System/Atoms/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
    },
    dashed: {
      control: 'boolean',
    },
    label: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof Divider>

export const Horizontal: Story = {
  args: {},
}

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
    style: { height: '100px' },
  },
}

export const Dashed: Story = {
  args: {
    dashed: true,
  },
}

export const WithLabel: Story = {
  args: {
    label: '或',
  },
}

export const VerticalDashed: Story = {
  args: {
    orientation: 'vertical',
    dashed: true,
    style: { height: '100px' },
  },
}
