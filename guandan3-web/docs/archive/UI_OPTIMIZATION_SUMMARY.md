# UI 布局优化总结

> **日期**: 2026-04-06
> **目标**: 解决所有按钮和界面元素的交叉或覆盖问题

---

## 问题分析

### 发现的问题

1. **Z-index 管理混乱**
   - 不同组件使用不一致的 z-index 值
   - 部分组件使用极端值（`z-[9999]`、`z-[10000]`）
   - 没有统一的层级管理系统

2. **固定元素位置重叠**
   - 调试按钮：`fixed bottom-20 left-4`
   - 性能监控面板：`fixed bottom-20 left-20`
   - 这两个元素在水平方向上会重叠

3. **缺少 Z-index 层级标准**
   - 没有明确的层级定义
   - 没有位置偏移标准

### 影响的组件

| 组件 | 原有 z-index | 问题 |
|------|-------------|------|
| 调试按钮 | `z-[9999]` | 极端值，与性能监控冲突 |
| 性能监控 | `z-[9999]` | 极端值，与调试按钮冲突 |
| GameOverOverlay | `z-[10000]` | 极端值 |
| Navigation | `z-50` | 可能与其他元素冲突 |
| RoomHeader | `z-40` | 层级不清晰 |
| RoomOverlays | `z-[50]` | 与 Navigation 同层 |

---

## 解决方案

### 1. 创建统一的 Z-index 管理系统

**文件**: `src/lib/constants/z-index.ts`

```typescript
export const Z_INDEX = {
  // 基础内容层 (0-9)
  BASE: 0,
  TABLE_BACKGROUND: 1,
  GAME_CARDS: 2,
  ANIMATIONS: 5,

  // 覆盖层和提示 (10-19)
  PLAYER_AVATAR: 10,
  HAND_AREA: 15,
  TOAST: 18,

  // 交互元素 (20-29)
  PLAYER_AVATAR_ACTIVE: 20,
  GAME_CONTROLS: 22,
  CHAT_INPUT: 25,

  // 面板和侧边栏 (30-39)
  CHAT_PANEL: 30,
  HINTS_PANEL: 32,
  ROOM_INVITATION_BOTTOM: 35,
  PERFORMANCE_MONITOR: 36,
  AI_DEBUG_PANEL: 37,

  // 顶部导航和控制栏 (40-49)
  ROOM_HEADER: 40,
  NAVIGATION: 45,

  // 模态对话框和重要覆盖层 (50-59)
  ROOM_OVERLAYS: 50,
  GAME_OVER_OVERLAY: 52,
  GAME_PAUSED_OVERLAY: 54,
  VOICE_CALL_PANEL: 55,
  ROOM_INVITATION_FLOATING: 56,

  // 系统级最高优先级 (60+)
  DEBUG_TOGGLE: 60,
  CRITICAL_ERROR: 70,
} as const
```

### 2. 定义固定元素位置标准

```typescript
export const FIXED_POSITION = {
  // 底部元素垂直间距
  BOTTOM_SPACING: {
    LOWEST: 80,    // 聊天/语音
    MIDDLE: 140,   // 性能监控/AI面板
    HIGHEST: 200,  // 调试按钮
  },
  // 左侧元素水平间距
  LEFT_SPACING: {
    FIRST: 16,   // left-4
    SECOND: 80,  // left-20
    THIRD: 144,  // left-36
  },
} as const
```

### 3. 修复的组件

| 组件 | 修改内容 |
|------|---------|
| `Navigation.tsx` | 使用 `Z_INDEX.NAVIGATION` |
| `RoomHeader.tsx` | 使用 `Z_INDEX.ROOM_HEADER` |
| `MyHandSection.tsx` | 手牌区域 `Z_INDEX.HAND_AREA`，头像 `Z_INDEX.PLAYER_AVATAR` |
| `RoomOverlays.tsx` | 使用 `Z_INDEX.ROOM_OVERLAYS` |
| `GameOverOverlay.tsx` | 使用 `Z_INDEX.GAME_OVER_OVERLAY` |
| `GamePausedOverlay.tsx` | 使用 `Z_INDEX.GAME_PAUSED_OVERLAY` |
| `RoomOverlaysContainer.tsx` | 性能监控、语音面板、邀请面板使用对应层级 |
| `page.tsx` | 调试按钮使用 `Z_INDEX.DEBUG_TOGGLE` 和预定义位置 |

---

## 修复效果

### Z-index 层级结构

```
┌─────────────────────────────────────────────────┐
│ 70: CRITICAL_ERROR (紧急错误覆盖层)              │
├─────────────────────────────────────────────────┤
│ 60: DEBUG_TOGGLE (调试按钮)                      │
├─────────────────────────────────────────────────┤
│ 56: ROOM_INVITATION_FLOATING (浮动邀请面板)      │
│ 55: VOICE_CALL_PANEL (语音通话面板)              │
│ 54: GAME_PAUSED_OVERLAY (游戏暂停覆盖层)         │
│ 52: GAME_OVER_OVERLAY (游戏结束覆盖层)           │
│ 50: ROOM_OVERLAYS (房间状态覆盖层)               │
├─────────────────────────────────────────────────┤
│ 45: NAVIGATION (系统导航栏)                      │
│ 40: ROOM_HEADER (房间头部信息栏)                 │
├─────────────────────────────────────────────────┤
│ 37: AI_DEBUG_PANEL (AI调试面板)                  │
│ 36: PERFORMANCE_MONITOR (性能监控面板)           │
│ 35: ROOM_INVITATION_BOTTOM (底部邀请面板)        │
│ 32: HINTS_PANEL (游戏提示面板)                   │
│ 30: CHAT_PANEL (聊天面板)                        │
├─────────────────────────────────────────────────┤
│ 25: CHAT_INPUT (聊天输入框)                      │
│ 22: GAME_CONTROLS (游戏控制按钮)                 │
│ 20: PLAYER_AVATAR_ACTIVE (激活玩家头像)          │
├─────────────────────────────────────────────────┤
│ 18: TOAST (提示信息)                             │
│ 15: HAND_AREA (手牌区域)                         │
│ 10: PLAYER_AVATAR (基础玩家头像)                 │
├─────────────────────────────────────────────────┤
│ 5: ANIMATIONS (动画效果)                         │
│ 2: GAME_CARDS (游戏卡片)                         │
│ 1: TABLE_BACKGROUND (游戏桌面背景)               │
│ 0: BASE (默认内容层)                             │
└─────────────────────────────────────────────────┘
```

### 固定元素位置布局

```
左侧垂直堆叠（从下到上）：
┌──────────────────────────────────────────────┐
│ bottom: 200px (HIGHEST)                      │
│ ┌──────────┐                                  │
│ │ 调试按钮  │ left: 16px (FIRST)              │
│ └──────────┘                                  │
├──────────────────────────────────────────────┤
│ bottom: 140px (MIDDLE)                       │
│ ┌──────────────────┐                          │
│ │ 性能监控/AI面板  │ left: 80px (SECOND)      │
│ └──────────────────┘                          │
├──────────────────────────────────────────────┤
│ bottom: 80px (LOWEST)                        │
│ ┌──────────────────┐                          │
│ │ 聊天/语音/邀请   │ left: 80px (SECOND)      │
│ └──────────────────┘                          │
└──────────────────────────────────────────────┘
```

---

## 使用指南

### 为新组件添加 Z-index

```typescript
import { Z_INDEX, getZIndexClass } from '@/lib/constants/z-index'

// 1. 从常量表中选择合适的层级
const zIndex = Z_INDEX.CHAT_PANEL  // 30

// 2. 使用 getZIndexClass 获取 Tailwind 类名
<div className={getZIndexClass(zIndex)}>
  内容
</div>

// 或者直接使用常量值（用于内联样式）
<div style={{ zIndex: zIndex }}>
  内容
</div>
```

### 添加新的固定位置元素

```typescript
import { FIXED_POSITION } from '@/lib/constants/z-index'

// 底部固定元素
<div
  className="fixed"
  style={{
    bottom: `${FIXED_POSITION.BOTTOM_SPACING.MIDDLE}px`,
    left: `${FIXED_POSITION.LEFT_SPACING.THIRD}px`,
  }}
>
  内容
</div>
```

---

## 检查清单

- [x] 创建统一的 Z-index 管理系统
- [x] 定义固定元素位置标准
- [x] 修复所有覆盖层组件的 z-index
- [x] 修复所有固定位置元素的位置冲突
- [x] 通过 TypeScript 类型检查
- [x] 无新增编译错误

---

## 后续建议

1. **添加触摸目标尺寸检查**
   - 使用 `TOUCH_TARGET.MIN_SIZE` (44px) 作为最小触摸目标
   - 为小按钮添加内边距或外层容器

2. **响应式布局优化**
   - 在小屏幕上隐藏非必要面板
   - 使用折叠面板减少空间占用

3. **无障碍改进**
   - 为所有交互元素添加 `aria-label`
   - 确保键盘导航顺序正确
   - 添加焦点状态样式

4. **动画性能优化**
   - 使用 `transform` 和 `opacity` 进行动画
   - 避免动画 `width`、`height` 等触发布局变化的属性

---

## 相关文件

| 文件 | 说明 |
|------|------|
| `src/lib/constants/z-index.ts` | Z-index 和固定位置常量定义 |
| `src/components/Navigation.tsx` | 系统导航栏 |
| `src/app/room/[roomId]/page.tsx` | 游戏房间主页面 |
| `src/app/room/[roomId]/RoomHeader.tsx` | 房间头部信息栏 |
| `src/app/room/[roomId]/RoomOverlays.tsx` | 房间状态覆盖层 |
| `src/app/room/[roomId]/GameOverOverlay.tsx` | 游戏结束覆盖层 |
| `src/app/room/[roomId]/GamePausedOverlay.tsx` | 游戏暂停覆盖层 |
| `src/app/room/[roomId]/components/RoomOverlaysContainer.tsx` | 覆盖层容器 |
| `src/app/room/[roomId]/components/MyHandSection.tsx` | 手牌区域组件 |
