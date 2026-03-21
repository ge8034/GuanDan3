# MCP 服务器管理系统

## 📋 当前配置

### 已安装的 MCP 服务器

1. **Context7** - 数据库 MCP
   - 命令: `npx -y @upstash/context7-mcp`
   - 状态: ✅ 已启用
   - 用途: 数据库操作

2. **GitHub MCP** - GitHub API 访问
   - 类型: HTTP
   - URL: `https://api.githubcopilot.com/mcp/`
   - 状态: ❌ 已禁用
   - 用途: GitHub 操作（PR、Issue 等）

3. **Local Session DB** - 本地会话存储
   - 命令: `node .claude/mcp-servers/local-session-db/index.js`
   - 状态: ✅ 已启用
   - 用途: 快速访问会话数据，避免 API 速率限制
   - HTTP API: `http://localhost:3001/api`（可选）

### 已安装的插件

| 插件 | 状态 | 用途 |
|------|------|------|
| context7 | ✅ | 数据库 MCP |
| document-skills | ✅ | 文档管理 |
| frontend-design | ✅ | 前端设计 |
| github | ❌ | GitHub MCP |
| pyright-lsp | ✅ | Python 类型检查 |
| ralph-loop | ✅ | Python 循环功能 |
| superpowers | ✅ | 超级能力 |

---

## 🎯 推荐管理方案

### 方案 1: 集中配置管理（推荐）

创建统一的 MCP 配置文件，便于管理和切换。

#### 1.1 创建全局 MCP 配置

**位置**: `~/.claude/mcp-config.json`

```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp"]
    },
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp/",
      "headers": {
        "Authorization": "Bearer ${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    }
  }
}
```

#### 1.2 使用配置文件

Claude Code 支持通过配置文件管理 MCP 服务器。

**好处**:
- 集中管理，修改只需改一个文件
- 便于版本控制（可加入你的 GitHub 技能仓库）
- 方便备份和恢复

---

### 方案 2: 使用技能仓库统一管理（最佳实践）

将所有配置和脚本放在你的 GitHub 技能仓库中。

#### 2.1 仓库结构

```
my-claude-skills/
├── README.md
├── MCP_MANAGEMENT.md              # MCP 管理文档
├── mcp-config.json                # 全局 MCP 配置
├── mcp-manager.ps1               # 管理脚本
├── mcp-list-skills.ps1           # 列出所有技能
└── .claude/
    └── skills/
        ├── context7/
        └── github/
```

#### 2.2 管理脚本

创建 PowerShell 脚本进行集中管理。

---

## 🛠️ 推荐的日常管理流程

### 使用前：检查和启用

```powershell
# 1. 查看当前 MCP 状态
.\mcp-list-skills.ps1

# 2. 查看已安装插件
Get-Content $env:USERPROFILE\.claude\settings.json | Select-String "enabledPlugins"

# 3. 根据需要启用/禁用插件
```

### 工作时：快速切换

```powershell
# 临时启用 GitHub MCP
.\mcp-manager.ps1 -Enable github

# 临时禁用 Context7
.\mcp-manager.ps1 -Disable context7

# 重启 Claude Code 使配置生效
```

### 定期维护

```powershell
# 清理旧的缓存
.\mcp-clean-cache.ps1

# 更新所有插件
.\mcp-update.ps1
```

---

## 📝 实施建议

### 立即执行

1. **创建统一的 MCP 配置文件**
   - 位置: `~/.claude/mcp-config.json`
   - 包含所有你常用的 MCP 服务器

2. **建立管理脚本集合**
   - 配置管理
   - 清理缓存
   - 更新插件
   - 状态检查

3. **将配置加入你的技能仓库**
   - 便于跨设备同步
   - 便于团队共享

### 长期优化

1. **创建配置模板**
   - 不同项目的不同配置

2. **建立最佳实践文档**
   - 何时使用哪个 MCP
   - 性能优化建议

3. **定期维护**
   - 清理旧缓存
   - 更新到最新版本

---

## 🔧 需要创建的文件

### 1. `mcp-config.json`
全局 MCP 配置文件

### 2. `mcp-manager.ps1`
MCP 管理主脚本

### 3. `mcp-clean-cache.ps1`
清理旧缓存脚本

### 4. `mcp-list-skills.ps1`
列出所有可用技能和插件

### 5. `mcp-update.ps1`
更新所有插件脚本

---

## 💡 使用场景

### 场景 1: 需要查看 GitHub PR
```powershell
.\mcp-manager.ps1 -Enable github
# 重启 Claude Code
# 然后可以使用 /review-pr 等技能
```

### 场景 2: 需要编辑文档
```powershell
# 已经启用，直接使用
```

### 场景 3: 需要快速清理缓存
```powershell
.\mcp-clean-cache.ps1
```

### 场景 4: 需要频繁访问会话数据
```powershell
# 启用本地会话数据库
.\mcp-manager.ps1 -Command install

# 重启 Claude Code

# 在 Claude Code 中使用 MCP 工具
# - get_session: 获取会话数据
# - save_session: 保存会话数据
# - delete_session: 删除会话数据
# - list_sessions: 列出所有会话
```

### 场景 5: 使用 HTTP API 访问
```powershell
# 启动 API 服务器
cd .claude\mcp-servers\local-session-db
node api-server.js

# 在另一个终端测试
curl http://localhost:3001/api/sessions
```

---

## 📊 本地会话数据库使用指南

### 安装

```powershell
.\setup-local-session-db.ps1
```

或手动安装：

```powershell
cd .claude\mcp-servers\local-session-db
npm install
```

### 测试

```powershell
.\.claude\mcp-servers\local-session-db\mcp-manager.ps1 -Command test
```

### 使用 MCP 工具

在 Claude Code 中，您可以：

1. **获取会话数据**
   ```
   工具: get_session
   参数: { sessionId: "session-123" }
   ```

2. **保存会话数据**
   ```
   工具: save_session
   参数: { sessionId: "session-123", data: { ... } }
   ```

3. **删除会话数据**
   ```
   工具: delete_session
   参数: { sessionId: "session-123" }
   ```

4. **列出所有会话**
   ```
   工具: list_sessions
   参数: {}
   ```

### 使用 HTTP API

```bash
# 健康检查
curl http://localhost:3001/api/health

# 获取所有会话
curl http://localhost:3001/api/sessions

# 获取指定会话
curl http://localhost:3001/api/sessions/session-123

# 保存会话
curl -X POST http://localhost:3001/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"sessionId": "session-123", "data": {}}'

# 删除会话
curl -X DELETE http://localhost:3001/api/sessions/session-123
```

### 优势

- ✅ **避免速率限制**: 本地存储无需频繁 API 调用
- ✅ **快速访问**: 磁盘 I/O 比网络请求快
- ✅ **离线支持**: 无网络也能访问会话数据
- ✅ **持久存储**: 数据永久保存在本地

---

## ⚠️ 注意事项

1. **重启 Claude Code**: 修改配置后需要重启
2. **权限问题**: 某些操作需要管理员权限
3. **网络连接**: 更新插件需要网络连接
4. **备份**: 修改前建议备份配置文件
