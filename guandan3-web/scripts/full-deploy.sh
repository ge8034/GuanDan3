#!/bin/bash

# 全量发布脚本
# 在灰度发布成功后，将所有流量切换到新版本

set -e

echo "🚀 开始全量发布流程..."

# 配置参数
HEALTH_CHECK_URL="https://guandan3.com/health"
PERFORMANCE_CHECK_URL="https://guandan3.com"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
BACKUP_ENABLED=true

echo "📊 全量发布配置:"
echo "   健康检查: $HEALTH_CHECK_URL"
echo "   性能检查: $PERFORMANCE_CHECK_URL"
echo "   备份启用: $BACKUP_ENABLED"

# 通知函数
send_notification() {
    local status=$1
    local message=$2
    
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        local color="good"
        if [ "$status" == "failure" ]; then
            color="danger"
        elif [ "$status" == "warning" ]; then
            color="warning"
        fi
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"全量发布通知\",\"text\":\"$message\"}]}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    echo "📢 通知: $message"
}

# 备份函数
create_backup() {
    if [ "$BACKUP_ENABLED" != "true" ]; then
        echo "⏭️  备份已禁用，跳过"
        return 0
    fi
    
    echo "💾 创建备份..."
    
    local backup_dir="/var/backups/guandan3-web/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$backup_dir"
    
    # 备份应用文件
    cp -r /var/www/guandan3-web/.next "$backup_dir/"
    cp -r /var/www/guandan3-web/public "$backup_dir/"
    cp /var/www/guandan3-web/package.json "$backup_dir/"
    
    # 备份PM2配置
    cp /var/www/guandan3-web/ecosystem.config.js "$backup_dir/"
    
    # 备份数据库（如果需要）
    # pg_dump -U username -d database > "$backup_dir/database.sql"
    
    echo "✅ 备份完成: $backup_dir"
    echo "$backup_dir" > .last_backup
    
    # 清理旧备份（保留最近7天）
    find /var/backups/guandan3-web -type d -mtime +7 -exec rm -rf {} \;
}

# 健康检查函数
health_check() {
    local url=$1
    local max_attempts=${2:-30}
    local attempt=1
    
    echo "🏥 执行健康检查: $url"
    
    while [ $attempt -le $max_attempts ]; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
        
        if [ "$response" == "200" ]; then
            echo "✅ 健康检查通过 (尝试 $attempt/$max_attempts)"
            return 0
        fi
        
        echo "⏳ 健康检查失败 (HTTP $response)，重试中... ($attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
    
    echo "❌ 健康检查失败"
    return 1
}

# 性能检查函数
performance_check() {
    local url=$1
    
    echo "⚡ 执行性能检查..."
    
    # 检查页面加载时间
    local load_time=$(curl -o /dev/null -s -w "%{time_total}" "$url")
    echo "📊 页面加载时间: ${load_time}s"
    
    # 检查TTFB
    local ttfb=$(curl -o /dev/null -s -w "%{time_starttransfer}" "$url")
    echo "📊 TTFB: ${ttfb}s"
    
    # 性能阈值检查
    local max_load_time=3.0  # 最大加载时间3秒
    local max_ttfb=1.0        # 最大TTFB 1秒
    
    if (( $(echo "$load_time > $max_load_time" | bc -l) )); then
        echo "⚠️  页面加载时间超过阈值: ${load_time}s > ${max_load_time}s"
        return 1
    fi
    
    if (( $(echo "$ttfb > $max_ttfb" | bc -l) )); then
        echo "⚠️  TTFB超过阈值: ${ttfb}s > ${max_ttfb}s"
        return 1
    fi
    
    echo "✅ 性能检查通过"
    return 0
}

# 回滚函数
rollback() {
    echo "🔄 执行回滚操作..."
    
    if [ -f ".last_backup" ]; then
        local backup_dir=$(cat .last_backup)
        echo "📦 从备份恢复: $backup_dir"
        
        # 恢复应用文件
        cp -r "$backup_dir/.next" /var/www/guandan3-web/
        cp -r "$backup_dir/public" /var/www/guandan3-web/
        cp "$backup_dir/package.json" /var/www/guandan3-web/
        cp "$backup_dir/ecosystem.config.js" /var/www/guandan3-web/
        
        # 重启PM2
        cd /var/www/guandan3-web
        pm2 reload ecosystem.config.js --env production
        
        # 健康检查
        if health_check "$HEALTH_CHECK_URL" 20; then
            echo "✅ 回滚成功"
            send_notification "success" "回滚成功，应用已恢复到备份版本"
        else
            echo "❌ 回滚失败"
            send_notification "failure" "回滚失败，请手动检查"
        fi
    else
        echo "⚠️  未找到备份文件"
        send_notification "warning" "未找到备份文件，无法自动回滚"
    fi
}

# 全量发布主流程
full_deploy() {
    echo "🎯 开始全量发布..."
    
    # 1. 创建备份
    create_backup
    
    # 2. 构建新版本
    echo "🏗️  构建新版本..."
    cd /var/www/guandan3-web
    npm run build
    
    # 3. 更新PM2配置
    echo "⚙️  更新PM2配置..."
    pm2 reload ecosystem.config.js --env production
    
    # 4. 等待应用启动
    echo "⏳ 等待应用启动..."
    sleep 30
    
    # 5. 健康检查
    if ! health_check "$HEALTH_CHECK_URL" 30; then
        echo "❌ 健康检查失败，执行回滚"
        rollback
        exit 1
    fi
    
    # 6. 性能检查
    if ! performance_check "$PERFORMANCE_CHECK_URL"; then
        echo "⚠️  性能检查未通过，但继续发布"
        send_notification "warning" "性能检查未通过，但发布继续"
    fi
    
    # 7. 验证关键功能
    echo "🔍 验证关键功能..."
    
    # 检查首页
    if ! curl -f -s "https://guandan3.com" > /dev/null; then
        echo "❌ 首页访问失败"
        rollback
        exit 1
    fi
    
    # 检查大厅
    if ! curl -f -s "https://guandan3.com/lobby" > /dev/null; then
        echo "❌ 大厅访问失败"
        rollback
        exit 1
    fi
    
    # 检查API
    if ! curl -f -s "https://guandan3.com/api/health" > /dev/null; then
        echo "❌ API访问失败"
        rollback
        exit 1
    fi
    
    echo "✅ 关键功能验证通过"
    
    # 8. 标记发布成功
    local current_version=$(git rev-parse HEAD)
    echo "$current_version" > .last_production_version
    echo "✅ 当前版本已标记为生产版本: $current_version"
    
    # 9. 清理临时文件
    echo "🧹 清理临时文件..."
    rm -f /var/www/guandan3-web/.next/cache/*
    
    echo "🎉 全量发布完成！"
}

# 主执行流程
main() {
    # 询问确认
    echo "⚠️  即将执行全量发布，将所有流量切换到新版本"
    echo "   此操作将:"
    echo "   1. 创建当前版本备份"
    echo "   2. 部署新版本"
    echo "   3. 执行健康检查和性能检查"
    echo "   4. 验证关键功能"
    echo ""
    read -p "确认继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ 用户取消操作"
        exit 0
    fi
    
    # 发送开始通知
    send_notification "info" "全量发布开始"
    
    # 执行全量发布
    if full_deploy; then
        send_notification "success" "全量发布成功！新版本已上线"
        echo "🎉 全量发布流程完成！"
        echo "📋 下一步: 执行发布后验证测试"
    else
        send_notification "failure" "全量发布失败，已执行回滚"
        echo "❌ 全量发布失败"
        exit 1
    fi
}

# 执行主流程
main "$@"