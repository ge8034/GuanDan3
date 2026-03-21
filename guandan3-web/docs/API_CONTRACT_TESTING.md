# GuanDan3 API 契约测试规范

**版本**: v1.0
**创建日期**: 2026-03-19
**负责人**: API 测试团队

---

## 📋 概述

本文档定义了 GuanDan3 API 的契约测试规范，确保所有 API 端点符合设计规格，提供一致的请求/响应模式。

### 测试目标
- 验证 API 端点与文档描述一致
- 确保请求参数验证正确
- 验证响应格式和状态码
- 确保错误处理符合规范
- 验证认证和授权机制

### 测试范围
- 健康检查 API
- 用户管理 API
- 房间管理 API
- 游戏管理 API
- 监控 API
- WebSocket 连接

---

## 🧪 契约测试用例设计

### 1. 健康检查 API

#### 端点: `GET /api/health`

**测试用例 1.1: 正常响应**
```typescript
describe('GET /api/health', () => {
  it('应该返回正确的健康检查响应', async () => {
    // 预期响应
    const expectedResponse = {
      status: 'ok',
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      version: expect.stringMatching(/^\d+\.\d+\.\d+$/)
    };
  });
});
```

**验证点**:
- ✅ HTTP 状态码: 200
- ✅ 响应体包含 `status: 'ok'`
- ✅ 响应体包含 ISO 格式的 `timestamp`
- ✅ 响应体包含语义化版本号的 `version`

### 2. 用户管理 API

#### 端点: `GET /api/user`

**测试用例 2.1: 认证用户获取信息**
```typescript
describe('GET /api/user', () => {
  it('认证用户应该获取自己的信息', async () => {
    // 请求头
    const headers = {
      'Authorization': 'Bearer valid-jwt-token'
    };

    // 预期响应
    const expectedResponse = {
      id: expect.stringMatching(/^[0-9a-f-]+$/),
      email: expect.stringMatching(/^[^@]+@[^@]+\.[^@]+$/),
      nickname: expect.any(String),
      avatar_url: expect.any(String),
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 2.2: 未认证用户访问**
```typescript
describe('GET /api/user', () => {
  it('未认证用户应该返回401', async () => {
    // 预期错误响应
    const expectedError = {
      error: {
        code: 'UNAUTHORIZED',
        message: expect.stringContaining('Invalid or expired token'),
        details: {}
      }
    };
  });
});
```

#### 端点: `PUT /api/user`

**测试用例 2.3: 更新用户信息**
```typescript
describe('PUT /api/user', () => {
  it('应该成功更新用户信息', async () => {
    // 请求体
    const requestBody = {
      nickname: '新昵称',
      avatar_url: 'https://example.com/new-avatar.jpg'
    };

    // 预期响应
    const expectedResponse = {
      id: expect.stringMatching(/^[0-9a-f-]+$/),
      email: expect.stringMatching(/^[^@]+@[^@]+\.[^@]+$/),
      nickname: '新昵称',
      avatar_url: 'https://example.com/new-avatar.jpg',
      updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 2.4: 无效参数验证**
```typescript
describe('PUT /api/user', () => {
  it('无效参数应该返回400', async () => {
    // 无效请求体
    const invalidRequestBody = {
      nickname: '', // 空字符串
      avatar_url: 'invalid-url' // 无效URL
    };

    // 预期错误响应
    const expectedError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('validation'),
        details: expect.any(Object)
      }
    };
  });
});
```

### 3. 房间管理 API

#### 端点: `GET /api/rooms`

**测试用例 3.1: 获取房间列表**
```typescript
describe('GET /api/rooms', () => {
  it('应该返回房间列表', async () => {
    // 查询参数
    const queryParams = {
      mode: 'pvp4',
      visibility: 'public'
    };

    // 预期响应
    const expectedResponse = {
      rooms: expect.arrayContaining([
        expect.objectContaining({
          id: expect.stringMatching(/^[0-9a-f-]+$/),
          name: expect.any(String),
          mode: expect.stringMatching(/^(pvp4|pve1v3)$/),
          visibility: expect.stringMatching(/^(public|private)$/),
          status: expect.stringMatching(/^(open|playing|closed)$/),
          member_count: expect.any(Number),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })
      ]),
      total: expect.any(Number)
    };
  });
});
```

**测试用例 3.2: 分页参数验证**
```typescript
describe('GET /api/rooms', () => {
  it('分页参数应该正确工作', async () => {
    // 分页参数
    const paginationParams = {
      limit: 10,
      offset: 20
    };

    // 验证响应中的房间数量不超过限制
    expect(response.rooms.length).toBeLessThanOrEqual(10);
  });
});
```

#### 端点: `POST /api/rooms`

**测试用例 3.3: 创建房间**
```typescript
describe('POST /api/rooms', () => {
  it('应该成功创建房间', async () => {
    // 请求体
    const requestBody = {
      name: '我的房间',
      mode: 'pvp4',
      visibility: 'public'
    };

    // 预期响应
    const expectedResponse = {
      id: expect.stringMatching(/^[0-9a-f-]+$/),
      name: '我的房间',
      mode: 'pvp4',
      visibility: 'public',
      status: 'open',
      owner_uid: expect.stringMatching(/^[0-9a-f-]+$/),
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 3.4: 创建房间参数验证**
```typescript
describe('POST /api/rooms', () => {
  it('无效模式应该返回400', async () => {
    // 无效请求体
    const invalidRequestBody = {
      mode: 'invalid_mode', // 无效模式
      visibility: 'public'
    };

    // 预期错误响应
    const expectedError = {
      error: {
        code: 'VALIDATION_ERROR',
        message: expect.stringContaining('mode'),
        details: expect.any(Object)
      }
    };
  });
});
```

#### 端点: `POST /api/rooms/{room_id}/join`

**测试用例 3.5: 加入房间**
```typescript
describe('POST /api/rooms/{room_id}/join', () => {
  it('应该成功加入房间', async () => {
    // 预期响应
    const expectedResponse = {
      room_id: expect.stringMatching(/^[0-9a-f-]+$/),
      seat_no: expect.any(Number),
      joined_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 3.6: 加入已满房间**
```typescript
describe('POST /api/rooms/{room_id}/join', () => {
  it('房间已满应该返回400', async () => {
    // 预期错误响应
    const expectedError = {
      error: {
        code: 'ROOM_FULL',
        message: expect.stringContaining('full'),
        details: expect.any(Object)
      }
    };
  });
});
```

#### 端点: `POST /api/rooms/{room_id}/ready`

**测试用例 3.7: 准备游戏**
```typescript
describe('POST /api/rooms/{room_id}/ready', () => {
  it('应该成功标记准备状态', async () => {
    // 请求体
    const requestBody = {
      ready: true
    };

    // 预期响应
    const expectedResponse = {
      room_id: expect.stringMatching(/^[0-9a-f-]+$/),
      uid: expect.stringMatching(/^[0-9a-f-]+$/),
      ready: true,
      updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

#### 端点: `POST /api/rooms/{room_id}/start`

**测试用例 3.8: 开始游戏**
```typescript
describe('POST /api/rooms/{room_id}/start', () => {
  it('房主应该能开始游戏', async () => {
    // 预期响应
    const expectedResponse = {
      game_id: expect.stringMatching(/^[0-9a-f-]+$/),
      room_id: expect.stringMatching(/^[0-9a-f-]+$/),
      status: 'playing',
      started_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 3.9: 非房主开始游戏**
```typescript
describe('POST /api/rooms/{room_id}/start', () => {
  it('非房主应该返回403', async () => {
    // 预期错误响应
    const expectedError = {
      error: {
        code: 'FORBIDDEN',
        message: expect.stringContaining('owner'),
        details: expect.any(Object)
      }
    };
  });
});
```

### 4. 游戏管理 API

#### 端点: `GET /api/games/{game_id}`

**测试用例 4.1: 获取游戏信息**
```typescript
describe('GET /api/games/{game_id}', () => {
  it('应该返回游戏信息', async () => {
    // 预期响应
    const expectedResponse = {
      id: expect.stringMatching(/^[0-9a-f-]+$/),
      room_id: expect.stringMatching(/^[0-9a-f-]+$/),
      status: expect.stringMatching(/^(deal|playing|finished)$/),
      turn_no: expect.any(Number),
      current_seat: expect.any(Number),
      state_public: expect.objectContaining({
        counts: expect.arrayContaining([expect.any(Number)]),
        rankings: expect.any(Array)
      }),
      created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

#### 端点: `POST /api/games/{game_id}/turn`

**测试用例 4.2: 提交回合**
```typescript
describe('POST /api/games/{game_id}/turn', () => {
  it('应该成功提交回合', async () => {
    // 请求体
    const requestBody = {
      action_id: expect.stringMatching(/^[0-9a-f-]+$/),
      expected_turn_no: 5,
      payload: {
        type: 'play',
        cards: ['A', 'K', 'Q']
      }
    };

    // 预期响应
    const expectedResponse = {
      turn_no: 6,
      current_seat: expect.any(Number),
      submitted_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 4.3: 回合号不匹配**
```typescript
describe('POST /api/games/{game_id}/turn', () => {
  it('回合号不匹配应该返回400', async () => {
    // 请求体（错误的回合号）
    const requestBody = {
      action_id: expect.stringMatching(/^[0-9a-f-]+$/),
      expected_turn_no: 5, // 实际是6
      payload: {
        type: 'play',
        cards: ['A', 'K', 'Q']
      }
    };

    // 预期错误响应
    const expectedError = {
      error: {
        code: 'turn_no_mismatch',
        message: expect.stringContaining('turn'),
        details: expect.any(Object)
      }
    };
  });
});
```

**测试用例 4.4: 不是你的回合**
```typescript
describe('POST /api/games/{game_id}/turn', () => {
  it('不是你的回合应该返回400', async () => {
    // 预期错误响应
    const expectedError = {
      error: {
        code: 'NOT_YOUR_TURN',
        message: expect.stringContaining('turn'),
        details: expect.objectContaining({
          current_seat: expect.any(Number),
          your_seat: expect.any(Number)
        })
      }
    };
  });
});
```

#### 端点: `GET /api/games/{game_id}/turns`

**测试用例 4.5: 获取回合历史**
```typescript
describe('GET /api/games/{game_id}/turns', () => {
  it('应该返回回合历史', async () => {
    // 查询参数
    const queryParams = {
      from_turn_no: 0
    };

    // 预期响应
    const expectedResponse = {
      turns: expect.arrayContaining([
        expect.objectContaining({
          turn_no: expect.any(Number),
          seat_no: expect.any(Number),
          payload: expect.objectContaining({
            type: expect.stringMatching(/^(play|pass)$/),
            cards: expect.any(Array)
          }),
          created_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        })
      ]),
      total: expect.any(Number)
    };
  });
});
```

#### 端点: `GET /api/games/{game_id}/hand`

**测试用例 4.6: 获取手牌**
```typescript
describe('GET /api/games/{game_id}/hand', () => {
  it('应该返回当前玩家的手牌', async () => {
    // 预期响应
    const expectedResponse = {
      hand: expect.arrayContaining([expect.any(String)]),
      updated_at: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

### 5. 监控 API

#### 端点: `POST /api/monitoring/analytics`

**测试用例 5.1: 记录分析事件**
```typescript
describe('POST /api/monitoring/analytics', () => {
  it('应该成功记录分析事件', async () => {
    // 请求体
    const requestBody = {
      eventName: 'game_start',
      eventType: 'game',
      page: '/room/abc123',
      userId: expect.stringMatching(/^[0-9a-f-]+$/),
      sessionId: expect.stringMatching(/^[0-9a-f-]+$/),
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/),
      properties: expect.any(Object)
    };

    // 预期响应
    const expectedResponse = {
      success: true,
      data: expect.arrayContaining([
        expect.objectContaining({
          event_name: 'game_start',
          event_type: 'game'
        })
      ])
    };
  });
});
```

#### 端点: `GET /api/monitoring/analytics`

**测试用例 5.2: 获取分析事件**
```typescript
describe('GET /api/monitoring/analytics', () => {
  it('应该返回分析事件', async () => {
    // 查询参数
    const queryParams = {
      eventName: 'game_start',
      eventType: 'game',
      startDate: '2026-03-01',
      endDate: '2026-03-19',
      aggregate: 'daily'
    };

    // 预期响应
    const expectedResponse = {
      data: expect.arrayContaining([
        expect.objectContaining({
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          count: expect.any(Number),
          events: expect.any(Object)
        })
      ]),
      count: expect.any(Number),
      aggregate: 'daily'
    };
  });
});
```

### 6. WebSocket 连接

**测试用例 6.1: WebSocket 连接建立**
```typescript
describe('WebSocket Connection', () => {
  it('应该成功建立WebSocket连接', async () => {
    // 连接建立
    const ws = new WebSocket('wss://guandan3.example.com/ws');

    // 发送认证消息
    const authMessage = {
      type: 'auth',
      token: 'valid-jwt-token'
    };

    // 预期响应
    const expectedResponse = {
      type: 'connected',
      timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    };
  });
});
```

**测试用例 6.2: 房间更新消息**
```typescript
describe('WebSocket Messages', () => {
  it('应该接收房间更新消息', async () => {
    // 预期消息格式
    const expectedMessage = {
      type: 'room_update',
      room_id: expect.stringMatching(/^[0-9a-f-]+$/),
      data: expect.objectContaining({
        member_count: expect.any(Number),
        status: expect.stringMatching(/^(open|playing|closed)$/)
      })
    };
  });
});
```

**测试用例 6.3: 游戏更新消息**
```typescript
describe('WebSocket Messages', () => {
  it('应该接收游戏更新消息', async () => {
    // 预期消息格式
    const expectedMessage = {
      type: 'game_update',
      game_id: expect.stringMatching(/^[0-9a-f-]+$/),
      data: expect.objectContaining({
        turn_no: expect.any(Number),
        current_seat: expect.any(Number),
        last_play: expect.objectContaining({
          seat_no: expect.any(Number),
          cards: expect.any(Array)
        })
      })
    };
  });
});
```

**测试用例 6.4: 聊天消息**
```typescript
describe('WebSocket Messages', () => {
  it('应该接收聊天消息', async () => {
    // 预期消息格式
    const expectedMessage = {
      type: 'chat',
      room_id: expect.stringMatching(/^[0-9a-f-]+$/),
      data: expect.objectContaining({
        uid: expect.stringMatching(/^[0-9a-f-]+$/),
        nickname: expect.any(String),
        message: expect.any(String)
      })
    };
  });
});
```

---

## 🔧 测试工具和环境

### 测试框架
- **契约测试**: Jest + Supertest
- **WebSocket 测试**: Jest + WebSocket client
- **验证库**: Joi 或 Zod 用于模式验证

### 测试环境配置
```typescript
// test-environment.ts
const TEST_CONFIG = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
  wsUrl: process.env.TEST_WS_URL || 'ws://localhost:3000/ws',
  testUser: {
    email: 'test@example.com',
    password: 'test123',
    token: process.env.TEST_USER_TOKEN
  },
  testRoom: {
    id: process.env.TEST_ROOM_ID,
    mode: 'pvp4'
  }
};
```

### 测试数据管理
```typescript
// test-data.ts
export const TEST_DATA = {
  validUser: {
    nickname: '测试用户',
    avatar_url: 'https://example.com/avatar.jpg'
  },
  validRoom: {
    name: '测试房间',
    mode: 'pvp4',
    visibility: 'public'
  },
  validGameTurn: {
    action_id: '123e4567-e89b-12d3-a456-426614174000',
    expected_turn_no: 1,
    payload: {
      type: 'play',
      cards: ['A', 'K', 'Q']
    }
  }
};
```

---

## 📊 测试执行和报告

### 测试执行流程
1. **环境准备**: 启动测试服务器，初始化测试数据
2. **认证测试**: 获取测试用户的 JWT token
3. **契约验证**: 按顺序执行所有契约测试用例
4. **结果收集**: 记录测试结果和失败详情
5. **报告生成**: 生成详细的测试报告

### 测试报告格式
```json
{
  "summary": {
    "totalTests": 50,
    "passed": 48,
    "failed": 2,
    "skipped": 0,
    "passRate": "96%"
  },
  "details": {
    "healthCheck": { "total": 2, "passed": 2, "failed": 0 },
    "userApi": { "total": 8, "passed": 8, "failed": 0 },
    "roomApi": { "total": 15, "passed": 14, "failed": 1 },
    "gameApi": { "total": 15, "passed": 14, "failed": 1 },
    "monitoringApi": { "total": 4, "passed": 4, "failed": 0 },
    "websocket": { "total": 6, "passed": 6, "failed": 0 }
  },
  "failures": [
    {
      "testCase": "POST /api/rooms - 无效模式应该返回400",
      "expected": "VALIDATION_ERROR",
      "actual": "INTERNAL_ERROR",
      "details": "服务器内部错误"
    }
  ]
}
```

### 验收标准
- ✅ 所有契约测试通过率 ≥ 95%
- ✅ 关键 API 端点（认证、房间、游戏）100% 通过
- ✅ 错误处理测试 100% 通过
- ✅ WebSocket 连接测试 100% 通过

---

## 🔄 持续集成

### CI/CD 集成
```yaml
# .github/workflows/api-contract-test.yml
name: API Contract Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  contract-tests:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Start test server
      run: npm run test:server &

    - name: Run contract tests
      run: npm run test:contract
      env:
        TEST_API_URL: http://localhost:3000
        TEST_WS_URL: ws://localhost:3000/ws

    - name: Upload test report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: api-contract-test-report
        path: test-results/api-contract.json
```

### 自动化测试脚本
```json
// package.json
{
  "scripts": {
    "test:contract": "jest tests/contract --coverage",
    "test:contract:watch": "jest tests/contract --watch",
    "test:contract:ci": "jest tests/contract --ci --coverage --reporters=default --reporters=jest-junit",
    "test:server": "next start -p 3000"
  }
}
```

---

## 📝 维护和更新

### 版本控制
- 本文档与 API 版本同步更新
- 每次 API 变更必须更新相应的测试用例
- 测试用例版本号与 API 版本号一致

### 变更管理
1. **API 变更**: 更新 API 参考文档
2. **测试更新**: 更新契约测试用例
3. **验证执行**: 运行所有契约测试
4. **文档更新**: 更新本文档中的测试用例

### 评审流程
- 每次 API 变更需要 API 测试团队评审
- 新增测试用例需要开发团队确认
- 测试结果需要产品团队验收

---

**文档版本**: v1.0
**最后更新**: 2026-03-19
**下次评审**: API v1.1 发布前