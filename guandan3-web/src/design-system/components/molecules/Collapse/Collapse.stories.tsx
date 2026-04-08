import type { Meta, StoryObj } from '@storybook/react'
import { Collapse, CollapseItem } from './Collapse'

const meta: Meta<typeof Collapse> = {
  title: 'Design System/Molecules/Collapse',
  component: Collapse,
  tags: ['autodocs'],
  argTypes: {
    accordion: {
      control: 'boolean',
      description: '手风琴模式（每次只展开一项）',
    },
    defaultActiveKey: {
      control: 'object',
      description: '默认展开的项',
    },
  },
}

export default meta
type Story = StoryObj<typeof Collapse>

export const Default: Story = {
  render: () => (
    <Collapse>
      <CollapseItem itemKey="1" title="面板 1">
        <p>这是面板 1 的内容。</p>
        <p>可以包含任意内容。</p>
      </CollapseItem>
      <CollapseItem itemKey="2" title="面板 2">
        <p>这是面板 2 的内容。</p>
      </CollapseItem>
      <CollapseItem itemKey="3" title="面板 3">
        <p>这是面板 3 的内容。</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const WithDefaultActive: Story = {
  render: () => (
    <Collapse defaultActiveKey="1">
      <CollapseItem itemKey="1" title="默认展开的面板">
        <p>这个面板默认是展开的。</p>
      </CollapseItem>
      <CollapseItem itemKey="2" title="收起的面板">
        <p>点击标题可以展开此面板。</p>
      </CollapseItem>
      <CollapseItem itemKey="3" title="另一个收起的面板">
        <p>点击标题可以展开此面板。</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const MultipleDefaultActive: Story = {
  render: () => (
    <Collapse defaultActiveKey={['1', '2']}>
      <CollapseItem itemKey="1" title="面板 1">
        <p>面板 1 的内容</p>
      </CollapseItem>
      <CollapseItem itemKey="2" title="面板 2">
        <p>面板 2 的内容</p>
      </CollapseItem>
      <CollapseItem itemKey="3" title="面板 3">
        <p>面板 3 的内容</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const Accordion: Story = {
  render: () => (
    <Collapse accordion>
      <CollapseItem itemKey="1" title="什么是手风琴模式？">
        <p>手风琴模式下，同时只能展开一个面板。</p>
        <p>点击另一个面板时，当前展开的面板会自动收起。</p>
      </CollapseItem>
      <CollapseItem itemKey="2" title="如何使用？">
        <p>只需要将 accordion 属性设置为 true 即可。</p>
      </CollapseItem>
      <CollapseItem itemKey="3" title="适用场景">
        <p>适用于需要用户专注于单一内容的场景。</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const WithExtra: Story = {
  render: () => (
    <Collapse>
      <CollapseItem
        itemKey="1"
        title="系统通知"
        extra={<span className="text-sm text-neutral-500">3条</span>}
      >
        <p>您有3条未读系统通知</p>
      </CollapseItem>
      <CollapseItem
        itemKey="2"
        title="新消息"
        extra={<span className="text-sm text-neutral-500">5条</span>}
      >
        <p>您有5条未读消息</p>
      </CollapseItem>
      <CollapseItem
        itemKey="3"
        title="任务提醒"
        extra={<span className="text-sm text-neutral-500">2条</span>}
      >
        <p>您有2个待办任务即将到期</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const WithDisabled: Story = {
  render: () => (
    <Collapse defaultActiveKey="1">
      <CollapseItem itemKey="1" title="可点击的面板">
        <p>这个面板可以点击展开/收起</p>
      </CollapseItem>
      <CollapseItem itemKey="2" title="禁用的面板" disabled>
        <p>这个面板被禁用了，无法点击</p>
      </CollapseItem>
      <CollapseItem itemKey="3" title="另一个可点击的面板">
        <p>这个面板也可以点击展开/收起</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const WithCustomIcon: Story = {
  render: () => (
    <Collapse>
      <CollapseItem
        itemKey="1"
        title="使用自定义图标"
        expandIcon={<span className="text-lg">📂</span>}
      >
        <p>这个面板使用了文件夹图标</p>
      </CollapseItem>
      <CollapseItem
        itemKey="2"
        title="使用另一个自定义图标"
        expandIcon={<span className="text-lg">📋</span>}
      >
        <p>这个面板使用了剪贴板图标</p>
      </CollapseItem>
      <CollapseItem
        itemKey="3"
        title="使用箭头图标"
        expandIcon={<span className="text-lg">→</span>}
      >
        <p>这个面板使用了箭头图标</p>
      </CollapseItem>
    </Collapse>
  ),
}

export const FAQ: Story = {
  render: () => {
    return (
      <div className="p-8">
        <h2 className="text-2xl font-semibold mb-6">常见问题</h2>
        <Collapse accordion>
          <CollapseItem itemKey="1" title="如何创建账户？">
            <p className="mb-2">创建账户非常简单：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>点击右上角的注册按钮</li>
              <li>填写您的邮箱和密码</li>
              <li>验证邮箱后即可完成注册</li>
            </ol>
          </CollapseItem>
          <CollapseItem itemKey="2" title="如何重置密码？">
            <p className="mb-2">重置密码步骤：</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>前往登录页面</li>
              <li>点击忘记密码链接</li>
              <li>输入您的注册邮箱</li>
              <li>按照邮件中的指示操作</li>
            </ol>
          </CollapseItem>
          <CollapseItem itemKey="3" title="支持哪些支付方式？">
            <p>我们支持以下支付方式：</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>信用卡/借记卡</li>
              <li>支付宝</li>
              <li>微信支付</li>
              <li>PayPal</li>
            </ul>
          </CollapseItem>
          <CollapseItem itemKey="4" title="如何联系客服？">
            <p>您可以通过以下方式联系我们：</p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>发送邮件至 support@example.com</li>
              <li>拨打客服热线 400-123-4567</li>
              <li>使用在线聊天功能</li>
            </ul>
          </CollapseItem>
        </Collapse>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：常见问题解答',
      },
    },
  },
}

export const DocumentSections: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">使用文档</h1>
        <Collapse defaultActiveKey={['1']}>
          <CollapseItem itemKey="1" title="简介">
            <p className="mb-3">欢迎使用我们的产品！本文档将帮助您快速了解各项功能。</p>
            <p>您可以通过点击各个章节来展开详细内容。</p>
          </CollapseItem>
          <CollapseItem itemKey="2" title="快速开始">
            <h4 className="font-semibold mb-2">第一步：安装</h4>
            <p className="mb-3">运行安装命令：npm install</p>
            <h4 className="font-semibold mb-2">第二步：配置</h4>
            <p className="mb-3">创建配置文件并设置必要的参数</p>
            <h4 className="font-semibold mb-2">第三步：运行</h4>
            <p>执行启动命令：npm run dev</p>
          </CollapseItem>
          <CollapseItem itemKey="3" title="高级配置">
            <h4 className="font-semibold mb-2">环境变量</h4>
            <p className="mb-3">您可以配置以下环境变量来定制应用行为</p>
            <h4 className="font-semibold mb-2">插件系统</h4>
            <p>支持多种插件扩展功能</p>
          </CollapseItem>
          <CollapseItem itemKey="4" title="API 参考">
            <p>详细的 API 文档请参考开发者中心</p>
          </CollapseItem>
        </Collapse>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：文档章节导航',
      },
    },
  },
}

export const SettingsPanel: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-2xl font-semibold mb-6">设置</h2>
        <Collapse accordion>
          <CollapseItem
            itemKey="1"
            title="账户设置"
            extra={<span className="text-sm text-neutral-500">基本</span>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">用户名</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue="admin"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">邮箱</label>
                <input
                  type="email"
                  className="w-full px-3 py-2 border rounded-md"
                  defaultValue="admin@example.com"
                />
              </div>
            </div>
          </CollapseItem>
          <CollapseItem
            itemKey="2"
            title="通知设置"
            extra={<span className="text-sm text-neutral-500">推荐</span>}
          >
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>邮件通知</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" defaultChecked />
                <span>短信通知</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" />
                <span>推送通知</span>
              </label>
            </div>
          </CollapseItem>
          <CollapseItem
            itemKey="3"
            title="隐私设置"
            extra={<span className="text-sm text-neutral-500">重要</span>}
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">个人资料可见性</label>
                <select className="w-full px-3 py-2 border rounded-md">
                  <option>公开</option>
                  <option>仅好友</option>
                  <option>私密</option>
                </select>
              </div>
            </div>
          </CollapseItem>
        </Collapse>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：设置面板',
      },
    },
  },
}
