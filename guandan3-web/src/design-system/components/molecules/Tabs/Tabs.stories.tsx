import type { Meta, StoryObj } from '@storybook/react'
import { Tabs } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['underline', 'pills', 'enclosed'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  args: {
    defaultValue: 'tab1',
    tabs: [
      { value: 'tab1', label: 'Tab 1', content: <div className="p-4">Content for Tab 1</div> },
      { value: 'tab2', label: 'Tab 2', content: <div className="p-4">Content for Tab 2</div> },
      { value: 'tab3', label: 'Tab 3', content: <div className="p-4">Content for Tab 3</div> },
    ],
  },
}

export const Variants: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4">
      <Tabs
        defaultValue="tab1"
        variant="underline"
        tabs={[
          { value: 'tab1', label: 'Home', content: <div className="p-4">Home content</div> },
          { value: 'tab2', label: 'Profile', content: <div className="p-4">Profile content</div> },
          { value: 'tab3', label: 'Settings', content: <div className="p-4">Settings content</div> },
        ]}
      />
      <Tabs
        defaultValue="tab1"
        variant="pills"
        tabs={[
          { value: 'tab1', label: 'Overview', content: <div className="p-4">Overview</div> },
          { value: 'tab2', label: 'Details', content: <div className="p-4">Details</div> },
        ]}
      />
      <Tabs
        defaultValue="tab1"
        variant="enclosed"
        tabs={[
          { value: 'tab1', label: 'Account', content: <div className="p-4">Account settings</div> },
          { value: 'tab2', label: 'Privacy', content: <div className="p-4">Privacy settings</div> },
        ]}
      />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-8 p-4">
      <Tabs
        defaultValue="tab1"
        size="sm"
        tabs={[
          { value: 'tab1', label: 'Small', content: <div className="p-4">Small tabs</div> },
          { value: 'tab2', label: 'Tab 2', content: <div className="p-4">Content</div> },
        ]}
      />
      <Tabs
        defaultValue="tab1"
        size="md"
        tabs={[
          { value: 'tab1', label: 'Medium', content: <div className="p-4">Medium tabs</div> },
          { value: 'tab2', label: 'Tab 2', content: <div className="p-4">Content</div> },
        ]}
      />
      <Tabs
        defaultValue="tab1"
        size="lg"
        tabs={[
          { value: 'tab1', label: 'Large', content: <div className="p-4">Large tabs</div> },
          { value: 'tab2', label: 'Tab 2', content: <div className="p-4">Content</div> },
        ]}
      />
    </div>
  ),
}

export const WithIcons: Story = {
  args: {
    defaultValue: 'tab1',
    tabs: [
      { value: 'tab1', label: 'Home', icon: <span>🏠</span>, content: <div className="p-4">Home content</div> },
      { value: 'tab2', label: 'Search', icon: <span>🔍</span>, content: <div className="p-4">Search content</div> },
      { value: 'tab3', label: 'Settings', icon: <span>⚙️</span>, content: <div className="p-4">Settings content</div> },
    ],
  },
}

export const WithBadges: Story = {
  args: {
    defaultValue: 'tab1',
    tabs: [
      { value: 'tab1', label: 'Messages', badge: '5', content: <div className="p-4">5 new messages</div> },
      { value: 'tab2', label: 'Notifications', badge: '12', content: <div className="p-4">12 notifications</div> },
      { value: 'tab3', label: 'Tasks', badge: '3', content: <div className="p-4">3 pending tasks</div> },
    ],
  },
}

export const DisabledTabs: Story = {
  args: {
    defaultValue: 'tab1',
    tabs: [
      { value: 'tab1', label: 'Active Tab', content: <div className="p-4">This tab is active</div> },
      { value: 'tab2', label: 'Disabled Tab', disabled: true, content: <div className="p-4">This tab is disabled</div> },
      { value: 'tab3', label: 'Another Active', content: <div className="p-4">This tab is active</div> },
    ],
  },
}

export const Vertical: Story = {
  args: {
    defaultValue: 'tab1',
    orientation: 'vertical',
    tabs: [
      { value: 'tab1', label: 'Dashboard', content: <div className="p-4">Dashboard content</div> },
      { value: 'tab2', label: 'Analytics', content: <div className="p-4">Analytics content</div> },
      { value: 'tab3', label: 'Reports', content: <div className="p-4">Reports content</div> },
      { value: 'tab4', label: 'Settings', content: <div className="p-4">Settings content</div> },
    ],
  },
}
