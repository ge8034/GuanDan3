'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { clsx } from 'clsx';
import { logger } from '@/lib/utils/logger'
import {
  FileText,
  Zap,
  Activity,
  HardDrive,
  RefreshCw,
  Settings,
  CheckCircle2,
  Clock,
  HardDriveDownload,
  Brain,
  Database
} from 'lucide-react';

interface ContextStatusBarProProps {
  className?: string;
  currentFile?: string;
  fileContext?: number;
  modelContext?: number;
  tokensUsed?: number;
  totalTokens?: number;
  showRefresh?: boolean;
  showDiskUsage?: boolean;
  updateInterval?: number;
  theme?: 'cyber' | 'neon' | 'minimal';
  showStats?: boolean;
  showQuickActions?: boolean;
}

interface ContextStats {
  fileContext: number;
  modelContext: number;
  tokensUsed: number;
  totalTokens: number;
  diskUsage: number;
  cacheSize: number;
  lastRefresh: number;
}

const defaultStats: ContextStats = {
  fileContext: 45,
  modelContext: 72,
  tokensUsed: 45678,
  totalTokens: 128000,
  diskUsage: 78,
  cacheSize: 24.5,
  lastRefresh: Date.now(),
};

// 配置选项
type Theme = 'cyber' | 'neon' | 'minimal';

const themes: Record<Theme, {
  background: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  progressBarFile: string;
  progressBarModel: string;
  accentFile: string;
  accentModel: string;
}> = {
  cyber: {
    background: 'bg-slate-900/95',
    border: 'border-emerald-500/30',
    textPrimary: 'text-slate-200',
    textSecondary: 'text-slate-500',
    progressBarFile: 'bg-gradient-to-r from-emerald-600 to-emerald-400',
    progressBarModel: 'bg-gradient-to-r from-cyan-600 to-cyan-400',
    accentFile: 'text-emerald-400',
    accentModel: 'text-cyan-400',
  },
  neon: {
    background: 'bg-slate-950/95',
    border: 'border-fuchsia-500/30',
    textPrimary: 'text-slate-100',
    textSecondary: 'text-slate-600',
    progressBarFile: 'bg-gradient-to-r from-fuchsia-600 to-fuchsia-400',
    progressBarModel: 'bg-gradient-to-r from-violet-600 to-violet-400',
    accentFile: 'text-fuchsia-400',
    accentModel: 'text-violet-400',
  },
  minimal: {
    background: 'bg-white/95',
    border: 'border-slate-200',
    textPrimary: 'text-slate-800',
    textSecondary: 'text-slate-500',
    progressBarFile: 'bg-gradient-to-r from-blue-600 to-blue-400',
    progressBarModel: 'bg-gradient-to-r from-indigo-600 to-indigo-400',
    accentFile: 'text-blue-600',
    accentModel: 'text-indigo-600',
  },
};

export default function ContextStatusBarPro({
  className,
  currentFile = 'D:\\Learn-Claude\\GuanDan3\\guandan3-web\\src\\app\\page.tsx',
  fileContext = defaultStats.fileContext,
  modelContext = defaultStats.modelContext,
  tokensUsed = defaultStats.tokensUsed,
  totalTokens = defaultStats.totalTokens,
  showRefresh = false,
  showDiskUsage = false,
  updateInterval = 2000,
  theme = 'cyber',
  showStats = true,
  showQuickActions = true,
}: ContextStatusBarProProps) {
  const [stats, setStats] = useState<ContextStats>({
    ...defaultStats,
    fileContext,
    modelContext,
    tokensUsed,
    totalTokens,
    diskUsage: showDiskUsage ? 78 : 0,
    cacheSize: 24.5,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());
  const [isExpanded, setIsExpanded] = useState(false);
  const fileRef = useRef<HTMLSpanElement>(null);
  const downloadRef = useRef<HTMLDivElement>(null);

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setLastUpdate(Date.now());

      setStats(prev => ({
        ...prev,
        fileContext: Math.min(100, Math.max(0, prev.fileContext + (Math.random() - 0.5) * 10)),
        modelContext: Math.min(100, Math.max(0, prev.modelContext + (Math.random() - 0.5) * 10)),
        tokensUsed: Math.floor(prev.tokensUsed + (Math.random() - 0.5) * 100),
        cacheSize: Math.max(20, Math.min(35, prev.cacheSize + (Math.random() - 0.5) * 2)),
      }));

      setTimeout(() => setIsUpdating(false), 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, showDiskUsage]);

  const refreshData = useCallback(() => {
    setIsUpdating(true);
    setLastUpdate(Date.now());

    setTimeout(() => {
      setIsUpdating(false);
    }, 500);
  }, []);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTokens = (tokens: number) => {
    return tokens.toLocaleString();
  };

  const currentTheme = themes[theme];

  return (
    <>
      {/* 状态栏主容器 */}
      <div
        className={clsx(
          'fixed bottom-0 left-0 right-0 z-50',
          currentTheme.background,
          currentTheme.border,
          'border-t backdrop-blur-sm',
          'px-4 py-2 flex items-center justify-between',
          'text-xs font-mono tracking-wide',
          'transition-all duration-300',
          className
        )}
      >
        {/* 左侧：文件信息 */}
        <div className="flex items-center gap-4">
          {/* 文件图标 */}
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span
              ref={fileRef}
              className={clsx('truncate max-w-[200px]', currentTheme.textPrimary)}
              title={currentFile}
            >
              {currentFile.split('\\').pop()}
            </span>
            {showDiskUsage && (
              <>
                <div className="w-px h-4 bg-current opacity-20" />
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  <span className={currentTheme.textSecondary}>
                    {formatBytes(stats.cacheSize * 1024)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* 分隔线 */}
          <div className="w-px h-4 bg-current opacity-20" />

          {/* 实时指示灯 */}
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                'w-2 h-2 rounded-full transition-colors',
                isUpdating
                  ? currentTheme.progressBarFile.replace('from-', 'from-').split(' ')[0] + '400'
                  : 'bg-current opacity-30'
              )}
            />
            <span className={clsx('text-xs', currentTheme.textSecondary)}>
              {isUpdating ? '更新中...' : '实时同步'}
            </span>
          </div>

          {/* 刷新按钮 */}
          {showRefresh && (
            <button
              onClick={refreshData}
              disabled={isUpdating}
              className={clsx(
                'flex items-center gap-2 px-2 py-1 rounded transition-colors',
                'hover:opacity-100 opacity-70',
                isUpdating ? 'cursor-wait' : 'cursor-pointer'
              )}
            >
              <RefreshCw className={clsx('w-3 h-3', isUpdating && 'animate-spin')} />
              <span className={clsx('text-xs', currentTheme.textSecondary)}>刷新</span>
            </button>
          )}

          {/* 展开按钮 */}
          <button
            onClick={toggleExpand}
            className={clsx(
              'flex items-center gap-2 px-2 py-1 rounded transition-colors',
              'hover:opacity-100 opacity-70',
              'ml-2',
              currentTheme.textSecondary
            )}
          >
            <Settings className="w-3 h-3" />
            <span className={clsx('text-xs', currentTheme.textSecondary)}>配置</span>
          </button>
        </div>

        {/* 中间：上下文占比进度条 */}
        <div className="flex items-center gap-6 flex-1 mx-8">
          {/* 文件上下文 */}
          <div className="flex-1 min-w-[150px]">
            <div className="flex items-center justify-between mb-1">
              <span className={clsx('text-xs', currentTheme.textSecondary)}>文件上下文</span>
              <span className={clsx('font-bold', currentTheme.accentFile)}>
                {Math.round(stats.fileContext)}%
              </span>
            </div>
            <div className="h-1.5 bg-current opacity-10 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  'animate-pulse',
                  currentTheme.progressBarFile
                )}
                style={{ width: `${Math.round(stats.fileContext)}%` }}
              />
            </div>
          </div>

          {/* 模型上下文 */}
          <div className="flex-1 min-w-[150px]">
            <div className="flex items-center justify-between mb-1">
              <span className={clsx('text-xs', currentTheme.textSecondary)}>模型上下文</span>
              <span className={clsx('font-bold', currentTheme.accentModel)}>
                {Math.round(stats.modelContext)}%
              </span>
            </div>
            <div className="h-1.5 bg-current opacity-10 rounded-full overflow-hidden">
              <div
                className={clsx(
                  'h-full rounded-full transition-all duration-500 ease-out',
                  'animate-pulse',
                  currentTheme.progressBarModel
                )}
                style={{ width: `${Math.round(stats.modelContext)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 右侧：Token 统计 */}
        <div className="flex items-center gap-6">
          {/* Token 使用率 */}
          {showStats && (
            <div className="flex items-center gap-3">
              <Zap className="w-4 h-4" />
              <div className="flex flex-col items-end">
                <span className={clsx('font-mono', currentTheme.textPrimary)}>
                  {formatTokens(stats.tokensUsed)} / {formatTokens(stats.totalTokens)}
                </span>
                <span className={clsx('text-[10px]', currentTheme.textSecondary)}>
                  {Math.round((stats.tokensUsed / stats.totalTokens) * 100)}%
                </span>
              </div>
            </div>
          )}

          {/* 磁盘使用率 */}
          {showDiskUsage && (
            <>
              <div className="w-px h-4 bg-current opacity-20" />
              <div className="flex items-center gap-3">
                <HardDrive className="w-4 h-4" />
                <div className="flex flex-col items-end">
                  <span className={clsx('font-mono', currentTheme.textPrimary)}>{stats.diskUsage}%</span>
                  <span className={clsx('text-[10px]', currentTheme.textSecondary)}>磁盘</span>
                </div>
              </div>
            </>
          )}

          {/* 缓存大小 */}
          <div className="w-px h-4 bg-current opacity-20" />
          <div className="flex items-center gap-3">
            <Brain className="w-4 h-4" />
            <div className="flex flex-col items-end">
              <span className={clsx('font-mono', currentTheme.textPrimary)}>{stats.cacheSize} MB</span>
              <span className={clsx('text-[10px]', currentTheme.textSecondary)}>缓存</span>
            </div>
          </div>

          {/* 上次更新时间 */}
          <div className="flex items-center gap-3 border-l border-current opacity-10 pl-6">
            <Clock className="w-4 h-4" />
            <span
              className={clsx('font-mono text-[10px]', currentTheme.textSecondary)}
              suppressHydrationWarning
            >
              {new Date(lastUpdate).toLocaleTimeString('zh-CN', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* 展开面板 */}
      {isExpanded && (
        <div
          className={clsx(
            'fixed bottom-14 left-1/2 -translate-x-1/2 w-[600px] bg-slate-950/98 backdrop-blur-xl border border-slate-800 rounded-xl p-6 z-50',
            'shadow-2xl shadow-emerald-500/10',
            'transition-all duration-300 transform origin-bottom'
          )}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <Settings className="w-4 h-4" />
              上下文配置
            </h3>
            <button
              onClick={toggleExpand}
              className="text-slate-500 hover:text-white transition-colors"
            >
              <CheckCircle2 className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            {/* 主题选择 */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">主题风格</label>
              <div className="flex gap-3">
                {Object.keys(themes).map((t) => (
                  <button
                    key={t}
                    onClick={() => logger.debug('切换主题:', t)}
                    className={clsx(
                      'px-4 py-2 rounded-lg text-xs font-medium transition-all',
                      theme === t
                        ? 'bg-white/10 text-white border border-white/20'
                        : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* 选项开关 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">显示刷新按钮</span>
                <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full absolute top-0.5 right-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">显示磁盘使用</span>
                <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full absolute top-0.5 right-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">显示统计信息</span>
                <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full absolute top-0.5 right-0.5" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">显示快速操作</span>
                <div className="w-10 h-5 bg-emerald-500/20 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-emerald-400 rounded-full absolute top-0.5 right-0.5" />
                </div>
              </div>
            </div>

            {/* Token 限制 */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">Token 限制: {stats.totalTokens.toLocaleString()}</label>
              <input
                type="range"
                min="10000"
                max="200000"
                step="10000"
                value={stats.totalTokens}
                onChange={(e) => setStats(prev => ({ ...prev, totalTokens: Number(e.target.value) }))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* 更新频率 */}
            <div>
              <label className="block text-xs text-slate-400 mb-2">更新频率</label>
              <select
                value={updateInterval}
                onChange={(e) => logger.debug('更新频率:', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="1000">1 秒</option>
                <option value="2000">2 秒</option>
                <option value="5000">5 秒</option>
                <option value="10000">10 秒</option>
              </select>
            </div>
          </div>

          {/* 底部提示 */}
          <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Database className="w-3 h-3" />
              <span>上下文已自动同步</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Activity className="w-3 h-3" />
              <span>{formatBytes(stats.cacheSize * 1024)} 已缓存</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
