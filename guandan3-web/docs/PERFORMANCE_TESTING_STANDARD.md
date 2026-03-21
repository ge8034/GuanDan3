# 性能测试标准与优化策略

## 概述

本文档定义了掼蛋3.0项目的性能测试标准、监控策略和优化最佳实践。目标是确保系统在20人并发场景下满足以下核心性能指标：

1. **首屏加载 ≤ 2秒**（3G网络）
2. **单局延迟 ≤ 100ms**（P99）
3. **20人并发 CPU ≤ 30%**（1 vCPU）
4. **零人工干预 7×24h 无崩溃**

## 性能测试架构

### 1. 多层级测试套件

#### 1.1 单元性能测试
- **位置**: `src/test/performance/`
- **目标**: 验证核心算法和函数的性能
- **指标**: 执行时间、内存使用、CPU占用
- **工具**: Vitest + 自定义性能断言

```typescript
// 示例：AI决策性能测试
it('应该在合理时间内完成手牌分析', () => {
  const startTime = performance.now()
  const move = analyzeMove(hand, 10)
  const endTime = performance.now()

  expect(endTime - startTime).toBeLessThan(100) // < 100ms
})
```

#### 1.2 集成性能测试
- **位置**: `tests/e2e/perf-*.spec.ts`
- **目标**: 验证端到端性能指标
- **指标**: Web Vitals (FCP, LCP, CLS, TTFB, FID)
- **工具**: Playwright + PerformanceObserver

#### 1.3 负载测试
- **位置**: `k6/load-test.js`
- **目标**: 模拟真实用户行为模式
- **指标**: 吞吐量、响应时间、错误率
- **工具**: k6 + 自定义指标

#### 1.4 压力测试
- **位置**: `scripts/load-test-node.js`
- **目标**: 发现系统极限和瓶颈
- **指标**: 最大并发数、资源使用率
- **工具**: Node.js + 并发控制

### 2. 性能监控体系

#### 2.1 客户端监控
```typescript
// src/lib/performance/performance-monitor.ts
export interface WebVitals {
  fcp: number | null  // 首次内容绘制
  lcp: number | null  // 最大内容绘制
  cls: number | null  // 累计布局偏移
  fid: number | null  // 首次输入延迟
  ttfb: number | null // 首字节时间
  tti: number | null  // 可交互时间
}
```

#### 2.2 服务器端监控
- **API响应时间**: P50, P95, P99
- **数据库查询性能**: 慢查询日志
- **资源使用率**: CPU、内存、网络
- **错误率**: HTTP错误、业务错误

#### 2.3 实时监控
- **Supabase Realtime延迟**: P99 ≤ 60ms
- **WebSocket连接稳定性**: 断开重连率
- **游戏状态同步延迟**: 端到端延迟

### 3. 性能预算管理

#### 3.1 前端性能预算
```typescript
// src/lib/performance/performance-budget.ts
const defaultBudgets = [
  {
    name: 'main-javascript',
    type: 'javascript',
    maxSize: 244 * 1024, // 244KB
    warningThreshold: 0.8,
    criticalThreshold: 0.95
  },
  {
    name: 'total-bundle',
    type: 'total',
    maxSize: 600 * 1024, // 600KB
    warningThreshold: 0.8,
    criticalThreshold: 0.95
  }
]
```

#### 3.2 后端性能预算
- **API响应时间**: P95 < 100ms, P99 < 200ms
- **数据库查询**: 单查询 < 50ms
- **内存使用**: 峰值 < 512MB
- **网络带宽**: 平均 < 1Mbps/用户

### 4. 测试执行流程

#### 4.1 本地开发阶段
```bash
# 运行单元性能测试
npm run test:performance

# 运行E2E性能基线测试
npm run test:e2e:perf

# 检查性能预算
npm run perf:budget
```

#### 4.2 CI/CD流水线
```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  performance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run unit performance tests
        run: npm run test:performance

      - name: Run load test
        run: npm run test:load

      - name: Generate performance report
        run: npm run perf:report

      - name: Upload performance artifacts
        uses: actions/upload-artifact@v4
        with:
          name: performance-report
          path: performance-results/
```

#### 4.3 生产环境监控
- **Sentry错误监控**: 实时错误跟踪
- **Supabase监控**: 数据库性能监控
- **Vercel Analytics**: 前端性能分析
- **自定义监控**: 游戏特定指标

### 5. 性能优化策略

#### 5.1 前端优化
1. **代码分割**: 按路由懒加载
2. **图片优化**: WebP格式、懒加载
3. **字体优化**: 子集化、预加载
4. **缓存策略**: Service Worker、CDN
5. **渲染优化**: Virtual DOM、Memoization

#### 5.2 后端优化
1. **数据库索引**: 复合索引、部分索引
2. **查询优化**: 避免N+1查询
3. **连接池**: 合理配置连接数
4. **缓存层**: Redis缓存热点数据
5. **异步处理**: 非关键操作异步化

#### 5.3 网络优化
1. **CDN加速**: 静态资源分发
2. **HTTP/2**: 多路复用、头部压缩
3. **压缩**: Gzip/Brotli压缩
4. **预连接**: DNS预解析、预连接

### 6. 性能基准和验收标准

#### 6.1 核心性能指标
| 指标 | 目标值 | 测量方法 | 验收标准 |
|------|--------|----------|----------|
| 首屏加载时间 | ≤ 2s | Lighthouse | 3G网络模拟 |
| 游戏操作延迟 | ≤ 100ms | 端到端测量 | P99百分位 |
| API响应时间 | ≤ 100ms | 服务器日志 | P95百分位 |
| 数据库查询 | ≤ 50ms | 慢查询日志 | 平均响应时间 |
| CPU使用率 | ≤ 30% | 系统监控 | 20人并发 |
| 内存使用 | ≤ 512MB | 系统监控 | 峰值使用 |

#### 6.2 性能测试场景
1. **正常负载**: 4人游戏，每秒1次操作
2. **峰值负载**: 20人并发，每秒5次操作
3. **耐久测试**: 持续运行24小时
4. **压力测试**: 逐步增加负载至系统极限

#### 6.3 性能回归检测
1. **基线对比**: 每次测试与基线对比
2. **趋势分析**: 监控性能变化趋势
3. **告警机制**: 性能下降自动告警
4. **根本原因分析**: 定位性能问题根源

### 7. 工具和配置

#### 7.1 测试工具
- **单元测试**: Vitest + 性能API
- **E2E测试**: Playwright + PerformanceObserver
- **负载测试**: k6 + 自定义指标
- **监控工具**: Sentry + Supabase监控

#### 7.2 构建配置
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // 性能优化配置
  headers: async () => [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on'
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload'
        }
      ]
    }
  ]
}
```

#### 7.3 数据库优化
```sql
-- 复合索引示例
CREATE INDEX IF NOT EXISTS idx_rooms_status_visibility
ON rooms(status, visibility)
WHERE status != 'closed';

-- 部分索引示例
CREATE INDEX IF NOT EXISTS idx_active_rooms
ON rooms(created_at DESC)
WHERE status = 'open';
```

### 8. 最佳实践

#### 8.1 开发阶段
1. **性能意识**: 编写代码时考虑性能影响
2. **代码审查**: 性能问题纳入代码审查
3. **测试驱动**: 性能测试与功能测试并重
4. **持续优化**: 定期进行性能优化

#### 8.2 测试阶段
1. **自动化测试**: 性能测试自动化
2. **真实场景**: 模拟真实用户行为
3. **环境一致**: 测试环境与生产环境一致
4. **数据驱动**: 基于数据的性能分析

#### 8.3 监控阶段
1. **实时监控**: 7×24小时性能监控
2. **预警机制**: 性能下降自动预警
3. **根本原因分析**: 快速定位问题
4. **持续改进**: 基于监控数据优化

### 9. 故障排除指南

#### 9.1 常见性能问题
1. **高延迟**: 网络问题、数据库慢查询
2. **高CPU**: 算法效率低、内存泄漏
3. **高内存**: 对象未释放、缓存过大
4. **低吞吐量**: 连接池不足、锁竞争

#### 9.2 诊断工具
1. **Chrome DevTools**: 前端性能分析
2. **Node.js Profiler**: 后端性能分析
3. **pg_stat_statements**: 数据库查询分析
4. **k6结果分析**: 负载测试结果分析

#### 9.3 优化步骤
1. **测量**: 确定性能瓶颈
2. **分析**: 识别根本原因
3. **优化**: 实施优化措施
4. **验证**: 验证优化效果

### 10. 附录

#### 10.1 性能测试命令
```bash
# 运行所有性能测试
npm run perf:test

# 建立性能基线
npm run perf:baseline

# 生成性能报告
npm run perf:report

# 运行负载测试
npm run test:load

# 运行k6测试
npm run test:load:k6
```

#### 10.2 监控指标定义
- **FCP (First Contentful Paint)**: 首次内容绘制时间
- **LCP (Largest Contentful Paint)**: 最大内容绘制时间
- **CLS (Cumulative Layout Shift)**: 累计布局偏移
- **FID (First Input Delay)**: 首次输入延迟
- **TTFB (Time to First Byte)**: 首字节时间
- **TTI (Time to Interactive)**: 可交互时间

#### 10.3 性能告警阈值
- **紧急**: 核心指标下降 > 50%
- **警告**: 核心指标下降 > 20%
- **注意**: 核心指标下降 > 10%
- **正常**: 核心指标在目标范围内

---

**文档版本**: 1.0.0
**最后更新**: 2026-03-19
**维护者**: 性能优化团队
**审核状态**: ✅ 已审核