# MCP 同步脚本
# 通过 GitHub 仓库集中管理所有 MCP 配置

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("Pull", "Push", "Enable", "Disable", "Snapshot", "Update")]
    [string]$Action,

    [string]$Name = $null,

    [switch]$Force
)

# 仓库配置
$repoPath = Join-Path $HOME "my-claude-skills"
$configPath = Join-Path $repoPath "mcp-config.json"
$skillsPath = Join-Path $repoPath ".claude"
$settingsPath = Join-Path $HOME ".claude\settings.json"

# MCP 插件列表
$mcpPlugins = @(
    "context7",
    "document-skills",
    "frontend-design",
    "github",
    "pyright-lsp",
    "ralph-loop",
    "superpowers"
)

function Show-Status {
    Write-Host "=== Claude MCP 状态 ===" -ForegroundColor Cyan
    Write-Host ""

    # 显示插件状态
    Write-Host "已安装插件:" -ForegroundColor Yellow
    if (Test-Path $settingsPath) {
        $config = Get-Content $settingsPath -Raw | ConvertFrom-Json
        foreach ($plugin in $mcpPlugins) {
            $status = if ($config.enabledPlugins.$plugin -eq $true) { "✅" } else { "❌" }
            Write-Host "  $status $plugin"
        }
    } else {
        Write-Host "  ❌ 未找到配置文件" -ForegroundColor Red
    }
    Write-Host ""

    # 显示仓库状态
    Write-Host "GitHub 仓库:" -ForegroundColor Yellow
    if (Test-Path $repoPath) {
        Set-Location $repoPath
        $branch = git branch --show-current 2>$null
        $status = git status --short 2>$null
        if ($branch) {
            Write-Host "  分支: $branch"
        }
        if ($status) {
            $modified = ($status | Where-Object { $_ -match "^.M" }).Count
            $untracked = ($status | Where-Object { $_ -match "^??" }).Count
            Write-Host "  修改: $modified, 未追踪: $untracked"
        } else {
            Write-Host "  ✅ 已同步"
        }
    } else {
        Write-Host "  ❌ 仓库不存在: $repoPath" -ForegroundColor Red
    }
    Write-Host ""

    # 显示配置文件
    Write-Host "配置文件:" -ForegroundColor Yellow
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        Write-Host "  MCP 服务器: $($config.mcpServers.PSObject.Properties.Count) 个"
    } else {
        Write-Host "  ❌ 配置文件不存在" -ForegroundColor Red
    }
    Write-Host ""
}

function Pull-Config {
    Write-Host "正在从 GitHub 拉取配置..." -ForegroundColor Cyan

    if (Test-Path $repoPath) {
        Set-Location $repoPath
        git fetch origin
        git pull origin main

        # 复制配置文件
        if (Test-Path $configPath) {
            Copy-Item $configPath "$configPath.backup"
            Copy-Item $configPath "$HOME\mcp-config-local.json"
            Write-Host "✅ 已拉取配置文件" -ForegroundColor Green
        }

        # 复制技能文件
        if (Test-Path $skillsPath) {
            if (Test-Path "$HOME\.claude\skills") {
                $skillCount = (Get-ChildItem $skillsPath -Recurse -File).Count
                Copy-Item -Recurse -Force "$skillsPath\*" "$HOME\.claude\skills\"
                Write-Host "✅ 已更新技能文件 ($skillCount 个)" -ForegroundColor Green
            } else {
                Copy-Item -Recurse -Force $skillsPath "$HOME\.claude\"
                Write-Host "✅ 已安装技能文件" -ForegroundColor Green
            }
        }

        Write-Host "✅ 配置同步完成" -ForegroundColor Green
        Write-Host "⚠️  请重启 Claude Code 使配置生效" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 仓库不存在" -ForegroundColor Red
        Write-Host "请先运行: git clone https://github.com/ge8034/my-claude-skills.git"
    }
}

function Push-Config {
    Write-Host "正在推送配置到 GitHub..." -ForegroundColor Cyan

    if (Test-Path $repoPath) {
        Set-Location $repoPath
        git add .
        git commit -m "Sync MCP configuration"
        git push origin main
        Write-Host "✅ 配置已推送到 GitHub" -ForegroundColor Green
    } else {
        Write-Host "❌ 仓库不存在" -ForegroundColor Red
    }
}

function Enable-Plugin {
    if ([string]::IsNullOrEmpty($Name)) {
        Write-Host "请指定插件名称" -ForegroundColor Yellow
        Write-Host "可用插件: $($mcpPlugins -join ', ')"
        return
    }

    if (Test-Path $settingsPath) {
        $config = Get-Content $settingsPath -Raw | ConvertFrom-Json

        if ($Name -notin $mcpPlugins) {
            Write-Host "❌ 插件不存在: $Name" -ForegroundColor Red
            return
        }

        if ($config.enabledPlugins.$Name -eq $true) {
            Write-Host "✅ 插件已启用: $Name" -ForegroundColor Green
        } else {
            $config.enabledPlugins.$Name = $true
            $config | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
            Write-Host "✅ 已启用插件: $Name" -ForegroundColor Green
            Write-Host "⚠️  请重启 Claude Code 使配置生效" -ForegroundColor Yellow
        }

        # 同步到 GitHub
        Write-Host ""
        Write-Host "正在同步到 GitHub..." -ForegroundColor Cyan
        Push-Config
    } else {
        Write-Host "❌ 未找到配置文件" -ForegroundColor Red
    }
}

function Disable-Plugin {
    if ([string]::IsNullOrEmpty($Name)) {
        Write-Host "请指定插件名称" -ForegroundColor Yellow
        Write-Host "可用插件: $($mcpPlugins -join ', ')"
        return
    }

    if (Test-Path $settingsPath) {
        $config = Get-Content $settingsPath -Raw | ConvertFrom-Json

        if ($Name -notin $mcpPlugins) {
            Write-Host "❌ 插件不存在: $Name" -ForegroundColor Red
            return
        }

        if ($config.enabledPlugins.$Name -eq $false) {
            Write-Host "✅ 插件已禁用: $Name" -ForegroundColor Green
        } else {
            $config.enabledPlugins.$Name = $false
            $config | ConvertTo-Json -Depth 10 | Set-Content $settingsPath
            Write-Host "✅ 已禁用插件: $Name" -ForegroundColor Green
            Write-Host "⚠️  请重启 Claude Code 使配置生效" -ForegroundColor Yellow
        }

        # 同步到 GitHub
        Write-Host ""
        Write-Host "正在同步到 GitHub..." -ForegroundColor Cyan
        Push-Config
    } else {
        Write-Host "❌ 未找到配置文件" -ForegroundColor Red
    }
}

function Create-Snapshot {
    Write-Host "正在创建配置快照..." -ForegroundColor Cyan

    if (Test-Path $repoPath) {
        $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
        $snapshotPath = Join-Path $repoPath "snapshots\mcp-config-$timestamp.json"

        if (Test-Path "$repoPath\snapshots") {
            $settingsJson = Get-Content $settingsPath -Raw | ConvertFrom-Json
            $settingsJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $snapshotPath -Encoding UTF8
            Write-Host "✅ 快照已保存: $snapshotPath" -ForegroundColor Green

            # 提交快照
            Set-Location $repoPath
            git add "snapshots\mcp-config-$timestamp.json"
            git commit -m "Snapshot: MCP config $timestamp"
            git push origin main
            Write-Host "✅ 快照已推送到 GitHub" -ForegroundColor Green
        } else {
            Write-Host "❌ 快照目录不存在" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ 仓库不存在" -ForegroundColor Red
    }
}

function Update-MCP {
    Write-Host "正在更新 MCP 插件..." -ForegroundColor Cyan

    if (Test-Path $repoPath) {
        Set-Location $repoPath
        git pull origin main

        # 更新技能文件
        if (Test-Path $skillsPath) {
            $updatedCount = 0
            if (Test-Path "$HOME\.claude\skills") {
                $files = Get-ChildItem $skillsPath -Recurse -File
                foreach ($file in $files) {
                    $dest = Join-Path $HOME ".claude\skills" $file.FullName.Substring($skillsPath.Length + 1)
                    if (-not (Test-Path (Split-Path $dest))) {
                        New-Item -ItemType Directory -Force -Path (Split-Path $dest) | Out-Null
                    }
                    Copy-Item -Force $file.FullName $dest
                    $updatedCount++
                }
            }
            Write-Host "✅ 已更新 $updatedCount 个文件" -ForegroundColor Green
        }

        Write-Host "✅ MCP 插件更新完成" -ForegroundColor Green
        Write-Host "⚠️  请重启 Claude Code 使配置生效" -ForegroundColor Yellow
    } else {
        Write-Host "❌ 仓库不存在" -ForegroundColor Red
    }
}

# 主逻辑
switch ($Action) {
    "Pull" {
        Pull-Config
    }

    "Push" {
        Push-Config
    }

    "Enable" {
        Enable-Plugin -Name $Name
    }

    "Disable" {
        Disable-Plugin -Name $Name
    }

    "Snapshot" {
        Create-Snapshot
    }

    "Update" {
        Update-MCP
    }
}

Show-Status
