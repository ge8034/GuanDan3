#!/bin/bash

# 监控系统设置脚本
# 用于配置应用监控、系统监控和数据库监控

set -e

echo "🔧 开始配置监控系统..."

# 检查是否已安装 PM2
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 未安装，请先安装 PM2"
    exit 1
fi

# 安装 PM2 Plus 监控
echo "📊 安装 PM2 Plus 监控..."
pm2 install pm2-logrotate || echo "PM2 Logrotate 已安装"

# 配置 PM2 Logrotate
echo "⚙️  配置日志轮转..."
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
pm2 set pm2-logrotate:compress true
pm2 set pm2-logrotate:dateFormat YYYY-MM-DD_HH-mm-ss

# 安装 PM2 监控模块
echo "📈 安装 PM2 监控模块..."
pm2 install pm2-server-monit || echo "PM2 Server Monit 已安装"

# 配置系统监控
echo "🖥️  配置系统监控..."
pm2 set pm2-server-monit:cpu 80
pm2 set pm2-server-monit:memory 80
pm2 set pm2-server-monit:disk 80

# 创建监控脚本
cat > scripts/health-check.sh << 'EOF'
#!/bin/bash

# 健康检查脚本
# 用于监控应用健康状态

HEALTH_URL="http://localhost:3000/health"
LOG_FILE="./logs/health-check.log"
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL:-}"

check_health() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_URL")
    
    if [ "$response" = "200" ]; then
        echo "[$timestamp] ✅ 健康检查通过 - HTTP $response" >> "$LOG_FILE"
        return 0
    else
        echo "[$timestamp] ❌ 健康检查失败 - HTTP $response" >> "$LOG_FILE"
        
        # 发送告警
        if [ -n "$ALERT_WEBHOOK" ]; then
            curl -X POST "$ALERT_WEBHOOK" \
                -H "Content-Type: application/json" \
                -d "{\"text\":\"❌ 掼蛋3应用健康检查失败 - HTTP $response\"}"
        fi
        
        return 1
    fi
}

# 执行健康检查
check_health
EOF

chmod +x scripts/health-check.sh

# 创建性能监控脚本
cat > scripts/performance-monitor.sh << 'EOF'
#!/bin/bash

# 性能监控脚本
# 用于监控应用性能指标

LOG_FILE="./logs/performance-monitor.log"
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL:-}"

monitor_performance() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 获取 CPU 使用率
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print 100 - $1}')
    
    # 获取内存使用率
    local mem_usage=$(free | grep Mem | awk '{printf("%.2f", $3/$2 * 100.0)}')
    
    # 获取磁盘使用率
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    
    # 记录性能指标
    echo "[$timestamp] CPU: ${cpu_usage}%, Memory: ${mem_usage}%, Disk: ${disk_usage}%" >> "$LOG_FILE"
    
    # 检查是否超过阈值
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        echo "[$timestamp] ⚠️  CPU 使用率过高: ${cpu_usage}%" >> "$LOG_FILE"
    fi
    
    if (( $(echo "$mem_usage > 80" | bc -l) )); then
        echo "[$timestamp] ⚠️  内存使用率过高: ${mem_usage}%" >> "$LOG_FILE"
    fi
    
    if (( disk_usage > 80 )); then
        echo "[$timestamp] ⚠️  磁盘使用率过高: ${disk_usage}%" >> "$LOG_FILE"
    fi
}

# 执行性能监控
monitor_performance
EOF

chmod +x scripts/performance-monitor.sh

# 创建数据库监控脚本
cat > scripts/database-monitor.sh << 'EOF'
#!/bin/bash

# 数据库监控脚本
# 用于监控数据库连接和性能

LOG_FILE="./logs/database-monitor.log"
ALERT_WEBHOOK="${ALERT_WEBHOOK_URL:-}"

monitor_database() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    # 检查数据库连接
    local db_status=$(node -e "
        const { createClient } = require('@supabase/supabase-js');
        const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        client.from('rooms').select('count').then(({ error }) => {
            if (error) {
                console.log('ERROR');
            } else {
                console.log('OK');
            }
        });
    " 2>&1 || echo "ERROR")
    
    if [ "$db_status" = "OK" ]; then
        echo "[$timestamp] ✅ 数据库连接正常" >> "$LOG_FILE"
    else
        echo "[$timestamp] ❌ 数据库连接失败" >> "$LOG_FILE"
        
        # 发送告警
        if [ -n "$ALERT_WEBHOOK" ]; then
            curl -X POST "$ALERT_WEBHOOK" \
                -H "Content-Type: application/json" \
                -d "{\"text\":\"❌ 掼蛋3数据库连接失败\"}"
        fi
    fi
}

# 执行数据库监控
monitor_database
EOF

chmod +x scripts/database-monitor.sh

# 设置定时任务
echo "⏰ 设置定时任务..."

# 添加健康检查定时任务（每分钟）
(crontab -l 2>/dev/null | grep -v "health-check.sh"; echo "* * * * * cd $(pwd) && ./scripts/health-check.sh") | crontab -

# 添加性能监控定时任务（每5分钟）
(crontab -l 2>/dev/null | grep -v "performance-monitor.sh"; echo "*/5 * * * * cd $(pwd) && ./scripts/performance-monitor.sh") | crontab -

# 添加数据库监控定时任务（每10分钟）
(crontab -l 2>/dev/null | grep -v "database-monitor.sh"; echo "*/10 * * * * cd $(pwd) && ./scripts/database-monitor.sh") | crontab -

echo "✅ 监控系统配置完成！"
echo "📊 查看监控: pm2 monit"
echo "📋 查看日志: pm2 logs"
echo "🔍 健康检查: ./scripts/health-check.sh"
echo "📈 性能监控: ./scripts/performance-monitor.sh"
echo "💾 数据库监控: ./scripts/database-monitor.sh"
