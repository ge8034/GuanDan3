#!/bin/bash

# 设置 GitHub 用户名
GITHUB_USERNAME="your-username"  # 请修改为你的 GitHub 用户名

# 创建技能仓库目录
cd ~
mkdir my-claude-skills
cd my-claude-skills

# 初始化 git 仓库
git init

# 创建 README.md
cat > README.md << 'EOF'
# My Claude Skills

个人 Claude 技能配置库，包含常用的代码审查、测试、文档生成等技能。

## 技能列表

### 代码审查类
- [code-reviewer](.claude/skills/code-reviewer) - 审查代码
- [frontend-code-review](.claude/skills/frontend-code-review) - 审查前端代码
- [explain-code](.claude/skills/explain-code) - 解释代码

### 代码质量类
- [fix](.claude/skills/fix) - 修复代码问题
- [simplify](.claude/skills/simplify) - 简化代码

### 文档类
- [update-docs](.claude/skills/update-docs) - 更新文档
- [pr-creator](.claude/skills/pr-creator) - 创建 PR

### 全栈开发
- [fullstack-developer](.claude/skills/fullstack-developer) - 全栈开发
- [frontend-design](.claude/skills/frontend-design) - 前端设计

### 测试类
- [webapp-testing](.claude/skills/webapp-testing) - Web 应用测试

### 其他
- [codebase-visualizer](.claude/skills/codebase-visualizer) - 代码库可视化
- [find-skills](.claude/skills/find-skills) - 查找技能

## 安装方法

### 从 GitHub 直接使用（推荐）

在你的项目中直接引用这些技能：

```bash
# 克隆技能仓库到你的本地
git clone https://github.com/$GITHUB_USERNAME/my-claude-skills.git
cp -r my-claude-skills/.claude/skills ~/.claude/skills/

# 或者创建符号链接（需要管理员权限）
# mklink /D C:\Users\Administrator\.claude\skills my-claude-skills\.claude\skills
```

### 从 GitHub URL 引用

在你的项目中添加 `.claude/agents/skills.json` 文件：

```json
{
  "skills": [
    {
      "name": "code-reviewer",
      "path": "https://github.com/$GITHUB_USERNAME/my-claude-skills/raw/main/.claude/skills/code-reviewer/skill.md"
    },
    {
      "name": "frontend-code-review",
      "path": "https://github.com/$GITHUB_USERNAME/my-claude-skills/raw/main/.claude/skills/frontend-code-review/skill.md"
    }
  ]
}
```

## 许可证

MIT License
EOF

# 创建 .claude 目录结构
mkdir -p .claude/skills

# 从系统配置复制技能文件
if [ -d "~/.claude/skills" ]; then
    echo "正在复制技能文件..."
    cp -r ~/.claude/skills/* .claude/skills/ 2>/dev/null || echo "部分文件可能不存在"
fi

# 添加到 git
git add .
git commit -m "初始化 Claude 技能库"

echo ""
echo "✅ 仓库已创建！"
echo ""
echo "下一步操作："
echo "1. 添加远程仓库："
echo "   git remote add origin https://github.com/$GITHUB_USERNAME/my-claude-skills.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
echo "2. 或在 Git Bash 中运行以下命令："
echo "   git remote add origin https://github.com/$GITHUB_USERNAME/my-claude-skills.git"
echo "   git branch -M main"
echo "   git push -u origin main"
echo ""
