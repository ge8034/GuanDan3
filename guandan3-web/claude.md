# Claude Code 项目指南

> **版本**: 2.0.0
> **最后更新**: 2026-04-06
> **变更日志**: 统一测试覆盖率要求、添加项目配置章节、重组文档结构、添加故障排查指南

---

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm run test

# 查看覆盖率
npm run test:coverage
```

---

## 1. 项目概述

### 项目信息
- **名称**: guandan3-web（掼蛋3）
- **类型**: Web 游戏应用（扑克牌游戏）
- **框架**: Next.js 16 + React 19 + TypeScript
- **状态管理**: Zustand
- **后端服务**: Supabase（认证 + 数据库 + 实时）

### 核心目标
| 指标 | 目标值 |
|------|--------|
| 并发用户 | ≤ 20 人 |
| 首屏加载 | ≤ 2s（3G 网络） |
| 单局延迟 | ≤ 100ms（P99） |
| CPU 使用率 | ≤ 30%（20 并发，1 vCPU） |
| 稳定性 | 零人工干预 7×24h 无崩溃 |

### 业务场景
1. **进入即玩**：匿名会话，无注册登录
2. **房型选择**：练习房（1v3 AI）/ 对战房（4人真人）
3. **牌局流程**：发牌 → 轮流出牌 → 校验 → 广播 → 结算
4. **断线重连**：心跳检测 → 状态同步 → 增量补发

---

## 2. 项目配置

### 测试覆盖率要求
> **来源**: `vitest.config.ts` - 修改时请同步更新

| 指标 | 目标值 |
|------|--------|
| 行覆盖率 | 90% |
| 语句覆盖率 | 90% |
| 函数覆盖率 | 90% |
| 分支覆盖率 | 85% |

### 性能指标

| 指标 | 目标值 | 测量方法 |
|------|--------|----------|
| 首屏加载(FCP) | ≤ 2s | Lighthouse Mobile |
| submit_turn P99 | ≤ 100ms | RPC 日志 |
| Realtime 推送 P99 | ≤ 60ms | 事件时间戳 |
| 并发 20 用户 CPU | ≤ 30% | 容器监控 |
| 代码到线上 | ≤ 15 分钟 | CI/CD 时长 |

### 技术栈版本
```json
{
  "next": "16.1.6",
  "react": "19.2.4",
  "typescript": "5.x",
  "vitest": "4.x",
  "playwright": "1.58.2",
  "zustand": "5.0.11",
  "@supabase/supabase-js": "2.99.1"
}
```

---

## 3. 开发规范

### 编码规范

#### 文件组织
- **多小文件 > 少大文件**：200-400 行典型，800 行上限
- **单一职责**：每个文件/模块只负责一个功能
- **函数长度**：≤ 50 行
- **嵌套层级**：≤ 3 层

#### 命名规范
| 类型 | 规范 | 示例 |
|------|------|------|
| React 组件 | PascalCase | `GameTable.tsx` |
| 工具函数 | camelCase | `formatCard.ts` |
| 常量 | UPPER_SNAKE_CASE | `MAX_PLAYERS` |
| 测试文件 | *.test.ts | `rules.test.ts` |
| 配置文件 | kebab-case.config | `vitest.config.ts` |

#### 防御性编程
1. **所有公共函数必须校验输入参数**
2. **明确区分可选值和必填值** - 使用 `T | undefined` 表示可选
3. **快速失败** - 无效参数立即抛出明确错误
4. **禁止 any 类型** - 使用字面量类型限制取值范围

### 状态管理规范

#### 单一数据源原则
- **数据库是状态权威源**
- **Realtime 只做广播，不修改状态**
- **Client Store 只能读取和发起变更请求**

#### 状态变更统一入口
- 所有状态变更必须通过预定义的更新函数
- 禁止直接修改状态对象
- 使用乐观更新提升体验，冲突时以数据库为准

#### 状态同步策略
```
数据库 → Realtime → Client Store (单向流动)
```

### 错误处理规范

#### 分层错误处理
| 层级 | 职责 |
|------|------|
| UI 层 | 显示用户友好的错误提示 |
| 业务层 | 记录详细错误上下文，尝试恢复 |
| 数据层 | 确保数据一致性，使用事务回滚 |

#### 错误传播原则
- 错误向上传播到能处理它的层
- 不要静默吞掉异常
- 使用统一的错误类型系统
- 记录完整上下文信息

### 并发安全规范

#### 锁机制使用
- 每个资源有明确的锁持有者（`seatId + roomId`）
- 使用 try-finally 确保锁一定会被释放
- 按固定顺序获取多个锁，避免死锁

#### 状态隔离原则
- 不同房间使用独立的状态实例
- 不同座位使用独立的决策锁
- 一个房间的错误不能影响其他房间

#### 竞态条件预防
- 状态变更应该是原子操作
- 使用版本号检测并发修改
- 幂等性保证（action_id 唯一约束）

### 安全要求

#### 输入验证
- 所有用户输入在系统边界进行验证
- 使用 schema-based 验证
- 失败快速，返回明确错误信息

#### 数据库安全
- 所有数据库操作使用 Supabase RPC 或 Prepared Statements
- 在创建迁移前，确认所有被引用的列已存在
- RLS 策略严格限制数据访问权限

#### 认证授权
- 匿名会话正确实现
- Session Token 存储安全
- 检查越权访问（如只能读取自己的手牌）

---

## 4. 测试要求

### 测试类型
- **单元测试**：关键函数的测试覆盖（规则、AI、工具）
- **集成测试**：API 端点、数据库操作、Realtime 订阅
- **E2E 测试**：核心用户路径（进入 → 选房 → 出牌 → 结算）

### 测试驱动开发（TDD）
1. **写测试**（RED）- 测试应该失败
2. **写实现**（GREEN）- 最小代码使测试通过
3. **重构**（IMPROVE）- 优化代码
4. **验证覆盖率**（≥ 90/85%）

### 测试编写规范
- **独立性**：不依赖外部服务
- **Mock 完整性**：Mock 函数必须配置完整返回值
- **异步正确性**：所有异步操作正确等待
- **数据隔离**：使用 beforeEach/afterEach 清理副作用

---

## 3.1 UI/UX 设计规范 (Impeccable)

> **来源**: `.claude/skills/impeccable-design/` - 基于 [pbakaus/impeccable](https://github.com/pbakaus/impeccable)

### Design Tokens

```css
/* 间距系统 - 4pt 基数 */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */

/* 字体大小 - 模块化比例 (1.25) */
--text-xs: 0.75rem;   /* 12px - captions, legal */
--text-sm: 0.875rem;  /* 14px - secondary UI */
--text-base: 1rem;    /* 16px - body text */
--text-lg: 1.25rem;   /* 20px - subheadings */
--text-xl: 1.5rem;    /* 24px - headings */
--text-2xl: 2rem;     /* 32px - hero text */

/* 过渡时间 */
--duration-fast: 100ms;   /* 微交互 */
--duration-base: 200ms;   /* 状态变化 */
--duration-slow: 300ms;   /* 布局变化 */

/* 缓动函数 */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);   /* 进入 */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0);    /* 离开 */
```

### 排版规范

#### DO - 使用模块化比例
```tsx
// ✅ 正确：使用 5 级字体系统
<h1 className="text-2xl">标题</h1>      {/* 32px */}
<p className="text-base">正文</p>       {/* 16px */}
<small className="text-xs">注释</small> {/* 12px */}
```

#### DON'T - 使用太多接近的字体大小
```tsx
// ❌ 错误：14px, 15px, 16px, 17px, 18px - 层次不清
<span className="text-[14px]">...</span>
<span className="text-[15px]">...</span>
<span className="text-[16px]">...</span>
```

#### 避免的默认字体
- ❌ Inter, Roboto, Open Sans, Lato, Montserrat
- ✅ Instrument Sans, Plus Jakarta Sans, Onest, Figtree

### 空间设计规范

#### DO - 使用 4pt 间距系统
```tsx
// ✅ 正确：4, 8, 12, 16, 24, 32, 48px
className="p-4 gap-4"   // 16px
className="p-6 gap-6"   // 24px
className="p-8 gap-8"   // 32px
```

#### DON'T - 使用任意间距值
```tsx
// ❌ 错误：不在 4pt 系统中
className="p-5"        // 20px
className="p-[28px]"   // 28px
className="gap-[22px]" // 22px
```

#### 使用 gap 优于 margin
```tsx
// ✅ 正确：使用 gap
<div className="flex gap-4">...</div>

// ❌ 错误：使用 margin（会有 margin collapse 问题）
<div className="flex">
  <div className="mr-4">...</div>
</div>
```

### 动效设计规范

#### DO - 遵循 100/300/500 规则
```tsx
// ✅ 正确的过渡时间
className="transition-all duration-200"  // 状态变化
className="transition-opacity duration-100" // 即时反馈
```

#### DON'T - 过长的过渡时间
```tsx
// ❌ 错误：超过 500ms 的 UI 反馈
className="transition-all duration-700"
```

#### 仅动画 transform 和 opacity
```tsx
// ✅ 正确：高性能动画
style={{ transform: 'scale(1)', opacity: 0 }}

// ❌ 错误：触发 layout recalculations
style={{ width: 200, height: 100 }}
```

#### 避免的缓动函数
- ❌ `ease` - 很少是最优选择
- ❌ bounce, elastic - 显得业余过时
- ✅ `ease-out` (进入), `ease-in` (离开)

### 交互设计规范

#### 8 种交互状态
每个交互元素需要处理：Default, Hover, Focus, Active, Disabled, Loading, Error, Success

```tsx
// ✅ 正确：完整的状态处理
<button
  className="hover:bg-primary active:bg-primary/80 
             focus:ring-2 disabled:opacity-50
             focus-visible:ring-2"
  disabled={isLoading}
>
  {isLoading ? <Spinner /> : children}
</button>
```

#### 触摸目标最小尺寸
- 最小 44×44px (Apple HIG)
- 小图标使用 padding 或伪元素扩展触摸区域

#### 焦点环要求
- 使用 `:focus-visible` 区分键盘和鼠标焦点
- 2-3px 厚度，高对比度 (3:1 最小值)
- 与元素有偏移 (outline-offset: 2px)

### 颜色与对比规范

#### DO - 使用染色中性色
```css
/* ✅ 正确：添加品牌色微量到中性色 */
--gray-100: oklch(95% 0.01 250);  /* 蓝色冷调 */
--gray-900: oklch(15% 0.01 250);

/* ❌ 错误：纯灰色 */
--gray-100: oklch(95% 0 0);
```

#### DON'T - 过度使用强调色
- 强调色应占 10% 视觉权重
- 过度使用会失去强调作用

#### 颜色对比度要求
- 正文文本：最小 4.5:1
- 大文本 (18px+)：最小 3:1
- 交互元素：最小 3:1

### 反模式速查表

| 领域 | 避免 | 替代 |
|------|------|------|
| 字体 | Inter, Roboto, Open Sans | Instrument Sans, Plus Jakarta Sans |
| 字体大小 | 14, 15, 16, 17, 18px | 12, 14, 16, 20, 24, 32px |
| 间距 | p-5, gap-[22px] | p-4, p-6, gap-4, gap-6 |
| 过渡 | duration-500 (UI反馈) | duration-200 |
| 缓动 | ease, bounce | ease-out, cubic-bezier(0.16,1,0.3,1) |
| 动画属性 | width, height, left | transform, opacity |
| 颜色 | 纯灰色 hsl(0,0,50%) | 染色中性色 |
| 卡片 | 嵌套卡片 | 间距+分隔线 |

---

## 5. 部署指南

### 环境变量
创建 `.env.local`：
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 部署选项

#### Vercel（推荐）
```bash
npm i -g vercel
vercel login
vercel --prod
```

#### Render
1. 连接 GitHub 仓库
2. 配置环境变量
3. 构建命令：`npm run build`
4. 启动命令：`npm start`

### CI/CD
GitHub Actions 自动部署：
- Push 到 main → 自动构建 → 自动部署
- PR 检查必须通过测试才能合并

---

## 6. 命令说明

### 开发命令
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm start            # 启动生产服务器
npm run lint         # ESLint 检查
npm run typecheck    # TypeScript 类型检查
```

### 测试命令
```bash
npm test             # 运行单元测试
npm run test:coverage # 查看覆盖率报告
npm run test:e2e     # 运行 E2E 测试
npm run test:e2e:ui  # E2E 测试 UI 模式
```

### 性能测试
```bash
npm run test:perf    # 运行性能测试
npm run test:load    # 运行负载测试
npm run perf:baseline # 建立性能基准
npm run perf:report  # 生成性能报告
```

---

## 7. 故障排查

### 常见测试错误

| 错误信息 | 原因 | 解决方案 |
|---------|------|----------|
| `cards is not iterable` | AI 决策函数收到非数组参数 | 添加入口参数校验 |
| `expected "vi.fn()" to be called` | Mock 未正确配置 | 检查异步等待时机 |
| `ECONNREFUSED 127.0.0.1:3000` | 需要运行开发服务器 | 先运行 `npm run dev` |
| `Cannot find module` | 依赖未安装 | 运行 `npm install` |
| `Type error X is not assignable to Y` | 类型不匹配 | 检查类型注解 |

### 调试技巧
- **单元测试**: `vitest --ui` 查看详细报告
- **Node.js 调试**: 使用 `--inspect` 标志
- **E2E 测试**: 查看 `playwright-report/` 获取截图
- **覆盖率**: 打开 `coverage/index.html`

### 日志位置
| 日志类型 | 位置 |
|---------|------|
| 测试日志 | `test-results/` |
| 覆盖率报告 | `coverage/index.html` |
| Playwright 报告 | `playwright-report/index.html` |
| 构建日志 | `.next/` |

### 性能问题排查
1. 运行 `npm run perf:baseline` 建立基准
2. 运行 `npm run perf:test` 对比当前性能
3. 检查 Coverage 报告找出未覆盖的代码
4. 使用 Chrome DevTools 分析运行时性能

---

## 8. 提交前检查清单

### 代码质量
- [ ] 测试通过 (`npm run test`)
- [ ] 覆盖率达标 (90/85%)
- [ ] Lint 无错误 (`npm run lint`)
- [ ] 类型检查通过 (`npm run typecheck`)

### 安全检查
- [ ] 无硬编码密钥
- [ ] 所有输入已验证
- [ ] SQL 使用参数化查询
- [ ] RLS 策略正确配置

### 功能检查
- [ ] 新功能有对应测试
- [ ] Bug 修复有回归测试
- [ ] 文档已更新（如需要）

---

## 9. 附录

### 术语表

| 中文 | 英文 | 定义 |
|------|------|------|
| 房间 | Room | 游戏房间，包含 4 个玩家座位 |
| 轮次 | Turn | 一轮出牌动作 |
| 座位 | Seat | 房间中的玩家位置 (0-3) |
| 手牌 | Hand | 玩家持有的卡牌 |
| 牌型 | Pattern | 出牌组合类型（单张、对子、顺子、炸弹等） |
| 领牌 | Lead | 首先出牌，决定本轮牌型 |
| 跟牌 | Follow | 按照领牌的牌型压过 |
| 过牌 | Pass | 放弃本轮出牌 |

### 领域模型（8 个核心实体）
1. **users**（Supabase Auth）- 用户认证
2. **profiles**（1:1 users）- 扩展信息
3. **rooms** - 房间
4. **room_members** - 玩家成员关系
5. **games** - 牌局实例
6. **game_hands** - 每玩家私有手牌
7. **turns** - 出牌事件流水
8. **scores** - 积分记录

### 相关文档
- `GuanDan3_Integrated_Architecture.md` - 技术架构方案
- `docs/API_CONTRACT_TESTING.md` - API 契约测试规范

### 获取帮助
- 查阅相关技术文档
- 检查 ESLint 和类型检查输出
- 查看测试结果和覆盖率报告
- 参考架构文档

---

**文档维护**: 本文档应与项目实际状态保持同步。如发现不一致，请及时更新。
