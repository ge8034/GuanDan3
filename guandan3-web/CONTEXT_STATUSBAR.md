# ContextStatusBar 状态栏组件

## 功能特性

- 📊 **实时显示上下文占比**：文件上下文和模型上下文占比
- 🔄 **自动更新**：实时刷新数据，带有脉冲动画效果
- 💾 **Token 统计**：显示已使用和总 token 数量
- ⚡ **磁盘使用率**（增强版）：可选的磁盘空间监控
- 🎨 **赛博朋克风格**：深色背景 + 霓虹色进度条
- 📱 **响应式设计**：自动适应屏幕宽度
- 🎯 **工业实用主义**：清晰的信息层次和可读性

## 安装

无需安装额外依赖，使用项目已有的 `clsx` 和 `lucide-react`：

```bash
# 项目已包含依赖
npm install clsx lucide-react
```

## 基础使用

### 导入组件

```tsx
import ContextStatusBar from '@/components/ContextStatusBar';
```

### 基本用法

```tsx
export default function MyPage() {
  return (
    <div>
      <h1>页面内容</h1>

      {/* 状态栏将固定在页面底部 */}
      <ContextStatusBar
        currentFile="D:\\Learn-Claude\\GuanDan3\\guandan3-web\\src\\app\\page.tsx"
        fileContext={45}
        modelContext={72}
        tokensUsed={45678}
        totalTokens={128000}
      />
    </div>
  );
}
```

## 增强版使用

```tsx
import ContextStatusBarEnhanced from '@/components/ContextStatusBarEnhanced';

export default function EnhancedDemo() {
  return (
    <div className="min-h-screen bg-slate-950">
      {/* 其他页面内容 */}
      <h1>增强版演示</h1>

      {/* 增强版状态栏 */}
      <ContextStatusBarEnhanced
        currentFile="D:\\Learn-Claude\\GuanDan3\\guandan3-web\\src\\components\\MyComponent.tsx"
        fileContext={60}
        modelContext={85}
        tokensUsed={82345}
        totalTokens={125000}
        showRefresh={true}          // 显示刷新按钮
        showDiskUsage={true}        // 显示磁盘使用率
        updateInterval={3000}       // 更新间隔（毫秒）
      />
    </div>
  );
}
```

## 属性说明

### ContextStatusBar

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `className` | `string` | `undefined` | 自定义 CSS 类名 |
| `currentFile` | `string` | `文件路径` | 当前文件路径 |
| `fileContext` | `number` | `0` | 文件上下文占比（0-100） |
| `modelContext` | `number` | `0` | 模型上下文占比（0-100） |
| `tokensUsed` | `number` | `0` | 已使用的 token 数量 |
| `totalTokens` | `number` | `125000` | 总 token 数量 |

### ContextStatusBarEnhanced

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `className` | `string` | `undefined` | 自定义 CSS 类名 |
| `currentFile` | `string` | `默认路径` | 当前文件路径 |
| `fileContext` | `number` | `45` | 文件上下文占比（0-100） |
| `modelContext` | `number` | `72` | 模型上下文占比（0-100） |
| `tokensUsed` | `number` | `45678` | 已使用的 token 数量 |
| `totalTokens` | `number` | `128000` | 总 token 数量 |
| `showRefresh` | `boolean` | `false` | 是否显示刷新按钮 |
| `showDiskUsage` | `boolean` | `false` | 是否显示磁盘使用率 |
| `updateInterval` | `number` | `2000` | 数据更新间隔（毫秒） |

## 样式定制

### 自定义颜色

修改 `src/components/ContextStatusBar.tsx` 中的颜色变量：

```tsx
// 文件上下文颜色
className="bg-gradient-to-r from-emerald-600 to-emerald-400"

// 模型上下文颜色
className="bg-gradient-to-r from-cyan-600 to-cyan-400"
```

### 修改间距和字体

```tsx
// 修改内边距
className="px-4 py-2"  // 改为 px-6 py-3

// 修改字体大小
className="text-xs"  // 改为 text-sm
```

## 演示页面

访问演示页面查看效果：

```bash
npm run dev
```

访问 `http://localhost:3000/context-demo`

## 效果预览

### 基础版

- 简洁的文件路径显示
- 两个彩色的进度条（文件上下文、模型上下文）
- Token 使用统计
- 实时更新指示器

### 增强版

- 额外的磁盘使用率显示
- 手动刷新按钮
- 更灵活的更新间隔配置
- 文件大小显示

## 技术细节

- **响应式布局**：使用 Flexbox 实现自适应布局
- **平滑动画**：CSS transition 实现进度条平滑变化
- **脉冲效果**：使用 animate-pulse 模拟实时更新
- **深色主题**：赛博朋克风格配色方案
- **React 19.2.4**：支持最新的 React 特性
- **TypeScript**：完整的类型定义

## 性能优化

- 使用 `useMemo` 避免不必要的计算
- 动画使用 CSS 而非 JavaScript，减少 CPU 占用
- 精确的时间戳控制更新频率
- 条件渲染减少 DOM 操作

## 注意事项

1. 状态栏固定在页面底部，可能遮挡内容
2. 建议在页面底部留出足够的空间
3. 文件路径过长会自动截断显示
4. 更新间隔建议设置在 1-3 秒之间

## 未来改进

- [ ] 支持自定义颜色主题
- [ ] 添加上下文历史记录
- [ ] 支持多文件上下文显示
- [ ] 添加上下文质量评估
- [ ] 导出为 VS Code 扩展

## License

MIT
