# 快速设置本地会话数据库 MCP 服务器

Write-Host "🔧 设置本地会话数据库 MCP 服务器..." -ForegroundColor Cyan

# 1. 检查 Node.js
Write-Host "✅ 检查 Node.js..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "   Node.js 版本: $nodeVersion" -ForegroundColor Green

# 2. 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Yellow
$serverDir = ".claude\mcp-servers\local-session-db"
cd $serverDir
npm install 2>&1 | Select-String -Pattern "(added|warning)" -Context 0,0
cd ..\..

# 3. 配置 MCP
Write-Host "⚙️  配置 MCP..." -ForegroundColor Yellow
$mcpConfig = "mcp-config.json"
if (Test-Path $mcpConfig) {
    $config = Get-Content $mcpConfig -Raw | ConvertFrom-Json
    if (!($config.mcpServers | Get-Member -MemberType NoteProperty -Name "local-session-db")) {
        $config.mcpServers.local-session-db = @{
            command = "node"
            args = @(".claude/mcp-servers/local-session-db/index.js")
        }
        $config | ConvertTo-Json -Depth 10 | Set-Content $mcpConfig
        Write-Host "✅ 已添加到 MCP 配置" -ForegroundColor Green
    } else {
        Write-Host "ℹ️  已配置" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ 配置文件不存在" -ForegroundColor Red
    exit 1
}

# 4. 测试启动
Write-Host "🧪 测试 MCP 服务器..." -ForegroundColor Yellow
try {
    $testScript = "$serverDir\index.js"
    $process = Start-Process -FilePath "node" -ArgumentList $testScript -PassThru -NoNewWindow -Wait -Timeout 2
    Write-Host "✅ MCP 服务器测试成功" -ForegroundColor Green
} catch {
    Write-Host "⚠️  MCP 服务器启动失败: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 安装完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📝 下一步:" -ForegroundColor Yellow
Write-Host "  1. 重启 Claude Code 使配置生效" -ForegroundColor White
Write-Host "  2. 使用 .\mcp-manager.ps1 -Command test 测试" -ForegroundColor White
Write-Host "  3. 在 Claude Code 中使用 MCP 工具" -ForegroundColor White
