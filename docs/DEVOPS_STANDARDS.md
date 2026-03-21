# DevOps 开发标准

## 📋 概述

本文档定义了掼蛋3项目的DevOps开发标准，涵盖CI/CD管道架构、云基础设施配置、监控系统和自动化部署流程。所有团队成员必须遵守这些标准以确保系统可靠性、安全性和可维护性。

**版本**: 1.0
**生效日期**: 2026-03-19
**维护者**: DevOps团队

---

## 🎯 核心原则

### 1. 自动化优先
- 所有重复性任务必须自动化
- 手动操作仅限于紧急情况和故障排除
- 自动化脚本必须有版本控制和测试

### 2. 基础设施即代码
- 所有基础设施必须通过代码定义和管理
- 禁止手动修改生产环境
- 基础设施代码必须经过代码审查

### 3. 安全左移
- 安全检查和测试集成到CI/CD管道早期阶段
- 所有代码和配置必须通过安全扫描
- 敏感信息必须使用密钥管理服务

### 4. 可观测性驱动
- 所有系统组件必须有监控和日志
- 监控指标必须定义明确的告警阈值
- 日志必须结构化且可搜索

### 5. 不可变基础设施
- 服务器配置一旦部署不可修改
- 更新必须通过重新部署实现
- 使用容器化或不可变镜像

---

## 🏗️ CI/CD 管道架构标准

### 1. 管道设计原则

#### 1.1 多阶段管道
```yaml
# 标准管道阶段
stages:
  - validate      # 代码验证
  - test          # 测试执行
  - build         # 构建制品
  - security      # 安全检查
  - deploy-staging # 部署到预发布
  - deploy-prod   # 部署到生产
  - post-deploy   # 部署后验证
```

#### 1.2 质量关卡
- **代码质量**: ESLint、Prettier、TypeScript检查必须通过
- **测试覆盖率**: 单元测试覆盖率 ≥ 85%，集成测试覆盖率 ≥ 70%
- **安全扫描**: 无高危漏洞，依赖包安全
- **性能基准**: 性能测试必须在阈值内

#### 1.3 环境策略
- **开发环境**: 用于功能开发和测试
- **预发布环境**: 与生产环境完全一致，用于用户验收测试
- **生产环境**: 真实用户环境，严格变更控制

### 2. GitHub Actions 标准

#### 2.1 工作流文件结构
```
.github/workflows/
├── ci.yml              # 持续集成
├── security-scan.yml   # 安全扫描
├── deploy-staging.yml  # 预发布部署
├── deploy-production.yml # 生产部署
├── performance-test.yml # 性能测试
└── cleanup.yml         # 资源清理
```

#### 2.2 工作流模板标准
```yaml
# 所有工作流必须包含的基本配置
name: Standard Workflow Template

on:
  # 触发条件明确
  push:
    branches: [main, staging]
  pull_request:
    branches: [main]
  workflow_dispatch:  # 支持手动触发

# 并发控制
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

# 权限最小化
permissions:
  contents: read
  checks: write
  deployments: write

env:
  # 环境变量统一管理
  NODE_VERSION: '22'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  # 作业必须有清晰的依赖关系
  validate:
    runs-on: ubuntu-latest
    steps: [...]

  test:
    runs-on: ubuntu-latest
    needs: validate
    steps: [...]

  # 作业输出必须定义
    outputs:
      test_passed: ${{ steps.run-tests.outputs.passed }}
```

#### 2.3 作业执行标准
- **超时设置**: 所有作业必须有合理的超时时间（默认30分钟）
- **资源限制**: 指定合适的runner类型和资源
- **错误处理**: 使用`continue-on-error`和`if`条件进行优雅降级
- **制品管理**: 构建制品必须正确存储和版本控制

### 3. 部署策略标准

#### 3.1 蓝绿部署
```yaml
# 蓝绿部署配置示例
deployment-strategy:
  type: blue-green
  traffic-split:
    blue: 100  # 初始流量
    green: 0   # 新版本
  validation:
    health-check: /api/health
    smoke-test: true
    canary-duration: 5m  # 金丝雀测试时长
```

#### 3.2 金丝雀发布
- **流量比例**: 初始1%流量，逐步增加到100%
- **监控指标**: 错误率、延迟、业务指标
- **回滚条件**: 错误率 > 1% 或 延迟增加 > 50%
- **持续时间**: 每个阶段至少30分钟

#### 3.3 滚动更新
- **批次大小**: 每次更新不超过25%的实例
- **健康检查**: 批次间必须有健康检查
- **等待时间**: 批次间等待时间至少2分钟
- **最大不可用**: 任何时候至少75%的实例可用

---

## ☁️ 云基础设施配置标准

### 1. Terraform 标准

#### 1.1 项目结构
```
terraform/
├── modules/           # 可重用模块
│   ├── vpc/
│   ├── rds/
│   └── ecs/
├── environments/      # 环境配置
│   ├── dev/
│   ├── staging/
│   └── prod/
├── scripts/          # Terraform脚本
└── tests/            # Terraform测试
```

#### 1.2 代码组织标准
```hcl
# 每个资源文件不超过500行
# 使用模块化设计
module "network" {
  source = "./modules/vpc"

  # 所有变量必须有描述和类型
  vpc_cidr = "10.0.0.0/16"
  environment = var.environment
}

# 使用locals进行复杂计算
locals {
  instance_count = var.environment == "prod" ? 3 : 1
  instance_type  = var.environment == "prod" ? "t3.large" : "t3.micro"
}

# 输出必须有描述
output "vpc_id" {
  value       = module.network.vpc_id
  description = "VPC ID for networking"
}
```

#### 1.3 状态管理
- **远程状态**: 使用S3或Terraform Cloud存储状态
- **状态锁定**: 启用状态锁定防止并发修改
- **状态备份**: 定期备份状态文件
- **敏感数据**: 状态文件中的敏感数据必须加密

#### 1.4 变量管理
```hcl
# 变量定义标准
variable "environment" {
  type        = string
  description = "部署环境 (dev/staging/prod)"
  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "环境必须是 dev、staging 或 prod"
  }
}

variable "instance_count" {
  type        = number
  description = "实例数量"
  default     = 1

  validation {
    condition     = var.instance_count > 0 && var.instance_count <= 10
    error_message = "实例数量必须在1-10之间"
  }
}
```

### 2. 环境配置标准

#### 2.1 环境变量管理
```yaml
# 环境变量分类
env_variables:
  # 应用配置
  app:
    - NEXT_PUBLIC_APP_URL
    - NEXT_PUBLIC_ENABLE_FEATURES

  # 数据库配置
  database:
    - DATABASE_URL
    - DATABASE_MAX_CONNECTIONS

  # 第三方服务
  services:
    - SUPABASE_URL
    - SUPABASE_ANON_KEY

  # 监控配置
  monitoring:
    - SENTRY_DSN
    - DATADOG_API_KEY
```

#### 2.2 密钥管理
- **存储位置**: 使用Vercel环境变量、AWS Secrets Manager或HashiCorp Vault
- **访问控制**: 最小权限原则，按环境隔离
- **轮换策略**: 密钥必须定期轮换（90天）
- **审计日志**: 所有密钥访问必须有审计日志

### 3. 网络架构标准

#### 3.1 安全组规则
```hcl
# 最小权限安全组
resource "aws_security_group" "app" {
  name_prefix = "app-sg-"

  # 入站规则
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "HTTPS access"
  }

  ingress {
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = ["10.0.0.0/16"]  # 仅内部访问
    description = "SSH from VPC"
  }

  # 出站规则
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound"
  }
}
```

#### 3.2 子网设计
- **公有子网**: 面向互联网的负载均衡器、NAT网关
- **私有子网**: 应用服务器、数据库、缓存
- **隔离层**: 不同环境使用不同的VPC或账户
- **CIDR规划**: 预留足够的IP空间用于扩展

---

## 📊 监控和可观测性标准

### 1. 监控层级

#### 1.1 基础设施监控
```yaml
metrics:
  # 计算资源
  - cpu_usage: "rate(container_cpu_usage_seconds_total[5m])"
  - memory_usage: "container_memory_working_set_bytes"
  - disk_usage: "container_fs_usage_bytes"

  # 网络
  - network_rx: "rate(container_network_receive_bytes_total[5m])"
  - network_tx: "rate(container_network_transmit_bytes_total[5m])"

  # 存储
  - storage_used: "kubelet_volume_stats_used_bytes"
  - storage_capacity: "kubelet_volume_stats_capacity_bytes"
```

#### 1.2 应用监控
```yaml
metrics:
  # HTTP请求
  - request_rate: "rate(http_requests_total[5m])"
  - error_rate: "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m])"
  - latency_p95: "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))"

  # 业务指标
  - active_users: "active_users"
  - game_sessions: "game_sessions_active"
  - api_calls: "rate(api_calls_total[5m])"
```

#### 1.3 数据库监控
```yaml
metrics:
  # 连接
  - connections: "pg_stat_database_numbackends"
  - max_connections: "pg_settings_max_connections"

  # 性能
  - query_time: "rate(pg_stat_statements_total_time_seconds[5m])"
  - cache_hit: "pg_stat_database_blks_hit / (pg_stat_database_blks_hit + pg_stat_database_blks_read)"

  # 存储
  - db_size: "pg_database_size_bytes"
  - table_sizes: "pg_stat_user_tables_size_bytes"
```

### 2. 告警标准

#### 2.1 告警级别定义
```yaml
alert_levels:
  critical:
    # P0: 系统不可用，立即响应
    response_time: "< 15分钟"
    channels: ["pagerduty", "sms", "slack-critical"]
    examples:
      - "服务完全不可用"
      - "数据丢失或损坏"
      - "安全漏洞被利用"

  high:
    # P1: 功能严重受损，1小时内响应
    response_time: "< 1小时"
    channels: ["slack-critical", "email"]
    examples:
      - "核心功能不可用"
      - "性能严重下降"
      - "错误率 > 10%"

  warning:
    # P2: 需要关注，24小时内处理
    response_time: "< 24小时"
    channels: ["slack-general"]
    examples:
      - "资源使用率 > 80%"
      - "轻微性能下降"
      - "非核心功能问题"
```

#### 2.2 告警规则模板
```yaml
# 标准告警规则结构
- alert: "HighErrorRate"
  expr: "rate(http_requests_total{status=~\"5..\"}[5m]) / rate(http_requests_total[5m]) > 0.05"
  for: "5m"  # 持续时间
  labels:
    severity: "warning"
    team: "devops"
  annotations:
    summary: "高错误率检测"
    description: "5xx错误率超过5%，持续5分钟"
    runbook: "https://wiki/runbooks/high-error-rate"
```

### 3. 日志标准

#### 3.1 日志格式
```json
{
  "timestamp": "2026-03-19T10:30:00Z",
  "level": "INFO",
  "service": "game-service",
  "environment": "production",
  "trace_id": "abc123def456",
  "user_id": "user_123",
  "session_id": "session_456",
  "message": "游戏回合提交成功",
  "duration_ms": 45,
  "game_id": "game_789",
  "action": "submit_turn",
  "metadata": {
    "card_count": 5,
    "turn_number": 12
  }
}
```

#### 3.2 日志级别使用
- **ERROR**: 需要立即关注的错误，影响功能
- **WARN**: 潜在问题，需要监控但不需要立即行动
- **INFO**: 正常业务操作信息
- **DEBUG**: 调试信息，生产环境通常关闭
- **TRACE**: 详细跟踪信息，仅用于问题排查

---

## 🚀 部署自动化标准

### 1. 部署脚本标准

#### 1.1 脚本结构
```bash
#!/bin/bash
# 部署脚本模板

set -euo pipefail  # 严格错误处理

# 配置
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# 颜色输出
readonly RED='\033[0;31m'
readonly GREEN='\033[0;32m'
readonly YELLOW='\033[1;33m'
readonly NC='\033[0m' # No Color

# 日志函数
log_info() {
  echo -e "${GREEN}[INFO]${NC} $*"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $*" >&2
}

log_warning() {
  echo -e "${YELLOW}[WARNING]${NC} $*"
}

# 参数验证
validate_environment() {
  local env="$1"

  case "$env" in
    dev|staging|prod)
      return 0
      ;;
    *)
      log_error "无效环境: $env，必须是 dev、staging 或 prod"
      return 1
      ;;
  esac
}

# 主函数
main() {
  local environment="${1:-}"

  # 参数检查
  if [[ -z "$environment" ]]; then
    log_error "请指定环境: dev、staging 或 prod"
    exit 1
  fi

  validate_environment "$environment" || exit 1

  log_info "开始部署到 $environment 环境"

  # 部署步骤
  run_pre_deploy_checks
  build_application
  run_tests
  deploy_infrastructure
  deploy_application
  run_post_deploy_checks

  log_info "部署完成"
}

# 仅当直接执行时运行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  main "$@"
fi
```

#### 1.2 错误处理标准
- **立即退出**: 使用`set -euo pipefail`确保错误时立即退出
- **错误信息**: 错误信息必须清晰且包含上下文
- **重试逻辑**: 网络操作应该有重试机制
- **清理操作**: 脚本失败时必须清理临时资源

### 2. 数据库迁移标准

#### 2.1 迁移脚本规范
```sql
-- 迁移文件命名: YYYYMMDDHHMMSS_description.sql
-- 示例: 20240319103000_add_game_stats.sql

-- 必须包含事务
BEGIN;

-- 必须包含回滚语句注释
-- ROLLBACK: DROP TABLE IF EXISTS game_stats;

-- 创建表
CREATE TABLE IF NOT EXISTS game_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id),
  score INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_game_stats_game_id ON game_stats(game_id);
CREATE INDEX IF NOT EXISTS idx_game_stats_player_id ON game_stats(player_id);

-- 添加RLS策略（如果需要）
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- 更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_game_stats_updated_at
  BEFORE UPDATE ON game_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 提交事务
COMMIT;
```

#### 2.2 迁移执行流程
1. **预检查**: 验证迁移脚本语法和依赖
2. **备份**: 执行前自动备份数据库
3. **执行**: 在事务中执行迁移
4. **验证**: 验证迁移结果和数据结构
5. **回滚准备**: 准备回滚脚本

### 3. 回滚流程标准

#### 3.1 回滚触发条件
```yaml
rollback_triggers:
  # 自动回滚条件
  auto_rollback:
    - error_rate: "> 10% 持续5分钟"
    - latency_increase: "> 100% 持续5分钟"
    - health_check_failure: "连续3次失败"

  # 手动回滚条件
  manual_rollback:
    - data_corruption: "数据不一致或损坏"
    - security_incident: "安全漏洞被利用"
    - user_complaints: "大量用户投诉"
```

#### 3.2 回滚执行流程
```bash
#!/bin/bash
# 回滚脚本

# 1. 停止新版本流量
disable_new_version_traffic

# 2. 验证旧版本健康
if ! check_old_version_health; then
  log_error "旧版本不健康，无法回滚"
  emergency_procedure
  exit 1
fi

# 3. 切换流量到旧版本
switch_traffic_to_old_version

# 4. 清理新版本资源
cleanup_new_version_resources

# 5. 数据库回滚（如果需要）
if [[ "$ROLLBACK_DB" == "true" ]]; then
  rollback_database_migrations
fi

# 6. 验证回滚成功
verify_rollback_success

# 7. 通知相关人员
send_rollback_notification
```

---

## 🔒 安全合规标准

### 1. 安全扫描集成

#### 1.1 扫描类型和频率
```yaml
security_scans:
  # 代码扫描
  code_scan:
    tools: ["semgrep", "trivy", "gitleaks"]
    frequency: "每次提交"
    severity_threshold: "high"

  # 依赖扫描
  dependency_scan:
    tools: ["npm audit", "snyk", "dependabot"]
    frequency: "每天"
    severity_threshold: "high"

  # 容器扫描
  container_scan:
    tools: ["trivy", "clair"]
    frequency: "每次构建"
    severity_threshold: "critical"

  # 基础设施扫描
  infrastructure_scan:
    tools: ["checkov", "tfsec"]
    frequency: "每次Terraform执行"
    severity_threshold: "high"
```

#### 1.2 安全门禁
- **关键漏洞**: 任何critical或high级别漏洞阻止部署
- **许可证合规**: 禁止使用有问题的许可证
- **密钥检测**: 代码中不得包含硬编码的密钥
- **依赖更新**: 依赖包必须定期更新

### 2. 合规要求

#### 2.1 数据保护
- **加密**: 传输中数据使用TLS 1.3，静态数据使用AES-256
- **脱敏**: 日志中的敏感信息必须脱敏
- **保留策略**: 用户数据保留时间符合隐私政策
- **访问日志**: 所有数据访问必须有审计日志

#### 2.2 访问控制
- **最小权限**: 每个服务使用最小必要权限
- **角色分离**: 开发、部署、运维角色分离
- **多因素认证**: 生产环境访问必须使用MFA
- **定期审查**: 每季度审查权限配置

---

## 📈 性能优化标准

### 1. 部署性能指标

#### 1.1 部署时间目标
```yaml
deployment_performance:
  # 构建时间
  build_time:
    target: "< 5分钟"
    warning: "> 10分钟"
    critical: "> 15分钟"

  # 测试时间
  test_time:
    target: "< 10分钟"
    warning: "> 20分钟"
    critical: "> 30分钟"

  # 部署时间
  deploy_time:
    target: "< 3分钟"
    warning: "> 5分钟"
    critical: "> 10分钟"

  # 总流水线时间
  pipeline_time:
    target: "< 20分钟"
    warning: "> 30分钟"
    critical: "> 45分钟"
```

#### 1.2 资源优化
- **缓存利用**: 充分利用构建缓存和依赖缓存
- **并行执行**: 独立任务并行执行
- **增量构建**: 仅构建变更的部分
- **资源限制**: 合理设置资源限制避免资源竞争

### 2. 监控性能指标

#### 2.1 监控数据保留
```yaml
data_retention:
  # 高精度数据
  high_resolution:
    duration: "7天"
    resolution: "15秒"

  # 中等精度数据
  medium_resolution:
    duration: "30天"
    resolution: "1分钟"

  # 低精度数据
  low_resolution:
    duration: "1年"
    resolution: "5分钟"

  # 聚合数据
  aggregated:
    duration: "3年"
    resolution: "1小时"
```

#### 2.2 告警性能
- **告警评估间隔**: 不超过1分钟
- **告警传递时间**: P95 < 30秒
- **仪表板加载时间**: < 3秒
- **查询响应时间**: P95 < 5秒

---

## 📚 文档和知识管理

### 1. 文档标准

#### 1.1 运行手册
```markdown
# 运行手册模板

## 概述
- **服务名称**: [服务名称]
- **负责人**: [团队/个人]
- **SLA**: [服务级别协议]

## 架构图
[架构图或链接]

## 部署信息
- **部署位置**: [环境/区域]
- **部署方式**: [部署方法]
- **版本**: [当前版本]

## 监控
### 关键指标
- [指标1]: [阈值]
- [指标2]: [阈值]

### 仪表板
- [仪表板链接]

## 故障排除
### 常见问题
1. [问题1]: [解决方案]
2. [问题2]: [解决方案]

### 诊断命令
```bash
# 检查服务状态
[诊断命令]

# 查看日志
[日志查看命令]
```

## 应急流程
### 回滚步骤
1. [步骤1]
2. [步骤2]

### 联系人
- 主要联系人: [姓名/角色]
- 备用联系人: [姓名/角色]
```

#### 1.2 变更记录
- **变更描述**: 清晰描述变更内容和原因
- **影响分析**: 变更对系统的影响
- **回滚计划**: 详细的回滚步骤
- **验证步骤**: 如何验证变更成功

### 2. 知识共享
- **定期回顾**: 每周进行部署回顾会议
- **经验分享**: 分享故障处理经验和最佳实践
- **培训材料**: 为新成员提供DevOps培训材料
- **文档更新**: 文档必须与系统保持同步

---

## ✅ 验收标准

### 1. 新服务上线标准
- [ ] CI/CD管道配置完整并通过测试
- [ ] 基础设施代码通过安全扫描
- [ ] 监控和告警配置完成
- [ ] 运行手册和文档齐全
- [ ] 性能测试通过基准
- [ ] 安全审查通过
- [ ] 回滚流程测试通过

### 2. 部署成功标准
- [ ] 所有自动化测试通过
- [ ] 部署后健康检查通过
- [ ] 关键业务功能验证通过
- [ ] 性能指标在阈值内
- [ ] 无新增错误告警
- [ ] 用户反馈正常

### 3. 运维成熟度评估
- **级别1**: 基本自动化，部分手动操作
- **级别2**: 完全自动化，有监控和告警
- **级别3**: 预测性运维，自动扩缩容
- **级别4**: 自愈系统，故障自动恢复
- **级别5**: 持续优化，业务驱动运维

---

## 🔄 持续改进

### 1. 指标跟踪
- **部署频率**: 目标每日多次部署
- **变更失败率**: 目标 < 5%
- **平均恢复时间**: 目标 < 30分钟
- **部署时间**: 目标 < 20分钟

### 2. 改进流程
1. **度量**: 收集关键指标数据
2. **分析**: 识别瓶颈和改进点
3. **实验**: 实施改进方案
4. **验证**: 验证改进效果
5. **标准化**: 将成功实践标准化

### 3. 技术债务管理
- **定期评估**: 每季度评估技术债务
- **优先级排序**: 基于业务影响排序
- **专项解决**: 安排专门时间解决技术债务
- **预防措施**: 建立机制防止新债务产生

---

## 📞 应急联系

### 核心团队
- **DevOps负责人**: [姓名] - [电话] - [邮箱]
- **值班工程师**: [轮值表链接]
- **安全应急**: security@guandan3.com

### 服务提供商
- **Vercel支持**: support@vercel.com
- **Supabase支持**: support@supabase.com
- **监控服务**: [监控服务支持]

### 沟通渠道
- **紧急情况**: [紧急联系电话]
- **一般问题**: [Slack频道]
- **变更通知**: [变更通知渠道]

---

## 📝 修订记录

| 版本 | 日期 | 修改内容 | 修改人 |
|------|------|----------|--------|
| 1.0 | 2026-03-19 | 初始版本 | DevOps团队 |
| 1.1 | [日期] | [修改内容] | [修改人] |

---

**注意**: 本文档是活文档，将根据项目发展和经验积累持续更新。所有团队成员有责任提出改进建议。