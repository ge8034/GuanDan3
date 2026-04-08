/**
 * Storybook 全局配置
 *
 * 配置全局装饰器、主题、参数
 */

import type { Preview } from '@storybook/react'
import { withThemeByDataAttribute } from '@storybook/addon-themes'
import { themes } from '@storybook/theming'
import '../src/app/globals.css'

// ============================================
// 全局参数
// ============================================
const preview: Preview = {
  parameters: {
    // 控制面板布局
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    // 可访问性配置
    a11y: {
      config: {},
      options: {
        checks: {
          'color-contrast': { options: { contrastRatio: { min: 4.5 } } },
        },
      },
    },

    // 动画配置
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      expanded: true,
    },

    // 背景
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#f5f5dc',
        },
        {
          name: 'dark',
          value: '#0d2818',
        },
        {
          name: 'poker table',
          value: '#1a472a',
        },
      ],
    },
  },

  // 全局装饰器
  decorators: [
    // 主题切换支持
    withThemeByDataAttribute({
      themes: {
        light: '',
        dark: 'dark',
      },
      defaultTheme: 'light',
      attributeName: 'data-theme',
    }),

    // 设计系统包装器
    (Story, context) => {
      const { theme } = context.parameters

      return (
        <div
          className={`min-h-screen p-8 ${
            theme === 'dark' ? 'bg-poker-table text-white' : 'bg-beige-light'
          }`}
          style={{
            fontFamily: 'var(--font-noto-serif-sc), system-ui, sans-serif',
          }}
        >
          <div className="max-w-4xl mx-auto">
            <Story />
          </div>
        </div>
      )
    },
  ],

  // 全局标签
  tags: ['autodocs'],

  // 全局类型
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
}

export default preview
