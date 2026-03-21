#!/bin/bash

# 数据备份策略设置脚本
# 用于配置数据库备份和应用备份

set -e

echo "💾 开始配置数据备份策略..."

# 创建备份目录
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/application"
mkdir -p "$BACKUP_DIR/logs"

# 创建数据库备份脚本
cat > scripts/backup-database.sh << 'EOF'
#!/bin/bash

# 数据库备份脚本
# 用于备份 Supabase 数据库

BACKUP_DIR="./backups/database"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/guandan3_db_$TIMESTAMP.sql"
RETENTION_DAYS=7

# 加载环境变量
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# 创建备份
echo "📦 开始数据库备份..."
pg_dump "$DATABASE_URL" > "$BACKUP_FILE" 2>/dev/null || {
    echo "❌ 数据库备份失败"
    exit 1
}

# 压缩备份文件
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "✅ 数据库备份完成: $BACKUP_FILE"

# 清理旧备份
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "guandan3_db_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 计算备份大小
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📊 备份大小: $BACKUP_SIZE"

# 发送备份完成通知
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ 掼蛋3数据库备份完成 - 大小: $BACKUP_SIZE\"}"
fi
EOF

chmod +x scripts/backup-database.sh

# 创建应用备份脚本
cat > scripts/backup-application.sh << 'EOF'
#!/bin/bash

# 应用备份脚本
# 用于备份应用文件和配置

BACKUP_DIR="./backups/application"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/guandan3_app_$TIMESTAMP.tar.gz"
RETENTION_DAYS=7

# 创建备份
echo "📦 开始应用备份..."
tar -czf "$BACKUP_FILE" \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='.git' \
    --exclude='logs' \
    --exclude='backups' \
    --exclude='.env.local' \
    . 2>/dev/null || {
    echo "❌ 应用备份失败"
    exit 1
}

echo "✅ 应用备份完成: $BACKUP_FILE"

# 清理旧备份
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "guandan3_app_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# 计算备份大小
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📊 备份大小: $BACKUP_SIZE"

# 发送备份完成通知
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ 掼蛋3应用备份完成 - 大小: $BACKUP_SIZE\"}"
fi
EOF

chmod +x scripts/backup-application.sh

# 创建日志备份脚本
cat > scripts/backup-logs.sh << 'EOF'
#!/bin/bash

# 日志备份脚本
# 用于备份应用日志

BACKUP_DIR="./backups/logs"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/guandan3_logs_$TIMESTAMP.tar.gz"
RETENTION_DAYS=30

# 创建备份
echo "📦 开始日志备份..."
tar -czf "$BACKUP_FILE" \
    --exclude='*.gz' \
    logs/ 2>/dev/null || {
    echo "❌ 日志备份失败"
    exit 1
}

echo "✅ 日志备份完成: $BACKUP_FILE"

# 清理旧备份
echo "🧹 清理旧备份..."
find "$BACKUP_DIR" -name "guandan3_logs_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# 计算备份大小
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo "📊 备份大小: $BACKUP_SIZE"

# 发送备份完成通知
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ 掼蛋3日志备份完成 - 大小: $BACKUP_SIZE\"}"
fi
EOF

chmod +x scripts/backup-logs.sh

# 创建恢复脚本
cat > scripts/restore-database.sh << 'EOF'
#!/bin/bash

# 数据库恢复脚本
# 用于从备份恢复数据库

if [ -z "$1" ]; then
    echo "❌ 请指定备份文件"
    echo "用法: ./scripts/restore-database.sh <backup-file>"
    exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

# 加载环境变量
if [ -f .env.production ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# 确认恢复操作
echo "⚠️  警告: 此操作将覆盖当前数据库！"
read -p "确定要恢复吗？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ 恢复操作已取消"
    exit 0
fi

# 解压备份文件（如果需要）
if [[ "$BACKUP_FILE" == *.gz ]]; then
    TEMP_FILE=$(mktemp)
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# 恢复数据库
echo "📦 开始数据库恢复..."
psql "$DATABASE_URL" < "$BACKUP_FILE" 2>/dev/null || {
    echo "❌ 数据库恢复失败"
    exit 1
}

echo "✅ 数据库恢复完成"

# 清理临时文件
if [ -n "$TEMP_FILE" ]; then
    rm -f "$TEMP_FILE"
fi

# 发送恢复完成通知
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\":\"✅ 掼蛋3数据库恢复完成\"}"
fi
EOF

chmod +x scripts/restore-database.sh

# 设置定时任务
echo "⏰ 设置备份定时任务..."

# 数据库备份（每天凌晨2点）
(crontab -l 2>/dev/null | grep -v "backup-database.sh"; echo "0 2 * * * cd $(pwd) && ./scripts/backup-database.sh") | crontab -

# 应用备份（每天凌晨3点）
(crontab -l 2>/dev/null | grep -v "backup-application.sh"; echo "0 3 * * * cd $(pwd) && ./scripts/backup-application.sh") | crontab -

# 日志备份（每天凌晨4点）
(crontab -l 2>/dev/null | grep -v "backup-logs.sh"; echo "0 4 * * * cd $(pwd) && ./scripts/backup-logs.sh") | crontab -

echo "✅ 数据备份策略配置完成！"
echo "📦 数据库备份: ./scripts/backup-database.sh"
echo "📦 应用备份: ./scripts/backup-application.sh"
echo "📦 日志备份: ./scripts/backup-logs.sh"
echo "🔄 数据库恢复: ./scripts/restore-database.sh <backup-file>"
echo "📋 查看备份: ls -lh backups/"
echo "⏰ 定时任务: crontab -l"
