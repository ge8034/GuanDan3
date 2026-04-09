import type { Meta, StoryObj } from '@storybook/react'
import { Spinner } from './Spinner'

const meta: Meta<typeof Spinner> = {
  title: 'Design System/Atoms/Spinner',
  component: Spinner,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
    },
    variant: {
      control: 'select',
      options: ['default', 'primary', 'success', 'warning', 'error'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Spinner>

export const Default: Story = {
  args: {
    size: 'md',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <Spinner size="xs" />
      <Spinner size="sm" />
      <Spinner size="md" />
      <Spinner size="lg" />
      <Spinner size="xl" />
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="flex items-center gap-6 p-4">
      <Spinner variant="primary" />
      <Spinner variant="secondary" />
      <Spinner variant="white" className="bg-neutral-900" />
      <Spinner variant="gold" />
    </div>
  ),
}

export const WithText: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-3">
        <Spinner size="sm" />
        <span>Loading...</span>
      </div>
      <div className="flex items-center gap-3">
        <Spinner />
        <span className="text-lg">Please wait while we process your request</span>
      </div>
      <div className="flex items-center gap-3">
        <Spinner size="lg" variant="primary" />
        <span className="text-xl font-medium">Connecting to server...</span>
      </div>
    </div>
  ),
}

export const Centered: Story = {
  render: () => (
    <div className="flex items-center justify-center h-64 border rounded">
      <Spinner size="lg" />
    </div>
  ),
}

export const FullPage: Story = {
  render: () => (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div className="text-center">
        <Spinner size="xl" variant="primary" />
        <p className="mt-4 text-gray-600">Loading application...</p>
      </div>
    </div>
  ),
}
