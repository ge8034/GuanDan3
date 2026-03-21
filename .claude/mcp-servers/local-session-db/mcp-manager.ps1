# 本地会话数据库 MCP 服务器管理脚本

param(
    [Parameter(Mandatory=$false)]
    [string]$Command = "install"
)

# 项目根目录
$ProjectRoot = $PSScriptRoot
$McpServerDir = Join-Path $ProjectRoot ".claude\mcp-servers\local-session-db"
$McpConfigFile = Join-Path $ProjectRoot "mcp-config.json"

function Install-McpServer {
    Write-Host "🔧 安装本地会话数据库 MCP 服务器..." -ForegroundColor Cyan

    # 1. 检查依赖
    Write-Host "📦 检查依赖..." -ForegroundColor Yellow
    $packageJson = Join-Path $McpServerDir "package.json"
    if (!(Test-Path $packageJson)) {
        Write-Host "❌ package.json 不存在" -ForegroundColor Red
        return
    }

    # 2. 安装依赖
    Write-Host "📥 安装依赖包..." -ForegroundColor Yellow
    Set-Location $McpServerDir
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 依赖安装失败" -ForegroundColor Red
        return
    }

    # 3. 启用 MCP 服务器
    Write-Host "✅ 启用 MCP 服务器..." -ForegroundColor Green

    # 读取当前配置
    if (Test-Path $McpConfigFile) {
        $config = Get-Content $McpConfigFile -Raw | ConvertFrom-Json
    } else {
        $config = @{
            mcpServers = @{}
        }
    }

    # 添加本地会话数据库配置
    $config.mcpServers.local-session-db = @{
        command = "node"
        args = @(".claude/mcp-servers/local-session-db/index.js")
    }

    # 保存配置
    $config | ConvertTo-Json -Depth 10 | Set-Content $McpConfigFile

    Write-Host "✅ MCP 服务器配置已添加" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 配置内容:" -ForegroundColor Yellow
    Get-Content $McpConfigFile | ConvertFrom-Json | ConvertTo-Json -Depth 10
    Write-Host ""
    Write-Host "⚠️  请重启 Claude Code 以使配置生效" -ForegroundColor Yellow
}

function Test-McpServer {
    Write-Host "🔍 测试 MCP 服务器..." -ForegroundColor Cyan

    # 检查 Node.js
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 未找到 Node.js，请先安装" -ForegroundColor Red
        return
    }
    Write-Host "✅ Node.js 版本: $nodeVersion" -ForegroundColor Green

    # 检查 package.json
    $packageJson = Join-Path $McpServerDir "package.json"
    if (!(Test-Path $packageJson)) {
        Write-Host "❌ package.json 不存在" -ForegroundColor Red
        return
    }
    Write-Host "✅ package.json 存在" -ForegroundColor Green

    # 检查依赖
    $nodeModules = Join-Path $McpServerDir "node_modules"
    if (!(Test-Path $nodeModules)) {
        Write-Host "⚠️  依赖未安装，正在安装..." -ForegroundColor Yellow
        Set-Location $McpServerDir
        npm install
    } else {
        Write-Host "✅ 依赖已安装" -ForegroundColor Green
    }

    # 测试启动
    Write-Host "🧪 测试启动 MCP 服务器..." -ForegroundColor Yellow
    $testScript = Join-Path $McpServerDir "index.js"
    if (Test-Path $testScript) {
        Write-Host "✅ index.js 存在" -ForegroundColor Green

        # 运行一次测试启动
        $timeout = New-Object System.Timers.Timer
        $testCompleted = $false

        $timeout.Elapsed = {
            if (-not $testCompleted) {
                $testCompleted = $true
                Write-Host "⏱️  MCP 服务器启动超时（等待 2 秒）" -ForegroundColor Yellow
                $timeout.Stop()
                $timeout.Dispose()
            }
        }
        $timeout.Interval = 2000
        $timeout.AutoReset = $false
        $timeout.Start()

        # 启动测试
        $process = Start-Process -FilePath "node" -ArgumentList @($testScript) -PassThru -NoNewWindow

        Start-Sleep -Milliseconds 1000

        if ($process.HasExited) {
            Write-Host "❌ MCP 服务器启动失败" -ForegroundColor Red
            Write-Host "退出代码: $($process.ExitCode)"
        } else {
            Write-Host "✅ MCP 服务器成功启动（进程 PID: $($process.Id)）" -ForegroundColor Green
        }

        # 优雅关闭
        Start-Sleep -Milliseconds 1000
        try {
            $process.Kill()
            Write-Host "✅ 测试完成" -ForegroundColor Green
        } catch {
            Write-Host "⚠️  无法关闭测试进程" -ForegroundColor Yellow
        }
    }
}

function Uninstall-McpServer {
    Write-Host "🧹 卸载本地会话数据库 MCP 服务器..." -ForegroundColor Cyan

    $McpConfigFile = Join-Path $ProjectRoot "mcp-config.json"

    if (!(Test-Path $McpConfigFile)) {
        Write-Host "❌ 配置文件不存在" -ForegroundColor Red
        return
    }

    # 读取配置
    $config = Get-Content $McpConfigFile -Raw | ConvertFrom-Json

    if (!($config.mcpServers | Get-Member -MemberType NoteProperty -Name "local-session-db")) {
        Write-Host "ℹ️  MCP 服务器未配置" -ForegroundColor Yellow
        return
    }

    # 删除配置
    $config.mcpServers.PSObject.Properties.Remove("local-session-db")

    # 保存配置
    $config | ConvertTo-Json -Depth 10 | Set-Content $McpConfigFile

    Write-Host "✅ MCP 服务器已卸载" -ForegroundColor Green
    Write-Host "⚠️  请重启 Claude Code 以使配置生效" -ForegroundColor Yellow
}

function Show-Help {
    Write-Host "📋 本地会话数据库 MCP 服务器管理工具" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "用法:" -ForegroundColor Yellow
    Write-Host "  .\mcp-manager.ps1 -Command <command>" -ForegroundColor White
    Write-Host ""
    Write-Host "可用命令:" -ForegroundColor Yellow
    Write-Host "  install   - 安装和配置 MCP 服务器（默认）" -ForegroundColor White
    Write-Host "  test      - 测试 MCP 服务器" -ForegroundColor White
    Write-Host "  uninstall - 卸载 MCP 服务器" -ForegroundColor White
    Write-Host "  help      - 显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor Yellow
    Write-Host "  .\mcp-manager.ps1 -Command install" -ForegroundColor White
    Write-Host "  .\mcp-manager.ps1 -Command test" -ForegroundColor White
    Write-Host "  .\mcp-manager.ps1 -Command uninstall" -ForegroundColor White
}

# 执行命令
switch ($Command) {
    "install" {
        Install-McpServer
    }
    "test" {
        Test-McpServer
    }
    "uninstall" {
        Uninstall-McpServer
    }
    "help" {
        Show-Help
    }
    default {
        Write-Host "❌ 未知命令: $Command" -ForegroundColor Red
        Show-Help
    }
}
