import type { Meta, StoryObj } from '@storybook/react'
import { Card } from './Card'

const meta: Meta<typeof Card> = {
  title: 'Design System/Atoms/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined', 'flat'],
    },
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Card>

export const Default: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Card Title</h3>
        <p className="text-gray-600">This is a default card with some content inside.</p>
      </div>
    ),
  },
}

export const Variants: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card variant="default">
        <h3 className="font-semibold mb-2">Default</h3>
        <p className="text-sm text-gray-600">Default card style</p>
      </Card>
      <Card variant="elevated">
        <h3 className="font-semibold mb-2">Elevated</h3>
        <p className="text-sm text-gray-600">With shadow elevation</p>
      </Card>
      <Card variant="outlined">
        <h3 className="font-semibold mb-2">Outlined</h3>
        <p className="text-sm text-gray-600">With border outline</p>
      </Card>
      <Card variant="flat">
        <h3 className="font-semibold mb-2">Flat</h3>
        <p className="text-sm text-gray-600">No shadow or border</p>
      </Card>
    </div>
  ),
}

export const Padding: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card padding="none">
        <img src="https://via.placeholder.com/300x200" alt="No padding" className="w-full" />
      </Card>
      <Card padding="sm">
        <h4 className="font-semibold">Small Padding</h4>
        <p className="text-sm text-gray-600">Compact content spacing</p>
      </Card>
      <Card padding="md">
        <h4 className="font-semibold">Medium Padding</h4>
        <p className="text-sm text-gray-600">Default content spacing</p>
      </Card>
      <Card padding="lg">
        <h4 className="font-semibold">Large Padding</h4>
        <p className="text-sm text-gray-600">Spacious content layout</p>
      </Card>
    </div>
  ),
}

export const Interactive: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-4 p-4">
      <Card hover>
        <h3 className="font-semibold mb-2">Hoverable Card</h3>
        <p className="text-sm text-gray-600">Try hovering over this card</p>
      </Card>
      <Card clickable onClick={() => alert('Card clicked!')}>
        <h3 className="font-semibold mb-2">Clickable Card</h3>
        <p className="text-sm text-gray-600">Click this card</p>
      </Card>
    </div>
  ),
}

export const WithHeader: Story = {
  args: {
    header: <div className="flex items-center justify-between">
      <h3 className="font-semibold">Card Header</h3>
      <button className="text-gray-400 hover:text-gray-600">×</button>
    </div>,
    children: (
      <p className="text-gray-600">Card content goes here. This card has a custom header section.</p>
    ),
  },
}

export const WithFooter: Story = {
  args: {
    children: (
      <p className="text-gray-600">Card content goes here. This card has a custom footer section.</p>
    ),
    footer: (
      <div className="flex justify-end gap-2 pt-4 border-t">
        <button className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
        <button className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">Confirm</button>
      </div>
    ),
  },
}
