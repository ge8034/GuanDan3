# GuanDan3 数据库迁移指南

## 概述

由于 Supabase CLI 不可用，需要通过 Supabase Dashboard 手动执行数据库迁移。

## 项目信息

- **项目 ID**: rzzywltxlfgucngfiznx
- **Supabase URL**: https://rzzywltxlfgucngfiznx.supabase.co
- **Dashboard**: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx

## 迁移文件列表 (共 24 个)

1. 20240311000000_init_schema.sql - 初始化数据库架构
2. 20240311000001_add_start_game.sql - 添加开始游戏功能
3. 20240311000002_fix_rls.sql - 修复行级安全策略
4. 20240311000003_allow_ai_moves.sql - 允许 AI 移动
5. 20240311000004_fix_submit_turn_debug.sql - 修复提交回合调试
6. 20240311000005_get_ai_hand.sql - 获取 AI 手牌
7. 20240311000007_game_finish_logic.sql - 游戏结束逻辑
8. 20240311000008_enable_realtime.sql - 启用实时功能
9. 20240312000000_add_pvp_support.sql - 添加 PvP 支持
10. 20240312000001_add_ready_logic.sql - 添加准备逻辑
11. 20240312000002_add_leave_room.sql - 添加离开房间功能
12. 20240312000003_fix_start_game_seed.sql - 修复开始游戏种子
13. 20240312000004_enable_realtime_pvp.sql - 启用 PvP 实时功能
14. 20240312000005_test_helper_endgame.sql - 测试辅助结束游戏
15. 20240312000006_fix_empty_hand_null_bug.sql - 修复空手牌 null 错误
16. 20240312000007_fix_endgame_turn_no.sql - 修复结束游戏回合号
17. 20240312000008_start_game_rematch_guard.sql - 开始游戏重赛保护
18. 20240312000009_fix_join_room_reconnect.sql - 修复加入房间重连
19. 20240312000010_member_heartbeat_offline.sql - 成员心跳离线
20. 20240312000011_get_turns_since.sql - 获取指定回合后的数据
21. 20240312000012_fix_offline_sweep_ai.sql - 修复离线清理 AI
22. 20240312000013_restrict_sweep_to_owner.sql - 限制清理操作给所有者
23. 20240314000001_optimize_submit_turn.sql - 优化提交回合
24. 20260313000000_dynamic_level_rank.sql - 动态等级排名

## 执行步骤

### 方法 1: 通过 Supabase Dashboard (推荐)

1. **打开 Supabase Dashboard**
   - 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx

2. **进入 SQL Editor**
   - 在左侧菜单中找到 "SQL Editor"
   - 点击 "New query" 创建新查询

3. **执行迁移文件**
   - 按照上面的顺序，依次打开每个迁移文件
   - 复制文件内容到 SQL Editor
   - 点击 "Run" 执行
   - 确认每个迁移都成功执行

4. **验证迁移结果**
   - 在 "Table Editor" 中查看创建的表
   - 确认所有表和函数都已正确创建

### 方法 2: 使用 Supabase CLI (如果可用)

如果您安装了 Supabase CLI，可以使用以下命令：

```bash
# 链接到项目
supabase link --project-ref rzzywltxlfgucngfiznx

# 推送所有迁移
supabase db push

# 生成 TypeScript 类型
supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 方法 3: 使用辅助脚本

项目提供了辅助脚本来查看迁移信息：

```bash
# 查看迁移文件列表和说明
node scripts/run-migrations-direct.js
```

## 重要注意事项

### ⚠️ 数据备份

在执行迁移之前，建议先备份现有数据：

1. 在 Supabase Dashboard 中进入 "Database"
2. 点击 "Backups"
3. 创建新的备份

### ⚠️ 迁移顺序

**必须按照上面的顺序执行迁移**，因为后面的迁移可能依赖前面的表结构。

### ⚠️ 初始化迁移

第一个迁移文件 `20240311000000_init_schema.sql` 包含 `DROP TABLE` 语句，会删除现有表。如果数据库中已有重要数据，请先备份。

## 验证迁移

迁移完成后，验证以下内容：

### 1. 检查表结构

在 Supabase Dashboard 的 "Table Editor" 中应该能看到以下表：

- `rooms` - 游戏房间
- `room_members` - 房间成员
- `games` - 游戏记录
- `game_hands` - 游戏手牌
- `turns` - 游戏回合
- `scores` - 游戏分数

### 2. 检查函数

在 SQL Editor 中运行：

```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public';
```

应该能看到各种游戏逻辑函数。

### 3. 检查 RLS 策略

```sql
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';
```

## 故障排除

### 问题 1: 迁移执行失败

**解决方案**:
- 检查错误信息
- 确保按照正确的顺序执行
- 检查是否有语法错误

### 问题 2: 表已存在错误

**解决方案**:
- 第一个迁移会删除现有表，这是正常的
- 如果不想删除数据，请手动修改迁移文件

### 问题 3: 权限错误

**解决方案**:
- 确保您有足够的权限
- 使用项目所有者账户登录

## 下一步

迁移完成后：

1. **生成 TypeScript 类型** (如果使用 Supabase CLI)
   ```bash
   supabase gen types typescript --local > src/lib/supabase/types.ts
   ```

2. **测试应用**
   ```bash
   npm run dev
   ```

3. **部署到 Vercel**
   - 按照 SUPABASE_DEPLOYMENT_GUIDE.md 中的说明进行部署

## 最新迁移 - 服务端牌型验证 (2026-03-31)

### 问题说明

**规则机制失效的根本原因**：服务端 `submit_turn` 函数没有调用验证逻辑。

AI 可以提交无效的牌型组合（如 "3个J+3个Q+3个K+4个3+1个7+1个8"），因为服务端只做了基本的回合检查，没有验证牌型是否符合掼蛋规则。

### 迁移文件

**文件路径**: `supabase/migrations/20260331000002_add_validation_to_submit_turn.sql`

### 执行步骤

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx)
2. 进入 **SQL Editor**
3. 点击 **New Query**
4. 复制迁移文件内容并粘贴
5. 点击 **Run** 执行

### 验证规则

服务端验证函数 `validate_guandan_move` 检查以下规则：

1. **过牌 (Pass)** - 总是允许
2. **先手出牌** - 上家过牌时，任何牌型都允许
3. **炸弹规则**:
   - 炸弹（4张及以上相同点数）可以压任何非炸弹牌型
   - 炸弹对炸弹：张数多的赢
   - 炸弹对炸弹：张数相同时，点数大的赢
4. **非炸弹规则**:
   - 非炸弹不能压炸弹
   - 非炸弹必须与上家牌数相同

### 执行后效果

迁移执行成功后，以下无效牌型将被服务端拒绝：

- ❌ 飞机带翅膀（3个J+3个Q+3个K+4个3+1个7+1个8）
- ❌ 牌数不匹配的出牌
- ❌ 非炸弹压炸弹
- ❌ 更小的炸弹压更大的炸弹（同张数）

客户端将收到 `invalid_move` 错误，显示 "无效牌型或不满足掼蛋规则"。

## 联系支持

如果遇到问题：

- 查看 Supabase 文档: https://supabase.com/docs
- 查看项目文档: SUPABASE_DEPLOYMENT_GUIDE.md
- 检查迁移文件: supabase/migrations/