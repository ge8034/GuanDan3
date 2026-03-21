const { spawnSync } = require('node:child_process')
const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, '..', 'performance-results')
const BASELINE_FILE = path.join(__dirname, '..', 'performance-baselines', 'latest-baseline.json')

console.log('🚀 开始执行性能测试套件...\n')

if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true })
}

const results = {
  timestamp: new Date().toISOString(),
  environment: process.env.NODE_ENV || 'development',
  tests: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  },
  comparison: null
}

async function runTest(name, command, args, options = {}) {
  console.log(`📊 运行测试: ${name}`)
  const startTime = Date.now()
  
  const result = spawnSync(command, args, {
    stdio: 'pipe',
    shell: true,
    env: { ...process.env },
    ...options
  })
  
  const duration = Date.now() - startTime
  const passed = result.status === 0
  
  results.tests[name] = {
    status: passed ? 'passed' : 'failed',
    duration,
    output: result.stdout?.toString() || '',
    error: result.stderr?.toString() || ''
  }
  
  results.summary.total++
  if (passed) {
    results.summary.passed++
    console.log(`✅ 测试通过: ${name} (${duration}ms)`)
  } else {
    results.summary.failed++
    console.log(`❌ 测试失败: ${name} (${duration}ms)`)
    if (result.stderr) {
      console.error(result.stderr.toString())
    }
  }
  
  return passed
}

function loadBaseline() {
  if (fs.existsSync(BASELINE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(BASELINE_FILE, 'utf8'))
    } catch (error) {
      console.warn('⚠️  无法加载基线数据:', error.message)
      return null
    }
  }
  return null
}

function compareWithBaseline(current, baseline) {
  const comparison = {
    improved: [],
    degraded: [],
    stable: []
  }
  
  for (const [testName, currentResult] of Object.entries(current.tests)) {
    const baselineResult = baseline.tests?.[testName]
    if (!baselineResult) continue
    
    if (baselineResult.status === 'passed' && currentResult.status === 'failed') {
      comparison.degraded.push({
        test: testName,
        reason: '从通过变为失败'
      })
    } else if (baselineResult.status === 'failed' && currentResult.status === 'passed') {
      comparison.improved.push({
        test: testName,
        reason: '从失败变为通过'
      })
    } else if (currentResult.status === 'passed' && baselineResult.status === 'passed') {
      const durationDiff = currentResult.duration - baselineResult.duration
      const percentChange = (durationDiff / baselineResult.duration) * 100
      
      if (Math.abs(percentChange) > 10) {
        if (percentChange > 0) {
          comparison.degraded.push({
            test: testName,
            reason: `性能下降 ${percentChange.toFixed(1)}%`,
            baselineDuration: baselineResult.duration,
            currentDuration: currentResult.duration
          })
        } else {
          comparison.improved.push({
            test: testName,
            reason: `性能提升 ${Math.abs(percentChange).toFixed(1)}%`,
            baselineDuration: baselineResult.duration,
            currentDuration: currentResult.duration
          })
        }
      } else {
        comparison.stable.push({
          test: testName,
          change: `${percentChange.toFixed(1)}%`
        })
      }
    }
  }
  
  return comparison
}

function generateRecommendations(results, comparison) {
  const recommendations = []
  
  if (results.summary.failed > 0) {
    recommendations.push(`${results.summary.failed} 个测试失败，需要立即修复`)
  }
  
  if (comparison && comparison.degraded.length > 0) {
    recommendations.push(`${comparison.degraded.length} 个测试性能下降，需要优化`)
    comparison.degraded.forEach(item => {
      recommendations.push(`  - ${item.test}: ${item.reason}`)
    })
  }
  
  if (results.summary.passed === results.summary.total) {
    recommendations.push('所有测试通过，性能表现良好')
  }
  
  if (comparison && comparison.improved.length > 0) {
    recommendations.push(`${comparison.improved.length} 个测试性能提升`)
  }
  
  return recommendations
}

async function main() {
  try {
    console.log('📋 测试计划:')
    console.log('  1. 前端性能基线测试')
    console.log('  2. Node.js 负载测试')
    console.log('  3. K6 压力测试')
    console.log('  4. 与基线对比分析')
    console.log('')
    
    const baseline = loadBaseline()
    if (baseline) {
      console.log('📊 已加载性能基线进行对比')
    }
    
    await runTest(
      'frontend-baseline',
      'npx',
      ['playwright', 'test', 'tests/e2e/perf-baseline.spec.ts', '--reporter=line']
    )
    
    await runTest(
      'node-load-test',
      'node',
      ['scripts/load-test-node.js']
    )
    
    await runTest(
      'k6-load-test',
      'npx',
      ['k6', 'run', '--summary-export=k6-summary.json', 'k6/load-test.js']
    )
    
    if (fs.existsSync('k6-summary.json')) {
      try {
        const k6Summary = JSON.parse(fs.readFileSync('k6-summary.json', 'utf8'))
        results.tests['k6-summary'] = {
          status: 'passed',
          duration: 0,
          output: JSON.stringify(k6Summary),
          error: ''
        }
        fs.unlinkSync('k6-summary.json')
      } catch (error) {
        console.warn('⚠️  无法解析 K6 摘要:', error.message)
      }
    }
    
    if (baseline) {
      results.comparison = compareWithBaseline(results, baseline)
    }
    
    results.recommendations = generateRecommendations(results, results.comparison)
    
    const timestamp = Date.now()
    const resultsFile = path.join(RESULTS_DIR, `performance-test-${timestamp}.json`)
    fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2))
    
    console.log(`\n📁 测试结果已保存到: ${resultsFile}`)
    
    console.log('\n📈 测试摘要:')
    console.log(`  总测试数: ${results.summary.total}`)
    console.log(`  通过: ${results.summary.passed}`)
    console.log(`  失败: ${results.summary.failed}`)
    console.log(`  成功率: ${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%`)
    
    if (results.comparison) {
      console.log('\n📊 与基线对比:')
      console.log(`  改进: ${results.comparison.improved.length}`)
      console.log(`  下降: ${results.comparison.degraded.length}`)
      console.log(`  稳定: ${results.comparison.stable.length}`)
    }
    
    console.log('\n💡 建议:')
    results.recommendations.forEach(rec => {
      console.log(`  - ${rec}`)
    })
    
    if (results.summary.failed === 0) {
      console.log('\n✅ 所有测试通过，性能验证成功！')
      
      const latestBaselineFile = path.join(
        path.dirname(BASELINE_FILE),
        `baseline-${timestamp}.json`
      )
      fs.copyFileSync(resultsFile, latestBaselineFile)
      
      const latestLink = path.join(path.dirname(BASELINE_FILE), 'latest-baseline.json')
      if (fs.existsSync(latestLink)) {
        fs.unlinkSync(latestLink)
      }
      fs.symlinkSync(path.basename(latestBaselineFile), latestLink)
      
      console.log(`📊 新的性能基线已建立: ${latestBaselineFile}`)
      process.exit(0)
    } else {
      console.log('\n❌ 部分测试失败，请检查日志')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ 执行性能测试时发生错误:', error)
    process.exit(1)
  }
}

main()
