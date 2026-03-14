# GuanDan3 部署指南

## 前置要求

### 必需工具

1. **Node.js** (v18 或更高版本)
   ```bash
   node --version
   ```

2. **npm** (v9 或更高版本)
   ```bash
   npm --version
   ```

3. **Git**
   ```bash
   git --version
   ```

4. **Fly.io CLI** (flyctl)
   ```bash
   # Windows (使用 PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex

   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

5. **Docker** (可选，用于本地测试)
   ```bash
   docker --version
   ```

### 账户设置

1. **Fly.io 账户**
   - 访问 https://fly.io 注册账户
   - 登录 Fly.io CLI:
     ```bash
     flyctl auth login
     ```

2. **Supabase 账户**
   - 访问 https://supabase.com 注册账户
   - 创建新项目并获取凭证

3. **Sentry 账户** (可选，推荐)
   - 访问 https://sentry.io 注册账户
   - 创建新项目并获取 DSN

## 部署步骤

### 1. 环境配置

创建 `.env.production` 文件：

```bash
cp .env.production.example .env.production
```

编辑 `.env.production` 并填入实际值：

```env
# Supabase 配置
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# 应用配置
NEXT_PUBLIC_APP_URL=https://your-app.fly.dev

# Sentry 配置 (可选)
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_AUTH_TOKEN=your-auth-token
```

### 2. 部署前检查

运行部署前检查脚本：

**Windows PowerShell:**
```powershell
.\scripts\pre-deploy-check.ps1
```

**Linux/macOS Bash:**
```bash
./scripts/pre-deploy-check.sh
```

检查脚本会验证：
- 必需工具是否已安装
- 配置文件是否存在
- 环境变量是否设置
- 代码质量检查
- 构建是否成功

### 3. 创建 Fly.io 应用

如果这是第一次部署：

```bash
# 创建新应用
flyctl launch

# 或使用现有配置
flyctl apps create guandan3-web
```

### 4. 配置环境变量

```bash
# 设置 Supabase 环境变量
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
flyctl secrets set DATABASE_URL=postgresql://postgres:[password]@db.your-project.supabase.co:5432/postgres

# 设置应用环境变量
flyctl secrets set NEXT_PUBLIC_APP_URL=https://guandan3-web.fly.dev

# 设置 Sentry 环境变量 (可选)
flyctl secrets set NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
flyctl secrets set SENTRY_AUTH_TOKEN=your-auth-token
```

### 5. 部署应用

**使用部署脚本:**

**Windows PowerShell:**
```powershell
.\scripts\deploy-production.ps1
```

**Linux/macOS Bash:**
```bash
./scripts/deploy-production.sh
```

**手动部署:**
```bash
# 构建应用
npm run build

# 部署到 Fly.io
flyctl deploy

# 查看部署状态
flyctl status
```

### 6. 部署后验证

运行部署后验证脚本：

**Windows PowerShell:**
```powershell
.\scripts\post-deploy-verify.ps1 -AppUrl "https://guandan3-web.fly.dev"
```

**Linux/macOS Bash:**
```bash
./scripts/post-deploy-verify.sh --app-url "https://guandan3-web.fly.dev"
```

验证脚本会检查：
- 应用是否可访问
- 健康检查端点是否正常
- 关键功能是否工作
- 性能是否达标

### 7. 打开应用

```bash
# 在浏览器中打开应用
flyctl open

# 或直接访问
# https://guandan3-web.fly.dev
```

## 数据库迁移

如果需要运行数据库迁移：

```bash
# 使用 Supabase CLI
supabase db push

# 或直接在 Supabase Dashboard 中运行迁移文件
# supabase/migrations/20240314000001_optimize_submit_turn.sql
```

## 监控和日志

### 查看应用日志

```bash
# 实时日志
flyctl logs

# 历史日志
flyctl logs --tail 100

# 按实例过滤
flyctl logs --instance <instance-id>
```

### 查看应用状态

```bash
# 应用状态
flyctl status

# 应用指标
flyctl metrics

# 应用版本
flyctl releases
```

### Sentry 监控

访问 Sentry Dashboard 查看错误和性能数据：
- https://sentry.io

## 性能测试

运行性能测试脚本：

```bash
# 烟雾测试
k6 run k6/smoke-test.js

# 负载测试
k6 run k6/load-test.js
```

## 回滚

如果部署出现问题，可以快速回滚：

```bash
# 回滚到上一个版本
flyctl releases rollback

# 回滚到特定版本
flyctl releases rollback <version>

# 查看版本历史
flyctl releases list
```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本是否正确
   - 清理缓存: `npm cache clean --force`
   - 删除 node_modules: `rm -rf node_modules && npm install`

2. **部署失败**
   - 检查环境变量是否正确设置
   - 查看部署日志: `flyctl logs`
   - 检查 Dockerfile 配置

3. **应用无法访问**
   - 检查健康检查端点: `/api/health`
   - 查看应用日志: `flyctl logs`
   - 检查防火墙设置

4. **数据库连接失败**
   - 验证 DATABASE_URL 是否正确
   - 检查 Supabase 项目状态
   - 确认网络连接

### 获取帮助

- **Fly.io 文档**: https://fly.io/docs
- **Supabase 文档**: https://supabase.com/docs
- **Sentry 文档**: https://docs.sentry.io
- **项目文档**: `docs/` 目录

## 维护

### 定期任务

1. **每周**
   - 检查错误日志
   - 审查性能指标
   - 更新依赖

2. **每月**
   - 运行性能测试
   - 审查安全更新
   - 备份数据库

3. **每季度**
   - 更新 Node.js 版本
   - 审查和优化配置
   - 更新文档

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 更新依赖
npm install

# 运行测试
npm test

# 部署
flyctl deploy
```

## 安全建议

1. **环境变量**
   - 不要在代码中硬编码敏感信息
   - 使用 Fly.io secrets 管理敏感变量
   - 定期轮换密钥

2. **依赖管理**
   - 定期更新依赖包
   - 使用 `npm audit` 检查安全漏洞
   - 启用 Dependabot 自动更新

3. **访问控制**
   - 配置适当的 CORS 策略
   - 使用 Supabase RLS 保护数据
   - 启用 HTTPS

4. **监控**
   - 配置 Sentry 错误监控
   - 设置告警规则
   - 定期审查日志

## 成本优化

1. **Fly.io**
   - 使用自动扩展减少空闲成本
   - 选择合适的区域
   - 监控资源使用

2. **Supabase**
   - 选择合适的计划
   - 优化数据库查询
   - 定期清理数据

3. **Sentry**
   - 配置事件采样
   - 设置合理的保留策略
   - 过滤开发环境错误

## 联系信息

- **项目仓库**: [GitHub Repository]
- **文档位置**: `docs/` 目录
- **脚本位置**: `scripts/` 目录

祝部署顺利！
