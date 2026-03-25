/**
 * 上下文状态栏配置
 *
 * 在这里修改状态栏的全局设置
 */

export const statusbarConfig = {
  // === 主题设置 ===
  theme: 'cyber' as 'cyber' | 'neon' | 'minimal',

  // === 显示选项 ===
  showRefresh: true,        // 显示刷新按钮
  showDiskUsage: true,      // 显示磁盘使用
  showStats: true,          // 显示统计信息
  showQuickActions: true,   // 显示快速操作

  // === 默认数据 ===
  defaultFileContext: 45,   // 默认文件上下文百分比
  defaultModelContext: 72,  // 默认模型上下文百分比
  defaultTokensUsed: 45678, // 默认已使用 token
  defaultTotalTokens: 128000, // 默认总 token

  // === 更新设置 ===
  updateInterval: 2000,     // 更新间隔（毫秒）

  // === 当前文件 ===
  currentFile: 'src/app/layout.tsx',
} as const;

/**
 * 主题颜色配置
 */
export const themeColors = {
  cyber: {
    name: '赛博朋克',
    background: 'bg-slate-900/95',
    border: 'border-emerald-500/30',
    text: 'text-slate-300',
    accent: 'text-emerald-400',
    gradient: 'from-emerald-600 to-emerald-400',
  },
  neon: {
    name: '霓虹风格',
    background: 'bg-slate-950/95',
    border: 'border-fuchsia-500/30',
    text: 'text-slate-100',
    accent: 'text-fuchsia-400',
    gradient: 'from-fuchsia-600 to-fuchsia-400',
  },
  minimal: {
    name: '简约风格',
    background: 'bg-white/95',
    border: 'border-slate-200',
    text: 'text-slate-800',
    accent: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-400',
  },
} as const;

/**
 * 预设配置
 */
export const presets = {
  // 开发环境 - 显示所有信息
  development: {
    theme: 'cyber' as const,
    showRefresh: true,
    showDiskUsage: true,
    showStats: true,
    showQuickActions: true,
  },

  // 生产环境 - 简洁显示
  production: {
    theme: 'cyber' as const,
    showRefresh: false,
    showDiskUsage: true,
    showStats: true,
    showQuickActions: false,
  },

  // 极简模式 - 最少信息
  minimal: {
    theme: 'minimal' as const,
    showRefresh: false,
    showDiskUsage: false,
    showStats: false,
    showQuickActions: false,
  },
} as const;
