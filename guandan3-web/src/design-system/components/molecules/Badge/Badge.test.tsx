/**
 * Badge 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - count 显示
 * - dot 模式
 * - 不同颜色
 * - 不同尺寸
 * - 不同位置
 * - showZero 属性
 * - 自定义内容
 * - 状态徽章
 * - 最大值限制
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'

describe('Badge - 基础渲染', () => {
  it('渲染独立徽章', () => {
    render(<Badge count={5} />)

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('渲染附加徽章到子元素', () => {
    render(
      <Badge count={5}>
        <button>消息</button>
      </Badge>
    )

    expect(screen.getByText('消息')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('count 为 0 时默认隐藏', () => {
    render(<Badge count={0} />)

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

describe('Badge - count 显示', () => {
  it('显示正数', () => {
    render(<Badge count={10} />)

    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('超过 max 时显示 max+', () => {
    render(<Badge count={150} max={99} />)

    expect(screen.getByText('99+')).toBeInTheDocument()
  })

  it('自定义 max 值', () => {
    render(<Badge count={500} max={999} />)

    expect(screen.getByText('500')).toBeInTheDocument()
  })
})

describe('Badge - showZero 属性', () => {
  it('showZero=true 时显示零', () => {
    render(<Badge count={0} showZero={true} />)

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('showZero=false 时不显示零（默认）', () => {
    render(<Badge count={0} showZero={false} />)

    expect(screen.queryByText('0')).not.toBeInTheDocument()
  })
})

describe('Badge - dot 模式', () => {
  it('dot=true 时显示圆点', () => {
    render(<Badge dot count={1} />)

    // 检查是否渲染了徽章元素
    const badge = document.querySelector('.bg-error-500')
    expect(badge).toBeInTheDocument()
  })

  it('dot 模式下不显示数字', () => {
    render(
      <Badge dot count={5}>
        <button>消息</button>
      </Badge>
    )

    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('dot 模式下 count 为 0 时不显示圆点', () => {
    render(
      <Badge dot count={0}>
        <button>消息</button>
      </Badge>
    )

    // count 为 0 时不显示徽章
    const badge = document.querySelector('.bg-error-500')
    expect(badge).not.toBeInTheDocument()
  })
})

describe('Badge - 颜色变体', () => {
  it('neutral 颜色', () => {
    render(<Badge count={5} color="neutral" />)

    const badge = document.querySelector('.bg-neutral-500')
    expect(badge).toBeInTheDocument()
  })

  it('primary 颜色', () => {
    render(<Badge count={5} color="primary" />)

    const badge = document.querySelector('.bg-primary-500')
    expect(badge).toBeInTheDocument()
  })

  it('success 颜色', () => {
    render(<Badge count={5} color="success" />)

    const badge = document.querySelector('.bg-success-500')
    expect(badge).toBeInTheDocument()
  })

  it('warning 颜色', () => {
    render(<Badge count={5} color="warning" />)

    const badge = document.querySelector('.bg-warning-500')
    expect(badge).toBeInTheDocument()
  })

  it('error 颜色', () => {
    render(<Badge count={5} color="error" />)

    const badge = document.querySelector('.bg-error-500')
    expect(badge).toBeInTheDocument()
  })
})

describe('Badge - 尺寸变体', () => {
  it('small 尺寸', () => {
    render(<Badge count={5} size="small" />)

    const badge = document.querySelector('.min-w-\\[14px\\]')
    expect(badge).toBeInTheDocument()
  })

  it('medium 尺寸（默认）', () => {
    render(<Badge count={5} size="medium" />)

    const badge = document.querySelector('.min-w-\\[18px\\]')
    expect(badge).toBeInTheDocument()
  })

  it('large 尺寸', () => {
    render(<Badge count={5} size="large" />)

    const badge = document.querySelector('.min-w-\\[22px\\]')
    expect(badge).toBeInTheDocument()
  })
})

describe('Badge - 位置', () => {
  it('top-right 位置（默认）', () => {
    render(
      <Badge count={5} position="top-right">
        <button>消息</button>
      </Badge>
    )

    const badge = document.querySelector('.-top-1.-right-1')
    expect(badge).toBeInTheDocument()
  })

  it('top-left 位置', () => {
    render(
      <Badge count={5} position="top-left">
        <button>消息</button>
      </Badge>
    )

    const badge = document.querySelector('.-top-1.-left-1')
    expect(badge).toBeInTheDocument()
  })

  it('bottom-right 位置', () => {
    render(
      <Badge count={5} position="bottom-right">
        <button>消息</button>
      </Badge>
    )

    const badge = document.querySelector('.-bottom-1.-right-1')
    expect(badge).toBeInTheDocument()
  })

  it('bottom-left 位置', () => {
    render(
      <Badge count={5} position="bottom-left">
        <button>消息</button>
      </Badge>
    )

    const badge = document.querySelector('.-bottom-1.-left-1')
    expect(badge).toBeInTheDocument()
  })
})

describe('Badge - 自定义内容', () => {
  it('使用 content 覆盖 count', () => {
    render(<Badge count={5} content="NEW" />)

    expect(screen.getByText('NEW')).toBeInTheDocument()
    expect(screen.queryByText('5')).not.toBeInTheDocument()
  })

  it('content 支持复杂内容', () => {
    render(
      <Badge
        count={5}
        content={
          <span>
            <strong>Hot</strong>
          </span>
        }
      />
    )

    expect(screen.getByText('Hot')).toBeInTheDocument()
  })
})

describe('Badge - 状态徽章', () => {
  it('default 状态徽章', () => {
    render(<Badge status="default" content="默认" />)

    expect(screen.getByText('默认')).toBeInTheDocument()
    const dot = document.querySelector('.bg-neutral-400')
    expect(dot).toBeInTheDocument()
  })

  it('success 状态徽章', () => {
    render(<Badge status="success" content="成功" />)

    expect(screen.getByText('成功')).toBeInTheDocument()
    const dot = document.querySelector('.bg-success-500')
    expect(dot).toBeInTheDocument()
  })

  it('processing 状态徽章', () => {
    render(<Badge status="processing" content="处理中" />)

    expect(screen.getByText('处理中')).toBeInTheDocument()
    const dot = document.querySelector('.bg-primary-500')
    expect(dot).toBeInTheDocument()
  })

  it('error 状态徽章', () => {
    render(<Badge status="error" content="错误" />)

    expect(screen.getByText('错误')).toBeInTheDocument()
    const dot = document.querySelector('.bg-error-500')
    expect(dot).toBeInTheDocument()
  })

  it('warning 状态徽章', () => {
    render(<Badge status="warning" content="警告" />)

    expect(screen.getByText('警告')).toBeInTheDocument()
    const dot = document.querySelector('.bg-warning-500')
    expect(dot).toBeInTheDocument()
  })

  it('processing 状态徽章', () => {
    render(<Badge status="processing" content="处理中" />)

    expect(screen.getByText('处理中')).toBeInTheDocument()
    const dot = document.querySelector('.bg-primary-500')
    expect(dot).toBeInTheDocument()
  })
})

describe('Badge - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(<Badge count={5} className="custom-badge" />)

    const badge = document.querySelector('.custom-badge')
    expect(badge).toBeInTheDocument()
  })
})

describe('Badge - 不同子元素', () => {
  it('支持按钮作为子元素', () => {
    render(
      <Badge count={5}>
        <button>消息</button>
      </Badge>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('支持图标作为子元素', () => {
    render(
      <Badge count={99}>
        <svg data-testid="icon" />
      </Badge>
    )

    expect(document.querySelector('[data-testid="icon"]')).toBeInTheDocument()
  })

  it('支持文本作为子元素', () => {
    render(
      <Badge count={3}>
        <span>通知</span>
      </Badge>
    )

    expect(screen.getByText('通知')).toBeInTheDocument()
  })
})

describe('Badge - 边界情况', () => {
  it('负数 count 视为 0', () => {
    render(<Badge count={-5} />)

    expect(screen.queryByText('-5')).not.toBeInTheDocument()
  })

  it('count 为 undefined 且无 content 时不显示', () => {
    render(<Badge />)

    expect(document.querySelector('.bg-error-500')).not.toBeInTheDocument()
  })

  it('空字符串 content 也渲染徽章元素', () => {
    render(<Badge content="" />)

    // 空字符串 content 仍然会渲染徽章元素
    const badge = document.querySelector('.min-w-\\[18px\\]')
    expect(badge).toBeInTheDocument()
  })
})
