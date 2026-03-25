'use client';

import { useState } from 'react';
import { clsx } from 'clsx';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function StatusBarDemo() {
  const [theme, setTheme] = useState<'cyber' | 'neon' | 'minimal'>('cyber');

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 顶部标题 */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <h1 className="text-xl font-bold text-white">
            📍 上下文状态栏 - 固定在底部
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            状态栏固定在窗口底部，不会被内容遮挡
          </p>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="pt-24 pb-32 px-6 max-w-7xl mx-auto">
        {/* 主题选择器 */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            🎨 选择主题
          </h2>
          <div className="flex gap-3">
            {[
              { key: 'cyber' as const, name: '赛博朋克', color: 'from-emerald-600 to-emerald-400' },
              { key: 'neon' as const, name: '霓虹风格', color: 'from-fuchsia-600 to-fuchsia-400' },
              { key: 'minimal' as const, name: '简约风格', color: 'from-blue-600 to-blue-400' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                className={clsx(
                  'px-6 py-3 rounded-lg font-medium transition-all',
                  'transform hover:scale-105',
                  theme === t.key
                    ? `bg-gradient-to-r ${t.color} text-white shadow-lg`
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                )}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        {/* 模拟内容区域 */}
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">📊 数据监控面板</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-2">CPU 使用率</div>
                <div className="text-2xl font-bold text-emerald-400">45%</div>
                <div className="h-2 bg-slate-700 rounded-full mt-2">
                  <div className="h-full w-2/5 bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-2">内存使用</div>
                <div className="text-2xl font-bold text-blue-400">62%</div>
                <div className="h-2 bg-slate-700 rounded-full mt-2">
                  <div className="h-full w-3/5 bg-blue-500 rounded-full" />
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-slate-400 text-sm mb-2">网络延迟</div>
                <div className="text-2xl font-bold text-cyan-400">24ms</div>
                <div className="h-2 bg-slate-700 rounded-full mt-2">
                  <div className="h-full w-1/4 bg-cyan-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">📝 任务列表</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-emerald-400 text-sm">✓</span>
                </div>
                <span className="text-slate-300">完成代码审查</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-6 h-6 rounded bg-blue-500/20 flex items-center justify-center">
                  <span className="text-blue-400 text-sm">⚡</span>
                </div>
                <span className="text-slate-300">优化性能</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                  <span className="text-purple-400 text-sm">🎨</span>
                </div>
                <span className="text-slate-300">设计新界面</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg">
                <div className="w-6 h-6 rounded bg-yellow-500/20 flex items-center justify-center">
                  <span className="text-yellow-400 text-sm">⚠</span>
                </div>
                <span className="text-slate-300">修复 Bug</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">📈 性能指标</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">请求响应时间</span>
                  <span className="text-slate-200">45ms</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full">
                  <div className="h-full w-[45%] bg-emerald-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">并发连接数</span>
                  <span className="text-slate-200">1,234</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full">
                  <div className="h-full w-[60%] bg-blue-500 rounded-full" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">错误率</span>
                  <span className="text-emerald-400">0.01%</span>
                </div>
                <div className="h-2 bg-slate-800 rounded-full">
                  <div className="h-full w-[1%] bg-emerald-500 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h3 className="text-white font-semibold mb-4">⚙️ 系统状态</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <span className="text-slate-400">运行时间</span>
                <span className="text-slate-200">2天 14小时</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <span className="text-slate-400">服务状态</span>
                <span className="text-emerald-400">运行中</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <span className="text-slate-400">最后更新</span>
                <span className="text-slate-200">刚刚</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-lg">
                <span className="text-slate-400">连接数</span>
                <span className="text-slate-200">847</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 固定状态栏 - 固定在窗口底部 */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <ContextStatusBarPro
          theme={theme}
          showRefresh={true}
          showDiskUsage={true}
          showStats={true}
          showQuickActions={true}
          currentFile="src/app/statusbar-demo/page.tsx"
          fileContext={45}
          modelContext={72}
          tokensUsed={45678}
          totalTokens={128000}
        />
      </div>

      {/* 底部占位，防止内容被状态栏遮挡 */}
      <div className="fixed bottom-0 left-0 right-0 h-12 bg-slate-950 z-40 pointer-events-none" />
    </div>
  );
}
