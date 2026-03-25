'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function ContextDemoProPage() {
  const [theme, setTheme] = useState<'cyber' | 'neon' | 'minimal'>('cyber');
  const [showStats, setShowStats] = useState(true);
  const [showDiskUsage, setShowDiskUsage] = useState(true);
  const [showRefresh, setShowRefresh] = useState(true);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [fileContext, setFileContext] = useState(45);
  const [modelContext, setModelContext] = useState(72);
  const [tokensUsed, setTokensUsed] = useState(45678);
  const [totalTokens, setTotalTokens] = useState(128000);

  const themes = {
    cyber: '赛博朋克',
    neon: '霓虹风格',
    minimal: '简约风格'
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {/* 演示页面标题 */}
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">专业版上下文工具栏</h1>
          <p className="text-slate-400">
            功能完整的实时上下文监控工具，支持多种主题和配置选项
          </p>
        </div>

        {/* 主题切换控制 */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">主题配置</h2>
          <div className="flex gap-3">
            {Object.entries(themes).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTheme(key as 'cyber' | 'neon' | 'minimal')}
                className={clsx(
                  'px-6 py-3 rounded-lg font-medium transition-all',
                  theme === key
                    ? 'bg-white text-slate-950 transform scale-105 shadow-lg'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 功能开关控制 */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">功能开关</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">显示统计信息</span>
              <input
                type="checkbox"
                checked={showStats}
                onChange={(e) => setShowStats(e.target.checked)}
                className="w-5 h-5 accent-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">显示磁盘使用</span>
              <input
                type="checkbox"
                checked={showDiskUsage}
                onChange={(e) => setShowDiskUsage(e.target.checked)}
                className="w-5 h-5 accent-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">显示刷新按钮</span>
              <input
                type="checkbox"
                checked={showRefresh}
                onChange={(e) => setShowRefresh(e.target.checked)}
                className="w-5 h-5 accent-emerald-500"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">显示快速操作</span>
              <input
                type="checkbox"
                checked={showQuickActions}
                onChange={(e) => setShowQuickActions(e.target.checked)}
                className="w-5 h-5 accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* 参数控制 */}
        <div className="mb-8 bg-slate-900 border border-slate-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-4">参数控制</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {/* 文件上下文 */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                文件上下文: {fileContext}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={fileContext}
                onChange={(e) => setFileContext(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            {/* 模型上下文 */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                模型上下文: {modelContext}%
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={modelContext}
                onChange={(e) => setModelContext(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            {/* Token 使用量 */}
            <div>
              <label className="block text-sm text-slate-400 mb-2">
                已使用: {tokensUsed.toLocaleString()}
              </label>
              <input
                type="range"
                min="0"
                max="200000"
                step="1000"
                value={tokensUsed}
                onChange={(e) => setTokensUsed(Number(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-yellow-500"
              />
            </div>
          </div>
        </div>

        {/* 文件内容模拟 */}
        <div className="mb-24">
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-slate-400 text-sm ml-4">
                ContextStatusBarPro.tsx
              </div>
            </div>
            <div className="p-6 font-mono text-sm text-slate-300 overflow-x-auto">
              <pre className="whitespace-pre-wrap leading-relaxed">
{`import { useEffect, useState } from 'react';
import { clsx } from 'clsx';
import { FileText, Zap, Activity } from 'lucide-react';

interface ContextStatusBarProProps {
  className?: string;
  currentFile?: string;
  fileContext?: number;
  modelContext?: number;
  tokensUsed?: number;
  totalTokens?: number;
  showRefresh?: boolean;
  showDiskUsage?: boolean;
  theme?: 'cyber' | 'neon' | 'minimal';
}

export default function ContextStatusBarPro({
  theme = 'cyber',
  // ... props
}: ContextStatusBarProProps) {
  const [stats, setStats] = useState({
    fileContext,
    modelContext,
    tokensUsed,
    totalTokens,
    diskUsage: 78,
    cacheSize: 24.5,
  });

  // 自动更新逻辑
  useEffect(() => {
    const interval = setInterval(() => {
      // 更新数据
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* 主状态栏 */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        {/* 文件信息 */}
        {/* 进度条 */}
        {/* Token 统计 */}
      </div>

      {/* 可展开配置面板 */}
      {isExpanded && (
        <div className="fixed bottom-14 left-1/2 -translate-x-1/2">
          {/* 配置选项 */}
        </div>
      )}
    </>
  );
}`}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* 集成到页面中的专业版状态栏 */}
      <ContextStatusBarPro
        theme={theme}
        showStats={showStats}
        showDiskUsage={showDiskUsage}
        showRefresh={showRefresh}
        showQuickActions={showQuickActions}
        currentFile="D:\\Learn-Claude\\GuanDan3\\guandan3-web\\src\\components\\ContextStatusBarPro.tsx"
        fileContext={fileContext}
        modelContext={modelContext}
        tokensUsed={tokensUsed}
        totalTokens={totalTokens}
      />
    </div>
  );
}
