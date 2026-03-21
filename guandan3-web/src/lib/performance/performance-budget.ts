export interface PerformanceBudget {
  name: string
  type: 'javascript' | 'css' | 'image' | 'font' | 'total'
  maxSize: number
  warningThreshold: number
  criticalThreshold: number
}

export interface BudgetResult {
  budget: PerformanceBudget
  actualSize: number
  status: 'pass' | 'warning' | 'critical' | 'fail'
  percentage: number
  overage: number
}

export interface BundleAnalysis {
  name: string
  size: number
  gzipSize: number
  modules: number
  dependencies: string[]
}

export interface PerformanceBudgetReport {
  timestamp: number
  budgets: BudgetResult[]
  bundleAnalysis: BundleAnalysis[]
  summary: {
    total: number
    passed: number
    warning: number
    critical: number
    failed: number
  }
  recommendations: string[]
}

class PerformanceBudgetManager {
  private budgets: PerformanceBudget[] = []
  private bundleAnalysis: BundleAnalysis[] = []

  constructor() {
    this.initializeDefaultBudgets()
  }

  private initializeDefaultBudgets() {
    this.budgets = [
      {
        name: 'main-javascript',
        type: 'javascript',
        maxSize: 244 * 1024,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      },
      {
        name: 'vendor-javascript',
        type: 'javascript',
        maxSize: 244 * 1024,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      },
      {
        name: 'main-css',
        type: 'css',
        maxSize: 50 * 1024,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      },
      {
        name: 'total-javascript',
        type: 'javascript',
        maxSize: 500 * 1024,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      },
      {
        name: 'total-css',
        type: 'css',
        maxSize: 100 * 1024,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      },
      {
        name: 'total-bundle',
        type: 'total',
        maxSize: 600 * 1024,
        warningThreshold: 0.8,
        criticalThreshold: 0.95
      }
    ]
  }

  addBudget(budget: PerformanceBudget) {
    this.budgets.push(budget)
  }

  removeBudget(name: string) {
    this.budgets = this.budgets.filter(b => b.name !== name)
  }

  updateBudget(name: string, updates: Partial<PerformanceBudget>) {
    const index = this.budgets.findIndex(b => b.name === name)
    if (index !== -1) {
      this.budgets[index] = { ...this.budgets[index], ...updates }
    }
  }

  checkBudget(name: string, actualSize: number): BudgetResult {
    const budget = this.budgets.find(b => b.name === name)
    if (!budget) {
      throw new Error(`Budget ${name} not found`)
    }

    const percentage = actualSize / budget.maxSize
    const overage = Math.max(0, actualSize - budget.maxSize)

    let status: BudgetResult['status'] = 'pass'
    if (percentage >= budget.criticalThreshold) {
      status = 'critical'
    } else if (percentage >= 1) {
      status = 'fail'
    } else if (percentage >= budget.warningThreshold) {
      status = 'warning'
    }

    return {
      budget,
      actualSize,
      status,
      percentage,
      overage
    }
  }

  checkAllBudgets(actualSizes: Record<string, number>): BudgetResult[] {
    return this.budgets.map(budget => {
      const actualSize = actualSizes[budget.name] || 0
      return this.checkBudget(budget.name, actualSize)
    })
  }

  setBundleAnalysis(analysis: BundleAnalysis[]) {
    this.bundleAnalysis = analysis
  }

  generateReport(actualSizes: Record<string, number>): PerformanceBudgetReport {
    const budgetResults = this.checkAllBudgets(actualSizes)

    const summary = {
      total: budgetResults.length,
      passed: budgetResults.filter(r => r.status === 'pass').length,
      warning: budgetResults.filter(r => r.status === 'warning').length,
      critical: budgetResults.filter(r => r.status === 'critical').length,
      failed: budgetResults.filter(r => r.status === 'fail').length
    }

    return {
      timestamp: Date.now(),
      budgets: budgetResults,
      bundleAnalysis: this.bundleAnalysis,
      summary,
      recommendations: this.generateRecommendations(budgetResults)
    }
  }

  private generateRecommendations(results: BudgetResult[]): string[] {
    const recommendations: string[] = []

    const failedBudgets = results.filter(r => r.status === 'fail' || r.status === 'critical')
    if (failedBudgets.length > 0) {
      failedBudgets.forEach(result => {
        recommendations.push(
          `${result.budget.name} 超出预算 ${((result.percentage - 1) * 100).toFixed(1)}% ` +
          `(${this.formatBytes(result.actualSize)} / ${this.formatBytes(result.budget.maxSize)})`
        )
      })
    }

    const warningBudgets = results.filter(r => r.status === 'warning')
    if (warningBudgets.length > 0) {
      warningBudgets.forEach(result => {
        recommendations.push(
          `${result.budget.name} 接近预算限制 (${(result.percentage * 100).toFixed(1)}%)`
        )
      })
    }

    const largeBundles = this.bundleAnalysis.filter(b => b.size > 200 * 1024)
    if (largeBundles.length > 0) {
      largeBundles.forEach(bundle => {
        recommendations.push(
          `${bundle.name} 包过大 (${this.formatBytes(bundle.size)})，建议代码分割和懒加载`
        )
      })
    }

    const highDependencyBundles = this.bundleAnalysis.filter(b => b.dependencies.length > 50)
    if (highDependencyBundles.length > 0) {
      highDependencyBundles.forEach(bundle => {
        recommendations.push(
          `${bundle.name} 依赖过多 (${bundle.dependencies.length}个)，建议优化依赖树`
        )
      })
    }

    return recommendations
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  getBudgets(): PerformanceBudget[] {
    return [...this.budgets]
  }

  getBundleAnalysis(): BundleAnalysis[] {
    return [...this.bundleAnalysis]
  }

  exportReport(report: PerformanceBudgetReport): string {
    return JSON.stringify(report, null, 2)
  }

  reset() {
    this.initializeDefaultBudgets()
    this.bundleAnalysis = []
  }
}

export const performanceBudgetManager = new PerformanceBudgetManager()

export function checkPerformanceBudget(name: string, actualSize: number): BudgetResult {
  return performanceBudgetManager.checkBudget(name, actualSize)
}

export function generatePerformanceBudgetReport(
  actualSizes: Record<string, number>
): PerformanceBudgetReport {
  return performanceBudgetManager.generateReport(actualSizes)
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

export function createPerformanceBudgetConfig() {
  return {
    budgets: performanceBudgetManager.getBudgets(),
    thresholds: {
      warning: 0.8,
      critical: 0.95
    },
    recommendations: {
      maxBundleSize: 244 * 1024,
      maxTotalSize: 600 * 1024,
      maxDependencies: 50
    }
  }
}
