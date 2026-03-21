import type { Meta, StoryObj } from '@storybook/react'
import { fn } from '@storybook/test'
import { Button } from './Button'
import { SearchIcon, CheckIcon, XIcon, Loader2 } from 'lucide-react'

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: '遵循设计系统的标准按钮组件，支持多种变体、尺寸和状态。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link'],
      description: '按钮变体样式',
      table: {
        type: { summary: 'ButtonVariant' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'icon'],
      description: '按钮尺寸',
      table: {
        type: { summary: 'ButtonSize' },
        defaultValue: { summary: 'md' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description: '是否全宽',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: '加载状态',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: '禁用状态',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    ripple: {
      control: 'boolean',
      description: '是否启用水波纹效果',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'true' },
      },
    },
    onClick: {
      action: 'clicked',
      description: '点击事件处理函数',
    },
  },
  args: {
    onClick: fn(),
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof Button>

// 基础按钮故事
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: '主要按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '主要按钮，用于最重要的操作。',
      },
    },
  },
}

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: '次要按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '次要按钮，用于次要操作。',
      },
    },
  },
}

export const Outline: Story = {
  args: {
    variant: 'outline',
    children: '轮廓按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '轮廓按钮，用于需要强调边框的操作。',
      },
    },
  },
}

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: '幽灵按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '幽灵按钮，用于需要最小视觉干扰的操作。',
      },
    },
  },
}

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: '危险操作',
  },
  parameters: {
    docs: {
      description: {
        story: '危险按钮，用于删除、取消等危险操作。',
      },
    },
  },
}

export const Link: Story = {
  args: {
    variant: 'link',
    children: '链接按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '链接样式按钮，用于导航操作。',
      },
    },
  },
}

// 尺寸故事
export const Small: Story = {
  args: {
    size: 'sm',
    children: '小按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '小尺寸按钮，用于紧凑空间。',
      },
    },
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
    children: '大按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '大尺寸按钮，用于重要操作。',
      },
    },
  },
}

export const IconButton: Story = {
  args: {
    size: 'icon',
    children: <SearchIcon className="h-4 w-4" />,
    'aria-label': '搜索',
  },
  parameters: {
    docs: {
      description: {
        story: '图标按钮，用于工具操作。',
      },
    },
  },
}

// 状态故事
export const Loading: Story = {
  args: {
    isLoading: true,
    children: '加载中',
  },
  parameters: {
    docs: {
      description: {
        story: '加载状态按钮，用于异步操作。',
      },
    },
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
    children: '禁用按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '禁用状态按钮，用于不可用操作。',
      },
    },
  },
}

// 图标按钮故事
export const WithLeftIcon: Story = {
  args: {
    leftIcon: <SearchIcon className="h-4 w-4" />,
    children: '搜索',
  },
  parameters: {
    docs: {
      description: {
        story: '带左侧图标的按钮。',
      },
    },
  },
}

export const WithRightIcon: Story = {
  args: {
    rightIcon: <CheckIcon className="h-4 w-4" />,
    children: '确认',
  },
  parameters: {
    docs: {
      description: {
        story: '带右侧图标的按钮。',
      },
    },
  },
}

export const WithBothIcons: Story = {
  args: {
    leftIcon: <Loader2 className="h-4 w-4" />,
    rightIcon: <XIcon className="h-4 w-4" />,
    children: '操作',
  },
  parameters: {
    docs: {
      description: {
        story: '带左右两侧图标的按钮。',
      },
    },
  },
}

// 全宽按钮故事
export const FullWidth: Story = {
  args: {
    fullWidth: true,
    children: '全宽按钮',
  },
  parameters: {
    docs: {
      description: {
        story: '全宽按钮，用于需要占满容器的操作。',
      },
    },
  },
  decorators: [
    (Story: React.FC) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
}

// 组合示例
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button variant="primary">主要</Button>
        <Button variant="secondary">次要</Button>
        <Button variant="outline">轮廓</Button>
        <Button variant="ghost">幽灵</Button>
        <Button variant="danger">危险</Button>
        <Button variant="link">链接</Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm">小按钮</Button>
        <Button size="md">中按钮</Button>
        <Button size="lg">大按钮</Button>
        <Button size="icon" aria-label="搜索">
          <SearchIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button isLoading>加载中</Button>
        <Button disabled>已禁用</Button>
        <Button leftIcon={<SearchIcon className="h-4 w-4" />}>带图标</Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '所有按钮变体和状态的组合展示。',
      },
    },
  },
}

// 可访问性示例
export const AccessibilityExample: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-gray-600 mb-2">
        以下示例展示按钮的可访问性特性：
      </div>
      <Button aria-label="关闭对话框">关闭</Button>
      <Button aria-describedby="button-description">带描述的按钮</Button>
      <div id="button-description" className="text-sm text-gray-600 mt-1">
        此按钮用于提交表单数据
      </div>
      <Button aria-pressed="true">已按下</Button>
      <Button aria-expanded="true">已展开</Button>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示按钮的可访问性特性，包括ARIA属性和屏幕阅读器支持。',
      },
    },
  },
}

// 响应式示例
export const ResponsiveExample: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        在不同屏幕尺寸下的按钮表现：
      </div>
      <div className="flex flex-col md:flex-row gap-2">
        <Button className="w-full md:w-auto">响应式按钮</Button>
        <Button className="w-full md:w-auto" variant="secondary">
          响应式按钮
        </Button>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: '展示按钮在不同屏幕尺寸下的响应式表现。',
      },
    },
  },
}