# 部署前检查清单

## 概述

本文档提供了 GuanDan3 项目部署到生产环境的完整检查清单，确保所有必要步骤都已完成。

## 检查清单

### 1. 代码质量检查

- [ ] 所有代码已提交到 main 分支
- [ ] 代码审查已完成
- [ ] 所有测试通过（单元测试、集成测试、E2E 测试）
- [ ] 代码覆盖率符合要求（建议 >80%）
- [ ] 无 linting 错误
- [ ] 无 TypeScript 类型错误
- [ ] 无安全漏洞（npm audit 通过）

**验证命令**:
```bash
npm run lint
npm run type-check
npm test
npm audit
```

### 2. 依赖检查

- [ ] 所有依赖已更新到最新稳定版本
- [ ] package.json 和 package-lock.json 已同步
- [ ] 无未使用的依赖
- [ ] 生产依赖和开发依赖分离正确

**验证命令**:
```bash
npm outdated
npm ci
```

### 3. 环境变量配置

- [ ] `.env.example` 已更新（包含所有必需的环境变量）
- [ ] 生产环境变量已配置
- [ ] 敏感信息已从代码中移除
- [ ] `.env.local` 已添加到 `.gitignore`

**必需的环境变量**:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_AUTH_TOKEN=your_sentry_auth_token

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://guandan3.example.com
```

### 4. 数据库准备

- [ ] Supabase 项目已创建
- [ ] 数据库迁移已执行
- [ ] RLS 策略已启用
- [ ] 索引已创建
- [ ] 数据库备份已配置
- [ ] 数据库连接测试通过

**验证命令**:
```bash
cd supabase
supabase db push
supabase db diff --schema public
```

### 5. 构建验证

- [ ] 生产构建成功
- [ ] 构建产物大小合理
- [ ] 静态资源已优化
- [ ] 图片已压缩
- [ ] CSS/JS 已压缩

**验证命令**:
```bash
npm run build
```

**检查构建产物**:
```bash
ls -lh .next/static/
```

### 6. 性能优化

- [ ] 代码分割已配置
- [ ] 懒加载已实现
- [ ] 图片优化已启用
- [ ] 缓存策略已配置
- [ ] CDN 已配置（如需要）
- [ ] 性能测试通过

**性能测试**:
```bash
cd k6
k6 run load-test.js
```

### 7. 安全检查

- [ ] 安全审计通过
- [ ] HTTPS 已启用
- [ ] 安全头部已配置
- [ ] CSP 已配置
- [ ] XSS 防护已启用
- [ ] CSRF 防护已启用
- [ ] 速率限制已配置

**安全头部检查**:
```bash
curl -I https://guandan3.example.com
```

### 8. 监控和日志

- [ ] Sentry 已配置
- [ ] 错误监控已启用
- [ ] 性能监控已启用
- [ ] 日志记录已配置
- [ ] 告警规则已设置
- [ ] 日志存储已配置

**验证 Sentry**:
- 检查 Sentry Dashboard 是否收到错误
- 验证性能追踪是否正常工作

### 9. CI/CD 配置

- [ ] GitHub Actions 工作流已配置
- [ ] GitHub Secrets 已设置
- [ ] 自动化测试已配置
- [ ] 自动化部署已配置
- [ ] 部署通知已配置

**必需的 GitHub Secrets**:
- `FLY_API_TOKEN`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_URL`

### 10. 部署平台配置

#### Fly.io 配置

- [ ] Fly.io 账户已创建
- [ ] Fly.io CLI 已安装
- [ ] 应用已创建
- [ ] 区域已配置（建议：iad）
- [ ] 环境变量已设置
- [ ] 健康检查已配置
- [ ] 自动扩展已配置

**验证 Fly.io**:
```bash
flyctl apps list
flyctl secrets list
```

#### Docker 配置

- [ ] Dockerfile 已优化
- [ ] 多阶段构建已配置
- [ ] 镜像大小已优化
- [ ] 非 root 用户已配置
- [ ] 安全扫描已通过

**验证 Docker**:
```bash
docker build -t guandan3:latest .
docker scan guandan3:latest
```

### 11. 域名和 DNS

- [ ] 域名已购买
- [ ] DNS 记录已配置
- [ ] SSL 证书已配置
- [ ] CDN 已配置（如需要）
- [ ] 域名解析测试通过

**验证 DNS**:
```bash
nslookup guandan3.example.com
dig guandan3.example.com
```

### 12. 文档准备

- [ ] 用户文档已更新
- [ ] API 文档已更新
- [ ] 部署文档已更新
- [ ] 故障排除文档已更新
- [ ] 变更日志已更新

### 13. 备份和恢复

- [ ] 数据库备份已配置
- [ ] 备份策略已制定
- [ ] 恢复流程已测试
- [ ] 备份监控已配置

**测试备份恢复**:
```bash
# 备份数据库
supabase db dump -f backup.sql

# 恢复数据库
supabase db reset --db-url "postgresql://..."
```

### 14. 回滚计划

- [ ] 回滚流程已文档化
- [ ] 回滚脚本已准备
- [ ] 数据库回滚策略已制定
- [ ] 回滚测试已完成

### 15. 测试环境验证

- [ ] 测试环境已部署
- [ ] 功能测试通过
- [ ] 性能测试通过
- [ ] 安全测试通过
- [ ] 用户验收测试通过

### 16. 生产环境准备

- [ ] 生产环境已配置
- [ ] 生产数据库已准备
- [ ] 生产监控已配置
- [ ] 生产告警已设置
- [ ] 生产备份已配置

### 17. 团队准备

- [ ] 团队已通知部署时间
- [ ] 值班人员已安排
- [ ] 应急联系人已确认
- [ ] 部署流程已演练

### 18. 合规性检查

- [ ] 隐私政策已更新
- [ ] 服务条款已更新
- [ ] 数据保护合规
- [ ] 法律审查已完成

## 部署前最终检查

### 代码检查

```bash
# 检查分支
git branch
git status

# 检查最新提交
git log -1

# 检查未提交的更改
git diff
```

### 构建检查

```bash
# 清理构建
rm -rf .next

# 生产构建
npm run build

# 检查构建产物
ls -lh .next/
```

### 环境变量检查

```bash
# 检查环境变量文件
cat .env.production

# 验证必需变量
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### 数据库检查

```bash
# 检查数据库连接
supabase status

# 检查迁移状态
supabase db diff --schema public
```

### 依赖检查

```bash
# 检查依赖
npm list

# 检查安全漏洞
npm audit
```

## 部署步骤

### 1. 创建备份

```bash
# 数据库备份
supabase db dump -f pre-deploy-backup.sql

# 代码备份
git tag pre-deploy-$(date +%Y%m%d)
```

### 2. 执行部署

```bash
# 使用 GitHub Actions 自动部署
git push origin main

# 或使用手动部署
flyctl deploy --remote-only
```

### 3. 验证部署

```bash
# 健康检查
curl https://guandan3.example.com/api/health

# 功能测试
# 运行关键功能测试

# 性能测试
# 运行性能测试脚本
```

### 4. 监控验证

- [ ] 检查 Sentry 错误日志
- [ ] 检查应用性能指标
- [ ] 检查数据库性能
- [ ] 检查服务器资源使用

## 部署后检查

### 功能验证

- [ ] 用户注册/登录正常
- [ ] 创建房间正常
- [ ] 加入房间正常
- [ ] 游戏功能正常
- [ ] 战绩记录正常
- [ ] 实时通信正常

### 性能验证

- [ ] 页面加载时间 < 3s
- [ ] API 响应时间 < 500ms
- [ ] 数据库查询时间 < 100ms
- [ ] WebSocket 连接稳定

### 安全验证

- [ ] HTTPS 正常工作
- [ ] 安全头部正确配置
- [ ] 无安全漏洞
- [ ] 访问控制正常

### 监控验证

- [ ] 错误监控正常
- [ ] 性能监控正常
- [ ] 日志记录正常
- [ ] 告警正常触发

## 应急预案

### 部署失败

1. 立即停止部署
2. 检查错误日志
3. 回滚到上一个稳定版本
4. 分析失败原因
5. 修复问题后重新部署

### 性能问题

1. 检查服务器资源
2. 检查数据库性能
3. 检查 CDN 状态
4. 必要时回滚

### 安全问题

1. 立即隔离受影响系统
2. 检查安全日志
3. 修复安全漏洞
4. 重新部署修复版本

## 联系信息

**部署团队**:
- 技术负责人: [姓名] - [电话]
- DevOps 工程师: [姓名] - [电话]
- 数据库管理员: [姓名] - [电话]

**应急联系**:
- 24/7 热线: [电话]
- 邮箱: [邮箱]

## 附录

### 有用的命令

```bash
# Fly.io 相关
flyctl apps list
flyctl status
flyctl logs
flyctl secrets list

# Supabase 相关
supabase status
supabase db push
supabase db dump

# Git 相关
git log --oneline -10
git tag
git diff main

# Docker 相关
docker ps
docker logs <container_id>
docker stats
```

### 检查清单模板

可以复制此检查清单到项目管理工具（如 Jira、Trello）中进行跟踪。

---

**最后更新**: 2026-03-14
**版本**: 1.0.0
