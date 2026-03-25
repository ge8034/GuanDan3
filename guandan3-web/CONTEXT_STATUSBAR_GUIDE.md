# 上下文状态栏工具 - 完整使用指南

## 📋 目录

- [简介](#简介)
- [版本对比](#版本对比)
- [快速开始](#快速开始)
- [详细配置](#详细配置)
- [主题定制](#主题定制)
- [集成指南](#集成指南)
- [最佳实践](#最佳实践)

---

## 🎯 简介

上下文状态栏工具是一个实时的上下文监控系统，用于跟踪和管理 AI 模型的上下文使用情况。它采用赛博朋克风格的深色主题，提供清晰的视觉反馈和丰富的配置选项。

### 核心功能

- ✅ 实时上下文占比显示
- ✅ Token 使用统计
- ✅ 自动更新机制
- ✅ 多主题支持
- ✅ 可展开配置面板
- ✅ 磁盘使用监控
- ✅ 缓存大小显示
- ✅ 快速操作按钮

---

## 📊 版本对比

| 特性 | 基础版 | 增强版 | 专业版 |
|------|--------|--------|--------|
| 实时更新 | ✅ | ✅ | ✅ |
| Token 统计 | ✅ | ✅ | ✅ |
| 磁盘使用 | ❌ | ✅ | ✅ |
| 缓存大小 | ❌ | ❌ | ✅ |
| 多主题 | ❌ | ❌ | ✅ (3种) |
| 配置面板 | ❌ | ❌ | ✅ |
| 快速操作 | ❌ | ❌ | ✅ |
| 刷新按钮 | ❌ | ✅ | ✅ |
| 更新间隔 | 固定 | 固定 | 可配置 |

---

## 🚀 快速开始

### 安装

无需额外依赖，确保项目中已安装：

```bash
npm install clsx lucide-react
```

### 导入组件

```tsx
// 基础版
import ContextStatusBar from '@/components/ContextStatusBar';

// 增强版
import ContextStatusBarEnhanced from '@/components/ContextStatusBarEnhanced';

// 专业版
import ContextStatusBarPro from '@/components/ContextStatusBarPro';
```

### 基础用法

```tsx
import ContextStatusBar from '@/components/ContextStatusBar';

export default function MyPage() {
  return (
    <div className="min-h-screen">
      {/* 页面内容 */}
      <h1>我的页面</h1>

      {/* 状态栏 */}
      <ContextStatusBar
        currentFile="D:\\Projects\\my-app\\src\\page.tsx"
        fileContext={45}
        modelContext={72}
        tokensUsed={45678}
        totalTokens={128000}
      />
    </div>
  );
}
```

### 运行演示

```bash
npm run dev
```

访问以下页面查看不同版本：

- [基础版演示](http://localhost:3000/context-demo)
- [增强版演示](http://localhost:3000/context-demo-pro)
- [专业版演示](http://localhost:3000/context-demo-pro) - 可切换主题和配置

---

## ⚙️ 详细配置

### 基础版参数

```tsx
interface ContextStatusBarProps {
  className?: string;                    // 自定义样式类
  currentFile?: string;                  // 当前文件路径
  fileContext?: number;                  // 文件上下文占比 (0-100)
  modelContext?: number;                 // 模型上下文占比 (0-100)
  tokensUsed?: number;                   // 已使用 token
  totalTokens?: number;                  // 总 token 数量
}
```

### 增强版参数

```tsx
interface ContextStatusBarEnhancedProps {
  // 基础参数
  className?: string;
  currentFile?: string;
  fileContext?: number;
  modelContext?: number;
  tokensUsed?: number;
  totalTokens?: number;

  // 扩展参数
  showRefresh?: boolean;                 // 显示刷新按钮
  showDiskUsage?: boolean;               // 显示磁盘使用率
  updateInterval?: number;               // 更新间隔 (毫秒, 默认 2000)
}
```

### 专业版参数

```tsx
interface ContextStatusBarProProps {
  // 所有增强版参数
  className?: string;
  currentFile?: string;
  fileContext?: number;
  modelContext?: number;
  tokensUsed?: number;
  totalTokens?: number;
  showRefresh?: boolean;
  showDiskUsage?: boolean;
  updateInterval?: number;

  // 专业版专属参数
  theme?: 'cyber' | 'neon' | 'minimal';  // 主题风格
  showStats?: boolean;                   // 显示统计信息
  showQuickActions?: boolean;            // 显示快速操作
}
```

---

## 🎨 主题定制

专业版支持三种主题：

### 1. 赛博朋克 (Cyber) - 默认

```tsx
<ContextStatusBarPro theme="cyber" />
```

- 🎨 背景: 深灰蓝
- 🎨 边框: 翠绿色半透明
- 🎨 进度条: 绿色渐变
- 🎨 强调色: 翠绿

### 2. 霓虹风格 (Neon)

```tsx
<ContextStatusBarPro theme="neon" />
```

- 🎨 背景: 深黑
- 🎨 边框: 洋红色半透明
- 🎨 进度条: 洋红色渐变
- 🎨 强调色: 洋红

### 3. 简约风格 (Minimal)

```tsx
<ContextStatusBarPro theme="minimal" />
```

- 🎨 背景: 白色
- 🎨 边框: 浅灰色
- 🎨 进度条: 蓝色渐变
- 🎨 强调色: 蓝色

---

## 🔧 集成指南

### 集成到现有项目

#### 方式 1: 全局集成

```tsx
// src/app/layout.tsx
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-950">
        {children}
        <ContextStatusBarPro theme="cyber" />
      </body>
    </html>
  );
}
```

#### 方式 2: 局部集成

```tsx
// src/app/page.tsx
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function HomePage() {
  return (
    <main className="min-h-screen p-8">
      <h1>首页</h1>
      <ContextStatusBarPro
        currentFile="src/app/page.tsx"
        fileContext={60}
        modelContext={80}
        tokensUsed={67890}
        totalTokens={128000}
        theme="neon"
      />
    </main>
  );
}
```

#### 方式 3: 条件显示

```tsx
// src/components/AppWrapper.tsx
import { useState } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function AppWrapper({ children }: { children: React.ReactNode }) {
  const [showStatusBar, setShowStatusBar] = useState(true);

  return (
    <>
      {showStatusBar && (
        <ContextStatusBarPro
          currentFile={getCurrentFilePath()}
          // ... 其他参数
        />
      )}
      {children}
    </>
  );
}
```

### 与真实数据集成

```tsx
import { useEffect, useState } from 'react';
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function App() {
  const [stats, setStats] = useState({
    fileContext: 0,
    modelContext: 0,
    tokensUsed: 0,
    totalTokens: 125000,
  });

  // 从 API 获取数据
  useEffect(() => {
    fetchStats().then(data => setStats(data));
  }, []);

  return (
    <ContextStatusBarPro
      currentFile="src/app/page.tsx"
      fileContext={stats.fileContext}
      modelContext={stats.modelContext}
      tokensUsed={stats.tokensUsed}
      totalTokens={stats.totalTokens}
    />
  );
}

async function fetchStats() {
  const response = await fetch('/api/context-stats');
  return response.json();
}
```

---

## 📈 最佳实践

### 性能优化

1. **控制更新频率**
   ```tsx
   // 不要每秒更新
   <ContextStatusBarPro updateInterval={2000} />

   // 可以根据需求调整
   <ContextStatusBarPro updateInterval={5000} />
   ```

2. **使用 useMemo 优化数据**
   ```tsx
   import { useMemo } from 'react';

   const stats = useMemo(() => ({
     fileContext: calculateFileContext(),
     modelContext: calculateModelContext(),
     tokensUsed: calculateTokens(),
   }), [dependencies]);
   ```

3. **避免不必要的重渲染**
   ```tsx
   // 使用 useCallback
   const refreshData = useCallback(() => {
     // 刷新逻辑
   }, []);
   ```

### 使用场景

#### 场景 1: AI 代码编辑器

```tsx
<ContextStatusBarPro
  currentFile={editor.currentFile}
  fileContext={editor.contextPercentage}
  modelContext={ai.contextPercentage}
  tokensUsed={ai.tokensUsed}
  totalTokens={ai.tokenLimit}
  theme="neon"
  showDiskUsage={true}
/>
```

#### 场景 2: 开发工具

```tsx
<ContextStatusBarPro
  currentFile={project.currentFile}
  fileContext={fileCoverage}
  modelContext={codeContext}
  tokensUsed={usedTokens}
  totalTokens={totalTokens}
  theme="cyber"
  showQuickActions={true}
/>
```

#### 场景 3: 数据分析平台

```tsx
<ContextStatusBarPro
  currentFile={dataset.currentFile}
  fileContext={dataCoverage}
  modelContext={analysisContext}
  tokensUsed={processingTokens}
  totalTokens={tokenLimit}
  theme="minimal"
  showStats={false}
/>
```

### 响应式设计

```tsx
// 移动端优化
<div className="fixed bottom-0 left-0 right-0">
  <ContextStatusBarPro
    className="md:hidden"  // 只在移动端显示
  />
</div>
```

---

## 🛠️ 故障排查

### 问题 1: 状态栏不显示

**原因**: 可能是 z-index 问题或被其他元素遮挡

**解决**:
```tsx
// 确保 z-index 足够高
<ContextStatusBarPro
  className="fixed bottom-0 left-0 right-0 z-[9999]"
/>
```

### 问题 2: 更新不及时

**原因**: updateInterval 设置过大或数据源问题

**解决**:
```tsx
// 缩短更新间隔
<ContextStatusBarPro updateInterval={1000} />

// 或使用事件驱动更新
const handleContextUpdate = (newStats) => {
  setStats(newStats);
};
```

### 问题 3: 样式不生效

**原因**: className 被覆盖或缺少 Tailwind 配置

**解决**:
```tsx
// 使用 !important 覆盖
<ContextStatusBarPro
  className="fixed bottom-0 left-0 right-0 !z-50"
/>

// 或使用 style 属性
<ContextStatusBarPro
  style={{ zIndex: 9999 }}
/>
```

---

## 📚 API 参考

### 数据结构

```typescript
interface ContextStats {
  fileContext: number;      // 0-100
  modelContext: number;     // 0-100
  tokensUsed: number;       // 整数
  totalTokens: number;      // 整数
  diskUsage?: number;       // 0-100
  cacheSize?: number;       // MB
  lastRefresh: number;      // 时间戳
}
```

### 事件

| 事件 | 说明 | 处理方式 |
|------|------|----------|
| `refreshData` | 刷新数据 | `onRefresh={() => {}}` |
| `toggleExpand` | 展开/收起面板 | `onToggle={() => {}}` |

---

## 🎯 未来计划

- [ ] 支持自定义主题编辑器
- [ ] 添加上下文历史记录
- [ ] 多文件上下文显示
- [ ] 导出为 VS Code 扩展
- [ ] 添加上下文质量评分
- [ ] 支持 VS Code 集成
- [ ] 支持更多编辑器（WebStorm, IntelliJ 等）

---

## 📝 更新日志

### v1.3.0 (最新)

- ✨ 新增专业版，支持多主题
- ✨ 新增配置面板
- ✨ 新增缓存大小显示
- ✨ 优化动画效果
- 🐛 修复边界情况

### v1.2.0

- ✨ 新增磁盘使用监控
- ✨ 新增刷新按钮
- ✨ 新增缓存大小显示
- 🎨 优化视觉效果

### v1.1.0

- ✨ 增强版发布
- ✨ 支持更新间隔配置
- 🎨 改进响应式设计

### v1.0.0

- 🎉 基础版发布
- ✨ 实时上下文监控
- ✨ Token 统计
- ✨ 自动更新

---

## 💡 提示和技巧

1. **性能监控**: 建议在开发环境显示，生产环境可以隐藏
2. **主题切换**: 根据应用整体风格选择合适的主题
3. **数据源**: 可以连接到真实的 AI API 获取数据
4. **响应式**: 在移动设备上可以调整布局
5. **可访问性**: 为所有交互元素添加适当的标签

---

## 📄 许可证

MIT License - 自由使用和修改

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- GitHub Issues
- Email: support@example.com
