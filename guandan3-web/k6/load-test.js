import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const rpcDuration = new Trend('rpc_duration', true);
const realtimeLatency = new Trend('realtime_latency', true);

export const options = {
  stages: [
    { duration: '30s', target: 4 },    // 30秒内增加到4个活跃玩家
    { duration: '2m', target: 4 },     // 保持4个玩家2分钟
    { duration: '30s', target: 10 },   // 30秒内增加到10个用户（含观战）
    { duration: '2m', target: 10 },    // 保持10个用户2分钟
    { duration: '30s', target: 20 },   // 30秒内增加到20个用户
    { duration: '2m', target: 20 },    // 保持20个用户2分钟
    { duration: '30s', target: 0 },    // 30秒内减少到0个用户
  ],
  thresholds: {
    http_req_duration: ['p(95)<100', 'p(99)<200'],  // P95<100ms, P99<200ms
    http_req_failed: ['rate<0.001'],              // 错误率 < 0.1%
    errors: ['rate<0.001'],                     // 自定义错误率 < 0.1%
    rpc_duration: ['p(95)<100', 'p(99)<100'],   // RPC P99 ≤ 100ms
    realtime_latency: ['p(99)<60'],             // Realtime P99 ≤ 60ms
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

export function setup() {
  console.log(`开始压测，目标URL: ${BASE_URL}`);
  return {
    startTime: Date.now()
  };
}

export default function loadTest(data) {
  const vus = __VU;
  
  if (vus <= 4) {
    simulateActivePlayer();
  } else if (vus <= 10) {
    if (vus % 2 === 0) {
      simulateActivePlayer();
    } else {
      simulateSpectator();
    }
  } else {
    if (vus % 3 === 0) {
      simulateActivePlayer();
    } else {
      simulateSpectator();
    }
  }
  
  sleep(Math.random() * 2 + 1);
}

function simulateActivePlayer() {
  const startTime = Date.now();
  
  let homeRes = http.get(`${BASE_URL}/`, {
    tags: { name: 'home_page' }
  });
  check(homeRes, {
    '首页状态码是200': (r) => r.status === 200,
    '首页响应时间<300ms': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);

  let lobbyRes = http.get(`${BASE_URL}/lobby`, {
    tags: { name: 'lobby_page' }
  });
  check(lobbyRes, {
    '游戏大厅状态码是200': (r) => r.status === 200,
    '游戏大厅响应时间<500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  let healthRes = http.get(`${BASE_URL}/api/health`, {
    tags: { name: 'health_check' }
  });
  check(healthRes, {
    '健康检查状态码是200': (r) => r.status === 200,
    '健康检查响应时间<100ms': (r) => r.timings.duration < 100,
  }) || errorRate.add(1);

  const duration = Date.now() - startTime;
  rpcDuration.add(duration);
}

function simulateSpectator() {
  let historyRes = http.get(`${BASE_URL}/history`, {
    tags: { name: 'history_page' }
  });
  check(historyRes, {
    '战绩页面状态码是200': (r) => r.status === 200,
    '战绩页面响应时间<500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);

  let leaderboardRes = http.get(`${BASE_URL}/leaderboard`, {
    tags: { name: 'leaderboard_page' }
  });
  check(leaderboardRes, {
    '排行榜状态码是200': (r) => r.status === 200,
    '排行榜响应时间<500ms': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
}

export function teardown(data) {
  const duration = Date.now() - data.startTime;
  console.log(`压测完成，总时长: ${duration}ms`);
}

export function handleSummary(data) {
  return {
    'k6-summary.json': JSON.stringify(data, null, 2),
    stdout: textSummary(data, { indent: ' ', enableColors: true }),
  };
}
