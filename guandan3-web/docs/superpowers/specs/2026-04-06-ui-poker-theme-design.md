# UI设计规范：经典深绿牌桌主题

> **日期**: 2026-04-06
> **版本**: 1.0.0
> **状态**: 已批准
> **设计师**: Claude (协助用户设计)

---

## 1. 设计概述

### 1.1 设计目标

将现有的富春山居图（水墨风格）主题转换为**专业扑克风格**，提升整体美观度，解决以下问题：

- 整体视觉混乱
- 色彩对比度不足
- 细节不够精致
- 缺乏渲染效果（阴影、深度、质感）
- 元素重叠、布局不美观

### 1.2 设计风格

**方案A：经典深绿牌桌**
- 深绿色渐变背景，类似真实赌场牌桌
- 白色高对比卡牌
- 金色装饰点缀
- 专业感的扑克游戏体验

---

## 2. 配色方案

### 2.1 主色调

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 牌桌背景渐变 | `linear-gradient(145deg, #1a472a, #0d2818)` | 深绿渐变，主背景 |
| 牌桌背景亮色 | `#1a472a` | 亮部绿色 |
| 牌桌背景暗色 | `#0d2818` | 暗部绿色 |
| 边框色 | `#2d5a3d` | 中绿色边框 |

### 2.2 卡牌样式（真实扑克牌）

#### 颜色规格

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 卡牌背景 | `#ffffff` | 纯白背景 |
| 卡牌渐变 | `linear-gradient(145deg, #ffffff, #f5f5f5)` | 微妙渐变 |
| 黑桃/梅花文字 | `#1f2937` | 深灰黑色 |
| 红心/方片文字 | `#dc2626` | 鲜红色 |
| 卡牌背面蓝色 | `linear-gradient(145deg, #1e40af, #1e3a8a)` | 经典蓝背面 |
| 卡牌背面红色 | `linear-gradient(145deg, #991b1b, #7f1d1d)` | 经典红背面 |

#### 布局结构

真实扑克牌采用经典的三段式布局：

```
┌─────────────────────┐
│ A ♠           ♠ A │  ← 角落数字+符号（右下旋转180°）
│                     │
│         ♠          │  ← 中央大符号
│                     │
│                     │
│ ♠ A           A ♠ │  ← 右下角（旋转180°）
└─────────────────────┘
```

| 区域 | 位置 | 内容 | 尺寸（大卡牌） |
|------|------|------|----------------|
| 左上角 | top: 5px, left: 5px | 数字 + 小符号 | 数字 14-16px, 符号 10-12px |
| 中央图案 | 居中 | 大符号或人物图案 | 40-48px 或 50×70px |
| 右下角 | bottom: 5px, right: 5px | 数字 + 小符号（旋转180°） | 同左上角 |

#### 尺寸规格

| 设备类型 | 宽度 | 高度 | 比例 | 圆角 | 内边距 |
|----------|------|------|------|------|--------|
| 桌面端（大） | 80px | 112px | 1:1.4 | 8px | 6px |
| 移动端（中） | 56px | 78px | 1:1.4 | 6px | 4px |
| 小屏（紧凑） | 44px | 62px | 1:1.4 | 4px | 3px |

#### 字体规格

| 元素 | 字体家族 | 字体大小 | 字重 | 颜色 |
|------|----------|----------|------|------|
| 角落数字 | Georgia, Times New Roman, serif | 14-16px | bold | 黑桃/梅花: #1f2937<br>红心/方片: #dc2626 |
| 角落符号 | 同上 | 10-12px | normal | 同上 |
| 中央符号 | 同上 | 40-48px | normal | 同上 |

#### 花色符号

使用 Unicode 标准符号：

| 花色 | 符号 | Unicode | 颜色 |
|------|------|---------|------|
| 黑桃 | ♠ | U+2660 | #1f2937 |
| 红心 | ♥ | U+2665 | #dc2626 |
| 方片 | ♦ | U+2666 | #dc2626 |
| 梅花 | ♣ | U+2663 | #1f2937 |

#### 人头牌规格 (J/Q/K)

人头牌（Jack、Queen、King）需要特殊处理：

| 元素 | 规格 |
|------|------|
| 中央图案 | 50px × 70px 人物肖像 |
| 背景色调 | 黑桃/梅花: 绿色调 (#e8f3e0)<br>红心/方片: 红色调 (#fee2e2) |
| 边框装饰 | 2px 实线边框，颜色与花色匹配 |
| 字母标识 | J/Q/K 清晰显示在角落 |

#### 卡牌背面样式

| 样式 | 规格 |
|------|------|
| 背景渐变 | 蓝色: linear-gradient(145deg, #1e40af, #1e3a8a)<br>红色: linear-gradient(145deg, #991b1b, #7f1d1d) |
| 外边框 | 3px 实线（蓝色: #3b82f6, 红色: #dc2626） |
| 内边框 | 2px 实线（浅色） |
| 中央图案 | 四花色重复图案 "♠♥♦♣" |
| 整体纹理 | 可选添加细微纹理效果 |

#### 手牌重叠规格

当多张卡牌在手牌区域时：

| 状态 | 重叠率 | 说明 |
|------|--------|------|
| 默认 | 60% | 只露出一小部分 |
| 悬停该牌 | 30% | 悬停时展开更多 |
| 选中 | 30% + 上浮12px | 选中时展开并上浮 |

### 2.3 装饰色彩

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 金色装饰 | `#d4af37` | 高亮、边框 |
| 成功状态 | `#4ade80` | 绿色成功提示 |
| 错误状态 | `#f87171` | 红色错误提示 |
| 警告状态 | `#fbbf24` | 黄色警告提示 |
| 信息状态 | `#60a5fa` | 蓝色信息提示 |

### 2.4 中性色

| 用途 | 颜色值 | 说明 |
|------|--------|------|
| 主要文字 | `#e5e7eb` | 浅灰白色 |
| 次要文字 | `#9ca3af` | 中灰色 |
| 禁用文字 | `#4b5563` | 深灰色 |
| 分割线 | `#374151` | 灰色边框 |

---

## 3. 阴影与深度系统

### 3.1 阴影层级

```css
/* 小阴影 - 轻微浮起 */
shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3)

/* 中阴影 - 标准浮起 */
shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5)

/* 大阴影 - 明显浮起 */
shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.7)
```

### 3.2 卡牌效果

| 状态 | 阴影 | 变换 | 边框 |
|------|------|------|------|
| 默认 | `0 4px 12px rgba(0,0,0,0.5)` | none | none |
| 悬停 | `0 12px 28px rgba(0,0,0,0.6)` | `translateY(-8px)` | `2px solid #d4af37` |
| 选中 | `0 12px 28px rgba(0,0,0,0.6)` | `translateY(-8px)` | `2px solid #d4af37` + 发光 |
| 禁用 | `0 2px 6px rgba(0,0,0,0.3)` | none | none + opacity: 0.6 |

---

## 4. 按钮组件规格

### 4.1 尺寸规范

| 尺寸 | padding | font-size | min-height | 触摸目标 |
|------|---------|-----------|------------|----------|
| sm | 6px 12px | 13px | 32px | ✅ 44px+ (移动端) |
| md | 10px 18px | 15px | 40px | ✅ 44px+ (移动端) |
| lg | 14px 24px | 17px | 48px | ✅ 48px+ |
| xl | 18px 32px | 19px | 56px | ✅ 56px+ |

### 4.2 比例计算公式

```css
/* 垂直内边距 */
padding-vertical = font-size × 0.5

/* 水平内边距 */
padding-horizontal = font-size × 1.2

/* 最小高度 */
min-height = font-size × 2 + padding-vertical × 2

/* 按钮宽度（动态）*/
width = auto  /* 让内容撑开，不设置固定宽度 */
```

### 4.3 按钮状态

| 状态 | 背景 | 边框 | 文字 | 阴影 | 变换 |
|------|------|------|------|------|------|
| 默认 | `linear-gradient(145deg, #1a472a, #0d2818)` | `1px solid #2d5a3d` | `#e5e7eb` | `0 4px 10px rgba(0,0,0,0.5)` | none |
| 悬停 | `linear-gradient(145deg, #1e5634, #153020)` | `1px solid #3a7a4f` | `#ffffff` | `0 6px 16px rgba(0,0,0,0.6)` | `translateY(-1px)` |
| 激活 | `linear-gradient(145deg, #153020, #0d1f14)` | `1px solid #2d5a3d` | `#d1d5db` | `0 2px 6px rgba(0,0,0,0.4)` | `translateY(1px)` |
| 禁用 | `linear-gradient(145deg, #1a2a25, #111816)` | `1px solid #1e3a30` | `#4b5563` | `0 2px 4px rgba(0,0,0,0.3)` | none |
| 加载 | 同默认 | 同默认 | 同默认 | 同默认 | 旋转动画 |

### 4.4 文字内容适配

| 文字长度 | 使用尺寸 | padding | font-size |
|----------|----------|---------|-----------|
| 短 (1-2字) | sm | 8px 14px | 14px |
| 中 (3-4字) | md | 10px 18px | 15px |
| 长 (5+字) | md/lg | 12px 20px | 15px |
| 主操作按钮 | xl | 18px 32px | 19px |

---

## 5. 间距规范

### 5.1 基础间距

| 名称 | 值 | 用途 |
|------|-----|------|
| xs | 4px | 紧凑元素间距 |
| sm | 8px | 小组件间距 |
| md | 16px | 标准间距 |
| lg | 24px | 大组件间距 |
| xl | 32px | 页面级间距 |

### 5.2 组件间距

| 组件 | 间距 |
|------|------|
| 卡牌之间 | 4px (紧凑) |
| 手牌区域 | 16px |
| 玩家座位 | 24px |
| 功能按钮组 | 12px |

---

## 6. 动画效果

### 6.1 过渡时长

| 名称 | 值 | 用途 |
|------|-----|------|
| fast | 150ms | 按钮点击 |
| normal | 250ms | 悬停效果 |
| slow | 400ms | 页面切换 |

### 6.2 缓动函数

| 名称 | 值 | 用途 |
|------|-----|------|
| ease-out | `ease-out` | 进入动画 |
| ease-in-out | `ease-in-out` | 过渡效果 |
| bounce | `cubic-bezier(0.34, 1.56, 0.64, 1)` | 弹性效果 |

### 6.3 关键动画

| 动画 | 时长 | 缓动 | 效果 |
|------|------|------|------|
| 出牌 | 300ms | ease-in-out | 滑动 + 淡出 |
| 发牌 | 200ms/张 | ease-out | 逐张飞入，间隔200ms |
| 选中 | 150ms | cubic-bezier(0.34, 1.56, 0.64, 1) | 上浮 + 发光 |
| 悬停 | 150ms | ease-out | 阴影加深 + 轻微上移 |
| 点击 | 100ms | ease-in | 轻微缩小 |

---

## 7. 圆角规范

| 元素 | 圆角值 |
|------|--------|
| 按钮 sm | 6px |
| 按钮 md | 8px |
| 按钮 lg | 10px |
| 按钮 xl | 12px |
| 卡牌 | 6px |
| 模态框 | 12px |
| 输入框 | 8px |

---

## 8. 实施优先级

### P0 - 立即实施
- 配色方案更新（CSS变量、Tailwind配置）
- 阴影系统实现
- 卡牌组件样式更新
- 按钮组件尺寸和样式更新

### P1 - 本周完成
- 游戏房间背景更新
- 覆盖层样式统一
- 动画过渡效果
- 状态反馈样式

### P2 - 后续优化
- 微交互细节
- 特效优化
- 响应式调整

### P3 - 锦上添花
- 主题切换功能
- 个性化设置
- 高级动画效果

---

## 9. 受影响的组件

### 需要更新的组件

| 组件 | 文件路径 | 更改类型 |
|------|----------|----------|
| Button | `src/components/ui/Button/` | 样式更新 |
| PlayingCard | `src/components/game/PlayingCard.tsx` | 样式更新 |
| RoomPage | `src/app/room/[roomId]/page.tsx` | 背景更新 |
| RoomOverlays | `src/app/room/[roomId]/RoomOverlays.tsx` | 样式更新 |
| GameOverOverlay | `src/app/room/[roomId]/GameOverOverlay.tsx` | 样式更新 |
| GamePausedOverlay | `src/app/room/[roomId]/GamePausedOverlay.tsx` | 样式更新 |
| globals.css | `src/app/globals.css` | CSS变量更新 |
| tailwind.config.ts | `tailwind.config.ts` | 主题配置更新 |

### 新增组件

| 组件 | 用途 |
|------|------|
| PokerTableBackground | 专业牌桌背景组件 |
| CardShadow | 卡牌阴影效果组件 |

---

## 10. 技术实现要点

### 10.1 CSS变量更新

在 `globals.css` 中更新：

```css
:root {
  /* 牌桌背景 */
  --poker-table-bg-start: #1a472a;
  --poker-table-bg-end: #0d2818;
  --poker-table-border: #2d5a3d;

  /* 卡牌样式 */
  --card-bg: #ffffff;
  --card-bg-gradient-start: #ffffff;
  --card-bg-gradient-end: #e5e7eb;
  --card-text-black: #1f2937;
  --card-text-red: #dc2626;

  /* 装饰色 */
  --accent-gold: #d4af37;
  --state-success: #4ade80;
  --state-error: #f87171;
  --state-warning: #fbbf24;
  --state-info: #60a5fa;

  /* 阴影 */
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.3);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.7);

  /* 动画时长 */
  --transition-fast: 150ms;
  --transition-normal: 250ms;
  --transition-slow: 400ms;
}
```

### 10.2 Tailwind配置更新

在 `tailwind.config.ts` 中扩展：

```typescript
colors: {
  poker: {
    table: {
      DEFAULT: '#1a472a',
      light: '#1e5634',
      dark: '#0d2818',
      border: '#2d5a3d',
    },
    card: {
      bg: '#ffffff',
      textBlack: '#1f2937',
      textRed: '#dc2626',
    },
  },
  accent: {
    gold: '#d4af37',
    // ... 其他装饰色
  },
  // ... 其他颜色
}
```

### 10.3 组件样式模式

使用 Tailwind 类名组合：

```tsx
// 按钮示例
<button className="
  px-[10px] py-[18px]
  bg-gradient-to-br from-poker-table to-poker-table-dark
  border border-poker-table-border
  rounded-lg
  text-gray-200 text-[15px]
  shadow-[0_4px_10px_rgba(0,0,0,0.5)]
  hover:shadow-[0_6px_16px_rgba(0,0,0,0.6)]
  hover:-translate-y-px
  active:translate-y-px
  transition-all duration-[250ms]
">
  开始游戏
</button>
```

---

## 11. 验收标准

### 11.1 视觉验收

- [ ] 背景为深绿色渐变，无明显断层
- [ ] 卡牌为白色背景，红黑花色分明
- [ ] 卡牌布局符合真实扑克牌（角落数字+符号、中央图案、右下角旋转）
- [ ] 使用衬线字体（Georgia/Times New Roman）
- [ ] 花色符号清晰，使用标准 Unicode 符号
- [ ] 人头牌（J/Q/K）有独特的人物图案
- [ ] 卡牌背面有经典图案和边框
- [ ] 卡牌宽高比约为 1:1.4（标准扑克牌比例）
- [ ] 所有按钮有统一的阴影和悬停效果
- [ ] 选中状态有明显视觉反馈（金色边框+发光）
- [ ] 文字与背景对比度符合 WCAG AA 标准

### 11.2 交互验收

- [ ] 悬停效果流畅（150-250ms）
- [ ] 点击有即时反馈
- [ ] 动画不卡顿（60fps）
- [ ] 触摸目标 ≥44px × 44px（移动端）

### 11.3 兼容性验收

- [ ] Chrome/Edge 最新版
- [ ] Safari 最新版
- [ ] Firefox 最新版
- [ ] 移动端 Safari (iOS)
- [ ] 移动端 Chrome (Android)

---

## 12. 参考资料

- [WCAG 2.1 对比度标准](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [Material Design 按钮规范](https://m3.material.io/components/buttons/specs)
- [Tailwind CSS 默认主题](https://tailwindcss.com/docs/theme)

---

**文档状态**: ✅ 已批准
**下一步**: 编写实施计划
