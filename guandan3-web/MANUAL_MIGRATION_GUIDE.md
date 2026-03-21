# Guandan3 数据库迁移手动执行指南

## 概述

由于网络连接问题无法安装 Supabase CLI，本指南提供了手动执行数据库迁移的步骤。

## 项目信息

- **项目 ID**: rzzywltxlfgucngfiznx
- **项目 URL**: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx
- **迁移文件数量**: 24 个

## 方法 1: 使用合并后的迁移文件（推荐）

### 步骤

1. **打开 Supabase SQL 编辑器**
   - 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/sql

2. **复制迁移文件**
   - 打开项目根目录下的 `all-migrations.sql` 文件
   - 复制全部内容

3. **执行迁移**
   - 将内容粘贴到 SQL 编辑器中
   - 点击 "Run" 按钮执行

4. **检查结果**
   - 查看执行结果，确保没有错误
   - 如果有错误，请使用方法 2 逐个执行

## 方法 2: 逐个执行迁移文件

### 步骤

1. **打开 Supabase SQL 编辑器**
   - 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/sql

2. **按顺序执行迁移**
   - 迁移文件位于: `supabase/migrations/` 目录
   - 按文件名顺序逐个执行

3. **迁移文件列表**
   ```
   1. 20240311000000_init_schema.sql
   2. 20240311000001_add_start_game.sql
   3. 20240311000002_fix_rls.sql
   4. 20240311000003_allow_ai_moves.sql
   5. 20240311000004_fix_submit_turn_debug.sql
   6. 20240311000005_get_ai_hand.sql
   7. 20240311000007_game_finish_logic.sql
   8. 20240311000008_enable_realtime.sql
   9. 20240312000000_add_pvp_support.sql
   10. 20240312000001_add_ready_logic.sql
   11. 20240312000002_add_leave_room.sql
   12. 20240312000003_fix_start_game_seed.sql
   13. 20240312000004_enable_realtime_pvp.sql
   14. 20240312000005_test_helper_endgame.sql
   15. 20240312000006_fix_empty_hand_null_bug.sql
   16. 20240312000007_fix_endgame_turn_no.sql
   17. 20240312000008_start_game_rematch_guard.sql
   18. 20240312000009_fix_join_room_reconnect.sql
   19. 20240312000010_member_heartbeat_offline.sql
   20. 20240312000011_get_turns_since.sql
   21. 20240312000012_fix_offline_sweep_ai.sql
   22. 20240312000013_restrict_sweep_to_owner.sql
   23. 20240314000001_optimize_submit_turn.sql
   24. 20260313000000_dynamic_level_rank.sql
   ```

## 迁移后步骤

### 1. 生成 TypeScript 类型定义

由于 Supabase CLI 未安装，需要手动生成类型定义：

**选项 A: 使用 Supabase Dashboard**
1. 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/database/tables
2. 查看表结构，手动创建类型定义
3. 将类型定义保存到: `src/lib/supabase/types.ts`

**选项 B: 安装 Supabase CLI 后生成**
```bash
# 安装 Supabase CLI（网络恢复后）
npm install -g supabase

# 链接到项目
supabase link --project-ref rzzywltxlfgucngfiznx

# 生成类型定义
supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 2. 验证迁移结果

1. **检查表是否创建成功**
   - 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/database/tables
   - 确认以下表存在:
     - rooms
     - members
     - games
     - turns
     - player_hands
     - ai_hands

2. **检查函数是否创建成功**
   - 访问: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/database/functions
   - 确认以下函数存在:
     - start_game
     - submit_turn
     - get_ai_hand
     - finish_game
     - 等等...

3. **测试数据库连接**
   - 运行应用: `npm run dev`
   - 检查控制台是否有连接错误

## 故障排除

### 问题 1: 迁移执行失败

**解决方案**:
- 使用方法 2 逐个执行迁移
- 检查错误消息，确定是哪个迁移失败
- 某些迁移可能依赖于前面的迁移，确保按顺序执行

### 问题 2: 表已存在错误

**解决方案**:
- 如果表已存在，可以跳过该迁移
- 或者先删除表，然后重新执行迁移

### 问题 3: 权限错误

**解决方案**:
- 确保使用的是项目所有者账户
- 检查数据库权限设置

## 下一步

迁移完成后，可以继续以下步骤：

1. **部署前端到 Vercel**
   - 参考: `SUPABASE_DEPLOYMENT_GUIDE.md`

2. **配置环境变量**
   - 在 Vercel 中配置 Supabase 环境变量

3. **测试应用**
   - 验证所有功能正常工作

## 相关文件

- `all-migrations.sql` - 合并后的所有迁移文件
- `supabase/migrations/` - 单个迁移文件目录
- `scripts/merge-migrations.js` - 迁移文件合并脚本
- `scripts/show-db-info.js` - 数据库信息查看脚本
- `SUPABASE_DEPLOYMENT_GUIDE.md` - Supabase 部署指南

## 联系支持

如果遇到问题，可以：
1. 查看 Supabase 文档: https://supabase.com/docs
2. 检查项目日志: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/logs
3. 联系 Supabase 支持