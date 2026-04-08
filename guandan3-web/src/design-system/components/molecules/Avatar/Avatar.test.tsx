/**
 * Avatar 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 图片显示
 * - 尺寸变化
 * - 形状变化
 * - 状态显示
 * - fallback 文本
 * - 点击交互
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Avatar } from './Avatar'

describe('Avatar - 基础渲染', () => {
  it('渲染头像', () => {
    const { container } = render(<Avatar />)

    const avatar = container.querySelector('.inline-flex')
    expect(avatar).toBeInTheDocument()
  })

  it('默认尺寸为 md', () => {
    const { container } = render(<Avatar />)

    const avatar = container.querySelector('.w-10.h-10')
    expect(avatar).toBeInTheDocument()
  })

  it('默认形状为圆形', () => {
    const { container } = render(<Avatar />)

    const avatar = container.querySelector('.rounded-full')
    expect(avatar).toBeInTheDocument()
  })
})

describe('Avatar - 图片显示', () => {
  it('显示图片', () => {
    const { container } = render(<Avatar src="https://example.com/avatar.jpg" alt="用户头像" />)

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', 'https://example.com/avatar.jpg')
    expect(img).toHaveAttribute('alt', '用户头像')
  })

  it('无图片时显示默认图标', () => {
    const { container } = render(<Avatar />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('图片加载失败调用 onError', () => {
    const handleError = vi.fn()

    const { container } = render(<Avatar src="invalid.jpg" onError={handleError} />)

    const img = container.querySelector('img') as HTMLImageElement
    img.dispatchEvent(new Event('error'))

    expect(handleError).toHaveBeenCalledTimes(1)
  })
})

describe('Avatar - 尺寸变化', () => {
  it('xs 尺寸', () => {
    const { container } = render(<Avatar size="xs" />)

    const avatar = container.querySelector('.w-6.h-6')
    expect(avatar).toBeInTheDocument()
  })

  it('sm 尺寸', () => {
    const { container } = render(<Avatar size="sm" />)

    const avatar = container.querySelector('.w-8.h-8')
    expect(avatar).toBeInTheDocument()
  })

  it('lg 尺寸', () => {
    const { container } = render(<Avatar size="lg" />)

    const avatar = container.querySelector('.w-12.h-12')
    expect(avatar).toBeInTheDocument()
  })

  it('xl 尺寸', () => {
    const { container } = render(<Avatar size="xl" />)

    const avatar = container.querySelector('.w-16.h-16')
    expect(avatar).toBeInTheDocument()
  })

  it('2xl 尺寸', () => {
    const { container } = render(<Avatar size="2xl" />)

    const avatar = container.querySelector('.w-20.h-20')
    expect(avatar).toBeInTheDocument()
  })
})

describe('Avatar - 形状变化', () => {
  it('circle 形状', () => {
    const { container } = render(<Avatar shape="circle" />)

    const avatar = container.querySelector('.rounded-full')
    expect(avatar).toBeInTheDocument()
  })

  it('square 形状', () => {
    const { container } = render(<Avatar shape="square" />)

    const avatar = container.querySelector('.rounded-lg')
    expect(avatar).toBeInTheDocument()
  })
})

describe('Avatar - 状态显示', () => {
  it('online 状态', () => {
    const { container } = render(<Avatar status="online" />)

    const statusDot = container.querySelector('.bg-success-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('offline 状态', () => {
    const { container } = render(<Avatar status="offline" />)

    const statusDot = container.querySelector('.bg-neutral-400')
    expect(statusDot).toBeInTheDocument()
  })

  it('busy 状态', () => {
    const { container } = render(<Avatar status="busy" />)

    const statusDot = container.querySelector('.bg-error-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('busy 状态有动画', () => {
    const { container } = render(<Avatar status="busy" />)

    const statusDot = container.querySelector('.animate-pulse')
    expect(statusDot).toBeInTheDocument()
  })

  it('away 状态', () => {
    const { container } = render(<Avatar status="away" />)

    const statusDot = container.querySelector('.bg-warning-500')
    expect(statusDot).toBeInTheDocument()
  })

  it('无状态时不显示状态点', () => {
    const { container } = render(<Avatar />)

    const statusDots = container.querySelectorAll('[class*="bg-"]')
    // 只有背景色，没有状态点
    const statusDot = Array.from(statusDots).find(el => el.classList.contains('absolute'))
    expect(statusDot).not.toBeDefined()
  })
})

describe('Avatar - 状态位置', () => {
  it('top-right 位置', () => {
    const { container } = render(<Avatar status="online" statusPosition="top-right" />)

    const statusDot = container.querySelector('.top-0.right-0')
    expect(statusDot).toBeInTheDocument()
  })

  it('top-left 位置', () => {
    const { container } = render(<Avatar status="online" statusPosition="top-left" />)

    const statusDot = container.querySelector('.top-0.left-0')
    expect(statusDot).toBeInTheDocument()
  })

  it('bottom-left 位置', () => {
    const { container } = render(<Avatar status="online" statusPosition="bottom-left" />)

    const statusDot = container.querySelector('.bottom-0.left-0')
    expect(statusDot).toBeInTheDocument()
  })

  it('bottom-right 位置（默认）', () => {
    const { container } = render(<Avatar status="online" />)

    const statusDot = container.querySelector('.bottom-0.right-0')
    expect(statusDot).toBeInTheDocument()
  })
})

describe('Avatar - fallback 文本', () => {
  it('显示首字母', () => {
    render(<Avatar fallbackText="John Doe" />)

    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('单个单词显示前两个字母', () => {
    render(<Avatar fallbackText="John" />)

    expect(screen.getByText('JO')).toBeInTheDocument()
  })

  it('大写转换', () => {
    render(<Avatar fallbackText="john doe" />)

    expect(screen.getByText('JD')).toBeInTheDocument()
  })

  it('多个单词取前两个单词首字母', () => {
    render(<Avatar fallbackText="John Middle Doe" />)

    expect(screen.getByText('JM')).toBeInTheDocument()
  })
})

describe('Avatar - 点击交互', () => {
  it('clickable=true 添加光标和 hover 效果', () => {
    const { container } = render(<Avatar clickable />)

    const avatar = container.querySelector('.cursor-pointer')
    expect(avatar).toBeInTheDocument()
  })

  it('clickable=false 无交互样式', () => {
    const { container } = render(<Avatar clickable={false} />)

    const avatar = container.querySelector('.cursor-pointer')
    expect(avatar).not.toBeInTheDocument()
  })
})

describe('Avatar - 自定义类名', () => {
  it('支持自定义 className', () => {
    const { container } = render(<Avatar className="custom-avatar" />)

    const wrapper = container.querySelector('.custom-avatar')
    expect(wrapper).toBeInTheDocument()
  })
})

describe('Avatar - 边界情况', () => {
  it('空 fallbackText 显示默认图标', () => {
    const { container } = render(<Avatar fallbackText="" />)

    // 空字符串是 falsy，显示默认图标
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('只有空格的 fallbackText 显示默认图标', () => {
    const { container } = render(<Avatar fallbackText="   " />)

    // 只有空格时，split 后没有有效单词，显示默认图标
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})
