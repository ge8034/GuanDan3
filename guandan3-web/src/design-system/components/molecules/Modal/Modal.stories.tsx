import type { Meta, StoryObj } from '@storybook/react'
import { Modal } from './Modal'
import { useState } from 'react'

const meta: Meta<typeof Modal> = {
  title: 'Design System/Molecules/Modal',
  component: Modal,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', 'full'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    const [open, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal open={open} onOpenChange={setIsOpen} title="Modal Title">
          <p className="p-6">This is a modal dialog. It can contain any content you need.</p>
          <div className="p-6 pt-0 flex justify-end gap-2">
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => setIsOpen(false)}>Confirm</button>
          </div>
        </Modal>
      </>
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<string | null>(null)
    const sizes: Array<'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['sm', 'md', 'lg', 'xl', 'full']

    return (
      <div className="flex flex-wrap gap-2 p-4">
        {sizes.map((size) => (
          <button key={size} onClick={() => setOpenSize(size)}>
            {size} modal
          </button>
        ))}
        {sizes.map((size) => (
          <Modal
            key={size}
            open={openSize === size}
            onOpenChange={() => setOpenSize(null)}
            title={`${size.toUpperCase()} Modal`}
            size={size}
          >
            <p className="p-6">This is a {size} sized modal.</p>
            <div className="p-6 pt-0 flex justify-end">
              <button onClick={() => setOpenSize(null)}>Close</button>
            </div>
          </Modal>
        ))}
      </div>
    )
  },
}

export const WithDescription: Story = {
  render: () => {
    const [open, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal
          open={open}
          onOpenChange={setIsOpen}
          title="Modal Title"
          description="Additional description text for accessibility"
        >
          <p className="p-6">This modal has both a title and description.</p>
        </Modal>
      </>
    )
  },
}

export const WithoutCloseButton: Story = {
  render: () => {
    const [open, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal open={open} onOpenChange={setIsOpen} title="No Close Button" showCloseButton={false}>
          <p className="p-6">This modal has no X button. Close by clicking outside or pressing Escape.</p>
        </Modal>
      </>
    )
  },
}

export const NonDismissible: Story = {
  render: () => {
    const [open, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Non-Dismissable Modal</button>
        <Modal
          open={open}
          onOpenChange={setIsOpen}
          title="Confirm Action"
          closeOnOverlayClick={false}
          closeOnEscape={false}
        >
          <p className="p-6">This modal cannot be dismissed by clicking outside or pressing Escape.</p>
          <div className="p-6 pt-0 flex justify-end gap-2">
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => setIsOpen(false)}>Confirm</button>
          </div>
        </Modal>
      </>
    )
  },
}

export const WithoutOverlay: Story = {
  render: () => {
    const [open, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal open={open} onOpenChange={setIsOpen} title="No Overlay" showOverlay={false}>
          <p className="p-6">This modal has no overlay background.</p>
        </Modal>
      </>
    )
  },
}
