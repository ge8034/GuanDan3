# Supabase 部署指南

本指南介绍如何将 GuanDan3 应用部署到 Vercel，使用 Supabase 作为后端数据库。

## 架构概述

- **前端**: Next.js 应用部署到 Vercel
- **后端**: Supabase 提供数据库、认证和实时功能
- **监控**: Sentry 用于错误追踪和性能监控

## 前置要求

### 1. 安装必要工具

```powershell
# 安装 Node.js (如果未安装)
# 下载: https://nodejs.org/

# 安装 Supabase CLI
npm install -g supabase

# 安装 Vercel CLI
npm install -g vercel
```

### 2. 准备 Supabase 项目

确保您已经有一个 Supabase 项目：
- 项目 ID: `rzzywltxlfgucngfiznx`
- 项目 URL: `https://rzzywltxlfgucngfiznx.supabase.co`

## 部署步骤

### 步骤 1: 配置环境变量

创建 `.env.production` 文件：

```powershell
Copy-Item .env.production.example .env.production
```

编辑 `.env.production` 文件，填入实际值：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://rzzywltxlfgucngfiznx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
DATABASE_URL=postgresql://postgres:[password]@db.rzzywltxlfgucngfiznx.supabase.co:5432/postgres

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production

# Sentry 配置（可选）
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
```

### 步骤 2: 部署数据库迁移

```powershell
# 链接到 Supabase 项目
supabase link --project-ref rzzywltxlfgucngfiznx

# 推送数据库迁移
supabase db push

# 生成 TypeScript 类型
supabase gen types typescript --local > src/lib/supabase/types.ts
```

或者使用部署脚本：

```powershell
.\scripts\deploy-supabase.ps1
```

### 步骤 3: 部署到 Vercel

#### 选项 A: 使用 Vercel CLI

```powershell
# 登录 Vercel
vercel login

# 部署到 Vercel
vercel --prod

# 按提示配置环境变量
```

#### 选项 B: 使用 Vercel Dashboard

1. 访问 https://vercel.com/new
2. 导入您的 Git 仓库
3. 配置环境变量：
   - `NEXT_PUBLIC_SUPABASE_URL`: `https://rzzywltxlfgucngfiznx.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 您的 Supabase 匿名密钥
   - `NEXT_PUBLIC_APP_URL`: 您的 Vercel 应用 URL
4. 点击 "Deploy"

### 步骤 4: 配置 Supabase 认证

在 Supabase Dashboard 中配置认证设置：

1. 访问 https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/auth/url-configuration
2. 配置重定向 URL：
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs: `https://your-app.vercel.app/**`

### 步骤 5: 配置 Supabase Realtime

启用 Realtime 功能：

1. 访问 https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx/database/replication
2. 启用以下表的 Realtime：
   - `rooms`
   - `turns`
   - `members`

### 步骤 6: 配置 RLS 策略

确保行级安全（RLS）策略已正确配置：

```sql
-- 检查 RLS 策略
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- 测试 RLS 策略
-- 运行测试文件
supabase test db
```

## 验证部署

### 1. 检查应用状态

访问您的 Vercel 应用 URL，验证：
- [ ] 应用可以正常加载
- [ ] 可以创建房间
- [ ] 游戏功能正常工作
- [ ] 实时更新正常

### 2. 检查数据库连接

```powershell
# 检查 Supabase 连接
supabase status

# 查看数据库日志
supabase db logs
```

### 3. 检查 Realtime 连接

在浏览器开发者工具中检查 WebSocket 连接：
- 打开 Network 标签
- 筛选 WS (WebSocket)
- 验证与 Supabase 的连接

## 监控和维护

### 应用监控

- **Vercel Dashboard**: 查看应用状态、部署历史、日志
- **Supabase Dashboard**: 查看数据库性能、查询分析、Realtime 连接
- **Sentry**: 错误追踪和性能监控

### 日志查看

```powershell
# Vercel 日志
vercel logs

# Supabase 数据库日志
supabase db logs

# Supabase Realtime 日志
supabase logs realtime
```

### 数据库备份

```powershell
# 创建数据库备份
supabase db dump -f backup.sql

# 恢复数据库
supabase db reset --db-url "postgresql://postgres:[password]@db.rzzywltxlfgucngfiznx.supabase.co:5432/postgres"
```

## 故障排除

### 常见问题

#### 1. 应用无法连接到 Supabase

**症状**: 应用显示连接错误

**解决方案**:
- 验证 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否正确
- 检查 Supabase 项目是否处于活跃状态
- 验证网络连接

#### 2. Realtime 不工作

**症状**: 游戏状态不实时更新

**解决方案**:
- 检查 Realtime 是否已启用
- 验证表的 Realtime 是否已启用
- 检查 RLS 策略是否允许 Realtime 访问

#### 3. RLS 策略阻止访问

**症状**: 用户无法访问数据

**解决方案**:
- 检查 RLS 策略配置
- 运行 `supabase test db` 验证策略
- 使用 Supabase Dashboard 检查策略

#### 4. 构建失败

**症状**: Vercel 部署失败

**解决方案**:
- 检查 Node.js 版本
- 清理缓存: `npm cache clean --force`
- 重新安装依赖: `rm -rf node_modules && npm install`

## 性能优化

### 数据库优化

1. **索引优化**
   ```sql
   -- 检查索引使用情况
   SELECT * FROM pg_stat_user_indexes;
   ```

2. **查询优化**
   ```sql
   -- 查看慢查询
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

### 应用优化

1. **启用缓存**
   - 使用 Next.js 缓存功能
   - 配置 CDN 缓存

2. **优化图片**
   - 使用 Next.js Image 组件
   - 配置图片优化

## 安全最佳实践

### 1. 环境变量安全

- 永远不要将敏感信息提交到 Git
- 使用 Vercel 环境变量存储密钥
- 定期轮换密钥

### 2. RLS 策略

- 确保所有表都启用了 RLS
- 定期审查 RLS 策略
- 使用最小权限原则

### 3. API 安全

- 验证所有用户输入
- 使用参数化查询
- 实施速率限制

## 回滚计划

### 应用回滚

```powershell
# 回滚到上一个部署
vercel rollback

# 回滚到特定部署
vercel rollback <deployment-url>
```

### 数据库回滚

```powershell
# 查看迁移历史
supabase migration list

# 回滚特定迁移
supabase migration down <migration-name>
```

## 扩展和升级

### 水平扩展

- Vercel 自动扩展
- Supabase 自动扩展（付费计划）

### 垂直扩展

- 升级 Supabase 计划以获得更多资源
- 配置更大的数据库实例

## 成本估算

### Vercel
- 免费计划: 100GB 带宽/月
- Pro 计划: $20/月

### Supabase
- 免费计划: 500MB 数据库
- Pro 计划: $25/月

## 联系信息

- **Vercel Dashboard**: https://vercel.com/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard/project/rzzywltxlfgucngfiznx
- **项目文档**: `docs/` 目录

## 总结

GuanDan3 应用已准备好部署到 Vercel + Supabase 架构。按照本指南的步骤，您可以快速完成部署并开始使用。

**推荐路径:**
1. ✅ 配置环境变量
2. ✅ 部署数据库迁移
3. ✅ 部署到 Vercel
4. ✅ 配置认证和 Realtime
5. ✅ 验证部署
6. ✅ 配置监控

祝您部署顺利！
