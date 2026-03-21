# DevOps 开发标准

## 概述

本文档定义了掼蛋3项目的DevOps开发标准，涵盖CI/CD流水线架构、云基础设施配置、监控和可观测性系统、部署自动化等方面的最佳实践。

## 核心原则

### 1. 自动化优先
- 所有重复性任务必须自动化
- 基础设施即代码（IaC）是强制要求
- 部署流程必须完全自动化

### 2. 安全与合规
- 安全左移，在开发早期集成安全检查
- 所有配置必须符合安全最佳实践
- 敏感信息必须使用密钥管理

### 3. 可观测性
- 系统必须提供完整的可观测性
- 监控、日志和追踪三位一体
- 告警必须可操作且有意义

### 4. 可靠性
- 系统必须具备高可用性
- 部署必须支持零停机
- 必须有完整的灾难恢复计划

## CI/CD 流水线架构标准

### 1. 流水线设计原则

#### 1.1 多阶段流水线
```yaml
# 标准流水线阶段
stages:
  - validate    # 代码验证
  - test        # 测试执行
  - build       # 构建打包
  - security    # 安全检查
  - deploy      # 部署发布
  - verify      # 部署验证
```

#### 1.2 分支策略
- **main分支**: 生产环境代码，受保护分支
- **staging分支**: 预发布环境代码
- **feature/*分支**: 功能开发分支
- **hotfix/*分支**: 紧急修复分支

#### 1.3 质量关卡
- 代码审查必须通过
- 所有测试必须通过
- 安全扫描必须通过
- 性能基准必须达标

### 2. GitHub Actions 配置标准

#### 2.1 基础配置
```yaml
# .github/workflows/ci.yml 标准模板
name: CI

on:
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

permissions:
  contents: read
```

#### 2.2 作业组织
```yaml
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

  test:
    needs: validate
    runs-on: ubuntu-latest
    steps:
      - name: Run tests
        run: npm test -- --run

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

#### 2.3 环境变量管理
- 敏感信息必须使用GitHub Secrets
- 环境变量必须按环境分类
- 密钥必须定期轮换

### 3. 测试策略

#### 3.1 测试类型要求
| 测试类型 | 覆盖率要求 | 执行频率 |
|---------|-----------|----------|
| 单元测试 | ≥ 85% | 每次提交 |
| 集成测试 | ≥ 70% | 每次提交 |
| E2E测试 | 核心路径100% | 每日/发布前 |
| 性能测试 | 关键指标100% | 每周/发布前 |

#### 3.2 测试环境
- 单元测试: 本地/CI环境
- 集成测试: 隔离的测试环境
- E2E测试: 类生产环境
- 性能测试: 生产等价环境

## 云基础设施配置标准

### 1. 基础设施即代码（IaC）

#### 1.1 Terraform 配置标准
```hcl
# terraform/main.tf 标准结构
terraform {
  required_version = ">= 1.0"

  required_providers {
    vercel = {
      source  = "vercel/vercel"
      version = "~> 1.0"
    }
    supabase = {
      source  = "supabase/supabase"
      version = "~> 1.0"
    }
  }

  backend "remote" {
    organization = "guandan3"
    workspaces {
      name = "production"
    }
  }
}
```

#### 1.2 模块化设计
- 每个环境独立的工作空间
- 可重用的模块设计
- 清晰的变量和输出定义

#### 1.3 状态管理
- 远程状态存储（Terraform Cloud）
- 状态锁定机制
- 状态版本控制

### 2. Vercel 配置标准

#### 2.1 项目配置
```json
// vercel.json 标准配置
{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["hkg1"],

  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

#### 2.2 环境变量管理
- 使用Vercel环境变量管理
- 按环境分类（Production, Preview, Development）
- 敏感信息使用Vercel Secrets

#### 2.3 部署保护
- 启用部署保护规则
- 配置必要的检查
- 设置自动回滚

### 3. Supabase 配置标准

#### 3.1 项目结构
```
supabase/
├── migrations/          # 数据库迁移
│   ├── 20240318000001_add_game_pause_support.sql
│   └── 20240318000002_add_room_invitation.sql
├── functions/          # Edge Functions
│   └── handle-game.ts
└── config.toml        # Supabase配置
```

#### 3.2 数据库迁移
- 每个迁移必须有唯一的时间戳前缀
- 迁移必须可逆（提供down脚本）
- 迁移必须在测试环境验证

#### 3.3 RLS策略
- 默认拒绝所有访问
- 最小权限原则
- 策略必须有清晰的注释

## 监控和可观测性标准

### 1. 监控架构

#### 1.1 监控层次
```
应用监控 (Vercel Analytics)
    ↓
业务监控 (自定义指标)
    ↓
基础设施监控 (Supabase Dashboard)
    ↓
日志聚合 (Vercel Logs + Supabase Logs)
```

#### 1.2 关键指标
| 指标类别 | 关键指标 | 告警阈值 |
|---------|---------|----------|
| 性能 | 页面加载时间 | > 2s |
| 性能 | API响应时间 | > 1s |
| 可用性 | 服务可用性 | < 99.9% |
| 错误 | 错误率 | > 1% |
| 资源 | CPU使用率 | > 80% |
| 资源 | 内存使用率 | > 85% |
| 数据库 | 连接数 | > 50 |
| 数据库 | 查询时间 | > 500ms |

### 2. 告警配置标准

#### 2.1 告警级别定义
```yaml
# monitoring/alerts.yml 标准结构
rules:
  - name: "critical_response_time"
    description: "API响应时间严重超标"
    condition: "avg(api_response_time_seconds) > 3"
    duration: "2m"
    severity: "critical"
    channels:
      - "slack-production"
      - "pagerduty"
```

#### 2.2 告警级别
- **P0 (关键)**: 系统不可用，立即响应
- **P1 (高)**: 功能严重受损，1小时内响应
- **P2 (中)**: 性能下降，4小时内响应
- **P3 (低)**: 轻微问题，24小时内响应

#### 2.3 告警渠道
- Slack: 所有告警
- 邮件: P1及以上告警
- PagerDuty: P0告警
- 短信: P0告警（值班人员）

### 3. 日志标准

#### 3.1 日志级别
```typescript
// 标准日志级别
enum LogLevel {
  ERROR = 'error',     # 错误，需要立即处理
  WARN = 'warn',       # 警告，需要注意
  INFO = 'info',       # 信息，正常操作
  DEBUG = 'debug',     # 调试，开发时使用
  TRACE = 'trace'      # 追踪，详细调试
}
```

#### 3.2 日志格式
```json
{
  "timestamp": "2024-03-19T10:30:00Z",
  "level": "error",
  "message": "Database connection failed",
  "service": "game-service",
  "requestId": "req-12345",
  "userId": "user-67890",
  "gameId": "game-abc123",
  "error": {
    "code": "DB_CONNECTION_ERROR",
    "message": "Could not connect to database",
    "stack": "..."
  }
}
```

#### 3.3 日志保留
- 应用日志: 30天
- 访问日志: 90天
- 审计日志: 1年
- 安全日志: 永久

## 部署自动化标准

### 1. 部署策略

#### 1.1 部署类型
- **蓝绿部署**: 生产环境主要部署方式
- **金丝雀部署**: 新功能逐步发布
- **滚动部署**: 服务更新

#### 1.2 部署流程
```
代码提交 → CI验证 → 构建镜像 → 安全扫描 → 部署到Staging → Staging测试 → 部署到Production → 生产验证 → 监控告警
```

### 2. 部署脚本标准

#### 2.1 脚本结构
```powershell
# scripts/deploy-production.ps1 标准模板
param(
    [string]$Environment = "production",
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Stop"

Write-Host "Starting $Environment deployment..." -ForegroundColor Green

# 1. 前置检查
Write-Host "1. Running pre-deployment checks..." -ForegroundColor Cyan
.\scripts\pre-deploy-check.ps1 -Environment $Environment

# 2. 构建
Write-Host "2. Building application..." -ForegroundColor Cyan
npm run build

# 3. 部署
if (-not $DryRun) {
    Write-Host "3. Deploying to $Environment..." -ForegroundColor Cyan
    vercel deploy --prod --token=$env:VERCEL_TOKEN
}

# 4. 验证
Write-Host "4. Verifying deployment..." -ForegroundColor Cyan
.\scripts\post-deploy-verify.ps1 -Environment $Environment

Write-Host "Deployment completed successfully!" -ForegroundColor Green
```

#### 2.2 脚本要求
- 必须有错误处理
- 必须有日志输出
- 必须支持干运行模式
- 必须可重入

### 3. 数据库迁移标准

#### 3.1 迁移流程
```javascript
// scripts/execute-migrations.js 标准流程
const migrationProcess = {
  1: '备份当前数据库',
  2: '验证迁移脚本',
  3: '在测试环境执行',
  4: '验证数据完整性',
  5: '在生产环境执行',
  6: '验证生产数据',
  7: '清理备份'
};
```

#### 3.2 迁移安全
- 必须有备份
- 必须在低峰期执行
- 必须有回滚计划
- 必须监控执行过程

## 安全标准

### 1. 安全扫描

#### 1.1 扫描类型
```yaml
# .github/workflows/security.yml 标准配置
jobs:
  dependency-scan:
    steps:
      - name: Run npm audit
        run: npm audit --audit-level=high

      - name: Run Snyk scan
        uses: snyk/actions/node@master
        with:
          args: --severity-threshold=high

  code-scan:
    steps:
      - name: Run Semgrep
        uses: returntocorp/semgrep-action@v1

      - name: Run TruffleHog
        uses: trufflesecurity/trufflehog@main
```

#### 1.2 扫描频率
- 依赖扫描: 每次提交
- 代码扫描: 每次提交
- 容器扫描: 每次构建
- 基础设施扫描: 每周

### 2. 密钥管理

#### 2.1 密钥分类
- **API密钥**: Supabase, Vercel等
- **数据库凭证**: 用户名密码
- **加密密钥**: JWT签名密钥
- **服务账号**: 第三方服务

#### 2.2 存储要求
- 使用GitHub Secrets/Vercel Secrets
- 禁止硬编码在代码中
- 定期轮换（90天）
- 访问日志记录

### 3. 网络安全

#### 3.1 网络配置
- 启用HTTPS强制
- 配置CSP策略
- 设置安全头
- 启用WAF

#### 3.2 访问控制
- 最小权限原则
- 网络隔离
- 审计日志
- 定期审查

## 性能标准

### 1. 性能指标

#### 1.1 Web Vitals
| 指标 | 目标值 | 测量方法 |
|-----|--------|----------|
| FCP | < 1.5s | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| FID | < 100ms | Real User Monitoring |
| CLS | < 0.1 | Lighthouse |

#### 1.2 应用性能
| 指标 | 目标值 | 测量方法 |
|-----|--------|----------|
| 首屏加载 | < 2s | 自定义监控 |
| API响应 | < 200ms | 应用日志 |
| 实时消息 | < 100ms | 网络监控 |
| 数据库查询 | < 50ms | 数据库监控 |

### 2. 性能测试

#### 2.1 测试类型
- **负载测试**: 模拟正常负载
- **压力测试**: 测试极限容量
- **耐力测试**: 长时间运行
- **尖峰测试**: 突发流量

#### 2.2 测试工具
- k6: 负载测试
- Lighthouse: 性能分析
- WebPageTest: 真实用户模拟
- Playwright: E2E性能测试

## 灾难恢复标准

### 1. 备份策略

#### 1.1 备份类型
| 数据类型 | 备份频率 | 保留时间 | 恢复目标 |
|---------|----------|----------|----------|
| 数据库 | 每日 | 30天 | 1小时 |
| 文件存储 | 每日 | 90天 | 4小时 |
| 配置 | 每次变更 | 永久 | 立即 |
| 代码 | 每次提交 | 永久 | 立即 |

#### 1.2 备份验证
- 定期恢复测试
- 完整性检查
- 性能验证
- 文档更新

### 2. 恢复流程

#### 2.1 恢复级别
- **RTO (恢复时间目标)**: 4小时
- **RPO (恢复点目标)**: 24小时

#### 2.2 恢复步骤
1. 声明灾难
2. 启动恢复团队
3. 恢复基础设施
4. 恢复数据
5. 验证系统
6. 切换流量
7. 事后分析

## 文档标准

### 1. 文档类型

#### 1.1 运维文档
- 部署指南
- 故障排除
- 监控指南
- 备份恢复

#### 1.2 架构文档
- 系统架构图
- 数据流图
- 网络拓扑
- 安全架构

#### 1.3 流程文档
- 变更管理
- 事件响应
- 容量规划
- 灾难恢复

### 2. 文档维护
- 文档必须与代码同步更新
- 文档必须有版本控制
- 文档必须可搜索
- 文档必须定期审查

## 合规性标准

### 1. 数据保护
- 符合GDPR要求
- 数据加密传输和存储
- 数据访问控制
- 数据保留策略

### 2. 审计要求
- 操作审计日志
- 安全事件日志
- 变更审计日志
- 访问审计日志

### 3. 合规扫描
- 定期合规检查
- 第三方审计
- 合规报告
- 整改跟踪

## 持续改进

### 1. 指标跟踪
| 指标 | 目标值 | 测量频率 |
|-----|--------|----------|
| 部署频率 | 每日 | 每周 |
| 部署成功率 | > 99% | 每次部署 |
| 平均恢复时间 | < 1小时 | 每次事件 |
| 变更失败率 | < 5% | 每月 |

### 2. 回顾会议
- 每周运维回顾
- 每月性能回顾
- 每季度架构回顾
- 每年合规回顾

### 3. 改进流程
1. 识别改进机会
2. 制定改进计划
3. 实施改进措施
4. 验证改进效果
5. 标准化改进成果

## 附录

### A. 工具清单
| 工具类别 | 工具名称 | 用途 |
|---------|---------|------|
| CI/CD | GitHub Actions | 自动化流水线 |
| IaC | Terraform | 基础设施即代码 |
| 部署 | Vercel CLI | 应用部署 |
| 监控 | Vercel Analytics | 应用监控 |
| 日志 | Vercel Logs | 应用日志 |
| 安全 | Snyk | 依赖扫描 |
| 安全 | Semgrep | 代码扫描 |
| 性能 | k6 | 负载测试 |
| 性能 | Lighthouse | 性能分析 |

### B. 模板文件
- CI/CD模板: `.github/workflows/templates/`
- Terraform模块: `terraform/modules/`
- 部署脚本: `scripts/templates/`
- 监控配置: `monitoring/templates/`

### C. 参考文档
- GitHub Actions文档: https://docs.github.com/en/actions
- Terraform文档: https://www.terraform.io/docs
- Vercel文档: https://vercel.com/docs
- Supabase文档: https://supabase.com/docs

---

**文档版本**: v1.0
**创建日期**: 2026-03-19
**维护者**: DevOps团队
**审核状态**: 待审核
**下次审核**: 2026-06-19