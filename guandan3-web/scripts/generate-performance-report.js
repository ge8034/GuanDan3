const fs = require('fs')
const path = require('path')

const RESULTS_DIR = path.join(__dirname, '..', 'performance-results')
const REPORTS_DIR = path.join(__dirname, '..', 'performance-reports')
const BASELINE_DIR = path.join(__dirname, '..', 'performance-baselines')

console.log('📊 生成性能优化验证报告...\n')

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true })
}

function loadLatestResults() {
  if (!fs.existsSync(RESULTS_DIR)) {
    console.warn('⚠️  未找到性能测试结果目录')
    return null
  }

  const files = fs.readdirSync(RESULTS_DIR)
    .filter(f => f.startsWith('performance-test-') && f.endsWith('.json'))
    .sort()
    .reverse()

  if (files.length === 0) {
    console.warn('⚠️  未找到性能测试结果文件')
    return null
  }

  const latestFile = path.join(RESULTS_DIR, files[0])
  console.log(`📂 加载最新测试结果: ${files[0]}`)
  
  try {
    return JSON.parse(fs.readFileSync(latestFile, 'utf8'))
  } catch (error) {
    console.error('❌ 无法解析测试结果:', error.message)
    return null
  }
}

function loadBaseline() {
  if (!fs.existsSync(BASELINE_DIR)) {
    console.warn('⚠️  未找到性能基线目录')
    return null
  }

  const baselineFile = path.join(BASELINE_DIR, 'latest-baseline.json')
  if (!fs.existsSync(baselineFile)) {
    console.warn('⚠️  未找到性能基线文件')
    return null
  }

  console.log('📂 加载性能基线')
  
  try {
    return JSON.parse(fs.readFileSync(baselineFile, 'utf8'))
  } catch (error) {
    console.error('❌ 无法解析性能基线:', error.message)
    return null
  }
}

function analyzePerformance(results, baseline) {
  const analysis = {
    overall: {
      status: 'unknown',
      score: 0,
      improvements: [],
      degradations: [],
      stable: []
    },
    categories: {
      frontend: { status: 'unknown', score: 0, metrics: {} },
      api: { status: 'unknown', score: 0, metrics: {} },
      network: { status: 'unknown', score: 0, metrics: {} },
      realtime: { status: 'unknown', score: 0, metrics: {} },
      database: { status: 'unknown', score: 0, metrics: {} }
    },
    recommendations: []
  }

  if (!results || !results.tests) {
    return analysis
  }

  const testResults = results.tests
  const baselineTests = baseline?.tests || {}

  for (const [testName, result] of Object.entries(testResults)) {
    const baselineResult = baselineTests[testName]
    
    if (!baselineResult) {
      analysis.overall.stable.push({
        test: testName,
        reason: '无基线数据'
      })
      continue
    }

    if (result.status === 'passed' && baselineResult.status === 'failed') {
      analysis.overall.improvements.push({
        test: testName,
        reason: '从失败变为通过',
        impact: 'high'
      })
    } else if (result.status === 'failed' && baselineResult.status === 'passed') {
      analysis.overall.degradations.push({
        test: testName,
        reason: '从通过变为失败',
        impact: 'high'
      })
    } else if (result.status === 'passed' && baselineResult.status === 'passed') {
      const durationDiff = result.duration - baselineResult.duration
      const percentChange = (durationDiff / baselineResult.duration) * 100
      
      if (Math.abs(percentChange) > 10) {
        if (percentChange > 0) {
          analysis.overall.degradations.push({
            test: testName,
            reason: `性能下降 ${percentChange.toFixed(1)}%`,
            impact: percentChange > 30 ? 'high' : 'medium',
            baselineDuration: baselineResult.duration,
            currentDuration: result.duration
          })
        } else {
          analysis.overall.improvements.push({
            test: testName,
            reason: `性能提升 ${Math.abs(percentChange).toFixed(1)}%`,
            impact: Math.abs(percentChange) > 30 ? 'high' : 'medium',
            baselineDuration: baselineResult.duration,
            currentDuration: result.duration
          })
        }
      } else {
        analysis.overall.stable.push({
          test: testName,
          change: `${percentChange.toFixed(1)}%`
        })
      }
    }
  }

  const score = calculateOverallScore(analysis.overall)
  analysis.overall.score = score
  
  if (score >= 90) {
    analysis.overall.status = 'excellent'
  } else if (score >= 75) {
    analysis.overall.status = 'good'
  } else if (score >= 60) {
    analysis.overall.status = 'fair'
  } else {
    analysis.overall.status = 'poor'
  }

  analysis.recommendations = generateRecommendations(analysis)

  return analysis
}

function calculateOverallScore(overall) {
  let score = 100
  
  overall.degradations.forEach(deg => {
    if (deg.impact === 'high') {
      score -= 20
    } else if (deg.impact === 'medium') {
      score -= 10
    } else {
      score -= 5
    }
  })
  
  overall.improvements.forEach(imp => {
    if (imp.impact === 'high') {
      score += 10
    } else if (imp.impact === 'medium') {
      score += 5
    }
  })
  
  return Math.max(0, Math.min(100, score))
}

function generateRecommendations(analysis) {
  const recommendations = []
  
  const highImpactDegradations = analysis.overall.degradations.filter(d => d.impact === 'high')
  if (highImpactDegradations.length > 0) {
    recommendations.push({
      priority: 'critical',
      category: 'performance',
      message: `${highImpactDegradations.length} 个高优先级性能问题需要立即处理`,
      details: highImpactDegradations.map(d => `- ${d.test}: ${d.reason}`)
    })
  }
  
  const mediumImpactDegradations = analysis.overall.degradations.filter(d => d.impact === 'medium')
  if (mediumImpactDegradations.length > 0) {
    recommendations.push({
      priority: 'high',
      category: 'performance',
      message: `${mediumImpactDegradations.length} 个中优先级性能问题需要优化`,
      details: mediumImpactDegradations.map(d => `- ${d.test}: ${d.reason}`)
    })
  }
  
  if (analysis.overall.improvements.length > 0) {
    recommendations.push({
      priority: 'info',
      category: 'performance',
      message: `${analysis.overall.improvements.length} 个性能指标有所改善`,
      details: analysis.overall.improvements.slice(0, 5).map(d => `- ${d.test}: ${d.reason}`)
    })
  }
  
  if (analysis.overall.status === 'excellent') {
    recommendations.push({
      priority: 'info',
      category: 'quality',
      message: '整体性能表现优秀，继续保持',
      details: []
    })
  } else if (analysis.overall.status === 'good') {
    recommendations.push({
      priority: 'low',
      category: 'optimization',
      message: '整体性能表现良好，可进一步优化',
      details: []
    })
  } else if (analysis.overall.status === 'fair') {
    recommendations.push({
      priority: 'medium',
      category: 'optimization',
      message: '整体性能表现一般，需要关注性能问题',
      details: []
    })
  } else {
    recommendations.push({
      priority: 'critical',
      category: 'quality',
      message: '整体性能表现较差，需要立即优化',
      details: []
    })
  }
  
  return recommendations
}

function generateMarkdownReport(results, baseline, analysis) {
  const timestamp = new Date().toLocaleString('zh-CN')
  
  let markdown = `# 性能优化验证报告

**生成时间**: ${timestamp}
**环境**: ${results?.environment || 'unknown'}
**测试版本**: ${results?.timestamp || 'unknown'}

---

## 执行摘要

### 整体状态

**状态**: ${getStatusBadge(analysis.overall.status)}
**综合评分**: ${analysis.overall.score.toFixed(1)}/100

### 测试结果统计

| 指标 | 数值 |
|------|------|
| 总测试数 | ${results?.summary?.total || 0} |
| 通过数 | ${results?.summary?.passed || 0} |
| 失败数 | ${results?.summary?.failed || 0} |
| 成功率 | ${((results?.summary?.passed / results?.summary?.total) * 100 || 0).toFixed(1)}% |

---

## 性能变化分析

### 改进项 (${analysis.overall.improvements.length})

${analysis.overall.improvements.length > 0 ? 
  analysis.overall.improvements.map(imp => 
    `- **${imp.test}**: ${imp.reason} ${imp.impact ? `(${imp.impact} 优先级)` : ''}`
  ).join('\n') : 
  '无显著改进项'
}

### 下降项 (${analysis.overall.degradations.length})

${analysis.overall.degradations.length > 0 ? 
  analysis.overall.degradations.map(deg => 
    `- **${deg.test}**: ${deg.reason} ${deg.impact ? `(${deg.impact} 优先级)` : ''}`
  ).join('\n') : 
  '无性能下降项'
}

### 稳定项 (${analysis.overall.stable.length})

${analysis.overall.stable.length > 0 ? 
  analysis.overall.stable.slice(0, 10).map(stable => 
    `- **${stable.test}**: ${stable.change || '稳定'}`
  ).join('\n') + (analysis.overall.stable.length > 10 ? '\n... (更多稳定项)' : '') : 
  '无稳定项'
}

---

## 优化建议

${analysis.recommendations.map(rec => `
### ${rec.priority.toUpperCase()} - ${rec.category}

${rec.message}

${rec.details.length > 0 ? rec.details.join('\n') : ''}
`).join('\n')}

---

## 详细测试结果

${Object.entries(results?.tests || {}).map(([name, result]) => `
### ${name}

- **状态**: ${result.status === 'passed' ? '✅ 通过' : '❌ 失败'}
- **耗时**: ${result.duration}ms
${result.error ? `- **错误**: \`\`\`\n${result.error}\n\`\`\`` : ''}
`).join('\n')}

---

## 附录

### 基线信息

- **基线时间**: ${baseline?.timestamp || 'unknown'}
- **基线环境**: ${baseline?.environment || 'unknown'}

### 报告生成

- **生成工具**: 性能优化验证脚本
- **数据来源**: 性能测试结果 + 性能基线
- **报告版本**: 1.0.0

---

*此报告由自动化性能测试系统生成*
`

  return markdown
}

function getStatusBadge(status) {
  const badges = {
    excellent: '🟢 优秀',
    good: '🟡 良好',
    fair: '🟠 一般',
    poor: '🔴 较差',
    unknown: '⚪ 未知'
  }
  return badges[status] || badges.unknown
}

function main() {
  try {
    const results = loadLatestResults()
    const baseline = loadBaseline()
    
    if (!results) {
      console.error('❌ 无法加载测试结果，退出')
      process.exit(1)
    }
    
    const analysis = analyzePerformance(results, baseline)
    
    const markdown = generateMarkdownReport(results, baseline, analysis)
    
    const timestamp = Date.now()
    const reportFile = path.join(REPORTS_DIR, `performance-report-${timestamp}.md`)
    fs.writeFileSync(reportFile, markdown)
    
    console.log(`\n📄 性能报告已生成: ${reportFile}`)
    
    console.log('\n📊 分析摘要:')
    console.log(`  整体状态: ${getStatusBadge(analysis.overall.status)}`)
    console.log(`  综合评分: ${analysis.overall.score.toFixed(1)}/100`)
    console.log(`  改进项: ${analysis.overall.improvements.length}`)
    console.log(`  下降项: ${analysis.overall.degradations.length}`)
    console.log(`  稳定项: ${analysis.overall.stable.length}`)
    
    console.log('\n💡 主要建议:')
    analysis.recommendations.slice(0, 3).forEach(rec => {
      console.log(`  [${rec.priority.toUpperCase()}] ${rec.message}`)
    })
    
    if (analysis.overall.status === 'excellent' || analysis.overall.status === 'good') {
      console.log('\n✅ 性能优化验证通过！')
      process.exit(0)
    } else if (analysis.overall.status === 'fair') {
      console.log('\n⚠️  性能表现一般，建议继续优化')
      process.exit(0)
    } else {
      console.log('\n❌ 性能表现较差，需要立即优化')
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ 生成性能报告时发生错误:', error)
    process.exit(1)
  }
}

main()
