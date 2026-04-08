# Lobby 页面 UI/UX 审核报告

**审核日期**: 2026-04-07
**审核标准**: Impeccable Frontend Design Principles
**页面**: `/src/app/lobby/page.tsx`

---

## 执行摘要

| 类别 | 评分 | 状态 |
|------|------|------|
| 排版 | C+ | 需要改进 |
| 空间设计 | C+ | 需要改进 |
| 动效设计 | B- | 基本符合 |
| 交互设计 | B+ | 良好 |
| 颜色对比度 | A | 优秀 |

---

## 1. 排版问题 (Priority: HIGH)

### 1.1 缺少模块化比例系统

**当前问题**:
```tsx
<h1 className="text-3xl md:text-4xl">对战大厅</h1>        // 30px/36px
<h3 className="text-lg md:text-xl">...</h3>               // 18px/20px
<span className="text-sm">...</span>                      // 14px
<span className="text-xs">...</span>                      // 12px
```

**问题**: 字体大小过于接近，没有明确的层次对比。

**建议修复**:
```tsx
// 使用模块化比例系统 (1.25 比例)
<h1 className="text-2xl md:text-4xl">对战大厅</h1>        // 24px/36px - xl
<h3 className="text-base md:text-xl">...</h3>             // 16px/20px - lg/base
<span className="text-sm">...</span>                      // 14px - sm
<span className="text-xs">...</span>                      // 12px - xs
```

### 1.2 缺少行高控制

**当前问题**: 正文文本没有明确设置行高。

**建议修复**:
```css
/* 添加到 globals.css */
.lobby-body {
  line-height: 1.6; /* 16px × 1.6 = 25.6px，接近 24px 垂直节奏 */
}

/* 深色背景增加行高 */
.lobby-dark-text {
  line-height: 1.7; /* 增加可读性 */
}
```

### 1.3 缺少行长限制

**当前问题**: 长文本没有限制最大宽度。

**建议修复**:
```tsx
<div className="max-w-[65ch]">...</div>  /* 约 65 个字符 */
```

---

## 2. 空间设计问题 (Priority: HIGH)

### 2.1 间距不一致

**当前问题**:
```tsx
className="p-4"     // 16px
className="p-5"     // 20px ❌ 不在 4pt 系统中
className="p-8"     // 32px
className="gap-3"   // 12px
className="gap-4"   // 16px
className="gap-6"   // 24px
```

**问题**: `p-5` (20px) 和 `gap-3` (12px) 不在标准的 4pt 系统中 (4, 8, 12, 16, 24, 32...)

**建议修复**:
```tsx
// 统一使用 4pt 系统
className="p-4"     // 16px
className="p-6"     // 24px (替代 p-5)
className="p-8"     // 32px
className="gap-3"   // 12px ✓
className="gap-4"   // 16px ✓
className="gap-6"   // 24px ✓
```

### 2.2 使用 margin 而非 gap

**当前问题**:
```tsx
<div className="flex flex-col gap-4 md:gap-6 mb-8">
```

**建议**: 保持 `gap` 用于同级间距（已正确使用）。

### 2.3 卡片嵌套

**当前问题**: 房间卡片内部有多层嵌套结构。

**建议**: 简化内部层次，使用间距和分隔线而非过多嵌套。

---

## 3. 动效设计问题 (Priority: MEDIUM)

### 3.1 过渡时间超过推荐值

**当前问题**:
```tsx
className="transition-all duration-300"  // 300ms
```

**建议**:
```tsx
className="transition-all duration-200"  // 200ms - 状态变化的标准
```

### 3.2 ScaleIn 可能导致布局偏移

**当前问题**: `ScaleIn` 组件使用 `scale` 变换，可能导致布局偏移。

**建议**: 使用 `FadeIn` 替代或确保 ScaleIn 不影响文档流。

### 3.3 缺少 reduced-motion 支持

**建议**:
```css
@media (prefers-reduced-motion: reduce) {
  .lobby-card {
    transition: opacity 0.2s ease-out;
  }
}
```

---

## 4. 交互设计问题 (Priority: LOW)

### 4.1 复选框标签可点击区域

**当前**: 良好 - 整个 label 可点击

### 4.2 触摸目标

**当前**: 良好 - 按钮已使用 `min-h-[44px]`

### 4.3 焦点状态

**当前**: 良好 - 输入框有 `focus:ring-accent-gold`

---

## 5. 颜色对比度 (PASS)

**当前状态**: 所有颜色对比度符合 WCAG AA 标准
- 深色模式: 14.07:1
- 浅色模式: 13.79:1

**无改进需求**

---

## 优先修复清单

| 优先级 | 问题 | 影响 | 工作量 |
|--------|------|------|--------|
| P0 | 统一间距系统 (移除 p-5) | 视觉一致性 | 低 |
| P0 | 修正过渡时间 (300ms→200ms) | 性能/体验 | 低 |
| P1 | 实现模块化字体比例 | 层次清晰度 | 中 |
| P1 | 添加行高控制 | 可读性 | 低 |
| P2 | 添加 reduced-motion 支持 | 无障碍 | 低 |
| P2 | 限制长文本宽度 | 可读性 | 低 |

---

## 建议的 Design Tokens

```css
:root {
  /* 间距系统 - 4pt 基数 */
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-6: 1.5rem;   /* 24px */
  --space-8: 2rem;     /* 32px */

  /* 字体大小 - 模块化比例 (1.25) */
  --text-xs: 0.75rem;   /* 12px */
  --text-sm: 0.875rem;  /* 14px */
  --text-base: 1rem;    /* 16px */
  --text-lg: 1.25rem;   /* 20px */
  --text-xl: 1.5rem;    /* 24px */
  --text-2xl: 2rem;     /* 32px */

  /* 过渡时间 */
  --duration-fast: 100ms;
  --duration-base: 200ms;
  --duration-slow: 300ms;

  /* 缓动函数 */
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
}
```
