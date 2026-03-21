'use client'

import { useTheme } from '@/lib/theme/theme-context'
import ThemeTransition from '@/components/theme/ThemeTransition'

export default function TestThemePage() {
  const { currentTheme, isDark, mode, gameTheme } = useTheme()

  return (
    <ThemeTransition>
      <div className="min-h-screen p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">主题系统测试</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: currentTheme.colors.surface,
                border: `1px solid ${currentTheme.colors.border}`
              }}
            >
              <h2 className="text-2xl font-semibold mb-4">当前主题信息</h2>
              <div className="space-y-2">
                <p><strong>游戏主题:</strong> {currentTheme.name}</p>
                <p><strong>显示模式:</strong> {mode === 'auto' ? `自动 (${isDark ? '深色' : '浅色'})` : (mode === 'dark' ? '深色' : '浅色')}</p>
                <p><strong>主题ID:</strong> {gameTheme}</p>
              </div>
            </div>

            <div
              className="p-6 rounded-xl"
              style={{
                backgroundColor: currentTheme.colors.surface,
                border: `1px solid ${currentTheme.colors.border}`
              }}
            >
              <h2 className="text-2xl font-semibold mb-4">主题描述</h2>
              <p className="opacity-80">{currentTheme.description}</p>
            </div>
          </div>

          <div
            className="p-6 rounded-xl mb-8"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">颜色预览</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.primary }}
                />
                <p className="text-sm text-center">Primary</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.secondary }}
                />
                <p className="text-sm text-center">Secondary</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.accent }}
                />
                <p className="text-sm text-center">Accent</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.background }}
                />
                <p className="text-sm text-center">Background</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.success }}
                />
                <p className="text-sm text-center">Success</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.warning }}
                />
                <p className="text-sm text-center">Warning</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.error }}
                />
                <p className="text-sm text-center">Error</p>
              </div>
              <div className="space-y-2">
                <div
                  className="w-full h-12 rounded-lg"
                  style={{ backgroundColor: currentTheme.colors.border }}
                />
                <p className="text-sm text-center">Border</p>
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-xl mb-8"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">渐变预览</h2>
            <div className="space-y-4">
              <div
                className="w-full h-16 rounded-lg"
                style={{ background: currentTheme.gradients.primary }}
              />
              <div
                className="w-full h-16 rounded-lg"
                style={{ background: currentTheme.gradients.secondary }}
              />
              <div
                className="w-full h-16 rounded-lg"
                style={{ background: currentTheme.gradients.background }}
              />
            </div>
          </div>

          <div
            className="p-6 rounded-xl mb-8"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">阴影预览</h2>
            <div className="flex gap-4">
              <div
                className="w-24 h-24 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.card,
                  boxShadow: currentTheme.shadows.sm
                }}
              >
                Small
              </div>
              <div
                className="w-24 h-24 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.card,
                  boxShadow: currentTheme.shadows.md
                }}
              >
                Medium
              </div>
              <div
                className="w-24 h-24 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.card,
                  boxShadow: currentTheme.shadows.lg
                }}
              >
                Large
              </div>
            </div>
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              backgroundColor: currentTheme.colors.surface,
              border: `1px solid ${currentTheme.colors.border}`
            }}
          >
            <h2 className="text-2xl font-semibold mb-4">圆角预览</h2>
            <div className="flex gap-4">
              <div
                className="w-24 h-24 flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.card,
                  borderRadius: currentTheme.borderRadius.sm
                }}
              >
                Small
              </div>
              <div
                className="w-24 h-24 flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.card,
                  borderRadius: currentTheme.borderRadius.md
                }}
              >
                Medium
              </div>
              <div
                className="w-24 h-24 flex items-center justify-center"
                style={{
                  backgroundColor: currentTheme.colors.card,
                  borderRadius: currentTheme.borderRadius.lg
                }}
              >
                Large
              </div>
            </div>
          </div>
        </div>
      </div>
    </ThemeTransition>
  )
}
