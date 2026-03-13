# GuanDan3 项目开发主计划 (GuanDan3 Master Development Plan)

**文档编号**: GD3-MDP-20260311  
**版本**: v1.0  
**日期**: 2026-03-11  
**状态**: 待审批 (Draft)  
**作者**: 高级软件开发工程师 (Agent)

---

## 1. 项目背景与目标 (Project Background & Objectives)

基于对 GuanDan2 项目核心需求的深度梳理，GuanDan3 旨在构建一个高性能、易扩展、且具备生产级质量的掼蛋在线对战系统。

### 1.1 核心需求回顾 (Core Requirements)
1.  **完整掼蛋规则服务**: 支持出牌验证、牌型比较、积分计算、特殊规则（逢人配、春天、反春等）。
2.  **游戏状态机**: 管理从准备、发牌、打牌到结算的完整生命周期。
3.  **实时对战体验**: 支持多房间、实时同步（Supabase Realtime）、多终端适配。
4.  **AI 智能对战**: 集成 LLM (Dify) 实现智能补位、托管及对话功能。
5.  **高性能渲染**: 使用 Phaser 3 游戏引擎实现流畅的卡牌动画和交互。

### 1.2 质量改进目标 (Quality Targets)
*   **代码覆盖率**: 核心业务逻辑 (lib/features/game/rules) 单元测试覆盖率 ≥ 90%。
*   **响应性能**: API P99 响应 ≤ 200ms，游戏渲染帧率稳定 60 FPS。
*   **类型安全**: 移除所有 `any` 类型，严禁 `as any` 逃逸。
*   **工程规范**: 统一使用 Next.js App Router，移除冗余 `src/` 结构。

---

## 2. 阶段性里程碑 (Milestones)

| 里程碑 | 描述 | 关键产出 | 计划工期 |
| :--- | :--- | :--- | :--- |
| **M1: 架构基准线** | 清理冗余代码，统一工程化配置，建立类型基准。 | 纯净的工程脚手架, Docker 基础设施 | 2 Weeks |
| **M2: 核心引擎升级** | 重构游戏规则服务与状态机，提升逻辑解耦度。 | 增强型 GameRuleService, 状态机可视化 | 3 Weeks |
| **M3: 实时对战闭环** | 完善房间管理、断线重连、多端实时同步逻辑。 | 稳定的 Lobby & Room 系统 | 3 Weeks |
| **M4: AI 智能增强** | 通过 API 集成 Dify，实现智能托管与个性化 AI。 | AI 玩家模块, 策略配置中心 | 2 Weeks |
| **M5: 性能与 QA** | 全链路压测，Phaser 性能调优，安全扫描。 | 压测报告, 性能优化文档 | 2 Weeks |

---

## 3. 工作分解结构 (WBS)

### 3.1 基础设施与架构 (Foundation)
*   [WBS 1.1] 移除 `src/` 目录，统一 `app/` 路由架构。
*   [WBS 1.2] 将 `dify/` 源码剥离，通过 Docker Compose 管理外部依赖。
*   [WBS 1.3] 配置严格的 ESLint/TypeScript 规则（no-explicit-any）。
*   [WBS 1.4] 引入 Vitest + Playwright 自动化测试流水线。

### 3.2 游戏核心逻辑 (Game Core)
*   [WBS 2.1] 定义统一的 `IRepository` 接口，解决数据访问层类型逃逸。
*   [WBS 2.2] 重写 `GameRuleService`，优化“逢人配”搜索算法性能。
*   [WBS 2.3] 完善 `ScoringService`，支持动态规则配置（如不同地区的升级规则）。
*   [WBS 2.4] 实现游戏状态持久化与快速恢复机制（针对断线场景）。

### 3.3 前端与渲染 (Frontend & Rendering)
*   [WBS 3.1] 重构 `Phaser` 渲染模块，使用对象池 (Object Pool) 优化卡牌资源管理。
*   [WBS 3.2] 引入 `Zustand` 状态切片优化，减少 React 侧的无效重渲染。
*   [WBS 3.3] 开发移动端自适应布局，支持 Web 跨端运行。

### 3.4 AI 与 集成 (AI & Integration)
*   [WBS 4.1] 开发 `DifyConnector` 模块，封装 API 交互逻辑。
*   [WBS 4.2] 实现基于规则的 AI 备选方案（兜底逻辑），当 LLM 响应慢时切换。
*   [WBS 4.3] 实现 AI 对话与游戏状态感知功能。

---

## 4. 质量保证与门禁 (Quality Gates)

1.  **Commit 门禁**: Husky 强制执行 lint 检查与关键单元测试。
2.  **PR 门禁**: 必须有至少一名高级工程师通过 Code Review，且 CI 流水线 100% 通过。
3.  **验收标准**: 
    *   通过所有 P0 级业务集成测试场景。
    *   安全扫描无高危漏洞。
    *   在 100 并发场景下，系统无内存泄漏或崩溃。

---

## 5. 风险预案 (Risk Management)

*   **风险**: Supabase Realtime 连接数限制。
    *   *对策*: 引入消息队列 (Redis/RabbitMQ) 缓冲高频消息，或评估分库分表。
*   **风险**: Dify API 响应延迟影响游戏体验。
    *   *对策*: 采用异步处理 + 本地规则兜底策略，AI 决策时间超时自动回退。
*   **风险**: 重构导致旧业务回归。
    *   *对策*: 在重构前先建立完整的 E2E 回归测试集。

---
*GuanDan3 Project Steering Committee*
