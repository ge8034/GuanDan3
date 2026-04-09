import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Tag } from './Tag'

const meta: Meta<typeof Tag> = {
  title: 'Design System/Molecules/Tag',
  component: Tag,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: ['neutral', 'primary', 'success', 'warning', 'error'],
      description: '标签颜色',
    },
    size: {
      control: 'select',
      options: ['small', 'medium', 'large'],
      description: '标签大小',
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined', 'soft'],
      description: '标签变体',
    },
    closable: {
      control: 'boolean',
      description: '是否可关闭',
    },
    clickable: {
      control: 'boolean',
      description: '是否可点击',
    },
    selected: {
      control: 'boolean',
      description: '是否选中',
    },
  },
}

export default meta
type Story = StoryObj<typeof Tag>

export const Default: Story = {
  render: () => <Tag>默认标签</Tag>,
}

export const Colors: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-3">
      <Tag color="neutral">Neutral</Tag>
      <Tag color="primary">Primary</Tag>
      <Tag color="success">Success</Tag>
      <Tag color="warning">Warning</Tag>
      <Tag color="error">Error</Tag>
    </div>
  ),
}

export const Variants: Story = {
  render: () => (
    <div className="p-8 space-y-4">
      <div className="flex flex-wrap gap-3">
        <Tag variant="filled">Filled</Tag>
        <Tag variant="filled" color="primary">
          Primary
        </Tag>
        <Tag variant="filled" color="success">
          Success
        </Tag>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tag variant="outlined">Outlined</Tag>
        <Tag variant="outlined" color="primary">
          Primary
        </Tag>
        <Tag variant="outlined" color="success">
          Success
        </Tag>
      </div>

      <div className="flex flex-wrap gap-3">
        <Tag variant="soft">Soft</Tag>
        <Tag variant="soft" color="primary">
          Primary
        </Tag>
        <Tag variant="soft" color="success">
          Success
        </Tag>
      </div>
    </div>
  ),
}

export const Sizes: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Small:</span>
        <Tag size="small">小标签</Tag>
        <Tag size="small" color="primary">
          Primary
        </Tag>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Medium:</span>
        <Tag size="medium">中标签</Tag>
        <Tag size="medium" color="primary">
          Primary
        </Tag>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-sm text-neutral-600">Large:</span>
        <Tag size="large">大标签</Tag>
        <Tag size="large" color="primary">
          Primary
        </Tag>
      </div>
    </div>
  ),
}

export const Closable: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-3">
      <Tag closable>可关闭</Tag>
      <Tag closable color="primary">
        Primary
      </Tag>
      <Tag closable color="success">
        Success
      </Tag>
      <Tag closable color="warning">
        Warning
      </Tag>
      <Tag closable color="error">
        Error
      </Tag>
    </div>
  ),
}

export const WithIcon: Story = {
  render: () => {
    return (
      <div className="p-8 flex flex-wrap gap-3">
        <Tag
          icon={
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          新增
        </Tag>

        <Tag
          color="success"
          icon={
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          完成
        </Tag>

        <Tag
          color="warning"
          icon={
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          警告
        </Tag>

        <Tag
          color="error"
          icon={
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          }
        >
          错误
        </Tag>
      </div>
    )
  },
}

export const Clickable: Story = {
  render: () => {
    const [selected, setSelected] = useState('')

    return (
      <div className="p-8 flex flex-wrap gap-3">
        <Tag
          clickable
          selected={selected === 'apple'}
          onClick={() => setSelected('apple')}
        >
          Apple
        </Tag>
        <Tag
          clickable
          color="primary"
          selected={selected === 'banana'}
          onClick={() => setSelected('banana')}
        >
          Banana
        </Tag>
        <Tag
          clickable
          color="success"
          selected={selected === 'orange'}
          onClick={() => setSelected('orange')}
        >
          Orange
        </Tag>
      </div>
    )
  },
}

export const TagCloud: Story = {
  render: () => {
    const tags = [
      { name: 'React', color: 'primary' as const },
      { name: 'Vue', color: 'success' as const },
      { name: 'Angular', color: 'error' as const },
      { name: 'Svelte', color: 'warning' as const },
      { name: 'Next.js', color: 'neutral' as const },
      { name: 'TypeScript', color: 'primary' as const },
      { name: 'JavaScript', color: 'warning' as const },
      { name: 'CSS', color: 'error' as const },
      { name: 'HTML', color: 'success' as const },
      { name: 'Node.js', color: 'neutral' as const },
    ]

    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">技术标签</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Tag key={tag.name} color={tag.color} variant="soft">
              {tag.name}
            </Tag>
          ))}
        </div>
      </div>
    )
  },
}

export const StatusTags: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">任务状态</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>设计系统搭建</span>
            <Tag color="success" variant="soft">
              已完成
            </Tag>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>组件开发</span>
            <Tag color="primary" variant="soft">
              进行中
            </Tag>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>测试覆盖</span>
            <Tag color="warning" variant="soft">
              待审核
            </Tag>
          </div>

          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded">
            <span>文档编写</span>
            <Tag color="neutral" variant="soft">
              未开始
            </Tag>
          </div>
        </div>
      </div>
    )
  },
}

export const FilterTags: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">筛选标签</h2>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-neutral-600 mb-2">价格范围</div>
            <div className="flex flex-wrap gap-2">
              <Tag variant="outlined">全部</Tag>
              <Tag variant="outlined">免费</Tag>
              <Tag variant="outlined">付费</Tag>
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-600 mb-2">难度等级</div>
            <div className="flex flex-wrap gap-2">
              <Tag variant="outlined">入门</Tag>
              <Tag variant="outlined">初级</Tag>
              <Tag variant="outlined">中级</Tag>
              <Tag variant="outlined">高级</Tag>
            </div>
          </div>

          <div>
            <div className="text-sm text-neutral-600 mb-2">语言</div>
            <div className="flex flex-wrap gap-2">
              <Tag variant="outlined">JavaScript</Tag>
              <Tag variant="outlined">TypeScript</Tag>
              <Tag variant="outlined">Python</Tag>
              <Tag variant="outlined">Go</Tag>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const DynamicTags: Story = {
  render: () => {
    const [tags, setTags] = useState(['React', 'TypeScript'])

    const handleClose = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove))
    }

    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-4">动态标签</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map(tag => (
            <Tag key={tag} color="primary" closable onClose={() => handleClose(tag)}>
              {tag}
            </Tag>
          ))}
        </div>
        <div className="mt-4 text-sm text-neutral-500">
          点击 × 可移除标签
        </div>
      </div>
    )
  },
}

export const MixedSizes: Story = {
  render: () => {
    return (
      <div className="p-8 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Small:</span>
          <Tag size="small" color="primary">
            React
          </Tag>
          <Tag size="small" color="success">
            Vue
          </Tag>
          <Tag size="small" closable>
            可关闭
          </Tag>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Medium:</span>
          <Tag size="medium" color="primary">
            React
          </Tag>
          <Tag size="medium" color="success">
            Vue
          </Tag>
          <Tag size="medium" closable>
            可关闭
          </Tag>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-neutral-600">Large:</span>
          <Tag size="large" color="primary">
            React
          </Tag>
          <Tag size="large" color="success">
            Vue
          </Tag>
          <Tag size="large" closable>
            可关闭
          </Tag>
        </div>
      </div>
    )
  },
}

export const AllCombinations: Story = {
  render: () => {
    const colors: Array<'neutral' | 'primary' | 'success' | 'warning' | 'error'> = [
      'neutral',
      'primary',
      'success',
      'warning',
      'error',
    ]
    const variants: Array<'filled' | 'outlined' | 'soft'> = ['filled', 'outlined', 'soft']

    return (
      <div className="p-8">
        <h2 className="text-xl font-semibold mb-6">所有组合</h2>
        <div className="space-y-6">
          {variants.map(variant => (
            <div key={variant}>
              <h3 className="text-sm font-medium text-neutral-600 mb-2 capitalize">
                {variant}
              </h3>
              <div className="flex flex-wrap gap-2">
                {colors.map(color => (
                  <Tag key={color} color={color} variant={variant}>
                    {color}
                  </Tag>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
