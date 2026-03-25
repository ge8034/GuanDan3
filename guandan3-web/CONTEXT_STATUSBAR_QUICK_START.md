# 上下文状态栏工具 - 快速开始指南

## 🎯 3分钟快速上手

### 第一步：安装依赖

```bash
npm install clsx lucide-react
```

### 第二步：导入组件

```tsx
import ContextStatusBarPro from '@/components/ContextStatusBarPro';
```

### 第三步：添加到你的页面

```tsx
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

export default function MyPage() {
  return (
    <div className="min-h-screen">
      <h1>我的页面</h1>

      {/* 添加状态栏 */}
      <ContextStatusBarPro
        currentFile="src/app/page.tsx"
        fileContext={45}
        modelContext={72}
        tokensUsed={45678}
        totalTokens={128000}
        theme="cyber"
      />
    </div>
  );
}
```

### 第四步：运行查看效果

```bash
npm run dev
```

访问：http://localhost:3000/context-demo-pro

---

## 📚 文档导航

### 需要快速了解？

📖 **[完整使用指南](./CONTEXT_STATUSBAR_GUIDE.md)** - 查看详细配置和API

💡 **[集成示例](./CONTEXT_INTEGRATION_EXAMPLES.md)** - 查看4个完整集成案例

📋 **[项目总结](./CONTEXT_STATUSBAR_PROJECT_SUMMARY.md)** - 全方位项目概览

---

## 🎨 选择适合你的版本

| 版本 | 何时使用 | 文件大小 | 特性 |
|------|----------|----------|------|
| **基础版** | 项目简单，只需基本功能 | 15 KB | 实时上下文监控、Token统计 |
| **增强版** | 需要磁盘监控、刷新按钮 | 25 KB | +磁盘使用、+刷新功能 |
| **专业版** ⭐ | 需要高度定制化、多主题 | 45 KB | +配置面板、+缓存监控、3种主题 |

---

## ⚡ 快速配置

### 基础配置

```tsx
<ContextStatusBarPro
  currentFile="src/app/page.tsx"
  fileContext={45}
  modelContext={72}
  tokensUsed={45678}
  totalTokens={128000}
/>
```

### 自定义主题

```tsx
<ContextStatusBarPro
  theme="neon"  // 或 "cyber" | "minimal"
/>
```

### 完整配置

```tsx
<ContextStatusBarPro
  // 文件信息
  currentFile="src/app/page.tsx"
  fileContext={45}
  modelContext={72}

  // Token 统计
  tokensUsed={45678}
  totalTokens={128000}

  // 显示选项
  showRefresh={true}
  showDiskUsage={true}
  showStats={true}
  showQuickActions={true}

  // 主题
  theme="cyber"

  // 更新间隔（毫秒）
  updateInterval={2000}

  // 回调
  onRefresh={() => console.log('刷新')}
  onToggle={() => console.log('切换')}
  onThemeChange={(theme) => console.log('主题:', theme)}
/>
```

---

## 🎨 主题说明

### 赛博朋克 (Cyber) - 默认
- 🎨 背景：深灰蓝
- 🎨 边框：翠绿色
- 🎨 进度条：绿色渐变
- 🎨 强调色：翠绿

### 霓虹风格 (Neon)
- 🎨 背景：深黑
- 🎨 边框：洋红色
- 🎨 进度条：洋红渐变
- 🎨 强调色：洋红

### 简约风格 (Minimal)
- 🎨 背景：白色
- 🎨 边框：浅灰色
- 🎨 进度条：蓝色渐变
- 🎨 强调色：蓝色

---

## 🚀 常见使用场景

### 场景 1: AI 代码助手

```tsx
<ContextStatusBarPro
  theme="neon"
  showDiskUsage={true}
  showStats={true}
/>
```

**适用场景**：开发者工具、代码编辑器、AI编程助手

### 场景 2: 数据分析平台

```tsx
<ContextStatusBarPro
  theme="minimal"
  showStats={false}
/>
```

**适用场景**：数据密集型应用、数据分析工具

### 场景 3: 实时协作工具

```tsx
<ContextStatusBarPro
  theme="cyber"
  showQuickActions={true}
  onToggle={handleToggle}
/>
```

**适用场景**：团队协作平台、多人实时编辑工具

### 场景 4: 系统监控仪表板

```tsx
<ContextStatusBarPro
  theme="minimal"
  showDiskUsage={true}
  showRefresh={true}
/>
```

**适用场景**：系统监控、管理仪表板、运维工具

---

## 💡 最佳实践

1. **更新频率**
   ```tsx
   // 建议 2-5 秒
   <ContextStatusBarPro updateInterval={2000} />
   ```

2. **主题持久化**
   ```tsx
   // 使用 localStorage 保存主题
   const savedTheme = localStorage.getItem('theme') || 'cyber';
   <ContextStatusBarPro theme={savedTheme} />
   ```

3. **响应式设计**
   ```tsx
   // 在移动设备上调整
   <ContextStatusBarPro className="md:hidden" />
   ```

4. **性能优化**
   ```tsx
   // 避免频繁更新
   useEffect(() => {
     const interval = setInterval(updateData, 3000);
     return () => clearInterval(interval);
   }, []);
   ```

---

## 🎓 技术细节

### 组件结构

```
ContextStatusBarPro
├── 主状态栏
│   ├── 文件信息（左侧）
│   ├── 进度条（中间）
│   └── 统计信息（右侧）
│
└── 配置面板（展开时显示）
    ├── 主题选择
    ├── 选项开关
    ├── Token 限制
    └── 更新频率
```

### 数据流向

```
用户操作 → 数据更新 → 状态栏刷新 → 用户看到变化
   ↑                                     ↓
   └──────────────── 自动更新 ←─────────┘
```

### 核心特性

- ✅ **自动更新**：基于 setInterval 的实时刷新
- ✅ **平滑动画**：CSS transition 实现流畅过渡
- ✅ **脉冲效果**：使用 animate-pulse 模拟实时状态
- ✅ **主题切换**：三套完整主题一键切换
- ✅ **配置面板**：可展开查看详细配置
- ✅ **响应式设计**：完美适配各种屏幕尺寸

---

## 🔧 调试技巧

### 查看更新状态

```tsx
<ContextStatusBarPro
  onRefresh={() => console.log('刷新数据')}
  onToggle={() => console.log('切换面板')}
  onThemeChange={(theme) => console.log('切换主题:', theme)}
/>
```

### 自定义数据源

```tsx
const [stats, setStats] = useState({
  fileContext: 45,
  modelContext: 72,
  tokensUsed: 45678,
  totalTokens: 128000,
});

// 从 API 获取数据
useEffect(() => {
  fetch('/api/context-stats')
    .then(res => res.json())
    .then(data => setStats(data));
}, []);

// 传递给组件
<ContextStatusBarPro {...stats} />
```

---

## 📞 获取帮助

- 📖 查看完整文档：[CONTEXT_STATUSBAR_GUIDE.md](./CONTEXT_STATUSBAR_GUIDE.md)
- 💡 查看集成示例：[CONTEXT_INTEGRATION_EXAMPLES.md](./CONTEXT_INTEGRATION_EXAMPLES.md)
- 🎬 查看演示：http://localhost:3000/context-demo-pro
- 🐛 提交问题：GitHub Issues

---

## 🎉 开始使用

```bash
# 1. 安装依赖
npm install clsx lucide-react

# 2. 导入组件
import ContextStatusBarPro from '@/components/ContextStatusBarPro';

# 3. 添加到页面
<ContextStatusBarPro theme="cyber" />

# 4. 运行查看效果
npm run dev
```

**访问演示页面查看效果：** http://localhost:3000/context-demo-pro

**祝你使用愉快！** 🚀
