# 通过 GitHub 仓库管理 MCP - 完整方案

## 🎯 目标

通过 GitHub 仓库集中管理所有 MCP 配置，实现：
- ✅ 跨设备同步
- ✅ 配置版本控制
- ✅ 快速备份恢复
- ✅ 团队共享

---

## 📁 推荐的 GitHub 仓库结构

```
my-claude-skills/
├── README.md
├── MCP_CONFIG.md              # MCP 配置说明
├── mcp-config.json            # 全局 MCP 配置
├── mcp-snapshot.json          # 当前配置快照
├── setup-mcp-sync.ps1         # 同步脚本
├── update-mcp.ps1             # 更新脚本
├── mcp-status-check.ps1       # 状态检查
├── mcp-quick-commands.txt     # 快速命令参考
└── .claude/
    └── skills/
        ├── context7/
        └── github/
```

---

## 🚀 快速开始

### 第一步：在 GitHub 创建仓库

访问：https://github.com/new

填写：
- **Repository name**: `my-claude-skills`
- **Description**: `Claude MCP 配置和技能管理`
- **Public**: 选择 Public 或 Private
- **Add a README file**: 勾选 ✅
- **.gitignore**: 选择 `Node`
- **Choose a license**: 选择 `MIT`
- 点击 **Create repository**

### 第二步：本地初始化仓库

```bash
cd ~
git clone https://github.com/ge8034/my-claude-skills.git
cd my-claude-skills
```

### 第三步：添加 MCP 配置文件

```bash
# 创建配置文件目录
mkdir .claude\skills

# 从当前系统复制技能
cp -r ~/.claude/skills/* .claude/skills/

# 创建全局配置
cat > mcp-config.json << 'EOF'
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
EOF

# 提交并推送
git add .
git commit -m "Add MCP configuration"
git push -u origin main
```

---

## 💡 每日使用流程

### 启动时：检查状态

```powershell
# 在 PowerShell 中
cd ~/my-claude-skills
.\mcp-status-check.ps1
```

### 需要使用某个 MCP：快速启用

```powershell
# 启用 GitHub MCP
.\setup-mcp-sync.ps1 -Enable github

# 启用 Context7
.\setup-mcp-sync.ps1 -Enable context7
```

### 每天结束时：备份当前配置

```powershell
# 创建配置快照
.\setup-mcp-sync.ps1 -Snapshot
```

### 跨设备同步：一键复制

```powershell
# 在新设备上同步配置
.\setup-mcp-sync.ps1 -Pull
```

---

## 🛠️ 核心脚本功能

### 1. `setup-mcp-sync.ps1` - 主同步脚本

**功能**:
- 从 GitHub 仓库同步配置
- 启用/禁用 MCP 插件
- 创建配置快照
- 更新技能文件

**使用方法**:
```powershell
# 同步配置
.\setup-mcp-sync.ps1 -Pull

# 启用 GitHub MCP
.\setup-mcp-sync.ps1 -Enable github

# 禁用某个插件
.\setup-mcp-sync.ps1 -Disable github

# 创建配置快照
.\setup-mcp-sync.ps1 -Snapshot

# 更新所有插件
.\setup-mcp-sync.ps1 -Update
```

### 2. `mcp-status-check.ps1` - 状态检查

**功能**:
- 查看已安装的插件
- 检查 MCP 服务器状态
- 显示配置文件信息

**使用方法**:
```powershell
.\mcp-status-check.ps1
```

### 3. `update-mcp.ps1` - 更新插件

**功能**:
- 从 GitHub 仓库更新所有 MCP 插件
- 自动检测新版本
- 备份旧版本

**使用方法**:
```powershell
.\update-mcp.ps1
```

---

## 📋 常见使用场景

### 场景 1：新电脑初始化

```powershell
# 1. 克隆仓库
cd ~
git clone https://github.com/ge8034/my-claude-skills.git

# 2. 设置软链接
cd ~/.claude
ln -s ../../my-claude-skills/.claude/skills ./skills

# 3. 同步配置
cd my-claude-skills
.\setup-mcp-sync.ps1 -Pull

# 4. 设置 Git 用户
git config user.name "你的名字"
git config user.email "你的邮箱"

# 完成！
```

### 场景 2：修改配置后应用

```powershell
# 1. 修改 mcp-config.json
cd ~/my-claude-skills

# 2. 提交更改
git add mcp-config.json
git commit -m "Update MCP configuration"
git push origin main

# 3. 在另一台电脑上拉取
cd ~/my-claude-skills
git pull origin main
```

### 场景 3：临时禁用某个 MCP

```powershell
# 禁用 GitHub MCP
.\setup-mcp-sync.ps1 -Disable github

# 重启 Claude Code

# 如果需要恢复
.\setup-mcp-sync.ps1 -Enable github

# 重启 Claude Code
```

### 场景 4：添加新的 MCP 服务器

```powershell
# 1. 在 GitHub 仓库中添加新配置
cd ~/my-claude-skills
nano mcp-config.json  # 编辑配置文件

# 2. 提交并推送
git add mcp-config.json
git commit -m "Add new MCP server"
git push origin main

# 3. 拉取配置
git pull origin main
```

---

## 🔧 脚本说明

### setup-mcp-sync.ps1

```powershell
param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Pull", "Push", "Enable", "Disable", "Snapshot", "Update")]
    [string]$Action,

    [string]$Name = $null,

    [switch]$Force
)

# 功能说明
# - Pull: 从 GitHub 拉取最新配置
# - Push: 推送本地配置到 GitHub
# - Enable: 启用指定的 MCP 插件
# - Disable: 禁用指定的 MCP 插件
# - Snapshot: 创建配置快照
# - Update: 更新所有插件
```

### 主要功能

1. **配置同步**: 在多台设备间同步配置
2. **快速启用**: 一键启用/禁用 MCP 插件
3. **版本控制**: 所有配置都有 Git 记录
4. **备份恢复**: 快速备份和恢复配置
5. **自动更新**: 从仓库获取最新版本

---

## 📊 配置管理策略

### 推荐的配置组织方式

#### 方式 1: 集中配置文件

```
my-claude-skills/
├── mcp-config.json       # 所有 MCP 服务器配置
├── .claude/skills/       # 所有技能文件
└── README.md
```

**优点**: 简单直观，易于管理
**缺点**: 配置文件较大

#### 方式 2: 按环境分配置

```
my-claude-skills/
├── mcp-config.dev.json   # 开发环境配置
├── mcp-config.prod.json  # 生产环境配置
├── mcp-config.local.json # 本地配置（.gitignore）
└── mcp-config.json       # 默认配置
```

**优点**: 不同环境使用不同配置
**缺点**: 需要手动切换

#### 方式 3: 环境变量 + 配置模板

```
my-claude-skills/
├── templates/
│   ├── mcp-template.json
│   └── settings-template.json
├── configs/
│   ├── dev.json
│   ├── prod.json
│   └── local.json
└── generate-config.ps1  # 生成最终配置
```

**优点**: 灵活，易于定制
**缺点**: 需要额外的生成步骤

---

## ⚠️ 最佳实践

### 1. 定期备份

```powershell
# 每周创建一次配置快照
cd ~/my-claude-skills
.\setup-mcp-sync.ps1 -Snapshot
```

### 2. 提交前检查

```powershell
# 在推送前检查配置
cd ~/my-claude-skills
.\mcp-status-check.ps1
git status
```

### 3. 使用分支管理配置

```bash
# 为不同项目创建分支
git checkout -b feature/frontend-projects
# 修改配置并提交
git push -u origin feature/frontend-projects

# 在新项目使用
git checkout feature/frontend-projects
```

### 4. 文档同步

在 README.md 中记录：
- 每个配置的作用
- 何时使用什么配置
- 已知问题和解决方案

---

## 🎯 使用流程总结

### 日常使用

1. **启动**: 检查状态 `.\mcp-status-check.ps1`
2. **工作**: 根据需要启用/禁用 MCP
3. **结束**: 保存配置快照 `.\setup-mcp-sync.ps1 -Snapshot`

### 跨设备同步

1. **新设备**: `git clone` 仓库
2. **应用配置**: `.\setup-mcp-sync.ps1 -Pull`
3. **设置 Git**: `git config user.name/email`

### 配置更新

1. **修改配置**: 编辑 `mcp-config.json`
2. **提交更改**: `git commit -m "..."` 和 `git push`
3. **应用更改**: 在其他设备 `git pull`

---

## 📝 快速命令参考

```powershell
# 查看状态
.\mcp-status-check.ps1

# 启用 GitHub MCP
.\setup-mcp-sync.ps1 -Enable github

# 禁用某个插件
.\setup-mcp-sync.ps1 -Disable document-skills

# 同步配置
.\setup-mcp-sync.ps1 -Pull

# 创建快照
.\setup-mcp-sync.ps1 -Snapshot

# 更新插件
.\update-mcp.ps1
```

---

## 🔗 相关资源

- [Claude Code MCP 文档](https://docs.claude.ai)
- [MCP 协议规范](https://modelcontextprotocol.io)
- [你的技能仓库](https://github.com/ge8034/my-claude-skills)

---

## 🚀 下一步

1. ✅ 在 GitHub 创建仓库
2. ✅ 添加 MCP 配置文件
3. ✅ 创建管理脚本
4. ✅ 测试同步功能
5. 🎉 开始使用！
