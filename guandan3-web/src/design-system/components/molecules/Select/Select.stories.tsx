import type { Meta, StoryObj } from '@storybook/react'
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Design System/Molecules/Select',
  component: Select,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Select>

export const Default: Story = {
  render: () => (
    <Select defaultValue="option1" className="max-w-xs">
      <SelectTrigger>
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1">Option 1</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
}

export const WithPlaceholder: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Select>
        <SelectTrigger>
          <SelectValue placeholder="Choose an option..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectContent>
      </Select>

      <Select defaultValue="apple">
        <SelectTrigger>
          <SelectValue placeholder="Choose an option..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apple">Apple</SelectItem>
          <SelectItem value="banana">Banana</SelectItem>
          <SelectItem value="orange">Orange</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Error: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Select>
        <SelectTrigger error>
          <SelectValue placeholder="Select an option..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Cannot select..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
}

export const WithDisabledItems: Story = {
  render: () => (
    <Select defaultValue="option2">
      <SelectTrigger>
        <SelectValue placeholder="Choose..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="option1" disabled>Option 1 (Disabled)</SelectItem>
        <SelectItem value="option2">Option 2</SelectItem>
        <SelectItem value="option3">Option 3</SelectItem>
      </SelectContent>
    </Select>
  ),
}
