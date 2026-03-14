# 最终部署检查清单

## 部署前准备

### ✅ 已完成的准备工作

- [x] 创建 Fly.io 配置文件 (fly.toml)
- [x] 创建 Docker 配置文件 (Dockerfile)
- [x] 创建环境变量模板 (.env.production.example)
- [x] 创建部署脚本 (pre-deploy, deploy, post-deploy)
- [x] 创建本地部署脚本 (deploy-local)
- [x] 配置 Sentry 监控
- [x] 创建 API 路由和健康检查
- [x] 创建性能测试脚本
- [x] 创建完整的文档体系
- [x] 提交所有代码到 Git

### 📋 需要手动完成的步骤

#### 1. 环境变量配置

- [ ] 复制环境变量模板
  ```powershell
  Copy-Item .env.production.example .env.production
  ```

- [ ] 编辑 `.env.production` 文件，填入实际值：
  - [ ] `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务角色密钥
  - [ ] `DATABASE_URL` - 数据库连接字符串
  - [ ] `NEXT_PUBLIC_APP_URL` - 应用 URL
  - [ ] `NEXT_PUBLIC_SENTRY_DSN` - Sentry DSN (可选)
  - [ ] `SENTRY_AUTH_TOKEN` - Sentry 认证令牌 (可选)

#### 2. 本地测试部署

- [ ] 运行部署前检查
  ```powershell
  .\scripts\pre-deploy-check.ps1
  ```

- [ ] 运行本地部署
  ```powershell
  .\scripts\deploy-local.ps1
  ```

- [ ] 验证应用功能
  - [ ] 访问 http://localhost:3000
  - [ ] 测试游戏功能
  - [ ] 检查健康检查端点 /api/health
  - [ ] 验证数据库连接

#### 3. 生产环境部署 (可选)

如果需要部署到 Fly.io：

- [ ] 安装 Fly.io CLI
  ```powershell
  iwr https://fly.io/install.ps1 -useb | iex
  ```

- [ ] 登录 Fly.io
  ```powershell
  flyctl auth login
  ```

- [ ] 创建 Fly.io 应用
  ```powershell
  flyctl apps create guandan3-web
  ```

- [ ] 配置 Fly.io secrets
  ```powershell
  flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=...
  flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
  flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=...
  flyctl secrets set DATABASE_URL=...
  flyctl secrets set NEXT_PUBLIC_APP_URL=...
  ```

- [ ] 部署到 Fly.io
  ```powershell
  .\scripts\deploy-production.ps1
  ```

- [ ] 验证部署
  ```powershell
  .\scripts\post-deploy-verify.ps1 -AppUrl "https://guandan3-web.fly.dev"
  ```

#### 4. 数据库迁移

- [ ] 运行数据库迁移
  ```powershell
  supabase db push
  ```

- [ ] 验证 RLS 策略
  ```powershell
  supabase db test
  ```

#### 5. 监控配置

- [ ] 配置 Sentry 项目
- [ ] 设置错误告警
- [ ] 配置性能监控
- [ ] 测试错误追踪

## 部署后验证

### 功能验证

- [ ] 应用可正常访问
- [ ] 用户可以创建房间
- [ ] 游戏功能正常工作
- [ ] AI 玩家正常响应
- [ ] 聊天功能正常
- [ ] 历史记录功能正常

### 性能验证

- [ ] 页面加载时间 < 3秒
- [ ] API 响应时间 < 500ms
- [ ] 数据库查询优化
- [ ] 内存使用正常

### 安全验证

- [ ] HTTPS 正常工作
- [ ] 环境变量安全
- [ ] RLS 策略生效
- [ ] CORS 配置正确

## 文档检查

- [x] 部署指南 (DEPLOYMENT_GUIDE.md)
- [x] 部署状态 (DEPLOYMENT_STATUS.md)
- [x] 最终部署总结 (docs/FINAL_DEPLOYMENT_SUMMARY.md)
- [x] 部署检查清单 (docs/DEPLOYMENT_CHECKLIST.md)
- [x] 回滚计划 (docs/ROLLBACK_PLAN.md)
- [x] 环境变量指南 (docs/ENVIRONMENT_VARIABLES_GUIDE.md)
- [x] 部署脚本指南 (docs/DEPLOYMENT_SCRIPTS_GUIDE.md)
- [x] Sentry 设置指南 (docs/SENTRY_SETUP.md)
- [x] 性能测试指南 (docs/PERFORMANCE_TESTING.md)

## 快速开始指南

### 本地测试部署

```powershell
# 1. 配置环境变量
Copy-Item .env.production.example .env.production
# 编辑 .env.production 文件

# 2. 运行部署前检查
.\scripts\pre-deploy-check.ps1

# 3. 本地部署
.\scripts\deploy-local.ps1

# 4. 访问应用
# http://localhost:3000
```

### 生产环境部署

```powershell
# 1. 安装 Fly.io CLI
iwr https://fly.io/install.ps1 -useb | iex

# 2. 登录
flyctl auth login

# 3. 配置环境变量
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=...
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=...
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=...
flyctl secrets set DATABASE_URL=...
flyctl secrets set NEXT_PUBLIC_APP_URL=...

# 4. 部署
.\scripts\deploy-production.ps1

# 5. 验证
.\scripts\post-deploy-verify.ps1 -AppUrl "https://guandan3-web.fly.dev"
```

## 故障排除

### 常见问题

1. **构建失败**
   - 检查 Node.js 版本
   - 清理缓存: `npm cache clean --force`
   - 重新安装依赖: `rm -rf node_modules && npm install`

2. **环境变量错误**
   - 验证 `.env.production` 文件格式
   - 检查变量名称拼写
   - 确认 Supabase 凭证有效

3. **数据库连接失败**
   - 验证 DATABASE_URL 格式
   - 检查 Supabase 项目状态
   - 确认网络连接

4. **应用无法访问**
   - 检查健康检查端点
   - 查看应用日志
   - 检查防火墙设置

## 联系信息

- **项目文档**: `docs/` 目录
- **部署指南**: [DEPLOYMENT_GUIDE.md](file:///d:\Learn-Claude\GuanDan3\guandan3-web\DEPLOYMENT_GUIDE.md)
- **部署状态**: [DEPLOYMENT_STATUS.md](file:///d:\Learn-Claude\GuanDan3\guandan3-web\DEPLOYMENT_STATUS.md)
- **脚本位置**: `scripts/` 目录

## 总结

GuanDan3 项目的部署基础设施已完全准备就绪。所有必要的配置、脚本和文档都已创建并提交到 Git。

**推荐路径:**
1. ✅ 配置 `.env.production` 文件
2. ✅ 运行本地部署测试
3. ✅ 验证所有功能正常
4. ⏭️ 安装 Fly.io CLI (可选)
5. ⏭️ 执行生产环境部署 (可选)

项目已准备好进行部署！
