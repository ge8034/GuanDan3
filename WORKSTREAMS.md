# 并行开发工作流（Kickoff）

目标：让多人同时开发时，任务能独立推进、可验收、可回滚、合并不互相阻塞。

## 统一入口
- 提需求：使用 Issue 模板（功能/缺陷/风险）  
  - [.github/ISSUE_TEMPLATE/feature_request.md](file:///d:/Learn-Claude/GuanDan3/.github/ISSUE_TEMPLATE/feature_request.md)  
  - [.github/ISSUE_TEMPLATE/bug_report.md](file:///d:/Learn-Claude/GuanDan3/.github/ISSUE_TEMPLATE/bug_report.md)  
  - [.github/ISSUE_TEMPLATE/risk_escalation.md](file:///d:/Learn-Claude/GuanDan3/.github/ISSUE_TEMPLATE/risk_escalation.md)
- 提交 PR：按模板填写并勾选验证项（需要跑 E2E/Perf 则打标签触发）  
  - [.github/pull_request_template.md](file:///d:/Learn-Claude/GuanDan3/.github/pull_request_template.md)

## 合并门禁（团队协作默认规则）
- 分支保护建议：仅强制 `CI / web-checks`，E2E/Perf 按需跑 + 合并后兜底  
  - [.github/BRANCH_PROTECTION.md](file:///d:/Learn-Claude/GuanDan3/.github/BRANCH_PROTECTION.md)
- 代码所有权：按模块自动请求 reviewer（需要把占位 handle 替换成真实团队/成员）  
  - [.github/CODEOWNERS](file:///d:/Learn-Claude/GuanDan3/.github/CODEOWNERS)

## 工作流（每个任务一条线）
1. Issue：明确范围、验收标准、风险与回滚
2. 分支：`feat/<topic>` / `fix/<topic>` / `chore/<topic>`
3. PR：只做一件事；必须通过 `lint/typecheck/test:coverage`
4. 合并：至少 1 位 reviewer；必要时加 `run-e2e` / `run-perf`

## 任务分工（并行 Pod）

### Pod A：页面与交互（FE-Page）
- 负责人：待填
- 范围：`guandan3-web/src/app/**`
- 优先任务：
  - P-03 房间页“容器 + 视图”解耦（鉴权/订阅/心跳/AI 编排下沉），验收：房间相关 e2e 全绿

### Pod B：状态与一致性（FE-Store）
- 负责人：待填
- 范围：`guandan3-web/src/lib/store/**`
- 优先任务：
  - S-04 派生状态与 selector 收敛（减少页面 useEffect 复杂度），验收：Room 页无多余 re-render、逻辑可测

### Pod C：订阅与回补（FE-Realtime）
- 负责人：待填
- 范围：Realtime 订阅、断线回补、节流、健康度输出
- 优先任务：
  - R-02 订阅状态收敛为“单一健康度”，验收：断线/重连无幽灵更新、页面提示一致

### Pod D：组件与可用性（FE-UI）
- 负责人：待填
- 范围：`guandan3-web/src/app/**` 组件、可复用 UI、可访问性
- 优先任务：
  - C-02 扑克牌渲染组件化（CardView 统一手牌/桌面），验收：UI 不回归、e2e 通过

### Pod E：数据库与安全（BE-DB/BE-Sec/BE-RPC）
- 负责人：待填
- 范围：`guandan3-web/supabase/migrations/**`、RPC、RLS、并发控制
- 优先任务：
  - 权限矩阵 + RLS 回归用例清单（逐表逐操作），验收：越权用例自动化全失败

### Pod F：CI/自动化（DevOps/QA）
- 负责人：待填
- 范围：`.github/workflows/**`、`guandan3-web/tests/**`
- 优先任务：
  - 跑重测试策略落地：PR 通过标签触发 e2e/perf，合并后 push 兜底回归；验收：fork PR 不被 secrets 卡死、产物可下载

## 协作约定（建议）
- 每个 Pod 至少 1 名 reviewer 可用（避免因请假/忙碌导致阻塞）
- 每个 PR 限制变更面：改页面不改 store；改 store 不改 migrations（除非同一个 bug 必须联动）
- 所有可观察性调整（日志/指标/开关）优先不影响生产噪音
