/**
 * 上下文状态栏类型定义
 */

/**
 * 上下文统计信息
 */
export interface ContextStats {
  /** 文件上下文占比 (0-100) */
  fileContext: number;
  /** 模型上下文占比 (0-100) */
  modelContext: number;
  /** 已使用的 token 数量 */
  tokensUsed: number;
  /** 总 token 数量 */
  totalTokens: number;
  /** 磁盘使用率 (0-100, 可选) */
  diskUsage?: number;
  /** 缓存大小 (MB, 可选) */
  cacheSize?: number;
  /** 上次更新时间戳 */
  lastRefresh: number;
}

/**
 * 上下文状态栏基础版属性
 */
export interface ContextStatusBarProps {
  /** 自定义样式类 */
  className?: string;
  /** 当前文件路径 */
  currentFile?: string;
  /** 文件上下文占比 (0-100) */
  fileContext?: number;
  /** 模型上下文占比 (0-100) */
  modelContext?: number;
  /** 已使用的 token 数量 */
  tokensUsed?: number;
  /** 总 token 数量 */
  totalTokens?: number;
}

/**
 * 上下文状态栏增强版属性
 */
export interface ContextStatusBarEnhancedProps extends ContextStatusBarProps {
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示磁盘使用率 */
  showDiskUsage?: boolean;
  /** 数据更新间隔 (毫秒) */
  updateInterval?: number;
}

/**
 * 主题风格类型
 */
export type Theme = 'cyber' | 'neon' | 'minimal';

/**
 * 上下文状态栏专业版属性
 */
export interface ContextStatusBarProProps extends ContextStatusBarEnhancedProps {
  /** 主题风格 */
  theme?: Theme;
  /** 是否显示统计信息 */
  showStats?: boolean;
  /** 是否显示快速操作按钮 */
  showQuickActions?: boolean;
  /** 回调：刷新数据 */
  onRefresh?: () => void;
  /** 回调：展开/收起面板 */
  onToggle?: () => void;
  /** 回调：主题切换 */
  onThemeChange?: (theme: Theme) => void;
}

/**
 * 状态栏配置选项
 */
export interface StatusBarConfig {
  /** 当前文件 */
  currentFile: string;
  /** 文件上下文 */
  fileContext: number;
  /** 模型上下文 */
  modelContext: number;
  /** Token 使用 */
  tokensUsed: number;
  /** 总 Token */
  totalTokens: number;
  /** 是否显示刷新按钮 */
  showRefresh?: boolean;
  /** 是否显示磁盘使用 */
  showDiskUsage?: boolean;
  /** 更新间隔 */
  updateInterval?: number;
  /** 主题 */
  theme?: Theme;
  /** 是否显示统计 */
  showStats?: boolean;
  /** 是否显示快速操作 */
  showQuickActions?: boolean;
}

/**
 * 状态栏事件
 */
export interface StatusBarEvent {
  /** 事件类型 */
  type: 'refresh' | 'toggle' | 'themeChange';
  /** 事件数据 */
  data?: any;
}

/**
 * 上下文更新回调
 */
export type ContextUpdateCallback = (stats: ContextStats) => void;

/**
 * 上下文刷新回调
 */
export type ContextRefreshCallback = () => void;

/**
 * 上下文配置变化回调
 */
export type ContextConfigChangeCallback = (config: Partial<StatusBarConfig>) => void;
