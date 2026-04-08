/**
 * Modal 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 打开/关闭状态
 * - 尺寸变化
 * - 键盘事件（ESC）
 * - 点击遮罩关闭
 * - 子组件
 * - 可访问性
 * - 动画效果
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Modal, ModalDescription, ModalContent, ModalFooter } from './Modal'

describe('Modal - 基础渲染', () => {
  it('open=false时不渲染', () => {
    render(<Modal open={false}>内容</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('open=true时渲染对话框', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('渲染内容', () => {
    render(<Modal open={true}>模态框内容</Modal>)
    expect(screen.getByText('模态框内容')).toBeInTheDocument()
  })

  it('使用默认尺寸 (md)', () => {
    render(<Modal open={true}>内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('max-w-lg')
  })
})

describe('Modal - 打开/关闭状态', () => {
  it('初始open=false后变为true时渲染', () => {
    const { rerender } = render(<Modal open={false}>内容</Modal>)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    rerender(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('点击关闭按钮触发onOpenChange', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleClose}>
        内容
      </Modal>
    )

    const closeButton = screen.getByLabelText('关闭对话框')
    await user.click(closeButton)

    expect(handleClose).toHaveBeenCalledWith(false)
  })

  it('showCloseButton=false时不显示关闭按钮', () => {
    render(
      <Modal open={true} showCloseButton={false}>
        内容
      </Modal>
    )
    expect(screen.queryByLabelText('关闭对话框')).not.toBeInTheDocument()
  })
})

describe('Modal - 点击遮罩关闭', () => {
  it('closeOnOverlayClick=true时点击遮罩关闭', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleClose} closeOnOverlayClick={true}>
        内容
      </Modal>
    )

    // 点击遮罩层
    const overlay = screen.getByRole('dialog').parentElement
    if (overlay) {
      await user.click(overlay)
      expect(handleClose).toHaveBeenCalledWith(false)
    }
  })

  it('closeOnOverlayClick=false时不关闭', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleClose} closeOnOverlayClick={false}>
        内容
      </Modal>
    )

    const overlay = screen.getByRole('dialog').parentElement
    if (overlay) {
      await user.click(overlay)
      expect(handleClose).not.toHaveBeenCalled()
    }
  })

  it('点击对话框内容不关闭', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleClose} closeOnOverlayClick={true}>
        内容
      </Modal>
    )

    const dialog = screen.getByRole('dialog')
    await user.click(dialog)

    expect(handleClose).not.toHaveBeenCalled()
  })
})

describe('Modal - 键盘事件', () => {
  it('按ESC键关闭对话框', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleClose} closeOnEscape={true}>
        内容
      </Modal>
    )

    await user.keyboard('{Escape}')

    expect(handleClose).toHaveBeenCalledWith(false)
  })

  it('closeOnEscape=false时按ESC不关闭', async () => {
    const user = userEvent.setup()
    const handleClose = vi.fn()
    render(
      <Modal open={true} onOpenChange={handleClose} closeOnEscape={false}>
        内容
      </Modal>
    )

    await user.keyboard('{Escape}')

    expect(handleClose).not.toHaveBeenCalled()
  })
})

describe('Modal - 尺寸变化', () => {
  it('应用 sm 尺寸', () => {
    render(<Modal open={true} size="sm">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('max-w-md')
  })

  it('应用 md 尺寸', () => {
    render(<Modal open={true} size="md">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('max-w-lg')
  })

  it('应用 lg 尺寸', () => {
    render(<Modal open={true} size="lg">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('max-w-2xl')
  })

  it('应用 xl 尺寸', () => {
    render(<Modal open={true} size="xl">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('max-w-4xl')
  })

  it('应用 full 尺寸', () => {
    render(<Modal open={true} size="full">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('max-w-full', 'mx-4')
  })
})

describe('Modal - 标题和描述', () => {
  it('显示标题', () => {
    render(<Modal open={true} title="对话框标题">内容</Modal>)
    expect(screen.getByText('对话框标题')).toBeInTheDocument()
  })

  it('显示描述', () => {
    render(
      <Modal open={true} description="对话框描述">
        内容
      </Modal>
    )
    expect(screen.getByText('对话框描述')).toBeInTheDocument()
  })

  it('同时显示标题和描述', () => {
    render(
      <Modal open={true} title="标题" description="描述">
        内容
      </Modal>
    )
    expect(screen.getByText('标题')).toBeInTheDocument()
    expect(screen.getByText('描述')).toBeInTheDocument()
  })

  it('标题有正确的id', () => {
    render(<Modal open={true} title="标题">内容</Modal>)
    const title = screen.getByText('标题')
    expect(title).toHaveAttribute('id', 'modal-title')
  })

  it('描述有正确的id', () => {
    render(<Modal open={true} description="描述">内容</Modal>)
    const description = screen.getByText('描述')
    expect(description).toHaveAttribute('id', 'modal-description')
  })
})

describe('Modal - 遮罩', () => {
  it('showOverlay=true时显示遮罩', () => {
    render(<Modal open={true} showOverlay={true}>内容</Modal>)
    const overlay = screen.getByRole('dialog').parentElement?.querySelector('.bg-black\\/50')
    expect(overlay).toBeInTheDocument()
  })

  it('showOverlay=false时不显示遮罩', () => {
    render(<Modal open={true} showOverlay={false}>内容</Modal>)
    const overlay = screen.getByRole('dialog').parentElement?.querySelector('.bg-black\\/50')
    expect(overlay).not.toBeInTheDocument()
  })
})

describe('Modal - 子组件', () => {
  it('ModalContent渲染内容', () => {
    render(
      <Modal open={true}>
        <ModalContent>内容区域</ModalContent>
      </Modal>
    )
    expect(screen.getByText('内容区域')).toBeInTheDocument()
  })

  it('ModalContent应用正确样式', () => {
    render(
      <Modal open={true}>
        <ModalContent>内容</ModalContent>
      </Modal>
    )
    const content = screen.getByText('内容')
    expect(content).toHaveClass('py-4')
  })

  it('ModalFooter渲染底部', () => {
    render(
      <Modal open={true}>
        <ModalFooter>底部按钮</ModalFooter>
      </Modal>
    )
    expect(screen.getByText('底部按钮')).toBeInTheDocument()
  })

  it('ModalFooter应用flex布局', () => {
    render(
      <Modal open={true}>
        <ModalFooter>底部</ModalFooter>
      </Modal>
    )
    const footer = screen.getByText('底部')
    expect(footer).toHaveClass('flex', 'items-center', 'justify-end', 'gap-3')
  })

  it('ModalDescription应用正确样式', () => {
    render(<ModalDescription>描述文本</ModalDescription>)
    const description = screen.getByText('描述文本')
    expect(description).toHaveClass('text-sm', 'text-neutral-600')
  })
})

describe('Modal - 可访问性', () => {
  it('有正确的role属性', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('有aria-modal属性', () => {
    render(<Modal open={true}>内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
  })

  it('标题存在时设置aria-labelledby', () => {
    render(<Modal open={true} title="标题">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title')
  })

  it('描述存在时设置aria-describedby', () => {
    render(<Modal open={true} description="描述">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description')
  })

  it('关闭按钮有正确的aria-label', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(screen.getByLabelText('关闭对话框')).toBeInTheDocument()
  })
})

describe('Modal - 动画效果', () => {
  it('应用动画类名', () => {
    render(<Modal open={true}>内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass(
      'animate-in',
      'fade-in',
      'slide-in-from-bottom-4',
      'zoom-in-95'
    )
  })

  it('应用正确的过渡时长', () => {
    render(<Modal open={true}>内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('duration-300')
  })

  it('应用正确的缓动函数', () => {
    render(<Modal open={true}>内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('ease-[cubic-bezier(0.16,1,0.3,1)]')
  })
})

describe('Modal - 页面滚动锁定', () => {
  it('打开时禁止body滚动', () => {
    render(<Modal open={true}>内容</Modal>)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('关闭后恢复body滚动', () => {
    const { unmount } = render(<Modal open={true}>内容</Modal>)
    unmount()
    expect(document.body.style.overflow).toBe('')
  })
})

describe('Modal - 自定义类名', () => {
  it('支持自定义className', () => {
    render(<Modal open={true} className="custom-modal">内容</Modal>)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveClass('custom-modal')
  })

  it('传递其他HTML属性', () => {
    render(<Modal open={true} data-testid="test-modal">内容</Modal>)
    expect(screen.getByTestId('test-modal')).toBeInTheDocument()
  })
})
