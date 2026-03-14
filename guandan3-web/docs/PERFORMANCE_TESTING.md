# 性能测试指南

## 概述

使用 k6 进行负载测试，确保应用在高并发情况下的稳定性和性能。

## 安装 k6

### Windows
```powershell
# 使用 Chocolatey
choco install k6

# 或使用 Scoop
scoop install k6

# 或手动下载
# 访问 https://k6.io/docs/getting-started/installation/
```

### macOS
```bash
brew install k6
```

### Linux
```bash
# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6
```

## 运行测试

### 基础测试
```bash
# 本地测试
npm run test:load:k6

# 指定目标URL
BASE_URL=https://your-app.com npm run test:load:k6

# 导出结果
npm run test:load:summary
```

### 自定义测试
```bash
# 直接运行 k6
k6 run k6/load-test.js

# 指定输出
k6 run --out json=k6-results.json k6/load-test.js

# 指定并发数
k6 run --vus 50 --duration 5m k6/load-test.js
```

## 测试场景

### 1. 基础负载测试
测试应用在正常负载下的表现：
- 10-50 并发用户
- 持续 5-10 分钟
- 模拟真实用户行为

### 2. 峰值负载测试
测试应用在高峰期的表现：
- 100-500 并发用户
- 短时间峰值
- 验证自动扩展

### 3. 压力测试
测试应用的极限：
- 逐步增加负载
- 找到崩溃点
- 验证恢复能力

### 4. 耐久测试
测试应用的稳定性：
- 长时间运行
- 持续负载
- 检测内存泄漏

## 测试指标

### 关键指标
- **响应时间**: p50, p95, p99
- **吞吐量**: 请求/秒
- **错误率**: 失败请求百分比
- **并发用户**: 同时在线用户数

### 性能目标
- **首页**: < 300ms (p95)
- **游戏大厅**: < 500ms (p95)
- **战绩页面**: < 500ms (p95)
- **API 响应**: < 100ms (p95)
- **错误率**: < 5%

## 测试脚本

### 基础脚本
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export default function () {
  let res = http.get('http://localhost:3000/');
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  sleep(1);
}
```

### 高级脚本
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
};

export default function () {
  // 测试逻辑
}
```

## 结果分析

### 控制台输出
```
✓ 首页状态码是200
✓ 首页响应时间<300ms
✓ 游戏大厅状态码是200
✓ 游戏大厅响应时间<500ms

checks.........................: 100.00% ✓ 4000      ✗ 0
data_received..................: 2.4 MB  40 kB/s
data_sent......................: 680 kB  11 kB/s
http_req_blocked...............: avg=1ms    min=0µs    med=0µs    max=15ms   p(90)=1ms    p(95)=2ms
http_req_connecting............: avg=1ms    min=0µs    med=0µs    max=10ms   p(90)=1ms    p(95)=2ms
http_req_duration..............: avg=45ms   min=1ms    med=30ms   max=500ms  p(90)=80ms   p(95)=120ms
http_req_failed................: 0.00%   ✓ 0        ✗ 4000
http_req_receiving.............: avg=10ms   min=0µs    med=5ms    max=100ms  p(90)=20ms   p(95)=30ms
http_req_sending...............: avg=1ms    min=0µs    med=0µs    max=10ms   p(90)=1ms    p(95)=2ms
http_req_tls_handshaking.......: avg=0s     min=0s     med=0s     max=0s     p(90)=0s     p(95)=0s
http_req_waiting...............: avg=34ms   min=1ms    med=25ms   max=450ms  p(90)=60ms   p(95)=90ms
http_reqs......................: 4000    66.666667/s
iteration_duration.............: avg=1.5s   min=1s     med=1.5s   max=2s     p(90)=1.8s   p(95)=1.9s
iterations.....................: 4000    66.666667/s
vus............................: 10      min=10     max=10
vus_max........................: 10      min=10     max=10
```

### JSON 输出
```bash
k6 run --summary-export=k6-summary.json k6/load-test.js
```

### 可视化
```bash
# 使用 k6-operator (Kubernetes)
# 或使用 Grafana + InfluxDB
```

## 性能优化建议

### 前端优化
1. **代码分割**: 减少初始加载时间
2. **图片优化**: 使用 WebP 格式
3. **缓存策略**: 启用浏览器缓存
4. **CDN 加速**: 使用全球 CDN

### 后端优化
1. **数据库索引**: 优化查询性能
2. **连接池**: 管理数据库连接
3. **缓存层**: 使用 Redis 缓存
4. **负载均衡**: 分发请求到多台服务器

### 网络优化
1. **HTTP/2**: 启用多路复用
2. **压缩传输**: 使用 Gzip/Brotli
3. **减少请求**: 合并资源文件
4. **预加载**: 提前加载关键资源

## 故障排查

### 响应时间慢
1. 检查数据库查询
2. 分析网络延迟
3. 检查服务器资源
4. 优化代码逻辑

### 错误率高
1. 检查应用日志
2. 验证 API 端点
3. 检查数据库连接
4. 分析错误类型

### 内存泄漏
1. 监控内存使用
2. 检查未释放资源
3. 分析堆快照
4. 优化代码逻辑

## 持续集成

### GitHub Actions
```yaml
name: Performance Test

on: [push, pull_request]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6
      - name: Run performance test
        run: k6 run k6/load-test.js
```

## 最佳实践

1. **定期测试**: 每次发布前运行性能测试
2. **基准测试**: 建立性能基准，对比变化
3. **真实场景**: 模拟真实用户行为
4. **监控告警**: 设置性能阈值告警
5. **持续优化**: 根据测试结果持续优化

## 相关资源

- [k6 官方文档](https://k6.io/docs/)
- [k6 示例脚本](https://k6.io/docs/examples/)
- [性能测试最佳实践](https://k6.io/docs/testing-guides/)
- [k6 社区论坛](https://community.k6.io/)
