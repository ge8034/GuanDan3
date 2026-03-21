# 后端架构优化开发标准

## 概述

本文档定义了 GuanDan3 项目的后端架构优化开发标准，旨在确保系统的高性能、可扩展性、安全性和可维护性。

## 1. API 设计标准

### 1.1 RESTful API 设计原则

#### 资源命名规范
- 使用复数名词表示资源集合：`/api/rooms`, `/api/games`
- 使用 HTTP 方法表示操作：
  - `GET`：获取资源
  - `POST`：创建资源
  - `PUT`：更新完整资源
  - `PATCH`：部分更新资源
  - `DELETE`：删除资源

#### 状态码规范
- `200 OK`：成功请求
- `201 Created`：资源创建成功
- `204 No Content`：成功但无返回内容
- `400 Bad Request`：客户端请求错误
- `401 Unauthorized`：未认证
- `403 Forbidden`：无权限
- `404 Not Found`：资源不存在
- `409 Conflict`：资源冲突
- `422 Unprocessable Entity`：请求格式正确但语义错误
- `429 Too Many Requests`：请求频率限制
- `500 Internal Server Error`：服务器内部错误

#### 请求/响应格式
```typescript
// 成功响应
{
  "data": T, // 主数据
  "meta": { // 元数据（分页、总数等）
    "total": number,
    "page": number,
    "limit": number
  }
}

// 错误响应
{
  "error": {
    "code": string, // 错误代码
    "message": string, // 用户友好消息
    "details": any, // 调试详情（仅开发环境）
    "timestamp": string // ISO 时间戳
  }
}
```

### 1.2 API 版本控制
- 使用 URL 路径版本：`/api/v1/rooms`
- 向后兼容性要求：至少支持 2 个主要版本
- 弃用通知：在响应头中提供弃用警告

### 1.3 速率限制
```typescript
// 响应头示例
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1614556800
```

## 2. 数据库架构标准

### 2.1 表设计规范

#### 命名规范
- 表名：小写复数形式，下划线分隔：`room_members`
- 列名：小写单数形式，下划线分隔：`created_at`
- 主键：`id` (UUID)
- 外键：`{table_name}_id` 或 `{table_singular}_id`

#### 数据类型选择
- 标识符：`uuid` (使用 `gen_random_uuid()`)
- 时间戳：`timestamptz` (带时区)
- 布尔值：`boolean`
- 枚举值：使用 `check` 约束或单独的表
- JSON 数据：`jsonb` (支持索引和查询)

#### 索引策略
```sql
-- 主键索引（自动创建）
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid()
);

-- 唯一索引
CREATE UNIQUE INDEX idx_room_members_room_seat
  ON room_members(room_id, seat_no);

-- 复合索引（查询优化）
CREATE INDEX idx_turns_game_turn
  ON turns(game_id, turn_no DESC);

-- 部分索引（条件过滤）
CREATE INDEX idx_rooms_active
  ON rooms(status)
  WHERE status IN ('open', 'playing');
```

### 2.2 关系设计
- 一对多：使用外键约束
- 多对多：使用关联表
- 自引用：使用相同表的外键

### 2.3 迁移管理
- 使用 Supabase 迁移系统
- 每个迁移文件包含完整的事务
- 提供回滚脚本（如果可能）
- 迁移文件命名：`YYYYMMDDHHMMSS_description.sql`

## 3. 性能优化标准

### 3.1 数据库性能

#### 查询优化
```sql
-- 避免 N+1 查询
-- 错误示例
SELECT * FROM rooms;
-- 对每个房间执行：
SELECT * FROM room_members WHERE room_id = ?;

-- 正确示例（使用 JOIN）
SELECT r.*,
       json_agg(rm.*) as members
FROM rooms r
LEFT JOIN room_members rm ON r.id = rm.room_id
GROUP BY r.id;
```

#### 连接池配置
```typescript
// Supabase 连接池配置
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'guandan3-web',
      },
    },
  }
);
```

### 3.2 缓存策略

#### 应用层缓存
```typescript
// 使用内存缓存（短期数据）
const roomCache = new Map<string, Room>();

// 使用 Redis（分布式缓存）
import { Redis } from 'ioredis';
const redis = new Redis(process.env.REDIS_URL);

// 缓存房间数据（5分钟）
async function getRoomWithCache(roomId: string): Promise<Room> {
  const cacheKey = `room:${roomId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const room = await fetchRoomFromDB(roomId);
  await redis.setex(cacheKey, 300, JSON.stringify(room));
  return room;
}
```

#### 数据库查询缓存
- 使用 PostgreSQL 的 `pg_stat_statements` 监控慢查询
- 对频繁查询的结果使用物化视图
- 定期分析查询计划

### 3.3 实时通信优化

#### Supabase Realtime 最佳实践
```typescript
// 1. 按需订阅
const subscription = supabase
  .channel(`room:${roomId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'turns',
    filter: `game_id=eq.${gameId}`
  }, handleNewTurn)
  .subscribe();

// 2. 及时清理订阅
useEffect(() => {
  return () => {
    subscription.unsubscribe();
  };
}, [roomId]);

// 3. 使用 Presence 跟踪在线状态
const presenceChannel = supabase.channel(`room:${roomId}:presence`, {
  config: {
    presence: {
      key: userId
    }
  }
});
```

## 4. 安全标准

### 4.1 认证与授权

#### Supabase Auth 集成
```typescript
// 匿名认证（无注册登录）
const { data: { session }, error } = await supabase.auth.signInAnonymously();

// 会话管理
const { data: { user } } = await supabase.auth.getUser();

// 权限验证中间件
export async function requireAuth(request: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  return session;
}
```

#### RLS（行级安全）策略
```sql
-- 房间访问策略
CREATE POLICY "rooms_select_by_member_or_public" ON public.rooms
FOR SELECT USING (
  visibility = 'public'
  OR EXISTS (
    SELECT 1 FROM public.room_members m
    WHERE m.room_id = rooms.id AND m.uid = auth.uid()
  )
);

-- 手牌隐私策略
CREATE POLICY "hands_select_self_seat" ON public.game_hands
FOR SELECT USING (
  EXISTS (
    SELECT 1
    FROM public.games g
    JOIN public.room_members m ON m.room_id = g.room_id
    WHERE g.id = game_hands.game_id
    AND m.seat_no = game_hands.seat_no
    AND m.uid = auth.uid()
  )
);
```

### 4.2 输入验证

#### 请求验证
```typescript
import { z } from 'zod';

const createRoomSchema = z.object({
  mode: z.enum(['pvp4', 'pve1v3']),
  visibility: z.enum(['public', 'private']).default('public'),
  maxPlayers: z.number().min(2).max(4).default(4),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = createRoomSchema.parse(body);

    // 处理验证后的数据
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 422 }
      );
    }
    throw error;
  }
}
```

#### SQL 注入防护
- 始终使用参数化查询
- 使用 Supabase RPC 函数处理复杂业务逻辑
- 避免动态 SQL 拼接

### 4.3 数据保护

#### 敏感数据脱敏
```typescript
// 用户信息脱敏
function sanitizeUser(user: User): SanitizedUser {
  return {
    id: user.id,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    // 不返回 email、phone 等敏感信息
  };
}

// 日志脱敏
function sanitizeLog(data: any): any {
  const sensitiveFields = ['password', 'token', 'email', 'phone'];
  const sanitized = { ...data };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '***REDACTED***';
    }
  });

  return sanitized;
}
```

## 5. 错误处理标准

### 5.1 错误分类

#### 业务错误
```typescript
export class BusinessError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
  }
}

// 具体业务错误
export class TurnValidationError extends BusinessError {
  constructor(message: string) {
    super('TURN_VALIDATION_ERROR', message, 422);
  }
}

export class RoomFullError extends BusinessError {
  constructor() {
    super('ROOM_FULL', 'Room is full', 409);
  }
}
```

#### 系统错误
```typescript
export class SystemError extends Error {
  constructor(
    message: string,
    public originalError?: Error,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'SystemError';
  }
}
```

### 5.2 错误处理中间件
```typescript
export async function errorHandler(
  error: Error,
  request: NextRequest
): Promise<NextResponse> {

  // 业务错误
  if (error instanceof BusinessError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          timestamp: new Date().toISOString(),
        }
      },
      { status: error.statusCode }
    );
  }

  // 验证错误
  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Input validation failed',
          details: error.errors,
          timestamp: new Date().toISOString(),
        }
      },
      { status: 422 }
    );
  }

  // 系统错误（生产环境隐藏详情）
  console.error('System error:', error);

  const isProduction = process.env.NODE_ENV === 'production';

  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: isProduction
          ? 'An internal server error occurred'
          : error.message,
        timestamp: new Date().toISOString(),
      }
    },
    { status: 500 }
  );
}
```

### 5.3 重试机制
```typescript
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 100
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      // 非重试错误
      if (error instanceof BusinessError) {
        throw error;
      }

      // 指数退避
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}
```

## 6. 监控与日志标准

### 6.1 结构化日志
```typescript
import { createLogger, format, transports } from 'winston';

const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.json()
  ),
  defaultMeta: {
    service: 'guandan3-backend',
    environment: process.env.NODE_ENV,
  },
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'logs/error.log', level: 'error' }),
    new transports.File({ filename: 'logs/combined.log' }),
  ],
});

// 使用示例
logger.info('Room created', {
  roomId: room.id,
  mode: room.mode,
  userId: user.id,
  timestamp: new Date().toISOString(),
});

logger.error('Failed to submit turn', {
  error: error.message,
  gameId,
  userId,
  stack: error.stack,
});
```

### 6.2 性能监控

#### 关键指标
```typescript
interface PerformanceMetrics {
  // API 响应时间
  apiResponseTime: {
    p50: number;
    p95: number;
    p99: number;
  };

  // 数据库查询性能
  dbQueryPerformance: {
    slowQueries: Array<{
      query: string;
      duration: number;
      calledAt: string;
    }>;
    averageQueryTime: number;
  };

  // 实时通信延迟
  realtimeLatency: {
    publishLatency: number;
    subscribeLatency: number;
  };

  // 系统资源
  systemResources: {
    memoryUsage: number;
    cpuUsage: number;
    activeConnections: number;
  };
}
```

#### Sentry 集成
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,

  beforeSend(event) {
    // 脱敏敏感数据
    if (event.request?.data) {
      event.request.data = sanitizeLog(event.request.data);
    }
    return event;
  },
});

// 错误捕获
try {
  await submitTurn(gameId, action);
} catch (error) {
  Sentry.captureException(error, {
    tags: { gameId, userId },
    extra: { action },
  });
  throw error;
}
```

## 7. 部署与运维标准

### 7.1 环境配置

#### 环境变量管理
```env
# .env.production
NODE_ENV=production
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SENTRY_DSN=your_sentry_dsn
REDIS_URL=redis://localhost:6379
LOG_LEVEL=info

# 性能配置
DATABASE_POOL_SIZE=20
DATABASE_IDLE_TIMEOUT=30000
API_TIMEOUT=30000
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
```

#### 配置验证
```typescript
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SENTRY_DSN: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export const env = envSchema.parse(process.env);
```

### 7.2 健康检查

#### 健康检查端点
```typescript
// /api/health/route.ts
export async function GET() {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    supabase: await checkSupabase(),
    memory: process.memoryUsage(),
    uptime: process.uptime(),
  };

  const isHealthy = Object.values(checks)
    .filter(check => typeof check === 'object' && 'healthy' in check)
    .every(check => check.healthy);

  return NextResponse.json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version,
    checks,
  }, {
    status: isHealthy ? 200 : 503,
  });
}
```

#### 就绪检查
```typescript
// /api/ready/route.ts
export async function GET() {
  const isReady = await checkReadiness();

  return NextResponse.json({
    ready: isReady,
    timestamp: new Date().toISOString(),
  }, {
    status: isReady ? 200 : 503,
  });
}
```

### 7.3 部署策略

#### 零停机部署
```yaml
# fly.toml 配置示例
app = "guandan3"
primary_region = "sin"

[build]
  dockerfile = "Dockerfile"

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = true
  min_machines_running = 1

  [[http_service.checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/api/health"

  [[http_service.checks]]
    interval = "30s"
    timeout = "2s"
    method = "GET"
    path = "/api/ready"
```

#### 回滚策略
```bash
# 回滚到上一个版本
flyctl deploy --image registry.fly.io/guandan3:previous

# 查看部署历史
flyctl releases list

# 回滚到特定版本
flyctl deploy --image registry.fly.io/guandan3:v1.2.3
```

## 8. 测试标准

### 8.1 单元测试
```typescript
// 游戏规则测试
describe('Game Rules', () => {
  test('should validate card combinations', () => {
    const singleCard = [{ suit: 'H', rank: 'A', val: 14 }];
    expect(isValidCombination(singleCard)).toBe(true);

    const invalidPair = [
      { suit: 'H', rank: 'A', val: 14 },
      { suit: 'D', rank: 'K', val: 13 },
    ];
    expect(isValidCombination(invalidPair)).toBe(false);
  });

  test('should compare card combinations', () => {
    const lowerPair = [
      { suit: 'H', rank: '5', val: 5 },
      { suit: 'D', rank: '5', val: 5 },
    ];

    const higherPair = [
      { suit: 'H', rank: '6', val: 6 },
      { suit: 'D', rank: '6', val: 6 },
    ];

    expect(canBeat(lowerPair, higherPair)).toBe(true);
    expect(canBeat(higherPair, lowerPair)).toBe(false);
  });
});
```

### 8.2 集成测试
```typescript
// API 集成测试
describe('Room API', () => {
  test('should create a practice room', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({ mode: 'pve1v3', visibility: 'private' });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.mode).toBe('pve1v3');
  });

  test('should reject invalid room creation', async () => {
    const response = await request(app)
      .post('/api/rooms')
      .send({ mode: 'invalid' });

    expect(response.status).toBe(422);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});
```

### 8.3 性能测试
```javascript
// k6 负载测试
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 }, // 逐步增加到 20 用户
    { duration: '1m', target: 20 },  // 保持 20 用户
    { duration: '30s', target: 0 },  // 逐步减少
  ],
  thresholds: {
    http_req_duration: ['p(95)<100'], // 95% 请求 < 100ms
    http_req_failed: ['rate<0.01'],   // 错误率 < 1%
  },
};

export default function () {
  const res = http.post(
    'https://api.guandan3.com/api/turns',
    JSON.stringify({
      gameId: 'test-game-id',
      actionId: 'test-action-id',
      payload: { cards: [] },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
```

## 9. 代码质量标准

### 9.1 代码组织
```
src/
├── app/
│   ├── api/
│   │   ├── rooms/
│   │   │   ├── route.ts          # 房间相关 API
│   │   │   └── [id]/
│   │   │       └── route.ts      # 特定房间 API
│   │   ├── games/
│   │   │   └── route.ts          # 游戏相关 API
│   │   └── health/
│   │       └── route.ts          # 健康检查
│   └── ...
├── lib/
│   ├── api/
│   │   ├── client.ts             # API 客户端
│   │   ├── errors.ts             # 错误定义
│   │   └── validation.ts         # 验证工具
│   ├── database/
│   │   ├── queries/              # 数据库查询
│   │   ├── migrations/           # 迁移脚本
│   │   └── seeds/                # 种子数据
│   ├── services/
│   │   ├── room.service.ts       # 房间服务
│   │   ├── game.service.ts       # 游戏服务
│   │   └── ai.service.ts         # AI 服务
│   └── utils/
│       ├── logger.ts             # 日志工具
│       ├── cache.ts              # 缓存工具
│       └── metrics.ts            # 指标工具
└── ...
```

### 9.2 TypeScript 规范
```typescript
// 使用严格模式
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}

// 类型定义示例
interface Room {
  id: string;
  ownerId: string;
  mode: 'pvp4' | 'pve1v3';
  status: 'open' | 'playing' | 'finished';
  visibility: 'public' | 'private';
  createdAt: Date;
  updatedAt: Date;
}

type CreateRoomRequest = Pick<Room, 'mode' | 'visibility'>;
type CreateRoomResponse = { data: Room; meta: { message: string } };
```

### 9.3 代码审查清单

#### 安全性审查
- [ ] 输入验证是否完整
- [ ] SQL 注入防护是否到位
- [ ] RLS 策略是否正确
- [ ] 敏感数据是否脱敏
- [ ] 认证授权是否严格

#### 性能审查
- [ ] 数据库查询是否优化
- [ ] N+1 查询是否避免
- [ ] 缓存策略是否合理
- [ ] 内存使用是否高效
- [ ] 实时通信是否优化

#### 可维护性审查
- [ ] 代码结构是否清晰
- [ ] 函数职责是否单一
- [ ] 错误处理是否完整
- [ ] 日志记录是否充分
- [ ] 测试覆盖是否足够

## 10. 持续改进

### 10.1 性能监控与优化
- 每周分析性能指标
- 每月审查慢查询日志
- 每季度进行负载测试
- 根据监控数据优化架构

### 10.2 安全审计
- 每月检查安全漏洞
- 每季度进行渗透测试
- 及时更新依赖包
- 定期审查访问日志

### 10.3 架构演进
- 保持向后兼容性
- 渐进式架构改进
- 技术债务管理
- 容量规划与扩展

---

## 附录

### A. 性能指标基准
| 指标 | 目标值 | 警告阈值 | 严重阈值 |
|------|--------|----------|----------|
| API P95 响应时间 | ≤ 100ms | 150ms | 200ms |
| 数据库查询时间 | ≤ 50ms | 100ms | 200ms |
| 实时推送延迟 | ≤ 60ms | 100ms | 200ms |
| 错误率 | ≤ 0.1% | 0.5% | 1% |
| CPU 使用率 | ≤ 30% | 50% | 70% |
| 内存使用率 | ≤ 50% | 70% | 90% |

### B. 错误代码表
| 错误代码 | 描述 | HTTP 状态码 |
|----------|------|-------------|
| VALIDATION_ERROR | 输入验证失败 | 422 |
| AUTH_REQUIRED | 需要认证 | 401 |
| PERMISSION_DENIED | 权限不足 | 403 |
| RESOURCE_NOT_FOUND | 资源不存在 | 404 |
| ROOM_FULL | 房间已满 | 409 |
| TURN_NO_MISMATCH | 回合号不匹配 | 409 |
| NOT_YOUR_TURN | 不是你的回合 | 409 |
| GAME_FINISHED | 游戏已结束 | 410 |
| RATE_LIMITED | 请求频率限制 | 429 |
| INTERNAL_ERROR | 服务器内部错误 | 500 |

### C. 环境检查清单
- [ ] 数据库连接正常
- [ ] Redis 连接正常
- [ ] Supabase 服务正常
- [ ] 环境变量配置正确
- [ ] 日志系统正常工作
- [ ] 监控系统正常工作
- [ ] 备份系统正常工作
- [ ] 告警系统正常工作

---

*本文档最后更新：2026-03-19*
*版本：1.0.0*