import type { Meta, StoryObj } from '@storybook/react'
import { Select } from './Select'

const meta: Meta<typeof Select> = {
  title: 'Design System/Molecules/Select',
  component: Select,
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
type Story = StoryObj<typeof Select>

export const Default: Story = {
  args: {
    label: 'Choose an option',
    options: [
      { value: 'option1', label: 'Option 1' },
      { value: 'option2', label: 'Option 2' },
      { value: 'option3', label: 'Option 3' },
    ],
    placeholder: 'Select...',
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Select
        size="sm"
        label="Small Select"
        options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }]}
        placeholder="Choose..."
      />
      <Select
        size="md"
        label="Medium Select"
        options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }]}
        placeholder="Choose..."
      />
      <Select
        size="lg"
        label="Large Select"
        options={[{ value: '1', label: 'One' }, { value: '2', label: 'Two' }]}
        placeholder="Choose..."
      />
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Select
        label="Default"
        options={[{ value: '1', label: 'One' }]}
        placeholder="Select..."
      />
      <Select
        label="Error"
        state="error"
        errorMessage="Please select an option"
        options={[{ value: '1', label: 'One' }]}
        placeholder="Select..."
      />
      <Select
        label="Success"
        state="success"
        options={[{ value: '1', label: 'One' }]}
        placeholder="Select..."
      />
    </div>
  ),
}

export const WithGroups: Story = {
  args: {
    label: 'Select a fruit',
    options: [
      { group: 'Citrus', options: [
        { value: 'orange', label: 'Orange' },
        { value: 'lemon', label: 'Lemon' },
        { value: 'lime', label: 'Lime' },
      ]},
      { group: 'Berries', options: [
        { value: 'strawberry', label: 'Strawberry' },
        { value: 'blueberry', label: 'Blueberry' },
        { value: 'raspberry', label: 'Raspberry' },
      ]},
    ],
    placeholder: 'Choose a fruit...',
  },
}

export const Disabled: Story = {
  args: {
    label: 'Disabled Select',
    options: [{ value: '1', label: 'Option 1' }],
    placeholder: 'Cannot select',
    disabled: true,
  },
}

export const WithHelperText: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-4 max-w-xs">
      <Select
        label="Country"
        options={[
          { value: 'us', label: 'United States' },
          { value: 'uk', label: 'United Kingdom' },
          { value: 'ca', label: 'Canada' },
        ]}
        placeholder="Select your country"
        helperText="Choose your country of residence"
      />
      <Select
        label="Timezone"
        state="error"
        errorMessage="Timezone is required"
        options={[
          { value: 'est', label: 'Eastern Time' },
          { value: 'pst', label: 'Pacific Time' },
        ]}
        placeholder="Select timezone"
        helperText="Select your local timezone"
      />
    </div>
  ),
}
