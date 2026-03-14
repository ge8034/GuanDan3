# Sentry 错误监控配置指南

## 概述

Sentry 已集成到项目中，用于实时监控和报告应用程序错误。

## 配置步骤

### 1. 创建 Sentry 账户

1. 访问 [https://sentry.io](https://sentry.io)
2. 注册账户（免费计划支持 5,000 个错误/月）
3. 创建新项目，选择 "Next.js" 作为平台

### 2. 获取 DSN

在 Sentry 项目设置中找到 DSN (Data Source Name)：
- 进入项目设置 → Client Keys (DSN)
- 复制 DSN 值

### 3. 配置环境变量

在 `.env.local` 文件中添加：

```env
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id
SENTRY_ORG=your-org-name
SENTRY_PROJECT=your-project-name
```

### 4. 验证配置

运行开发服务器并触发一个错误：

```bash
npm run dev
```

在浏览器中访问应用，Sentry 应该会捕获错误。

## 功能特性

### 自动错误捕获

- JavaScript 运行时错误
- 未处理的 Promise 拒绝
- React 组件错误
- API 路由错误

### 性能监控

- 页面加载时间
- API 响应时间
- 数据库查询时间

### 会话重放

- 记录用户交互
- 帮助重现错误场景
- 自动屏蔽敏感信息

## 配置选项

### 客户端配置 (sentry.client.config.ts)

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,           // 性能监控采样率 (0-1)
  replaysSessionSampleRate: 0.1,    // 会话重放采样率 (0-1)
  replaysOnErrorSampleRate: 1.0,   // 错误时重放采样率 (0-1)
  environment: process.env.NODE_ENV,
})
```

### 服务器端配置 (sentry.server.config.ts)

```typescript
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

## 手动错误报告

### 捕获异常

```typescript
import * as Sentry from "@sentry/nextjs"

try {
  // 可能出错的代码
} catch (error) {
  Sentry.captureException(error)
}
```

### 捕获消息

```typescript
Sentry.captureMessage("Something went wrong", "warning")
```

### 添加上下文

```typescript
Sentry.withScope((scope) => {
  scope.setUser({ id: "123", email: "user@example.com" })
  scope.setTag("feature", "game")
  scope.setContext("game_state", { level: 5, score: 100 })
  Sentry.captureException(error)
})
```

## 性能监控

### 自定义事务

```typescript
const transaction = Sentry.startTransaction({
  op: "game_action",
  name: "player_move",
})

try {
  // 游戏逻辑
} finally {
  transaction.finish()
}
```

### 跨度 (Spans)

```typescript
const span = transaction.startChild({
  op: "database",
  description: "save_game_state",
})

// 数据库操作

span.finish()
```

## 过滤敏感信息

### 自动过滤

已配置自动过滤：
- 所有文本内容
- 媒体文件
- 密码字段

### 自定义过滤

```typescript
Sentry.init({
  beforeSend(event) {
    // 移除敏感数据
    if (event.request?.headers) {
      delete event.request.headers['authorization']
    }
    return event
  },
})
```

## 环境配置

### 开发环境

开发环境默认不发送错误到 Sentry：

```typescript
beforeSend(event) {
  if (process.env.NODE_ENV === "development") {
    return null
  }
  return event
}
```

### 生产环境

生产环境自动启用所有监控功能。

## 故障排查

### 错误未上报

1. 检查 DSN 配置是否正确
2. 查看浏览器控制台是否有 Sentry 错误
3. 确认网络连接正常
4. 检查 Sentry 配额是否用完

### 性能数据缺失

1. 确认 `tracesSampleRate` > 0
2. 检查浏览器是否支持 Performance API
3. 验证网络请求是否被阻止

### 会话重放不工作

1. 确认 `replaysSessionSampleRate` > 0
2. 检查浏览器是否支持相关 API
3. 验证存储配额是否足够

## 成本优化

### 调整采样率

```typescript
tracesSampleRate: 0.1,        // 10% 性能监控
replaysSessionSampleRate: 0.01, // 1% 会话重放
```

### 错误过滤

```typescript
beforeSend(event) {
  // 忽略特定错误
  if (event.exception?.values?.[0]?.type === "ResizeObserver loop limit exceeded") {
    return null
  }
  return event
}
```

## 最佳实践

1. **设置合理的采样率**：平衡监控覆盖和成本
2. **添加有意义的上下文**：帮助快速定位问题
3. **定期审查错误**：及时修复高频错误
4. **使用环境标签**：区分不同环境的错误
5. **配置告警**：及时收到关键错误通知

## 相关资源

- [Sentry Next.js 文档](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry 性能监控](https://docs.sentry.io/platforms/javascript/performance/)
- [Sentry 会话重放](https://docs.sentry.io/platforms/javascript/session-replay/)
