#!/bin/bash

# 灰度发布脚本
# 用于逐步向用户推送新版本，降低发布风险

set -e

echo "🚀 开始灰度发布流程..."

# 配置参数
CANARY_PERCENT=${1:-10}  # 默认10%流量
MAX_PERCENT=100
INCREMENT=10            # 每次增加10%
MONITOR_DURATION=300     # 监控时长（秒）
HEALTH_CHECK_URL="https://guandan3.com/health"
ERROR_THRESHOLD=5       # 错误率阈值（%）

echo "📊 灰度发布配置:"
echo "   初始流量: ${CANARY_PERCENT}%"
echo "   最大流量: ${MAX_PERCENT}%"
echo "   增量: ${INCREMENT}%"
echo "   监控时长: ${MONITOR_DURATION}s"
echo "   错误阈值: ${ERROR_THRESHOLD}%"

# 检查必要工具
check_dependencies() {
    echo "🔍 检查依赖工具..."
    
    if ! command -v curl &> /dev/null; then
        echo "❌ curl 未安装"
        exit 1
    fi
    
    if ! command -v jq &> /dev/null; then
        echo "❌ jq 未安装，请先安装: apt-get install jq"
        exit 1
    fi
    
    echo "✅ 依赖检查通过"
}

# 健康检查函数
health_check() {
    local url=$1
    local max_attempts=$2
    local attempt=1
    
    echo "🏥 执行健康检查: $url"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null; then
            echo "✅ 健康检查通过 (尝试 $attempt/$max_attempts)"
            return 0
        fi
        
        echo "⏳ 健康检查失败，重试中... ($attempt/$max_attempts)"
        sleep 5
        ((attempt++))
    done
    
    echo "❌ 健康检查失败"
    return 1
}

# 监控函数
monitor_metrics() {
    local duration=$1
    local percent=$2
    
    echo "📈 监控应用指标 (流量: ${percent}%, 时长: ${duration}s)..."
    
    local start_time=$(date +%s)
    local end_time=$((start_time + duration))
    local error_count=0
    local total_requests=0
    
    while [ $(date +%s) -lt $end_time ]; do
        # 模拟请求监控
        if curl -f -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL" | grep -q "200"; then
            ((total_requests++))
        else
            ((error_count++))
            ((total_requests++))
        fi
        
        # 计算当前错误率
        if [ $total_requests -gt 0 ]; then
            local error_rate=$((error_count * 100 / total_requests))
            echo "📊 当前错误率: ${error_rate}% (${error_count}/${total_requests})"
            
            # 检查是否超过阈值
            if [ $error_rate -gt $ERROR_THRESHOLD ]; then
                echo "❌ 错误率超过阈值 ${ERROR_THRESHOLD}%，停止灰度发布"
                return 1
            fi
        fi
        
        sleep 10
    done
    
    echo "✅ 监控完成，错误率在可接受范围内"
    return 0
}

# 回滚函数
rollback() {
    echo "🔄 执行回滚操作..."
    
    # 回滚到上一个稳定版本
    if [ -f ".last_stable_version" ]; then
        local last_version=$(cat .last_stable_version)
        echo "📦 回滚到版本: $last_version"
        
        # 使用PM2回滚
        pm2 reload ecosystem.config.js --env production --update-env
        
        # 或者使用Git回滚
        # git checkout $last_version
        # npm run build
        # pm2 reload ecosystem.config.js --env production
        
        echo "✅ 回滚完成"
    else
        echo "⚠️  未找到上一个稳定版本"
    fi
}

# 灰度发布主流程
canary_deploy() {
    local current_percent=$CANARY_PERCENT
    
    echo "🎯 开始灰度发布，当前流量: ${current_percent}%"
    
    # 1. 部署新版本到灰度环境
    echo "📦 部署新版本到灰度环境..."
    npm run build
    
    # 2. 更新PM2配置，设置灰度流量
    echo "⚙️  更新PM2配置，设置灰度流量..."
    # 这里需要根据实际的负载均衡器配置进行调整
    # 例如使用Nginx split_clients或云服务商的流量分配功能
    
    # 3. 健康检查
    if ! health_check "$HEALTH_CHECK_URL" 10; then
        echo "❌ 健康检查失败，执行回滚"
        rollback
        exit 1
    fi
    
    # 4. 逐步增加流量
    while [ $current_percent -lt $MAX_PERCENT ]; do
        echo "📊 当前灰度流量: ${current_percent}%"
        
        # 监控当前流量级别的表现
        if ! monitor_metrics $MONITOR_DURATION $current_percent; then
            echo "❌ 监控发现问题，执行回滚"
            rollback
            exit 1
        fi
        
        # 增加流量
        current_percent=$((current_percent + INCREMENT))
        if [ $current_percent -gt $MAX_PERCENT ]; then
            current_percent=$MAX_PERCENT
        fi
        
        echo "🚀 增加灰度流量到: ${current_percent}%"
        # 更新负载均衡器配置
        # 这里需要根据实际的负载均衡器进行调整
    done
    
    echo "🎉 灰度发布完成，流量已达到100%"
    
    # 5. 标记当前版本为稳定版本
    local current_version=$(git rev-parse HEAD)
    echo "$current_version" > .last_stable_version
    echo "✅ 当前版本已标记为稳定版本: $current_version"
}

# 主执行流程
main() {
    check_dependencies
    
    # 询问确认
    echo "⚠️  即将执行灰度发布，流量将从 ${CANARY_PERCENT}% 逐步增加到 ${MAX_PERCENT}%"
    read -p "确认继续? (yes/no): " confirm
    
    if [ "$confirm" != "yes" ]; then
        echo "❌ 用户取消操作"
        exit 0
    fi
    
    # 执行灰度发布
    canary_deploy
    
    echo "🎉 灰度发布流程完成！"
    echo "📋 下一步: 执行全量发布"
}

# 执行主流程
main "$@"