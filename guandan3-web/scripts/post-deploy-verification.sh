#!/bin/bash

# 发布后验证测试脚本
# 在全量发布后执行全面的验证测试

set -e

echo "🧪 开始发布后验证测试..."

# 配置参数
BASE_URL="https://guandan3.com"
HEALTH_CHECK_URL="${BASE_URL}/health"
TEST_RESULTS_DIR="test-results/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$TEST_RESULTS_DIR"

echo "📊 验证测试配置:"
echo "   基础URL: $BASE_URL"
echo "   健康检查: $HEALTH_CHECK_URL"
echo "   结果目录: $TEST_RESULTS_DIR"

# 颜色输出函数
print_success() {
    echo -e "\033[32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[31m❌ $1\033[0m"
}

print_warning() {
    echo -e "\033[33m⚠️  $1\033[0m"
}

print_info() {
    echo -e "\033[36mℹ️  $1\033[0m"
}

# 测试结果记录
test_results=()
total_tests=0
passed_tests=0
failed_tests=0

# 记录测试结果
record_result() {
    local test_name=$1
    local result=$2
    local details=$3
    
    ((total_tests++))
    
    if [ "$result" == "pass" ]; then
        ((passed_tests++))
        print_success "$test_name"
        test_results+=("$test_name: PASS")
    else
        ((failed_tests++))
        print_error "$test_name"
        test_results+=("$test_name: FAIL - $details")
    fi
    
    # 记录到文件
    echo "$test_name: $result - $details" >> "$TEST_RESULTS_DIR/detailed_results.txt"
}

# 1. 健康检查测试
test_health_check() {
    print_info "执行健康检查测试..."
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$HEALTH_CHECK_URL")
    
    if [ "$response" == "200" ]; then
        record_result "健康检查" "pass" "HTTP $response"
    else
        record_result "健康检查" "fail" "HTTP $response"
    fi
}

# 2. 页面可访问性测试
test_page_accessibility() {
    print_info "执行页面可访问性测试..."
    
    local pages=(
        "$BASE_URL/"
        "$BASE_URL/lobby"
        "$BASE_URL/room"
        "$BASE_URL/history"
        "$BASE_URL/friends"
        "$BASE_URL/rules"
    )
    
    for page in "${pages[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$page")
        local page_name=$(basename "$page")
        
        if [ "$response" == "200" ]; then
            record_result "页面访问 - $page_name" "pass" "HTTP $response"
        else
            record_result "页面访问 - $page_name" "fail" "HTTP $response"
        fi
    done
}

# 3. 静态资源加载测试
test_static_assets() {
    print_info "执行静态资源加载测试..."
    
    # 检查关键静态资源
    local assets=(
        "$BASE_URL/_next/static/css/main.css"
        "$BASE_URL/_next/static/js/main.js"
        "$BASE_URL/favicon.ico"
    )
    
    for asset in "${assets[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$asset")
        local asset_name=$(basename "$asset")
        
        if [ "$response" == "200" ] || [ "$response" == "304" ]; then
            record_result "静态资源 - $asset_name" "pass" "HTTP $response"
        else
            record_result "静态资源 - $asset_name" "fail" "HTTP $response"
        fi
    done
}

# 4. API端点测试
test_api_endpoints() {
    print_info "执行API端点测试..."
    
    # 测试关键API端点
    local endpoints=(
        "$BASE_URL/api/health"
        "$BASE_URL/api/rooms"
        "$BASE_URL/api/users"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local response=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
        local endpoint_name=$(basename "$endpoint")
        
        if [ "$response" == "200" ] || [ "$response" == "401" ]; then
            record_result "API端点 - $endpoint_name" "pass" "HTTP $response"
        else
            record_result "API端点 - $endpoint_name" "fail" "HTTP $response"
        fi
    done
}

# 5. 性能测试
test_performance() {
    print_info "执行性能测试..."
    
    # 测试首页加载时间
    local load_time=$(curl -o /dev/null -s -w "%{time_total}" "$BASE_URL/")
    echo "   首页加载时间: ${load_time}s"
    
    if (( $(echo "$load_time < 3.0" | bc -l) )); then
        record_result "性能 - 首页加载时间" "pass" "${load_time}s < 3.0s"
    else
        record_result "性能 - 首页加载时间" "fail" "${load_time}s >= 3.0s"
    fi
    
    # 测试TTFB
    local ttfb=$(curl -o /dev/null -s -w "%{time_starttransfer}" "$BASE_URL/")
    echo "   TTFB: ${ttfb}s"
    
    if (( $(echo "$ttfb < 1.0" | bc -l) )); then
        record_result "性能 - TTFB" "pass" "${ttfb}s < 1.0s"
    else
        record_result "性能 - TTFB" "fail" "${ttfb}s >= 1.0s"
    fi
}

# 6. 安全性测试
test_security() {
    print_info "执行安全性测试..."
    
    # 检查HTTPS
    local https_check=$(curl -s -o /dev/null -w "%{scheme}" "$BASE_URL/")
    if [ "$https_check" == "HTTPS" ]; then
        record_result "安全 - HTTPS" "pass" "使用HTTPS"
    else
        record_result "安全 - HTTPS" "fail" "未使用HTTPS"
    fi
    
    # 检查安全头
    local security_headers=$(curl -s -I "$BASE_URL/" | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection")
    if [ -n "$security_headers" ]; then
        record_result "安全 - 安全头" "pass" "存在安全头"
    else
        record_result "安全 - 安全头" "fail" "缺少安全头"
    fi
}

# 7. 数据库连接测试
test_database_connection() {
    print_info "执行数据库连接测试..."
    
    # 通过健康检查端点验证数据库连接
    local health_response=$(curl -s "$HEALTH_CHECK_URL")
    
    if echo "$health_response" | grep -q "database.*ok\|status.*healthy"; then
        record_result "数据库连接" "pass" "数据库连接正常"
    else
        record_result "数据库连接" "fail" "数据库连接异常"
    fi
}

# 8. 实时连接测试
test_realtime_connection() {
    print_info "执行实时连接测试..."
    
    # 测试WebSocket连接（简化版）
    local ws_url="wss://$(echo $BASE_URL | sed 's/https\///')/realtime"
    
    # 这里可以使用websocat或其他WebSocket客户端工具
    # 简化版本只检查端点是否可达
    print_warning "实时连接测试需要WebSocket客户端工具，跳过详细测试"
    record_result "实时连接" "skip" "需要WebSocket客户端工具"
}

# 9. 错误处理测试
test_error_handling() {
    print_info "执行错误处理测试..."
    
    # 测试404页面
    local response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/nonexistent-page")
    
    if [ "$response" == "404" ]; then
        record_result "错误处理 - 404页面" "pass" "正确返回404"
    else
        record_result "错误处理 - 404页面" "fail" "未正确返回404"
    fi
    
    # 测试无效API请求
    local api_response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/invalid-endpoint")
    
    if [ "$api_response" == "404" ] || [ "$api_response" == "400" ]; then
        record_result "错误处理 - 无效API" "pass" "正确处理无效请求"
    else
        record_result "错误处理 - 无效API" "fail" "未正确处理无效请求"
    fi
}

# 10. 并发测试
test_concurrent_requests() {
    print_info "执行并发请求测试..."
    
    # 使用ab或wrk进行并发测试（如果可用）
    if command -v ab &> /dev/null; then
        local result=$(ab -n 100 -c 10 "$BASE_URL/" 2>&1 | grep "Requests per second")
        echo "   并发性能: $result"
        record_result "并发测试" "pass" "$result"
    else
        print_warning "Apache Bench未安装，跳过并发测试"
        record_result "并发测试" "skip" "需要Apache Bench"
    fi
}

# 生成测试报告
generate_report() {
    print_info "生成测试报告..."
    
    local report_file="$TEST_RESULTS_DIR/test_report.txt"
    
    cat > "$report_file" << EOF
========================================
发布后验证测试报告
========================================
测试时间: $(date)
测试环境: $BASE_URL
========================================

测试概览:
- 总测试数: $total_tests
- 通过测试: $passed_tests
- 失败测试: $failed_tests
- 通过率: $((passed_tests * 100 / total_tests))%

========================================
详细测试结果:
========================================

EOF
    
    for result in "${test_results[@]}"; do
        echo "$result" >> "$report_file"
    done
    
    cat >> "$report_file" << EOF

========================================
测试结论:
========================================

EOF
    
    if [ $failed_tests -eq 0 ]; then
        echo "✅ 所有测试通过，发布验证成功！" >> "$report_file"
        print_success "所有测试通过，发布验证成功！"
    else
        echo "❌ 存在 $failed_tests 个失败测试，请检查并修复。" >> "$report_file"
        print_error "存在 $failed_tests 个失败测试，请检查并修复。"
    fi
    
    echo "📄 详细报告已生成: $report_file"
}

# 发送通知
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
            --data "{\"attachments\":[{\"color\":\"$color\",\"title\":\"发布后验证测试\",\"text\":\"$message\\n通过率: $((passed_tests * 100 / total_tests))%\"}]}" \
            "$SLACK_WEBHOOK_URL"
    fi
}

# 主测试流程
main() {
    echo "========================================"
    echo "发布后验证测试开始"
    echo "========================================"
    
    # 执行所有测试
    test_health_check
    test_page_accessibility
    test_static_assets
    test_api_endpoints
    test_performance
    test_security
    test_database_connection
    test_realtime_connection
    test_error_handling
    test_concurrent_requests
    
    # 生成报告
    generate_report
    
    # 发送通知
    if [ $failed_tests -eq 0 ]; then
        send_notification "success" "发布后验证测试全部通过！"
        echo "🎉 发布后验证测试完成，所有测试通过！"
        return 0
    else
        send_notification "failure" "发布后验证测试存在失败，请检查报告"
        echo "⚠️  发布后验证测试完成，存在失败测试"
        return 1
    fi
}

# 执行主流程
main "$@"