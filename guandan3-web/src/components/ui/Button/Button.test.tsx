import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { axe } from 'jest-axe'
import { vi } from 'vitest'
import { Button } from './Button'
import userEvent from '@testing-library/user-event'

describe('Button组件', () => {
  // 基础渲染测试
  describe('渲染测试', () => {
    test('渲染正确文本', () => {
      render(<Button>点击我</Button>)
      expect(screen.getByText('点击我')).toBeInTheDocument()
    })

    test('渲染主要变体', () => {
      const { container } = render(<Button variant="primary">主要按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-primary-500')
    })

    test('渲染次要变体', () => {
      const { container } = render(<Button variant="secondary">次要按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('bg-secondary-500')
    })

    test('渲染轮廓变体', () => {
      const { container } = render(<Button variant="outline">轮廓按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('border-2', 'border-primary-500')
    })

    test('渲染小尺寸', () => {
      const { container } = render(<Button size="sm">小按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('h-9', 'px-3', 'py-2')
    })

    test('渲染大尺寸', () => {
      const { container } = render(<Button size="lg">大按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('h-11', 'px-6', 'py-3')
    })

    test('渲染全宽按钮', () => {
      const { container } = render(<Button fullWidth>全宽按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('w-full')
    })

    test('渲染加载状态', () => {
      render(<Button isLoading>加载中</Button>)
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
      expect(screen.getAllByText('加载中')).toHaveLength(2)
    })

    test('渲染左侧图标', () => {
      const LeftIcon = () => <span data-testid="left-icon">🔍</span>
      render(<Button leftIcon={<LeftIcon />}>搜索</Button>)
      expect(screen.getByTestId('left-icon')).toBeInTheDocument()
    })

    test('渲染右侧图标', () => {
      const RightIcon = () => <span data-testid="right-icon">→</span>
      render(<Button rightIcon={<RightIcon />}>下一步</Button>)
      expect(screen.getByTestId('right-icon')).toBeInTheDocument()
    })
  })

  // 交互测试
  describe('交互测试', () => {
    test('点击触发回调', () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>点击我</Button>)

      fireEvent.click(screen.getByText('点击我'))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    test('禁用状态不触发回调', () => {
      const handleClick = vi.fn()
      render(
        <Button disabled onClick={handleClick}>
          禁用按钮
        </Button>
      )

      fireEvent.click(screen.getByText('禁用按钮'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    test('加载状态不触发回调', () => {
      const handleClick = vi.fn()
      render(
        <Button isLoading onClick={handleClick}>
          加载中
        </Button>
      )

      fireEvent.click(screen.getByRole('button'))
      expect(handleClick).not.toHaveBeenCalled()
    })

    test('键盘导航支持', async () => {
      const handleClick = vi.fn()
      render(<Button onClick={handleClick}>键盘按钮</Button>)

      const button = screen.getByRole('button')
      const user = userEvent.setup()

      // 先让按钮获得焦点
      button.focus()

      // Enter键触发
      await user.keyboard('[Enter]')
      expect(handleClick).toHaveBeenCalledTimes(1)

      // Space键触发
      await user.keyboard('[Space]')
      expect(handleClick).toHaveBeenCalledTimes(2)
    })
  })

  // 可访问性测试
  describe('可访问性测试', () => {
    test('符合可访问性标准', async () => {
      const { container } = render(<Button>可访问按钮</Button>)
      const results = await axe(container)
      ;(expect(results) as any).toHaveNoViolations()
    })

    test('禁用状态有正确的ARIA属性', () => {
      render(<Button disabled>禁用按钮</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-disabled', 'true')
      expect(button).toBeDisabled()
    })

    test('加载状态有正确的ARIA属性', () => {
      render(<Button isLoading>加载按钮</Button>)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-busy', 'true')
    })

    test('有屏幕阅读器友好的加载状态文本', () => {
      render(<Button isLoading>提交</Button>)
      expect(screen.getByText('加载中')).toBeInTheDocument()
    })

    test('按钮类型正确', () => {
      const { container } = render(<Button type="submit">提交</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveAttribute('type', 'submit')
    })
  })

  // 样式测试
  describe('样式测试', () => {
    test('默认样式正确', () => {
      const { container } = render(<Button>默认按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass(
        'inline-flex',
        'items-center',
        'justify-center',
        'whitespace-nowrap',
        'rounded-lg',
        'text-sm',
        'font-medium',
        'transition-all',
        'duration-300'
      )
    })

    test('焦点样式正确', () => {
      const { container } = render(<Button>焦点按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass(
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-ring',
        'focus-visible:ring-offset-2'
      )
    })

    test('触控目标尺寸符合标准', () => {
      const { container } = render(<Button size="sm">小按钮</Button>)
      const button = container.querySelector('button')
      expect(button).toHaveClass('min-w-[44px]')
    })
  })

  // 边界情况测试
  describe('边界情况测试', () => {
    test('空子元素', () => {
      render(<Button></Button>)
      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
    })

    test('长文本', () => {
      const longText = '这是一个非常长的按钮文本，用于测试按钮的文本溢出处理'
      render(<Button>{longText}</Button>)
      expect(screen.getByText(longText)).toBeInTheDocument()
    })

    test('特殊字符', () => {
      const specialText = '按钮 & 测试 < > " \''
      render(<Button>{specialText}</Button>)
      expect(screen.getByText(specialText)).toBeInTheDocument()
    })

    test('同时有左右图标', () => {
      const LeftIcon = () => <span data-testid="left">←</span>
      const RightIcon = () => <span data-testid="right">→</span>
      render(
        <Button leftIcon={<LeftIcon />} rightIcon={<RightIcon />}>
          图标按钮
        </Button>
      )
      expect(screen.getByTestId('left')).toBeInTheDocument()
      expect(screen.getByTestId('right')).toBeInTheDocument()
    })
  })
})