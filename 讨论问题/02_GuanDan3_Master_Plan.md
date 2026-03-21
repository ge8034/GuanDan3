# GuanDan3 项目开发主计划 (GuanDan3 Master Development Plan)

**文档编号**: GD3-MDP-20260311  
**版本**: v1.0  
**日期**: 2026-03-11  
**状态**: 待审批 (Draft)  
**基线**: 基于 GD2-RCA-20260311 复盘结果

---

## 1. 质量目标与验收标准 (Quality Objectives & Acceptance Criteria)

基于 GuanDan2 的复盘教训，GuanDan3 将实施严格的数字化质量管理。

### 1.1 关键质量指标 (KPIs)
*   **缺陷密度**: ≤ 0.3 / KLOC (每千行代码缺陷数)
*   **性能指标**:
    *   单接口 P99 响应时间: ≤ 200 ms (API 响应)
    *   首屏加载时间 (FCP): ≤ 1.5s (Next.js SSR 优化)
    *   游戏帧率 (FPS): 稳定 60 FPS (Phaser 渲染优化)
*   **需求稳定性**: 需求变更率 ≤ 5% (里程碑内)
*   **测试覆盖率**:
    *   单元测试 (Unit): ≥ 80%
    *   集成测试 (Integration): 核心路径 100%
*   **安全响应**: 高危漏洞修复周期 ≤ 24 小时

### 1.2 架构约束 (Architectural Constraints)
*   **类型安全**: `noImplicitAny: true`，禁止在业务逻辑层使用 `as any`。
*   **目录规范**: 统一使用 `app/` 路由结构，移除 `src/` 冗余目录。
*   **依赖管理**: 禁止直接提交第三方源码（如 `dify/`），必须使用 Docker Compose 或 Git Submodule。

---

## 2. 项目范围与边界 (Scope & Boundaries)

### 2.1 核心范围 (In-Scope)
1.  **GuanDan2 代码重构**: 清理 `src/` 与 `app/` 混用，移除 `dify/` 源码。
2.  **核心服务升级**: 重写 `GameRoomService`，实现真正的 Repository 模式，移除类型逃逸。
3.  **AI 智能体集成**: 通过 API 对接 Dify (Docker 部署版)，实现 AI 托管打牌功能。
4.  **性能优化**: 针对 Phaser 3 游戏引擎的资源加载和内存管理进行优化。

### 2.2 排除范围 (Out-of-Scope)
1.  **Dify 平台本身的二次开发**: 不修改 Dify 源码，仅使用其 API。
2.  **非核心玩法扩展**: 暂不开发锦标赛、好友系统等社交功能（留待 GuanDan4）。

---

## 3. 标准开发计划与 WBS (Development Plan & Work Breakdown Structure)

### Phase 1: 架构清洗与基础设施 (Foundation) - 2 Weeks
*   **Milestone 1**: 纯净的代码库 (Clean Repo)
    *   [1.1] 移除 `dify/` 目录，配置 `docker-compose.yml` 启动 Dify 服务。
    *   [1.2] 合并/移除 `src/` 目录，确保 `app/` 为唯一入口。
    *   [1.3] 配置 ESLint + Prettier + Husky，强制禁止 `any` 类型提交。

### Phase 2: 核心重构 (Core Refactoring) - 3 Weeks
*   **Milestone 2**: 类型安全的服务层 (Type-Safe Service Layer)
    *   [2.1] 定义 `IRoomRepository` 和 `ISessionRepository` 严格接口。
    *   [2.2] 重构 `GameRoomService.ts`，移除所有 `as any` 断言。
    *   [2.3] 补全 Service 层单元测试，覆盖率达 85%。

### Phase 3: 功能开发与 AI 集成 (Feature Dev) - 4 Weeks
*   **Milestone 3**: 智能对战 MVP (AI Battle MVP)
    *   [3.1] 开发 `DifyService` 适配器，封装 Dify API 调用。
    *   [3.2] 实现 AI 玩家托管逻辑，对接游戏状态机。
    *   [3.3] 优化前端 Phaser 渲染性能，减少 React 重渲染。

### Phase 4: 验收与交付 (QA & Delivery) - 1 Week
*   **Milestone 4**: 生产发布 (Production Release)
    *   [4.1] 全链路压测 (Load Testing)，确保 P99 < 200ms。
    *   [4.2] 安全扫描 (Security Scan)，修复高危漏洞。
    *   [4.3] 输出《GuanDan3 运维手册》与《API 文档》。

---

## 4. 风险预案 (Risk Management)

| 风险项 (Risk) | 概率 (Prob.) | 影响 (Impact) | 缓解措施 (Mitigation) |
| :--- | :--- | :--- | :--- |
| **Dify API 变更** | 中 (Medium) | 高 (High) | 锁定 Docker 镜像版本；编写 API 适配层进行隔离。 |
| **重构导致逻辑回归** | 高 (High) | 中 (Medium) | 在重构前先完善 E2E 测试用例，作为回归测试基准。 |
| **性能不达标** | 中 (Medium) | 中 (Medium) | 提前进行 Phaser 性能分析，使用 Canvas 优化渲染。 |

---
*Approved by GuanDan3 Project Committee*
