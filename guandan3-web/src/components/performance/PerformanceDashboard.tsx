'use client'

import { useState, useEffect } from 'react'
import Card, { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  Activity, 
  Database, 
  Network, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw
} from 'lucide-react'
import { getWebVitals, getPerformanceReport } from '@/lib/performance/performance-monitor'
import { getAPIPerformanceReport } from '@/lib/performance/api-performance'
import { getRealtimePerformanceReport } from '@/lib/performance/realtime-optimizer'
import { getDatabasePerformanceReport } from '@/lib/performance/database-optimizer'
import { generatePerformanceBudgetReport } from '@/lib/performance/performance-budget'

import { logger } from '@/lib/utils/logger'
interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  status: 'good' | 'warning' | 'critical'
  trend?: 'up' | 'down' | 'stable'
  icon: React.ReactNode
}

function MetricCard({ title, value, unit, status, trend, icon }: MetricCardProps) {
  const statusColors = {
    good: 'text-green-600 bg-green-50',
    warning: 'text-yellow-600 bg-yellow-50',
    critical: 'text-red-600 bg-red-50'
  }

  const trendIcon = trend === 'up' ? <TrendingUp className="w-4 h-4" /> :
                     trend === 'down' ? <TrendingDown className="w-4 h-4" /> : null

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={statusColors[status]}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {unit && <div className="text-sm text-muted-foreground">{unit}</div>}
          {trendIcon && <div className="text-sm text-muted-foreground">{trendIcon}</div>}
        </div>
      </CardContent>
    </Card>
  )
}

export function PerformanceDashboard() {
  const [webVitals, setWebVitals] = useState<any>(null)
  const [apiReport, setApiReport] = useState<any>(null)
  const [realtimeReport, setRealtimeReport] = useState<any>(null)
  const [dbReport, setDbReport] = useState<any>(null)
  const [budgetReport, setBudgetReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())

  const refreshData = async () => {
    setLoading(true)
    try {
      const [vitals, api, realtime, db, budget] = await Promise.all([
        Promise.resolve(getWebVitals()),
        Promise.resolve(getAPIPerformanceReport()),
        Promise.resolve(getRealtimePerformanceReport()),
        Promise.resolve(getDatabasePerformanceReport()),
        Promise.resolve(generatePerformanceBudgetReport({}))
      ])

      setWebVitals(vitals)
      setApiReport(api)
      setRealtimeReport(realtime)
      setDbReport(db)
      setBudgetReport(budget)
      setLastUpdate(new Date())
    } catch (error) {
      logger.error('Failed to fetch performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 30000)
    return () => clearInterval(interval)
  }, [])

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      webVitals,
      apiReport,
      realtimeReport,
      dbReport,
      budgetReport
    }
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-report-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading && !webVitals) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">性能监控仪表板</h2>
          <p className="text-muted-foreground">
            最后更新: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出报告
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="web-vitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="api">API 性能</TabsTrigger>
          <TabsTrigger value="realtime">Realtime</TabsTrigger>
          <TabsTrigger value="database">数据库</TabsTrigger>
          <TabsTrigger value="budget">性能预算</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="FCP"
              value={webVitals?.fcp?.toFixed(0) || 'N/A'}
              unit="ms"
              status={webVitals?.fcp < 2000 ? 'good' : webVitals?.fcp < 2500 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              title="LCP"
              value={webVitals?.lcp?.toFixed(0) || 'N/A'}
              unit="ms"
              status={webVitals?.lcp < 2500 ? 'good' : webVitals?.lcp < 4000 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              title="CLS"
              value={webVitals?.cls?.toFixed(3) || 'N/A'}
              status={webVitals?.cls < 0.1 ? 'good' : webVitals?.cls < 0.25 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              title="API 平均延迟"
              value={apiReport?.summary?.averageDuration?.toFixed(0) || 'N/A'}
              unit="ms"
              status={apiReport?.summary?.averageDuration < 200 ? 'good' : apiReport?.summary?.averageDuration < 500 ? 'warning' : 'critical'}
              icon={<Network className="w-4 h-4" />}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>性能建议</CardTitle>
                <CardDescription>基于当前性能数据的优化建议</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {apiReport?.recommendations?.slice(0, 3).map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
                {(!apiReport?.recommendations || apiReport.recommendations.length === 0) && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>所有性能指标正常</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>系统状态</CardTitle>
                <CardDescription>各子系统运行状态</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">API 服务</span>
                  <Badge variant={apiReport?.summary?.errorRate < 0.01 ? 'success' : 'error'}>
                    {apiReport?.summary?.errorRate < 0.01 ? '正常' : '异常'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Realtime 连接</span>
                  <Badge variant={realtimeReport?.metrics?.errorRate < 0.05 ? 'success' : 'error'}>
                    {realtimeReport?.metrics?.errorRate < 0.05 ? '正常' : '异常'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">数据库</span>
                  <Badge variant={dbReport?.metrics?.cacheHitRate > 0.5 ? 'success' : 'error'}>
                    {dbReport?.metrics?.cacheHitRate > 0.5 ? '正常' : '异常'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="web-vitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <MetricCard
              title="FCP (首次内容绘制)"
              value={webVitals?.fcp?.toFixed(0) || 'N/A'}
              unit="ms"
              status={webVitals?.fcp < 2000 ? 'good' : webVitals?.fcp < 2500 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              title="LCP (最大内容绘制)"
              value={webVitals?.lcp?.toFixed(0) || 'N/A'}
              unit="ms"
              status={webVitals?.lcp < 2500 ? 'good' : webVitals?.lcp < 4000 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              title="CLS (累积布局偏移)"
              value={webVitals?.cls?.toFixed(3) || 'N/A'}
              status={webVitals?.cls < 0.1 ? 'good' : webVitals?.cls < 0.25 ? 'warning' : 'critical'}
              icon={<Activity className="w-4 h-4" />}
            />
            <MetricCard
              title="FID (首次输入延迟)"
              value={webVitals?.fid?.toFixed(0) || 'N/A'}
              unit="ms"
              status={webVitals?.fid < 100 ? 'good' : webVitals?.fid < 300 ? 'warning' : 'critical'}
              icon={<Zap className="w-4 h-4" />}
            />
            <MetricCard
              title="TTFB (首字节时间)"
              value={webVitals?.ttfb?.toFixed(0) || 'N/A'}
              unit="ms"
              status={webVitals?.ttfb < 800 ? 'good' : webVitals?.ttfb < 1800 ? 'warning' : 'critical'}
              icon={<Network className="w-4 h-4" />}
            />
          </div>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="总请求数"
              value={apiReport?.summary?.totalRequests || 0}
              icon={<Network className="w-4 h-4" />}
              status="good"
            />
            <MetricCard
              title="平均延迟"
              value={apiReport?.summary?.averageDuration?.toFixed(0) || 'N/A'}
              unit="ms"
              status={apiReport?.summary?.averageDuration < 200 ? 'good' : apiReport?.summary?.averageDuration < 500 ? 'warning' : 'critical'}
              icon={<Network className="w-4 h-4" />}
            />
            <MetricCard
              title="P99 延迟"
              value={apiReport?.summary?.p99Duration?.toFixed(0) || 'N/A'}
              unit="ms"
              status={apiReport?.summary?.p99Duration < 500 ? 'good' : apiReport?.summary?.p99Duration < 1000 ? 'warning' : 'critical'}
              icon={<Network className="w-4 h-4" />}
            />
            <MetricCard
              title="错误率"
              value={((apiReport?.summary?.errorRate || 0) * 100).toFixed(2)}
              unit="%"
              status={apiReport?.summary?.errorRate < 0.01 ? 'good' : apiReport?.summary?.errorRate < 0.05 ? 'warning' : 'critical'}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>

          {apiReport?.recommendations && apiReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>API 性能建议</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {apiReport.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="realtime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="活跃连接"
              value={realtimeReport?.metrics?.activeConnections || 0}
              icon={<Activity className="w-4 h-4" />}
              status="good"
            />
            <MetricCard
              title="平均延迟"
              value={realtimeReport?.metrics?.averageLatency?.toFixed(0) || 'N/A'}
              unit="ms"
              status={realtimeReport?.metrics?.averageLatency < 100 ? 'good' : realtimeReport?.metrics?.averageLatency < 200 ? 'warning' : 'critical'}
              icon={<Network className="w-4 h-4" />}
            />
            <MetricCard
              title="重连率"
              value={((realtimeReport?.metrics?.reconnectRate || 0) * 100).toFixed(2)}
              unit="%"
              status={realtimeReport?.metrics?.reconnectRate < 0.1 ? 'good' : realtimeReport?.metrics?.reconnectRate < 0.2 ? 'warning' : 'critical'}
              icon={<RefreshCw className="w-4 h-4" />}
            />
            <MetricCard
              title="错误率"
              value={((realtimeReport?.metrics?.errorRate || 0) * 100).toFixed(2)}
              unit="%"
              status={realtimeReport?.metrics?.errorRate < 0.05 ? 'good' : realtimeReport?.metrics?.errorRate < 0.1 ? 'warning' : 'critical'}
              icon={<AlertTriangle className="w-4 h-4" />}
            />
          </div>

          {realtimeReport?.recommendations && realtimeReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Realtime 性能建议</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {realtimeReport.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="总查询数"
              value={dbReport?.metrics?.totalQueries || 0}
              icon={<Database className="w-4 h-4" />}
              status="good"
            />
            <MetricCard
              title="平均延迟"
              value={dbReport?.metrics?.averageDuration?.toFixed(0) || 'N/A'}
              unit="ms"
              status={dbReport?.metrics?.averageDuration < 200 ? 'good' : dbReport?.metrics?.averageDuration < 500 ? 'warning' : 'critical'}
              icon={<Database className="w-4 h-4" />}
            />
            <MetricCard
              title="P99 延迟"
              value={dbReport?.metrics?.p99Duration?.toFixed(0) || 'N/A'}
              unit="ms"
              status={dbReport?.metrics?.p99Duration < 500 ? 'good' : dbReport?.metrics?.p99Duration < 1000 ? 'warning' : 'critical'}
              icon={<Database className="w-4 h-4" />}
            />
            <MetricCard
              title="缓存命中率"
              value={((dbReport?.metrics?.cacheHitRate || 0) * 100).toFixed(1)}
              unit="%"
              status={dbReport?.metrics?.cacheHitRate > 0.7 ? 'good' : dbReport?.metrics?.cacheHitRate > 0.5 ? 'warning' : 'critical'}
              icon={<Zap className="w-4 h-4" />}
            />
          </div>

          {dbReport?.recommendations && dbReport.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>数据库性能建议</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dbReport.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <span>{rec}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="budget" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>性能预算概览</CardTitle>
                <CardDescription>资源使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {budgetReport?.budgets?.map((budget: any, i: number) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{budget.budget.name}</span>
                        <Badge variant={
                          budget.status === 'pass' ? 'success' : 
                          budget.status === 'warning' ? 'warning' : 'error'
                        }>
                          {budget.status}
                        </Badge>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            budget.status === 'pass' ? 'bg-green-500' : 
                            budget.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(budget.percentage * 100, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{(budget.percentage * 100).toFixed(1)}%</span>
                        <span>{budget.actualSize} / {budget.budget.maxSize}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {budgetReport?.recommendations && budgetReport.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>优化建议</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {budgetReport.recommendations.map((rec: string, i: number) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span>{rec}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
