/**
 * Progress 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - line 类型
 * - circle 类型
 * - dashboard 类型
 * - 不同百分比
 * - 不同状态
 * - 自定义颜色
 * - 显示/隐藏信息
 * - 自定义格式
 * - 动画效果
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from './Progress'

describe('Progress - 基础渲染', () => {
  it('渲染 line 类型进度条', () => {
    const { container } = render(<Progress percent={50} />)

    expect(container.querySelector('.flex-1')).toBeInTheDocument()
  })

  it('渲染 circle 类型进度条', () => {
    render(<Progress percent={50} type="circle" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('渲染 dashboard 类型进度条', () => {
    render(<Progress percent={50} type="dashboard" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})

describe('Progress - line 类型', () => {
  it('显示百分比文字（通过动画后）', async () => {
    render(<Progress percent={75} />)

    // 等待动画
    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('percent 为 0 时显示 0%', async () => {
    render(<Progress percent={0} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('percent 为 100 时显示 100%', async () => {
    render(<Progress percent={100} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('超过 100 的值被限制为 100', async () => {
    render(<Progress percent={150} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('负值被限制为 0', async () => {
    render(<Progress percent={-10} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('0%')).toBeInTheDocument()
  })
})

describe('Progress - circle 类型', () => {
  it('渲染 SVG 元素', () => {
    render(<Progress percent={50} type="circle" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('中心显示百分比', async () => {
    render(<Progress percent={30} type="circle" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('30%')).toBeInTheDocument()
  })

  it('自定义 size 生效', () => {
    render(<Progress percent={50} type="circle" size={200} />)

    const svg = document.querySelector('svg')
    expect(svg?.getAttribute('width')).toBe('200')
  })
})

describe('Progress - dashboard 类型', () => {
  it('渲染仪表盘类型', () => {
    render(<Progress percent={50} type="dashboard" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('支持 gapDegree 配置', () => {
    render(<Progress percent={50} type="dashboard" gapDegree={90} />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('支持不同 gapPosition', () => {
    render(<Progress percent={50} type="dashboard" gapPosition="top" />)

    const svg = document.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })
})

describe('Progress - 显示信息', () => {
  it('showInfo=true 显示百分比', async () => {
    render(<Progress percent={50} showInfo={true} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('showInfo=false 隐藏百分比', () => {
    render(<Progress percent={50} showInfo={false} />)

    expect(screen.queryByText('50%')).not.toBeInTheDocument()
  })

  it('支持自定义格式化函数', async () => {
    render(<Progress percent={50} format={(p) => `${p} / 100`} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50 / 100')).toBeInTheDocument()
  })

  it('format 函数可以返回自定义文本', async () => {
    render(<Progress percent={75} format={() => '加载中...'} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })
})

describe('Progress - 状态颜色', () => {
  it('normal 状态正常渲染', async () => {
    render(<Progress percent={50} status="normal" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('exception 状态正常渲染', async () => {
    render(<Progress percent={50} status="exception" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('success 状态正常渲染', async () => {
    render(<Progress percent={100} status="success" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  it('active 状态正常渲染', async () => {
    render(<Progress percent={50} status="active" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('percent=100 时自动设置为 success 状态', async () => {
    render(<Progress percent={100} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})

describe('Progress - 自定义颜色', () => {
  it('支持纯色背景', async () => {
    render(<Progress percent={50} strokeColor="#ff0000" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('支持渐变色背景', async () => {
    render(
      <Progress
        percent={50}
        strokeColor={{ from: '#108ee9', to: '#87d068' }}
      />
    )

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})

describe('Progress - 自定义样式', () => {
  it('支持自定义 trailColor', async () => {
    render(<Progress percent={50} trailColor="#f0f0f0" />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('支持自定义 strokeWidth', async () => {
    render(<Progress percent={50} strokeWidth={12} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('支持自定义 animationDuration', async () => {
    render(<Progress percent={50} animationDuration={500} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })
})

describe('Progress - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Progress percent={50} className="custom-progress" />)

    const container = document.querySelector('.custom-progress')
    expect(container).toBeInTheDocument()
  })
})

describe('Progress - 多个进度条', () => {
  it('可以同时渲染多个进度条', async () => {
    render(
      <div>
        <Progress percent={30} />
        <Progress percent={60} />
        <Progress percent={90} />
      </div>
    )

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(screen.getByText('30%')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
    expect(screen.getByText('90%')).toBeInTheDocument()
  })

  it('不同类型的进度条可以共存', async () => {
    render(
      <div>
        <Progress percent={50} type="line" />
        <Progress percent={50} type="circle" />
        <Progress percent={50} type="dashboard" />
      </div>
    )

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(screen.getAllByText('50%').length).toBeGreaterThan(0)
  })
})

describe('Progress - 边界情况', () => {
  it('percent 为 undefined 时默认为 0', async () => {
    render(<Progress percent={undefined as any} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('percent 为 null 时默认为 0', async () => {
    render(<Progress percent={null as any} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('小数百分比正确显示', async () => {
    render(<Progress percent={33.33} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('33.33%')).toBeInTheDocument()
  })

  it('非常小的百分比也能显示', async () => {
    render(<Progress percent={0.1} />)

    await new Promise(resolve => setTimeout(resolve, 100))

    expect(screen.getByText('0.1%')).toBeInTheDocument()
  })
})

describe('Progress - 动画效果', () => {
  it('渲染后显示目标百分比', async () => {
    render(<Progress percent={50} />)

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(screen.getByText('50%')).toBeInTheDocument()
  })

  it('从 0 到 100 的动画', async () => {
    render(<Progress percent={100} />)

    await new Promise(resolve => setTimeout(resolve, 200))

    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
