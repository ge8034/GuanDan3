#!/bin/bash

set -e

SKIP_PERFORMANCE_TESTS=false
VERBOSE=false
APP_URL=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --app-url)
            APP_URL="$2"
            shift 2
            ;;
        --skip-performance-tests)
            SKIP_PERFORMANCE_TESTS=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            echo "未知参数: $1"
            exit 1
            ;;
    esac
done

if [ -z "$APP_URL" ]; then
    echo "错误: 必须提供 --app-url 参数"
    exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/post-deploy-verify-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $1" | tee -a "$LOG_FILE"
}

check_command() {
    command -v "$1" &> /dev/null
}

test_url() {
    local url="$1"
    local timeout="${2:-30}"
    
    if curl -f -s -o /dev/null -w "%{http_code}" --max-time "$timeout" "$url" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

checks_passed=0
checks_failed=0
warnings=0

log "========================================="
log "部署后验证开始"
log "========================================="
log "应用 URL: $APP_URL"

cd "$PROJECT_ROOT"

log ""
log "========================================="
log "1. 健康检查"
log "========================================="

HEALTH_URL="$APP_URL/api/health"
log "检查健康端点: $HEALTH_URL"

if test_url "$HEALTH_URL"; then
    log "✅ 健康检查通过"
    ((checks_passed++))
else
    log "❌ 健康检查失败" "ERROR"
    ((checks_failed++))
fi

log ""
log "========================================="
log "2. 页面访问检查"
log "========================================="

declare -A pages=(
    [""]="首页"
    ["/history"]="历史记录页"
    ["/practice"]="练习模式页"
)

for path in "${!pages[@]}"; do
    PAGE_URL="$APP_URL$path"
    log "检查 ${pages[$path]}: $PAGE_URL"
    
    if test_url "$PAGE_URL"; then
        log "✅ ${pages[$path]} 可访问"
        ((checks_passed++))
    else
        log "❌ ${pages[$path]} 访问失败" "ERROR"
        ((checks_failed++))
    fi
done

log ""
log "========================================="
log "3. API 端点检查"
log "========================================="

declare -A api_endpoints=(
    ["/api/health"]="健康检查 API"
    ["/api/games"]="游戏列表 API"
)

for path in "${!api_endpoints[@]}"; do
    API_URL="$APP_URL$path"
    log "检查 ${api_endpoints[$path]}: $API_URL"
    
    if test_url "$API_URL"; then
        log "✅ ${api_endpoints[$path]} 可访问"
        ((checks_passed++))
    else
        log "⚠️  ${api_endpoints[$path]} 访问失败" "WARN"
        ((warnings++))
    fi
done

log ""
log "========================================="
log "4. 静态资源检查"
log "========================================="

declare -A static_resources=(
    ["/_next/static"]="Next.js 静态资源"
    ["/favicon.ico"]="网站图标"
)

for path in "${!static_resources[@]}"; do
    RESOURCE_URL="$APP_URL$path"
    log "检查 ${static_resources[$path]}: $RESOURCE_URL"
    
    if test_url "$RESOURCE_URL"; then
        log "✅ ${static_resources[$path]} 可访问"
        ((checks_passed++))
    else
        log "⚠️  ${static_resources[$path]} 访问失败" "WARN"
        ((warnings++))
    fi
done

log ""
log "========================================="
log "5. 性能测试"
log "========================================="

if [ "$SKIP_PERFORMANCE_TESTS" = false ]; then
    if check_command k6; then
        K6_DIR="k6"
        if [ -d "$K6_DIR" ]; then
            log "运行烟雾测试..."
            cd "$K6_DIR"
            if k6 run smoke-test.js > /dev/null 2>&1; then
                log "✅ 烟雾测试通过"
                ((checks_passed++))
            else
                log "❌ 烟雾测试失败" "ERROR"
                ((checks_failed++))
                if [ "$VERBOSE" = true ]; then
                    k6 run smoke-test.js 2>&1 | head -20 | while read line; do log "$line" "DEBUG"; done
                fi
            fi
            cd "$PROJECT_ROOT"
        else
            log "⚠️  k6 目录不存在，跳过性能测试" "WARN"
            ((warnings++))
        fi
    else
        log "⚠️  k6 未安装，跳过性能测试" "WARN"
        ((warnings++))
    fi
else
    log "跳过性能测试（--skip-performance-tests 参数）"
fi

log ""
log "========================================="
log "6. 数据库连接检查"
log "========================================="

if check_command supabase; then
    log "检查 Supabase 连接..."
    if supabase status > /dev/null 2>&1; then
        log "✅ Supabase 连接正常"
        ((checks_passed++))
    else
        log "⚠️  Supabase 连接检查失败" "WARN"
        ((warnings++))
        if [ "$VERBOSE" = true ]; then
            supabase status 2>&1 | head -20 | while read line; do log "$line" "DEBUG"; done
        fi
    fi
else
    log "⚠️  Supabase CLI 未安装，跳过数据库检查" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "7. Fly.io 部署状态检查"
log "========================================="

if check_command flyctl; then
    log "检查 Fly.io 部署状态..."
    if flyctl status > /dev/null 2>&1; then
        log "✅ Fly.io 部署状态正常"
        ((checks_passed++))
        
        if flyctl status 2>&1 | grep -q "Running"; then
            log "✅ 应用正在运行"
        else
            log "⚠️  应用状态异常" "WARN"
            ((warnings++))
        fi
    else
        log "⚠️  Fly.io 状态检查失败" "WARN"
        ((warnings++))
        if [ "$VERBOSE" = true ]; then
            flyctl status 2>&1 | head -20 | while read line; do log "$line" "DEBUG"; done
        fi
    fi
else
    log "⚠️  Fly.io CLI 未安装，跳过部署状态检查" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "8. 环境变量验证"
log "========================================="

ENV_FILE=".env.production"
if [ -f "$ENV_FILE" ]; then
    critical_env_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NEXT_PUBLIC_APP_URL"
    )

    all_configured=true
    for var in "${critical_env_vars[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE"; then
            value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2)
            if [[ "$value" == "your_"* ]] || [[ "$value" == "https://your"* ]] || [[ "$value" == "https://example.com" ]]; then
                log "⚠️  $var 需要设置实际值" "WARN"
                ((warnings++))
                all_configured=false
            fi
        else
            log "❌ $var 未配置" "ERROR"
            ((checks_failed++))
            all_configured=false
        fi
    done

    if [ "$all_configured" = true ]; then
        log "✅ 关键环境变量已正确配置"
        ((checks_passed++))
    fi
else
    log "❌ .env.production 文件不存在" "ERROR"
    ((checks_failed++))
fi

log ""
log "========================================="
log "9. 日志检查"
log "========================================="

if check_command flyctl; then
    log "检查应用日志..."
    logs=$(flyctl logs --limit 50 2>&1)
    error_count=$(echo "$logs" | grep -i "error" | wc -l)
    warn_count=$(echo "$logs" | grep -i "warn" | wc -l)
    
    log "📊 日志统计: $error_count 个错误, $warn_count 个警告"
    
    if [ "$error_count" -eq 0 ]; then
        log "✅ 日志中未发现错误"
        ((checks_passed++))
    else
        log "⚠️  日志中发现 $error_count 个错误" "WARN"
        ((warnings++))
        if [ "$VERBOSE" = true ]; then
            echo "$logs" | grep -i "error" | head -10 | while read line; do log "$line" "DEBUG"; done
        fi
    fi
else
    log "⚠️  Fly.io CLI 未安装，跳过日志检查" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "10. 监控集成检查"
log "========================================="

if [ -n "$NEXT_PUBLIC_SENTRY_DSN" ]; then
    log "✅ Sentry 已配置"
    ((checks_passed++))
else
    log "⚠️  Sentry DSN 未配置，错误监控可能未启用" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "验证结果汇总"
log "========================================="
log "✅ 通过: $checks_passed"
log "❌ 失败: $checks_failed"
log "⚠️  警告: $warnings"
log "📄 日志文件: $LOG_FILE"

if [ "$checks_failed" -gt 0 ]; then
    log ""
    log "❌ 部署后验证失败！请检查错误项。" "ERROR"
    exit 1
elif [ "$warnings" -gt 0 ]; then
    log ""
    log "⚠️  部署后验证通过，但有警告。请检查警告项。" "WARN"
    exit 0
else
    log ""
    log "✅ 部署后验证全部通过！部署成功。" "INFO"
    exit 0
fi
