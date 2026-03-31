'use client'

import { useState, useEffect } from 'react'
import Card, { CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { databaseIndexOptimizer, IndexAnalysisResult } from '@/lib/database/index-optimizer'
import { Database, RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

import { logger } from '@/lib/utils/logger'
export default function DatabaseIndexManager() {
  const [analyses, setAnalyses] = useState<IndexAnalysisResult[]>([])
  const [loading, setLoading] = useState(false)
  const [optimizing, setOptimizing] = useState(false)
  const [results, setResults] = useState<{
    created: number
    dropped: number
    errors: string[]
  } | null>(null)

  useEffect(() => {
    loadAnalyses()
  }, [])

  const loadAnalyses = async () => {
    setLoading(true)
    try {
      const results = await databaseIndexOptimizer.analyzeAllTables()
      setAnalyses(results)
    } catch (error) {
      logger.error('Failed to load index analyses:', error)
    } finally {
      setLoading(false)
    }
  }

  const optimizeIndexes = async () => {
    setOptimizing(true)
    setResults(null)
    try {
      const optimizationResults = await databaseIndexOptimizer.optimizeIndexes()
      setResults(optimizationResults)
      await loadAnalyses()
    } catch (error) {
      logger.error('Failed to optimize indexes:', error)
      setResults({
        created: 0,
        dropped: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      })
    } finally {
      setOptimizing(false)
    }
  }

  const getPerformanceImpactColor = (impact: string) => {
    switch (impact) {
      case 'high':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'low':
        return 'text-gray-500'
      default:
        return 'text-gray-500'
    }
  }

  const getPerformanceImpactText = (impact: string) => {
    switch (impact) {
      case 'high':
        return '高影响'
      case 'medium':
        return '中等影响'
      case 'low':
        return '低影响'
      default:
        return '未知'
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">数据库索引优化</h1>
          <p className="text-muted-foreground">
            分析和优化数据库索引以提升查询性能
          </p>
        </div>

        <div className="mb-6 flex gap-4">
          <Button
            onClick={loadAnalyses}
            disabled={loading || optimizing}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            重新分析
          </Button>
          <Button
            onClick={optimizeIndexes}
            disabled={loading || optimizing}
          >
            <Database className="mr-2 h-4 w-4" />
            {optimizing ? '优化中...' : '执行优化'}
          </Button>
        </div>

        {results && (
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">优化结果</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{results.created}</div>
                    <div className="text-sm text-muted-foreground">创建索引</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{results.dropped}</div>
                    <div className="text-sm text-muted-foreground">删除索引</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {results.errors.length > 0 ? (
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <div>
                    <div className="text-2xl font-bold">{results.errors.length}</div>
                    <div className="text-sm text-muted-foreground">错误数量</div>
                  </div>
                </div>
              </div>
              {results.errors.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">错误详情</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-500">
                    {results.errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">分析中...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analyses.map((analysis) => (
              <Card key={analysis.table}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{analysis.table}</span>
                    <span className={`text-sm font-normal ${getPerformanceImpactColor(analysis.performanceImpact)}`}>
                      {getPerformanceImpactText(analysis.performanceImpact)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">当前索引</h4>
                      {analysis.currentIndexes.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.currentIndexes.map((idx, i) => (
                            <li key={i} className="text-muted-foreground">
                              {idx}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">无索引</p>
                      )}
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">推荐索引</h4>
                      {analysis.recommendedIndexes.length > 0 ? (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {analysis.recommendedIndexes.map((idx, i) => (
                            <li key={i} className="text-muted-foreground">
                              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                                {idx.columns.join(', ')}
                              </code>
                              {idx.unique && (
                                <span className="ml-2 text-xs text-blue-500">(唯一)</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">无需优化</p>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          当前索引数: {analysis.currentIndexes.length}
                        </span>
                        <span className="text-muted-foreground">
                          推荐索引数: {analysis.recommendedIndexes.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
