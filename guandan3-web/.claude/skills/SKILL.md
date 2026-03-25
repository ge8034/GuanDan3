---
name: guandan3-web-patterns
description: 掼蛋3 Web 项目代码模式分析
version: 1.0.0
source: local-git-analysis
analyzed_commits: 34
---

# 掼蛋3 Web 项目代码模式

## 项目概述

- **项目名称**: guandan3-web (掼蛋 3 / 斗地主 3)
- **技术栈**: Next.js 16, React 19, TypeScript 5, Supabase, Tailwind CSS 4
- **架构**: 实时多人扑克牌游戏，支持 1v3 AI 和 4 人对战模式

## 提交消息约定

### 历史演变（两层约定式提交）

**早期阶段**（前 15 次提交）：标准约定式提交
```
feat: add Supabase deployment support with Vercel integration
fix: resolve encoding issues in deploy-production.ps1 script
docs: add final deployment checklist
feat(multi-agent): implement multi-agent system and integrate with room AI
chore: trigger ci again
```

**当前阶段**（后 19 次提交）：中文描述式提交
```
修复数据库表字段对齐 - uid改为pid
修复SSR兼容性问题 - 安全检查localStorage访问
更新测试结果日志 - 记录最新游戏场景测试数据
项目进度更新和代码质量优化
```

### 提交模式统计

| 类型 | 约定式提交 | 中文提交 | 总计 |
|------|-----------|---------|------|
| 修复 bug | 6 次 (fix:) | 10 次 (修复) | 16 |
| 新功能 | 4 次 (feat:) | 0 次 | 4 |
| 文档 | 3 次 (docs:) | 1 次 (更新) | 4 |
| 杂项 | 3 次 (chore:) | 1 次 (项目) | 4 |
| 重构 | 1 次 | 0 次 | 1 |
| CI/CD | 2 次 (ci:) | 0 次 | 2 |

## 代码架构

### 目录结构

```
src/
├── app/                          # Next.js App Router
│   ├── api/                      # API 路由
│   │   ├── health/               # 健康检查
│   │   ├── monitoring/           # 监控端点
│   │   └── rooms/                # 房间 API
│   ├── room/[roomId]/            # 游戏房间（动态路由）
│   ├── lobby/                    # 对战大厅
│   ├── game/[gameId]/            # 游戏页面
│   ├── chat/                     # 聊天
│   ├── replay/[shareCode]/       # 回放
│   └── invite/[inviteCode]/      # 邀请
├── components/                   # 共享组件
│   ├── 3d/                       # 3D 渲染组件
│   ├── animations/               # 动画组件
│   ├── backgrounds/              # 背景组件
│   ├── icons/                    # 图标组件
│   ├── monitoring/               # 监控组件
│   └── admin/                    # 管理组件
├── lib/                          # 核心库
│   ├── game/                     # 游戏逻辑
│   │   ├── rules.ts              # 游戏规则
│   │   ├── ai.ts                 # AI 逻辑
│   │   └── room/                 # 房间逻辑
│   ├── store/                    # Zustand 状态管理
│   │   ├── game.ts               # 游戏状态
│   │   └── room.ts               # 房间状态
│   ├── services/                 # 服务层
│   ├── hooks/                    # 自定义 Hooks
│   ├── supabase/                 # Supabase 客户端
│   └── utils/                    # 工具函数
└── test/                         # 测试文件
    ├── unit/                     # 单元测试
    └── integration/              # 集成测试

tests/e2e/                        # E2E 测试（Playwright）
supabase/migrations/              # 数据库迁移
```

### 文件命名约定

| 类型 | 约定 | 示例 |
|------|------|------|
| React 组件 | PascalCase.tsx | `GameOverOverlay.tsx` |
| 工具函数 | camelCase.ts | `api-optimization.ts` |
| Hooks | use*.ts | `useGameStats.ts` |
| 类型文件 | *.types.ts | `game.types.ts` |
| 测试文件 | *.test.ts | `rules.test.ts` |
| E2E 测试 | *.spec.ts | `room-overlay.spec.ts` |
| 懒加载组件 | *.lazy.tsx | `AIStatusPanel.lazy.tsx` |

### 核心模块依赖关系

```
game.ts (游戏状态) ←→ room.ts (房间状态)
    ↓                    ↓
rules.ts (规则)    selectors.ts (选择器)
    ↓                    ↓
ai.ts (AI)        client.ts (Supabase)
    ↓                    ↓
hooks/            services/
```

## 常见工作流程

### 1. 修复数据库相关 bug

**高频模式**（16 次提交中的 8 次）

典型的变更文件集：
- `supabase/migrations/*.sql`
- `src/lib/store/game.ts`
- `src/lib/store/room.ts`
- `src/lib/supabase/client.ts`

**常见模式**：
```bash
# 1. 修改数据库 schema
vim supabase/migrations/XXX_fix_field.sql

# 2. 更新类型定义
vim src/lib/store/game.ts

# 3. 更新查询逻辑
vim src/lib/supabase/client.ts
```

### 2. 修复 React 组件问题

**典型变更文件集**：
- `src/app/room/[roomId]/page.tsx`
- `src/components/**/*.tsx`
- `src/lib/hooks/use*.ts`

**常见问题类型**：
- SSR 兼容性（localStorage 访问）
- Hydration 不匹配
- 类型安全
- 组件懒加载

### 3. 更新测试

**变更文件集**：
- `tests/e2e/*.spec.ts`
- `test-results/*.json`

### 4. 性能优化

**变更文件集**：
- `src/lib/supabase/optimized-client.ts`
- `src/lib/utils/api-optimization.ts`
- `src/components/monitoring/*.tsx`

## 测试策略

### 测试框架

| 类型 | 框架 | 位置 |
|------|------|------|
| E2E | Playwright | `tests/e2e/*.spec.ts` |
| 单元测试 | Vitest | `src/test/unit/*.test.ts` |
| 集成测试 | Vitest | `src/test/integration/` |

### E2E 测试命名模式

```
complete-full-game.spec.ts      # 完整游戏流程
game-flow.spec.ts               # 游戏流程
lobby-core.spec.ts              # 大厅核心功能
room-overlay.spec.ts            # 房间覆盖层
perf-baseline.spec.ts           # 性能基准
connection-sync.spec.ts         # 连接同步
edge-cases.spec.ts              # 边界情况
```

### 测试结果存储

```
test-results/
├── full-scenario-log.json      # 完整场景日志
├── game-room-state.png         # 房间状态截图
└── member-sync-diagnosis.json  # 成员同步诊断
```

## 代码质量模式

### 高频变更文件（Top 10）

| 文件 | 变更次数 | 说明 |
|------|---------|------|
| `game.ts` | 8 | 游戏状态管理核心 |
| `room.ts` | 6 | 房间状态管理 |
| `client.ts` | 6 | Supabase 客户端 |
| `page.tsx` (room) | 6 | 房间页面主入口 |
| `stats-collection.ts` | 5 | 统计收集服务 |
| `ci.yml` | 5 | CI 配置 |

### 常见问题修复模式

1. **数据库字段对齐** → 修改 migrations + store 类型
2. **SSR 兼容性** → 添加 localStorage 安全检查
3. **类型安全** → 更新 TypeScript 类型定义
4. **API 404 错误** → 修复查询路径或添加缺失表

## 开发约定总结

### 命名约定
- 组件：PascalCase.tsx
- 工具：camelCase.ts
- 常量：UPPER_SNAKE_CASE
- Hooks：use*.ts

### 文件组织
- 按功能分组（game/room/monitoring）
- 每个模块包含 types/逻辑/测试
- 共享代码放入 lib/

### 状态管理
- Zustand store 按域分离
- 选择器模式用于数据访问
- 乐观更新 + 实时同步

### 错误处理
- API 错误统一处理
- 用户友好的错误提示
- 详细的错误日志记录

### 性能考虑
- 组件懒加载（*.lazy.tsx）
- Supabase 客户端优化
- 监控和性能追踪
