import type { Meta, StoryObj } from '@storybook/react'
import {
  Skeleton,
  SkeletonAvatar,
  SkeletonButton,
  SkeletonInput,
  SkeletonImage,
} from './Skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'Design System/Molecules/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  argTypes: {
    active: {
      control: 'boolean',
      description: '是否显示动画',
    },
    count: {
      control: 'number',
      description: '骨架屏元素数量',
    },
    variant: {
      control: 'select',
      options: ['text', 'circle', 'rect', 'button', 'input', 'avatar'],
      description: '骨架屏类型',
    },
  },
}

export default meta
type Story = StoryObj<typeof Skeleton>

export const Default: Story = {
  render: () => <Skeleton />,
}

export const Text: Story = {
  render: () => (
    <div className="p-8 space-y-3">
      <Skeleton count={5} />
    </div>
  ),
}

export const Circle: Story = {
  render: () => (
    <div className="p-8 flex gap-4">
      <Skeleton variant="circle" width={40} height={40} />
      <Skeleton variant="circle" width={60} height={60} />
      <Skeleton variant="circle" width={80} height={80} />
    </div>
  ),
}

export const Rect: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <Skeleton variant="rect" height={100} />
      <Skeleton variant="rect" height={150} />
      <Skeleton variant="rect" height={200} />
    </div>
  ),
}

export const Button: Story = {
  render: () => (
    <div className="p-8 flex gap-4">
      <Skeleton variant="button" />
      <Skeleton variant="button" width={120} />
      <Skeleton variant="button" width={150} />
    </div>
  ),
}

export const Input: Story = {
  render: () => (
    <div className="p-8 space-y-4 w-96">
      <Skeleton variant="input" />
      <Skeleton variant="input" width="50%" />
    </div>
  ),
}

export const Avatar: Story = {
  render: () => (
    <div className="p-8 flex gap-4">
      <Skeleton variant="avatar" />
      <Skeleton variant="avatar" width={50} height={50} />
      <Skeleton variant="avatar" width={60} height={60} />
    </div>
  ),
}

export const Active: Story = {
  render: () => (
    <div className="p-8 space-y-3">
      <Skeleton active={true} count={5} />
    </div>
  ),
}

export const Inactive: Story = {
  render: () => (
    <div className="p-8 space-y-3">
      <Skeleton active={false} count={5} />
    </div>
  ),
}

export const AvatarSizes: Story = {
  render: () => (
    <div className="p-8 flex gap-4 items-end">
      <div className="text-center">
        <SkeletonAvatar size="small" />
        <div className="mt-2 text-sm text-neutral-600">Small</div>
      </div>
      <div className="text-center">
        <SkeletonAvatar size="medium" />
        <div className="mt-2 text-sm text-neutral-600">Medium</div>
      </div>
      <div className="text-center">
        <SkeletonAvatar size="large" />
        <div className="mt-2 text-sm text-neutral-600">Large</div>
      </div>
    </div>
  ),
}

export const AvatarShapes: Story = {
  render: () => (
    <div className="p-8 flex gap-4">
      <div className="text-center">
        <SkeletonAvatar shape="circle" />
        <div className="mt-2 text-sm text-neutral-600">Circle</div>
      </div>
      <div className="text-center">
        <SkeletonAvatar shape="square" />
        <div className="mt-2 text-sm text-neutral-600">Square</div>
      </div>
    </div>
  ),
}

export const CardLoading: Story = {
  render: () => {
    return (
      <div className="p-8 grid grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 border rounded-lg">
            <Skeleton variant="rect" height={150} />
            <div className="mt-4 space-y-2">
              <Skeleton variant="button" />
              <Skeleton count={3} />
            </div>
          </div>
        ))}
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：卡片加载状态',
      },
    },
  },
}

export const ListLoading: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">消息列表</h2>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <SkeletonAvatar />
              <div className="flex-1 space-y-2">
                <Skeleton variant="button" width="60%" />
                <Skeleton count={2} />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：列表加载状态',
      },
    },
  },
}

export const FormLoading: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">表单</h2>
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton variant="button" width={80} />
            <SkeletonInput />
          </div>

          <div className="space-y-2">
            <Skeleton variant="button" width={100} />
            <SkeletonInput />
          </div>

          <div className="space-y-2">
            <Skeleton variant="button" width={60} />
            <Skeleton variant="rect" height={100} />
          </div>

          <div className="flex gap-4">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：表单加载状态',
      },
    },
  },
}

export const ProfileLoading: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <div className="flex items-start gap-6">
          <SkeletonAvatar size="large" />

          <div className="flex-1 space-y-4">
            <div>
              <Skeleton variant="button" width={200} />
              <div className="mt-2">
                <Skeleton count={2} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded">
                <Skeleton variant="button" width={60} />
                <Skeleton variant="text" />
              </div>
              <div className="text-center p-4 border rounded">
                <Skeleton variant="button" width={60} />
                <Skeleton variant="text" />
              </div>
              <div className="text-center p-4 border rounded">
                <Skeleton variant="button" width={60} />
                <Skeleton variant="text" />
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
        story: '实际应用场景：个人资料加载状态',
      },
    },
  },
}

export const ArticleLoading: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <div className="space-y-4">
          <Skeleton variant="rect" height={300} />

          <div className="space-y-2">
            <Skeleton variant="button" width="80%" />
            <Skeleton count={8} />
          </div>

          <div className="space-y-2 pt-4">
            <Skeleton variant="button" width="60%" />
            <Skeleton count={5} />
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：文章加载状态',
      },
    },
  },
}

export const TableLoading: Story = {
  render: () => {
    return (
      <div className="p-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b">
              <th className="p-3 text-left"><Skeleton variant="button" width={100} /></th>
              <th className="p-3 text-left"><Skeleton variant="button" width={120} /></th>
              <th className="p-3 text-left"><Skeleton variant="button" width={80} /></th>
              <th className="p-3 text-left"><Skeleton variant="button" width={100} /></th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b">
                <td className="p-3"><Skeleton variant="text" /></td>
                <td className="p-3"><Skeleton variant="text" /></td>
                <td className="p-3"><Skeleton variant="button" width={60} /></td>
                <td className="p-3"><Skeleton variant="button" width={80} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：表格加载状态',
      },
    },
  },
}

export const MixedLoading: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-4xl">
        <div className="grid grid-cols-3 gap-6">
          {/* 侧边栏 */}
          <div className="space-y-4">
            <Skeleton variant="rect" height={200} />
            <Skeleton count={4} />
          </div>

          {/* 主内容 */}
          <div className="col-span-2 space-y-6">
            <SkeletonImage height={250} />
            <div className="space-y-2">
              <Skeleton variant="button" width="70%" />
              <Skeleton count={6} />
            </div>
          </div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：混合布局加载状态',
      },
    },
  },
}
