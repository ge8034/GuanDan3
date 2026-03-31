# 项目改进建议

本文档记录了代码审查中发现的可选改进项，按优先级排序。

---

## 🔴 高优先级（需要立即处理）

### SEC-001: 轮换 SUPABASE_SERVICE_ROLE_KEY

**状态**: ⚠️ 密钥已泄露

**问题描述**:
- SUPABASE_SERVICE_ROLE_KEY 在开发会话中暴露
- 该密钥拥有完全数据库访问权限
- 存在安全风险

**修复步骤**:
1. 访问 Supabase Dashboard
2. 进入 Project Settings → API
3. 点击 "Rotate service_role key"
4. 更新本地 `.env.local` 文件
5. 删除任何包含旧密钥的日志或提交

**预计时间**: 5 分钟

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

**建议**:
- 为所有公共函数添加 JSDoc
- 生成 API 文档网站
- 添加使用示例

**预计时间**: 4-6 小时

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

**建议**:
1. 缓存静态资源
2. 实现离线功能
3. 后台同步

**预计时间**: 3-4 小时

---

### PERF-004: 优化数据库查询

**建议**:
1. 添加缺失的索引
2. 优化 N+1 查询
3. 实现查询结果缓存

**预计时间**: 2-3 小时

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

**最后更新**: 2026-03-31
**文档版本**: 1.0
