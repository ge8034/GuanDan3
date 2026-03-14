#!/bin/bash

# 生产环境部署脚本
# 用于部署到 Fly.io

set -e

echo "🚀 开始生产环境部署..."

# 检查 flyctl 是否安装
if ! command -v flyctl &> /dev/null; then
    echo "❌ flyctl 未安装，请先安装 Fly.io CLI"
    echo "   访问: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# 检查是否已登录
if ! flyctl auth whoami &> /dev/null; then
    echo "🔐 请先登录 Fly.io..."
    flyctl auth login
fi

# 构建生产版本
echo "🏗️  构建生产版本..."
npm run build

# 部署到 Fly.io
echo "🚀 部署到 Fly.io..."
flyctl deploy

# 配置环境变量
echo "⚙️  配置环境变量..."
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://rzzywltxlfgucngfiznx.supabase.co
flyctl secrets set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ6enl3bHR4bGZndWNuZ2Zpem54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkwNTM1NjksImV4cCI6MjA4NDYyOTU2OX0.Upn1XmBZPQxYPl2UAVpGOtWim3Pf3yeeGNNMQm0idtM

# 打开应用
echo "🌐 打开应用..."
flyctl open

echo "✅ 生产环境部署完成！"
echo "📊 查看应用状态: flyctl status"
echo "📋 查看日志: flyctl logs"
