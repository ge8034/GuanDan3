---
name: UI重构组件引用标准
description: 记住2026-04-08时的页面样式作为组件引用标准
type: reference
---

# UI 重构组件引用标准

## 基准日期
2026-04-08

## 基准页面状态

### Rules 页面 (`/rules`)
- **样式方式**: 内联样式对象 (`cardStyle`, `headingStyle`, `textStyle`)
- **组件**: 自定义组件，使用 lucide-react 图标
- **特点**: 使用 `SimpleEnvironmentBackground` 背景，左侧导航 + 右侧内容布局

### 组件引用规范

**设计系统组件路径**: `@/design-system/components/atoms/`
- Button
- Avatar
- Badge
- Card
- Input
- Modal

**共享组件路径**: `@/components/`
- SimpleEnvironmentBackground (背景组件)
- ChatBox (聊天框)

## 工作流程要求

1. **组件引用**: 修改页面时优先使用 `@/design-system/components/atoms/` 中的组件
2. **阶段性展示**: 每次修改后需要在浏览器中展示效果 (http://localhost:3000)
3. **样式一致性**: 保持与当前基准页面一致的视觉风格

## 注意事项

- Rules 页面保持内联样式，不使用 Tailwind CSS 类名
- 其他页面 (Home, Lobby, Friends, Profile 等) 使用设计系统组件
- 每次修改后提醒用户在浏览器中查看效果
