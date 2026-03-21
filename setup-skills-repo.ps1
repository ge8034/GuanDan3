# Claude 技能仓库设置脚本
# 使用方法：在 PowerShell 中运行此脚本，然后按照提示操作

$GITHUB_USERNAME = Read-Host "请输入你的 GitHub 用户名"

# 创建技能仓库目录
$repoPath = "$HOME\my-claude-skills"
if (Test-Path $repoPath) {
    Write-Host "⚠️  目录 $repoPath 已存在" -ForegroundColor Yellow
    $continue = Read-Host "是否继续？(y/n)"
    if ($continue -ne 'y') {
        exit
    }
} else {
    New-Item -ItemType Directory -Path $repoPath | Out-Null
}

Set-Location $repoPath

# 初始化 git 仓库
if (-not (Test-Path ".git")) {
    git init
}

# 创建 README.md
$readmeContent = "# My Claude Skills`r`n"
$readmeContent += "个人 Claude 技能配置库，包含常用的代码审查、测试、文档生成等技能。`r`n`r`n"
$readmeContent += "## 技能列表`r`n`r`n"
$readmeContent += "### 代码审查类`r`n"
$readmeContent += "- [code-reviewer](.claude/skills/code-reviewer) - 审查代码`r`n"
$readmeContent += "- [frontend-code-review](.claude/skills/frontend-code-review) - 审查前端代码`r`n"
$readmeContent += "- [explain-code](.claude/skills/explain-code) - 解释代码`r`n`r`n"
$readmeContent += "### 代码质量类`r`n"
$readmeContent += "- [fix](.claude/skills/fix) - 修复代码问题`r`n"
$readmeContent += "- [simplify](.claude/skills/simplify) - 简化代码`r`n`r`n"
$readmeContent += "### 文档类`r`n"
$readmeContent += "- [update-docs](.claude/skills/update-docs) - 更新文档`r`n"
$readmeContent += "- [pr-creator](.claude/skills/pr-creator) - 创建 PR`r`n`r`n"
$readmeContent += "### 全栈开发`r`n"
$readmeContent += "- [fullstack-developer](.claude/skills/fullstack-developer) - 全栈开发`r`n"
$readmeContent += "- [frontend-design](.claude/skills/frontend-design) - 前端设计`r`n`r`n"
$readmeContent += "### 测试类`r`n"
$readmeContent += "- [webapp-testing](.claude/skills/webapp-testing) - Web 应用测试`r`n`r`n"
$readmeContent += "### 其他`r`n"
$readmeContent += "- [codebase-visualizer](.claude/skills/codebase-visualizer) - 代码库可视化`r`n"
$readmeContent += "- [find-skills](.claude/skills/find-skills) - 查找技能`r`n`r`n"
$readmeContent += "## 安装方法`r`n`r`n"
$readmeContent += "### 从 GitHub 直接使用（推荐）`r`n`r`n"
$readmeContent += "在你的项目中直接引用这些技能：`r`n`r`n"
$readmeContent += "````bash`r`n"
$readmeContent += "# 克隆技能仓库到你的本地`r`n"
$readmeContent += "git clone https://github.com/$GITHUB_USERNAME/my-claude-skills.git`r`n"
$readmeContent += "Copy-Item -Recurse -Force (Join-Path 'my-claude-skills' '.claude') `"$HOME\.claude\`"`r`n"
$readmeContent += "`````r`n`r`n"
$readmeContent += "### 从 GitHub URL 引用`r`n`r`n"
$readmeContent += "在你的项目中添加 `.claude/agents/skills.json` 文件：`r`n`r`n"
$readmeContent += "````json`r`n"
$readmeContent += "{`r`n"
$readmeContent += "  \"skills\": [`r`n"
$readmeContent += "    {`r`n"
$readmeContent += "      \"name\": \"code-reviewer\",`r`n"
$readmeContent += "      \"path\": \"https://github.com/$GITHUB_USERNAME/my-claude-skills/raw/main/.claude/skills/code-reviewer/skill.md\"`r`n"
$readmeContent += "    },`r`n"
$readmeContent += "    {`r`n"
$readmeContent += "      \"name\": \"frontend-code-review\",`r`n"
$readmeContent += "      \"path\": \"https://github.com/$GITHUB_USERNAME/my-claude-skills/raw/main/.claude/skills/frontend-code-review/skill.md\"`r`n"
$readmeContent += "    }`r`n"
$readmeContent += "  ]`r`n"
$readmeContent += "}`r`n"
$readmeContent += "`````r`n`r`n"
$readmeContent += "## 许可证`r`n`r`n"
$readmeContent += "MIT License"

$readmeContent | Out-File -FilePath "README.md" -Encoding UTF8

# 创建 .claude 目录结构
if (-not (Test-Path ".claude\skills")) {
    New-Item -ItemType Directory -Path ".claude\skills" | Out-Null
}

# 从系统配置复制技能文件
$sourceSkillsPath = Join-Path $HOME ".claude\skills"
if (Test-Path $sourceSkillsPath) {
    Write-Host "正在复制技能文件..." -ForegroundColor Cyan
    $files = Get-ChildItem -Path $sourceSkillsPath -Directory
    $count = 0
    foreach ($skill in $files) {
        if (Test-Path $skill.FullName) {
            Copy-Item -Recurse -Force "$($skill.FullName)\*" ".claude\skills\$($skill.Name)\"
            $count++
        }
    }
    Write-Host "✅ 已复制 $count 个技能" -ForegroundColor Green
} else {
    Write-Host "⚠️  未找到系统技能目录" -ForegroundColor Yellow
}

# 添加到 git
git add .
git commit -m "初始化 Claude 技能库"

Write-Host ""
Write-Host "✅ 仓库已创建！" -ForegroundColor Green
Write-Host ""
Write-Host "下一步操作：" -ForegroundColor Yellow
Write-Host "1. 添加远程仓库："
Write-Host "   git remote add origin https://github.com/$GITHUB_USERNAME/my-claude-skills.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
Write-Host "2. 或者直接在 Git Bash 中运行："
Write-Host "   git remote add origin https://github.com/$GITHUB_USERNAME/my-claude-skills.git"
Write-Host "   git branch -M main"
Write-Host "   git push -u origin main"
Write-Host ""
