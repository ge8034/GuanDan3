@echo off
REM 生产环境部署脚本 (Windows Batch)
REM 用于部署到 Fly.io

echo 🚀 开始生产环境部署...

REM 检查 flyctl 是否安装
where flyctl >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ flyctl 未安装，请先安装 Fly.io CLI
    echo    访问: https://fly.io/docs/hands-on/install-flyctl/
    exit /b 1
)

REM 构建生产版本
echo 🏗️  构建生产版本...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ 构建失败
    exit /b 1
)

REM 部署到 Fly.io
echo 🚀 部署到 Fly.io...
call flyctl deploy
if %errorlevel% neq 0 (
    echo ❌ 部署失败
    exit /b 1
)

REM 配置环境变量
echo ⚙️  配置环境变量...
call flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://rzzywltxlfgucngfiznx.supabase.co
call flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM

REM 打开应用
echo 🌐 打开应用...
call flyctl open

echo ✅ 生产环境部署完成！
echo 📊 查看应用状态: flyctl status
echo 📋 查看日志: flyctl logs
