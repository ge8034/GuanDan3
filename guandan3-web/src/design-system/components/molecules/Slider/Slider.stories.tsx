import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'
import { Slider } from './Slider'

const meta: Meta<typeof Slider> = {
  title: 'Design System/Molecules/Slider',
  component: Slider,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'number',
      description: '当前值',
    },
    defaultValue: {
      control: 'number',
      description: '默认值',
    },
    min: {
      control: 'number',
      description: '最小值',
    },
    max: {
      control: 'number',
      description: '最大值',
    },
    step: {
      control: 'number',
      description: '步长',
    },
    disabled: {
      control: 'boolean',
      description: '是否禁用',
    },
    showValue: {
      control: 'boolean',
      description: '是否显示数值',
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'warning', 'error'],
      description: '滑块颜色',
    },
  },
}

export default meta
type Story = StoryObj<typeof Slider>

export const Default: Story = {
  render: () => {
    const [value, setValue] = useState(50)

    return (
      <div className="p-8 max-w-md">
        <Slider value={value} onChange={setValue} showValue />
      </div>
    )
  },
}

export const WithoutValue: Story = {
  render: () => {
    return (
      <div className="p-8 max-w-md">
        <Slider defaultValue={50} />
      </div>
    )
  },
}

export const Colors: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-md">
      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Primary</label>
        <Slider defaultValue={50} color="primary" showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Success</label>
        <Slider defaultValue={70} color="success" showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Warning</label>
        <Slider defaultValue={30} color="warning" showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Error</label>
        <Slider defaultValue={20} color="error" showValue />
      </div>
    </div>
  ),
}

export const Ranges: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-md">
      <div>
        <label className="text-sm text-neutral-600 mb-2 block">0 - 100（默认）</label>
        <Slider defaultValue={50} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">0 - 10</label>
        <Slider min={0} max={10} defaultValue={5} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">0 - 1000</label>
        <Slider min={0} max={1000} defaultValue={500} step={50} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">-50 - 50</label>
        <Slider min={-50} max={50} defaultValue={0} showValue />
      </div>
    </div>
  ),
}

export const Steps: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-md">
      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Step = 1（默认）</label>
        <Slider defaultValue={50} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Step = 5</label>
        <Slider defaultValue={50} step={5} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Step = 10</label>
        <Slider defaultValue={50} step={10} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Step = 0.1</label>
        <Slider defaultValue={0.5} max={1} step={0.1} showValue formatValue={(v) => v.toFixed(1)} />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">Step = 0.01</label>
        <Slider defaultValue={0.5} max={1} step={0.01} showValue formatValue={(v) => v.toFixed(2)} />
      </div>
    </div>
  ),
}

export const Disabled: Story = {
  render: () => (
    <div className="p-8 space-y-6 max-w-md">
      <div>
        <label className="text-sm text-neutral-600 mb-2 block">禁用（值为 50）</label>
        <Slider disabled value={50} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">禁用（值为 0）</label>
        <Slider disabled value={0} showValue />
      </div>

      <div>
        <label className="text-sm text-neutral-600 mb-2 block">禁用（值为 100）</label>
        <Slider disabled value={100} showValue />
      </div>
    </div>
  ),
}

export const CustomFormat: Story = {
  render: () => {
    const [celsius, setCelsius] = useState(25)

    return (
      <div className="p-8 space-y-6 max-w-md">
        <div>
          <label className="text-sm text-neutral-600 mb-2 block">温度（°C）</label>
          <Slider
            value={celsius}
            onChange={setCelsius}
            min={-20}
            max={50}
            showValue
            formatValue={(v) => `${v}°C`}
          />
          <div className="text-xs text-neutral-500 mt-1">
            华氏度: {Math.round((celsius * 9) / 5 + 32)}°F
          </div>
        </div>

        <div>
          <label className="text-sm text-neutral-600 mb-2 block">百分比</label>
          <Slider
            defaultValue={75}
            max={100}
            showValue
            formatValue={(v) => `${v}%`}
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600 mb-2 block">价格（¥）</label>
          <Slider
            defaultValue={500}
            min={0}
            max={1000}
            step={10}
            showValue
            formatValue={(v) => `¥${v}`}
          />
        </div>

        <div>
          <label className="text-sm text-neutral-600 mb-2 block">文件大小</label>
          <Slider
            defaultValue={50}
            max={100}
            showValue
            formatValue={(v) => `${v} MB`}
          />
        </div>
      </div>
    )
  },
}

export const VolumeControl: Story = {
  render: () => {
    const [volume, setVolume] = useState(75)

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">音量控制</h2>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>

            <div className="flex-1">
              <Slider
                value={volume}
                onChange={setVolume}
                showValue
                formatValue={(v) => `${v}%`}
              />
            </div>

            <div className="w-8 text-center">
              {volume === 0 ? (
                <svg className="w-5 h-5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : volume < 50 ? (
                <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                </svg>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const BrightnessControl: Story = {
  render: () => {
    const [brightness, setBrightness] = useState(80)

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">亮度调节</h2>

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <svg className="w-5 h-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>

            <div className="flex-1">
              <Slider
                value={brightness}
                onChange={setBrightness}
                showValue
                formatValue={(v) => `${v}%`}
                color="warning"
              />
            </div>
          </div>

          {/* 预览 */}
          <div
            className="mt-4 h-20 rounded transition-all"
            style={{
              backgroundColor: `rgba(255, 255, 255, ${brightness / 100})`,
              boxShadow: `0 4px 12px rgba(0, 0, 0, ${brightness / 200})`,
            }}
          />
        </div>
      </div>
    )
  },
}

export const PriceRange: Story = {
  render: () => {
    const [minPrice, setMinPrice] = useState(100)
    const [maxPrice, setMaxPrice] = useState(800)

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">价格范围</h2>

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <label className="text-sm text-neutral-600 mb-2 block">最低价格</label>
            <Slider
              value={minPrice}
              onChange={setMinPrice}
              min={0}
              max={1000}
              step={50}
              showValue
              formatValue={(v) => `¥${v}`}
            />
          </div>

          <div>
            <label className="text-sm text-neutral-600 mb-2 block">最高价格</label>
            <Slider
              value={maxPrice}
              onChange={setMaxPrice}
              min={0}
              max={1000}
              step={50}
              showValue
              formatValue={(v) => `¥${v}`}
            />
          </div>

          <div className="pt-4 border-t text-center">
            <span className="text-sm text-neutral-600">价格范围: </span>
            <span className="font-medium">{`¥${minPrice} - ¥${maxPrice}`}</span>
          </div>
        </div>
      </div>
    )
  },
}

export const MultipleSliders: Story = {
  render: () => {
    const [values, setValues] = useState({
      bass: 50,
      mid: 60,
      treble: 70,
    })

    return (
      <div className="p-8 max-w-md">
        <h2 className="text-xl font-semibold mb-6">均衡器</h2>

        <div className="bg-white rounded-lg p-6 shadow-sm space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">低音 (Bass)</span>
              <span className="font-medium">{values.bass}</span>
            </div>
            <Slider
              value={values.bass}
              onChange={(v) => setValues((prev) => ({ ...prev, bass: v }))}
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">中音 (Mid)</span>
              <span className="font-medium">{values.mid}</span>
            </div>
            <Slider
              value={values.mid}
              onChange={(v) => setValues((prev) => ({ ...prev, mid: v }))}
            />
          </div>

          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-600">高音 (Treble)</span>
              <span className="font-medium">{values.treble}</span>
            </div>
            <Slider
              value={values.treble}
              onChange={(v) => setValues((prev) => ({ ...prev, treble: v }))}
            />
          </div>
        </div>
      </div>
    )
  },
}
