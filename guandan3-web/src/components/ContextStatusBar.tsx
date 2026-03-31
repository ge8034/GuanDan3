'use client';

import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { Monitor, FileText, Zap, Activity } from 'lucide-react';

interface ContextStatusBarProps {
  className?: string;
}

interface ContextStats {
  fileContext: number;
  modelContext: number;
  tokensUsed: number;
  totalTokens: number;
}

export default function ContextStatusBar({ className }: ContextStatusBarProps) {
  const [stats, setStats] = useState<ContextStats>({
    fileContext: 0,
    modelContext: 0,
    tokensUsed: 0,
    totalTokens: 125000,
  });
  const [currentFile, setCurrentFile] = useState('D:\\Learn-Claude\\GuanDan3\\guandan3-web\\src\\app\\page.tsx');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(() => Date.now());

  // 模拟实时数据更新
  useEffect(() => {
    const interval = setInterval(() => {
      setIsUpdating(true);
      setLastUpdate(Date.now());

      // 模拟动态变化
      setStats(prev => ({
        ...prev,
        fileContext: Math.min(100, Math.max(0, prev.fileContext + (Math.random() - 0.5) * 10)),
        modelContext: Math.min(100, Math.max(0, prev.modelContext + (Math.random() - 0.5) * 10)),
        tokensUsed: Math.floor(prev.tokensUsed + (Math.random() - 0.5) * 100),
      }));

      setTimeout(() => setIsUpdating(false), 500);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={clsx(
        'fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-sm border-t border-emerald-500/30',
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
          <span className="text-slate-300 truncate max-w-[200px]">
            {currentFile}
          </span>
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
                'bg-gradient-to-r from-emerald-600 to-emerald-400'
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
                'bg-gradient-to-r from-cyan-600 to-cyan-400'
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
            <span className="text-slate-300">
              {stats.tokensUsed.toLocaleString()} / {stats.totalTokens.toLocaleString()}
            </span>
            <span className="text-slate-500 text-[10px]">
              {Math.round((stats.tokensUsed / stats.totalTokens) * 100)}%
            </span>
          </div>
        </div>

        {/* 上次更新时间 */}
        <div className="flex items-center gap-3 border-l border-slate-700 pl-6">
          <Activity className="w-4 h-4 text-slate-400" />
          <span className="text-slate-500">
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
