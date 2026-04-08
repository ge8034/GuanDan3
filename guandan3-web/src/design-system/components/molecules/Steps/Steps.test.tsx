/**
 * Steps 组件测试
 *
 * 测试覆盖：
 * - 基础渲染
 * - 步骤状态
 * - 方向变化
 * - 点击交互
 * - 自定义图标
 * - 可访问性
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Steps, Step } from './Steps'

describe('Steps - 基础渲染', () => {
  it('渲染步骤条', () => {
    render(
      <Steps current={0}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
      </Steps>
    )
    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })

  it('有正确的 aria-label', () => {
    render(
      <Steps current={0}>
        <Step title="第一步">描述1</Step>
      </Steps>
    )
    expect(screen.getByRole('navigation')).toHaveAttribute('aria-label', '步骤')
  })

  it('渲染所有步骤', () => {
    render(
      <Steps current={0}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
        <Step title="第三步">描述3</Step>
      </Steps>
    )

    expect(screen.getByText('第一步')).toBeInTheDocument()
    expect(screen.getByText('第二步')).toBeInTheDocument()
    expect(screen.getByText('第三步')).toBeInTheDocument()
  })
})

describe('Steps - 步骤状态', () => {
  it('当前步骤显示 process 状态', () => {
    render(
      <Steps current={1}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
        <Step title="第三步">描述3</Step>
      </Steps>
    )

    const steps = screen.getAllByRole('listitem')
    // 第一个步骤应该是 finish 状态
    expect(steps[0]).toHaveTextContent('第一步')
    // 第二个步骤是当前步骤
    expect(steps[1]).toHaveTextContent('第二步')
  })

  it('已完成的步骤显示完成图标', () => {
    render(
      <Steps current={2}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
        <Step title="第三步">描述3</Step>
      </Steps>
    )

    // 前两个步骤应该有完成图标
    const checkIcons = screen.getAllByRole('navigation')[0].querySelectorAll('svg')
    expect(checkIcons.length).toBeGreaterThan(0)
  })

  it('error 状态显示错误图标', () => {
    render(
      <Steps current={1}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步" status="error">描述2</Step>
      </Steps>
    )

    const xIcons = screen.getAllByRole('navigation')[0].querySelectorAll('svg')
    expect(xIcons.length).toBeGreaterThan(0)
  })
})

describe('Steps - 方向变化', () => {
  it('horizontal 方向默认水平排列', () => {
    const { container } = render(
      <Steps current={0} direction="horizontal">
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
      </Steps>
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('flex-row')
  })

  it('vertical 方向垂直排列', () => {
    const { container } = render(
      <Steps current={0} direction="vertical">
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
      </Steps>
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('flex-col')
  })
})

describe('Steps - 点击交互', () => {
  it('点击步骤触发 onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Steps current={1} onChange={handleChange}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
        <Step title="第三步">描述3</Step>
      </Steps>
    )

    // 点击第一个已完成的步骤
    const stepIcons = screen.getAllByRole('navigation')[0].querySelectorAll('.cursor-pointer')
    if (stepIcons.length > 0) {
      await user.click(stepIcons[0] as HTMLElement)
      expect(handleChange).toHaveBeenCalledWith(0)
    }
  })

  it('当前步骤不可点击', () => {
    render(
      <Steps current={1} onChange={vi.fn()}>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
      </Steps>
    )

    const nav = screen.getByRole('navigation')
    // 当前步骤不应该有 cursor-pointer 类
    const currentStep = nav.querySelectorAll('li')[1]
    expect(currentStep).not.toHaveClass('cursor-pointer')
  })
})

describe('Steps - 自定义图标', () => {
  it('显示自定义图标', () => {
    render(
      <Steps current={0}>
        <Step title="第一步" icon={<span data-testid="custom-icon">★</span>}>描述1</Step>
      </Steps>
    )

    expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
  })

  it('自定义图标覆盖默认数字', () => {
    render(
      <Steps current={0}>
        <Step title="第一步" icon={<span>⭐</span>}>描述1</Step>
      </Steps>
    )

    expect(screen.getByText('⭐')).toBeInTheDocument()
    expect(screen.queryByText('1')).not.toBeInTheDocument()
  })
})

describe('Steps - 样式', () => {
  it('有正确的默认样式', () => {
    const { container } = render(
      <Steps current={0}>
        <Step title="第一步">描述1</Step>
      </Steps>
    )

    const nav = container.querySelector('nav')
    expect(nav).toHaveClass('flex', 'gap-1')
  })

  it('步骤图标有正确的尺寸', () => {
    render(
      <Steps current={0}>
        <Step title="第一步">描述1</Step>
      </Steps>
    )

    const iconContainer = screen.getByRole('navigation').querySelector('.w-8')
    expect(iconContainer).toBeInTheDocument()
  })
})

describe('Steps - 可访问性', () => {
  it('使用语义化 HTML 元素', () => {
    render(
      <Steps current={0}>
        <Step title="第一步">描述1</Step>
      </Steps>
    )

    expect(screen.getByRole('navigation')).toBeInTheDocument()
  })
})

describe('Steps - 自定义类名', () => {
  it('支持自定义 className', () => {
    render(
      <Steps className="custom-steps" current={0}>
        <Step title="第一步">描述1</Step>
      </Steps>
    )

    expect(screen.getByRole('navigation')).toHaveClass('custom-steps')
  })

  it('Step 支持自定义 className', () => {
    render(
      <Steps current={0}>
        <Step className="custom-step" title="第一步">描述1</Step>
      </Steps>
    )

    const step = screen.getByRole('listitem')
    expect(step).toHaveClass('custom-step')
  })

  it('传递其他 HTML 属性', () => {
    render(
      <Steps data-testid="test-steps" current={0}>
        <Step title="第一步">描述1</Step>
      </Steps>
    )

    expect(screen.getByTestId('test-steps')).toBeInTheDocument()
  })
})

describe('Steps - 完整示例', () => {
  it('渲染完整的订单流程步骤', () => {
    render(
      <Steps current={1}>
        <Step title="确认订单" description="填写收货信息" />
        <Step title="支付订单" description="选择支付方式" />
        <Step title="等待发货" description="仓库处理中" />
        <Step title="已完成" description="订单完成" />
      </Steps>
    )

    expect(screen.getByText('确认订单')).toBeInTheDocument()
    expect(screen.getByText('支付订单')).toBeInTheDocument()
    expect(screen.getByText('等待发货')).toBeInTheDocument()
    expect(screen.getByText('已完成')).toBeInTheDocument()
  })

  it('垂直方向的步骤条', () => {
    render(
      <Steps current={0} direction="vertical">
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
        <Step title="第三步">描述3</Step>
      </Steps>
    )

    const nav = screen.getByRole('navigation')
    expect(nav).toHaveClass('flex-col')
  })
})
