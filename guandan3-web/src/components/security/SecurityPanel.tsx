'use client'

import { useState, useMemo } from 'react'
import Card from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useSecurityReport } from '@/lib/hooks/useSecurity'
import { userSecurity } from '@/lib/security/user-security'

interface SecurityEvent {
  id: string
  type: string
  timestamp: number
  userId: string
  details: Record<string, any>
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export function SecurityPanel() {
  const { report, refreshReport, getAllSecurityEvents, clearSecurityEvents, cleanupOldData } = useSecurityReport()
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
  const [showDetails, setShowDetails] = useState(false)

  const allEvents = useMemo(() => {
    return getAllSecurityEvents(100)
  }, [getAllSecurityEvents])

  const events = allEvents

  const filteredEvents = events.filter(event => {
    if (selectedSeverity === 'all') return true
    return event.severity === selectedSeverity
  })

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-yellow-600 bg-yellow-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getSeverityLabel = (severity: string) => {
    const labels: Record<string, string> = {
      critical: '严重',
      high: '高',
      medium: '中',
      low: '低'
    }
    return labels[severity] || severity
  }

  const getEventTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      login: '登录',
      logout: '登出',
      password_change: '密码修改',
      account_lock: '账户锁定',
      suspicious_activity: '可疑活动'
    }
    return labels[type] || type
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp)
    return date.toLocaleString('zh-CN')
  }

  const handleClearEvents = () => {
    if (confirm('确定要清除所有安全事件吗？')) {
      clearSecurityEvents()
      refreshReport()
    }
  }

  const handleCleanup = () => {
    if (confirm('确定要清理旧数据吗？')) {
      cleanupOldData()
      refreshReport()
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">安全监控面板</h2>
          <div className="flex gap-2">
            <Button onClick={refreshReport} variant="outline">
              刷新
            </Button>
            <Button onClick={handleCleanup} variant="outline">
              清理旧数据
            </Button>
            <Button onClick={handleClearEvents} variant="danger">
              清除事件
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-blue-50">
            <div className="text-sm text-blue-600 mb-1">总事件数</div>
            <div className="text-3xl font-bold text-blue-700">{report.totalEvents}</div>
          </Card>

          <Card className="p-4 bg-red-50">
            <div className="text-sm text-red-600 mb-1">严重事件</div>
            <div className="text-3xl font-bold text-red-700">{report.criticalEvents}</div>
          </Card>

          <Card className="p-4 bg-orange-50">
            <div className="text-sm text-orange-600 mb-1">高危事件</div>
            <div className="text-3xl font-bold text-orange-700">{report.highSeverityEvents}</div>
          </Card>

          <Card className="p-4 bg-yellow-50">
            <div className="text-sm text-yellow-600 mb-1">锁定账户</div>
            <div className="text-3xl font-bold text-yellow-700">{report.lockedAccounts}</div>
          </Card>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-4 mb-4">
            <label className="text-sm font-medium">筛选严重程度:</label>
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="all">全部</option>
              <option value="critical">严重</option>
              <option value="high">高</option>
              <option value="medium">中</option>
              <option value="low">低</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="showDetails"
              checked={showDetails}
              onChange={(e) => setShowDetails(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="showDetails" className="text-sm">显示详细信息</label>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">用户ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">严重程度</th>
                {showDetails && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">详情</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={showDetails ? 5 : 4} className="px-4 py-8 text-center text-gray-500">
                    暂无安全事件
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{formatTimestamp(event.timestamp)}</td>
                    <td className="px-4 py-3 text-sm">{getEventTypeLabel(event.type)}</td>
                    <td className="px-4 py-3 text-sm font-mono">{event.userId}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(event.severity)}`}>
                        {getSeverityLabel(event.severity)}
                      </span>
                    </td>
                    {showDetails && (
                      <td className="px-4 py-3 text-sm">
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
                          {JSON.stringify(event.details, null, 2)}
                        </pre>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredEvents.length > 0 && (
          <div className="mt-4 text-sm text-gray-600">
            显示 {filteredEvents.length} 条记录，共 {events.length} 条
          </div>
        )}
      </Card>
    </div>
  )
}
