import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './Tabs'

const meta: Meta<typeof Tabs> = {
  title: 'Design System/Molecules/Tabs',
  component: Tabs,
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Tabs>

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        <TabsTrigger value="tab3">Tab 3</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4">Content for Tab 1</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4">Content for Tab 2</div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4">Content for Tab 3</div>
      </TabsContent>
    </Tabs>
  ),
}

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="home">
      <TabsList>
        <TabsTrigger value="home">
          <span className="mr-2">🏠</span>
          Home
        </TabsTrigger>
        <TabsTrigger value="profile">
          <span className="mr-2">👤</span>
          Profile
        </TabsTrigger>
        <TabsTrigger value="settings">
          <span className="mr-2">⚙️</span>
          Settings
        </TabsTrigger>
      </TabsList>
      <TabsContent value="home">
        <div className="p-4">Home content</div>
      </TabsContent>
      <TabsContent value="profile">
        <div className="p-4">Profile content</div>
      </TabsContent>
      <TabsContent value="settings">
        <div className="p-4">Settings content</div>
      </TabsContent>
    </Tabs>
  ),
}

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="tab1">
      <TabsList>
        <TabsTrigger value="tab1">Active Tab</TabsTrigger>
        <TabsTrigger value="tab2" disabled>Disabled Tab</TabsTrigger>
        <TabsTrigger value="tab3">Another Active</TabsTrigger>
      </TabsList>
      <TabsContent value="tab1">
        <div className="p-4">This tab is active</div>
      </TabsContent>
      <TabsContent value="tab2">
        <div className="p-4">This tab is disabled</div>
      </TabsContent>
      <TabsContent value="tab3">
        <div className="p-4">This tab is active</div>
      </TabsContent>
    </Tabs>
  ),
}

export const Controlled: Story = {
  render: () => {
    const [value, setValue] = useState('tab1')
    return (
      <Tabs value={value} onValueChange={setValue}>
        <TabsList>
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">
          <div className="p-4">Tab 1 Content (Controlled)</div>
        </TabsContent>
        <TabsContent value="tab2">
          <div className="p-4">Tab 2 Content (Controlled)</div>
        </TabsContent>
      </Tabs>
    )
  },
}
