# 本地部署脚本 (PowerShell)
# 用于在本地服务器上部署应用

$ErrorActionPreference = "Stop"

Write-Host "🚀 开始本地部署..." -ForegroundColor Green

# 检查 Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js 未安装" -ForegroundColor Red
    exit 1
}

# 检查 npm
if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm 未安装" -ForegroundColor Red
    exit 1
}

# 检查环境变量文件
if (-not (Test-Path ".env.production")) {
    Write-Host "❌ .env.production 文件不存在" -ForegroundColor Red
    Write-Host "   请复制 .env.production.example 并配置环境变量" -ForegroundColor Yellow
    exit 1
}

# 安装依赖
Write-Host "📦 安装依赖..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 依赖安装失败" -ForegroundColor Red
    exit 1
}

# 构建生产版本
Write-Host "🏗️  构建生产版本..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ 构建失败" -ForegroundColor Red
    exit 1
}

# 启动生产服务器
Write-Host "🚀 启动生产服务器..." -ForegroundColor Cyan
Write-Host "   应用将在 http://localhost:3000 上运行" -ForegroundColor Yellow
Write-Host "   按 Ctrl+C 停止服务器" -ForegroundColor Yellow

npm start
