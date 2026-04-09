import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './Input'

const meta: Meta<typeof Input> = {
  title: 'Design System/Atoms/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success', 'warning'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Input size="sm" placeholder="Small input" />
      <Input size="md" placeholder="Medium input" />
      <Input size="lg" placeholder="Large input" />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Input placeholder="Default state" />
      <Input error placeholder="Error state" errorMessage="This field is required" />
      <Input placeholder="Success state" className="border-success" />
      <Input placeholder="Warning state" className="border-amber-500" />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <div>
        <label className="block text-sm font-medium mb-1">Username</label>
        <Input placeholder="Enter your username" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input type="email" placeholder="Enter your email" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <Input type="password" placeholder="Enter your password" />
      </div>
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Input
        placeholder="Search..."
        leftIcon={<span>🔍</span>}
      />
      <Input
        type="email"
        placeholder="Email"
        leftIcon={<span>📧</span>}
      />
      <Input
        type="password"
        placeholder="Password"
        leftIcon={<span>🔒</span>}
        rightIcon={<span>👁️</span>}
      />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'Cannot edit this',
    disabled: true,
  },
}

export const WithHelperText: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <div>
        <label className="block text-sm font-medium mb-1">Email Address</label>
        <Input
          type="email"
          placeholder="you@example.com"
        />
        <p className="text-xs text-neutral-500 mt-1">We'll never share your email with anyone else.</p>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <Input
          type="password"
          placeholder="Enter password"
          error
          errorMessage="Password is too short"
        />
        <p className="text-xs text-neutral-500 mt-1">Must be at least 8 characters long.</p>
      </div>
    </div>
  ),
}
