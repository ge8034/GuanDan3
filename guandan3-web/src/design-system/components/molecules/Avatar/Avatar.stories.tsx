import type { Meta, StoryObj } from '@storybook/react'
import { Avatar } from './Avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Design System/Molecules/Avatar',
  component: Avatar,
  tags: ['autodocs'],
  argTypes: {
    src: {
      control: 'text',
      description: '头像图片 URL',
    },
    alt: {
      control: 'text',
      description: '替代文本',
    },
    size: {
      control: 'select',
      options: ['xs', 'sm', 'md', 'lg', 'xl', '2xl'],
      description: '头像大小',
    },
    shape: {
      control: 'select',
      options: ['circle', 'square'],
      description: '头像形状',
    },
    status: {
      control: 'select',
      options: ['online', 'offline', 'busy', 'away'],
      description: '状态',
    },
    statusPosition: {
      control: 'select',
      options: ['top-left', 'top-right', 'bottom-left', 'bottom-right'],
      description: '状态位置',
    },
    clickable: {
      control: 'boolean',
      description: '是否可点击',
    },
  },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  render: () => (
    <div className="p-8">
      <Avatar />
    </div>
  ),
}

export const WithImage: Story = {
  render: () => (
    <div className="p-8">
      <Avatar src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="用户头像" />
    </div>
  ),
}

export const FallbackText: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <Avatar fallbackText="John Doe" />
      <Avatar fallbackText="Jane Smith" />
      <Avatar fallbackText="Bob Johnson" />
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="p-8 flex items-end gap-4">
      <div className="text-center">
        <Avatar size="xs" fallbackText="JD" />
        <p className="text-xs mt-2 text-neutral-600">xs</p>
      </div>
      <div className="text-center">
        <Avatar size="sm" fallbackText="JD" />
        <p className="text-xs mt-2 text-neutral-600">sm</p>
      </div>
      <div className="text-center">
        <Avatar size="md" fallbackText="JD" />
        <p className="text-xs mt-2 text-neutral-600">md</p>
      </div>
      <div className="text-center">
        <Avatar size="lg" fallbackText="JD" />
        <p className="text-xs mt-2 text-neutral-600">lg</p>
      </div>
      <div className="text-center">
        <Avatar size="xl" fallbackText="JD" />
        <p className="text-xs mt-2 text-neutral-600">xl</p>
      </div>
      <div className="text-center">
        <Avatar size="2xl" fallbackText="JD" />
        <p className="text-xs mt-2 text-neutral-600">2xl</p>
      </div>
    </div>
  ),
}

export const Shapes: Story = {
  render: () => (
    <div className="p-8 flex gap-4">
      <div className="text-center">
        <Avatar shape="circle" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">圆形</p>
      </div>
      <div className="text-center">
        <Avatar shape="square" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">方形</p>
      </div>
    </div>
  ),
}

export const Statuses: Story = {
  render: () => (
    <div className="p-8 flex gap-6">
      <div className="text-center">
        <Avatar status="online" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">在线</p>
      </div>
      <div className="text-center">
        <Avatar status="offline" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">离线</p>
      </div>
      <div className="text-center">
        <Avatar status="busy" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">忙碌</p>
      </div>
      <div className="text-center">
        <Avatar status="away" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">离开</p>
      </div>
    </div>
  ),
}

export const StatusPositions: Story = {
  render: () => (
    <div className="p-8 grid grid-cols-2 gap-8 max-w-md">
      <div className="text-center">
        <Avatar status="online" statusPosition="top-left" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">左上</p>
      </div>
      <div className="text-center">
        <Avatar status="online" statusPosition="top-right" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">右上</p>
      </div>
      <div className="text-center">
        <Avatar status="online" statusPosition="bottom-left" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">左下</p>
      </div>
      <div className="text-center">
        <Avatar status="online" statusPosition="bottom-right" fallbackText="JD" />
        <p className="text-sm mt-2 text-neutral-600">右下</p>
      </div>
    </div>
  ),
}

export const AvatarGroup: Story = {
  render: () => {
    const users = [
      { name: 'Alice', color: 'bg-red-500' },
      { name: 'Bob', color: 'bg-blue-500' },
      { name: 'Charlie', color: 'bg-green-500' },
      { name: 'Diana', color: 'bg-yellow-500' },
      { name: 'Eve', color: 'bg-purple-500' },
    ]

    return (
      <div className="p-8 space-y-6">
        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">叠加头像组</h3>
          <div className="flex -space-x-3">
            {users.map((user) => (
              <Avatar
                key={user.name}
                fallbackText={user.name}
                className="ring-2 ring-white"
              />
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-neutral-700 mb-3">正常排列</h3>
          <div className="flex gap-3">
            {users.map((user) => (
              <Avatar
                key={user.name}
                fallbackText={user.name}
              />
            ))}
          </div>
        </div>
      </div>
    )
  },
}

export const Interactive: Story = {
  render: () => {
    return (
      <div className="p-8 flex gap-4">
        <div className="text-center">
          <Avatar clickable fallbackText="JD" />
          <p className="text-sm mt-2 text-neutral-600">可点击</p>
        </div>
        <div className="text-center">
          <Avatar clickable={false} fallbackText="JD" />
          <p className="text-sm mt-2 text-neutral-600">不可点击</p>
        </div>
      </div>
    )
  },
}

export const UserCard: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-sm">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-4">
            <Avatar size="xl" src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
            <div className="flex-1">
              <h3 className="font-semibold text-lg">John Doe</h3>
              <p className="text-sm text-neutral-600">软件工程师</p>
              <div className="flex items-center gap-2 mt-1">
                <Avatar size="xs" status="online" />
                <span className="text-xs text-neutral-500">在线</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const ChatList: Story = {
  render: () => {
    const conversations = [
      { name: 'Alice Wang', message: '好的，明天见！', time: '5分钟前', status: 'online' as const },
      { name: 'Bob Chen', message: '项目进展如何？', time: '1小时前', status: 'offline' as const },
      { name: 'Carol Li', message: '谢谢你的帮助', time: '昨天', status: 'away' as const },
      { name: 'David Zhang', message: '会议改到下午3点', time: '2天前', status: 'busy' as const },
    ]

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-4">消息列表</h2>

        <div className="bg-white rounded-lg shadow-sm divide-y">
          {conversations.map((conv) => (
            <div key={conv.name} className="flex items-center gap-3 p-4 hover:bg-neutral-50 cursor-pointer">
              <div className="relative">
                <Avatar fallbackText={conv.name} status={conv.status} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <h4 className="font-medium truncate">{conv.name}</h4>
                  <span className="text-xs text-neutral-500">{conv.time}</span>
                </div>
                <p className="text-sm text-neutral-600 truncate">{conv.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}

export const TeamMembers: Story = {
  render: () => {
    const team = [
      { name: 'Alice', role: '产品经理', status: 'online' as const },
      { name: 'Bob', role: '设计师', status: 'away' as const },
      { name: 'Carol', role: '前端开发', status: 'busy' as const },
      { name: 'David', role: '后端开发', status: 'offline' as const },
    ]

    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">团队成员</h2>

        <div className="bg-white rounded-lg shadow-sm">
          {team.map((member) => (
            <div key={member.name} className="flex items-center gap-3 p-4 border-b last:border-b-0">
              <Avatar fallbackText={member.name} status={member.status} clickable />
              <div className="flex-1">
                <h4 className="font-medium">{member.name}</h4>
                <p className="text-sm text-neutral-600">{member.role}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                member.status === 'online' ? 'bg-success-100 text-success-700' :
                member.status === 'busy' ? 'bg-error-100 text-error-700' :
                member.status === 'away' ? 'bg-warning-100 text-warning-700' :
                'bg-neutral-100 text-neutral-700'
              }`}>
                {member.status === 'online' ? '在线' :
                 member.status === 'busy' ? '忙碌' :
                 member.status === 'away' ? '离开' : '离线'}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
