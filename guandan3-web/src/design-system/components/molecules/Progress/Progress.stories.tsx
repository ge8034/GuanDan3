import type { Meta, StoryObj } from '@storybook/react'
import { Progress } from './Progress'

const meta: Meta<typeof Progress> = {
  title: 'Design System/Molecules/Progress',
  component: Progress,
  tags: ['autodocs'],
  argTypes: {
    percent: {
      control: 'number',
      description: '进度百分比（0-100）',
    },
    type: {
      control: 'select',
      options: ['line', 'circle', 'dashboard'],
      description: '进度条类型',
    },
    status: {
      control: 'select',
      options: ['normal', 'exception', 'active', 'success'],
      description: '状态',
    },
    size: {
      control: 'number',
      description: '尺寸（圆形/仪表盘类型）',
    },
    strokeWidth: {
      control: 'number',
      description: '进度条粗细',
    },
    showInfo: {
      control: 'boolean',
      description: '是否显示百分比文字',
    },
  },
}

export default meta
type Story = StoryObj<typeof Progress>

export const Default: Story = {
  render: () => (
    <div className="p-8 w-80">
      <Progress percent={30} />
    </div>
  ),
}

export const LineProgress: Story = {
  render: () => (
    <div className="p-8 space-y-6 w-96">
      <div>
        <div className="mb-2 text-sm text-neutral-600">0%</div>
        <Progress percent={0} />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">30%</div>
        <Progress percent={30} />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">50%</div>
        <Progress percent={50} />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">70%</div>
        <Progress percent={70} />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">100%</div>
        <Progress percent={100} />
      </div>
    </div>
  ),
}

export const CircleProgress: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-8">
      <div className="text-center">
        <Progress percent={0} type="circle" />
        <div className="mt-2 text-sm text-neutral-600">0%</div>
      </div>

      <div className="text-center">
        <Progress percent={30} type="circle" />
        <div className="mt-2 text-sm text-neutral-600">30%</div>
      </div>

      <div className="text-center">
        <Progress percent={50} type="circle" />
        <div className="mt-2 text-sm text-neutral-600">50%</div>
      </div>

      <div className="text-center">
        <Progress percent={70} type="circle" />
        <div className="mt-2 text-sm text-neutral-600">70%</div>
      </div>

      <div className="text-center">
        <Progress percent={100} type="circle" />
        <div className="mt-2 text-sm text-neutral-600">100%</div>
      </div>
    </div>
  ),
}

export const DashboardProgress: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-8">
      <div className="text-center">
        <Progress percent={0} type="dashboard" />
        <div className="mt-2 text-sm text-neutral-600">0%</div>
      </div>

      <div className="text-center">
        <Progress percent={30} type="dashboard" />
        <div className="mt-2 text-sm text-neutral-600">30%</div>
      </div>

      <div className="text-center">
        <Progress percent={50} type="dashboard" />
        <div className="mt-2 text-sm text-neutral-600">50%</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="dashboard" />
        <div className="mt-2 text-sm text-neutral-600">75%</div>
      </div>

      <div className="text-center">
        <Progress percent={100} type="dashboard" />
        <div className="mt-2 text-sm text-neutral-600">100%</div>
      </div>
    </div>
  ),
}

export const Status: Story = {
  render: () => (
    <div className="p-8 space-y-6 w-96">
      <div>
        <div className="mb-2 text-sm text-neutral-600">Normal</div>
        <Progress percent={50} status="normal" />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">Exception</div>
        <Progress percent={50} status="exception" />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">Active</div>
        <Progress percent={50} status="active" />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">Success</div>
        <Progress percent={100} status="success" />
      </div>
    </div>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <div className="p-8 space-y-6 w-96">
      <div>
        <div className="mb-2 text-sm text-neutral-600">纯色</div>
        <Progress percent={50} strokeColor="#ff4d4f" />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">渐变色</div>
        <Progress
          percent={75}
          strokeColor={{ from: '#108ee9', to: '#87d068' }}
        />
      </div>

      <div>
        <div className="mb-2 text-sm text-neutral-600">多色渐变</div>
        <Progress
          percent={60}
          strokeColor={{ from: '#ff6b6b', to: '#ffd93d' }}
        />
      </div>
    </div>
  ),
}

export const CustomSize: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-8 items-end">
      <div className="text-center">
        <Progress percent={75} type="circle" size={80} />
        <div className="mt-2 text-sm text-neutral-600">Small (80)</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="circle" size={120} />
        <div className="mt-2 text-sm text-neutral-600">Medium (120)</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="circle" size={160} />
        <div className="mt-2 text-sm text-neutral-600">Large (160)</div>
      </div>
    </div>
  ),
}

export const NoInfo: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="w-96">
        <div className="mb-2 text-sm text-neutral-600">Line - No Info</div>
        <Progress percent={50} showInfo={false} />
      </div>

      <div className="text-center">
        <div className="mb-2 text-sm text-neutral-600">Circle - No Info</div>
        <Progress percent={50} type="circle" showInfo={false} />
      </div>
    </div>
  ),
}

export const CustomFormat: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="w-96">
        <Progress
          percent={50}
          format={(percent) => `${percent} / 100`}
        />
      </div>

      <div className="w-96">
        <Progress
          percent={75}
          format={(percent) => `已上传 ${percent}MB`}
        />
      </div>

      <div className="text-center">
        <Progress
          percent={30}
          type="circle"
          format={() => '加载中'}
        />
      </div>
    </div>
  ),
}

export const DynamicProgress: Story = {
  render: () => {
    return (
      <div className="p-8 space-y-6 w-96">
        <div>
          <div className="mb-2 text-sm text-neutral-600">文件上传</div>
          <Progress percent={30} />
          <div className="mt-1 text-xs text-neutral-500">3MB / 10MB</div>
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-600">视频转码</div>
          <Progress percent={65} status="active" />
          <div className="mt-1 text-xs text-neutral-500">处理中...</div>
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-600">安装完成</div>
          <Progress percent={100} status="success" />
          <div className="mt-1 text-xs text-neutral-500">安装成功！</div>
        </div>

        <div>
          <div className="mb-2 text-sm text-neutral-600">上传失败</div>
          <Progress percent={45} status="exception" />
          <div className="mt-1 text-xs text-neutral-500">网络连接中断</div>
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：不同状态的任务进度',
      },
    },
  },
}

export const DashboardGaps: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-8">
      <div className="text-center">
        <Progress percent={75} type="dashboard" gapDegree={0} />
        <div className="mt-2 text-sm text-neutral-600">无缺口</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="dashboard" gapDegree={90} />
        <div className="mt-2 text-sm text-neutral-600">90° 缺口</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="dashboard" gapDegree={180} />
        <div className="mt-2 text-sm text-neutral-600">180° 缺口</div>
      </div>
    </div>
  ),
}

export const DashboardPositions: Story = {
  render: () => (
    <div className="p-8 flex flex-wrap gap-8">
      <div className="text-center">
        <Progress percent={75} type="dashboard" gapPosition="top" />
        <div className="mt-2 text-sm text-neutral-600">Top</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="dashboard" gapPosition="bottom" />
        <div className="mt-2 text-sm text-neutral-600">Bottom</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="dashboard" gapPosition="left" />
        <div className="mt-2 text-sm text-neutral-600">Left</div>
      </div>

      <div className="text-center">
        <Progress percent={75} type="dashboard" gapPosition="right" />
        <div className="mt-2 text-sm text-neutral-600">Right</div>
      </div>
    </div>
  ),
}

export const UploadScenario: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-lg">
        <h2 className="text-xl font-semibold mb-6">文件上传</h2>

        <div className="space-y-4">
          {/* 上传中 */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">report.pdf</span>
                  <span className="text-xs text-neutral-500">65%</span>
                </div>
                <Progress percent={65} status="active" showInfo={false} strokeWidth={6} />
              </div>
            </div>
          </div>

          {/* 等待中 */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">image.png</span>
                  <span className="text-xs text-neutral-500">等待中</span>
                </div>
                <Progress percent={0} showInfo={false} strokeWidth={6} />
              </div>
            </div>
          </div>

          {/* 完成 */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">data.xlsx</span>
                  <span className="text-xs text-green-500">完成</span>
                </div>
                <Progress percent={100} status="success" showInfo={false} strokeWidth={6} />
              </div>
            </div>
          </div>

          {/* 失败 */}
          <div className="p-4 bg-neutral-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">video.mp4</span>
                  <span className="text-xs text-red-500">失败</span>
                </div>
                <Progress percent={30} status="exception" showInfo={false} strokeWidth={6} />
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
        story: '实际应用场景：文件上传进度展示',
      },
    },
  },
}

export const SkillLevels: Story = {
  render: () => {
    const skills = [
      { name: 'JavaScript', level: 90 },
      { name: 'TypeScript', level: 85 },
      { name: 'React', level: 80 },
      { name: 'Vue', level: 70 },
      { name: 'Node.js', level: 75 },
    ]

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">技能水平</h2>

        <div className="space-y-4">
          {skills.map((skill) => (
            <div key={skill.name}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">{skill.name}</span>
                <span className="text-sm text-neutral-500">{skill.level}%</span>
              </div>
              <Progress
                percent={skill.level}
                strokeColor={{ from: '#667eea', to: '#764ba2' }}
                showInfo={false}
                strokeWidth={8}
              />
            </div>
          ))}
        </div>
      </div>
    )
  },
  parameters: {
    docs: {
      description: {
        story: '实际应用场景：技能水平展示',
      },
    },
  },
}
