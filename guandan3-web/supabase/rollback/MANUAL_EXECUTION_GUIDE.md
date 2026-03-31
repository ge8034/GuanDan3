# 数据库迁移手动执行指南

由于环境变量缺少 `SUPABASE_SERVICE_ROLE_KEY`，自动迁移工具无法建立直接 PostgreSQL 连接。请使用以下方法手动执行迁移。

---

## 问题诊断

### 连接失败原因

| 检查项 | 结果 | 说明 |
|-------|------|------|
| Supabase API 连接 | ✅ 成功 | HTTPS + anon key 正常工作 |
| PostgreSQL 直连 | ❌ 失败 | DNS 解析错误：`ENOTFOUND db.rzzywltxlfgucngfiznx.supabase.co` |
| 环境变量检查 | ⚠️ 不完整 | 缺少 `SUPABASE_SERVICE_ROLE_KEY` |

### 根本原因

1. **缺少 Service Role Key**：直接 PostgreSQL 连接需要数据库密码，只能从 Supabase Dashboard 获取
2. **网络限制**：某些网络环境可能阻止 PostgreSQL 端口（5432）的直接访问

---

## 解决方案

### 方案 A：通过 Supabase Dashboard 执行（推荐）

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择项目：**guandan3**
3. 进入 **SQL Editor**
4. 按顺序执行以下迁移文件

---

## 迁移文件列表

### 1. fix_start_game_initialize_private_hands.sql

**版本**: `20260330000003`
**功能**: 修复 `start_game` 函数，初始化 `state_private.hands`

```sql
-- 修复 start_game 函数以初始化 state_private.hands
-- 问题：submit_turn 从 state_private.hands 读取手牌，但 start_game 从未初始化这个字段
-- 解决：在 start_game 中初始化 state_private.hands

DROP FUNCTION IF EXISTS public.start_game(uuid);

CREATE OR REPLACE FUNCTION public.start_game(...)
-- (完整代码见迁移文件)
```

**执行后验证**:
```sql
SELECT routine_name, created_at
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'start_game';
```

---

### 2. add_move_validation.sql

**版本**: `20260331000001`
**功能**: 添加掼蛋牌型验证函数 `validate_guandan_move`

```sql
-- 为 submit_turn 添加掼蛋牌型验证
-- 创建 validate_guandan_move 函数
-- 更新 submit_turn 函数添加牌型验证
```

**执行后验证**:
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%validate%';
```

---

### 3. add_validation_to_submit_turn.sql

**版本**: `20260331000002`
**功能**: 在 `submit_turn` 中集成牌型验证逻辑

```sql
-- 创建带牌型验证的 submit_turn_validated 函数
-- 包含完整的玩家授权、手牌更新、排名检查逻辑
```

**执行后验证**:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%submit_turn%';
```

---

### 4. add_level_rank_column.sql

**版本**: `20260331000003`
**功能**: 在 `games` 表添加 `level_rank` 列

```sql
ALTER TABLE public.games ADD COLUMN level_rank integer;
```

**执行后验证**:
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
  AND column_name = 'level_rank';
```

---

### 5. fix_level_rank_default.sql

**版本**: `20260331000004`
**功能**: 修复 `level_rank` 默认值和约束

```sql
ALTER TABLE public.games ALTER COLUMN level_rank SET NOT NULL;
ALTER TABLE public.games ALTER COLUMN level_rank SET DEFAULT 2;
```

**执行后验证**:
```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
  AND column_name = 'level_rank';
```

---

## 回滚脚本

如果迁移出现问题，回滚脚本已生成在 `supabase/rollback/` 目录：

| 迁移版本 | 回滚脚本 |
|---------|---------|
| 20260330000003 | `rollback_20260330000003_20260330000003_fix_start_game_initialize_private_hands.sql` |
| 20260331000001 | `rollback_20260331000001_20260331000001_add_move_validation.sql` |
| 20260331000002 | `rollback_20260331000002_20260331000002_add_validation_to_submit_turn.sql` |
| 20260331000003 | `rollback_20260331000003_20260331000003_add_level_rank_column.sql` |
| 20260331000004 | `rollback_20260331000004_20260331000004_fix_level_rank_default.sql` |

**回滚顺序**: 按相反顺序执行（5 → 4 → 3 → 2 → 1）

---

## 长期解决方案

### 配置 Service Role Key

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 进入项目 → **Settings** → **API**
3. 复制 `service_role` 密钥
4. 添加到 `.env.local`：
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. 重新运行迁移工具：
```bash
npm run migrate:status
npm run migrate:all
```

---

## 安全注意事项

⚠️ **Service Role Key 具有绕过 RLS 的完全权限**

- ❌ **不要**提交到 Git 仓库
- ❌ **不要**在前端代码中使用
- ❌ **不要**分享给他人
- ✅ 只在服务器端环境变量中使用

---

## 迁移验证清单

执行完所有迁移后，运行以下验证：

```sql
-- 1. 检查函数创建
SELECT routine_name, routine_type, created_at
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 2. 检查表结构变更
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
  AND column_name IN ('level_rank')
ORDER BY ordinal_position;

-- 3. 测试牌型验证函数
SELECT public.validate_guandan_move(
  '{"type": "play", "cards": [{"suit": "H", "rank": "2", "val": 3, "id": 1}]}'::jsonb,
  NULL::jsonb,
  2
);  -- 应返回 true

-- 4. 测试炸弹验证
SELECT public.validate_guandan_move(
  '{"type": "play", "cards": [
    {"suit": "H", "rank": "2", "val": 3, "id": 1},
    {"suit": "D", "rank": "2", "val": 3, "id": 14},
    {"suit": "C", "rank": "2", "val": 3, "id": 27},
    {"suit": "S", "rank": "2", "val": 3, "id": 40}
  ]}'::jsonb,
  '{"type": "pass"}'::jsonb,
  2
);  -- 应返回 true
```

---

## 迁移摘要

| 文件 | 操作类型 | 风险等级 | 回滚难度 |
|------|---------|---------|---------|
| fix_start_game_initialize_private_hands.sql | CREATE_FUNCTION | 低 | 简单 |
| add_move_validation.sql | CREATE_FUNCTION | 低 | 简单 |
| add_validation_to_submit_turn.sql | CREATE_FUNCTION | 低 | 简单 |
| add_level_rank_column.sql | ALTER_TABLE | 低 | 简单 |
| fix_level_rank_default.sql | ALTER_TABLE | 低 | 简单 |

---

## 支持

如有问题，请检查：
1. Supabase Dashboard SQL Editor 的执行日志
2. 浏览器控制台的错误信息
3. 项目的 GitHub Issues
