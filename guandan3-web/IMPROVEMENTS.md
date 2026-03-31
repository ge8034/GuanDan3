# 项目改进建议

本文档记录了代码审查中发现的可选改进项，按优先级排序。

---

## 🔴 高优先级（需要立即处理）

### SEC-001: 轮换 SUPABASE_SERVICE_ROLE_KEY

**状态**: ✅ 无需操作 (2026-03-31)

**评估结果**: 无密钥泄露风险，service_role 密钥未在代码或日志中暴露

**安全检查**:
- `.env.local` 已在 `.gitignore` 中，不会被提交
- 代码中未硬编码 service_role 密钥
- 无日志泄露风险

---

## 🟡 中优先级（建议尽快处理）

### ARCH-001: 拆分 RoomPage 组件

**状态**: ✅ 已完成 (2026-03-31)

**完成内容**:
- 创建 5 个专用 hooks (useRoomGameState, useRoomAnimations, useRoomHandlers, useRoomLocal, useMemoizedPlayerAvatars)
- 创建 3 个子组件 (PlayerSeatsGrid, MyHandSection, RoomOverlaysContainer)
- 主组件从 785 行减少到约 400 行
- 所有类型安全问题已修复

**收益**: 更好的代码组织和可维护性

---

### CODE-001: 清理未使用的导入

**状态**: ✅ 已完成 (2026-03-31)

**结果**: ESLint 报告 0 处未使用导入

---

### PERF-003: 状态管理优化

**状态**: ✅ 已完成 (2026-03-31)

**完成内容**:
- 在 useRoomGameState 中使用 useShallow
- 优化 GamePauseResume 组件
- 优化 GameHintsPanel 组件
- 优化 useGameStats hook

**收益**: 减少不必要的组件重渲染

---

### PERF-001: 优化图片加载

**状态**: ✅ 不适用 (2026-03-31)

**分析结果**: 项目使用 DOM/CSS 渲染游戏卡牌，而非图片文件。已存在 `ResourceOptimizer` 提供资源预加载和性能监控功能。

**完成内容**:
- 修复 layout.tsx 中 React 规则违规（渲染期间调用函数）
- 创建 PerformanceSetup 客户端组件处理性能初始化

---

### TEST-001: 补充 E2E 测试覆盖

**状态**: ✅ 已覆盖 (2026-03-31)

**分析结果**: 现有 E2E 测试已覆盖所有关键场景

**完成内容**:
- `connection-sync.spec.ts` - 断线重连恢复测试
- `pvp-finish.spec.ts` - 游戏结束流程和结算测试
- `edge-cases.spec.ts` - 并发操作和边缘情况测试
- 共 30 个 E2E 测试文件覆盖核心用户流程

**测试文件列表**:
- 完整游戏流程: `complete-game-iteration.spec.ts`, `full-gameplay.spec.ts`
- 练习模式: `complete-practice-game.spec.ts`
- PVP 对战: `pvp-game.spec.ts`, `pvp-finish.spec.ts`
- 连接稳定性: `connection-sync.spec.ts`, `offline-indicator.spec.ts`
- 边缘情况: `edge-cases.spec.ts`, `reliability.spec.ts`
- UI 测试: `game-ui.spec.ts`, `room-overlay.spec.ts`

---

## 🟢 低优先级（可以延后处理）

### DEPS-001: 更新依赖包

**可更新包**:
- `eslint`: 9.39.4 → 10.1.0 (大版本)
- `lucide-react`: 0.577.0 → 1.7.0 (大版本)
- `typescript`: 5.9.3 → 6.0.2 (大版本)

**注意**: 大版本更新需要充分测试

**预计时间**: 2-3 小时

---

### CODE-001: 清理未使用的导入

**问题**: ESLint 报告约 15 处未使用导入

**建议**: 运行 `eslint --fix` 自动修复

**预计时间**: 10 分钟

---

### DOCS-001: 完善 API 文档

**状态**: 🟡 进行中 (2026-03-31)

**已完成** (~21/101):
- ✅ src/lib/utils/card-utils.ts - 卡牌工具函数
- ✅ src/lib/utils/throttle.ts - 节流函数
- ✅ src/lib/utils/supabaseErrors.ts - 错误映射工具
- ✅ src/lib/utils/ensureAuthed.ts - 认证确保工具
- ✅ src/lib/utils/index.ts - 工具函数汇总
- ✅ src/lib/utils/lobby.ts - 大厅工具函数
- ✅ src/lib/utils/hand-analysis.ts - 手牌分析工具
- ✅ src/lib/hooks/useToast.tsx - Toast 通知 Hook
- ✅ src/lib/hooks/useSound.ts - 音效播放 Hook
- ✅ src/lib/hooks/useAuth.ts - 认证状态 Hook
- ✅ src/lib/hooks/useGameStats.ts - 游戏统计 Hook
- ✅ src/lib/hooks/useChat.ts - 聊天室 Hook
- ✅ src/lib/store/auth.ts - 认证状态 Store
- ✅ src/lib/supabase/client.ts - Supabase 客户端配置
- ✅ src/lib/performance/resource-optimizer.ts - 资源优化器
- ✅ src/lib/game/rules.ts - 游戏规则核心模块
- ✅ src/lib/api/chat.ts - 私聊 API (9个函数)
- ✅ src/lib/api/friends.ts - 好友系统 API (11个函数)
- ✅ src/lib/game/ai-utils.ts - AI 工具函数 (7个函数)
- ✅ src/lib/game/ai-types.ts - AI 类型定义

**待完成**: 约 80 个文件

**预计时间**: 剩余约 3-4 小时

---

## 🔵 性能优化（已详细分析）

### PERF-002: RoomPage 组件拆分

**状态**: ✅ 已完成 (2026-03-31)

详见 ARCH-001。

**详细方案**: 见 `PERFORMANCE_OPTIMIZATION.md`

**预计时间**: 3-4 小时

---

### PERF-003: 3D 渲染性能优化

**状态**: 🟡 中优先级 - 已有详细分析

**详细方案**: 见 `PERFORMANCE_OPTIMIZATION.md`

**预计时间**: 2-3 小时

---

### PERF-004: 状态管理优化

**状态**: 🟡 中优先级 - 已有详细分析

**详细方案**: 见 `PERFORMANCE_OPTIMIZATION.md`

**预计时间**: 2-3 小时

---

### PERF-005: 实现虚拟滚动（已降级）

**场景**: 房间列表可能很长

**说明**: 当前项目已使用代码分割和懒加载
**优先级**: 降至低优先级

**预计时间**: 1-2 小时

---

### PERF-006: 添加 Service Worker

**状态**: ✅ 已完成 (2026-03-31)

**完成内容**:
- 创建 PWA 组件模块 (`src/components/pwa/`)
  - `PWAProvider.tsx` - PWA 上下文提供者
  - `OfflineIndicator.tsx` - 离线状态指示器
  - `PWAInstallPrompt.tsx` - PWA 安装提示组件
  - `ServiceWorkerStatus.tsx` - Service Worker 状态监控
  - `useOnlineStatus.ts` - 在线状态 Hook
  - `usePWAInstall.ts` - PWA 安装 Hook
- 集成到 `layout.tsx` - 全局启用 PWA 功能
- 添加 CSS 动画支持 PWA 组件过渡效果
- 离线提示和更新横幅

**收益**:
- 离线状态下用户友好的提示
- PWA 安装引导提升用户留存
- 自动检测应用更新并提示刷新
- 使用 next-pwa 自动缓存静态资源

**文件**:
- `src/components/pwa/index.ts` - 统一导出
- `src/components/pwa/*.tsx` - 6 个 PWA 组件
- `src/app/globals.css` - 添加 PWA 动画样式

---

### PERF-004: 数据库优化

**状态**: ✅ 已完成 (2026-03-31)

**完成内容**:
- 创建优化的 RPC 函数 `get_room_with_members_optimized`
  - 一次性获取房间和成员数据，修复 N+1 查询
  - fetchRoom 从 2 次查询减少到 1 次 RPC 调用
- 添加覆盖索引优化常用查询路径：
  - `idx_room_members_room_seat_online` - 优化成员查询
  - `idx_rooms_id_status` - 优化房间查询
  - `idx_room_members_uid_online_last_seen` - 优化 heartbeat 查询
- 创建性能监控函数 `check_missing_indexes`

**收益**:
- 减少数据库往返次数
- 数据库层面完成过滤，减少数据传输
- 索引优化提升查询性能

---

## 📊 优先级矩阵

```
高影响力 + 低投入:
- SEC-001: 密钥轮换
- CODE-001: 清理未使用导入

高影响力 + 高投入:
- ARCH-001: 组件拆分
- TEST-001: E2E 补充
- PERF-002: 虚拟滚动

低影响力 + 低投入:
- DEPS-001: 依赖更新
- PERF-003: Service Worker
```

---

## 🎯 建议的实施顺序

### 第一阶段（安全优先）
1. SEC-001: 轮换密钥 ✅ (手动操作)

### 第二阶段（代码质量）
2. CODE-001: 清理未使用导入
3. DEPS-001: 更新依赖包

### 第三阶段（架构改进）
4. ARCH-001: 拆分 RoomPage
5. PERF-001: 优化图片加载

### 第四阶段（测试完善）
6. TEST-001: 补充 E2E 测试

### 第五阶段（性能优化）
7. PERF-002: 虚拟滚动
8. PERF-003: Service Worker
9. PERF-004: 数据库优化

---

## 📝 备注

- 所有时间估算基于熟悉代码库的开发者
- 建议每次只处理一个改进项
- 完成后更新本文档状态
- 每个改进项应该单独提交 PR

---

## 🎖️ 测试质量改进 (2026-03-31)

### TEST-002: 自动测试循环 - 100% 通过率

**状态**: ✅ 已完成 (2026-03-31)

**完成内容**:
- 创建自动测试循环脚本 (`scripts/auto-test-loop.js`)
- 执行 5 轮迭代修复
- 修复所有 521 个测试用例

**修复的问题**:
1. **AI 策略评分系统** - 大值牌（Joker、级牌）评分算法优化
2. **测试 Mock 配置** - supabase.rpc mock 修复
3. **游戏规则** - 炸弹值、顺子识别、飞机识别
4. **AI 决策机制** - 支援出牌逻辑完善

**最终结果**:
- 测试文件通过率: 100% (34/34)
- 测试用例通过率: 100% (521/521)
- 详细报告: `TEST_FIX_REPORT.md`

**文件修改**:
- `src/lib/game/ai-strategy.ts` - AI 评分算法优化
- `src/lib/game/rules.ts` - 游戏规则修复
- `src/test/unit/store/room.test.ts` - Mock 配置修复
- `src/test/integration/room-management-flow.test.ts` - 集成测试修复

---

**最后更新**: 2026-03-31
**文档版本**: 1.1
