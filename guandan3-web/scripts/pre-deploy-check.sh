#!/bin/bash

set -e

SKIP_TESTS=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-tests)
            SKIP_TESTS=true
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

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_FILE="$PROJECT_ROOT/logs/pre-deploy-check-$(date +%Y%m%d-%H%M%S).log"

mkdir -p "$(dirname "$LOG_FILE")"

log() {
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $1" | tee -a "$LOG_FILE"
}

check_command() {
    command -v "$1" &> /dev/null
}

check_file_exists() {
    [ -f "$1" ]
}

check_dir_exists() {
    [ -d "$1" ]
}

checks_passed=0
checks_failed=0
warnings=0

log "========================================="
log "部署前检查开始"
log "========================================="

cd "$PROJECT_ROOT"
log "项目根目录: $PROJECT_ROOT"

log ""
log "========================================="
log "1. 检查必需的工具"
log "========================================="

declare -A required_tools=(
    ["node"]="Node.js"
    ["npm"]="npm"
    ["git"]="Git"
)

for tool in "${!required_tools[@]}"; do
    if check_command "$tool"; then
        version=$($tool --version 2>&1)
        log "✅ ${required_tools[$tool]} 已安装: $version"
        ((checks_passed++))
    else
        log "❌ ${required_tools[$tool]} 未安装" "ERROR"
        ((checks_failed++))
    fi
done

declare -A optional_tools=(
    ["flyctl"]="Fly.io CLI"
    ["supabase"]="Supabase CLI"
    ["docker"]="Docker"
)

for tool in "${!optional_tools[@]}"; do
    if check_command "$tool"; then
        version=$($tool --version 2>&1)
        log "✅ ${optional_tools[$tool]} 已安装: $version"
        ((checks_passed++))
    else
        log "⚠️  ${optional_tools[$tool]} 未安装（可选）" "WARN"
        ((warnings++))
    fi
done

log ""
log "========================================="
log "2. 检查项目文件"
log "========================================="

declare -A required_files=(
    ["package.json"]="package.json"
    ["next.config.js"]="Next.js 配置"
    ["Dockerfile"]="Dockerfile"
    ["fly.toml"]="Fly.io 配置"
    [".env.production"]="生产环境变量"
)

for file in "${!required_files[@]}"; do
    if check_file_exists "$file"; then
        log "✅ ${required_files[$file]} 存在"
        ((checks_passed++))
    else
        log "❌ ${required_files[$file]} 不存在" "ERROR"
        ((checks_failed++))
    fi
done

declare -A required_dirs=(
    ["supabase/migrations"]="数据库迁移目录"
    ["src/app"]="应用源代码目录"
    ["docs"]="文档目录"
)

for dir in "${!required_dirs[@]}"; do
    if check_dir_exists "$dir"; then
        log "✅ ${required_dirs[$dir]} 存在"
        ((checks_passed++))
    else
        log "❌ ${required_dirs[$dir]} 不存在" "ERROR"
        ((checks_failed++))
    fi
done

log ""
log "========================================="
log "3. 检查环境变量"
log "========================================="

ENV_FILE=".env.production"
if check_file_exists "$ENV_FILE"; then
    required_env_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "NEXT_PUBLIC_APP_URL"
    )

    for var in "${required_env_vars[@]}"; do
        if grep -q "^${var}=" "$ENV_FILE"; then
            value=$(grep "^${var}=" "$ENV_FILE" | cut -d'=' -f2)
            if [[ "$value" == "your_"* ]] || [[ "$value" == "https://your"* ]] || [[ "$value" == "https://example.com" ]]; then
                log "⚠️  $var 需要设置实际值" "WARN"
                ((warnings++))
            else
                log "✅ $var 已配置"
                ((checks_passed++))
            fi
        else
            log "❌ $var 未配置" "ERROR"
            ((checks_failed++))
        fi
    done
else
    log "❌ .env.production 文件不存在" "ERROR"
    ((checks_failed++))
fi

log ""
log "========================================="
log "4. 检查数据库迁移"
log "========================================="

MIGRATIONS_DIR="supabase/migrations"
if check_dir_exists "$MIGRATIONS_DIR"; then
    migration_count=$(find "$MIGRATIONS_DIR" -name "*.sql" | wc -l)
    log "✅ 找到 $migration_count 个迁移文件"
    ((checks_passed++))

    if [ "$migration_count" -lt 20 ]; then
        log "⚠️  迁移文件数量较少（预期至少 20 个）" "WARN"
        ((warnings++))
    fi
else
    log "❌ 数据库迁移目录不存在" "ERROR"
    ((checks_failed++))
fi

log ""
log "========================================="
log "5. 检查依赖"
log "========================================="

if check_file_exists "package-lock.json"; then
    log "✅ package-lock.json 存在"
    ((checks_passed++))
else
    log "⚠️  package-lock.json 不存在，建议运行 npm install" "WARN"
    ((warnings++))
fi

if check_dir_exists "node_modules"; then
    log "✅ node_modules 目录存在"
    ((checks_passed++))
else
    log "⚠️  node_modules 目录不存在，需要运行 npm install" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "6. 检查代码质量"
log "========================================="

if [ "$SKIP_TESTS" = false ]; then
    log "运行 lint 检查..."
    if npm run lint > /dev/null 2>&1; then
        log "✅ Lint 检查通过"
        ((checks_passed++))
    else
        log "❌ Lint 检查失败" "ERROR"
        ((checks_failed++))
        if [ "$VERBOSE" = true ]; then
            npm run lint 2>&1 | head -20 | while read line; do log "$line" "DEBUG"; done
        fi
    fi

    log "运行类型检查..."
    if npm run type-check > /dev/null 2>&1; then
        log "✅ 类型检查通过"
        ((checks_passed++))
    else
        log "❌ 类型检查失败" "ERROR"
        ((checks_failed++))
        if [ "$VERBOSE" = true ]; then
            npm run type-check 2>&1 | head -20 | while read line; do log "$line" "DEBUG"; done
        fi
    fi

    log "运行安全审计..."
    if npm audit --production > /dev/null 2>&1; then
        log "✅ 安全审计通过"
        ((checks_passed++))
    else
        log "⚠️  安全审计发现潜在问题" "WARN"
        ((warnings++))
        if [ "$VERBOSE" = true ]; then
            npm audit --production 2>&1 | head -20 | while read line; do log "$line" "DEBUG"; done
        fi
    fi
else
    log "跳过代码质量检查（--skip-tests 参数）"
fi

log ""
log "========================================="
log "7. 检查构建"
log "========================================="

if [ "$SKIP_TESTS" = false ]; then
    log "运行生产构建..."
    if npm run build > /dev/null 2>&1; then
        log "✅ 生产构建成功"
        ((checks_passed++))

        if check_dir_exists ".next"; then
            build_size=$(du -sh .next | cut -f1)
            log "📦 构建大小: $build_size"
        fi
    else
        log "❌ 生产构建失败" "ERROR"
        ((checks_failed++))
        if [ "$VERBOSE" = true ]; then
            npm run build 2>&1 | tail -30 | while read line; do log "$line" "DEBUG"; done
        fi
    fi
else
    log "跳过构建检查（--skip-tests 参数）"
fi

log ""
log "========================================="
log "8. 检查 Git 状态"
log "========================================="

if check_command git; then
    if [ -z "$(git status --porcelain 2>&1)" ]; then
        log "✅ 工作目录干净"
        ((checks_passed++))
    else
        log "⚠️  工作目录有未提交的更改" "WARN"
        ((warnings++))
        if [ "$VERBOSE" = true ]; then
            git status --porcelain 2>&1 | while read line; do log "$line" "DEBUG"; done
        fi
    fi

    git_branch=$(git branch --show-current 2>&1)
    log "📌 当前分支: $git_branch"

    git_commit=$(git log -1 --format="%h %s" 2>&1)
    log "📝 最新提交: $git_commit"
else
    log "⚠️  无法检查 Git 状态" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "9. 检查文档"
log "========================================="

declare -A required_docs=(
    ["docs/DEPLOYMENT_CHECKLIST.md"]="部署检查清单"
    ["docs/ROLLBACK_PLAN.md"]="回滚计划"
    ["docs/DEPLOYMENT_VALIDATION.md"]="部署验证报告"
    ["docs/ENVIRONMENT_VARIABLES_GUIDE.md"]="环境变量指南"
)

for doc in "${!required_docs[@]}"; do
    if check_file_exists "$doc"; then
        log "✅ ${required_docs[$doc]} 存在"
        ((checks_passed++))
    else
        log "⚠️  ${required_docs[$doc]} 不存在" "WARN"
        ((warnings++))
    fi
done

log ""
log "========================================="
log "10. 检查备份"
log "========================================="

BACKUP_DIR="backups"
if check_dir_exists "$BACKUP_DIR"; then
    backup_count=$(find "$BACKUP_DIR" -type f | wc -l)
    if [ "$backup_count" -gt 0 ]; then
        log "✅ 找到 $backup_count 个备份文件"
        ((checks_passed++))
        find "$BACKUP_DIR" -type f -printf "%T+ %p\n" | sort -r | head -5 | while read line; do
            log "   - $line"
        done
    else
        log "⚠️  备份目录为空" "WARN"
        ((warnings++))
    fi
else
    log "⚠️  备份目录不存在" "WARN"
    ((warnings++))
fi

log ""
log "========================================="
log "检查结果汇总"
log "========================================="
log "✅ 通过: $checks_passed"
log "❌ 失败: $checks_failed"
log "⚠️  警告: $warnings"
log "📄 日志文件: $LOG_FILE"

if [ "$checks_failed" -gt 0 ]; then
    log ""
    log "❌ 部署前检查失败！请修复错误后再部署。" "ERROR"
    exit 1
elif [ "$warnings" -gt 0 ]; then
    log ""
    log "⚠️  部署前检查通过，但有警告。请检查警告项。" "WARN"
    exit 0
else
    log ""
    log "✅ 部署前检查全部通过！可以开始部署。" "INFO"
    exit 0
fi
