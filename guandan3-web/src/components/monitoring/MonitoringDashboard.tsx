'use client'

import { useState, useEffect } from 'react'
import Card from '@/components/ui/Card'
import { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'

import { logger } from '@/lib/utils/logger'
interface PerformanceMetrics {
  id: string
  page: string
  timestamp: string
  fcp: number
  lcp: number
  fid: number
  cls: number
  ttfb: number
  load_time: number
}

interface ErrorLog {
  id: string
  error_type: string
  error_message: string
  component: string
  page: string
  timestamp: string
}

interface AnalyticsEvent {
  id: string
  event_name: string
  event_type: string
  page: string
  timestamp: string
  properties: Record<string, any>
}

export default function MonitoringDashboard() {
  const [performanceData, setPerformanceData] = useState<PerformanceMetrics[]>([])
  const [errorData, setErrorData] = useState<ErrorLog[]>([])
  const [analyticsData, setAnalyticsData] = useState<AnalyticsEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMonitoringData()
  }, [])

  const fetchMonitoringData = async () => {
    try {
      const [perfRes, errorRes, analyticsRes] = await Promise.all([
        fetch('/api/monitoring/performance?limit=50'),
        fetch('/api/monitoring/error?limit=50'),
        fetch('/api/monitoring/analytics?limit=50')
      ])

      const [perfData, errorData, analyticsData] = await Promise.all([
        perfRes.json(),
        errorRes.json(),
        analyticsRes.json()
      ])

      setPerformanceData(perfData.data || [])
      setErrorData(errorData.data || [])
      setAnalyticsData(analyticsData.data || [])
    } catch (error) {
      logger.error('Failed to fetch monitoring data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAverage = (data: PerformanceMetrics[], field: keyof PerformanceMetrics) => {
    if (data.length === 0) return 0
    const values = data.map(item => item[field] as number).filter(v => v !== null && v !== undefined)
    return values.reduce((sum, val) => sum + val, 0) / values.length
  }

  const formatTime = (ms: number) => {
    return ms < 1000 ? `${ms.toFixed(0)}ms` : `${(ms / 1000).toFixed(2)}s`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">加载监控数据...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">监控仪表板</h1>
        <Button onClick={fetchMonitoringData}>刷新数据</Button>
      </div>

      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">性能监控</TabsTrigger>
          <TabsTrigger value="errors">错误日志</TabsTrigger>
          <TabsTrigger value="analytics">用户分析</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">平均 FCP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(calculateAverage(performanceData, 'fcp'))}
                </div>
                <p className="text-xs text-muted-foreground">首次内容绘制</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">平均 LCP</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(calculateAverage(performanceData, 'lcp'))}
                </div>
                <p className="text-xs text-muted-foreground">最大内容绘制</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">平均 FID</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatTime(calculateAverage(performanceData, 'fid'))}
                </div>
                <p className="text-xs text-muted-foreground">首次输入延迟</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">平均 CLS</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {calculateAverage(performanceData, 'cls').toFixed(3)}
                </div>
                <p className="text-xs text-muted-foreground">累积布局偏移</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>性能指标详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">页面</th>
                      <th className="text-left p-2">FCP</th>
                      <th className="text-left p-2">LCP</th>
                      <th className="text-left p-2">FID</th>
                      <th className="text-left p-2">CLS</th>
                      <th className="text-left p-2">加载时间</th>
                      <th className="text-left p-2">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.map((metric) => (
                      <tr key={metric.id} className="border-b">
                        <td className="p-2">{metric.page}</td>
                        <td className="p-2">{formatTime(metric.fcp)}</td>
                        <td className="p-2">{formatTime(metric.lcp)}</td>
                        <td className="p-2">{formatTime(metric.fid)}</td>
                        <td className="p-2">{metric.cls.toFixed(3)}</td>
                        <td className="p-2">{formatTime(metric.load_time)}</td>
                        <td className="p-2">
                          {new Date(metric.timestamp).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>错误日志 ({errorData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {errorData.map((error) => (
                  <div key={error.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold">{error.error_type}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          {error.component}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(error.timestamp).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <p className="text-sm text-red-600 mb-2">{error.error_message}</p>
                    <p className="text-xs text-muted-foreground">页面: {error.page}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>用户分析事件 ({analyticsData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">事件名称</th>
                      <th className="text-left p-2">事件类型</th>
                      <th className="text-left p-2">页面</th>
                      <th className="text-left p-2">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData.map((event) => (
                      <tr key={event.id} className="border-b">
                        <td className="p-2">{event.event_name}</td>
                        <td className="p-2">{event.event_type}</td>
                        <td className="p-2">{event.page}</td>
                        <td className="p-2">
                          {new Date(event.timestamp).toLocaleString('zh-CN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
