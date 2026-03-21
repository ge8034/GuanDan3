# 本地会话数据库 MCP 服务器

## 📋 概述

这是一个 Model Context Protocol (MCP) 服务器，用于高效访问会话数据，避免频繁的 API 调用和速率限制。

## 🎯 主要功能

- **快速访问**: 从本地文件系统读取会话数据，无需网络请求
- **持久存储**: 会话数据保存在本地，随时可访问
- **REST API**: 提供 HTTP API 接口，支持多种客户端访问
- **类型安全**: 完整的 TypeScript 支持和类型定义

## 🚀 快速开始

### 1. 安装

```powershell
# 在项目根目录执行
.\.claude\mcp-servers\local-session-db\mcp-manager.ps1 -Command install
```

### 2. 测试

```powershell
.\.claude\mcp-servers\local-session-db\mcp-manager.ps1 -Command test
```

### 3. 重启 Claude Code

安装完成后，需要重启 Claude Code 以使配置生效。

## 📖 使用方法

### MCP 工具使用

在 Claude Code 中直接调用提供的工具：

#### 1. 获取会话数据
```typescript
await callMcpTool('get_session', {
  sessionId: 'my-session-id'
});
// 返回: { success: true, data: { ... } }
```

#### 2. 保存会话数据
```typescript
await callMcpTool('save_session', {
  sessionId: 'my-session-id',
  data: {
    key: 'value',
    timestamp: new Date().toISOString()
  }
});
// 返回: { success: true, message: '会话已保存' }
```

#### 3. 删除会话数据
```typescript
await callMcpTool('delete_session', {
  sessionId: 'my-session-id'
});
// 返回: { success: true, message: '会话已删除' }
```

#### 4. 列出所有会话
```typescript
const result = await callMcpTool('list_sessions', {});
// 返回: { success: true, data: ['session-1', 'session-2', ...] }
```

### HTTP API 使用

启动 API 服务器后，可以通过 HTTP 请求访问：

#### 启动 API 服务器
```bash
cd .claude/mcp-servers/local-session-db
node api-server.js
```

默认运行在端口 3001，可通过环境变量 `SESSION_DB_PORT` 修改。

#### API 端点列表

##### 健康检查
```bash
curl http://localhost:3001/api/health
```
返回:
```json
{
  "success": true,
  "message": "本地会话数据库服务运行正常",
  "timestamp": "2026-03-17T07:34:45.694Z"
}
```

##### 获取所有会话 ID
```bash
curl http://localhost:3001/api/sessions
```

##### 获取指定会话数据
```bash
curl http://localhost:3001/api/sessions/session-123
```

##### 保存会话数据
```bash
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "session-123",
    "data": {
      "userId": "user-456",
      "content": "重要内容...",
      "timestamp": "2026-03-17T07:34:45.694Z"
    }
  }'
```

##### 删除会话数据
```bash
curl -X DELETE http://localhost:3001/api/sessions/session-123
```

## 🔄 在其他项目中使用

### 方案 1: 直接复制整个目录（推荐新手）

```powershell
# 1. 复制整个 MCP 服务器目录
Copy-Item -Path ".claude/mcp-servers/local-session-db" `
          -Destination "path/to/new-project/.claude/mcp-servers/" `
          -Recurse -Force

# 2. 安装依赖
cd path/to/new-project/.claude/mcp-servers/local-session-db
npm install

# 3. 添加到项目的 mcp-config.json
# 编辑 mcp-config.json，添加：
{
  "local-session-db": {
    "command": "node",
    "args": [".claude/mcp-servers/local-session-db/index.js"]
  }
}

# 4. 测试
.\mcp-manager.ps1 -Command test

# 5. 重启 Claude Code
```

### 方案 2: 使用 Git 技能仓库（推荐团队协作）

```powershell
# 在技能仓库中
cd d:\Learn-Claude\GuanDan3\.claude\mcp-servers\local-session-db

# 提交到 Git
git add .
git commit -m "feat: add local session database MCP server"
git push

# 在新项目中
git clone <your-skill-repo-url>
cp -r .claude/mcp-servers/local-session-db .claude/mcp-servers/
cd .claude/mcp-servers/local-session-db
npm install
```

### 方案 3: 发布到 npm（适合多个项目）

#### 步骤 1: 在 MCP 服务器目录中操作

```bash
cd .claude/mcp-servers/local-session-db

# 初始化 npm 项目（如果还没有）
npm init -y

# 发布到 npm
npm publish
```

#### 步骤 2: 在新项目中使用

```json
{
  "mcpServers": {
    "local-session-db": {
      "command": "npx",
      "args": ["-y", "local-session-db-mcp"]
    }
  }
}
```

## 🔧 配置

### MCP 配置

配置文件位置: `mcp-config.json`

```json
{
  "local-session-db": {
    "command": "node",
    "args": [".claude/mcp-servers/local-session-db/index.js"]
  }
}
```

### 环境变量

- `SESSION_DB_PORT`: API 服务器端口（默认: 3001）

## 📁 文件结构

```
local-session-db/
├── index.js              # MCP 服务器主文件
├── api-server.js         # HTTP API 服务器
├── package.json          # Node.js 依赖
├── mcp-config.json       # MCP 配置
├── mcp-manager.ps1       # PowerShell 管理脚本
└── README.md             # 说明文档
```

## 💡 实际使用示例

### 示例 1: 缓存 API 响应避免限流

```typescript
async function getWithCache(apiUrl: string) {
  const cacheKey = `api-response-${apiUrl}`;

  // 先尝试从缓存获取
  const cached = await callMcpTool('get_session', { sessionId: cacheKey });
  if (cached) {
    console.log('从缓存读取:', cacheKey);
    return cached.data;
  }

  // 缓存未命中，调用 API
  console.log('调用 API:', apiUrl);
  const response = await fetch(apiUrl);
  const data = await response.json();

  // 保存到缓存
  await callMcpTool('save_session', {
    sessionId: cacheKey,
    data: {
      response: data,
      cachedAt: new Date().toISOString(),
      ttl: 86400 // 24 小时过期
    }
  });

  return data;
}

// 使用示例
const data1 = await getWithCache('https://api.example.com/users/123');
const data2 = await getWithCache('https://api.example.com/users/123'); // 从缓存读取
```

### 示例 2: 保存用户偏好设置

```typescript
// 保存用户偏好
await callMcpTool('save_session', {
  sessionId: 'user-prefs-admin',
  data: {
    theme: 'dark',
    fontSize: 14,
    language: 'zh-CN',
    lastVisit: new Date().toISOString()
  }
});

// 读取用户偏好
const prefs = await callMcpTool('get_session', {
  sessionId: 'user-prefs-admin'
});

console.log(prefs.data.theme); // 'dark'
console.log(prefs.data.fontSize); // 14

// 更新用户偏好
await callMcpTool('save_session', {
  sessionId: 'user-prefs-admin',
  data: {
    ...prefs.data,
    theme: 'light', // 更新主题
    lastVisit: new Date().toISOString() // 更新访问时间
  }
});
```

### 示例 3: 跨会话共享数据

```typescript
// 会话 A 保存数据
await callMcpTool('save_session', {
  sessionId: 'shared-data-project-x',
  data: { projectStatus: 'in-progress', progress: 75 }
});

// 会话 B 读取共享数据
const status = await callMcpTool('get_session', {
  sessionId: 'shared-data-project-x'
});

console.log(status.data.projectStatus); // 'in-progress'

// 会话 C 添加更多数据
await callMcpTool('save_session', {
  sessionId: 'shared-data-project-x',
  data: {
    ...status.data,
    projectStatus: 'completed', // 更新状态
    completedAt: new Date().toISOString()
  }
});

// 会话 D 读取更新后的数据
const updatedStatus = await callMcpTool('get_session', {
  sessionId: 'shared-data-project-x'
});

// 列出所有共享数据会话
const allSessions = await callMcpTool('list_sessions', {});
const sharedSessions = allSessions.data.filter(id =>
  id.startsWith('shared-data-')
);

console.log('共享会话:', sharedSessions);
// 输出: ['shared-data-project-x', 'shared-data-project-y', ...]
```

### 示例 4: 快速调试

```typescript
// 保存调试信息
await callMcpTool('save_session', {
  sessionId: 'debug-20260317-123456',
  data: {
    error: 'Database connection failed',
    stack: 'Error: Connection timeout\n    at Database.connect (...)',
    timestamp: new Date().toISOString(),
    requestData: { userId: '123', action: 'update' }
  }
});

// 查看调试信息
const debugInfo = await callMcpTool('get_session', {
  sessionId: 'debug-20260317-123456'
});

// 列出所有调试会话
const allDebugSessions = (await callMcpTool('list_sessions', {})).data.filter(id =>
  id.startsWith('debug-')
);

console.log('调试会话列表:', allDebugSessions);

// 删除旧的调试会话
const oldSessions = allDebugSessions.filter(id => {
  const session = (await callMcpTool('get_session', { sessionId: id })).data;
  return isOld(session.timestamp, 7); // 超过 7 天
});

for (const id of oldSessions) {
  await callMcpTool('delete_session', { sessionId: id });
}
```

### 示例 5: 使用 HTTP API 缓存数据

```bash
#!/bin/bash

# 保存 API 响应到缓存
API_URL="https://api.example.com/data"
CACHE_KEY="api-response-my-data"

curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d "{
    \"sessionId\": \"$CACHE_KEY\",
    \"data\": {
      \"response\": $(curl -s $API_URL),
      \"cachedAt\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
    }
  }"

# 从缓存读取
curl http://localhost:3001/api/sessions/$CACHE_KEY

# 列出所有缓存
curl http://localhost:3001/api/sessions

# 删除缓存
curl -X DELETE http://localhost:3001/api/sessions/$CACHE_KEY
```

## 🎯 使用场景

### 场景 1: 避免频繁的 API 调用

当您需要频繁访问会话数据时，使用本地会话数据库可以：

- ✅ 避免触发 API 速率限制
- ✅ 减少网络延迟
- ✅ 提高响应速度

### 场景 2: 离线访问

本地存储支持离线访问，即使网络不可用也能读取会话数据。

### 场景 3: 大量数据缓存

适合缓存大量会话数据，减少 API 调用次数。

### 场景 4: 会话间数据共享

在多个会话或组件间共享数据，无需通过全局变量或第三方存储。

### 场景 5: 快速原型开发

在开发过程中快速保存和加载调试数据，提高开发效率。

## 🛡️ 最佳实践

### 会话 ID 命名规范

```typescript
// API 响应缓存
`api-response-${url}`

// 用户偏好
`user-prefs-${userId}`

// 项目数据
`project-${projectId}`

// 调试信息
`debug-${timestamp}`

// 临时数据
`temp-${random-id}`
```

### 定期清理旧数据

```typescript
async function cleanupOldSessions(daysOld = 7) {
  const sessions = await callMcpTool('list_sessions', {});
  const now = Date.now();
  const daysMs = daysOld * 24 * 60 * 60 * 1000;

  for (const id of sessions.data) {
    const session = await callMcpTool('get_session', { sessionId: id });
    if (session.data.cachedAt) {
      const cachedTime = new Date(session.data.cachedAt).getTime();
      if (now - cachedTime > daysMs) {
        await callMcpTool('delete_session', { sessionId: id });
        console.log(`已删除过期会话: ${id}`);
      }
    }
  }
}

// 每天清理一次
cleanupOldSessions(7);
```

### 数据结构优化

```typescript
// 推荐：带版本和时间戳的数据结构
{
  sessionId: "xxx",
  data: {
    version: 1,
    cachedAt: "2026-03-17T07:34:45.694Z",
    ttl: 86400,
    expiresAt: "2026-03-18T07:34:45.694Z",
    data: {
      // 实际数据
    }
  }
}

// 使用方法
function isExpired(session: any): boolean {
  if (!session.data.ttl) return false;
  const expiresAt = new Date(session.data.cachedAt);
  expiresAt.setSeconds(expiresAt.getSeconds() + session.data.ttl);
  return Date.now() > expiresAt.getTime();
}

// 使用前检查过期
const session = await callMcpTool('get_session', { sessionId: 'xxx' });
if (session && !isExpired(session)) {
  // 使用会话数据
} else {
  // 从 API 获取新数据
}
```

## 🛡️ 安全性

- ✅ 使用 helmet 防止常见 Web 安全问题
- ✅ CORS 支持（可配置）
- ✅ 输入验证

## 📝 开发

### 启动 MCP 服务器

```bash
cd .claude/mcp-servers/local-session-db
node index.js
```

### 启动 API 服务器

```bash
cd .claude/mcp-servers/local-session-db
node api-server.js
```

### 安装依赖

```bash
npm install
```

## 🧪 测试

### 测试 MCP 工具

在 Claude Code 中，您可以：

1. 列出可用的工具
2. 调用工具并查看返回结果
3. 测试各种操作（读取、写入、删除）

```typescript
// 测试保存会话
const result1 = await callMcpTool('save_session', {
  sessionId: 'test-session',
  data: { message: 'Hello, MCP!' }
});
console.log(result1);

// 测试获取会话
const result2 = await callMcpTool('get_session', {
  sessionId: 'test-session'
});
console.log(result2);

// 测试列出所有会话
const result3 = await callMcpTool('list_sessions', {});
console.log(result3);

// 测试删除会话
const result4 = await callMcpTool('delete_session', {
  sessionId: 'test-session'
});
console.log(result4);
```

### 测试 HTTP API

```bash
# 安装 HTTPie（可选）
pip install httpie

# 测试 API
http GET http://localhost:3001/api/health
http GET http://localhost:3001/api/sessions

# 测试保存会话
http POST http://localhost:3001/api/sessions sessionId:test-session data:{"message":"Hello from HTTP API!"}

# 测试获取会话
http GET http://localhost:3001/api/sessions/test-session

# 测试删除会话
http DELETE http://localhost:3001/api/sessions/test-session
```

## 🔧 故障排除

### 问题：MCP 工具不可用

**症状**：在 Claude Code 中看不到 local-session-db 工具

**解决步骤**：
1. 确认 MCP 配置文件包含 local-session-db 配置
2. 确认依赖已安装：`npm install`
3. **重启 Claude Code**（必须！）

```powershell
# 检查配置
Get-Content mcp-config.json

# 安装依赖
cd .claude/mcp-servers/local-session-db
npm install

# 测试
.\mcp-manager.ps1 -Command test
```

### 问题：依赖未安装

**症状**：运行时出现 "Cannot find module" 错误

**解决**：
```bash
cd .claude/mcp-servers/local-session-db
npm install
```

### 问题：权限错误

**症状**：无法写入会话文件

**解决**：
- 以管理员身份运行 PowerShell
- 检查文件夹权限

```powershell
# 以管理员身份运行 PowerShell
# 然后执行操作
cd .claude/mcp-servers/local-session-db
npm install
.\mcp-manager.ps1 -Command install
```

### 问题：API 服务器端口被占用

**症状**：API 服务器无法启动，提示 "port already in use"

**解决**：
```bash
# 设置不同的端口
export SESSION_DB_PORT=3002
node api-server.js

# 或在 PowerShell 中
$env:SESSION_DB_PORT = "3002"
node api-server.js
```

### 问题：会话文件损坏

**症状**：读取会话时出现错误

**解决**：
```bash
# 手动删除损坏的会话文件
rm .claude/mcp-servers/local-session-db/sessions/session-id.json

# 或使用 MCP 工具删除
await callMcpTool('delete_session', { sessionId: 'session-id' })
```

### 问题：会话数据丢失

**症状**：保存的数据无法读取

**解决**：
1. 检查会话文件位置
2. 验证文件权限
3. 检查文件内容是否为有效的 JSON

```bash
# 查看会话文件
cat .claude/mcp-servers/local-session-db/sessions/session-id.json

# 如果文件损坏，删除后重新创建
```

### 问题：磁盘空间不足

**症状**：保存会话时出现 "ENOSPC" 错误

**解决**：
```bash
# 清理旧会话
# 方法 1: 使用 MCP 工具
const sessions = await callMcpTool('list_sessions', {});
for (const id of sessions.data) {
  await callMcpTool('delete_session', { sessionId: id });
}

# 方法 2: 手动删除
rm .claude/mcp-servers/local-session-db/sessions/*.json
```

## 📊 性能对比

### MCP 工具 vs HTTP API

| 操作 | MCP 工具 | HTTP API |
|------|----------|----------|
| **响应速度** | ~1-5ms | ~5-20ms |
| **使用方式** | Claude Code 内置 | 外部工具 |
| **适用场景** | Claude Code 中直接调用 | 脚本、自动化工具 |
| **开发体验** | 简单直接 | 需要网络配置 |

### 本地存储 vs API 调用

| 指标 | 本地存储 | API 调用 |
|------|----------|----------|
| **延迟** | ~1-2ms | ~50-200ms |
| **成功率** | 99.9% | 取决于网络 |
| **限流风险** | 无 | 有 |
| **离线可用** | ✅ | ❌ |
| **成本** | 免费 | 可能付费 |

### 典型使用场景对比

#### 场景：获取用户数据

```typescript
// 使用 API
const response = await fetch('https://api.example.com/users/123');
const user = await response.json();
// 延迟: 50-200ms

// 使用本地缓存
const cached = await callMcpTool('get_session', {
  sessionId: 'user-123'
});
if (cached) {
  const user = cached.data; // 延迟: 1-2ms
} else {
  const response = await fetch('https://api.example.com/users/123');
  const user = await response.json();
  await callMcpTool('save_session', {
    sessionId: 'user-123',
    data: user
  });
}
```

#### 场景：批量获取 API 数据

```typescript
// 使用 API（可能触发限流）
for (let i = 1; i <= 100; i++) {
  const data = await fetch(`https://api.example.com/items/${i}`);
  // 100 次请求，可能触发限流

// 使用本地缓存（避免限流）
const allData = {};
for (let i = 1; i <= 100; i++) {
  const cacheKey = `item-${i}`;
  const cached = await callMcpTool('get_session', {
    sessionId: cacheKey
  });

  if (cached) {
    allData[i] = cached.data;
  } else {
    const data = await fetch(`https://api.example.com/items/${i}`);
    allData[i] = await data.json();
    await callMcpTool('save_session', {
      sessionId: cacheKey,
      data: allData[i]
    });
  }
}
// 100 次请求（大部分从缓存）
```

## 📈 性能监控

### 监控会话数量

```bash
# 查看当前会话数量
curl http://localhost:3001/api/sessions | jq '.count'
```

### 监控存储空间

```bash
# 查看会话文件大小
du -sh .claude/mcp-servers/local-session-db/sessions/
```

### 监控会话生命周期

```typescript
// 自动清理过期会话
async function monitorSessions() {
  const sessions = await callMcpTool('list_sessions', {});
  const now = Date.now();
  const ttl = 24 * 60 * 60 * 1000; // 24 小时

  for (const id of sessions.data) {
    const session = await callMcpTool('get_session', { sessionId: id });
    if (session.data.cachedAt) {
      const age = now - new Date(session.data.cachedAt).getTime();
      if (age > ttl) {
        await callMcpTool('delete_session', { sessionId: id });
        console.log(`清理过期会话: ${id}`);
      }
    }
  }
}
```

## 🎯 总结

### 核心优势

✅ **快速访问** - 磁盘 I/O 比网络请求快 10-100 倍
✅ **避免限流** - 无 API 调用，不会触发速率限制
✅ **离线可用** - 无网络也能访问数据
✅ **持久存储** - 数据永久保存在本地
✅ **简单易用** - 提供两种访问方式（MCP 工具 + HTTP API）

### 适用场景

| 场景 | 推荐方案 |
|------|----------|
| 频繁访问的缓存数据 | ✅ 强烈推荐 |
| 离线环境工作 | ✅ 推荐 |
| 避免 API 限流 | ✅ 推荐 |
| 简单数据存储 | ✅ 可用 |
| 实时数据同步 | ❌ 不适合 |
| 大规模分布式存储 | ❌ 不适合 |

### 最佳实践

1. **为缓存数据设置 TTL** - 避免数据过期
2. **定期清理旧会话** - 防止磁盘空间不足
3. **合理的会话 ID 命名** - 便于管理和查询
4. **监控会话数量** - 确保性能稳定
5. **测试网络故障恢复** - 验证缓存策略

## 📚 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io)
- [Express.js 文档](https://expressjs.com)
- [Node.js 文档](https://nodejs.org)
- [快速参考指南](./QUICKSTART.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT
