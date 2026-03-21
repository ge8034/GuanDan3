


# Claude Code 项目指南

## 环境信息

- **系统路径**：`C:\Users\Administrator\node`
- **Node.js 版本**：通过系统路径全局安装
- **默认语言**：项目交互必须使用中文
- **当前日期**：2026-03-12

## 语言要求

**重要**：此项目中的所有交互必须使用中文，包括：
- 对话回复
- 代码注释
- 错误信息解释
- 命令说明
- 技术文档

这是永久性要求，适用于所有会话和所有类型的交互。

## 项目信息

- **项目名称**：guandan3-web（斗地主 3.0 / 掼蛋 3）
- **项目类型**：Web 游戏应用（扑克牌游戏）
- **项目状态**：开发阶段，按 GuanDan3_Integrated_Architecture.md 架构实施

### 核心目标
- 并发 ≤ 20 人
- 首屏加载 ≤ 2s（3G 网络）
- 单局延迟 ≤ 100ms（P99）
- 20 人并发 CPU ≤ 30%（1 vCPU）
- 零人工干预 7×24h 无崩溃
- 一键部署到 Fly.io 或 Render

## 架构概述

### 业务场景与用例
1. **进入即玩**：首次打开即自动创建匿名会话（Supabase Anonymous Sign-in），无注册、无登录交互
2. **房型选择**：
   - 练习房：3 个 AI + 1 人（1v3），自动建房并填充 AI 座位，点击开始即可开局
   - 对战房：4 人真人，支持创建/加入房间、准备/取消准备、房主开局
3. **牌局生命周期**：发牌、轮到玩家出牌、校验合法、广播状态、轮转到下一位、局结束、积分结算
4. **断线重连**：客户端心跳失效后自动标记离线；重连后拉取最新牌局快照与补发增量
5. **积分与排名**：每局结算积分累积到房间内玩家会话，支持简单排行榜

### 技术选型

#### 核心框架
- **Next.js** 16.1.6 - React 框架，App Router
- **React** 19.2.4 - UI 库
- **TypeScript** 5 - 类型系统
- **Tailwind CSS** 4 - 样式框架

#### 状态管理与后端
- **Zustand** 5.0.11 - 轻量级状态管理（切片化 + 选择器）
- **Supabase** (@supabase/supabase-js 2.99.1) - 后端服务和数据库
  - **认证**：Anonymous Sign-in（无注册无登录交互）
  - **数据库**：PostgreSQL + RLS
  - **实时**：Realtime（Broadcast/Presence/Postgres Changes）

#### 测试
- **Playwright** 1.58.2 - E2E 测试
- **Vitest** 4.0.18 - 单元测试

#### 工具库
- **clsx** 2.1.1 - 类名工具
- **tailwind-merge** 3.5.0 - Tailwind 类名合并
- **lucide-react** 0.577.0 - 图标库

### 领域模型

#### 核心实体（8 个）
1. **users**（Supabase Auth）- 用户认证
2. **profiles**（1:1 users）- 扩展信息
3. **rooms** - 房间（1:N room_members, 1:N games）
4. **room_members** - 玩家加入房间的成员关系（N:1 rooms, N:1 profiles）
5. **games** - 牌局实例（N:1 rooms, 1:N turns, 1:N scores, 1:N game_hands）
6. **game_hands** - 每玩家私有手牌（N:1 games, N:1 profiles）
7. **turns** - 出牌事件/动作流水（N:1 games, N:1 room_members）
8. **scores** - 积分记录（N:1 games, N:1 room_members）

#### 关键约束
- **写入控制**：所有业务表写入由 Edge Function + RPC 完成，客户端默认只读
- **状态权威**：数据库是状态权威源，Realtime 只做广播与订阅
- **并发安全**：submit_turn 幂等性（action_id 唯一约束）、turn_no 顺序校验、行锁

### UI/渲染策略（分阶段）
- **U1（试用版）**：DOM + CSS 为主，保证规则正确、同步稳定、手机可玩
- **U2（可玩版）**：响应式布局、触控优化、断线重连
- **U3（增强版）**：引入 Phaser 3 做动画与拖拽（仅渲染层替换）

## 项目结构规范（严格约定）

### 目录结构（严格按照此结构）

```
guandan3-web/
├── src/
│   ├── app/                      # Next.js App Router（App 目录）
│   │   ├── layout.tsx           # 根布局（全局状态、Meta、滚动恢复）
│   │   ├── page.tsx             # 首页（进入即玩 + 房型选择）
│   │   ├── error.tsx            # 全局错误边界
│   │   ├── loading.tsx          # 全局加载状态
│   │   ├── not-found.tsx        # 404 页面
│   │   ├── api/                 # API 路由（可选，用于代理 Edge Functions）
│   │   │   └── proxy.ts         # Edge Function 代理
│   │   ├── lobby/               # 对战大厅
│   │   │   ├── page.tsx         # 房间列表页
│   │   │   ├── components/      # 大厅组件
│   │   │   │   ├── RoomList.tsx # 房间列表
│   │   │   │   ├── CreateRoom.tsx # 创建房间
│   │   │   │   └── JoinRoom.tsx # 加入房间
│   │   │   └── hooks/           # 大厅专用 Hooks
│   │   │       ├── useRooms.ts  # 房间数据
│   │   │       └── useLobby.ts  # 大厅逻辑
│   │   └── room/[roomId]/       # 游戏房间
│   │       ├── page.tsx         # 房间主页面
│   │       ├── components/      # 房间组件
│   │       │   ├── RoomHeader.tsx # 房间信息头
│   │       │   ├── PlayerSeat.tsx # 玩家座位
│   │       │   ├── GameTable.tsx # 牌桌
│   │       │   ├── CardHand.tsx # 手牌区
│   │       │   ├── PlayArea.tsx # 出牌区
│   │       │   └── ReadyButton.tsx # 准备按钮
│   │       └── hooks/           # 房间专用 Hooks
│   │           ├── useRoom.ts   # 房间数据
│   │           └── useRealtime.ts # Realtime 订阅
│   ├── lib/                     # 核心库（业务逻辑）
│   │   ├── game/
│   │   │   ├── ai.ts            # AI 逻辑（牌型评估、决策树）
│   │   │   ├── rules.ts         # 游戏规则（牌型判断、出牌校验）
│   │   │   ├── types.ts         # 游戏类型定义
│   │   │   └── constants.ts     # 游戏常量
│   │   ├── api/
│   │   │   ├── supabase.ts      # Supabase 客户端配置
│   │   │   ├── rpc.ts           # RPC 调用封装
│   │   │   └── errors.ts        # API 错误定义
│   │   ├── hooks/
│   │   │   ├── useSound.ts      # 音效 Hook
│   │   │   └── useGame.ts       # 游戏状态 Hook
│   │   ├── store/               # Zustand 状态管理（slice 模式）
│   │   │   ├── auth.ts          # 认证状态
│   │   │   ├── game.ts          # 游戏状态
│   │   │   ├── room.ts          # 房间状态
│   │   │   └── ui.ts            # UI 状态
│   │   └── utils/
│   │       ├── index.ts         # 工具函数汇总
│   │       ├── card.ts          # 卡牌工具
│   │       └── format.ts        # 格式化工具
│   └── test/
│       ├── unit/                # 单元测试
│       │   ├── game/
│       │   │   ├── rules.test.ts
│       │   │   └── ai.test.ts
│       │   └── utils/
│       │       └── card.test.ts
│       ├── integration/         # 集成测试
│       │   ├── api.test.ts
│       │   └── realtime.test.ts
│       └── e2e/                 # E2E 测试
│           ├── entry.spec.ts    # 入口测试
│           ├── lobby.spec.ts    # 大厅测试
│           ├── room.spec.ts     # 房间测试
│           └── game.spec.ts     # 游戏测试
├── tests/                       # E2E 测试（独立于 src）
│   ├── e2e/                     # Playwright E2E 测试
│   │   ├── entry.spec.ts
│   │   ├── lobby.spec.ts
│   │   ├── room.spec.ts
│   │   └── game.spec.ts
│   └── k6/                      # k6 压测脚本
│       ├── scenarios/
│       │   ├── pvp4.ts
│       │   └── pve1v3.ts
│       └── metrics.ts           # 性能指标定义
├── supabase/                    # Supabase 配置
│   ├── migrations/              # 数据库迁移
│   │   ├── 001_initial_schema.sql
│   │   └── 002_rls_policies.sql
│   └── functions/               # Edge Functions（可选）
│       └── handle-game.ts
├── public/                      # 静态资源
│   ├── images/                  # 图片
│   ├── icons/                   # 图标
│   └── sounds/                  # 音效
├── scripts/                     # 构建和部署脚本
│   ├── build.sh
│   └── deploy.sh
├── .github/                     # GitHub Actions
│   └── workflows/
│       ├── ci.yml               # 持续集成
│       ├── deploy.yml           # 自动部署
│       └── test.yml             # 自动测试
├── .eslintrc.json               # ESLint 配置
├── .prettierrc                  # Prettier 配置
├── tsconfig.json                # TypeScript 配置
├── tsconfig.node.json           # Node 环境配置
├── tailwind.config.ts           # Tailwind 配置
├── vitest.config.ts             # Vitest 配置
├── playwright.config.ts         # Playwright 配置
├── next.config.js               # Next.js 配置
├── package.json                 # 项目依赖
├── package-lock.json            # 依赖锁定
├── .env.local.example           # 环境变量模板
├── .env.local                   # 环境变量（不提交）
├── .gitignore                   # Git 忽略文件
├── README.md                    # 项目说明
├── CHANGELOG.md                 # 变更日志
├── ARCHITECTURE.md              # 架构文档
└── CLAUDE.md                    # 本文件（Claude Code 指南）
```

### 文件命名规范

- **React 组件**：`PascalCase.tsx`（如 `GameTable.tsx`）
- **工具函数/类型**：`camelCase.ts`（如 `formatCard.ts`）
- **常量**：`UPPER_SNAKE_CASE.ts`（如 `GAME_CONSTANTS.ts`）
- **测试文件**：`${sourceFile}.test.ts`（如 `rules.test.ts`）
- **Mock 文件**：`${sourceFile}.mock.ts`（如 `api.mock.ts`）
- **配置文件**：`kebab-case.config.ts`（如 `vitest.config.ts`）

## 开发规范

### 编码规范
1. **文件命名**：使用小写字母和连字符（kebab-case）
2. **组件命名**：使用 PascalCase
3. **函数命名**：使用 camelCase
4. **常量命名**：使用 UPPER_SNAKE_CASE
5. **TypeScript**：严格模式，所有函数必须有类型注解
6. **样式**：使用 Tailwind CSS utility classes

### 代码组织
- 文件职责单一（每个文件/模块只负责一个功能）
- 函数/方法长度 ≤ 50 行
- 嵌套层级 ≤ 3 层
- 避免上帝函数（single responsibility principle）

### 代码注释
- 所有代码注释必须使用中文
- 复杂算法有注释说明（如牌型组合逻辑）
- RLS 策略有说明注释（为什么这样设计权限）
- 不注释显而易见的代码

### 状态管理
- 使用 Zustand slice 模式
- 每个状态模块独立文件
- 状态变更函数使用清晰命名
- 使用选择器避免不必要重渲染

### 错误处理
- 所有 API 端点有错误响应格式
- 错误码清晰（turn_no_mismatch、not_a_member、not_your_turn）
- 错误日志记录完整（game_id、user_id、action）
- 客户端有友好的错误提示

### 安全要求
- **SQL 注入防护**：所有数据库操作使用 Supabase RPC 或 Prepared Statements
- **XSS/CSRF 防护**：React 自动转义 HTML，避免 dangerouslySetInnerHTML
- **权限控制**：RLS 策略严格限制数据访问权限（game_hands 只能读取自己）
- **认证与授权**：匿名会话正确实现，Session Token 存储安全
- **Rate Limiting**：Edge Function 实现频率限制

## 测试要求

### 核心原则：测试优先
1. **没有测试，不能提交代码**
   - 所有新增功能必须编写测试代码
   - 修复 bug 必须编写回归测试
   - 代码审核时测试代码与业务代码同等重要

2. **测试覆盖率是硬性指标**
   - **单元测试覆盖率 ≥ 85%**（核心业务逻辑）
   - **集成测试覆盖率 ≥ 70%**
   - E2E 测试覆盖所有核心用户路径
   - 覆盖率不达标，直接拒绝合并

3. **审核代码与审核测试同等重要**
   - 测试代码的可读性、可维护性纳入审核范围
   - 测试用例的覆盖完整性纳入审核范围

### 测试类型与要求
#### 单元测试
- 关键函数有单元测试（牌型判断、出牌校验、轮转逻辑）
- 测试覆盖率 ≥ 85%
- 使用测试替身（mock Supabase、网络）
- 每个函数至少有 3 个测试用例（正常、边界、异常）

#### 集成测试
- API 端点集成测试
- 数据库操作测试
- Realtime 订阅/发布测试
- 跨模块集成测试

#### E2E 测试
- Playwright 测试核心路径（进入→选择房型→创建/加入房→出牌→结算）
- 移动端适配测试
- 断线重连测试
- 多设备同步测试

#### 压测要求
- **k6 场景**：20 人并发，每秒 5 次出牌 RPC 峰值
- **指标阈值**：
  - submit_turn P95 ≤ 60ms, P99 ≤ 100ms, 错误率 < 0.1%
  - Realtime 推送 P99 ≤ 60ms（同区域部署前提）
  - web 容器 CPU 平均 ≤ 30%（20 并发）
- **测试时长**：持续 10–30 分钟观察尾延迟与内存趋势

## 工作流程
  -开始新工作前，务必验证TypeScript错误。运行`npx pyright --verbose`检查类型问题，然后将其修复，以此作为任何功能开发或代码审查请求的前提条件。
## 持续集成/持续部署
  -使用`claude -p 'fix TypeScript errors and verify tests' --allowedTools 'Edit,Read,Bash'`进行批量修复。这可以避免工具干扰，使Claude专注于读取、编辑和运行命令。

## 代码审核标准

###审查务必先运行
  -当需要审查代码时，首先列出所有测试（`npx playwright list`）并运行这些测试（`npx playwright test`），然后根据测试失败情况分析代码。始终从测试验证开始。

### 审核七大维度

#### 1. 正确性 (Correctness)
- [ ] **业务逻辑正确**
  - 牌型判断准确（炸弹、顺子、同花顺等）
  - 出牌合法性校验完整（必须比上家大、不能出无效牌型等）
  - 轮转逻辑正确（turn_no 递增、current_seat 轮转）
  - 结算算法准确（积分计算、连分规则）
- [ ] **并发安全性**
  - submit_turn 幂等性保证（action_id 唯一约束）
  - turn_no 顺序校验防止并发写入
  - 行锁使用正确（SELECT ... FOR UPDATE）
  - 无竞态条件（race condition）或数据损坏
- [ ] **边界条件处理**
  - 空房间、单人房、满员房的创建/退出逻辑
  - 最后一个玩家退出时房间的清理
  - 多局连续进行的边界情况
  - 玩家中途离线时的恢复策略

#### 2. 可维护性 (Maintainability)
- [ ] **代码组织清晰**
  - 文件职责单一
  - 函数/方法长度 ≤ 50 行
  - 嵌套层级 ≤ 3 层
  - 避免上帝函数
- [ ] **测试代码组织**
  - 测试文件与源文件命名一致
  - 测试按功能模块分组
  - 测试辅助函数/常量与源文件分离
- [ ] **命名规范**
  - 变量/函数命名符合语义
  - 常量命名全大写
  - 布尔值命名使用 is/has/can/should 前缀
- [ ] **依赖管理**
  - 明确依赖关系
  - 避免循环依赖
  - 外部库版本锁定

#### 3. 可读性 (Readability)
- [ ] **代码注释**
  - 复杂算法有注释说明
  - RLS 策略有说明注释
  - API 端点有 Swagger/OpenAPI 注释
  - 不注释显而易见的代码
- [ ] **代码风格**
  - 使用 ESLint/Prettier 统一代码格式
  - 括号对齐、缩进一致
  - 导入顺序规范
  - 魔法数字使用常量定义
- [ ] **日志规范**
  - 关键操作有日志
  - 错误日志包含上下文信息
  - 敏感信息脱敏
  - 日志级别合理

#### 4. 效率 (Efficiency)
- [ ] **性能指标**
  - submit_turn RPC 响应时间 P95 ≤ 60ms, P99 ≤ 100ms
  - Realtime 推送延迟 P99 ≤ 60ms（同区域部署）
  - Web 容器 CPU 平均 ≤ 30%（20 并发）
  - 首屏加载 FCP ≤ 2s（3G 网络）
- [ ] **资源优化**
  - 避免全表扫描（索引使用正确）
  - N+1 查询优化（JOIN 代替循环查询）
  - 无内存泄漏（EventSource/Subscription 正确关闭）
  - Phaser 对象池使用（减少 GC 压力）
- [ ] **缓存策略**
  - Supabase 数据使用 RLS + 缓存层
  - 静态资源使用 CDN + 永久缓存
  - 游戏状态变更时选择性更新（delta 而非全量）

#### 5. 安全性 (Security)
- [ ] **SQL 注入防护**
  - 所有数据库操作使用 Supabase RPC 或 Prepared Statements
  - 禁止字符串拼接 SQL
  - RLS 策略严格限制数据访问权限
- [ ] **XSS/CSRF 防护**
  - React 自动转义 HTML
  - 表单输入进行校验和清理
  - 使用 Supabase Auth 处理认证
- [ ] **权限控制**
  - 越权访问检测（game_hands 只能读取自己）
  - 房间操作检查所有权
  - 批量操作限制
- [ ] **认证与授权**
  - 匿名会话正确实现
  - Session Token 存储安全
  - Session 过期与刷新处理
- [ ] **Rate Limiting**
  - Edge Function 实现频率限制
  - 防止暴力破解
  - 异常行为检测

#### 6. 边缘情况与错误处理 (Edge Cases & Error Handling)
- [ ] **错误处理**
  - 所有 API 端点有错误响应格式
  - 错误码清晰
  - 错误日志记录完整
  - 客户端有友好的错误提示
- [ ] **网络异常**
  - 断线重连逻辑完整
  - Realtime 断开重连策略
  - 网络恢复后状态同步
- [ ] **数据异常**
  - 数据库连接失败的处理
  - 超时处理
  - 数据不一致时的恢复策略
- [ ] **客户端异常**
  - 无 JavaScript 错误
  - Loading/Error/Empty 状态完整
  - 无白屏/死机现象

#### 7. 可测试性 (Testability)
- [ ] **单元测试**
  - 关键函数有单元测试
  - 测试覆盖率 ≥ 85%
  - 使用测试替身
  - 每个函数至少有 3 个测试用例
- [ ] **集成测试**
  - API 端点集成测试
  - 数据库操作测试
  - Realtime 订阅/发布测试
- [ ] **E2E 测试**
  - Playwright 测试核心路径
  - 移动端适配测试
  - 断线重连测试
  - 多设备同步测试
- [ ] **测试数据管理**
  - 测试数据库隔离
  - 测试数据可重复使用
  - 清理机制
  - 测试数据版本控制

### 审核流程
1. **自审**：运行测试、检查覆盖率、运行 Lint、检查 git diff、填写 Commit Message、更新文档
2. **互审**：创建 PR → 自动检查通过 → 人工审核（优先测试代码）→ 修改与回复 → 合并
3. **审核要点**：
   - **高优先级**：安全漏洞、并发安全问题、逻辑错误、破坏性变更、测试覆盖率 < 85%
   - **中优先级**：性能问题、代码质量问题、错误处理不足、测试覆盖不足
   - **低优先级**：代码风格不一致、注释不够清晰、命名不够语义化

## 性能指标与验收标准

### 性能指标（可度量）
1. **代码到线上 ≤ 15 分钟**
   - GitHub Actions 从 push 到 Fly/Render 完成部署 ≤ 15 分钟

2. **首屏加载 ≤ 2 秒（3G 网络）**
   - Lighthouse Mobile 模式 FCP ≤ 2s

3. **单局延迟 ≤ 100 ms（P99）**
   - 端到端延迟：turns.created_at → 客户端收到 turns 事件（同区域部署前提）
   - RPC 服务端延迟：submit_turn P99 ≤ 100ms

4. **20 人同时在线 CPU ≤ 30%（1 vCPU）**
   - Fly/Render 上 web 容器平均 CPU 占用 ≤ 30%（不包含 Supabase 托管资源）

5. **零人工干预 7×24h 无崩溃**
   - 连续 7 天容器无崩溃、Supabase 无严重错误，告警为 0 P0

### 性能优化关键路径
- **互动链路**：玩家点击出牌 → Edge Function 校验 → DB 提交 turns → Realtime 推送 → 其他客户端渲染
- **P99 预算拆分**：
  - Edge Function 处理：≤ 20ms
  - DB 写入（含行锁与索引）：≤ 30ms
  - Realtime 推送：≤ 40ms
  - 客户端渲染与状态合并：≤ 10ms

### 部署与网络要求
- web（Fly/Render）与 Supabase 项目必须选择同一地理区域
- 线上压测必须从接近部署区域的 runner 发起
- 容器启动命令：`npm run start` 或 Next standalone 输出

## 部署指南

### 本地开发
1. 克隆仓库
2. 安装依赖：`npm install`
3. 配置环境变量（复制 `.env.local.example` 到 `.env.local`）
4. 启动开发服务器：`npm run dev`

### Supabase 部署流程

#### 1. 创建 Supabase 项目
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击 "New Project" 创建新项目
3. 配置项目信息：
   - Database Password：设置强密码
   - Database Name：guandan3
   - Region：选择与部署区域一致（推荐：Singapore 或 Tokyo）

#### 2. 配置数据库表和 RLS
1. 进入 Supabase Dashboard → SQL Editor
2. 粘贴 `GuanDan3_Integrated_Architecture.md` 中的 SQL 语句
3. 点击 "Run" 执行 SQL
4. 确认所有表创建成功（users、profiles、rooms、room_members、games、game_hands、turns、scores）

#### 3. 配置认证设置
1. 进入 Authentication → Providers
2. 确保 Anonymous Provider 已启用
3. 配置 `anon` 密钥权限（所有表 public 模式可读）

#### 4. 配置 API 访问
1. 进入 Project Settings → API
2. 复制：
   - Project URL
   - anon public key
   - service_role secret key（仅限服务器端）

#### 5. 更新环境变量
在项目根目录创建或编辑 `.env.local`：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 部署选项

#### 选项 1：Vercel（推荐）
1. 安装 Vercel CLI：`npm i -g vercel`
2. 登录 Vercel：`vercel login`
3. 在项目根目录运行：`vercel`
4. 按提示选择项目配置：
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
5. 部署到生产环境：`vercel --prod`

#### 选项 2：Fly.io
1. 安装 Fly CLI：`curl -L https://fly.io/install.sh | sh`
2. 登录 Fly：`flyctl auth login`
3. 初始化应用：`flyctl init`
4. 编辑 `fly.toml`：
```toml
app = "guandan3"
primary_region = "sin"
[build]
  dockerfile = "Dockerfile"
[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
```
5. 构建并部署：`flyctl deploy`

#### 选项 3：Render
1. 连接 GitHub 仓库到 Render
2. 选择 Web Service
3. 配置环境变量：
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. 构建命令：`npm run build`
5. 启动命令：`npm start`
6. 部署到生产环境

### 环境变量配置
创建 `.env.local.example` 文件作为模板：
```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## CI/CD 配置

### GitHub Actions（自动部署）
创建 `.github/workflows/deploy.yml`：
```yaml
name: Deploy to Production

on:
  push:
    branches: ["main"]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build project
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 命令说明

### 开发命令
```bash
# 启动开发服务器
npm run dev
# 或
yarn dev
# 或
pnpm dev
# 或
bun dev
```

### 构建命令
```bash
# 构建生产版本
npm run build
# 或
yarn build

# 启动生产服务器
npm start
# 或
yarn start
```

### 代码质量命令
```bash
# 运行 ESLint 检查
npm run lint
# 或
yarn lint

# 运行 TypeScript 类型检查
npm run typecheck
# 或
yarn typecheck
```

### 测试命令
```bash
# 运行所有测试
npm test
# 或
yarn test

# 运行测试并生成覆盖率报告
npm run test:coverage
# 或
yarn test:coverage

# 运行 Playwright E2E 测试
npm run test:e2e
# 或
yarn test:e2e

# 运行 E2E 测试并打开浏览器
npm run test:e2e:ui
# 或
yarn test:e2e:ui
```

## 注意事项

1. **中文优先**：所有交互必须使用中文
2. **类型安全**：充分利用 TypeScript 类型系统
3. **测试驱动**：重要的功能必须有测试（覆盖率 ≥ 85%）
4. **代码复用**：优先复用现有代码，避免重复
5. **安全第一**：所有数据库操作使用 RPC，RLS 策略严格
6. **错误处理**：完善的错误处理和用户反馈
7. **性能优化**：关注加载速度和用户体验
8. **实时同步**：State Authority 在数据库，Realtime 只做广播
9. **并发安全**：使用行锁、幂等性保证、顺序校验
10. **断线重连**：客户端心跳、拉取快照、补发增量

## 获取帮助

如果在使用过程中遇到问题，请：
1. 查阅相关技术文档
2. 检查 ESLint 和类型检查输出
3. 查看测试结果和覆盖率报告
4. 参考本指南中的命令说明
5. 查看 `GuanDan3_Integrated_Architecture.md` 架构文档