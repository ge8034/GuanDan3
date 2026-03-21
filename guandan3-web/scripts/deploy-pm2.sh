#!/bin/bash

# PM2 部署脚本
# 用于使用 PM2 部署 Next.js 应用

set -e

echo "🚀 开始 PM2 部署..."

# 检查 PM2 是否安装
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，正在安装..."
    npm install -g pm2
fi

# 检查 Node.js 版本
NODE_VERSION=$(node -v)
echo "📦 Node.js 版本: $NODE_VERSION"

# 安装依赖
echo "📥 安装依赖..."
npm ci --production=false

# 构建应用
echo "🏗️  构建应用..."
npm run build

# 创建日志目录
mkdir -p logs

# 停止现有进程（如果存在）
if pm2 describe guandan3-web > /dev/null 2>&1; then
    echo "🛑 停止现有进程..."
    pm2 stop guandan3-web || true
    pm2 delete guandan3-web || true
fi

# 启动应用
echo "🚀 启动应用..."
pm2 start ecosystem.config.js --env production

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

# 设置 PM2 开机自启
echo "⚙️  设置开机自启..."
pm2 startup | tail -n 1 | bash || echo "开机自启设置需要手动执行"

# 显示应用状态
echo "📊 应用状态:"
pm2 status

# 显示日志
echo "📋 最近日志:"
pm2 logs guandan3-web --lines 20 --nostream

echo "✅ PM2 部署完成！"
echo "📊 查看状态: pm2 status"
echo "📋 查看日志: pm2 logs guandan3-web"
echo "🔄 重启应用: pm2 restart guandan3-web"
echo "🛑 停止应用: pm2 stop guandan3-web"
