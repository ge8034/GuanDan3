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
      <Input state="default" placeholder="Default state" />
      <Input state="error" placeholder="Error state" errorMessage="This field is required" />
      <Input state="success" placeholder="Success state" />
      <Input state="warning" placeholder="Warning state" />
    </div>
  ),
}

export const WithLabel: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Input label="Username" placeholder="Enter your username" />
      <Input label="Email" type="email" placeholder="Enter your email" />
      <Input label="Password" type="password" placeholder="Enter your password" />
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
      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        helperText="We'll never share your email with anyone else."
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        helperText="Must be at least 8 characters long."
        state="error"
        errorMessage="Password is too short"
      />
    </div>
  ),
}
