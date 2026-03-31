# 数据库迁移执行指南

由于数据库连接失败，请按以下步骤手动执行迁移。

## 验证结果

所有 5 个迁移文件已通过 SQL 验证：

| 文件 | 状态 | 操作类型 |
|------|------|----------|
| 20260330000003_fix_start_game_initialize_private_hands.sql | ✅ 通过 | CREATE_FUNCTION, DROP_FUNCTION, GRANT, INSERT, UPDATE |
| 20260331000001_add_move_validation.sql | ✅ 通过 | CREATE_FUNCTION, INSERT, UPDATE |
| 20260331000002_add_validation_to_submit_turn.sql | ✅ 通过 | CREATE_FUNCTION, DROP_FUNCTION, INSERT, UPDATE |
| 20260331000003_add_level_rank_column.sql | ✅ 通过 | ALTER_TABLE, UPDATE |
| 20260331000004_fix_level_rank_default.sql | ✅ 通过 | CREATE_FUNCTION, DROP_FUNCTION, INSERT, UPDATE |

## 手动执行步骤

### 方式一：Supabase Dashboard（推荐）

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 按顺序执行以下迁移文件

### 方式二：使用 psql 命令行

```bash
# 设置数据库连接字符串
export DB_URL="postgresql://postgres.[project-ref]:[password]@db.[project-ref].supabase.co:5432/postgres"

# 按顺序执行迁移
psql $DB_URL -f supabase/migrations/20260330000003_fix_start_game_initialize_private_hands.sql
psql $DB_URL -f supabase/migrations/20260331000001_add_move_validation.sql
psql $DB_URL -f supabase/migrations/20260331000002_add_validation_to_submit_turn.sql
psql $DB_URL -f supabase/migrations/20260331000003_add_level_rank_column.sql
psql $DB_URL -f supabase/migrations/20260331000004_fix_level_rank_default.sql
```

## 验证执行结果

执行后，运行以下 SQL 检查：

```sql
-- 检查新增函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 检查表结构变更
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'games'
  AND column_name = 'level_rank'
ORDER BY ordinal_position;
```

## 回滚脚本

回滚脚本已生成在 `supabase/rollback/` 目录，按相反顺序执行即可撤销迁移。
