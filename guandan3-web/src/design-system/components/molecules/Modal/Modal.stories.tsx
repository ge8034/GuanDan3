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
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'full'],
    },
  },
}

export default meta
type Story = StoryObj<typeof Modal>

export const Default: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Modal.Header>
            <Modal.Title>Modal Title</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>This is a modal dialog. It can contain any content you need.</p>
          </Modal.Body>
          <Modal.Footer>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => setIsOpen(false)}>Confirm</button>
          </Modal.Footer>
        </Modal>
      </>
    )
  },
}

export const Sizes: Story = {
  render: () => {
    const [openSize, setOpenSize] = useState<string | null>(null)
    const sizes: Array<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full'> = ['xs', 'sm', 'md', 'lg', 'xl', 'full']

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
            isOpen={openSize === size}
            onClose={() => setOpenSize(null)}
            size={size}
          >
            <Modal.Header>
              <Modal.Title>{size.toUpperCase()} Modal</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <p>This is a {size} sized modal.</p>
            </Modal.Body>
            <Modal.Footer>
              <button onClick={() => setOpenSize(null)}>Close</button>
            </Modal.Footer>
          </Modal>
        ))}
      </div>
    )
  },
}

export const WithoutHeader: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Modal.Body>
            <p>This modal has no header section.</p>
          </Modal.Body>
          <Modal.Footer>
            <button onClick={() => setIsOpen(false)}>Close</button>
          </Modal.Footer>
        </Modal>
      </>
    )
  },
}

export const WithoutFooter: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Modal.Header>
            <Modal.Title>Modal without Footer</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>This modal has no footer section. Close it using the X button or clicking outside.</p>
          </Modal.Body>
        </Modal>
      </>
    )
  },
}

export const BodyOnly: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Modal</button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Modal.Body>
            <p>This modal only has a body. No header, no footer.</p>
          </Modal.Body>
        </Modal>
      </>
    )
  },
}

export const WithForm: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Form Modal</button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
          <Modal.Header>
            <Modal.Title>Create Account</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <form className="space-y-4">
              <div>
                <label htmlFor="name">Name</label>
                <input id="name" type="text" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label htmlFor="password">Password</label>
                <input id="password" type="password" className="w-full border rounded px-3 py-2" />
              </div>
            </form>
          </Modal.Body>
          <Modal.Footer>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => setIsOpen(false)}>Create Account</button>
          </Modal.Footer>
        </Modal>
      </>
    )
  },
}

export const NonDismissible: Story = {
  render: () => {
    const [isOpen, setIsOpen] = useState(false)
    return (
      <>
        <button onClick={() => setIsOpen(true)}>Open Non-Dismissable Modal</button>
        <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} dismissible={false}>
          <Modal.Header>
            <Modal.Title>Confirm Action</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p>This modal cannot be dismissed by clicking outside or pressing Escape. You must click one of the buttons below.</p>
          </Modal.Body>
          <Modal.Footer>
            <button onClick={() => setIsOpen(false)}>Cancel</button>
            <button onClick={() => setIsOpen(false)}>Confirm</button>
          </Modal.Footer>
        </Modal>
      </>
    )
  },
}
