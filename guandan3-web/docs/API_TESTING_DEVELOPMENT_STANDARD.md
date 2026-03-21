# API 测试开发标准

**版本**: v1.0
**创建日期**: 2026-03-19
**负责人**: API 测试团队
**适用范围**: 所有 API 测试代码的开发工作

---

## 📋 概述

本文档定义了 GuanDan3 项目的 API 测试开发标准，专注于测试代码的质量、可维护性和有效性。标准涵盖测试代码的组织、编写规范、执行流程和最佳实践。

### 核心原则
1. **测试即代码**：测试代码与生产代码同等重要
2. **可维护性**：测试代码必须易于理解和维护
3. **可重复性**：测试结果必须可重复和可靠
4. **全面性**：测试必须覆盖所有重要场景

---

## 🏗️ 测试代码组织

### 目录结构
```
src/test/
├── unit/                    # 单元测试
│   ├── api/                # API 单元测试
│   │   ├── health.test.ts
│   │   ├── rooms.test.ts
│   │   └── games.test.ts
│   └── utils/              # 工具函数测试
│
├── integration/            # 集成测试
│   ├── api/               # API 集成测试
│   │   ├── auth.test.ts
│   │   └── realtime.test.ts
│   └── database/          # 数据库集成测试
│
├── contract/              # 契约测试
│   ├── health-contract.test.ts
│   ├── rooms-contract.test.ts
│   └── games-contract.test.ts
│
└── e2e/                   # E2E 测试
    ├── api/               # API E2E 测试
    └── websocket/         # WebSocket E2E 测试
```

### 文件命名规范
- 单元测试：`{sourceFile}.test.ts`
- 集成测试：`{feature}-integration.test.ts`
- 契约测试：`{api}-contract.test.ts`
- E2E 测试：`{scenario}.spec.ts`

---

## 📝 测试代码编写规范

### 测试结构
```typescript
// 1. 导入依赖
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { request } from 'supertest';
import { app } from '@/app';

// 2. 测试数据定义
const TEST_DATA = {
  validUser: {
    email: 'test@example.com',
    password: 'test123',
  },
  validRoom: {
    name: '测试房间',
    mode: 'pvp4',
    visibility: 'public',
  },
};

// 3. 测试套件描述
describe('房间管理 API', () => {
  // 4. 测试上下文
  let authToken: string;
  let testRoomId: string;

  // 5. 测试准备和清理
  beforeEach(async () => {
    // 获取认证 token
    const authResponse = await request(app)
      .post('/api/auth/login')
      .send(TEST_DATA.validUser);
    authToken = authResponse.body.token;

    // 创建测试房间
    const roomResponse = await request(app)
      .post('/api/rooms')
      .set('Authorization', `Bearer ${authToken}`)
      .send(TEST_DATA.validRoom);
    testRoomId = roomResponse.body.id;
  });

  afterEach(async () => {
    // 清理测试数据
    if (testRoomId) {
      await request(app)
        .delete(`/api/rooms/${testRoomId}`)
        .set('Authorization', `Bearer ${authToken}`);
    }
  });

  // 6. 测试用例
  describe('GET /api/rooms', () => {
    it('应该返回房间列表', async () => {
      // 准备
      const expectedFields = ['id', 'name', 'mode', 'visibility', 'status'];

      // 执行
      const response = await request(app)
        .get('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`);

      // 验证
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('rooms');
      expect(Array.isArray(response.body.rooms)).toBe(true);

      // 验证每个房间的字段
      if (response.body.rooms.length > 0) {
        const room = response.body.rooms[0];
        expectedFields.forEach(field => {
          expect(room).toHaveProperty(field);
        });
      }
    });

    it('应该支持分页参数', async () => {
      // 准备
      const queryParams = { limit: 5, offset: 0 };

      // 执行
      const response = await request(app)
        .get('/api/rooms')
        .query(queryParams)
        .set('Authorization', `Bearer ${authToken}`);

      // 验证
      expect(response.status).toBe(200);
      expect(response.body.rooms.length).toBeLessThanOrEqual(5);
    });

    it('未认证用户应该返回401', async () => {
      // 执行
      const response = await request(app).get('/api/rooms');

      // 验证
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/rooms', () => {
    it('应该成功创建房间', async () => {
      // 准备
      const newRoom = {
        name: '新测试房间',
        mode: 'pve1v3',
        visibility: 'private',
      };

      // 执行
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newRoom);

      // 验证
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        name: newRoom.name,
        mode: newRoom.mode,
        visibility: newRoom.visibility,
        status: 'open',
      });
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('created_at');
    });

    it('无效参数应该返回400', async () => {
      // 准备
      const invalidRoom = {
        mode: 'invalid_mode', // 无效模式
        visibility: 'public',
      };

      // 执行
      const response = await request(app)
        .post('/api/rooms')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidRoom);

      // 验证
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
```

### 测试用例命名规范
- 使用描述性名称，说明测试场景
- 使用「应该...」格式描述预期行为
- 避免使用技术术语，使用业务语言

**好例子**：
```typescript
it('应该成功创建房间', () => {});
it('无效参数应该返回400', () => {});
it('未认证用户应该返回401', () => {});
```

**坏例子**：
```typescript
it('test create room', () => {}); // 缺少描述性
it('returns 400', () => {}); // 不完整
```

### 断言规范
1. **单一职责**：每个断言验证一个方面
2. **明确预期**：断言消息清晰明确
3. **避免魔法值**：使用常量或配置

```typescript
// 好例子
expect(response.status).toBe(200);
expect(response.body).toHaveProperty('id');
expect(response.body.name).toBe('测试房间');

// 坏例子
expect(response.ok).toBe(true); // 不明确
expect(response.body).toBeDefined(); // 过于宽泛
```

---

## 🔍 测试数据管理

### 测试数据工厂
```typescript
// src/test/factories/room-factory.ts
export const createRoomData = (overrides = {}) => ({
  name: `测试房间-${Date.now()}`,
  mode: 'pvp4',
  visibility: 'public',
  ...overrides,
});

export const createGameTurnData = (overrides = {}) => ({
  action_id: `action-${Date.now()}-${Math.random()}`,
  expected_turn_no: 1,
  payload: {
    type: 'play',
    cards: ['A', 'K', 'Q'],
  },
  ...overrides,
});
```

### 测试数据清理
```typescript
// src/test/utils/test-cleanup.ts
export const cleanupTestData = async (testData: TestData) => {
  try {
    // 按依赖顺序清理
    if (testData.gameId) {
      await deleteGame(testData.gameId);
    }
    if (testData.roomId) {
      await deleteRoom(testData.roomId);
    }
    if (testData.userId) {
      await deleteUser(testData.userId);
    }
  } catch (error) {
    console.warn('测试数据清理失败:', error);
  }
};
```

### 测试数据隔离
```typescript
// 使用唯一标识避免冲突
const uniqueId = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
const testRoomName = `测试房间-${uniqueId}`;
```

---

## 🧪 测试类型规范

### 1. 单元测试规范
```typescript
describe('规则验证函数', () => {
  it('应该验证有效的牌型', () => {
    // 准备
    const validCards = ['A', 'K', 'Q', 'J', '10'];

    // 执行
    const result = validateCardPattern(validCards);

    // 验证
    expect(result.isValid).toBe(true);
    expect(result.pattern).toBe('straight');
  });

  it('应该拒绝无效的牌型', () => {
    // 准备
    const invalidCards = ['A', '2', '3', '4', '6']; // 不连续的顺子

    // 执行
    const result = validateCardPattern(invalidCards);

    // 验证
    expect(result.isValid).toBe(false);
    expect(result.error).toBe('INVALID_STRAIGHT');
  });

  it('应该处理边界情况', () => {
    // 测试空数组
    expect(validateCardPattern([]).isValid).toBe(false);

    // 测试单张牌
    expect(validateCardPattern(['A']).isValid).toBe(true);
  });
});
```

### 2. 集成测试规范
```typescript
describe('房间创建集成测试', () => {
  it('应该创建房间并添加到数据库', async () => {
    // 准备
    const roomData = createRoomData();

    // 执行
    const createResult = await createRoom(roomData);
    const dbResult = await getRoomFromDB(createResult.id);

    // 验证
    expect(createResult.success).toBe(true);
    expect(dbResult).not.toBeNull();
    expect(dbResult.name).toBe(roomData.name);
    expect(dbResult.mode).toBe(roomData.mode);
  });

  it('应该处理数据库错误', async () => {
    // 模拟数据库错误
    jest.spyOn(db, 'insert').mockRejectedValue(new Error('Database error'));

    // 执行
    const result = await createRoom(createRoomData());

    // 验证
    expect(result.success).toBe(false);
    expect(result.error).toContain('Database');
  });
});
```

### 3. 契约测试规范
```typescript
describe('健康检查 API 契约', () => {
  const API_CONTRACT = {
    path: '/api/health',
    method: 'GET',
    response: {
      statusCode: 200,
      schema: {
        type: 'object',
        required: ['status', 'timestamp', 'version'],
        properties: {
          status: { type: 'string', enum: ['ok', 'error'] },
          timestamp: { type: 'string', format: 'date-time' },
          version: { type: 'string', pattern: '^\\d+\\.\\d+\\.\\d+$' },
        },
      },
    },
  };

  it('应该符合 API 契约', async () => {
    // 执行
    const response = await request(app).get(API_CONTRACT.path);

    // 验证状态码
    expect(response.status).toBe(API_CONTRACT.response.statusCode);

    // 验证响应格式
    const body = response.body;
    expect(body).toHaveProperty('status');
    expect(body).toHaveProperty('timestamp');
    expect(body).toHaveProperty('version');

    // 验证数据类型
    expect(typeof body.status).toBe('string');
    expect(['ok', 'error']).toContain(body.status);
    expect(typeof body.timestamp).toBe('string');
    expect(typeof body.version).toBe('string');
    expect(body.version).toMatch(/^\d+\.\d+\.\d+$/);

    // 验证时间戳格式
    expect(() => new Date(body.timestamp)).not.toThrow();
  });
});
```

### 4. 性能测试规范
```typescript
describe('API 性能测试', () => {
  const PERFORMANCE_TARGETS = {
    p95: 100, // 95% 响应时间 < 100ms
    p99: 200, // 99% 响应时间 < 200ms
    errorRate: 0.001, // 错误率 < 0.1%
  };

  it('应该满足性能目标', async () => {
    const results = [];
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      const response = await request(app).get('/api/health');
      const endTime = performance.now();

      results.push({
        duration: endTime - startTime,
        status: response.status,
        success: response.status === 200,
      });
    }

    // 计算百分位
    const durations = results.map(r => r.duration).sort((a, b) => a - b);
    const p95 = durations[Math.floor(iterations * 0.95)];
    const p99 = durations[Math.floor(iterations * 0.99)];

    // 计算错误率
    const errorCount = results.filter(r => !r.success).length;
    const errorRate = errorCount / iterations;

    // 验证性能目标
    expect(p95).toBeLessThan(PERFORMANCE_TARGETS.p95);
    expect(p99).toBeLessThan(PERFORMANCE_TARGETS.p99);
    expect(errorRate).toBeLessThan(PERFORMANCE_TARGETS.errorRate);
  });
});
```

---

## 🛡️ 安全测试规范

### 认证测试
```typescript
describe('API 认证安全', () => {
  it('应该验证 JWT token', async () => {
    // 无效 token
    const invalidToken = 'invalid.jwt.token';
    const response1 = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${invalidToken}`);
    expect(response1.status).toBe(401);

    // 过期 token
    const expiredToken = createExpiredToken();
    const response2 = await request(app)
      .get('/api/user')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(response2.status).toBe(401);

    // 无 token
    const response3 = await request(app).get('/api/user');
    expect(response3.status).toBe(401);
  });

  it('应该防止暴力破解', async () => {
    const loginAttempts = [];
    for (let i = 0; i < 10; i++) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrong_password' });
      loginAttempts.push(response.status);
    }

    // 验证速率限制生效
    const rateLimited = loginAttempts.filter(status => status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 输入验证测试
```typescript
describe('输入验证安全', () => {
  it('应该防止 SQL 注入', async () => {
    const sqlInjectionPayloads = [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
    ];

    for (const payload of sqlInjectionPayloads) {
      const response = await request(app)
        .get(`/api/users?search=${encodeURIComponent(payload)}`);

      // 不应该返回 500 错误或泄露数据库信息
      expect(response.status).not.toBe(500);
      expect(response.text).not.toContain('SQL');
      expect(response.text).not.toContain('syntax');
    }
  });

  it('应该防止 XSS 攻击', async () => {
    const xssPayloads = [
      '<script>alert("xss")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert(1)',
    ];

    for (const payload of xssPayloads) {
      const response = await request(app)
        .post('/api/comments')
        .send({ content: payload });

      // 应该被过滤或拒绝
      expect(response.status).toBe(400);
    }
  });
});
```

---

## 🔄 测试执行和报告

### 测试执行脚本
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration && npm run test:contract",
    "test:unit": "vitest run src/test/unit --coverage",
    "test:integration": "vitest run src/test/integration",
    "test:contract": "vitest run src/test/contract",
    "test:api": "npm run test:unit:api && npm run test:integration:api && npm run test:contract:api",
    "test:unit:api": "vitest run src/test/unit/api",
    "test:integration:api": "vitest run src/test/integration/api",
    "test:contract:api": "vitest run src/test/contract",
    "test:coverage": "npm run test:unit -- --coverage && npm run test:contract -- --coverage",
    "test:ci": "npm run test:unit -- --ci && npm run test:integration -- --ci && npm run test:contract -- --ci"
  }
}
```

### 测试覆盖率要求
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 80,
        statements: 85,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/test/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    },
  },
});
```

### 测试报告格式
```typescript
// 自定义测试报告
interface TestReport {
  summary: {
    timestamp: string;
    duration: string;
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: string;
  };
  byCategory: {
    unit: TestCategoryStats;
    integration: TestCategoryStats;
    contract: TestCategoryStats;
    e2e: TestCategoryStats;
  };
  coverage: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
  failures: TestFailure[];
  recommendations: string[];
}

interface TestCategoryStats {
  total: number;
  passed: number;
  failed: number;
  duration: string;
}

interface TestFailure {
  testCase: string;
  category: string;
  expected: string;
  actual: string;
  details: string;
  severity: 'low' | 'medium' | 'high';
}
```

---

## 🚀 最佳实践

### 1. 测试可维护性
```typescript
// 使用辅助函数减少重复代码
const makeAuthenticatedRequest = (method: string, path: string, data?: any) => {
  return request(app)
    [method](path)
    .set('Authorization', `Bearer ${authToken}`)
    .send(data);
};

// 使用自定义匹配器提高可读性
expect.extend({
  toBeValidRoom(response) {
    const pass =
      response.status === 200 &&
      response.body.id &&
      response.body.name &&
      response.body.mode &&
      response.body.status;

    return {
      pass,
      message: () => `expected response to be a valid room`,
    };
  },
});
```

### 2. 测试性能
```typescript
// 避免不必要的等待
beforeEach(async () => {
  // 并行执行初始化
  await Promise.all([
    initializeDatabase(),
    clearCache(),
    setupTestUsers(),
  ]);
});

// 使用适当的超时
it('应该在超时前完成', async () => {
  const response = await Promise.race([
    request(app).get('/api/slow-endpoint'),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), 5000)
    ),
  ]);

  expect(response.status).toBe(200);
}, 10000); // 10秒超时
```

### 3. 测试可靠性
```typescript
// 测试重试机制
describe('重试逻辑', () => {
  it('应该在失败后重试', async () => {
    let attemptCount = 0;
    const mockService = {
      call: jest.fn(() => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      }),
    };

    const result = await retryWithBackoff(() => mockService.call(), {
      maxAttempts: 3,
      initialDelay: 100,
    });

    expect(result).toBe('success');
    expect(mockService.call).toHaveBeenCalledTimes(3);
  });
});
```

### 4. 测试文档
```typescript
/**
 * 房间创建 API 测试套件
 *
 * 测试场景：
 * 1. 正常创建房间
 * 2. 参数验证失败
 * 3. 认证失败
 * 4. 权限不足
 *
 * 依赖：
 * - 认证服务
 * - 数据库连接
 * - 房间业务逻辑
 *
 * 测试数据：
 * - 测试用户 (test@example.com)
 * - 测试房间模板
 *
 * 清理：
 * - 测试结束后自动删除创建的房间
 */
describe('房间创建 API', () => {
  // 测试代码...
});
```

---

## 📊 质量门禁

### 代码提交前检查
```bash
# 运行所有 API 相关测试
npm run test:api

# 检查测试覆盖率
npm run test:coverage

# 运行代码检查
npm run lint

# 运行类型检查
npm run typecheck
```

### PR 合并要求
1. ✅ 所有测试通过
2. ✅ 测试覆盖率 ≥ 85%
3. ✅ 代码审查通过
4. ✅ 性能测试通过
5. ✅ 安全测试通过

### 部署前验证
```yaml
# GitHub Actions 配置
- name: API 测试
  run: |
    npm run test:api
    npm run test:coverage
    npm run test:performance:api

- name: 验证覆盖率
  run: |
    coverage=$(cat coverage/coverage-summary.json | jq '.total.lines.pct')
    if (( $(echo "$coverage < 85" | bc -l) )); then
      echo "测试覆盖率不足: $coverage%"
      exit 1
    fi
```

---

## 🐛 常见问题解决

### 1. 测试不稳定
```typescript
// 问题：测试结果不一致
// 解决方案：使用固定的测试数据
const stableTestData = {
  roomName: `测试房间-${process.env.TEST_RUN_ID || 'local'}`,
  userId: 'test-user-' + (process.env.TEST_RUN_ID || 'local'),
};

// 解决方案：增加适当的等待
await waitForCondition(async () => {
  const room = await getRoomFromDB(roomId);
  return room.status === 'ready';
}, { timeout: 5000, interval: 100 });
```

### 2. 测试速度慢
```typescript
// 问题：测试执行时间过长
// 解决方案：并行执行独立测试
describe.parallel('独立测试套件', () => {
  it('测试1', async () => { /* 独立测试 */ });
  it('测试2', async () => { /* 独立测试 */ });
});

// 解决方案：重用测试数据
describe('相关测试', () => {
  let sharedData;

  beforeAll(async () => {
    sharedData = await setupSharedTestData();
  });

  it('测试1', () => { /* 使用 sharedData */ });
  it('测试2', () => { /* 使用 sharedData */ });
});
```

### 3. 测试依赖问题
```typescript
// 问题：测试依赖外部服务
// 解决方案：使用模拟
jest.mock('@/lib/api/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({
            data: mockRoomData,
            error: null,
          })),
        })),
      })),
    })),
  },
}));

// 解决方案：使用测试数据库
const testDbConfig = {
  ...productionDbConfig,
  database: 'test_database',
  pool: { max: 1 }, // 限制连接数
};
```

---

## 📚 相关资源

### 参考文档
1. [API 参考文档](./API_REFERENCE.md)
2. [API 契约测试规范](./API_CONTRACT_TESTING.md)
3. [性能测试标准](./PERFORMANCE_TESTING_STANDARD.md)
4. [测试计划](./TEST_PLAN.md)

### 工具文档
1. [Vitest 文档](https://vitest.dev/)
2. [Supertest 文档](https://github.com/ladjs/supertest)
3. [Jest 文档](https://jestjs.io/)
4. [Playwright 文档](https://playwright.dev/)

### 模板和示例
```bash
# 生成测试模板
npx @guandan3/cli generate:test --type api --name rooms

# 运行特定测试
npm run test:api -- --grep "房间创建"

# 调试测试
npm run test:api -- --inspect-brk
```

---

**文档版本**: v1.0
**最后更新**: 2026-03-19
**下次评审**: 2026-04-19
**维护团队**: API 测试团队