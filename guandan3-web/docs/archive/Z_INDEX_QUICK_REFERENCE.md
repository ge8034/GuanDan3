# Z-index 快速参考指南

## 层级速查表

```
最高优先级
│
├─ 70 CRITICAL_ERROR ────────┤ 紧急错误覆盖层
│                                永远在最顶层
├─ 60 DEBUG_TOGGLE ──────────┤ 调试切换按钮
│                                bottom: 200px, left: 16px
│
├─ 56 ROOM_INVITATION_FLOATING │ 浮动邀请面板
├─ 55 VOICE_CALL_PANEL ───────┤ 语音通话面板
│                                top: 80px, right: 16px
├─ 54 GAME_PAUSED_OVERLAY ────┤ 游戏暂停覆盖层
├─ 52 GAME_OVER_OVERLAY ──────┤ 游戏结束覆盖层
├─ 50 ROOM_OVERLAYS ───────────┤ 房间状态覆盖层
│                                (房间已满、加入确认等)
│
├─ 45 NAVIGATION ─────────────┤ 系统导航栏
│                                top: 0, 横跨全宽
├─ 40 ROOM_HEADER ────────────┤ 房间头部信息
│                                top: 0, 在游戏内
│
├─ 37 AI_DEBUG_PANEL ─────────┤ AI调试面板
│                                bottom: 140px, left: 80px
├─ 36 PERFORMANCE_MONITOR ────┤ 性能监控面板
│                                bottom: 140px, left: 80px
├─ 35 ROOM_INVITATION_BOTTOM ─┤ 底部邀请面板
│                                bottom: 80px, left: 80px
├─ 32 HINTS_PANEL ────────────┤ 游戏提示面板
├─ 30 CHAT_PANEL ─────────────┤ 聊天面板
│
├─ 25 CHAT_INPUT ─────────────┤ 聊天输入框
├─ 22 GAME_CONTROLS ──────────┤ 游戏控制按钮
├─ 20 PLAYER_AVATAR_ACTIVE ───┤ 激活的玩家头像
│
├─ 18 TOAST ──────────────────┤ 提示消息
├─ 15 HAND_AREA ──────────────┤ 手牌区域
├─ 10 PLAYER_AVATAR ───────────┤ 基础玩家头像
│
├─ 5 ANIMATIONS ───────────────┤ 动画效果
├─ 2 GAME_CARDS ───────────────┤ 游戏卡片
├─ 1 TABLE_BACKGROUND ─────────┤ 游戏桌面背景
├─ 0 BASE ─────────────────────┤ 默认内容层
│
最低优先级
```

## 快速决策树

当需要为新 UI 元素设置 z-index 时：

```
是否是错误/警告？
├─ 是 → 使用 Z_INDEX.CRITICAL_ERROR (70) 或 Z_INDEX.TOAST (18)
└─ 否 → 是否是模态覆盖层？
    ├─ 是 → 使用 50-59 范围
    │   ├─ 游戏结束 → Z_INDEX.GAME_OVER_OVERLAY (52)
    │   ├─ 游戏暂停 → Z_INDEX.GAME_PAUSED_OVERLAY (54)
    │   └─ 其他模态 → Z_INDEX.ROOM_OVERLAYS (50)
    └─ 否 → 是否是固定面板？
        ├─ 是 → 使用 30-39 范围
        │   ├─ 聊天相关 → Z_INDEX.CHAT_PANEL (30)
        │   ├─ 调试相关 → Z_INDEX.PERFORMANCE_MONITOR (36)
        │   └─ 其他面板 → 选择合适的值
        └─ 否 → 使用 0-29 范围
            ├─ 游戏内容 → 0-9
            ├─ 玩家相关 → 10-19
            └─ 交互元素 → 20-29
```

## 代码示例

```typescript
import { Z_INDEX, getZIndexClass } from '@/lib/constants/z-index'

// 方式1: 使用 getZIndexClass (推荐用于 className)
<div className={getZIndexClass(Z_INDEX.CHAT_PANEL)}>
  聊天面板
</div>

// 方式2: 直接使用常量值 (推荐用于内联样式)
<div style={{ zIndex: Z_INDEX.CHAT_PANEL }}>
  聊天面板
</div>

// 方式3: 使用预定义的固定位置
import { FIXED_POSITION } from '@/lib/constants/z-index'

<div
  className="fixed"
  style={{
    bottom: `${FIXED_POSITION.BOTTOM_SPACING.MIDDLE}px`,
    left: `${FIXED_POSITION.LEFT_SPACING.SECOND}px`,
  }}
>
  内容
</div>
```

## 注意事项

1. **不要使用硬编码的 z-index 值**，始终使用 `Z_INDEX` 常量
2. **不要使用极端值**（如 `z-[9999]`、`z-[10000]`）
3. **新元素应放在合适的层级范围内**，不要随意插入现有层级之间
4. **固定位置元素应使用 `FIXED_POSITION` 常量**，避免重叠
5. **测试在不同屏幕尺寸下的显示效果**

## 常见场景

### 添加新的聊天相关面板
```typescript
const zIndex = Z_INDEX.CHAT_PANEL  // 30
// 或如果需要更高的优先级
const zIndex = Z_INDEX.CHAT_INPUT  // 25
```

### 添加新的调试/监控面板
```typescript
const zIndex = Z_INDEX.AI_DEBUG_PANEL  // 37
// 或如果需要与其他调试面板同级
const zIndex = Z_INDEX.PERFORMANCE_MONITOR  // 36
```

### 添加新的模态覆盖层
```typescript
const zIndex = Z_INDEX.GAME_OVER_OVERLAY + 1  // 53
// 在游戏结束覆盖层之上
```

### 添加新的游戏动画
```typescript
const zIndex = Z_INDEX.ANIMATIONS  // 5
// 动画在游戏卡片之上，但低于玩家头像
```
