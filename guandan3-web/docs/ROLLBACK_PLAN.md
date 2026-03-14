# 部署回滚计划

## 概述

本文档定义了 GuanDan3 项目的部署回滚策略和流程，确保在部署失败或出现严重问题时能够快速恢复到稳定状态。

## 回滚触发条件

### 自动触发条件

- 健康检查连续失败 3 次（90秒内）
- 错误率超过 5% 持续 5 分钟
- API 响应时间超过 3 秒持续 5 分钟
- 数据库连接失败持续 2 分钟
- 关键功能（用户登录、创建房间）失败率超过 10%

### 手动触发条件

- 严重安全漏洞
- 数据损坏或丢失
- 用户体验严重下降
- 业务逻辑错误
- 第三方服务集成失败

## 回滚策略

### 1. 应用回滚

#### Fly.io 应用回滚

```bash
# 查看部署历史
flyctl releases

# 回滚到上一个版本
flyctl release rollback

# 回滚到指定版本
flyctl release rollback <version>

# 验证回滚
flyctl status
flyctl logs
```

#### Docker 容器回滚

```bash
# 查看运行中的容器
docker ps

# 停止当前容器
docker stop <container_id>

# 启动上一个版本的容器
docker run -d \
  --name guandan3-previous \
  -p 3000:3000 \
  --env-file .env.production \
  guandan3:previous-version

# 验证容器状态
docker ps
docker logs guandan3-previous
```

### 2. 数据库回滚

#### Supabase 数据库回滚

```bash
# 查看迁移历史
supabase migration list

# 回滚到指定迁移
supabase migration down <migration_name>

# 从备份恢复
supabase db reset --db-url "postgresql://..." --file backup.sql

# 验证数据库状态
supabase db diff --schema public
```

#### 数据库备份恢复

```bash
# 创建回滚前备份
supabase db dump -f pre-rollback-backup.sql

# 恢复到指定备份
supabase db reset --db-url "postgresql://..." --file backup-20260314.sql

# 验证数据完整性
supabase db diff --schema public
```

### 3. 环境变量回滚

```bash
# 查看当前环境变量
flyctl secrets list

# 导出当前环境变量
flyctl secrets list > current-secrets.txt

# 从备份恢复环境变量
flyctl secrets import < previous-secrets.txt

# 验证环境变量
flyctl secrets list
```

### 4. 配置文件回滚

```bash
# 查看配置文件历史
git log --oneline fly.toml
git log --oneline next.config.js

# 回滚配置文件
git checkout HEAD~1 fly.toml
git checkout HEAD~1 next.config.js

# 提交回滚
git add fly.toml next.config.js
git commit -m "Rollback: Revert configuration changes"

# 重新部署
flyctl deploy
```

## 回滚流程

### 快速回滚流程（5分钟内）

#### 步骤 1: 立即停止新版本部署（30秒）

```bash
# 停止 Fly.io 应用
flyctl apps stop guandan3-web

# 或停止 Docker 容器
docker stop guandan3-web
```

#### 步骤 2: 回滚到上一个稳定版本（2分钟）

```bash
# Fly.io 回滚
flyctl release rollback

# Docker 回滚
docker stop guandan3-web
docker start guandan3-previous
```

#### 步骤 3: 验证回滚（1分钟）

```bash
# 健康检查
curl https://guandan3.example.com/api/health

# 功能测试
# 运行关键功能测试脚本
```

#### 步骤 4: 监控和通知（1.5分钟）

```bash
# 检查日志
flyctl logs --tail 50

# 发送通知
# 通知团队回滚已完成
```

### 完整回滚流程（30分钟内）

#### 步骤 1: 评估和决策（5分钟）

- 确认回滚触发条件
- 评估回滚影响范围
- 获得回滚批准
- 通知相关团队

#### 步骤 2: 创建回滚前备份（5分钟）

```bash
# 数据库备份
supabase db dump -f pre-rollback-backup-$(date +%Y%m%d-%H%M%S).sql

# 应用配置备份
flyctl config show > pre-rollback-config.txt

# 环境变量备份
flyctl secrets list > pre-rollback-secrets.txt

# Git 标签
git tag pre-rollback-$(date +%Y%m%d-%H%M%S)
```

#### 步骤 3: 执行应用回滚（10分钟）

```bash
# 查看部署历史
flyctl releases

# 选择稳定版本
flyctl release rollback <stable_version>

# 验证应用状态
flyctl status
flyctl logs --tail 100
```

#### 步骤 4: 数据库回滚（如需要）（5分钟）

```bash
# 检查迁移状态
supabase migration list

# 回滚数据库迁移
supabase migration down <problematic_migration>

# 或从备份恢复
supabase db reset --db-url "postgresql://..." --file backup.sql
```

#### 步骤 5: 验证和监控（5分钟）

```bash
# 健康检查
curl https://guandan3.example.com/api/health

# 功能测试
npm run test:e2e

# 性能测试
cd k6; k6 run smoke-test.js

# 监控检查
# 检查 Sentry 错误日志
# 检查应用性能指标
```

## 回滚脚本

### 自动回滚脚本

#### Bash 脚本 (rollback.sh)

```bash
#!/bin/bash

set -e

APP_NAME="guandan3-web"
BACKUP_DIR="./backups/rollback-$(date +%Y%m%d-%H%M%S)"
LOG_FILE="./logs/rollback-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$BACKUP_DIR"
mkdir -p "./logs"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始回滚流程..."

# 步骤 1: 创建备份
log "步骤 1: 创建回滚前备份..."
supabase db dump -f "$BACKUP_DIR/pre-rollback-backup.sql"
flyctl config show > "$BACKUP_DIR/pre-rollback-config.txt"
flyctl secrets list > "$BACKUP_DIR/pre-rollback-secrets.txt"
git tag "pre-rollback-$(date +%Y%m%d-%H%M%S)"
log "备份完成: $BACKUP_DIR"

# 步骤 2: 停止应用
log "步骤 2: 停止应用..."
flyctl apps stop "$APP_NAME"
log "应用已停止"

# 步骤 3: 回滚应用
log "步骤 3: 回滚应用..."
flyctl release rollback
log "应用回滚完成"

# 步骤 4: 启动应用
log "步骤 4: 启动应用..."
flyctl apps start "$APP_NAME"
log "应用已启动"

# 步骤 5: 验证回滚
log "步骤 5: 验证回滚..."
sleep 30
HEALTH_CHECK=$(curl -s https://guandan3.example.com/api/health)
if [ $? -eq 0 ]; then
    log "健康检查通过: $HEALTH_CHECK"
else
    log "健康检查失败"
    exit 1
fi

log "回滚流程完成"
```

#### PowerShell 脚本 (rollback.ps1)

```powershell
$ErrorActionPreference = "Stop"

$AppName = "guandan3-web"
$BackupDir = "./backups/rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
$LogFile = "./logs/rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null
New-Item -ItemType Directory -Force -Path "./logs" | Out-Null

function Log {
    param([string]$Message)
    $Timestamp = Get-Date -Format 'yyyy-MM-dd HH:mm:ss'
    $LogEntry = "[$Timestamp] $Message"
    Write-Host $LogEntry
    Add-Content -Path $LogFile -Value $LogEntry
}

Log "开始回滚流程..."

# 步骤 1: 创建备份
Log "步骤 1: 创建回滚前备份..."
supabase db dump -f "$BackupDir/pre-rollback-backup.sql"
flyctl config show | Out-File "$BackupDir/pre-rollback-config.txt"
flyctl secrets list | Out-File "$BackupDir/pre-rollback-secrets.txt"
git tag "pre-rollback-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Log "备份完成: $BackupDir"

# 步骤 2: 停止应用
Log "步骤 2: 停止应用..."
flyctl apps stop $AppName
Log "应用已停止"

# 步骤 3: 回滚应用
Log "步骤 3: 回滚应用..."
flyctl release rollback
Log "应用回滚完成"

# 步骤 4: 启动应用
Log "步骤 4: 启动应用..."
flyctl apps start $AppName
Log "应用已启动"

# 步骤 5: 验证回滚
Log "步骤 5: 验证回滚..."
Start-Sleep -Seconds 30
try {
    $HealthCheck = Invoke-WebRequest -Uri "https://guandan3.example.com/api/health" -UseBasicParsing
    Log "健康检查通过: $($HealthCheck.Content)"
} catch {
    Log "健康检查失败: $_"
    exit 1
}

Log "回滚流程完成"
```

### 数据库回滚脚本

#### Bash 脚本 (rollback-database.sh)

```bash
#!/bin/bash

set -e

BACKUP_FILE=$1
LOG_FILE="./logs/database-rollback-$(date +%Y%m%d-%H%M%S).log"

if [ -z "$BACKUP_FILE" ]; then
    echo "用法: $0 <backup_file.sql>"
    exit 1
fi

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "开始数据库回滚..."

# 步骤 1: 创建当前状态备份
log "步骤 1: 创建当前状态备份..."
supabase db dump -f "./backups/pre-db-rollback-$(date +%Y%m%d-%H%M%S).sql"

# 步骤 2: 验证备份文件
log "步骤 2: 验证备份文件..."
if [ ! -f "$BACKUP_FILE" ]; then
    log "错误: 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 步骤 3: 恢复数据库
log "步骤 3: 恢复数据库..."
supabase db reset --db-url "$DATABASE_URL" --file "$BACKUP_FILE"

# 步骤 4: 验证数据完整性
log "步骤 4: 验证数据完整性..."
supabase db diff --schema public

log "数据库回滚完成"
```

## 回滚验证

### 健康检查

```bash
# API 健康检查
curl https://guandan3.example.com/api/health

# 预期响应
{
  "status": "healthy",
  "timestamp": "2026-03-14T10:30:00Z",
  "version": "1.0.0"
}
```

### 功能验证

```bash
# 运行 E2E 测试
npm run test:e2e

# 运行关键功能测试
npm run test:critical
```

### 性能验证

```bash
# 运行烟雾测试
cd k6
k6 run smoke-test.js

# 运行负载测试
k6 run load-test.js
```

### 监控验证

- [ ] Sentry 错误率正常
- [ ] 应用性能指标正常
- [ ] 数据库性能正常
- [ ] 服务器资源使用正常
- [ ] 用户访问正常

## 回滚后行动

### 1. 问题分析

- 收集错误日志
- 分析失败原因
- 记录问题详情
- 制定修复计划

### 2. 通知团队

```bash
# 发送回滚通知
# 通知内容应包括:
# - 回滚时间
# - 回滚原因
# - 回滚版本
# - 影响范围
# - 后续计划
```

### 3. 文档更新

- 更新部署日志
- 记录回滚原因
- 更新故障排除文档
- 更新部署检查清单

### 4. 修复和重新部署

- 修复问题
- 测试修复
- 更新文档
- 重新部署

## 回滚测试

### 测试场景

#### 场景 1: 应用部署失败

```bash
# 模拟部署失败
flyctl deploy --invalid-config

# 执行回滚
./scripts/rollback.sh

# 验证回滚
curl https://guandan3.example.com/api/health
```

#### 场景 2: 数据库迁移失败

```bash
# 模拟迁移失败
supabase migration up --invalid-migration

# 执行数据库回滚
./scripts/rollback-database.sh backup.sql

# 验证数据库
supabase db diff --schema public
```

#### 场景 3: 环境变量配置错误

```bash
# 模拟环境变量错误
flyctl secrets set INVALID_VAR=invalid_value

# 执行环境变量回滚
flyctl secrets import < previous-secrets.txt

# 验证应用
flyctl status
```

### 测试检查清单

- [ ] 快速回滚流程测试通过
- [ ] 完整回滚流程测试通过
- [ ] 数据库回滚测试通过
- [ ] 环境变量回滚测试通过
- [ ] 回滚验证测试通过
- [ ] 回滚后行动测试通过

## 回滚最佳实践

### 1. 预防措施

- 每次部署前创建备份
- 使用蓝绿部署策略
- 实施金丝雀发布
- 配置自动回滚规则

### 2. 监控和告警

- 实时监控应用状态
- 配置关键指标告警
- 设置自动回滚触发器
- 建立应急响应流程

### 3. 文档和沟通

- 保持回滚计划更新
- 记录所有回滚事件
- 及时通知相关团队
- 定期演练回滚流程

### 4. 持续改进

- 分析回滚原因
- 优化部署流程
- 改进测试覆盖
- 更新回滚策略

## 应急联系

**回滚团队**:
- 技术负责人: [姓名] - [电话]
- DevOps 工程师: [姓名] - [电话]
- 数据库管理员: [姓名] - [电话]

**应急联系**:
- 24/7 热线: [电话]
- 邮箱: [邮箱]

## 附录

### 回滚决策树

```
部署失败?
├─ 是 → 评估影响范围
│   ├─ 影响小 → 快速回滚（5分钟）
│   └─ 影响大 → 完整回滚（30分钟）
└─ 否 → 监控应用状态
    ├─ 正常 → 继续监控
    └─ 异常 → 触发回滚条件
        ├─ 自动触发 → 自动回滚
        └─ 手动触发 → 手动回滚
```

### 回滚时间线

| 时间 | 动作 | 负责人 |
|------|------|--------|
| T+0s | 检测到问题 | 监控系统 |
| T+30s | 评估问题 | DevOps 工程师 |
| T+60s | 决定回滚 | 技术负责人 |
| T+90s | 开始回滚 | DevOps 工程师 |
| T+150s | 回滚完成 | DevOps 工程师 |
| T+180s | 验证回滚 | QA 工程师 |
| T+300s | 通知团队 | 技术负责人 |

### 有用的命令

```bash
# Fly.io 相关
flyctl releases
flyctl release rollback
flyctl apps stop
flyctl apps start
flyctl status
flyctl logs

# Supabase 相关
supabase migration list
supabase migration down
supabase db dump
supabase db reset
supabase db diff

# Git 相关
git log --oneline
git tag
git checkout
git revert

# Docker 相关
docker ps
docker stop
docker start
docker logs
```

---

**最后更新**: 2026-03-14
**版本**: 1.0.0
