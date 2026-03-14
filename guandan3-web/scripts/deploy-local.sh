#!/bin/bash

# 本地部署脚本 (Bash)
# 用于在本地服务器上部署应用

set -e

echo "🚀 开始本地部署..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装"
    exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm 未安装"
    exit 1
fi

# 检查环境变量文件
if [ ! -f ".env.production" ]; then
    echo "❌ .env.production 文件不存在"
    echo "   请复制 .env.production.example 并配置环境变量"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 构建生产版本
echo "🏗️  构建生产版本..."
npm run build

# 启动生产服务器
echo "🚀 启动生产服务器..."
echo "   应用将在 http://localhost:3000 上运行"
echo "   按 Ctrl+C 停止服务器"

npm start
