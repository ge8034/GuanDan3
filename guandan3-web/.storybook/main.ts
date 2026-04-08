/**
 * Storybook 主配置
 *
 * Design System 组件文档
 */

import type { StorybookConfig } from '@storybook/react-vite'

const config: StorybookConfig = {
  stories: [
    // Design System 组件
    '../src/design-system/**/*.mdx',
    '../src/design-system/**/*.stories.@(js|jsx|mjs|ts|tsx)',

    // 其他组件（保留原有组件的Storybook）
    '../src/components/**/*.mdx',
    '../src/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-themes',
    '@storybook/addon-a11y',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  docs: {
    autodocs: 'tag',
  },

  // Vite 配置
  async viteFinal(config) {
    // 确保路径别名正确解析
    config.resolve = config.resolve || {}
    config.resolve.alias = config.resolve.alias || {}

    return config
  },
}

export default config
