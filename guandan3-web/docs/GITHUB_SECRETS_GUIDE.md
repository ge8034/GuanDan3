# GitHub Secrets 配置指南

## 概述

本文档详细说明了如何为 GuanDan3 项目配置 GitHub Secrets，以便 CI/CD 流程能够正常运行。

## 必需的 GitHub Secrets

### 1. Fly.io 相关

#### FLY_API_TOKEN

**用途**: 用于 Fly.io 部署认证

**获取方式**:
1. 登录 [Fly.io Console](https://fly.io/dashboard)
2. 点击右上角用户头像
3. 选择 "Tokens"
4. 点击 "Create Token"
5. 输入 token 名称（如 "GitHub Actions"）
6. 选择权限（建议选择 "Full Access"）
7. 复制生成的 token

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `FLY_API_TOKEN`
5. Secret: 粘贴刚才复制的 token
6. 点击 "Add secret"

**验证**:
```bash
flyctl auth token
```

### 2. Supabase 相关

#### NEXT_PUBLIC_SUPABASE_URL

**用途**: Supabase 项目 URL（公开）

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "API"
4. 复制 "Project URL"

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `NEXT_PUBLIC_SUPABASE_URL`
5. Secret: 粘贴项目 URL
6. 点击 "Add secret"

#### NEXT_PUBLIC_SUPABASE_ANON_KEY

**用途**: Supabase 匿名访问密钥（公开）

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "API"
4. 复制 "anon public" key

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Secret: 粘贴 anon key
6. 点击 "Add secret"

#### SUPABASE_ACCESS_TOKEN

**用途**: Supabase 管理访问令牌（私有）

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 点击右上角用户头像
3. 选择 "Access Tokens"
4. 点击 "Generate new token"
5. 输入 token 名称（如 "GitHub Actions"）
6. 选择权限（建议选择 "Full Access"）
7. 复制生成的 token

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `SUPABASE_ACCESS_TOKEN`
5. Secret: 粘贴访问令牌
6. 点击 "Add secret"

#### SUPABASE_DB_URL

**用途**: Supabase 数据库连接字符串（私有）

**获取方式**:
1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 "Settings" → "Database"
4. 复制 "Connection string" (PostgreSQL)
5. 替换 `[YOUR-PASSWORD]` 为你的数据库密码

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `SUPABASE_DB_URL`
5. Secret: 粘贴数据库连接字符串
6. 点击 "Add secret"

**注意**: 数据库连接字符串格式：
```
postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 3. Sentry 相关

#### NEXT_PUBLIC_SENTRY_DSN

**用途**: Sentry 数据源名称（公开）

**获取方式**:
1. 登录 [Sentry Dashboard](https://sentry.io/)
2. 创建或选择你的项目
3. 进入 "Settings" → "Client Keys (DSN)"
4. 复制 DSN

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `NEXT_PUBLIC_SENTRY_DSN`
5. Secret: 粘贴 DSN
6. 点击 "Add secret"

#### SENTRY_AUTH_TOKEN

**用途**: Sentry 认证令牌（私有）

**获取方式**:
1. 登录 [Sentry Dashboard](https://sentry.io/)
2. 点击右上角用户头像
3. 选择 "User Settings" → "Auth Tokens"
4. 点击 "Create New Token"
5. 输入 token 名称（如 "GitHub Actions"）
6. 选择权限（建议选择 "project:releases" 和 "project:write"）
7. 复制生成的 token

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `SENTRY_AUTH_TOKEN`
5. Secret: 粘贴认证令牌
6. 点击 "Add secret"

### 4. 应用相关

#### NEXT_PUBLIC_APP_URL

**用途**: 应用公开 URL（公开）

**获取方式**:
- 如果使用 Fly.io: `https://your-app-name.fly.dev`
- 如果使用自定义域名: `https://your-domain.com`

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `NEXT_PUBLIC_APP_URL`
5. Secret: 粘贴应用 URL
6. 点击 "Add secret"

## 可选的 GitHub Secrets

### 1. 通知相关

#### SLACK_WEBHOOK_URL

**用途**: Slack 通知 Webhook URL

**获取方式**:
1. 在 Slack 中创建 Incoming Webhook
2. 复制 Webhook URL

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `SLACK_WEBHOOK_URL`
5. Secret: 粘贴 Webhook URL
6. 点击 "Add secret"

#### DISCORD_WEBHOOK_URL

**用途**: Discord 通知 Webhook URL

**获取方式**:
1. 在 Discord 中创建 Webhook
2. 复制 Webhook URL

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `DISCORD_WEBHOOK_URL`
5. Secret: 粘贴 Webhook URL
6. 点击 "Add secret"

### 2. 性能监控相关

#### K6_CLOUD_TOKEN

**用途**: k6 Cloud 认证令牌

**获取方式**:
1. 登录 [k6 Cloud](https://k6.io/cloud/)
2. 获取 API Token

**配置步骤**:
1. 进入 GitHub 仓库
2. 点击 "Settings" → "Secrets and variables" → "Actions"
3. 点击 "New repository secret"
4. Name: `K6_CLOUD_TOKEN`
5. Secret: 粘贴 API Token
6. 点击 "Add secret"

## Secrets 配置检查清单

### 必需 Secrets

- [ ] `FLY_API_TOKEN`
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_ACCESS_TOKEN`
- [ ] `SUPABASE_DB_URL`
- [ ] `NEXT_PUBLIC_SENTRY_DSN`
- [ ] `SENTRY_AUTH_TOKEN`
- [ ] `NEXT_PUBLIC_APP_URL`

### 可选 Secrets

- [ ] `SLACK_WEBHOOK_URL`
- [ ] `DISCORD_WEBHOOK_URL`
- [ ] `K6_CLOUD_TOKEN`

## 验证 Secrets 配置

### 方法 1: 使用 GitHub Actions 测试

创建一个测试工作流 `.github/workflows/test-secrets.yml`:

```yaml
name: Test Secrets

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Test Fly.io token
        run: |
          if [ -z "${{ secrets.FLY_API_TOKEN }}" ]; then
            echo "❌ FLY_API_TOKEN is not set"
            exit 1
          else
            echo "✅ FLY_API_TOKEN is set"
          fi

      - name: Test Supabase secrets
        run: |
          if [ -z "${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}" ]; then
            echo "❌ NEXT_PUBLIC_SUPABASE_URL is not set"
            exit 1
          else
            echo "✅ NEXT_PUBLIC_SUPABASE_URL is set"
          fi
          
          if [ -z "${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}" ]; then
            echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set"
            exit 1
          else
            echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY is set"
          fi
          
          if [ -z "${{ secrets.SUPABASE_ACCESS_TOKEN }}" ]; then
            echo "❌ SUPABASE_ACCESS_TOKEN is not set"
            exit 1
          else
            echo "✅ SUPABASE_ACCESS_TOKEN is set"
          fi
          
          if [ -z "${{ secrets.SUPABASE_DB_URL }}" ]; then
            echo "❌ SUPABASE_DB_URL is not set"
            exit 1
          else
            echo "✅ SUPABASE_DB_URL is set"
          fi

      - name: Test Sentry secrets
        run: |
          if [ -z "${{ secrets.NEXT_PUBLIC_SENTRY_DSN }}" ]; then
            echo "❌ NEXT_PUBLIC_SENTRY_DSN is not set"
            exit 1
          else
            echo "✅ NEXT_PUBLIC_SENTRY_DSN is set"
          fi
          
          if [ -z "${{ secrets.SENTRY_AUTH_TOKEN }}" ]; then
            echo "❌ SENTRY_AUTH_TOKEN is not set"
            exit 1
          else
            echo "✅ SENTRY_AUTH_TOKEN is set"
          fi

      - name: Test app secrets
        run: |
          if [ -z "${{ secrets.NEXT_PUBLIC_APP_URL }}" ]; then
            echo "❌ NEXT_PUBLIC_APP_URL is not set"
            exit 1
          else
            echo "✅ NEXT_PUBLIC_APP_URL is set"
          fi
```

运行测试工作流：
1. 进入 GitHub 仓库
2. 点击 "Actions" 标签
3. 选择 "Test Secrets" 工作流
4. 点击 "Run workflow"

### 方法 2: 本地测试

创建一个测试脚本 `test-secrets.sh`:

```bash
#!/bin/bash

echo "Testing GitHub Secrets..."

# 检查必需的 secrets
required_secrets=(
  "FLY_API_TOKEN"
  "NEXT_PUBLIC_SUPABASE_URL"
  "NEXT_PUBLIC_SUPABASE_ANON_KEY"
  "SUPABASE_ACCESS_TOKEN"
  "SUPABASE_DB_URL"
  "NEXT_PUBLIC_SENTRY_DSN"
  "SENTRY_AUTH_TOKEN"
  "NEXT_PUBLIC_APP_URL"
)

missing_secrets=()

for secret in "${required_secrets[@]}"; do
  if [ -z "${!secret}" ]; then
    missing_secrets+=("$secret")
  fi
done

if [ ${#missing_secrets[@]} -gt 0 ]; then
  echo "❌ Missing secrets:"
  for secret in "${missing_secrets[@]}"; do
    echo "  - $secret"
  done
  exit 1
else
  echo "✅ All required secrets are set"
fi
```

## 安全最佳实践

### 1. Secrets 管理

- ✅ 定期轮换 secrets（建议每 90 天）
- ✅ 使用最小权限原则
- ✅ 不要在代码中硬编码 secrets
- ✅ 不要在日志中输出 secrets
- ✅ 使用环境变量而非配置文件

### 2. 访问控制

- ✅ 限制 secrets 访问权限
- ✅ 使用 GitHub Teams 管理访问
- ✅ 启用双因素认证（2FA）
- ✅ 定期审查访问权限

### 3. 监控和审计

- ✅ 启用 GitHub 审计日志
- ✅ 监控 secrets 使用情况
- ✅ 设置异常告警
- ✅ 定期审查 secrets 使用记录

### 4. 备份和恢复

- ✅ 在安全的地方备份 secrets
- ✅ 制定 secrets 恢复流程
- ✅ 测试恢复流程
- ✅ 定期更新备份

## 故障排除

### 问题 1: Secrets 未生效

**症状**: GitHub Actions 报告 secrets 未找到

**解决方案**:
1. 检查 secrets 名称是否正确（区分大小写）
2. 确认 secrets 已添加到正确的仓库
3. 检查工作流文件中的 secrets 引用格式
4. 重新添加 secrets

### 问题 2: Token 过期

**症状**: 认证失败，提示 token 无效

**解决方案**:
1. 生成新的 token
2. 更新 GitHub Secrets
3. 测试新 token 是否有效

### 问题 3: 权限不足

**症状**: 操作被拒绝，提示权限不足

**解决方案**:
1. 检查 token 权限设置
2. 确认 token 具有所需权限
3. 重新生成具有正确权限的 token

### 问题 4: Secrets 泄露

**症状**: 怀疑 secrets 已泄露

**解决方案**:
1. 立即撤销泄露的 secrets
2. 生成新的 secrets
3. 更新所有相关配置
4. 审查访问日志
5. 加强安全措施

## 相关文档

- [GitHub Secrets 文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Fly.io 文档](https://fly.io/docs/)
- [Supabase 文档](https://supabase.com/docs)
- [Sentry 文档](https://docs.sentry.io/)

## 联系支持

如有问题，请联系：
- 技术支持: support@example.com
- DevOps 团队: devops@example.com

---

**最后更新**: 2026-03-14
**版本**: 1.0.0
