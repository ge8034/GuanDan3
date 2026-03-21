const { spawnSync } = require('node:child_process')
const fs = require('fs')
const path = require('path')

const BASELINE_DIR = path.join(__dirname, '..', 'performance-baselines')
const BASELINE_FILE = path.join(BASELINE_DIR, `baseline-${Date.now()}.json`)

console.log('🚀 开始建立性能基线...\n')

if (!fs.existsSync(BASELINE_DIR)) {
  fs.mkdirSync(BASELINE_DIR, { recursive: true })
}

const results = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  tests: {}
}

async function runTest(name, command, args) {
  console.log(`📊 运行测试: ${name}`)
  const startTime = Date.now()
  
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env }
  })
  
  const duration = Date.now() - startTime
  
  if (result.status !== 0) {
    console.error(`❌ 测试失败: ${name}`)
    console.error(result.stderr.toString())
    results.tests[name] = {
      status: 'failed',
      duration,
      error: result.stderr.toString()
    }
    return false
  }
  
  console.log(`✅ 测试完成: ${name} (${duration}ms)`)
  results.tests[name] = {
    status: 'passed',
    duration,
    output: result.stdout.toString()
  }
  return true
}

async function main() {
  try {
    const allPassed = await Promise.all([
      runTest('前端性能基线', 'npx', ['playwright', 'test', 'tests/e2e/perf-baseline.spec.ts']),
      runTest('负载测试', 'node', ['scripts/load-test-node.js']),
      runTest('K6 压测', 'npx', ['k6', 'run', '--summary-export=k6-summary.json', 'k6/load-test.js'])
    ])
    
    if (fs.existsSync('k6-summary.json')) {
      const k6Summary = JSON.parse(fs.readFileSync('k6-summary.json', 'utf8'))
      results.tests['k6-summary'] = k6Summary
      fs.unlinkSync('k6-summary.json')
    }
    
    fs.writeFileSync(BASELINE_FILE, JSON.stringify(results, null, 2))
    console.log(`\n📁 性能基线已保存到: ${BASELINE_FILE}`)
    
    const passedCount = Object.values(results.tests).filter(t => t.status === 'passed').length
    const totalCount = Object.keys(results.tests).length
    
    console.log(`\n📈 测试结果: ${passedCount}/${totalCount} 通过`)
    
    if (passedCount === totalCount) {
      console.log('✅ 所有测试通过，性能基线建立成功！')
      process.exit(0)
    } else {
      console.log('⚠️  部分测试失败，请检查日志')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ 建立性能基线时发生错误:', error)
    process.exit(1)
  }
}

main()
