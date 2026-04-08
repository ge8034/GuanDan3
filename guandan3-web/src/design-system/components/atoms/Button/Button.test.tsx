/**
 * Button 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 变体样式
 * - 尺寸变化
 * - 8种交互状态
 * - 可访问性
 * - 事件处理
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import { CheckCircle2, XCircle } from 'lucide-react'

describe('Button - 基础渲染', () => {
  it('渲染文本内容', () => {
    render(<Button>点击我</Button>)
    expect(screen.getByRole('button')).toHaveTextContent('点击我')
  })

  it('使用默认变体 (primary)', () => {
    render(<Button>默认按钮</Button>)
    const button = screen.getByRole('button')
    // primary 变体使用渐变背景
    expect(button).toHaveClass('bg-gradient-to-br', 'from-poker-table-light', 'to-poker-table-dark')
  })

  it('使用默认尺寸 (md)', () => {
    render(<Button>默认尺寸</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('px-6', 'py-3', 'text-base')
  })
})

describe('Button - 变体样式', () => {
  it('应用 primary 变体', () => {
    render(<Button variant="primary">主要按钮</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('bg-gradient-to-br', 'from-poker-table-light')
  })

  it('应用 secondary 变体', () => {
    render(<Button variant="secondary">次要按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-neutral-200')
  })

  it('应用 outline 变体', () => {
    render(<Button variant="outline">轮廓按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'border-accent-gold')
  })

  it('应用 ghost 变体', () => {
    render(<Button variant="ghost">幽灵按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-transparent', 'border-transparent')
  })

  it('应用 danger 变体', () => {
    render(<Button variant="danger">危险按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-error')
  })

  it('应用 success 变体', () => {
    render(<Button variant="success">成功按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-success')
  })

  it('应用 soft 变体', () => {
    render(<Button variant="soft">紫色按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('bg-[#a78bfa]')
  })
})

describe('Button - 尺寸变化', () => {
  it('应用 xs 尺寸', () => {
    render(<Button size="xs">超小</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-3', 'py-1', 'text-xs')
  })

  it('应用 sm 尺寸', () => {
    render(<Button size="sm">小</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-4', 'py-2', 'text-sm')
  })

  it('应用 md 尺寸', () => {
    render(<Button size="md">中</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3', 'text-base')
  })

  it('应用 lg 尺寸', () => {
    render(<Button size="lg">大</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-8', 'py-4', 'text-lg')
  })

  it('应用 xl 尺寸', () => {
    render(<Button size="xl">超大</Button>)
    expect(screen.getByRole('button')).toHaveClass('px-10', 'py-5', 'text-xl')
  })
})

describe('Button - 8种交互状态', () => {
  describe('1. Default - 默认状态', () => {
    it('默认状态样式正确', () => {
      render(<Button>默认</Button>)
      const button = screen.getByRole('button')
      expect(button).not.toBeDisabled()
      expect(button).toHaveAttribute('aria-busy', 'false')
    })
  })

  describe('2. Hover - 悬停状态', () => {
    it('悬停时应用hover样式', async () => {
      const user = userEvent.setup()
      render(<Button>悬停我</Button>)
      const button = screen.getByRole('button')

      await user.hover(button)
      // primary 变体的 hover 使用渐变变化
      expect(button).toHaveClass('hover:from-poker-table-accent')
    })
  })

  describe('3. Focus - 焦点状态', () => {
    it('焦点时显示焦点环', async () => {
      const user = userEvent.setup()
      render(<Button>聚焦我</Button>)
      const button = screen.getByRole('button')

      await user.tab()
      expect(button).toHaveFocus()
      expect(button).toHaveClass('focus-visible:outline-2')
    })
  })

  describe('4. Active - 激活状态', () => {
    it('点击时应用active样式', async () => {
      const user = userEvent.setup()
      render(<Button>点击我</Button>)
      const button = screen.getByRole('button')

      await user.click(button)
      // primary 变体的 active 使用 opacity
      expect(button).toHaveClass('active:opacity-90')
    })
  })

  describe('5. Disabled - 禁用状态', () => {
    it('禁用时不可交互', () => {
      render(<Button disabled>禁用</Button>)
      const button = screen.getByRole('button')

      expect(button).toBeDisabled()
      expect(button).toHaveClass('disabled:opacity-50', 'disabled:cursor-not-allowed')
    })

    it('禁用时不触发点击', async () => {
      const handleClick = vi.fn()
      const user = userEvent.setup()
      render(<Button disabled onClick={handleClick}>禁用</Button>)

      await user.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe('6. Loading - 加载状态', () => {
    it('显示加载指示器', () => {
      render(<Button loading>加载中</Button>)
      const button = screen.getByRole('button')

      expect(button).toHaveAttribute('aria-busy', 'true')
      expect(button.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('禁用交互', () => {
      render(<Button loading>加载中</Button>)
      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('显示自定义加载文本', () => {
      render(<Button loading loadingText="处理中...">
        提交
      </Button>)
      expect(screen.getByRole('button')).toHaveTextContent('处理中...')
    })
  })

  describe('7. Error - 错误状态', () => {
    it('显示错误样式', () => {
      render(<Button error>错误</Button>)
      expect(screen.getByRole('button')).toHaveClass(
        'border-error',
        'text-error'
      )
    })

    it('设置aria-invalid属性', () => {
      render(<Button error>错误</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true')
    })
  })

  describe('8. Success - 成功状态', () => {
    it('显示成功样式', () => {
      render(<Button success>成功</Button>)
      expect(screen.getByRole('button')).toHaveClass(
        'border-success',
        'text-success'
      )
    })
  })
})

describe('Button - 图标支持', () => {
  it('显示左侧图标', () => {
    render(<Button leftIcon={<CheckCircle2 data-testid="left-icon" />}>
      带图标
    </Button>)
    expect(screen.getByTestId('left-icon')).toBeInTheDocument()
  })

  it('显示右侧图标', () => {
    render(<Button rightIcon={<XCircle data-testid="right-icon" />}>
      带图标
    </Button>)
    expect(screen.getByTestId('right-icon')).toBeInTheDocument()
  })

  it('加载中隐藏图标', () => {
    render(
      <Button
        loading
        leftIcon={<CheckCircle2 data-testid="left-icon" />}
        rightIcon={<XCircle data-testid="right-icon" />}
      >
        加载中
      </Button>
    )
    expect(screen.queryByTestId('left-icon')).not.toBeInTheDocument()
    expect(screen.queryByTestId('right-icon')).not.toBeInTheDocument()
  })
})

describe('Button - 全宽支持', () => {
  it('应用全宽样式', () => {
    render(<Button fullWidth>全宽按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-full')
  })

  it('默认不应用全宽', () => {
    render(<Button>普通按钮</Button>)
    expect(screen.getByRole('button')).toHaveClass('w-auto')
  })
})

describe('Button - 可访问性', () => {
  it('触摸目标最小44px', () => {
    render(<Button>按钮</Button>)
    const button = screen.getByRole('button')
    // 检查是否有 min-h-[44px] 类
    expect(button).toHaveClass('min-h-[44px]')
  })

  it('支持键盘导航', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>键盘测试</Button>)

    const button = screen.getByRole('button')
    await user.tab()
    expect(button).toHaveFocus()

    await user.keyboard('{Enter}')
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('设置正确的ARIA属性', () => {
    render(<Button loading aria-label="加载中">提交</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('aria-label', '加载中')
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('Button - 事件处理', () => {
  it('触发onClick事件', async () => {
    const user = userEvent.setup()
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>点击我</Button>)

    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('传递其他button属性', () => {
    render(<Button form="my-form" type="submit">提交</Button>)
    const button = screen.getByRole('button')

    expect(button).toHaveAttribute('form', 'my-form')
    expect(button).toHaveAttribute('type', 'submit')
  })
})
