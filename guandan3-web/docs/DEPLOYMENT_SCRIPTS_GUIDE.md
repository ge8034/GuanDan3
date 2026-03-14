# 部署脚本使用指南

本指南详细说明了如何使用项目中的部署相关脚本，包括部署前检查、部署执行和部署后验证。

## 脚本概览

项目包含以下部署脚本：

| 脚本名称 | 平台 | 用途 |
|---------|------|------|
| `pre-deploy-check.ps1` | Windows (PowerShell) | 部署前环境检查 |
| `pre-deploy-check.sh` | Linux/macOS (Bash) | 部署前环境检查 |
| `deploy-production.ps1` | Windows (PowerShell) | 生产环境部署 |
| `deploy-production.sh` | Linux/macOS (Bash) | 生产环境部署 |
| `post-deploy-verify.ps1` | Windows (PowerShell) | 部署后验证 |
| `post-deploy-verify.sh` | Linux/macOS (Bash) | 部署后验证 |

## 部署前检查

### Windows (PowerShell)

```powershell
# 基本检查
.\scripts\pre-deploy-check.ps1

# 跳过测试（仅检查文件和环境）
.\scripts\pre-deploy-check.ps1 -SkipTests

# 详细输出
.\scripts\pre-deploy-check.ps1 -Verbose

# 组合使用
.\scripts\pre-deploy-check.ps1 -SkipTests -Verbose
```

### Linux/macOS (Bash)

```bash
# 基本检查
./scripts/pre-deploy-check.sh

# 跳过测试（仅检查文件和环境）
./scripts/pre-deploy-check.sh --skip-tests

# 详细输出
./scripts/pre-deploy-check.sh --verbose

# 组合使用
./scripts/pre-deploy-check.sh --skip-tests --verbose
```

### 检查项目

部署前检查脚本会验证以下内容：

1. **必需工具检查**
   - Node.js
   - npm
   - Git
   - Fly.io CLI（可选）
   - Supabase CLI（可选）
   - Docker（可选）

2. **项目文件检查**
   - package.json
   - next.config.js
   - Dockerfile
   - fly.toml
   - .env.production
   - 数据库迁移目录
   - 应用源代码目录
   - 文档目录

3. **环境变量检查**
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - NEXT_PUBLIC_APP_URL

4. **数据库迁移检查**
   - 迁移文件数量
   - 迁移文件完整性

5. **依赖检查**
   - package-lock.json 存在性
   - node_modules 目录存在性

6. **代码质量检查**（可跳过）
   - Lint 检查
   - 类型检查
   - 安全审计

7. **构建检查**（可跳过）
   - 生产构建
   - 构建大小

8. **Git 状态检查**
   - 工作目录状态
   - 当前分支
   - 最新提交

9. **文档检查**
   - 部署检查清单
   - 回滚计划
   - 部署验证报告
   - 环境变量指南

10. **备份检查**
    - 备份文件存在性
    - 备份文件时间戳

### 检查结果

脚本会生成详细的检查报告，包括：
- ✅ 通过的项目数量
- ❌ 失败的项目数量
- ⚠️ 警告的项目数量
- 📄 日志文件路径

**退出代码：**
- `0`：检查通过（可能有警告）
- `1`：检查失败

## 生产环境部署

### Windows (PowerShell)

```powershell
# 基本部署
.\scripts\deploy-production.ps1

# 跳过部署前检查
.\scripts\deploy-production.ps1 -SkipPreCheck

# 跳过部署后验证
.\scripts\deploy-production.ps1 -SkipPostVerify

# 跳过所有检查
.\scripts\deploy-production.ps1 -SkipPreCheck -SkipPostVerify

# 详细输出
.\scripts\deploy-production.ps1 -Verbose
```

### Linux/macOS (Bash)

```bash
# 基本部署
./scripts/deploy-production.sh

# 跳过部署前检查
./scripts/deploy-production.sh --skip-pre-check

# 跳过部署后验证
./scripts/deploy-production.sh --skip-post-verify

# 跳过所有检查
./scripts/deploy-production.sh --skip-pre-check --skip-post-verify

# 详细输出
./scripts/deploy-production.sh --verbose
```

### 部署流程

部署脚本会执行以下步骤：

1. **部署前检查**（可跳过）
   - 运行 `pre-deploy-check` 脚本
   - 验证所有必需条件

2. **代码构建**
   - 安装依赖
   - 运行生产构建
   - 生成 Docker 镜像

3. **数据库迁移**
   - 备份当前数据库
   - 应用新的迁移
   - 验证迁移结果

4. **应用部署**
   - 推送 Docker 镜像
   - 更新 Fly.io 应用
   - 等待部署完成

5. **部署后验证**（可跳过）
   - 运行 `post-deploy-verify` 脚本
   - 验证应用功能

## 部署后验证

### Windows (PowerShell)

```powershell
# 基本验证
.\scripts\post-deploy-verify.ps1 -AppUrl "https://your-app.fly.dev"

# 跳过性能测试
.\scripts\post-deploy-verify.ps1 -AppUrl "https://your-app.fly.dev" -SkipPerformanceTests

# 详细输出
.\scripts\post-deploy-verify.ps1 -AppUrl "https://your-app.fly.dev" -Verbose

# 组合使用
.\scripts\post-deploy-verify.ps1 -AppUrl "https://your-app.fly.dev" -SkipPerformanceTests -Verbose
```

### Linux/macOS (Bash)

```bash
# 基本验证
./scripts/post-deploy-verify.sh --app-url "https://your-app.fly.dev"

# 跳过性能测试
./scripts/post-deploy-verify.sh --app-url "https://your-app.fly.dev" --skip-performance-tests

# 详细输出
./scripts/post-deploy-verify.sh --app-url "https://your-app.fly.dev" --verbose

# 组合使用
./scripts/post-deploy-verify.sh --app-url "https://your-app.fly.dev" --skip-performance-tests --verbose
```

### 验证项目

部署后验证脚本会检查以下内容：

1. **健康检查**
   - API 健康端点
   - HTTP 状态码

2. **页面访问检查**
   - 首页
   - 历史记录页
   - 练习模式页

3. **API 端点检查**
   - 健康检查 API
   - 游戏列表 API

4. **静态资源检查**
   - Next.js 静态资源
   - 网站图标

5. **性能测试**（可跳过）
   - 烟雾测试
   - 负载测试

6. **数据库连接检查**
   - Supabase 连接状态

7. **Fly.io 部署状态检查**
   - 应用运行状态
   - 实例健康状态

8. **环境变量验证**
   - 关键环境变量配置

9. **日志检查**
   - 错误日志统计
   - 警告日志统计

10. **监控集成检查**
    - Sentry 配置状态

## 完整部署流程

### 推荐流程

```powershell
# Windows PowerShell
# 1. 部署前检查
.\scripts\pre-deploy-check.ps1

# 2. 如果检查通过，执行部署
.\scripts\deploy-production.ps1

# 3. 部署后验证
.\scripts\post-deploy-verify.ps1 -AppUrl "https://your-app.fly.dev"
```

```bash
# Linux/macOS Bash
# 1. 部署前检查
./scripts/pre-deploy-check.sh

# 2. 如果检查通过，执行部署
./scripts/deploy-production.sh

# 3. 部署后验证
./scripts/post-deploy-verify.sh --app-url "https://your-app.fly.dev"
```

### 快速部署流程（跳过检查）

```powershell
# Windows PowerShell
.\scripts\deploy-production.ps1 -SkipPreCheck -SkipPostVerify
```

```bash
# Linux/macOS Bash
./scripts/deploy-production.sh --skip-pre-check --skip-post-verify
```

## 故障排除

### 常见问题

#### 1. 脚本执行权限错误（Linux/macOS）

```bash
# 添加执行权限
chmod +x scripts/*.sh
```

#### 2. PowerShell 执行策略错误（Windows）

```powershell
# 临时允许脚本执行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# 或以管理员身份运行
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### 3. 工具未找到

确保已安装必需的工具：
- Node.js 和 npm
- Git
- Fly.io CLI（用于部署）
- Supabase CLI（用于数据库操作）
- Docker（用于构建）

#### 4. 环境变量未配置

检查 `.env.production` 文件是否包含所有必需的环境变量。

#### 5. 部署失败

查看日志文件获取详细错误信息：
- 部署前检查：`logs/pre-deploy-check-*.log`
- 部署过程：`logs/deploy-production-*.log`
- 部署后验证：`logs/post-deploy-verify-*.log`

### 回滚流程

如果部署失败，请参考 [回滚计划](./ROLLBACK_PLAN.md) 执行回滚操作。

## 最佳实践

1. **始终运行部署前检查**
   - 确保环境准备就绪
   - 及早发现问题

2. **使用版本控制**
   - 在部署前提交所有更改
   - 使用有意义的提交信息

3. **备份数据库**
   - 在部署前创建数据库备份
   - 保留多个备份版本

4. **监控部署过程**
   - 使用 `-Verbose` 参数获取详细输出
   - 检查日志文件

5. **验证部署结果**
   - 运行部署后验证脚本
   - 手动测试关键功能

6. **准备回滚计划**
   - 熟悉回滚流程
   - 保留回滚脚本

7. **渐进式部署**
   - 先在测试环境部署
   - 验证后再部署到生产环境

## 相关文档

- [部署检查清单](./DEPLOYMENT_CHECKLIST.md)
- [回滚计划](./ROLLBACK_PLAN.md)
- [部署验证报告](./DEPLOYMENT_VALIDATION.md)
- [环境变量指南](./ENVIRONMENT_VARIABLES_GUIDE.md)
- [GitHub Secrets 配置指南](./GITHUB_SECRETS_GUIDE.md)

## 支持

如果遇到问题，请：
1. 查看日志文件
2. 检查相关文档
3. 运行详细模式获取更多信息
4. 联系技术支持团队
