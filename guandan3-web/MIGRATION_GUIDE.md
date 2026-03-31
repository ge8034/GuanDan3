# 数据库迁移指南

本文档记录了 guandan3-web 项目的数据库迁移操作。

---

## 最近修复

### 2026-03-31: submit_turn 类型转换错误

**问题**: 出牌时返回 400 错误
```
cannot cast type jsonb to integer[]
```

**原因**: `counts` 字段类型转换逻辑不正确

**修复**: 创建迁移 `20260331000006_fix_counts_type_cast.sql`

**状态**: ✅ 已应用

---

## 应用迁移

### 方法 1: 使用脚本（推荐）

```bash
# Windows (Git Bash)
node scripts/apply-submit-turn-fix-pg.js

# 或使用 npx
npx ts-node scripts/apply-submit-turn-fix-pg.js
```

### 方法 2: 手动执行 SQL

1. 登录 Supabase Dashboard
2. 进入 SQL Editor
3. 粘贴迁移文件内容
4. 点击 Run

---

## 环境变量

确保 `.env.local` 包含：
```
DATABASE_URL=postgresql://...
```

从 Supabase Dashboard → Project Settings → Database 获取连接字符串。
