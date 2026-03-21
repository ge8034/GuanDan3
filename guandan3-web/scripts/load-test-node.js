const http = require('http');
const https = require('https');

const TARGET_URL = process.env.BASE_URL || 'http://localhost:3000';
const DURATION_MS = 60 * 1000; // 1 minute test
const CONCURRENCY = 20; // Target concurrency

let totalRequests = 0;
let successRequests = 0;
let failRequests = 0;
let totalLatency = 0;
let latencies = [];
let maxLatency = 0;

const agent = new http.Agent({ keepAlive: true });

async function makeRequest() {
  return new Promise((resolve) => {
    const start = Date.now();
    const req = http.get(`${TARGET_URL}/api/health`, { agent }, (res) => {
      res.on('data', () => {}); // Consume body
      res.on('end', () => {
        const duration = Date.now() - start;
        totalRequests++;
        totalLatency += duration;
        latencies.push(duration);
        if (duration > maxLatency) maxLatency = duration;
        
        if (res.statusCode >= 200 && res.statusCode < 300) {
          successRequests++;
        } else {
          failRequests++;
        }
        resolve();
      });
    });
    
    req.on('error', (e) => {
      totalRequests++;
      failRequests++;
      console.error(e.message);
      resolve();
    });
  });
}

function calculatePercentiles(sortedArray, p) {
  const index = Math.floor(sortedArray.length * p);
  return sortedArray[index] || 0;
}

async function worker(stopTime) {
  while (Date.now() < stopTime) {
    await makeRequest();
    // Small sleep to prevent tight loop if request is instant
    await new Promise(r => setTimeout(r, 10));
  }
}

async function run() {
  console.log(`Starting load test against ${TARGET_URL}`);
  console.log(`Concurrency: ${CONCURRENCY}, Duration: ${DURATION_MS}ms`);
  
  const stopTime = Date.now() + DURATION_MS;
  const workers = [];
  
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker(stopTime));
  }
  
  await Promise.all(workers);
  
  const sortedLatencies = latencies.sort((a, b) => a - b);
  const avgLatency = totalLatency / totalRequests;
  const p50 = calculatePercentiles(sortedLatencies, 0.5);
  const p95 = calculatePercentiles(sortedLatencies, 0.95);
  const p99 = calculatePercentiles(sortedLatencies, 0.99);
  const rps = totalRequests / (DURATION_MS / 1000);
  const errorRate = failRequests / totalRequests;
  
  console.log('\n--- Load Test Results ---');
  console.log(`Total Requests: ${totalRequests}`);
  console.log(`Successful: ${successRequests}`);
  console.log(`Failed: ${failRequests}`);
  console.log(`RPS: ${rps.toFixed(2)}`);
  console.log(`Avg Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`P50 Latency: ${p50.toFixed(2)}ms`);
  console.log(`P95 Latency: ${p95.toFixed(2)}ms`);
  console.log(`P99 Latency: ${p99.toFixed(2)}ms`);
  console.log(`Max Latency: ${maxLatency}ms`);
  console.log(`Error Rate: ${(errorRate * 100).toFixed(3)}%`);
  
  // Performance thresholds based on project requirements
  const thresholds = {
    p99: 100, // P99 ≤ 100ms
    errorRate: 0.001, // Error rate < 0.1%
    avgLatency: 50 // Avg latency ≤ 50ms
  };
  
  let failed = false;
  
  if (errorRate > thresholds.errorRate) {
    console.error(`❌ FAILED: Error rate ${(errorRate * 100).toFixed(3)}% > ${(thresholds.errorRate * 100).toFixed(3)}%`);
    failed = true;
  } else {
    console.log(`✅ PASSED: Error rate ${(errorRate * 100).toFixed(3)}% ≤ ${(thresholds.errorRate * 100).toFixed(3)}%`);
  }
  
  if (p99 > thresholds.p99) {
    console.error(`❌ FAILED: P99 latency ${p99.toFixed(2)}ms > ${thresholds.p99}ms`);
    failed = true;
  } else {
    console.log(`✅ PASSED: P99 latency ${p99.toFixed(2)}ms ≤ ${thresholds.p99}ms`);
  }
  
  if (avgLatency > thresholds.avgLatency) {
    console.error(`❌ FAILED: Avg latency ${avgLatency.toFixed(2)}ms > ${thresholds.avgLatency}ms`);
    failed = true;
  } else {
    console.log(`✅ PASSED: Avg latency ${avgLatency.toFixed(2)}ms ≤ ${thresholds.avgLatency}ms`);
  }
  
  if (failed) {
    console.error('\n❌ Performance baseline NOT met.');
    process.exit(1);
  }
  
  console.log('\n✅ Performance baseline met.');
  process.exit(0);
}

run().catch(console.error);
