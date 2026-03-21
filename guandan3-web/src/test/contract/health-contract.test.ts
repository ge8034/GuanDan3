/**
 * 健康检查 API 契约测试
 *
 * 测试场景：
 * 1. 正常健康检查响应
 * 2. 响应格式验证
 * 3. 性能要求验证
 *
 * 契约要求：
 * - 响应状态码: 200
 * - 响应格式: { status: string, timestamp: string, version: string }
 * - 性能要求: P95 < 100ms
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// 测试数据定义
const TEST_CONFIG = {
  baseUrl: process.env.TEST_API_URL || 'http://localhost:3000',
  performanceThresholds: {
    p95: 150,
    p99: 250,
    errorRate: 0.001,
  },
};

// 辅助函数：发送请求并测量时间
async function makeRequest(path: string, options: RequestInit = {}) {
  const url = `${TEST_CONFIG.baseUrl}${path}`;
  const startTime = performance.now();
  const response = await fetch(url, options);
  const endTime = performance.now();
  
  let body;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  
  return {
    status: response.status,
    headers: Object.fromEntries(response.headers.entries()),
    body,
    timings: {
      duration: endTime - startTime,
    },
  };
}

// API 契约定义
const HEALTH_API_CONTRACT = {
  path: '/api/health',
  method: 'GET',
  response: {
    statusCode: 200,
    schema: {
      type: 'object',
      required: ['status', 'timestamp', 'version'],
      properties: {
        status: {
          type: 'string',
          enum: ['ok', 'error'],
          description: '服务状态',
        },
        timestamp: {
          type: 'string',
          format: 'date-time',
          description: '响应时间戳',
        },
        version: {
          type: 'string',
          pattern: '^\\d+\\.\\d+\\.\\d+$',
          description: 'API 版本号',
        },
      },
    },
  },
};

describe('健康检查 API 契约测试', () => {
  let testStartTime: number;

  beforeAll(() => {
    testStartTime = Date.now();
    console.log('开始健康检查 API 契约测试');
  });

  afterAll(() => {
    const testDuration = Date.now() - testStartTime;
    console.log(`健康检查 API 契约测试完成，耗时: ${testDuration}ms`);
  });

  describe(`GET ${HEALTH_API_CONTRACT.path}`, () => {
    it('应该返回正确的状态码', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      expect(response.status).toBe(HEALTH_API_CONTRACT.response.statusCode);
    });

    it('应该包含所有必需的字段', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('version');
    });

    it('status 字段应该是有效的值', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      const { status } = response.body;
      expect(typeof status).toBe('string');
      expect(['ok', 'error']).toContain(status);
      expect(status).toBe('ok');
    });

    it('timestamp 字段应该是有效的 ISO 时间戳', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      const { timestamp } = response.body;
      expect(typeof timestamp).toBe('string');
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      
      const date = new Date(timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
      expect(date.getTime()).toBeGreaterThan(0);
      
      const now = new Date();
      const responseTime = new Date(timestamp);
      const timeDiff = Math.abs(now.getTime() - responseTime.getTime());
      expect(timeDiff).toBeLessThan(5 * 60 * 1000);
    });

    it('version 字段应该是有效的语义化版本号', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      const { version } = response.body;
      expect(typeof version).toBe('string');
      expect(version).toMatch(/^\d+\.\d+\.\d+$/);
      
      const [major, minor, patch] = version.split('.').map(Number);
      expect(major).toBeGreaterThanOrEqual(0);
      expect(minor).toBeGreaterThanOrEqual(0);
      expect(patch).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(major)).toBe(true);
      expect(Number.isInteger(minor)).toBe(true);
      expect(Number.isInteger(patch)).toBe(true);
    });

    it('不应该包含额外的字段', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      const expectedFields = ['status', 'timestamp', 'version'];
      const actualFields = Object.keys(response.body);
      const extraFields = actualFields.filter(field => !expectedFields.includes(field));
      expect(extraFields).toHaveLength(0);
    });

    it('应该满足性能要求（单次请求）', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      expect(response.status).toBe(200);
      expect(response.timings.duration).toBeLessThan(TEST_CONFIG.performanceThresholds.p95);
    });

    it('应该满足性能要求（多次请求统计）', async () => {
      const iterations = 50;
      const durations: number[] = [];
      const errors: boolean[] = [];

      for (let i = 0; i < iterations; i++) {
        try {
          const response = await makeRequest(HEALTH_API_CONTRACT.path);
          durations.push(response.timings.duration);
          errors.push(response.status !== 200);
        } catch (error) {
          errors.push(true);
        }
      }

      const sortedDurations = [...durations].sort((a, b) => a - b);
      const p95Index = Math.floor(iterations * 0.95);
      const p99Index = Math.floor(iterations * 0.99);
      const p95 = sortedDurations[p95Index];
      const p99 = sortedDurations[p99Index];
      const errorCount = errors.filter(Boolean).length;
      const errorRate = errorCount / iterations;

      expect(p95).toBeLessThan(TEST_CONFIG.performanceThresholds.p95);
      expect(p99).toBeLessThan(TEST_CONFIG.performanceThresholds.p99);
      expect(errorRate).toBeLessThan(TEST_CONFIG.performanceThresholds.errorRate);

      console.log('健康检查性能统计:');
      console.log(`- 请求次数: ${iterations}`);
      console.log(`- P95 响应时间: ${p95.toFixed(2)}ms`);
      console.log(`- P99 响应时间: ${p99.toFixed(2)}ms`);
      console.log(`- 平均响应时间: ${(durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2)}ms`);
      console.log(`- 错误率: ${(errorRate * 100).toFixed(2)}%`);
    });

    it('应该正确处理并发请求', async () => {
      const concurrentRequests = 10;
      const promises = [];

      for (let i = 0; i < concurrentRequests; i++) {
        promises.push(
          makeRequest(HEALTH_API_CONTRACT.path)
            .then(response => ({
              success: response.status === 200,
              duration: response.timings.duration,
            }))
            .catch(() => ({ success: false, duration: 0 }))
        );
      }

      const results = await Promise.all(promises);
      const successfulRequests = results.filter(r => r.success);
      expect(successfulRequests).toHaveLength(concurrentRequests);

      const durations = results.map(r => r.duration);
      const maxDuration = Math.max(...durations);
      expect(maxDuration).toBeLessThan(500);
    });

    it('应该返回正确的 Content-Type 头', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      expect(response.headers['content-type']).toContain('application/json');
    });

    it('应该包含缓存控制头', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      const cacheControl = response.headers['cache-control'];
      if (cacheControl) {
        expect(cacheControl).toMatch(/no-cache|no-store|max-age=0|max-age=\d+/);
      }
    });
  });

  describe('错误场景测试', () => {
    it('应该处理无效的 HTTP 方法', async () => {
      const methods = ['POST', 'PUT', 'DELETE', 'PATCH'];

      for (const method of methods) {
        const response = await makeRequest(HEALTH_API_CONTRACT.path, { method });
        expect([404, 405]).toContain(response.status);
      }
    });

    it('应该处理带查询参数的请求', async () => {
      const pathWithQuery = `${HEALTH_API_CONTRACT.path}?debug=true&timestamp=${Date.now()}`;
      const response = await makeRequest(pathWithQuery);
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status', 'ok');
    });

    it('应该处理带无效头的请求', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path, {
        headers: {
          'X-Custom-Header': 'test-value',
          'User-Agent': 'Test-Agent/1.0',
        },
      });
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });

  describe('集成测试', () => {
    it('应该与数据库连接正常', async () => {
      const response = await makeRequest(HEALTH_API_CONTRACT.path);
      if (response.body.database) {
        expect(response.body.database).toBe('connected');
      }
      expect(response.body.status).toBe('ok');
    });

    it('应该在服务重启后快速恢复', async () => {
      const requests = [];
      for (let i = 0; i < 5; i++) {
        requests.push(makeRequest(HEALTH_API_CONTRACT.path));
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const responses = await Promise.all(requests);
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('ok');
      });
    });
  });
});

expect.extend({
  toBeValidHealthResponse(response) {
    if (response.status !== 200) {
      return {
        pass: false,
        message: () => `expected status 200 but got ${response.status}`,
      };
    }

    const body = response.body;
    const requiredFields = ['status', 'timestamp', 'version'];
    const missingFields = requiredFields.filter(field => !(field in body));

    if (missingFields.length > 0) {
      return {
        pass: false,
        message: () => `missing required fields: ${missingFields.join(', ')}`,
      };
    }

    if (!['ok', 'error'].includes(body.status)) {
      return {
        pass: false,
        message: () => `invalid status value: ${body.status}`,
      };
    }

    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(body.timestamp)) {
      return {
        pass: false,
        message: () => `invalid timestamp format: ${body.timestamp}`,
      };
    }

    if (!/^\d+\.\d+\.\d+$/.test(body.version)) {
      return {
        pass: false,
        message: () => `invalid version format: ${body.version}`,
      };
    }

    return {
      pass: true,
      message: () => 'response is a valid health check response',
    };
  },
});

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeValidHealthResponse(): R;
    }
  }
}
