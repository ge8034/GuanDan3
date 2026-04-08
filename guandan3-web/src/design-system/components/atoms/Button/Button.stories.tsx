/**
 * Button 组件 Storybook 示例
 *
 * 展示所有变体、尺寸和状态
 */

import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './Button'
import { CheckCircle2, XCircle, Plus, Trash2, Send } from 'lucide-react'

// ============================================
// Meta 配置
// ============================================
const meta: Meta<typeof Button> = {
  title: 'Design System/Atoms/Button',
  component: Button,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'gold'],
      description: '按钮视觉变体',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl'],
      description: '按钮尺寸',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    loading: {
      control: 'boolean',
      description: '是否加载中',
    },
    error: {
      control: 'boolean',
      description: '是否错误状态',
    },
    success: {
      control: 'boolean',
      description: '是否成功状态',
    },
    fullWidth: {
      control: 'boolean',
      description: '是否全宽',
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
# Button 组件

完整的8种交互状态实现：
1. **Default** - 默认状态
2. **Hover** - 悬停状态
3. **Focus** - 焦点状态（键盘）
4. **Active** - 激活状态（按下）
5. **Disabled** - 禁用状态
6. **Loading** - 加载状态
7. **Error** - 错误状态
8. **Success** - 成功状态

## 设计规范

- **100/300/500 动效规则**: 200ms状态变化过渡
- **ease-out 缓动**: cubic-bezier(0.16, 1, 0.3, 1)
- **触摸目标**: 最小44px高度（可访问性）
- **焦点环**: 2px outline，2px offset（WCAG标准）
        `,
      },
    },
  },
}

export default meta
type Story = StoryObj<typeof Button>

// ============================================
// 基础示例
// ============================================
export const Default: Story = {
  args: {
    variant: 'primary',
    size: 'md',
    children: '默认按钮',
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '轮廓按钮',
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '幽灵按钮',
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '删除',
  },
}

export const Success: Story = {
  args: {
    variant: 'success',
    children: '成功',
  },
}

export const Gold: Story = {
  args: {
    variant: 'gold',
    children: '金色按钮',
  },
  parameters: {
    backgrounds: { default: 'poker table' },
  },
}

// ============================================
// 尺寸示例
// ============================================
export const Sizes: Story = {
  render: () => (
    <div className="flex items-end gap-4 flex-wrap">
      <Button size="xs">超小</Button>
      <Button size="sm">小</Button>
      <Button size="md">中</Button>
      <Button size="lg">大</Button>
      <Button size="xl">超大</Button>
    </div>
  ),
}

// ============================================
// 8种交互状态示例
// ============================================
export const EightStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="space-y-2">
        <p className="text-sm font-semibold">1. Default</p>
        <Button>默认状态</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">2. Hover</p>
        <Button className="hover:bg-poker-table-400">悬停查看</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">3. Focus</p>
        <Button>Tab聚焦</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">4. Active</p>
        <Button>按住激活</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">5. Disabled</p>
        <Button disabled>禁用状态</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">6. Loading</p>
        <Button loading>加载中...</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">7. Error</p>
        <Button error>错误状态</Button>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-semibold">8. Success</p>
        <Button success>成功状态</Button>
      </div>
    </div>
  ),
}

// ============================================
// 加载状态示例
// ============================================
export const LoadingStates: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button loading>加载中</Button>
      <Button variant="secondary" loading>
        处理中...
      </Button>
      <Button variant="outline" loading loadingText="请稍候...">
        提交
      </Button>
    </div>
  ),
}

// ============================================
// 带图标示例
// ============================================
export const WithIcons: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button leftIcon={<Plus className="h-5 w-5" />}>
        新建
      </Button>
      <Button rightIcon={<Send className="h-5 w-5" />} variant="secondary">
        发送
      </Button>
      <Button
        leftIcon={<CheckCircle2 className="h-5 w-5" />}
        rightIcon={<XCircle className="h-5 w-5" />}
        variant="outline"
      >
        确认操作
      </Button>
      <Button leftIcon={<Trash2 className="h-5 w-5" />} variant="danger">
        删除
      </Button>
    </div>
  ),
}

// ============================================
// 全宽示例
// ============================================
export const FullWidth: Story = {
  render: () => (
    <div className="w-full space-y-4">
      <Button fullWidth>全宽主要按钮</Button>
      <Button variant="secondary" fullWidth>
        全宽次要按钮
      </Button>
    </div>
  ),
}

// ============================================
// Poker主题示例
// ============================================
export const PokerTheme: Story = {
  render: () => (
    <div className="flex gap-4 flex-wrap">
      <Button variant="primary">开始游戏</Button>
      <Button variant="gold" leftIcon={<CheckCircle2 className="h-5 w-5" />}>
        确认出牌
      </Button>
      <Button variant="outline">取消</Button>
      <Button variant="danger" leftIcon={<Trash2 className="h-5 w-5" />}>
        离开房间
      </Button>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'poker table' },
    docs: {
      description: {
        story: 'Poker游戏主题的按钮组合，适配深绿牌桌背景。',
      },
    },
  },
}

// ============================================
// 交互测试示例
// ============================================
export const Interactive: Story = {
  render: () => {
    const [count, setCount] = React.useState(0)
    const [isLoading, setIsLoading] = React.useState(false)

    const handleClick = () => {
      setCount((c) => c + 1)
    }

    const handleLoading = async () => {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setIsLoading(false)
    }

    return (
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">点击次数: {count}</p>
          <Button onClick={handleClick}>点击计数</Button>
        </div>

        <div className="space-y-4">
          <Button loading={isLoading} onClick={handleLoading}>
            {isLoading ? '加载中...' : '模拟加载'}
          </Button>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '交互式示例，测试按钮的事件处理和状态变化。',
      },
    },
  },
}

// 需要导入React
import React from 'react'

// ============================================
// 可访问性示例
// ============================================
export const Accessibility: Story = {
  render: () => (
    <div className="space-y-4">
      <Button aria-label="关闭对话框" variant="ghost">
        ✕
      </Button>
      <Button aria-describedby="submit-desc">
        提交表单
      </Button>
      <p id="submit-desc" className="text-sm text-neutral-600">
        点击后将提交所有表单数据
      </p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示可访问性属性的使用，包括 aria-label 和 aria-describedby。',
      },
    },
  },
}
