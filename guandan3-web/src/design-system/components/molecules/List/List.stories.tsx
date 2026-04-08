import type { Meta, StoryObj } from '@storybook/react'
import { List, ListItem } from './List'

const meta: Meta<typeof List> = {
  title: 'Design System/Molecules/List',
  component: List,
  tags: ['autodocs'],
  argTypes: {
    bordered: {
      control: 'boolean',
      description: '是否显示边框',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '尺寸',
    },
  },
}

export default meta
type Story = StoryObj<typeof List>

export const Default: Story = {
  render: () => (
    <List>
      <ListItem title="列表项1">描述1</ListItem>
      <ListItem title="列表项2">描述2</ListItem>
      <ListItem title="列表项3">描述3</ListItem>
    </List>
  ),
}

export const WithDescriptions: Story = {
  render: () => (
    <List>
      <ListItem title="系统通知" description="系统将于今晚进行维护" />
      <ListItem title="产品更新" description="新版本已发布，请及时更新" />
      <ListItem title="安全提醒" description="您的密码即将过期，请及时修改" />
    </List>
  ),
}

export const Bordered: Story = {
  render: () => (
    <List bordered>
      <ListItem title="列表项1">描述1</ListItem>
      <ListItem title="列表项2">描述2</ListItem>
      <ListItem title="列表项3">描述3</ListItem>
    </List>
  ),
}

export const WithAvatars: Story = {
  render: () => (
    <List>
      <ListItem
        title="张三"
        description="前端开发工程师"
        avatar={<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white">张</div>}
      />
      <ListItem
        title="李四"
        description="后端开发工程师"
        avatar={<div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white">李</div>}
      />
      <ListItem
        title="王五"
        description="产品经理"
        avatar={<div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white">王</div>}
      />
    </List>
  ),
}

export const WithExtra: Story = {
  render: () => (
    <List>
      <ListItem
        title="文档1"
        description="2024-01-15 更新"
        extra={<button type="button" className="text-blue-500 hover:underline">下载</button>}
      />
      <ListItem
        title="文档2"
        description="2024-01-10 更新"
        extra={<button type="button" className="text-blue-500 hover:underline">下载</button>}
      />
    </List>
  ),
}

export const Small: Story = {
  render: () => (
    <List size="small">
      <ListItem title="小列表项1" />
      <ListItem title="小列表项2" />
    </List>
  ),
}

export const Large: Story = {
  render: () => (
    <List size="large">
      <ListItem title="大列表项1" description="详细描述1" />
      <ListItem title="大列表项2" description="详细描述2" />
    </List>
  ),
}

export const Clickable: Story = {
  render: () => {
    const handleClick = (title: string) => {
      console.log('点击了:', title)
    }

    return (
      <List>
        <ListItem title="可点击项1" clickable onClick={() => handleClick('项1')} />
        <ListItem title="可点击项2" clickable onClick={() => handleClick('项2')} />
        <ListItem title="可点击项3" clickable onClick={() => handleClick('项3')} />
      </List>
    )
  },
}

export const ContactList: Story = {
  render: () => {
    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">联系人列表</h2>
        <List bordered>
          <ListItem
            title="张三"
            description="zhang@example.com"
            avatar={<div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">张</div>}
            extra={<button type="button" className="text-sm text-blue-500 hover:underline">发送消息</button>}
          />
          <ListItem
            title="李四"
            description="lisi@example.com"
            avatar={<div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-medium">李</div>}
            extra={<button type="button" className="text-sm text-blue-500 hover:underline">发送消息</button>}
          />
          <ListItem
            title="王五"
            description="wangwu@example.com"
            avatar={<div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-medium">王</div>}
            extra={<button type="button" className="text-sm text-blue-500 hover:underline">发送消息</button>}
          />
        </List>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：联系人列表',
      },
    },
  },
}

export const NotificationList: Story = {
  render: () => {
    const notifications = [
      { title: '系统更新', description: '系统将在今晚进行维护，预计持续2小时', time: '1小时前' },
      { title: '新消息', description: '您有3条未读消息', time: '2小时前' },
      { title: '任务提醒', description: '代码审查任务即将到期', time: '昨天' },
    ]

    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">通知中心</h2>
        <List>
          {notifications.map((item) => (
            <ListItem
              key={item.title}
              title={item.title}
              description={item.description}
              extra={<span className="text-sm text-neutral-500">{item.time}</span>}
            />
          ))}
        </List>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：通知列表',
      },
    },
  },
}

export const MusicList: Story = {
  render: () => {
    const songs = [
      { title: '歌曲1', artist: '歌手A', duration: '3:45' },
      { title: '歌曲2', artist: '歌手B', duration: '4:20' },
      { title: '歌曲3', artist: '歌手C', duration: '3:15' },
    ]

    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-4">播放列表</h2>
        <List size="small" bordered>
          {songs.map((song, index) => (
            <ListItem
              key={song.title}
              title={`${index + 1}. ${song.title}`}
              description={song.artist}
              extra={<span className="text-xs text-neutral-500 tabular-nums">{song.duration}</span>}
            />
          ))}
        </List>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：音乐播放列表',
      },
    },
  },
}
