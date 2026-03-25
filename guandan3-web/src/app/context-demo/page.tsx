'use client';

import { useState, useEffect } from 'react';
import { clsx } from 'clsx';
import ContextStatusBar from '@/components/ContextStatusBar';

export default function ContextDemoPage() {
  const [context1, setContext1] = useState(45);
  const [context2, setContext2] = useState(72);

  // 模拟上下文更新
  useEffect(() => {
    const interval = setInterval(() => {
      setContext1(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 15)));
      setContext2(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 15)));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      {/* 演示页面标题 */}
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">上下文工具栏演示</h1>
          <p className="text-slate-400">
            实时显示文件和模型上下文占比的状态栏组件
          </p>
        </div>

        {/* 演示内容区 */}
        <div className="space-y-6 mb-24">
          {/* 模拟编辑器内容 */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
            <div className="bg-slate-800/50 px-4 py-2 flex items-center gap-2 border-b border-slate-800">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
              </div>
              <div className="text-slate-400 text-sm ml-4">
                Component.tsx
              </div>
            </div>
            <div className="p-6 font-mono text-sm text-slate-300">
              <pre className="whitespace-pre-wrap leading-relaxed">
                {`import { useState, useEffect } from 'react';
import { ContextStatusBar } from '@/components/ContextStatusBar';

export default function DemoPage() {
  const [context1, setContext1] = useState(45);
  const [context2, setContext2] = useState(72);

  useEffect(() => {
    const interval = setInterval(() => {
      setContext1(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 15)));
      setContext2(prev => Math.min(100, Math.max(0, prev + (Math.random() - 0.5) * 15)));
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>演示内容</h1>
      <ContextStatusBar
        fileContext={context1}
        modelContext={context2}
        tokensUsed={context1 * 1250 + context2 * 1500}
        totalTokens={125000}
      />
    </div>
  );
}`}
              </pre>
            </div>
          </div>

          {/* 控制面板 */}
          <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-white mb-4">控制面板</h2>
            <div className="space-y-6">
              {/* 文件上下文控制 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-400">文件上下文</label>
                  <span className="text-emerald-400 font-mono">{context1}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={context1}
                  onChange={(e) => setContext1(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
                    accent-emerald-500"
                />
              </div>

              {/* 模型上下文控制 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-slate-400">模型上下文</label>
                  <span className="text-cyan-400 font-mono">{context2}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={context2}
                  onChange={(e) => setContext2(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer
                    accent-cyan-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 集成到页面中的状态栏示例 */}
      <div className="fixed bottom-0 left-0 right-0">
        <ContextStatusBar />
      </div>
    </div>
  );
}
