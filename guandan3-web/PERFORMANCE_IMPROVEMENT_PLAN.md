# 性能测试套件改进计划

## 当前状态分析

### 优势
1. **已有基础架构**: 性能监控、预算管理、测试框架
2. **数据库优化**: 复合索引、部分索引、优化函数
3. **多层级测试**: 单元测试、E2E测试、负载测试
4. **自动化脚本**: 性能测试执行和报告生成

### 问题识别
1. **测试执行失败**: Next.js Turbopack配置问题
2. **覆盖不完整**: 缺少API性能测试、实时同步测试
3. **监控不全面**: 缺少生产环境监控和告警
4. **基准不稳定**: 性能基线管理需要改进

## 改进目标

### 短期目标（1-2周）
1. 修复现有测试执行问题
2. 完善性能测试覆盖范围
3. 建立稳定的性能基线
4. 优化测试执行效率

### 中期目标（1个月）
1. 实现全面的性能监控
2. 建立自动化告警机制
3. 优化关键路径性能
4. 提升测试可靠性

### 长期目标（3个月）
1. 实现智能性能分析
2. 建立性能优化闭环
3. 达到生产环境SLA
4. 形成性能文化

## 具体改进措施

### 1. 修复测试执行问题

#### 1.1 Next.js配置修复
```javascript
// next.config.js
module.exports = {
  // 明确指定构建工具
  webpack: (config, { isServer }) => {
    // 自定义webpack配置
    return config
  },

  // 或者启用Turbopack
  experimental: {
    turbo: {
      // Turbopack配置
    }
  }
}
```

#### 1.2 测试环境优化
```bash
# 修改测试脚本，明确指定构建工具
"scripts": {
  "test:perf:webpack": "next dev --webpack",
  "test:perf:turbo": "next dev --turbo"
}
```

### 2. 完善测试覆盖

#### 2.1 API性能测试
```typescript
// tests/api/performance.spec.ts
import { test, expect } from '@playwright/test'

test.describe('API性能测试', () => {
  test('submit_turn API响应时间', async ({ request }) => {
    const startTime = Date.now()
    const response = await request.post('/api/submit-turn', {
      data: { /* 测试数据 */ }
    })
    const endTime = Date.now()

    expect(response.ok()).toBeTruthy()
    expect(endTime - startTime).toBeLessThan(100) // < 100ms
  })
})
```

#### 2.2 实时同步测试
```typescript
// tests/realtime/performance.spec.ts
test('实时消息延迟', async ({ page }) => {
  // 测量从发送到接收的延迟
  const sendTime = Date.now()
  await page.evaluate(() => {
    // 发送实时消息
    window.supabase.channel('test').send({ type: 'test' })
  })

  // 等待接收并测量延迟
  const receiveTime = await page.evaluate(() => {
    return new Promise(resolve => {
      window.supabase.channel('test').on('broadcast', { event: 'test' }, () => {
        resolve(Date.now())
      })
    })
  })

  const latency = receiveTime - sendTime
  expect(latency).toBeLessThan(60) // < 60ms
})
```

### 3. 性能监控增强

#### 3.1 客户端监控增强
```typescript
// src/lib/monitoring/performance-monitor-enhanced.ts
export class EnhancedPerformanceMonitor {
  private metrics: PerformanceMetrics = {
    gameActions: [],
    networkRequests: [],
    renderTimes: [],
    memoryUsage: []
  }

  trackGameAction(action: string, duration: number) {
    this.metrics.gameActions.push({
      action,
      duration,
      timestamp: Date.now()
    })
  }

  // 更多监控功能...
}
```

#### 3.2 服务器端监控
```javascript
// middleware/performance-monitor.js
module.exports = (req, res, next) => {
  const startTime = Date.now()

  // 原始end方法
  const originalEnd = res.end

  res.end = function(...args) {
    const duration = Date.now() - startTime

    // 记录性能指标
    recordAPIMetrics({
      path: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: Date.now()
    })

    return originalEnd.apply(this, args)
  }

  next()
}
```

### 4. 自动化告警系统

#### 4.1 告警规则定义
```yaml
# alert-rules.yaml
rules:
  - name: "高API延迟"
    condition: "api_response_p99 > 100"
    severity: "warning"
    channels: ["slack", "email"]

  - name: "高错误率"
    condition: "error_rate > 0.01"
    severity: "critical"
    channels: ["slack", "pagerduty"]

  - name: "高CPU使用率"
    condition: "cpu_usage > 70"
    severity: "warning"
    channels: ["slack"]
```

#### 4.2 告警集成
```typescript
// src/lib/monitoring/alert-manager.ts
export class AlertManager {
  async checkAndAlert(metrics: PerformanceMetrics) {
    const alerts = await this.evaluateRules(metrics)

    for (const alert of alerts) {
      await this.sendAlert(alert)
    }
  }

  private async evaluateRules(metrics: PerformanceMetrics): Promise<Alert[]> {
    // 评估告警规则
    const alerts: Alert[] = []

    // 检查API延迟
    if (metrics.apiResponseP99 > 100) {
      alerts.push({
        name: '高API延迟',
        message: `API P99响应时间 ${metrics.apiResponseP99}ms 超过阈值 100ms`,
        severity: 'warning',
        timestamp: Date.now()
      })
    }

    // 更多规则检查...
    return alerts
  }
}
```

### 5. 性能优化重点

#### 5.1 关键路径优化
1. **游戏操作路径**: 出牌 → 验证 → 广播 → 渲染
2. **房间加入路径**: 验证 → 分配座位 → 同步状态
3. **断线重连路径**: 检测 → 恢复 → 同步

#### 5.2 资源优化
1. **内存优化**: 对象池、缓存清理
2. **CPU优化**: 算法优化、异步处理
3. **网络优化**: 压缩、批处理、CDN

#### 5.3 数据库优化
1. **查询优化**: 避免N+1、使用索引
2. **连接优化**: 连接池配置
3. **缓存优化**: Redis缓存策略

### 6. 实施计划

#### 第1周：基础修复
- [ ] 修复Next.js配置问题
- [ ] 优化测试执行环境
- [ ] 建立稳定的测试基线
- [ ] 完善单元性能测试

#### 第2周：测试增强
- [ ] 添加API性能测试
- [ ] 添加实时同步测试
- [ ] 完善负载测试场景
- [ ] 优化测试数据生成

#### 第3周：监控增强
- [ ] 增强客户端监控
- [ ] 添加服务器端监控
- [ ] 实现基础告警功能
- [ ] 建立监控仪表板

#### 第4周：优化实施
- [ ] 优化关键路径性能
- [ ] 实施资源优化措施
- [ ] 优化数据库查询
- [ ] 性能回归测试

### 7. 成功指标

#### 7.1 测试指标
- [ ] 性能测试通过率: 100%
- [ ] 测试执行时间: < 10分钟
- [ ] 测试覆盖率: > 90%
- [ ] 测试稳定性: > 95%

#### 7.2 性能指标
- [ ] 首屏加载时间: ≤ 2s
- [ ] 游戏操作延迟: ≤ 100ms (P99)
- [ ] API响应时间: ≤ 100ms (P95)
- [ ] CPU使用率: ≤ 30% (20并发)

#### 7.3 监控指标
- [ ] 监控覆盖率: 100%
- [ ] 告警准确率: > 95%
- [ ] 问题发现时间: < 5分钟
- [ ] 问题解决时间: < 30分钟

### 8. 风险管理

#### 8.1 技术风险
- **测试环境不一致**: 建立标准测试环境
- **性能回归**: 严格的性能测试和监控
- **监控遗漏**: 定期审查监控覆盖

#### 8.2 执行风险
- **时间不足**: 分阶段实施，优先关键功能
- **资源不足**: 合理分配资源，利用现有工具
- **技能不足**: 培训团队，文档支持

#### 8.3 业务风险
- **用户体验影响**: 渐进式优化，充分测试
- **数据丢失风险**: 备份策略，回滚计划
- **服务中断风险**: 蓝绿部署，监控告警

### 9. 资源需求

#### 9.1 人力资源
- 性能测试工程师: 1人
- 后端开发工程师: 1人
- 前端开发工程师: 1人
- DevOps工程师: 0.5人

#### 9.2 技术资源
- 测试服务器: 2台
- 监控工具: Sentry, Supabase监控
- 负载测试工具: k6, Playwright
- 部署工具: Vercel, GitHub Actions

#### 9.3 时间资源
- 总工期: 4周
- 每周投入: 40人时
- 关键里程碑: 每周评审

### 10. 附录

#### 10.1 参考文档
- [Next.js性能优化指南](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Supabase性能最佳实践](https://supabase.com/docs/guides/performance)
- [k6负载测试文档](https://k6.io/docs/)
- [Playwright测试指南](https://playwright.dev/docs/intro)

#### 10.2 工具清单
- **测试工具**: Vitest, Playwright, k6
- **监控工具**: Sentry, Supabase监控, Vercel Analytics
- **分析工具**: Chrome DevTools, Node.js Profiler
- **部署工具**: GitHub Actions, Vercel

#### 10.3 联系人
- 项目负责人: [姓名]
- 技术负责人: [姓名]
- 测试负责人: [姓名]
- 运维负责人: [姓名]

---

**计划版本**: 1.0.0
**制定日期**: 2026-03-19
**审核状态**: ✅ 已审核
**下次评审**: 2026-03-26