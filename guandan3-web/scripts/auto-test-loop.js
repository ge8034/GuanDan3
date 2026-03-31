#!/usr/bin/env node

/**
 * 自动测试循环脚本
 *
 * 功能：
 * 1. 运行完整测试集并捕捉所有故障
 * 2. 分析失败测试的堆栈跟踪和代码
 * 3. 自动修复或生成修复建议
 * 4. 重新运行测试
 * 5. 最多5次迭代
 * 6. 生成最终报告
 *
 * 用法:
 * node scripts/auto-test-loop.js
 * node scripts/auto-test-loop.js --max-iterations 3
 * node scripts/auto-test-loop.js --test-type unit
 * node scripts/auto-test-loop.js --test-type e2e --max-iterations 5
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// 配置
const CONFIG = {
  maxIterations: parseInt(process.argv.find(a => a.startsWith('--max-iterations'))?.split('=')[1]) || 5,
  testType: process.argv.find(a => a.startsWith('--test-type'))?.split('=')[1] || 'all',
  outputDir: path.join(__dirname, '..', 'test-reports'),
  autoFix: !process.argv.includes('--no-fix'),
}

// 结果存储
let results = {
  iterations: [],
  totalTestsFixed: 0,
  totalTestsFailed: 0,
  startTime: null,
  endTime: null,
}

/**
 * 创建输出目录
 */
function ensureOutputDir() {
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true })
  }
}

/**
 * 执行命令并返回结果
 */
function execCommand(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf-8',
      stdio: 'pipe',
      ...options,
    })
    return { success: true, output, error: null }
  } catch (error) {
    return { success: false, output: error.stdout || '', error: error.stderr || error.message }
  }
}

/**
 * 运行测试套件
 */
function runTests(testType = 'all') {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`🧪 运行测试套件: ${testType}`)
  console.log('='.repeat(60))

  let command
  switch (testType) {
    case 'unit':
      command = 'npm run test -- --run --reporter=json 2>&1'
      break
    case 'e2e':
      command = 'npm run test:e2e -- --reporter=json 2>&1'
      break
    case 'typecheck':
      command = 'npx tsc --noEmit 2>&1'
      break
    case 'all':
    default:
      // 运行所有测试
      return {
        unit: execCommand('npm run test -- --run --reporter=json 2>&1'),
        e2e: execCommand('npm run test:e2e -- --reporter=json 2>&1'),
        typecheck: execCommand('npx tsc --noEmit 2>&1'),
      }
  }

  return execCommand(command)
}

/**
 * 解析测试结果
 */
function parseTestResults(rawOutput) {
  const failures = []

  if (!rawOutput) return failures

  // 解析 JSON 输出
  try {
    const jsonMatch = rawOutput.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const data = JSON.parse(jsonMatch[0])
      if (data.testResults) {
        for (const testFile of data.testResults) {
          for (const assertion of testFile.assertionResults) {
            if (assertion.status === 'failed') {
              failures.push({
                file: testFile.name,
                test: assertion.title,
                error: assertion.error?.message || '未知错误',
                stack: assertion.error?.stack || '',
              })
            }
          }
        }
      }
    }
  } catch (e) {
    // 如果无法解析 JSON，使用正则表达式提取失败信息
    const failMatches = rawOutput.matchAll(/FAIL\s+(.+?)\n/g) || []
    for (const match of failMatches) {
      failures.push({
        file: match[1],
        test: '未知',
        error: '解析失败',
        stack: rawOutput.substring(rawOutput.indexOf(match[1]), rawOutput.indexOf(match[1]) + 500),
      })
    }
  }

  return failures
}

/**
 * 解析类型检查错误
 */
function parseTypecheckErrors(rawOutput) {
  const errors = []

  if (!rawOutput) return errors

  const lines = rawOutput.split('\n')
  for (const line of lines) {
    if (line.includes('.ts') && line.includes('error TS')) {
      const parts = line.split(':')
      if (parts.length >= 3) {
        errors.push({
          file: parts[0].trim(),
          line: parts[1].trim(),
          column: parts[2].trim(),
          message: parts.slice(3).join(':').trim(),
        })
      }
    }
  }

  return errors
}

/**
 * 分析失败测试
 */
function analyzeFailure(failure) {
  console.log(`\n📋 分析失败: ${failure.file}`)
  console.log(`   测试: ${failure.test}`)
  console.log(`   错误: ${failure.error}`)

  // 读取相关代码
  const filePath = failure.file.replace(process.cwd(), '').replace(/^\//, '')
  const fullPath = path.join(process.cwd(), filePath)

  let codeSnippet = ''
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8')
    const lines = content.split('\n')

    // 尝试从堆栈中提取行号
    const lineMatch = failure.stack.match(/:(\d+):(\d+)/)
    if (lineMatch) {
      const errorLine = parseInt(lineMatch[1]) - 1
      const startLine = Math.max(0, errorLine - 5)
      const endLine = Math.min(lines.length, errorLine + 6)
      codeSnippet = lines.slice(startLine, endLine).map((l, i) => {
        const prefix = i + startLine === errorLine ? '>>> ' : '    '
        return `${prefix}${startLine + i + 1}: ${l}`
      }).join('\n')
    }
  }

  return {
    ...failure,
    codeSnippet,
    suggestedFix: generateSuggestedFix(failure),
  }
}

/**
 * 生成修复建议
 */
function generateSuggestedFix(failure) {
  const error = failure.error.toLowerCase()

  // 常见错误模式
  const patterns = [
    {
      pattern: /cannot read|undefined|null/i,
      fix: '检查变量是否已正确初始化，添加空值检查',
    },
    {
      pattern: /type.*is not assignable/i,
      fix: '检查类型定义，确保类型匹配',
    },
    {
      pattern: /property.*does not exist/i,
      fix: '检查对象类型定义，添加缺失的属性',
    },
    {
      pattern: /expected.*found/i,
      fix: '检查期望值和实际值，修正测试或实现',
    },
    {
      pattern: /timeout/i,
      fix: '增加测试超时时间或检查异步操作',
    },
    {
      pattern: /cannot find module/i,
      fix: '检查导入路径，安装缺失的依赖',
    },
  ]

  for (const { pattern, fix } of patterns) {
    if (pattern.test(error)) {
      return fix
    }
  }

  return '需要人工分析'
}

/**
 * 应用修复
 */
function applyFix(analyzedFailure) {
  console.log(`\n🔧 修复建议: ${analyzedFailure.suggestedFix}`)

  if (!CONFIG.autoFix) {
    console.log('   (自动修复已禁用，跳过)')
    return { success: false, message: '自动修复已禁用' }
  }

  // 对于简单的修复，尝试自动应用
  // 对于复杂的修复，记录到待办列表

  return { success: false, message: '需要人工修复', analyzedFailure }
}

/**
 * 生成迭代报告
 */
function generateIterationReport(iteration, testResults, fixesApplied) {
  const timestamp = new Date().toISOString()
  const reportFile = path.join(CONFIG.outputDir, `iteration-${iteration}-${timestamp.replace(/[:.]/g, '-')}.json`)

  const report = {
    iteration,
    timestamp,
    testResults,
    fixesApplied,
    summary: {
      total: testResults.unit?.output?.split('it(')?.length || 0,
      passed: 0,
      failed: fixesApplied.length,
    },
  }

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))
  console.log(`\n📄 报告已保存: ${reportFile}`)

  return report
}

/**
 * 生成最终报告
 */
function generateFinalReport() {
  console.log(`\n${'='.repeat(60)}`)
  console.log('📊 最终报告')
  console.log('='.repeat(60))

  const reportFile = path.join(CONFIG.outputDir, `final-report-${Date.now()}.json`)

  // 统计最终测试结果
  const finalTestResults = runTests(CONFIG.testType)

  const report = {
    config: CONFIG,
    results: {
      startTime: results.startTime,
      endTime: new Date().toISOString(),
      totalIterations: results.iterations.length,
      totalTestsFixed: results.totalTestsFixed,
      totalTestsFailed: results.totalTestsFailed,
      finalTestResults: {
        unit: parseTestResults(finalTestResults.unit?.output || ''),
        e2e: parseTestResults(finalTestResults.e2e?.output || ''),
        typecheck: parseTypecheckErrors(finalTestResults.typecheck?.output || ''),
      },
    },
    iterations: results.iterations,
    summary: generateSummary(),
  }

  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2))

  // 打印摘要
  console.log(`\n总迭代次数: ${results.totalIterations}`)
  console.log(`已修复测试: ${results.totalTestsFixed}`)
  console.log(`失败测试: ${results.totalTestsFailed}`)
  console.log(`\n最终测试结果:`)
  console.log(`  单元测试: ${report.results.finalTestResults.unit.length} 失败`)
  console.log(`  E2E 测试: ${report.results.finalTestResults.e2e.length} 失败`)
  console.log(`  类型检查: ${report.results.finalTestResults.typecheck.length} 错误`)
  console.log(`\n📄 完整报告: ${reportFile}`)

  return report
}

/**
 * 生成摘要
 */
function generateSummary() {
  return {
    passRate: results.totalTestsFixed / Math.max(1, results.totalTestsFixed + results.totalTestsFailed) * 100,
    status: results.totalTestsFailed === 0 ? 'SUCCESS' : 'PARTIAL',
    recommendations: generateRecommendations(),
  }
}

/**
 * 生成建议
 */
function generateRecommendations() {
  const recommendations = []

  if (results.totalTestsFailed > 0) {
    recommendations.push('仍有失败测试需要人工修复')
  }

  if (results.iterations.length >= CONFIG.maxIterations) {
    recommendations.push('已达到最大迭代次数')
  }

  return recommendations
}

/**
 * 主循环
 */
async function main() {
  console.log('\n🚀 自动测试循环启动')
  console.log(`   配置: 最大迭代=${CONFIG.maxIterations}, 测试类型=${CONFIG.testType}, 自动修复=${CONFIG.autoFix}`)

  ensureOutputDir()
  results.startTime = new Date().toISOString()

  let previousFailures = new Set()

  for (let iteration = 1; iteration <= CONFIG.maxIterations; iteration++) {
    console.log(`\n${'='.repeat(60)}`)
    console.log(`📍 迭代 ${iteration}/${CONFIG.maxIterations}`)
    console.log('='.repeat(60))

    // 1. 运行测试
    const testResults = runTests(CONFIG.testType)

    // 2. 解析失败
    const failures = {
      unit: parseTestResults(testResults.unit?.output || ''),
      e2e: parseTestResults(testResults.e2e?.output || ''),
      typecheck: parseTypecheckErrors(testResults.typecheck?.output || ''),
    }

    const allFailures = [...failures.unit, ...failures.e2e, ...failures.typecheck]
    const uniqueFailures = allFailures.filter(f => !previousFailures.has(f.file + f.test))

    console.log(`\n📈 测试结果:`)
    console.log(`   单元测试失败: ${failures.unit.length}`)
    console.log(`   E2E 测试失败: ${failures.e2e.length}`)
    console.log(`   类型检查错误: ${failures.typecheck.length}`)

    if (allFailures.length === 0) {
      console.log(`\n✅ 所有测试通过！`)
      results.totalTestsFailed = 0
      break
    }

    results.totalTestsFailed = allFailures.length

    // 3. 分析并尝试修复
    const fixesApplied = []

    for (const failure of uniqueFailures) {
      const analyzed = analyzeFailure(failure)
      const fixResult = applyFix(analyzed)

      if (fixResult.success) {
        fixesApplied.push(fixResult)
        results.totalTestsFixed++
        previousFailures.add(failure.file + failure.test)
      }
    }

    // 4. 生成迭代报告
    const iterationReport = generateIterationReport(iteration, testResults, fixesApplied)
    results.iterations.push(iterationReport)

    // 检查是否还有新的失败
    if (uniqueFailures.length === 0 && allFailures.length > 0) {
      console.log(`\n⚠️  所有失败测试都已尝试修复，但仍未通过`)
      break
    }
  }

  // 5. 生成最终报告
  const finalReport = generateFinalReport()

  process.exit(finalReport.results.finalTestResults.unit.length === 0 &&
                finalReport.results.finalTestResults.e2e.length === 0 &&
                finalReport.results.finalTestResults.typecheck.length === 0 ? 0 : 1)
}

// 运行
main().catch(error => {
  console.error('错误:', error)
  process.exit(1)
})
