'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/lib/theme/theme-context'
import { ThemeColors, ThemeConfig, GameTheme } from '@/lib/theme/theme-types'

interface ThemeEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (theme: ThemeConfig) => void
}

export default function ThemeEditor({ isOpen, onClose, onSave }: ThemeEditorProps) {
  const { currentTheme } = useTheme()
  const [themeName, setThemeName] = useState('自定义主题')
  const [themeDescription, setThemeDescription] = useState('我的个性化主题')
  const [colors, setColors] = useState<ThemeColors>(currentTheme.colors)
  const [activeTab, setActiveTab] = useState<'colors' | 'gradients' | 'shadows' | 'radius'>('colors')

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const customId = `custom_${Date.now()}`
    const customTheme: ThemeConfig = {
      id: customId as GameTheme,
      name: themeName,
      description: themeDescription,
      colors,
      gradients: currentTheme.gradients,
      shadows: currentTheme.shadows,
      borderRadius: currentTheme.borderRadius
    }
    onSave(customTheme)
    onClose()
  }

  const colorInputs: Array<{ key: keyof ThemeColors; label: string; type: 'color' | 'text' }> = [
    { key: 'primary', label: '主色调', type: 'color' },
    { key: 'secondary', label: '次要色', type: 'color' },
    { key: 'accent', label: '强调色', type: 'color' },
    { key: 'background', label: '背景色', type: 'color' },
    { key: 'surface', label: '表面色', type: 'color' },
    { key: 'text', label: '文字色', type: 'color' },
    { key: 'textSecondary', label: '次要文字色', type: 'color' },
    { key: 'success', label: '成功色', type: 'color' },
    { key: 'warning', label: '警告色', type: 'color' },
    { key: 'error', label: '错误色', type: 'color' },
    { key: 'border', label: '边框色', type: 'color' },
    { key: 'card', label: '卡片色', type: 'color' },
    { key: 'cardHover', label: '卡片悬停色', type: 'color' }
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-[600px] md:max-h-[80vh] bg-surface rounded-2xl shadow-2xl border border-border overflow-hidden z-50 flex flex-col"
          >
            <div className="p-6 border-b border-border">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-text-primary">自定义主题编辑器</h2>
                <button
                  onClick={onClose}
                  className="text-text-secondary hover:text-text-primary transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="p-6">
                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">主题名称</label>
                  <input
                    type="text"
                    value={themeName}
                    onChange={(e) => setThemeName(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="输入主题名称"
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-text-secondary mb-2">主题描述</label>
                  <input
                    type="text"
                    value={themeDescription}
                    onChange={(e) => setThemeDescription(e.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="输入主题描述"
                  />
                </div>

                <div className="mb-6">
                  <div className="flex gap-2 mb-4">
                    {(['colors', 'gradients', 'shadows', 'radius'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${
                          activeTab === tab
                            ? 'bg-primary text-white'
                            : 'bg-background-primary text-text-secondary hover:text-text-primary'
                        }`}
                      >
                        {tab === 'colors' && '颜色'}
                        {tab === 'gradients' && '渐变'}
                        {tab === 'shadows' && '阴影'}
                        {tab === 'radius' && '圆角'}
                      </button>
                    ))}
                  </div>

                  {activeTab === 'colors' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {colorInputs.map((input) => (
                        <div key={input.key}>
                          <label className="block text-sm font-medium text-text-secondary mb-2">
                            {input.label}
                          </label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={colors[input.key]}
                              onChange={(e) => handleColorChange(input.key, e.target.value)}
                              className="w-12 h-10 rounded cursor-pointer border-0"
                            />
                            <input
                              type="text"
                              value={colors[input.key]}
                              onChange={(e) => handleColorChange(input.key, e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === 'gradients' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">主色调渐变</label>
                        <input
                          type="text"
                          value={currentTheme.gradients.primary}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">次要色渐变</label>
                        <input
                          type="text"
                          value={currentTheme.gradients.secondary}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">背景渐变</label>
                        <input
                          type="text"
                          value={currentTheme.gradients.background}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <p className="text-sm text-text-secondary">
                        渐变样式基于您选择的主色调和次要色自动生成
                      </p>
                    </div>
                  )}

                  {activeTab === 'shadows' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">小阴影</label>
                        <input
                          type="text"
                          value={currentTheme.shadows.sm}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">中阴影</label>
                        <input
                          type="text"
                          value={currentTheme.shadows.md}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">大阴影</label>
                        <input
                          type="text"
                          value={currentTheme.shadows.lg}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <p className="text-sm text-text-secondary">
                        阴影样式基于您选择的主色调自动生成
                      </p>
                    </div>
                  )}

                  {activeTab === 'radius' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">小圆角</label>
                        <input
                          type="text"
                          value={currentTheme.borderRadius.sm}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">中圆角</label>
                        <input
                          type="text"
                          value={currentTheme.borderRadius.md}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">大圆角</label>
                        <input
                          type="text"
                          value={currentTheme.borderRadius.lg}
                          readOnly
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background-primary text-text-primary text-sm font-mono"
                        />
                      </div>
                      <p className="text-sm text-text-secondary">
                        圆角样式基于您选择的主题风格自动生成
                      </p>
                    </div>
                  )}
                </div>

                <div className="mb-6 p-4 rounded-lg bg-background-primary border border-border">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">主题预览</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <div
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: colors.primary }}
                      >
                        主按钮
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: colors.secondary }}
                      >
                        次要按钮
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg text-white font-medium"
                        style={{ backgroundColor: colors.accent }}
                      >
                        强调按钮
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ backgroundColor: colors.success, color: 'white' }}
                      >
                        成功
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ backgroundColor: colors.warning, color: 'white' }}
                      >
                        警告
                      </div>
                      <div
                        className="px-4 py-2 rounded-lg font-medium"
                        style={{ backgroundColor: colors.error, color: 'white' }}
                      >
                        错误
                      </div>
                    </div>
                    <div
                      className="p-4 rounded-lg border-2"
                      style={{
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        color: colors.text
                      }}
                    >
                      <div className="font-medium mb-1">卡片示例</div>
                      <div style={{ color: colors.textSecondary }}>
                        这是卡片内容的示例文本，展示主题的实际效果。
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:bg-background-primary transition-all"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition-all"
              >
                保存主题
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
