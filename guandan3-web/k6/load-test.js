import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '30s', target: 10 },   // 30秒内增加到10个用户
    { duration: '1m', target: 10 },    // 保持10个用户1分钟
    { duration: '30s', target: 50 },   // 30秒内增加到50个用户
    { duration: '1m', target: 50 },    // 保持50个用户1分钟
    { duration: '30s', target: 100 },  // 30秒内增加到100个用户
    { duration: '1m', target: 100 },   // 保持100个用户1分钟
    { duration: '30s', target: 0 },    // 30秒内减少到0个用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],  // 95%的请求在500ms内完成
    http_req_failed: ['rate<0.05'],    // 错误率低于5%
    errors: ['rate<0.05'],             // 自定义错误率低于5%
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export default function loadTest() {
  // 测试首页
  let homeRes = http.get(`${BASE_URL}/`);
  check(homeRes, {
    '首页状态码是200': (r) => r.status === 200,
    '首页响应时间<300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  sleep(1);

  // 测试游戏大厅
  let lobbyRes = http.get(`${BASE_URL}/lobby`);
  check(lobbyRes, {
    '游戏大厅状态码是200': (r) => r.status === 200,
    '游戏大厅响应时间<500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // 测试战绩页面
  let historyRes = http.get(`${BASE_URL}/history`);
  check(historyRes, {
    '战绩页面状态码是200': (r) => r.status === 200,
    '战绩页面响应时间<500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  sleep(1);

  // 测试API健康检查
  let healthRes = http.get(`${BASE_URL}/api/health`);
  check(healthRes, {
    '健康检查状态码是200': (r) => r.status === 200,
    '健康检查响应时间<100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  sleep(2);
}

export function handleSummary(data) {
  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
