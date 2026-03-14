# 生产环境部署脚本 (PowerShell)
# 用于部署到 Fly.io

$ErrorActionPreference = "Stop"

Write-Host "🚀 开始生产环境部署..." -ForegroundColor Green

# 检查 flyctl 是否安装
if (-not (Get-Command flyctl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ flyctl 未安装，请先安装 Fly.io CLI" -ForegroundColor Red
    Write-Host "   访问: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
    exit 1
}

# 检查是否已登录
try {
    $null = flyctl auth whoami 2>&1
} catch {
    Write-Host "🔐 请先登录 Fly.io..." -ForegroundColor Yellow
    flyctl auth login
}

# 构建生产版本
Write-Host "🏗️  构建生产版本..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}

# 部署到 Fly.io
Write-Host "🚀 部署到 Fly.io..." -ForegroundColor Cyan
flyctl deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 部署失败" -ForegroundColor Red
    exit 1
}

# 配置环境变量
Write-Host "⚙️  配置环境变量..." -ForegroundColor Cyan
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://rzzywltxlfgucngfiznx.supabase.co
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM

# 打开应用
Write-Host "🌐 打开应用..." -ForegroundColor Cyan
flyctl open

Write-Host "✅ 生产环境部署完成！" -ForegroundColor Green
Write-Host "📊 查看应用状态: flyctl status" -ForegroundColor Cyan
Write-Host "📋 查看日志: flyctl logs" -ForegroundColor Cyan
