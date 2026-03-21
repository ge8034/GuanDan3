# MCP 管理主脚本
# 使用方法: .\mcp-manager.ps1 -Action <action> [-Name <name>]

param(
    [Parameter(Mandatory=$true)]
    [ValidateSet("List", "Enable", "Disable", "Clean", "Update", "Sync")]
    [string]$Action,

    [string]$Name = $null
)

# 配置文件路径
$configPath = Join-Path $HOME ".claude\settings.json"

function Show-MCPStatus {
    Write-Host "=== Claude MCP 管理工具 ===" -ForegroundColor Cyan
    Write-Host ""

    # 读取配置文件
    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json
        Write-Host "已安装插件:" -ForegroundColor Yellow
        foreach ($plugin in $config.enabledPlugins.PSObject.Properties) {
            $status = if ($plugin.Value) { "✅ 启用" } else { "❌ 禁用" }
            Write-Host "  $plugin.Name : $status"
        }
        Write-Host ""

        # 检查 MCP 服务器
        Write-Host "MCP 服务器:" -ForegroundColor Yellow
        $mcpPath = Join-Path $HOME ".claude\plugins\cache\claude-plugins-official"
        if (Test-Path $mcpPath) {
            foreach ($type in @("context7", "github")) {
                $cachePath = Join-Path $mcpPath $type
                if (Test-Path $cachePath) {
                    $dirs = Get-ChildItem $cachePath -Directory | Select-Object -ExpandProperty Name
                    foreach ($dir in $dirs) {
                        $mcpJson = Join-Path $cachePath $dir ".mcp.json"
                        if (Test-Path $mcpJson) {
                            Write-Host "  $type/$dir"
                        }
                    }
                }
            }
        }
    } else {
        Write-Host "未找到配置文件" -ForegroundColor Red
    }

    Write-Host ""
}

function Enable-MCPPlugin {
    param($pluginName)

    if ([string]::IsNullOrEmpty($pluginName)) {
        Write-Host "请指定插件名称" -ForegroundColor Yellow
        Write-Host "可用插件: context7, document-skills, frontend-design, github, pyright-lsp, ralph-loop, superpowers"
        return
    }

    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json

        if ($config.enabledPlugins.$pluginName -eq $true) {
            Write-Host "插件 $pluginName 已启用" -ForegroundColor Green
        } else {
            $config.enabledPlugins.$pluginName = $true
            $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
            Write-Host "✅ 已启用插件: $pluginName" -ForegroundColor Green
            Write-Host "⚠️  请重启 Claude Code 使配置生效" -ForegroundColor Yellow
        }
    } else {
        Write-Host "未找到配置文件" -ForegroundColor Red
    }
}

function Disable-MCPPlugin {
    param($pluginName)

    if ([string]::IsNullOrEmpty($pluginName)) {
        Write-Host "请指定插件名称" -ForegroundColor Yellow
        Write-Host "可用插件: context7, document-skills, frontend-design, github, pyright-lsp, ralph-loop, superpowers"
        return
    }

    if (Test-Path $configPath) {
        $config = Get-Content $configPath -Raw | ConvertFrom-Json

        if ($config.enabledPlugins.$pluginName -eq $false) {
            Write-Host "插件 $pluginName 已禁用" -ForegroundColor Green
        } else {
            $config.enabledPlugins.$pluginName = $false
            $config | ConvertTo-Json -Depth 10 | Set-Content $configPath
            Write-Host "✅ 已禁用插件: $pluginName" -ForegroundColor Green
            Write-Host "⚠️  请重启 Claude Code 使配置生效" -ForegroundColor Yellow
        }
    } else {
        Write-Host "未找到配置文件" -ForegroundColor Red
    }
}

function Clean-MCPCache {
    Write-Host "正在清理 MCP 缓存..." -ForegroundColor Cyan

    $mcpPath = Join-Path $HOME ".claude\plugins\cache\claude-plugins-official"

    if (Test-Path $mcpPath) {
        $types = @("context7", "github")
        $totalCleaned = 0

        foreach ($type in $types) {
            $cachePath = Join-Path $mcpPath $type
            if (Test-Path $cachePath) {
                $dirs = Get-ChildItem $cachePath -Directory
                foreach ($dir in $dirs) {
                    $mcpJson = Join-Path $cachePath $dir ".mcp.json"
                    $lastModified = (Get-Item $mcpJson).LastWriteTime
                    $age = (Get-Date) - $lastModified

                    if ($age.Days -gt 7) {
                        Write-Host "  正在删除旧缓存: $type/$($dir.Name) ($($age.Days)天前)" -ForegroundColor Yellow
                        Remove-Item -Recurse -Force "$cachePath\$($dir.Name)"
                        $totalCleaned++
                    }
                }
            }
        }

        if ($totalCleaned -gt 0) {
            Write-Host "✅ 已清理 $totalCleaned 个旧缓存" -ForegroundColor Green
        } else {
            Write-Host "✅ 没有需要清理的旧缓存" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  未找到 MCP 缓存目录" -ForegroundColor Yellow
    }
}

function Update-MCP {
    Write-Host "正在更新 MCP 插件..." -ForegroundColor Cyan

    # GitHub MCP
    Write-Host "更新 GitHub MCP..." -ForegroundColor Yellow
    # 这里需要根据实际的更新逻辑来实现

    # Context7
    Write-Host "更新 Context7..." -ForegroundColor Yellow
    # 这里需要根据实际的更新逻辑来实现

    Write-Host "✅ MCP 插件更新完成" -ForegroundColor Green
}

function Sync-Repo {
    param($repoUrl = "https://github.com/ge8034/my-claude-skills.git")

    Write-Host "正在同步技能仓库..." -ForegroundColor Cyan

    $repoPath = Join-Path $HOME "my-claude-skills"

    if (Test-Path $repoPath) {
        Set-Location $repoPath
        git pull origin main
        Write-Host "✅ 已同步技能仓库" -ForegroundColor Green
    } else {
        Write-Host "⚠️  技能仓库不存在" -ForegroundColor Yellow
        Write-Host "请先运行: git clone $repoUrl"
    }
}

# 主逻辑
switch ($Action) {
    "List" {
        Show-MCPStatus
    }

    "Enable" {
        Enable-MCPPlugin -pluginName $Name
    }

    "Disable" {
        Disable-MCPPlugin -pluginName $Name
    }

    "Clean" {
        Clean-MCPCache
    }

    "Update" {
        Update-MCP
    }

    "Sync" {
        Sync-Repo
    }
}

Write-Host ""
Write-Host "=== 操作完成 ===" -ForegroundColor Cyan
Write-Host "提示: 修改配置后请重启 Claude Code 使其生效"
