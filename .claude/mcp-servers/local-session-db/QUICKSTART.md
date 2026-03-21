# 本地会话数据库 - 快速参考

## 📦 安装

```powershell
.\setup-local-session-db.ps1
```

## 🧪 测试

```powershell
.\.claude\mcp-servers\local-session-db\mcp-manager.ps1 -Command test
```

## 🔄 重启 Claude Code

安装后必须重启才能使配置生效。

## 📚 MCP 工具速查

### 1. 获取会话数据
```
工具: get_session
参数: { sessionId: "xxx" }
返回: 会话数据对象
```

### 2. 保存会话数据
```
工具: save_session
参数: { sessionId: "xxx", data: { ... } }
返回: 成功消息
```

### 3. 删除会话数据
```
工具: delete_session
参数: { sessionId: "xxx" }
返回: 成功/失败消息
```

### 4. 列出所有会话
```
工具: list_sessions
参数: {}
返回: 会话 ID 数组
```

## 🔗 HTTP API 速查

### 基本命令
```bash
# 启动 API 服务器
node .claude/mcp-servers/local-session-db/api-server.js

# 测试健康检查
curl http://localhost:3001/api/health

# 列出会话
curl http://localhost:3001/api/sessions
```

### 常用命令
```bash
# 保存会话
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "test", "data": {"key": "value"}}'

# 获取会话
curl http://localhost:3001/api/sessions/test

# 删除会话
curl -X DELETE http://localhost:3001/api/sessions/test
```

## 💡 典型使用场景

### 场景 1: 缓存 API 响应
```typescript
// 保存 API 响应
await callMcpTool('save_session', {
  sessionId: 'api-response-123',
  data: { response: await fetchData() }
});

// 后续直接从本地读取
const cached = await callMcpTool('get_session', {
  sessionId: 'api-response-123'
});
```

### 场景 2: 跨会话共享数据
```typescript
// 在一个会话保存
await callMcpTool('save_session', {
  sessionId: 'user-prefs',
  data: { theme: 'dark', fontSize: 14 }
});

// 在另一个会话读取
const prefs = await callMcpTool('get_session', {
  sessionId: 'user-prefs'
});
```

### 场景 3: 快速调试
```typescript
// 保存调试信息
await callMcpTool('save_session', {
  sessionId: 'debug-123',
  data: { error: 'Some error', stack: 'Stack trace...' }
});

// 查看
await callMcpTool('get_session', { sessionId: 'debug-123' });
```

## 📂 会话文件位置

```
.claude/mcp-servers/local-session-db/sessions/
├── session-123.json
├── session-456.json
└── ...
```

## ⚡ 性能优势

- **比 API 快**: 磁盘 I/O vs 网络请求
- **避免限流**: 无 API 调用
- **离线可用**: 无需网络

## 🔍 查看会话内容

```bash
# 查看所有会话
ls .claude/mcp-servers/local-session-db/sessions/

# 查看特定会话
cat .claude/mcp-servers/local-session-db/sessions/session-123.json
```

## 🛠️ 故障排除

### 问题: MCP 工具不可用
**解决**: 重启 Claude Code

### 问题: 依赖未安装
**解决**: 运行 `npm install`

### 问题: 权限错误
**解决**: 以管理员身份运行 PowerShell

### 问题: API 服务器无法启动
**解决**: 检查端口 3001 是否被占用

## 📖 详细文档

完整文档请查看 [README.md](./README.md)
