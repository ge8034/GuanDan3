# 环境变量配置指南

## 概述

本文档详细说明了 GuanDan3 项目所需的所有环境变量及其配置方法。

## 环境变量文件

### 开发环境

- **文件名**: `.env.local`
- **用途**: 本地开发环境
- **状态**: 已添加到 `.gitignore`，不会提交到版本控制

### 生产环境

- **文件名**: `.env.production`
- **用途**: 生产环境
- **状态**: 已添加到 `.gitignore`，不会提交到版本控制
- **配置方式**: 通过 Fly.io secrets 或 GitHub Secrets

### 示例文件

- **文件名**: `.env.production.example`
- **用途**: 环境变量模板
- **状态**: 已提交到版本控制

## 必需的环境变量

### 1. 应用配置

#### NODE_ENV

**类型**: string
**默认值**: `production`
**说明**: 应用运行环境

**可选值**:
- `development` - 开发环境
- `production` - 生产环境
- `test` - 测试环境

**示例**:
```env
NODE_ENV=production
```

#### NEXT_PUBLIC_APP_URL

**类型**: string
**必需**: 是
**说明**: 应用的公开 URL

**示例**:
```env
NEXT_PUBLIC_APP_URL=https://guandan3.example.com
```

**注意**:
- 必须以 `http://` 或 `https://` 开头
- 不要以 `/` 结尾
- 生产环境必须使用 HTTPS

### 2. Supabase 配置

#### NEXT_PUBLIC_SUPABASE_URL

**类型**: string
**必需**: 是
**说明**: Supabase 项目的 URL

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "API"
4. 复制 "Project URL"

**示例**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

#### NEXT_PUBLIC_SUPABASE_ANON_KEY

**类型**: string
**必需**: 是
**说明**: Supabase 匿名访问密钥（公开）

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "API"
4. 复制 "anon public" key

**示例**:
```env
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意**:
- 此密钥是公开的，可以暴露在客户端
- 不要使用 `service_role` 密钥作为此值

#### SUPABASE_SERVICE_ROLE_KEY

**类型**: string
**必需**: 否（仅服务器端需要）
**说明**: Supabase 服务角色密钥（私有）

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "API"
4. 复制 "service_role" key

**示例**:
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**注意**:
- 此密钥是私密的，只能在服务器端使用
- 拥有完全访问权限，请妥善保管

### 3. Sentry 配置

#### NEXT_PUBLIC_SENTRY_DSN

**类型**: string
**必需**: 是
**说明**: Sentry 数据源名称（公开）

**获取方式**:
1. 登录 [Sentry Dashboard](https://sentry.io/)
2. 创建或选择你的项目
3. 进入 "Settings" → "Client Keys (DSN)"
4. 复制 DSN

**示例**:
```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

#### SENTRY_AUTH_TOKEN

**类型**: string
**必需**: 是
**说明**: Sentry 认证令牌（私有）

**获取方式**:
1. 登录 [Sentry Dashboard](https://sentry.io/)
2. 点击右上角用户头像
3. 选择 "User Settings" → "Auth Tokens"
4. 点击 "Create New Token"
5. 输入 token 名称并选择权限
6. 复制生成的 token

**示例**:
```env
SENTRY_AUTH_TOKEN=sntrys_your-token-here
```

#### NEXT_PUBLIC_SENTRY_ENVIRONMENT

**类型**: string
**默认值**: `production`
**说明**: Sentry 环境名称

**示例**:
```env
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production
```

#### SENTRY_TRACES_SAMPLE_RATE

**类型**: number
**默认值**: `0.1`
**说明**: Sentry 性能追踪采样率（0-1）

**示例**:
```env
SENTRY_TRACES_SAMPLE_RATE=0.1
```

**建议**:
- 生产环境: `0.1` (10%)
- 开发环境: `1.0` (100%)

#### SENTRY_REPLAYS_SESSION_SAMPLE_RATE

**类型**: number
**默认值**: `0.1`
**说明**: Sentry 会话重放采样率（0-1）

**示例**:
```env
SENTRY_REPLAYS_SESSION_SAMPLE_RATE=0.1
```

#### SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE

**类型**: number
**默认值**: `1.0`
**说明**: Sentry 错误会话重放采样率（0-1）

**示例**:
```env
SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE=1.0
```

### 4. Fly.io 配置

#### FLY_APP_NAME

**类型**: string
**必需**: 是
**说明**: Fly.io 应用名称

**示例**:
```env
FLY_APP_NAME=guandan3
```

#### FLY_REGION

**类型**: string
**默认值**: `iad`
**说明**: Fly.io 部署区域

**可选值**:
- `iad` - 美国东部（弗吉尼亚）
- `ord` - 美国中部（芝加哥）
- `dfw` - 美国南部（达拉斯）
- `sea` - 美国西部（西雅图）
- `lax` - 美国西部（洛杉矶）
- `sjc` - 美国西部（圣何塞）
- `cdg` - 欧洲（巴黎）
- `fra` - 欧洲（法兰克福）
- `ams` - 欧洲（阿姆斯特丹）
- `lhr` - 欧洲（伦敦）
- `nrt` - 亚洲（东京）
- `sin` - 亚洲（新加坡）
- `syd` - 大洋洲（悉尼）

**示例**:
```env
FLY_REGION=iad
```

### 5. 数据库配置

#### DATABASE_URL

**类型**: string
**必需**: 是
**说明**: 数据库连接字符串

**格式**:
```
postgresql://[user]:[password]@[host]:[port]/[database]
```

**示例**:
```env
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres
```

**注意**:
- 密码中包含特殊字符时需要进行 URL 编码
- 生产环境必须使用 SSL 连接

#### DATABASE_POOL_SIZE

**类型**: number
**默认值**: `10`
**说明**: 数据库连接池大小

**示例**:
```env
DATABASE_POOL_SIZE=10
```

## 可选的环境变量

### 1. Redis 配置

#### REDIS_URL

**类型**: string
**必需**: 否
**说明**: Redis 连接 URL

**示例**:
```env
REDIS_URL=redis://localhost:6379
```

### 2. 邮件配置

#### SMTP_HOST

**类型**: string
**必需**: 否
**说明**: SMTP 服务器地址

**示例**:
```env
SMTP_HOST=smtp.example.com
```

#### SMTP_PORT

**类型**: number
**默认值**: `587`
**说明**: SMTP 服务器端口

**示例**:
```env
SMTP_PORT=587
```

#### SMTP_USER

**类型**: string
**必需**: 否
**说明**: SMTP 用户名

**示例**:
```env
SMTP_USER=your-email@example.com
```

#### SMTP_PASSWORD

**类型**: string
**必需**: 否
**说明**: SMTP 密码

**示例**:
```env
SMTP_PASSWORD=your-smtp-password
```

#### SMTP_FROM

**类型**: string
**必需**: 否
**说明**: 发件人邮箱地址

**示例**:
```env
SMTP_FROM=noreply@guandan3.example.com
```

#### SMTP_FROM_NAME

**类型**: string
**必需**: 否
**说明**: 发件人名称

**示例**:
```env
SMTP_FROM_NAME=GuanDan3
```

### 3. 认证配置

#### JWT_SECRET

**类型**: string
**必需**: 否
**说明**: JWT 签名密钥

**生成方式**:
```bash
openssl rand -base64 32
```

**示例**:
```env
JWT_SECRET=your-jwt-secret-here
```

**注意**:
- 必须使用强随机密钥
- 不要在代码中硬编码
- 定期轮换密钥

#### JWT_EXPIRES_IN

**类型**: number
**默认值**: `3600`
**说明**: JWT 过期时间（秒）

**示例**:
```env
JWT_EXPIRES_IN=3600
```

### 4. 文件上传配置

#### MAX_FILE_SIZE

**类型**: number
**默认值**: `10485760` (10MB)
**说明**: 最大文件大小（字节）

**示例**:
```env
MAX_FILE_SIZE=10485760
```

#### ALLOWED_FILE_TYPES

**类型**: string
**默认值**: `image/jpeg,image/png,image/gif`
**说明**: 允许的文件类型（逗号分隔）

**示例**:
```env
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif
```

### 5. 速率限制配置

#### RATE_LIMIT_MAX

**类型**: number
**默认值**: `100`
**说明**: 每分钟最大请求数

**示例**:
```env
RATE_LIMIT_MAX=100
```

#### RATE_LIMIT_WINDOW

**类型**: number
**默认值**: `1`
**说明**: 速率限制窗口（分钟）

**示例**:
```env
RATE_LIMIT_WINDOW=1
```

### 6. 日志配置

#### LOG_LEVEL

**类型**: string
**默认值**: `info`
**说明**: 日志级别

**可选值**:
- `error` - 仅错误
- `warn` - 警告和错误
- `info` - 信息、警告和错误
- `debug` - 所有日志

**示例**:
```env
LOG_LEVEL=info
```

#### LOG_FORMAT

**类型**: string
**默认值**: `json`
**说明**: 日志格式

**可选值**:
- `json` - JSON 格式
- `text` - 文本格式

**示例**:
```env
LOG_FORMAT=json
```

### 7. 功能开关

#### ENABLE_REGISTRATION

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用用户注册

**示例**:
```env
ENABLE_REGISTRATION=true
```

#### ENABLE_CHAT

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用聊天功能

**示例**:
```env
ENABLE_CHAT=true
```

#### ENABLE_FRIENDS

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用好友系统

**示例**:
```env
ENABLE_FRIENDS=true
```

#### ENABLE_LEADERBOARD

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用排行榜

**示例**:
```env
ENABLE_LEADERBOARD=true
```

### 8. 监控配置

#### ENABLE_PERFORMANCE_MONITORING

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用性能监控

**示例**:
```env
ENABLE_PERFORMANCE_MONITORING=true
```

#### ENABLE_ERROR_MONITORING

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用错误监控

**示例**:
```env
ENABLE_ERROR_MONITORING=true
```

### 9. CDN 配置

#### CDN_URL

**类型**: string
**必需**: 否
**说明**: CDN URL

**示例**:
```env
CDN_URL=https://cdn.guandan3.example.com
```

### 10. 第三方服务配置

#### NEXT_PUBLIC_GA_ID

**类型**: string
**必需**: 否
**说明**: Google Analytics ID

**示例**:
```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

#### NEXT_PUBLIC_FB_PIXEL_ID

**类型**: string
**必需**: 否
**说明**: Facebook Pixel ID

**示例**:
```env
NEXT_PUBLIC_FB_PIXEL_ID=1234567890
```

### 11. 安全配置

#### CORS_ALLOWED_ORIGINS

**类型**: string
**默认值**: 应用 URL
**说明**: CORS 允许的源（逗号分隔）

**示例**:
```env
CORS_ALLOWED_ORIGINS=https://guandan3.example.com,https://www.guandan3.example.com
```

#### ENABLE_CSP

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用内容安全策略

**示例**:
```env
ENABLE_CSP=true
```

#### ENABLE_HSTS

**类型**: boolean
**默认值**: `true`
**说明**: 是否启用 HTTP 严格传输安全

**示例**:
```env
ENABLE_HSTS=true
```

### 12. 维护模式

#### MAINTENANCE_MODE

**类型**: boolean
**默认值**: `false`
**说明**: 是否启用维护模式

**示例**:
```env
MAINTENANCE_MODE=false
```

#### MAINTENANCE_MESSAGE

**类型**: string
**默认值**: `系统维护中，请稍后再试`
**说明**: 维护模式消息

**示例**:
```env
MAINTENANCE_MESSAGE=系统维护中，请稍后再试
```

## 配置方法

### 本地开发环境

1. 复制示例文件：
```bash
cp .env.production.example .env.local
```

2. 编辑 `.env.local` 文件，填入实际值

3. 重启开发服务器

### Fly.io 生产环境

#### 方法 1: 使用 Fly.io CLI

```bash
# 设置单个环境变量
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co

# 设置多个环境变量
flyctl secrets set \
  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# 查看所有环境变量
flyctl secrets list

# 删除环境变量
flyctl secrets unset VARIABLE_NAME
```

#### 方法 2: 使用部署脚本

```bash
# 使用 PowerShell
.\scripts\deploy-production.ps1

# 使用 Bash
./scripts/deploy-production.sh
```

### GitHub Actions

环境变量通过 GitHub Secrets 配置，详见 [GitHub Secrets 配置指南](./GITHUB_SECRETS_GUIDE.md)。

## 验证配置

### 本地验证

```bash
# 检查环境变量文件
cat .env.local

# 验证必需的环境变量
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"
```

### 生产验证

```bash
# 检查 Fly.io 环境变量
flyctl secrets list

# 检查应用日志
flyctl logs
```

## 安全最佳实践

### 1. 敏感信息保护

- ✅ 不要将 `.env.local` 或 `.env.production` 提交到版本控制
- ✅ 使用 `.gitignore` 忽略环境变量文件
- ✅ 定期轮换敏感密钥和令牌
- ✅ 使用强随机密钥

### 2. 访问控制

- ✅ 限制环境变量的访问权限
- ✅ 使用最小权限原则
- ✅ 定期审查访问权限

### 3. 监控和审计

- ✅ 监控环境变量的使用情况
- ✅ 记录环境变量的变更
- ✅ 设置异常告警

### 4. 备份和恢复

- ✅ 在安全的地方备份环境变量
- ✅ 制定恢复流程
- ✅ 定期测试恢复流程

## 故障排除

### 问题 1: 环境变量未生效

**症状**: 应用无法读取环境变量

**解决方案**:
1. 检查环境变量文件名是否正确
2. 确认环境变量格式正确（KEY=VALUE）
3. 重启应用服务器
4. 检查是否有语法错误

### 问题 2: 敏感信息泄露

**症状**: 怀疑环境变量已泄露

**解决方案**:
1. 立即轮换泄露的密钥
2. 更新所有相关配置
3. 审查访问日志
4. 加强安全措施

### 问题 3: Fly.io secrets 未生效

**症状**: Fly.io 应用无法读取环境变量

**解决方案**:
1. 检查 secrets 是否正确设置
2. 重新部署应用
3. 检查应用日志
4. 联系 Fly.io 支持

## 相关文档

- [GitHub Secrets 配置指南](./GITHUB_SECRETS_GUIDE.md)
- [部署前检查清单](./DEPLOYMENT_CHECKLIST.md)
- [部署指南](./DEPLOYMENT.md)

## 联系支持

如有问题，请联系：
- 技术支持: support@example.com
- DevOps 团队: devops@example.com

---

**最后更新**: 2026-03-14
**版本**: 1.0.0
