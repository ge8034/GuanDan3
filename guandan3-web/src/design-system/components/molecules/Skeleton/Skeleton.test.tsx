/**
 * Skeleton 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 不同类型
 * - active 属性
 * - count 属性
 * - 自定义尺寸
 * - 复合组件
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonImage,
} from './Skeleton'

describe('Skeleton - 基础渲染', () => {
  it('渲染 text 类型骨架屏', () => {
    render(<Skeleton />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toBeInTheDocument()
  })

  it('默认应用 animate-pulse 动画', () => {
    render(<Skeleton />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('Skeleton - active 属性', () => {
  it('active=true 时应用动画', () => {
    render(<Skeleton active={true} />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('active=false 时不应用动画', () => {
    render(<Skeleton active={false} />)

    const skeleton = document.querySelector('.animate-pulse')
    expect(skeleton).not.toBeInTheDocument()
  })
})

describe('Skeleton - variant 类型', () => {
  it('text 类型有正确样式', () => {
    render(<Skeleton variant="text" />)

    const skeleton = document.querySelector('.h-4')
    expect(skeleton).toBeInTheDocument()
  })

  it('circle 类型有正确样式', () => {
    render(<Skeleton variant="circle" />)

    const skeleton = document.querySelector('.rounded-full')
    expect(skeleton).toBeInTheDocument()
  })

  it('rect 类型有正确样式', () => {
    render(<Skeleton variant="rect" />)

    const skeleton = document.querySelector('.rounded')
    expect(skeleton).toBeInTheDocument()
  })

  it('button 类型有正确样式', () => {
    render(<Skeleton variant="button" />)

    const skeleton = document.querySelector('.h-10')
    expect(skeleton).toBeInTheDocument()
  })

  it('input 类型有正确样式', () => {
    render(<Skeleton variant="input" />)

    const skeleton = document.querySelector('.h-10')
    expect(skeleton).toBeInTheDocument()
  })

  it('avatar 类型有正确样式', () => {
    render(<Skeleton variant="avatar" />)

    const skeleton = document.querySelector('.rounded-full')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('Skeleton - count 属性', () => {
  it('count=1 时渲染单个元素', () => {
    const { container } = render(<Skeleton count={1} />)

    const skeletons = container.querySelectorAll('.bg-neutral-200')
    expect(skeletons).toHaveLength(1)
  })

  it('count=3 时渲染三个元素', () => {
    const { container } = render(<Skeleton count={3} />)

    const skeletons = container.querySelectorAll('.bg-neutral-200')
    expect(skeletons).toHaveLength(3)
  })

  it('count>1 时有间距', () => {
    const { container } = render(<Skeleton count={2} />)

    const wrapper = container.querySelector('.space-y-2')
    expect(wrapper).toBeInTheDocument()
  })
})

describe('Skeleton - 自定义尺寸', () => {
  it('支持自定义 width（number）', () => {
    render(<Skeleton variant="rect" width={200} />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ width: '200px' })
  })

  it('支持自定义 width（string）', () => {
    render(<Skeleton variant="rect" width="50%" />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ width: '50%' })
  })

  it('支持自定义 height（number）', () => {
    render(<Skeleton variant="rect" height={100} />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ height: '100px' })
  })

  it('支持自定义 height（string）', () => {
    render(<Skeleton variant="rect" height="10rem" />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ height: '10rem' })
  })

  it('支持自定义 radius（number）', () => {
    render(<Skeleton variant="rect" radius={8} />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ borderRadius: '8px' })
  })

  it('支持自定义 radius（string）', () => {
    render(<Skeleton variant="rect" radius="1rem" />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ borderRadius: '1rem' })
  })
})

describe('Skeleton - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Skeleton className="custom-skeleton" />)

    const skeleton = document.querySelector('.custom-skeleton')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('SkeletonAvatar - 头像骨架屏', () => {
  it('渲染头像骨架屏', () => {
    render(<SkeletonAvatar />)

    const skeleton = document.querySelector('.rounded-full')
    expect(skeleton).toBeInTheDocument()
  })

  it('small 尺寸', () => {
    render(<SkeletonAvatar size="small" />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ width: '32px', height: '32px' })
  })

  it('medium 尺寸', () => {
    render(<SkeletonAvatar size="medium" />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ width: '40px', height: '40px' })
  })

  it('large 尺寸', () => {
    render(<SkeletonAvatar size="large" />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ width: '64px', height: '64px' })
  })

  it('circle 形状', () => {
    render(<SkeletonAvatar shape="circle" />)

    const skeleton = document.querySelector('.rounded-full')
    expect(skeleton).toBeInTheDocument()
  })

  it('square 形状', () => {
    render(<SkeletonAvatar shape="square" />)

    const skeleton = document.querySelector('.rounded')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('SkeletonButton - 按钮骨架屏', () => {
  it('渲染按钮骨架屏', () => {
    render(<SkeletonButton />)

    const skeleton = document.querySelector('.h-10')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('SkeletonInput - 输入框骨架屏', () => {
  it('渲染输入框骨架屏', () => {
    render(<SkeletonInput />)

    const skeleton = document.querySelector('.h-10')
    expect(skeleton).toBeInTheDocument()
  })
})

describe('SkeletonImage - 图片骨架屏', () => {
  it('渲染图片骨架屏', () => {
    render(<SkeletonImage />)

    const skeleton = document.querySelector('.rounded')
    expect(skeleton).toBeInTheDocument()
  })

  it('默认高度为 200px', () => {
    render(<SkeletonImage />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ height: '200px' })
  })

  it('支持自定义高度', () => {
    render(<SkeletonImage height={300} />)

    const skeleton = document.querySelector('.bg-neutral-200')
    expect(skeleton).toHaveStyle({ height: '300px' })
  })
})

describe('Skeleton - 多个骨架屏', () => {
  it('可以同时渲染多个骨架屏', () => {
    render(
      <div>
        <Skeleton variant="text" />
        <Skeleton variant="circle" />
        <Skeleton variant="rect" />
      </div>
    )

    expect(document.querySelectorAll('.bg-neutral-200')).toHaveLength(3)
  })
})

describe('Skeleton - 边界情况', () => {
  it('count=0 时不渲染任何元素', () => {
    const { container } = render(<Skeleton count={0} />)

    const skeletons = container.querySelectorAll('.bg-neutral-200')
    expect(skeletons).toHaveLength(0)
  })

  it('负数 count 被视为 0', () => {
    const { container } = render(<Skeleton count={-1} />)

    const skeletons = container.querySelectorAll('.bg-neutral-200')
    expect(skeletons).toHaveLength(0)
  })
})
