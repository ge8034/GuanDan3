# 性能优化开发标准

**版本**: v1.0
**创建日期**: 2026-03-19
**负责人**: 性能优化团队 (performance-dev)

---

## 📋 概述

本文档定义了 GuanDan3 项目的性能优化开发标准，旨在确保系统在满足业务需求的同时，达到以下核心性能指标：

### 核心性能目标
1. **首屏加载时间** ≤ 2秒（3G网络模拟）
2. **游戏操作延迟** ≤ 100ms（P99百分位）
3. **API响应时间** ≤ 100ms（P95百分位）
4. **20人并发CPU使用率** ≤ 30%（1 vCPU）
5. **内存使用峰值** ≤ 512MB
6. **零人工干预7×24小时无崩溃**

### 适用范围
- 前端代码开发
- 后端API开发
- 数据库设计和查询
- 实时通信系统
- 测试和监控系统

---

## 🧪 性能测试标准

### 1. 多层级性能测试框架

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

### 2. 性能指标定义

#### 2.1 响应时间指标
| 指标 | 定义 | 目标值 | 测量方法 |
|------|------|--------|----------|
| 平均响应时间 | 所有请求的平均响应时间 | ≤ 50ms | 服务器日志 |
| P50响应时间 | 50%请求的响应时间 | ≤ 40ms | 服务器日志 |
| P95响应时间 | 95%请求的响应时间 | ≤ 100ms | 服务器日志 |
| P99响应时间 | 99%请求的响应时间 | ≤ 200ms | 服务器日志 |
| 最大响应时间 | 最慢请求的响应时间 | ≤ 500ms | 服务器日志 |

#### 2.2 吞吐量指标
| 指标 | 定义 | 目标值 | 测量方法 |
|------|------|--------|----------|
| 请求速率 | 每秒处理的请求数 | ≥ 100 RPS | 负载测试 |
| 并发用户数 | 同时活跃的用户数 | 20用户 | 监控系统 |
| 网络吞吐量 | 每秒处理的数据量 | ≤ 1Mbps/用户 | 网络监控 |

#### 2.3 资源使用指标
| 指标 | 定义 | 目标值 | 测量方法 |
|------|------|--------|----------|
| CPU使用率 | 服务器CPU占用率 | ≤ 30% (20并发) | 系统监控 |
| 内存使用率 | 服务器内存占用率 | ≤ 512MB (峰值) | 系统监控 |
| 数据库连接数 | 活跃数据库连接数 | ≤ 20 | 数据库监控 |

### 3. 性能验收标准

#### 3.1 核心API性能标准
| API端点 | P95响应时间 | P99响应时间 | 错误率 | 并发用户数 |
|---------|-------------|-------------|--------|------------|
| submit_turn | ≤ 60ms | ≤ 100ms | < 0.1% | 20 |
| 创建房间 | ≤ 100ms | ≤ 200ms | < 0.1% | 20 |
| 加入房间 | ≤ 100ms | ≤ 200ms | < 0.1% | 20 |
| 获取游戏状态 | ≤ 50ms | ≤ 100ms | < 0.1% | 20 |
| WebSocket连接 | ≤ 50ms | ≤ 100ms | < 0.1% | 20 |

#### 3.2 前端性能标准
| 指标 | 定义 | 目标值 | 测量工具 |
|------|------|--------|----------|
| 首屏加载时间 | 首次内容绘制时间 | ≤ 2s | Lighthouse |
| 最大内容绘制 | 最大内容元素渲染时间 | ≤ 2.5s | Lighthouse |
| 累计布局偏移 | 页面布局稳定性 | ≤ 0.1 | Lighthouse |
| 首次输入延迟 | 用户首次交互响应时间 | ≤ 100ms | Lighthouse |
| 可交互时间 | 页面完全可交互时间 | ≤ 3.8s | Lighthouse |

---

## 💻 代码性能规范

### 1. 异步代码编写规范

#### 1.1 useEffect使用规范
```typescript
// ❌ 错误示例：过度复杂的useEffect
useEffect(() => {
  // 25+个useEffect导致执行顺序混乱
}, [dependency1, dependency2, dependency3, ...])

// ✅ 正确示例：合并相关逻辑
useEffect(() => {
  // 合并相关初始化逻辑
  initializeGame()
  setupEventListeners()
  startGameLoop()

  return () => {
    // 清理函数
    cleanupGame()
    removeEventListeners()
    stopGameLoop()
  }
}, [gameId, userId])
```

#### 1.2 避免无限循环
```typescript
// ❌ 错误示例：可能导致无限循环
const setupEventListeners = () => {
  if (!containerReady) {
    setTimeout(setupEventListeners, 100) // 10次重试循环
  }
}

// ✅ 正确示例：有限重试机制
const setupEventListeners = (retryCount = 0) => {
  if (retryCount >= 3) {
    console.error('Failed to setup event listeners after 3 retries')
    return
  }

  if (!containerReady) {
    setTimeout(() => setupEventListeners(retryCount + 1), 100)
    return
  }

  // 正常设置事件监听器
}
```

### 2. 内存管理规范

#### 2.1 避免内存泄漏
```typescript
// ❌ 错误示例：可能导致内存泄漏
useEffect(() => {
  const interval = setInterval(() => {
    updateGameState()
  }, 1000)

  // 缺少清理函数
}, [])

// ✅ 正确示例：正确清理资源
useEffect(() => {
  const interval = setInterval(() => {
    updateGameState()
  }, 1000)

  return () => {
    clearInterval(interval)
  }
}, [])
```

#### 2.2 对象池使用
```typescript
// 游戏对象池示例
class GameObjectPool {
  private pool: Map<string, any[]> = new Map()

  acquire<T>(type: string, creator: () => T): T {
    if (!this.pool.has(type)) {
      this.pool.set(type, [])
    }

    const pool = this.pool.get(type)!
    if (pool.length > 0) {
      return pool.pop() as T
    }

    return creator()
  }

  release<T>(type: string, obj: T) {
    if (!this.pool.has(type)) {
      this.pool.set(type, [])
    }

    this.pool.get(type)!.push(obj)
  }
}
```

### 3. 算法复杂度控制

#### 3.1 时间复杂度要求
| 操作类型 | 允许的时间复杂度 | 示例 |
|----------|------------------|------|
| 实时操作 | O(1) 或 O(log n) | 游戏状态更新 |
| 用户交互 | O(n) | 手牌排序 |
| 批量处理 | O(n log n) | 游戏历史分析 |
| 离线计算 | O(n²) | AI策略训练 |

#### 3.2 空间复杂度要求
| 数据类型 | 允许的空间复杂度 | 示例 |
|----------|------------------|------|
| 实时数据 | O(1) | 当前游戏状态 |
| 用户数据 | O(n) | 玩家手牌 |
| 历史数据 | O(n) | 游戏记录 |
| 缓存数据 | O(n) | 常用查询结果 |

---

## 🏗️ 架构性能标准

### 1. 初始化流程优化

#### 1.1 Phaser场景初始化规范
```typescript
// ❌ 错误示例：初始化流程错误
const createMainGameScene = () => {
  return class MainGameSceneClass { // 返回类定义而不是实例
    constructor() {
      this.eventBridge = new EventBridge(this) // 过早创建
    }
  }
}

// ✅ 正确示例：正确的初始化流程
class MainGameScene extends Phaser.Scene {
  private eventBridge?: EventBridge

  init() {
    // 初始化场景数据
  }

  create() {
    // 在create方法中创建EventBridge
    this.eventBridge = new EventBridge(this)
    this.sys.events.on('ready', () => {
      this.eventBridge!.initialize()
    })
  }
}
```

#### 1.2 异步依赖管理
```typescript
// ❌ 错误示例：异步依赖混乱
const initGame = async () => {
  // 异步初始化但没有await
  initializePhaser()
  setupEventListeners() // 可能执行多次
}

// ✅ 正确示例：正确的异步依赖管理
class GameInitializer {
  private initialized = false
  private initializing = false

  async initialize() {
    if (this.initialized) return
    if (this.initializing) return

    this.initializing = true

    try {
      await this.initializePhaser()
      await this.setupEventListeners()
      await this.startGameLoop()

      this.initialized = true
    } finally {
      this.initializing = false
    }
  }
}
```

### 2. 事件通信机制

#### 2.1 避免循环依赖
```typescript
// ❌ 错误示例：循环依赖
// React ↔ Phaser ↔ MainGameScene ↔ EventBridge 的循环依赖

// ✅ 正确示例：单向数据流
class EventSystem {
  private listeners: Map<string, Function[]> = new Map()

  emit(event: string, data: any) {
    const handlers = this.listeners.get(event) || []
    handlers.forEach(handler => handler(data))
  }

  on(event: string, handler: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event)!.push(handler)

    return () => this.off(event, handler)
  }

  off(event: string, handler: Function) {
    const handlers = this.listeners.get(event) || []
    const index = handlers.indexOf(handler)
    if (index > -1) {
      handlers.splice(index, 1)
    }
  }
}
```

#### 2.2 事件去重和节流
```typescript
class OptimizedEventEmitter {
  private lastEmitTime: Map<string, number> = new Map()

  emitWithThrottle(event: string, data: any, throttleMs: number = 100) {
    const now = Date.now()
    const lastTime = this.lastEmitTime.get(event) || 0

    if (now - lastTime < throttleMs) {
      return // 跳过频繁事件
    }

    this.lastEmitTime.set(event, now)
    this.emit(event, data)
  }
}
```

### 3. 状态管理性能

#### 3.1 Zustand状态更新优化
```typescript
// ❌ 错误示例：不必要的重渲染
const useGameStore = create((set) => ({
  players: [],
  cards: [],
  updatePlayer: (playerId, data) => set((state) => ({
    players: state.players.map(p =>
      p.id === playerId ? { ...p, ...data } : p
    )
  })),
}))

// ✅ 正确示例：使用选择器避免重渲染
const useGameStore = create((set) => ({
  players: [],
  cards: [],
  updatePlayer: (playerId, data) => set((state) => {
    const playerIndex = state.players.findIndex(p => p.id === playerId)
    if (playerIndex === -1) return state

    const newPlayers = [...state.players]
    newPlayers[playerIndex] = { ...newPlayers[playerIndex], ...data }

    return { players: newPlayers }
  }),
}))

// 使用选择器
const usePlayer = (playerId) => {
  return useGameStore(
    useCallback(
      (state) => state.players.find(p => p.id === playerId),
      [playerId]
    )
  )
}
```

#### 3.2 状态序列化优化
```typescript
// 游戏状态序列化优化
class GameStateSerializer {
  serialize(state: GameState): string {
    // 只序列化变化的部分
    const delta = this.calculateDelta(state)
    return JSON.stringify(delta)
  }

  deserialize(serialized: string, baseState: GameState): GameState {
    const delta = JSON.parse(serialized)
    return this.applyDelta(baseState, delta)
  }

  private calculateDelta(newState: GameState, oldState?: GameState): any {
    if (!oldState) return newState

    const delta: any = {}
    for (const key in newState) {
      if (JSON.stringify(newState[key]) !== JSON.stringify(oldState[key])) {
        delta[key] = newState[key]
      }
    }

    return delta
  }
}
```

---

## 📊 监控与告警标准

### 1. 性能监控体系

#### 1.1 客户端监控
```typescript
// src/lib/performance/performance-monitor.ts
export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    webVitals: {
      fcp: null,  // 首次内容绘制
      lcp: null,  // 最大内容绘制
      cls: null,  // 累计布局偏移
      fid: null,  // 首次输入延迟
      ttfb: null, // 首字节时间
    },
    gameActions: [],
    networkRequests: [],
    memoryUsage: [],
  }

  trackGameAction(action: string, duration: number) {
    this.metrics.gameActions.push({
      action,
      duration,
      timestamp: Date.now()
    })

    // 自动上报重要指标
    if (duration > 100) {
      this.reportSlowAction(action, duration)
    }
  }
}
```

#### 1.2 服务器端监控
```typescript
// middleware/performance-monitor.js
module.exports = (req, res, next) => {
  const startTime = Date.now()
  const requestId = generateRequestId()

  // 记录请求开始
  logRequestStart(requestId, req.method, req.path)

  // 原始end方法
  const originalEnd = res.end

  res.end = function(...args) {
    const duration = Date.now() - startTime

    // 记录性能指标
    recordAPIMetrics({
      requestId,
      path: req.path,
      method: req.method,
      duration,
      statusCode: res.statusCode,
      timestamp: Date.now()
    })

    // 慢请求告警
    if (duration > 100) {
      alertSlowRequest(requestId, req.path, duration)
    }

    return originalEnd.apply(this, args)
  }

  next()
}
```

### 2. 告警机制

#### 2.1 告警规则定义
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

  - name: "高内存使用率"
    condition: "memory_usage > 80"
    severity: "warning"
    channels: ["slack"]
```

#### 2.2 告警管理器
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

    // 检查错误率
    if (metrics.errorRate > 0.01) {
      alerts.push({
        name: '高错误率',
        message: `错误率 ${(metrics.errorRate * 100).toFixed(2)}% 超过阈值 1%`,
        severity: 'critical',
        timestamp: Date.now()
      })
    }

    return alerts
  }
}
```

### 3. 性能问题诊断流程

#### 3.1 诊断工具
| 工具 | 用途 | 使用场景 |
|------|------|----------|
| Chrome DevTools | 前端性能分析 | 页面加载慢、渲染卡顿 |
| Node.js Profiler | 后端性能分析 | API响应慢、CPU高 |
| pg_stat_statements | 数据库查询分析 | 慢查询、数据库瓶颈 |
| k6结果分析 | 负载测试分析 | 系统容量、性能瓶颈 |

#### 3.2 诊断步骤
1. **测量**: 确定性能瓶颈位置
2. **分析**: 识别根本原因
3. **优化**: 实施优化措施
4. **验证**: 验证优化效果

---

## 🚀 优化最佳实践

### 1. 前端优化

#### 1.1 代码分割
```javascript
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react']
  },

  // 动态导入优化
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
      }
    }
    return config
  }
}
```

#### 1.2 图片优化
```typescript
// 图片懒加载组件
const LazyImage = ({ src, alt, ...props }) => {
  const [loaded, setLoaded] = useState(false)

  return (
    <img
      src={loaded ? src : placeholder}
      alt={alt}
      loading="lazy"
      onLoad={() => setLoaded(true)}
      {...props}
    />
  )
}
```

### 2. 后端优化

#### 2.1 数据库索引优化
```sql
-- 复合索引示例
CREATE INDEX IF NOT EXISTS idx_rooms_status_visibility
ON rooms(status, visibility)
WHERE status != 'closed';

-- 部分索引示例
CREATE INDEX IF NOT EXISTS idx_active_rooms
ON rooms(created_at DESC)
WHERE status = 'open';

-- 覆盖索引示例
CREATE INDEX IF NOT EXISTS idx_game_turns_covering
ON games(game_id, turn_no)
INCLUDE (seat_no, payload, created_at);
```

#### 2.2 查询优化
```typescript
// ❌ 错误示例：N+1查询
const getGameWithTurns = async (gameId) => {
  const game = await db.games.findUnique({ where: { id: gameId } })
  const turns = await db.turns.findMany({ where: { game_id: gameId } })
  return { ...game, turns }
}

// ✅ 正确示例：JOIN查询
const getGameWithTurns = async (gameId) => {
  const gameWithTurns = await db.games.findUnique({
    where: { id: gameId },
    include: {
      turns: {
        orderBy: { turn_no: 'asc' },
        take: 100 // 限制返回数量
      }
    }
  })
  return gameWithTurns
}
```

### 3. 缓存优化

#### 3.1 Redis缓存策略
```typescript
class GameCache {
  private redis: RedisClient
  private ttl = 300 // 5分钟

  async getGameState(gameId: string): Promise<GameState | null> {
    const cacheKey = `game:${gameId}:state`
    const cached = await this.redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const state = await this.fetchGameStateFromDB(gameId)
    if (state) {
      await this.redis.setex(cacheKey, this.ttl, JSON.stringify(state))
    }

    return state
  }

  async invalidateGameState(gameId: string) {
    const cacheKey = `game:${gameId}:state`
    await this.redis.del(cacheKey)
  }
}
```

#### 3.2 浏览器缓存
```typescript
// Service Worker缓存策略
const CACHE_NAME = 'guandan3-v1'

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response // 返回缓存
      }

      return fetch(event.request).then((response) => {
        // 缓存静态资源
        if (event.request.url.includes('/static/')) {
          const responseToCache = response.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache)
          })
        }

        return response
      })
    })
  )
})
```

### 4. 网络优化

#### 4.1 HTTP/2优化
```javascript
// next.config.js
module.exports = {
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
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff'
        }
      ]
    }
  ]
}
```

#### 4.2 资源预加载
```typescript
// 关键资源预加载
const PreloadResources = () => {
  useEffect(() => {
    // 预加载关键资源
    const preloads = [
      { href: '/fonts/inter.woff2', as: 'font', type: 'font/woff2' },
      { href: '/images/cards-sprite.png', as: 'image' },
      { href: '/sounds/card-play.mp3', as: 'audio' },
    ]

    preloads.forEach(({ href, as, type }) => {
      const link = document.createElement('link')
      link.rel = 'preload'
      link.href = href
      link.as = as
      if (type) link.type = type
      document.head.appendChild(link)
    })
  }, [])

  return null
}
```

---

## 🔄 持续集成中的性能测试

### 1. 自动化性能测试

#### 1.1 CI/CD集成
```yaml
# .github/workflows/performance.yml
name: Performance Testing

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # 每天凌晨2点运行

jobs:
  performance:
    runs-on: ubuntu-latest
    timeout-minutes: 30

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Install k6
      run: |
        sudo apt-key adv --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
        echo "deb https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
        sudo apt-get update
        sudo apt-get install k6

    - name: Run unit performance tests
      run: npm run test:performance

    - name: Run load test
      run: k6 run k6/load-test.js --out json=performance-results/k6-result.json
      env:
        BASE_URL: http://localhost:3000

    - name: Generate performance report
      run: npm run perf:report

    - name: Check performance budget
      run: npm run perf:budget

    - name: Upload performance artifacts
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: performance-report
        path: |
          performance-results/
          coverage/
```

#### 1.2 性能预算检查
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
  },
  {
    name: 'api-response-p99',
    type: 'api',
    maxValue: 100, // 100ms
    warningThreshold: 0.8,
    criticalThreshold: 0.95
  }
]

export class PerformanceBudgetChecker {
  checkBudgets(metrics: PerformanceMetrics): BudgetResult[] {
    const results: BudgetResult[] = []

    for (const budget of defaultBudgets) {
      const value = this.getValueForBudget(budget, metrics)
      const percentage = value / budget.maxValue

      results.push({
        name: budget.name,
        value,
        maxValue: budget.maxValue,
        percentage,
        status: this.getStatus(percentage, budget)
      })
    }

    return results
  }
}
```

### 2. 性能回归检测

#### 2.1 基线对比
```typescript
class PerformanceRegressionDetector {
  private baseline: PerformanceBaseline

  async detectRegression(currentMetrics: PerformanceMetrics): Promise<RegressionResult> {
    const baseline = await this.loadBaseline()

    const regressions: Regression[] = []

    // 检查API响应时间
    if (currentMetrics.apiResponseP99 > baseline.apiResponseP99 * 1.2) {
      regressions.push({
        metric: 'api_response_p99',
        current: currentMetrics.apiResponseP99,
        baseline: baseline.apiResponseP99,
        increase: ((currentMetrics.apiResponseP99 - baseline.apiResponseP99) / baseline.apiResponseP99) * 100
      })
    }

    // 检查错误率
    if (currentMetrics.errorRate > baseline.errorRate * 1.5) {
      regressions.push({
        metric: 'error_rate',
        current: currentMetrics.errorRate,
        baseline: baseline.errorRate,
        increase: ((currentMetrics.errorRate - baseline.errorRate) / baseline.errorRate) * 100
      })
    }

    return {
      hasRegression: regressions.length > 0,
      regressions,
      timestamp: Date.now()
    }
  }
}
```

#### 2.2 趋势分析
```typescript
class PerformanceTrendAnalyzer {
  async analyzeTrend(metricsHistory: PerformanceMetrics[]): Promise<TrendAnalysis> {
    const trends: Trend[] = []

    // 分析API响应时间趋势
    const apiResponseTrend = this.calculateTrend(
      metricsHistory.map(m => m.apiResponseP99)
    )

    if (apiResponseTrend.slope > 0.1) {
      trends.push({
        metric: 'api_response_p99',
        slope: apiResponseTrend.slope,
        direction: 'increasing',
        confidence: apiResponseTrend.confidence
      })
    }

    // 分析错误率趋势
    const errorRateTrend = this.calculateTrend(
      metricsHistory.map(m => m.errorRate)
    )

    if (errorRateTrend.slope > 0.01) {
      trends.push({
        metric: 'error_rate',
        slope: errorRateTrend.slope,
        direction: 'increasing',
        confidence: errorRateTrend.confidence
      })
    }

    return {
      trends,
      timestamp: Date.now()
    }
  }
}
```

---

## 📝 维护和更新

### 1. 版本控制
- 本文档与项目版本同步更新
- 每次架构变更必须更新相应的性能标准
- 性能标准版本号与项目版本号一致

### 2. 变更管理
1. **性能需求变更**: 更新性能目标和指标
2. **架构变更**: 更新架构性能标准
3. **工具变更**: 更新测试工具和监控工具
4. **优化实施**: 更新优化最佳实践

### 3. 评审流程
- 每次性能标准变更需要性能团队评审
- 新增性能测试用例需要开发团队确认
- 性能测试结果需要产品团队验收

### 4. 培训要求
- 新成员必须学习本文档
- 定期进行性能优化培训
- 分享性能优化案例和经验

---

## 🔧 工具和资源

### 1. 测试工具
| 工具 | 用途 | 文档链接 |
|------|------|----------|
| k6 | 负载测试 | https://k6.io/docs/ |
| Playwright | E2E测试 | https://playwright.dev/ |
| Vitest | 单元测试 | https://vitest.dev/ |
| Lighthouse | 前端性能 | https://developer.chrome.com/docs/lighthouse/ |

### 2. 监控工具
| 工具 | 用途 | 文档链接 |
|------|------|----------|
| Sentry | 错误监控 | https://sentry.io/ |
| Supabase监控 | 数据库监控 | https://supabase.com/docs/guides/platform/metrics |
| Vercel Analytics | 前端分析 | https://vercel.com/analytics |
| Prometheus | 指标监控 | https://prometheus.io/ |

### 3. 分析工具
| 工具 | 用途 | 文档链接 |
|------|------|----------|
| Chrome DevTools | 前端分析 | https://developer.chrome.com/docs/devtools/ |
| Node.js Profiler | 后端分析 | https://nodejs.org/en/docs/guides/simple-profiling/ |
| pg_stat_statements | 数据库分析 | https://www.postgresql.org/docs/current/pgstatstatements.html |

---

**文档版本**: v1.0
**最后更新**: 2026-03-19
**下次评审**: 2026-03-26
**维护者**: 性能优化团队 (performance-dev)