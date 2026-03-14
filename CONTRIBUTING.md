## 协作方式

### 基本原则
- 小步提交：一个 PR 只做一件事，能回滚，能单独上线
- 明确责任：每个 PR 至少一个 owner、一个 reviewer
- 先测后合：合并前必须通过 CI（lint/typecheck/unit）
- 可观测优先：线上问题要能定位（日志、复现步骤、数据点）

### 分支与 PR 约定
- 分支命名：`feat/<topic>`、`fix/<topic>`、`chore/<topic>`
- PR 标题：`[feat] xxx` / `[fix] xxx` / `[chore] xxx`
- PR 必填：变更概要、影响范围、风险与回滚、验证清单

### 本地验证
- 必跑：`npm run lint`、`npm run typecheck`、`npm run test:coverage`
- 按需：`npm run test:e2e`、`npm run test:perf`

### Code Review 规则
- Reviewer 优先关注：接口契约、状态一致性、并发/订阅边界、回滚路径
- 不允许：提交密钥、在生产环境打印敏感数据、绕过权限校验

## 模块职责

### guandan3-web（前端）
- `src/app/`：页面与交互（只做 UI + 调用 store）
- `src/lib/store/`：状态管理与与 Supabase 的交互边界
- `src/lib/game/`：规则、AI 与纯逻辑
- `supabase/migrations/`：数据库与 RPC 变更（每个 PR 都要可回滚）

## CI 与合并策略
- 建议开启分支保护：必须通过 `ci` 工作流、至少 1 次 review、禁止强推
