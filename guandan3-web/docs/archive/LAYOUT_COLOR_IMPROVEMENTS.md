# 组件排版和颜色搭配优化

> **更新日期**: 2026-04-06
> **目的**: 统一视觉风格，优化颜色对比度和组件排版

---

## 🎨 优化内容概览

### 1. 统一背景组件

**问题**: 各页面使用不同的背景组件（CloudMountainBackground），导致poker主题不一致

**修复**: 所有页面统一使用 `SimpleEnvironmentBackground` 组件

| 页面 | 修复前 | 修复后 |
|------|--------|--------|
| 首页 (page.tsx) | SimpleEnvironmentBackground | ✅ 保持 |
| 大厅 (lobby/page.tsx) | CloudMountainBackground | ✅ SimpleEnvironmentBackground |
| 好友 (friends/page.tsx) | CloudMountainBackground | ✅ SimpleEnvironmentBackground |
| 历史 (history/page.tsx) | CloudMountainBackground | ✅ SimpleEnvironmentBackground |
| 个人资料 (profile/page.tsx) | CloudMountainBackground | ✅ SimpleEnvironmentBackground |

---

### 2. 首页优化 (page.tsx)

#### 卡片样式
```tsx
// 修复前：白色卡片，对比度不足
bg-gradient-to-br from-white to-gray-50

// 修复后：增强对比度和层次
bg-gradient-to-br from-white/95 to-gray-100/95 backdrop-blur-sm
shadow-layer-3
border-2 border-poker-table-border
rounded-2xl
```

#### 文字颜色
```tsx
// 修复前
text-gray-300  // 对比度不足

// 修复后
text-gray-200  // 更亮的灰色
text-white     // 纯白文字
gold-accent    // 金色高亮（带光晕）
```

#### 图标尺寸
```tsx
// 修复后：统一使用 lg 尺寸
<LightningIcon size="lg" />
<UserGroupIcon size="lg" />
```

#### 间距优化
```tsx
// 修复前
gap-12 lg:gap-20 2xl:gap-32

// 修复后：更紧凑的间距
gap-8 lg:gap-16
```

---

### 3. 大厅页面优化 (lobby/page.tsx)

#### 头部样式
```tsx
// 修复后：增强品牌视觉
<div className="w-14 h-14 bg-gradient-to-br from-poker-table-light to-poker-table-dark border-2 border-accent-gold/50 rounded-xl">
  <BuildingIcon size="md" className="text-accent-gold" />
</div>
<h1 className="text-3xl md:text-4xl font-bold text-white gold-accent">
  对战大厅
</h1>
```

#### 筛选标签
```tsx
// 修复后：统一的半透明背景
bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg
border border-white/20 hover:border-accent-gold/50
```

#### 房间卡片
```tsx
// 修复后：增强卡片样式
bg-gradient-to-br from-white/95 to-gray-50/95
backdrop-blur-sm border-2 border-poker-table-border
rounded-xl shadow-card hover:shadow-card-hover
```

#### 徽章样式
```tsx
// 修复后：更清晰的类型标识
bg-poker-table/20 text-poker-table-light border border-poker-table-border/50  // 类型徽章
bg-accent-gold/20 text-accent-gold border border-accent-gold/30            // 模式徽章
```

#### 空状态提示
```tsx
// 修复后：更好的空状态视觉
bg-white/10 backdrop-blur-sm rounded-xl border-2 border-dashed border-white/20
```

---

### 4. Modal 组件优化

Modal组件已具备完整的poker主题样式：

```tsx
// 背景遮罩
bg-black/70 backdrop-blur-sm

// 内容区域
bg-gradient-to-br from-poker-table to-poker-table-dark
border-2 border-accent-gold
shadow-[0_8px_24px_rgba(0,0,0,0.8),0_0_0_1px_rgba(212,175,55,0.3)]

// 标题区域
bg-poker-table/30 border-b-2 border-poker-table-border/50
text-accent-gold
```

---

## 🎯 颜色系统对比

### 主要文字颜色

| 用途 | 修复前 | 修复后 |
|------|--------|--------|
| 主要标题 | text-gray-900 | text-white / gold-accent |
| 次要标题 | text-gray-600 | text-gray-200 |
| 正文 | text-gray-600 | text-gray-200 |
| 辅助文字 | text-text-secondary | text-gray-400 |
| 高亮文字 | - | gold-accent (带光晕) |

### 背景颜色

| 元素 | 修复前 | 修复后 |
|------|--------|--------|
| 卡片背景 | from-white to-gray-50 | from-white/95 to-gray-100/95 |
| 半透明卡片 | bg-card/80 | bg-white/95 |
| 筛选标签 | bg-card/60 | bg-white/10 |
| 空状态 | bg-card/60 | bg-white/10 |
| 状态指示器 | bg-yellow-100 | bg-amber-500/20 |

### 边框颜色

| 元素 | 修复前 | 修复后 |
|------|--------|--------|
| 主要边框 | border-border | border-poker-table-border |
| 激活边框 | - | border-accent-gold/30 |
| 虚线边框 | border-dashed border-border | border-dashed border-white/20 |

---

## 📋 使用指南

### 统一的卡片样式模式

```tsx
<div className="bg-gradient-to-br from-white/95 to-gray-100/95 backdrop-blur-sm border-2 border-poker-table-border rounded-xl shadow-card hover:shadow-card-hover transition-all duration-300">
  {/* 内容 */}
</div>
```

### 统一的标签徽章样式

```tsx
{/* 金色高亮徽章 */}
<span className="px-2 py-1 text-xs font-medium rounded-full bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
  模式
</span>

{/* 绿色普通徽章 */}
<span className="px-2 py-1 text-xs font-medium rounded-full bg-poker-table/20 text-poker-table-light border border-poker-table-border/50">
  类型
</span>
```

### 统一的筛选标签样式

```tsx
<label className="flex items-center gap-2 text-sm text-gray-200 select-none bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-lg border border-white/20 hover:border-accent-gold/50 transition-all cursor-pointer">
  <input type="checkbox" className="w-4 h-4 text-accent-gold" />
  标签文字
</label>
```

### 金色高亮文字

```tsx
<h1 className="text-white gold-accent">标题</h1>
<span className="text-accent-gold">重要文字</span>
```

---

## ✅ 验收清单

### 视觉一致性
- [x] 所有页面使用相同的背景组件
- [x] 卡片样式统一（渐变背景、边框、阴影）
- [x] 徽章样式统一（类型、模式）
- [x] 按钮样式统一（使用Button组件）

### 颜色对比度
- [x] 主要文字在深色背景上清晰可读（text-white）
- [x] 次要文字对比度充足（text-gray-200）
- [x] 金色高亮效果明显（gold-accent）
- [x] 卡片在深色背景下对比度良好（white/95）

### 排版布局
- [x] 组件间距统一（gap-6, gap-8）
- [x] 响应式断点一致（md:, lg:）
- [x] 卡片圆角统一（rounded-xl）
- [x] 内边距统一（p-5, p-6）

---

**文档维护**: 随项目更新同步维护
**后续优化**: 根据用户反馈继续调整
