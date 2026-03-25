# 上下文状态栏集成示例

## 实际项目集成案例

### 案例 1: AI 代码助手集成

```tsx
import { useEffect, useState, useCallback } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';
import { ContextStats } from '@/types/contextStatusBar';

/**
 * AI 代码助手主组件
 */
export default function AICodeAssistant() {
  const [stats, setStats] = useState<ContextStats>({
    fileContext: 45,
    modelContext: 72,
    tokensUsed: 45678,
    totalTokens: 128000,
    diskUsage: 78,
    cacheSize: 24.5,
    lastRefresh: Date.now(),
  });
  const [editorFile, setEditorFile] = useState('src/components/App.tsx');

  // 获取上下文统计数据
  const fetchContextStats = useCallback(async () => {
    try {
      const response = await fetch('/api/context-stats', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      setStats(prev => ({
        ...prev,
        fileContext: data.fileContext,
        modelContext: data.modelContext,
        tokensUsed: data.tokensUsed,
        diskUsage: data.diskUsage,
        cacheSize: data.cacheSize,
        lastRefresh: Date.now(),
      }));

      setEditorFile(data.currentFile);
    } catch (error) {
      console.error('获取上下文统计失败:', error);
    }
  }, []);

  // 初始化
  useEffect(() => {
    fetchContextStats();

    // 定期更新
    const interval = setInterval(fetchContextStats, 3000);

    return () => clearInterval(interval);
  }, [fetchContextStats]);

  // 事件处理
  const handleRefresh = useCallback(() => {
    fetchContextStats();
  }, [fetchContextStats]);

  const handleToggle = useCallback(() => {
    // 实现展开/收起逻辑
    console.log('切换配置面板');
  }, []);

  const handleThemeChange = useCallback((theme: Theme) => {
    // 保存主题偏好
    localStorage.setItem('context-statusbar-theme', theme);
    console.log('切换主题:', theme);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 主编辑器区域 */}
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-white mb-8">
          AI 代码助手
        </h1>

        {/* 代码编辑器模拟 */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-slate-400">{editorFile}</span>
            <span className="text-sm text-slate-500">TypeScript</span>
          </div>

          <textarea
            className="w-full h-64 bg-slate-950 text-slate-300 font-mono text-sm p-4 border border-slate-800 rounded-lg resize-none focus:outline-none focus:border-emerald-500"
            placeholder="// 你的代码..."
          />

          {/* AI 响应区域 */}
          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <h3 className="text-emerald-400 font-semibold mb-2">
              ✨ AI 建议
            </h3>
            <p className="text-slate-300 text-sm">
              检测到代码中有潜在的性能优化空间，建议使用 useMemo 优化重渲染...
            </p>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <ContextStatusBarPro
        currentFile={editorFile}
        fileContext={stats.fileContext}
        modelContext={stats.modelContext}
        tokensUsed={stats.tokensUsed}
        totalTokens={stats.totalTokens}
        diskUsage={stats.diskUsage}
        cacheSize={stats.cacheSize}
        theme={localStorage.getItem('context-statusbar-theme') as Theme || 'cyber'}
        showRefresh={true}
        showDiskUsage={true}
        showStats={true}
        showQuickActions={true}
        onRefresh={handleRefresh}
        onToggle={handleToggle}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}
```

---

### 案例 2: 数据分析平台集成

```tsx
import { useEffect, useState, useMemo } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';
import { ContextStats } from '@/types/contextStatusBar';
import { Theme } from '@/types/contextStatusBar';

/**
 * 数据分析平台主组件
 */
export default function DataAnalysisPlatform() {
  const [stats, setStats] = useState<ContextStats>({
    fileContext: 65,
    modelContext: 58,
    tokensUsed: 34521,
    totalTokens: 120000,
    diskUsage: 82,
    cacheSize: 18.7,
    lastRefresh: Date.now(),
  });

  const [theme, setTheme] = useState<Theme>('minimal');

  // 计算统计数据
  const calculatedStats = useMemo(() => {
    return {
      fileContext: calculateFileContext(),
      modelContext: calculateModelContext(),
      tokensUsed: calculateTokenUsage(),
      totalTokens: 120000,
      diskUsage: 82,
      cacheSize: 18.7,
      lastRefresh: Date.now(),
    };
  }, []);

  // 获取当前文件路径
  const getCurrentFilePath = () => {
    const currentTab = currentTabs.find(tab => tab.active);
    return currentTab?.path || 'data/dashboard.tsx';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 数据分析工具栏 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">
            数据分析平台
          </h1>

          {/* 工具栏按钮 */}
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors">
              导出报告
            </button>
            <button className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors">
              重新分析
            </button>
          </div>
        </div>
      </div>

      {/* 数据仪表板 */}
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 数据卡片 1 */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <h3 className="text-slate-600 text-sm mb-2">数据加载</h3>
            <div className="text-3xl font-bold text-slate-800">
              12.5 GB
            </div>
          </div>

          {/* 数据卡片 2 */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <h3 className="text-slate-600 text-sm mb-2">分析时长</h3>
            <div className="text-3xl font-bold text-slate-800">
              2.3 秒
            </div>
          </div>

          {/* 数据卡片 3 */}
          <div className="bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
            <h3 className="text-slate-600 text-sm mb-2">洞察数量</h3>
            <div className="text-3xl font-bold text-slate-800">
              24 个
            </div>
          </div>
        </div>

        {/* 图表区域 */}
        <div className="mt-6 bg-white rounded-lg p-6 border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">
            数据趋势分析
          </h3>
          {/* 图表内容 */}
          <div className="h-64 bg-slate-50 rounded-lg" />
        </div>
      </div>

      {/* 状态栏 */}
      <ContextStatusBarPro
        currentFile={getCurrentFilePath()}
        fileContext={calculatedStats.fileContext}
        modelContext={calculatedStats.modelContext}
        tokensUsed={calculatedStats.tokensUsed}
        totalTokens={calculatedStats.totalTokens}
        diskUsage={calculatedStats.diskUsage}
        cacheSize={calculatedStats.cacheSize}
        theme={theme}
        showRefresh={false}
        showDiskUsage={true}
        showStats={true}
        showQuickActions={true}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />
    </div>
  );
}
```

---

### 案例 3: 实时协作平台集成

```tsx
import { useEffect, useState } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';
import { ContextStats } from '@/types/contextStatusBar';
import { Theme } from '@/types/contextStatusBar';

/**
 * 实时协作平台
 */
export default function CollaborativeWorkspace() {
  const [stats, setStats] = useState<ContextStats>({
    fileContext: 30,
    modelContext: 85,
    tokensUsed: 56789,
    totalTokens: 128000,
    diskUsage: 75,
    cacheSize: 22.3,
    lastRefresh: Date.now(),
  });

  const [theme, setTheme] = useState<Theme>('neon');

  return (
    <div className="min-h-screen bg-slate-950">
      {/* 顶部导航栏 */}
      <nav className="bg-slate-900 border-b border-slate-800 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">
              团队协作空间
            </h1>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm">
              5 人在线
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* 用户头像 */}
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-cyan-400 rounded-full" />
          </div>
        </div>
      </nav>

      {/* 主工作区 */}
      <div className="flex h-[calc(100vh-60px)]">
        {/* 侧边栏 */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 p-4">
          <div className="space-y-4">
            <div className="text-sm text-slate-400 mb-4">项目文件</div>
            {/* 文件列表 */}
            <div className="space-y-2">
              <div className="p-2 bg-slate-800 rounded cursor-pointer">
                <div className="text-sm text-white">src/components/App.tsx</div>
                <div className="text-xs text-slate-500 mt-1">修改于 2 分钟前</div>
              </div>
            </div>
          </div>
        </aside>

        {/* 主内容区 */}
        <main className="flex-1 bg-slate-950">
          {/* 代码编辑器 */}
          <div className="p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              src/components/App.tsx
            </h2>

            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm text-slate-300">
              <pre className="whitespace-pre-wrap">
{`import { useState } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function App() {
  return (
    <div>
      <h1>实时协作平台</h1>
      <ContextStatusBarPro
        currentFile="src/components/App.tsx"
        fileContext={30}
        modelContext={85}
        tokensUsed={56789}
        totalTokens={128000}
        theme={theme}
      />
    </div>
  );
}`}
              </pre>
            </div>

            {/* 实时协作标记 */}
            <div className="mt-4 p-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <div className="flex items-center gap-2 text-cyan-400">
                <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                <span className="text-sm">Sarah 正在编辑这个文件</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* 状态栏 */}
      <ContextStatusBarPro
        currentFile="src/components/App.tsx"
        fileContext={stats.fileContext}
        modelContext={stats.modelContext}
        tokensUsed={stats.tokensUsed}
        totalTokens={stats.totalTokens}
        diskUsage={stats.diskUsage}
        cacheSize={stats.cacheSize}
        theme={theme}
        showRefresh={false}
        showDiskUsage={true}
        showStats={true}
        showQuickActions={true}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />
    </div>
  );
}
```

---

### 案例 4: 仪表板监控集成

```tsx
import { useEffect, useState } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';
import { ContextStats } from '@/types/contextStatusBar';
import { Theme } from '@/types/contextStatusBar';

/**
 * 系统监控仪表板
 */
export default function SystemMonitor() {
  const [stats, setStats] = useState<ContextStats>({
    fileContext: 78,
    modelContext: 65,
    tokensUsed: 23456,
    totalTokens: 100000,
    diskUsage: 45,
    cacheSize: 8.2,
    lastRefresh: Date.now(),
  });

  const [theme, setTheme] = useState<Theme>('minimal');

  return (
    <div className="min-h-screen bg-slate-100">
      {/* 顶部标题栏 */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-slate-800">
          系统监控仪表板
        </h1>
      </div>

      {/* 仪表板内容 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* 卡片 1 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">CPU 使用率</span>
              <span className="text-2xl font-bold text-slate-800">45%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div className="h-full w-2/5 bg-emerald-500 rounded-full" />
            </div>
          </div>

          {/* 卡片 2 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">内存使用</span>
              <span className="text-2xl font-bold text-slate-800">62%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div className="h-full w-3/5 bg-blue-500 rounded-full" />
            </div>
          </div>

          {/* 卡片 3 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">磁盘使用</span>
              <span className="text-2xl font-bold text-slate-800">
                {stats.diskUsage}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div className="h-full w-9/20 bg-purple-500 rounded-full" />
            </div>
          </div>

          {/* 卡片 4 */}
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-500">Token 使用</span>
              <span className="text-2xl font-bold text-slate-800">
                {Math.round((stats.tokensUsed / stats.totalTokens) * 100)}%
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full">
              <div
                className="h-full"
                style={{
                  width: `${(stats.tokensUsed / stats.totalTokens) * 100}%`,
                  backgroundColor: getThemeColor(theme),
                }}
              />
            </div>
          </div>
        </div>

        {/* 详细信息 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              系统性能指标
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">请求响应时间</span>
                <span className="text-sm text-slate-800">45ms</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">并发连接数</span>
                <span className="text-sm text-slate-800">1,234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">错误率</span>
                <span className="text-sm text-emerald-600">0.01%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              系统日志
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <div className="text-xs text-slate-500">
                [10:23:45] 系统运行正常
              </div>
              <div className="text-xs text-slate-500">
                [10:23:46] 收到新请求
              </div>
              <div className="text-xs text-slate-500">
                [10:23:47] 处理完成
              </div>
              <div className="text-xs text-slate-500">
                [10:23:48] 自动保存完成
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 状态栏 */}
      <ContextStatusBarPro
        currentFile="src/app/dashboard/page.tsx"
        fileContext={stats.fileContext}
        modelContext={stats.modelContext}
        tokensUsed={stats.tokensUsed}
        totalTokens={stats.totalTokens}
        diskUsage={stats.diskUsage}
        cacheSize={stats.cacheSize}
        theme={theme}
        showRefresh={false}
        showDiskUsage={true}
        showStats={true}
        showQuickActions={true}
        onThemeChange={(newTheme) => setTheme(newTheme)}
      />
    </div>
  );
}
```

---

## 自定义集成示例

### 添加自定义配置

```tsx
interface CustomContextStats {
  fileContext: number;
  modelContext: number;
  customMetric1: number;
  customMetric2: number;
}

export default function CustomIntegration() {
  const [stats, setStats] = useState<CustomContextStats>({
    fileContext: 45,
    modelContext: 72,
    customMetric1: 85,
    customMetric2: 92,
  });

  return (
    <div className="min-h-screen">
      <ContextStatusBarPro
        currentFile="src/app/custom/page.tsx"
        fileContext={stats.fileContext}
        modelContext={stats.modelContext}
        tokensUsed={calculateTotalTokens(stats)}
        totalTokens={128000}
        diskUsage={calculateDiskUsage(stats)}
        cacheSize={calculateCacheSize(stats)}
        theme="neon"
        showStats={true}
        showDiskUsage={true}
      />
    </div>
  );
}
```

---

## 关键集成点

### 1. 数据源集成

```tsx
// 从 API 获取数据
const fetchData = async () => {
  const response = await fetch('/api/context-stats');
  const data = await response.json();
  setStats(data);
};

// 定期更新
useEffect(() => {
  const interval = setInterval(fetchData, 3000);
  return () => clearInterval(interval);
}, []);
```

### 2. 主题持久化

```tsx
const savedTheme = localStorage.getItem('context-statusbar-theme') as Theme || 'cyber';
const [theme, setTheme] = useState(savedTheme);

useEffect(() => {
  localStorage.setItem('context-statusbar-theme', theme);
}, [theme]);
```

### 3. 自定义刷新逻辑

```tsx
const handleCustomRefresh = async () => {
  // 自定义刷新逻辑
  await fetchCustomData();
  setStats(newStats);
  // 触发状态栏更新
  window.dispatchEvent(new CustomEvent('context-updated', { detail: newStats }));
};
```

---

## 常见问题解决

### 问题: 如何与其他状态管理系统集成？

```tsx
import { useStore } from 'zustand';

const useAppStore = useStore();

export default function IntegratedApp() {
  const stats = useAppStore((state) => state.contextStats);
  const refreshStats = useAppStore((state) => state.refreshContextStats);

  return (
    <ContextStatusBarPro
      fileContext={stats.fileContext}
      modelContext={stats.modelContext}
      tokensUsed={stats.tokensUsed}
      totalTokens={stats.totalTokens}
      onRefresh={refreshStats}
    />
  );
}
```

### 问题: 如何在不同页面显示不同的状态栏？

```tsx
export default function App() {
  const [showCyber, setShowCyber] = useState(true);
  const [showNeon, setShowNeon] = useState(false);

  return (
    <>
      <button onClick={() => setShowCyber(true)}>赛博朋克</button>
      <button onClick={() => setShowNeon(true)}>霓虹风格</button>

      {showCyber && <ContextStatusBarPro theme="cyber" />}
      {showNeon && <ContextStatusBarPro theme="neon" />}
    </>
  );
}
```

---

## 总结

这些集成示例展示了如何将上下文状态栏工具集成到不同的应用场景中：

1. **AI 代码助手** - 适合开发者工具
2. **数据分析平台** - 适合数据密集型应用
3. **实时协作平台** - 适合多人协作工具
4. **系统监控仪表板** - 适合管理界面

你可以根据实际需求选择合适的集成方式，并进行相应的定制。
