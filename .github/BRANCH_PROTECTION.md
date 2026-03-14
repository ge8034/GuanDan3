## 分支保护建议（GitHub Settings）

### 适用分支
- `main` / `master`

### 建议规则
- 必须通过状态检查（Require status checks to pass before merging）
  - `CI / web-checks`（必跑：lint/typecheck/unit）
- 必须至少 1 个审批（Require a pull request before merging）
  - 建议开启 CODEOWNERS 审批要求（Require review from Code Owners）
- 必须最新提交通过检查（Require branches to be up to date before merging）
- 禁止强推与删除保护分支（Restrict who can push / Prevent branch deletion）

### 备注
- `web-e2e` / `web-perf` 作为“按需 + 合并后兜底”：
  - PR：仅在同仓库 PR 且打上标签时运行（`run-e2e` / `run-perf`）
  - main/master push：如配置了 Supabase 凭据，会自动运行（用于合并后回归兜底）
- 这样设置的目的：避免“必跑检查”被 secrets/外部 PR 限制卡死，同时仍保留高成本测试能力。
