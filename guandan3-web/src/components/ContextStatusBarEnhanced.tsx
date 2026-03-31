'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { FileText, Zap, Activity, HardDrive, RefreshCw } from 'lucide-react';

interface ContextStatusBarEnhancedProps {
  className?: string;
  currentFile?: string;
  fileContext?: number;
  modelContext?: number;
  tokensUsed?: number;
  totalTokens?: number;
  showRefresh?: boolean;
  showDiskUsage?: boolean;
  updateInterval?: number;
}

interface ContextStats {
  fileContext: number;
  modelContext: number;
  tokensUsed: number;
  totalTokens: number;
  diskUsage: number;
}

const defaultStats: ContextStats = {
  fileContext: 45,
  modelContext: 72,
  tokensUsed: 45678,
  totalTokens: 128000,
  diskUsage: 78,
};

export default function ContextStatusBarEnhanced({
  className,
  currentFile = 'D:\\Learn-Claude\\GuanDan3\\guandan3-web\\src\\app\\page.tsx',
  fileContext = defaultStats.fileContext,
  modelContext = defaultStats.modelContext,
  tokensUsed = defaultStats.tokensUsed,
  totalTokens = defaultStats.totalTokens,
  showRefresh = false,
  showDiskUsage = false,
  updateInterval = 2000,
}: ContextStatusBarEnhancedProps) {
  const [stats, setStats] = useState<ContextStats>({
    fileContext,
    modelContext,
    tokensUsed,
    totalTokens,
    diskUsage: showDiskUsage ? 78 : 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());
  const [fileSize, setFileSize] = useState('24.5 KB');

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
        diskUsage: showDiskUsage ? Math.min(100, Math.max(0, prev.diskUsage + (Math.random() - 0.5) * 5)) : 0,
      }));

      setTimeout(() => setIsUpdating(false), 500);
    }, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, showDiskUsage]);

  const refreshData = () => {
    setIsUpdating(true);
    setLastUpdate(Date.now());
    setTimeout(() => setIsUpdating(false), 500);
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700',
        'px-4 py-2 flex items-center justify-between',
        'text-xs font-mono tracking-wide',
        className
      )}
    >
      {/* 左侧：文件信息 */}
      <div className="flex items-center gap-4">
        {/* 文件图标 */}
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-slate-300 truncate max-w-[200px]" title={currentFile}>
            {currentFile.split('\\').pop()}
          </span>
          {showDiskUsage && (
            <>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-purple-400" />
                <span className="text-slate-400">{fileSize}</span>
              </div>
            </>
          )}
        </div>

        {/* 分隔线 */}
        <div className="w-px h-4 bg-slate-700" />

        {/* 实时指示灯 */}
        <div className="flex items-center gap-2">
          <div
            className={clsx(
              'w-2 h-2 rounded-full',
              isUpdating ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
            )}
          />
          <span className="text-slate-500">实时更新中</span>
        </div>

        {/* 刷新按钮 */}
        {showRefresh && (
          <button
            onClick={refreshData}
            disabled={isUpdating}
            className="flex items-center gap-2 px-2 py-1 rounded
              bg-slate-800 hover:bg-slate-700 disabled:opacity-50
              transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isUpdating ? 'animate-spin' : ''}`} />
            <span className="text-slate-400">刷新</span>
          </button>
        )}
      </div>

      {/* 中间：上下文占比进度条 */}
      <div className="flex items-center gap-6 flex-1 mx-8">
        {/* 文件上下文 */}
        <div className="flex-1 min-w-[150px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">文件上下文</span>
            <span className="text-emerald-400 font-bold">{Math.round(stats.fileContext)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500 ease-out',
                'bg-gradient-to-r from-emerald-600 to-emerald-400',
                isUpdating && 'animate-pulse'
              )}
              style={{ width: `${Math.round(stats.fileContext)}%` }}
            />
          </div>
        </div>

        {/* 模型上下文 */}
        <div className="flex-1 min-w-[150px]">
          <div className="flex items-center justify-between mb-1">
            <span className="text-slate-400">模型上下文</span>
            <span className="text-cyan-400 font-bold">{Math.round(stats.modelContext)}%</span>
          </div>
          <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={clsx(
                'h-full rounded-full transition-all duration-500 ease-out',
                'bg-gradient-to-r from-cyan-600 to-cyan-400',
                isUpdating && 'animate-pulse'
              )}
              style={{ width: `${Math.round(stats.modelContext)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 右侧：Token 统计 */}
      <div className="flex items-center gap-6">
        {/* Token 使用率 */}
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-yellow-400" />
          <div className="flex flex-col items-end">
            <span className="text-slate-300 font-mono">
              {stats.tokensUsed.toLocaleString()} / {stats.totalTokens.toLocaleString()}
            </span>
            <span className="text-slate-500 text-[10px]">
              {Math.round((stats.tokensUsed / stats.totalTokens) * 100)}%
            </span>
          </div>
        </div>

        {/* 磁盘使用率 */}
        {showDiskUsage && (
          <>
            <div className="w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-3">
              <HardDrive className="w-4 h-4 text-purple-400" />
              <div className="flex flex-col items-end">
                <span className="text-slate-300 font-mono">{stats.diskUsage}%</span>
                <span className="text-slate-500 text-[10px]">磁盘</span>
              </div>
            </div>
          </>
        )}

        {/* 上次更新时间 */}
        <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500 font-mono">
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
  );
}
