# GuanDan3 Web 部署指南

## 前置条件

1. 安装 Fly.io CLI:
   ```bash
   # Windows (PowerShell)
   iwr https://fly.io/install.ps1 -useb | iex

   # macOS/Linux
   curl -L https://fly.io/install.sh | sh
   ```

2. 登录 Fly.io:
   ```bash
   fly auth login
   ```

## 部署步骤

### 1. 创建 Fly.io 应用

```bash
cd guandan3-web
fly launch
```

按照提示配置:
- App name: `guandan3-web` (或自定义)
- Region: 选择离用户最近的区域
- Database: 暂时不需要 (使用 Supabase)

### 2. 配置环境变量

```bash
fly secrets set NEXT_PUBLIC_SUPABASE_URL=https://rzzywltxlfgucngfiznx.supabase.co
fly secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM
```

### 3. 部署应用

```bash
fly deploy
```

### 4. 验证部署

```bash
fly open
```

## 监控和维护

### 查看日志
```bash
fly logs
```

### 查看应用状态
```bash
fly status
```

### 扩展实例
```bash
fly scale count 2
```

## 数据库迁移

确保 Supabase 数据库已应用最新的 schema:

```bash
cd supabase
supabase db push
```

## 性能优化建议

1. **启用 CDN**: Fly.io 自动提供全球 CDN
2. **配置缓存**: 考虑添加 Redis 缓存层
3. **监控**: 集成 Sentry 进行错误监控
4. **日志**: 配置结构化日志输出

## 故障排查

### 构建失败
- 检查 Node.js 版本兼容性
- 验证环境变量配置
- 查看构建日志: `fly logs`

### 运行时错误
- 检查 Supabase 连接
- 验证 RLS 策略配置
- 查看应用日志: `fly logs`

### 性能问题
- 检查实例资源使用: `fly status`
- 考虑升级实例规格
- 优化数据库查询

## 成本估算

- 基础实例: ~$5-10/月
- 带宽: 根据使用量计费
- 总计: ~$10-20/月 (小规模应用)

## 备份策略

- Supabase 自动备份
- 定期导出数据库: `supabase db dump`
- 代码版本控制: Git
