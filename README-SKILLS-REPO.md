# Claude 技能仓库设置指南

## 你的已安装技能（13个）

| 技能名称 | 用途 |
|---------|------|
| **code-reviewer** | 代码审查 |
| **frontend-code-review** | 前端代码审查 |
| **explain-code** | 解释代码 |
| **fix** | 修复代码问题 |
| **simplify** | 简化代码 |
| **update-docs** | 更新文档 |
| **pr-creator** | 创建 Pull Request |
| **fullstack-developer** | 全栈开发 |
| **frontend-design** | 前端设计 |
| **webapp-testing** | Web 应用测试 |
| **codebase-visualizer** | 代码库可视化 |
| **find-skills** | 查找技能 |
| **cache-components** | Next.js 缓存组件 |

---

## 创建 GitHub 仓库的步骤

### 方法一：使用脚本（推荐）

1. **在 GitHub 网站创建仓库**
   - 访问：https://github.com/new
   - 填写：
     - Repository name: `my-claude-skills`
     - Description: `个人 Claude 技能配置库`
     - Public/Private: 选择 Public 或 Private
     - Add a README file: 勾选 ✅

2. **在本地运行设置脚本**

   **PowerShell（推荐）**：
   ```powershell
   cd d:\Learn-Claude\GuanDan3
   .\setup-skills-repo.ps1
   ```
   然后输入你的 GitHub 用户名

   **Git Bash**：
   ```bash
   cd d:/Learn-Claude/GuanDan3
   bash setup-skills-repo.sh
   ```

3. **添加远程仓库并推送**
   ```bash
   git remote add origin https://github.com/你的用户名/my-claude-skills.git
   git branch -M main
   git push -u origin main
   ```

### 方法二：手动创建

1. **创建目录**
   ```bash
   cd ~
   mkdir my-claude-skills
   cd my-claude-skills
   git init
   ```

2. **创建 README.md**
   ```bash
   cat > README.md << 'EOF'
   # My Claude Skills

   个人 Claude 技能配置库，包含常用的代码审查、测试、文档生成等技能。

   ## 技能列表
   - code-reviewer
   - frontend-code-review
   - explain-code
   - fix
   - simplify
   - update-docs
   - pr-creator
   - fullstack-developer
   - frontend-design
   - webapp-testing
   - codebase-visualizer
   - find-skills
   - cache-components
   EOF
   ```

3. **创建 .claude 目录并复制技能**
   ```bash
   mkdir -p .claude/skills
   cp -r ~/.claude/skills/* .claude/skills/
   ```

4. **提交并推送**
   ```bash
   git add .
   git commit -m "初始化 Claude 技能库"
   git remote add origin https://github.com/你的用户名/my-claude-skills.git
   git branch -M main
   git push -u origin main
   ```

---

## 在其他项目中使用这些技能

### 方法一：克隆整个仓库（最简单）

```bash
# 克隆技能仓库
git clone https://github.com/你的用户名/my-claude-skills.git

# 复制技能到系统配置
cp -r my-claude-skills/.claude/skills/* ~/.claude/skills/
```

### 方法二：只复制需要的技能

```bash
cd ~/.claude/skills

# 只复制需要的技能
git clone https://github.com/你的用户名/my-claude-skills.git temp-skills
cp -r temp-skills/.claude/skills/code-reviewer ./
cp -r temp-skills/.claude/skills/frontend-code-review ./
rm -rf temp-skills
```

### 方法三：使用符号链接（高级）

```bash
cd ~/.claude
git clone https://github.com/你的用户名/my-claude-skills.git
ln -s ../../my-claude-skills/.claude/skills ./skills
```

---

## 文件结构

```
my-claude-skills/
├── README.md
└── .claude/
    └── skills/
        ├── code-reviewer/
        │   └── skill.md
        ├── frontend-code-review/
        │   └── skill.md
        ├── explain-code/
        │   └── skill.md
        ├── fix/
        │   └── skill.md
        ├── simplify/
        │   └── skill.md
        ├── update-docs/
        │   └── skill.md
        ├── pr-creator/
        │   └── skill.md
        ├── fullstack-developer/
        │   └── skill.md
        ├── frontend-design/
        │   └── skill.md
        ├── webapp-testing/
        │   └── skill.md
        ├── codebase-visualizer/
        │   └── skill.md
        ├── find-skills/
        │   └── skill.md
        └── cache-components/
            └── skill.md
```

---

## 常用命令

### 查看已安装的技能
```bash
ls ~/.claude/skills/
```

### 更新技能（从 GitHub）
```bash
cd ~/.claude/skills
git fetch origin
git pull origin main
```

### 添加新技能
```bash
cd ~/.claude/skills
mkdir my-new-skill
cd my-new-skill
# 编辑 skill.md 文件
git init
git remote add origin https://github.com/你的用户名/my-claude-skills.git
git add .
git commit -m "添加新技能"
git push -u origin main
```

---

## 下一步

1. ✅ 在 GitHub 网站创建 `my-claude-skills` 仓库
2. ✅ 运行 `setup-skills-repo.ps1` 脚本
3. ✅ 推送到 GitHub
4. 🎉 在其他项目中使用你的技能库！

---

## 注意事项

- 确保 GitHub 认证配置正确（SSH 或 HTTPS）
- 如果使用 HTTPS，需要配置 GitHub 凭据
- 定期同步技能到 GitHub 保持最新
- 可以在 GitHub 上分享你的技能库
