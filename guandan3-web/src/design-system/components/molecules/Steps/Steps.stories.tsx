import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Steps, Step } from './Steps'

const meta: Meta<typeof Steps> = {
  title: 'Design System/Molecules/Steps',
  component: Steps,
  tags: ['autodocs'],
  argTypes: {
    current: {
      control: 'number',
      description: '当前步骤（从0开始）',
    },
    direction: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: '方向',
    },
  },
}

export default meta
type Story = StoryObj<typeof Steps>

export const Default: Story = {
  args: {
    current: 0,
    children: (
      <>
        <Step title="第一步">描述1</Step>
        <Step title="第二步">描述2</Step>
        <Step title="第三步">描述3</Step>
      </>
    ),
  },
}

export const WithDescriptions: Story = {
  render: () => (
    <Steps current={1}>
      <Step title="注册" description="创建账号">
        这是注册步骤的描述
      </Step>
      <Step title="验证" description="验证邮箱">
        这是验证步骤的描述
      </Step>
      <Step title="完成" description="注册成功">
        这是完成步骤的描述
      </Step>
    </Steps>
  ),
}

export const OrderProcess: Story = {
  render: () => (
    <Steps current={2}>
      <Step title="确认订单" description="填写收货信息" />
      <Step title="支付订单" description="选择支付方式" />
      <Step title="等待发货" description="仓库处理中" />
      <Step title="已完成" description="订单完成" />
    </Steps>
  ),
}

export const Vertical: Story = {
  render: () => (
    <div className="p-8">
      <Steps current={1} direction="vertical">
        <Step title="账号设置" description="填写基本信息" />
        <Step title="偏好设置" description="选择感兴趣的内容" />
        <Step title="完成设置" description="开始使用" />
      </Steps>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '垂直方向的步骤条',
      },
    },
  },
}

export const WithCustomIcons: Story = {
  render: () => (
    <Steps current={1}>
      <Step title="购物车" icon={<span>🛒</span>}>查看商品</Step>
      <Step title="结算" icon={<span>💳</span>}>支付订单</Step>
      <Step title="完成" icon={<span>✅</span>}>订单完成</Step>
    </Steps>
  ),
  parameters: {
    docs: {
      description: {
        story: '使用自定义图标',
      },
    },
  },
}

export const ErrorStep: Story = {
  render: () => (
    <Steps current={2}>
      <Step title="上传文件" description="选择文件上传" />
      <Step title="处理中" description="正在处理文件" />
      <Step title="失败" description="上传失败，请重试" status="error" />
    </Steps>
  ),
}

export const Interactive: Story = {
  render: () => {
    const [current, setCurrent] = useState(0)
    const steps = [
      { title: '填写信息', description: '填写基本信息' },
      { title: '上传文件', description: '上传相关文件' },
      { title: '验证审核', description: '等待审核' },
      { title: '完成', description: '流程结束' },
    ]

    return (
      <div className="p-8">
        <div className="mb-6">
          <button
            onClick={() => setCurrent(Math.max(0, current - 1))}
            disabled={current === 0}
            className="px-4 py-2 bg-poker-table-500 text-white rounded disabled:opacity-50 mr-2"
          >
            上一步
          </button>
          <button
            onClick={() => setCurrent(Math.min(steps.length - 1, current + 1))}
            disabled={current === steps.length - 1}
            className="px-4 py-2 bg-poker-table-500 text-white rounded disabled:opacity-50"
          >
            下一步
          </button>
        </div>
        <Steps current={current} onChange={setCurrent}>
          {steps.map((step) => (
            <Step key={step.title} title={step.title} description={step.description} />
          ))}
        </Steps>
        <div className="mt-6 p-4 bg-neutral-50 rounded">
          <p className="text-sm text-neutral-600">
            当前步骤: <strong>{steps[current].title}</strong>
          </p>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '交互示例：可点击切换步骤',
      },
    },
  },
}

export const CheckoutFlow: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <h1 className="text-2xl font-bold mb-6">结算流程</h1>

        <div className="mb-8">
          <Steps current={1}>
            <Step title="查看购物车" description="确认商品信息" />
            <Step title="填写地址" description="填写收货地址" />
            <Step title="确认订单" description="核对订单信息" />
            <Step title="支付" description="选择支付方式" />
            <Step title="完成" description="订单提交成功" />
          </Steps>
        </div>

        <div className="bg-white p-6 rounded-lg border border-neutral-200">
          <h2 className="text-lg font-medium mb-4">填写收货地址</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">收货人</label>
              <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded" placeholder="请输入收货人姓名" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">联系电话</label>
              <input type="tel" className="w-full px-3 py-2 border border-neutral-300 rounded" placeholder="请输入手机号" />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">详细地址</label>
              <textarea className="w-full px-3 py-2 border border-neutral-300 rounded" placeholder="请输入详细地址" rows={3} />
            </div>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：电商结算流程',
      },
    },
  },
}

export const Wizard: Story = {
  render: () => {
    return (
      <div className="p-8 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">向导式流程</h1>

          <Steps current={0} className="mb-8">
            <Step title="基本信息" description="填写个人资料" />
            <Step title="账号设置" description="设置登录信息" />
            <Step title="偏好选择" description="选择内容偏好" />
            <Step title="完成设置" description="完成向导" />
          </Steps>

          <div className="bg-white p-8 rounded-lg border border-neutral-200">
            <h2 className="text-xl font-semibold mb-4">基本信息</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">姓名</label>
                <input type="text" className="w-full px-3 py-2 border border-neutral-300 rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">邮箱</label>
                <input type="email" className="w-full px-3 py-2 border border-neutral-300 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：注册向导',
      },
    },
  },
}
