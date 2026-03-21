import { Task } from '@/lib/multi-agent/core/types'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/store/game'
import { AIPerformanceMonitor, AIDecisionMetrics } from '@/lib/utils/aiPerformanceMonitor'

interface AgentStatus {
  id: string
  status: 'IDLE' | 'BUSY' | 'THINKING' | 'ERROR'
  currentTask?: string
}

interface AIStatusPanelProps {
  visible: boolean
  logs: string[]
  currentTurnSeat: number
  turnNo: number
  agentStatuses?: Record<string, { status: string, task?: string }>
  difficulty?: 'easy' | 'medium' | 'hard'
}

export function AIStatusPanel({ visible, logs, currentTurnSeat, turnNo, agentStatuses, difficulty }: AIStatusPanelProps) {
  const performanceMonitor = AIPerformanceMonitor.getInstance()
  const [metrics, setMetrics] = useState<AIDecisionMetrics | null>(null)
  const [showMetrics, setShowMetrics] = useState(false)

  useEffect(() => {
    if (visible) {
      const updateMetrics = () => {
        setMetrics(performanceMonitor.getMetrics(difficulty))
      }
      updateMetrics()
      const interval = setInterval(updateMetrics, 2000)
      return () => clearInterval(interval)
    }
  }, [visible, difficulty, performanceMonitor])

  // If agentStatuses is provided, use it. Otherwise, use mock.
  
  // Create a derived list of agents for display
  const displayAgents = agentStatuses 
    ? Object.entries(agentStatuses).map(([id, info]) => ({
        id: id.split('-').pop() || id,
        status: info.status as AgentStatus['status'],
        currentTask: info.task
      })).sort((a, b) => a.id.localeCompare(b.id))
    : [
        { id: 'AI-1', status: 'IDLE' },
        { id: 'AI-2', status: 'IDLE' },
        { id: 'AI-3', status: 'IDLE' },
      ] as AgentStatus[];

  if (!visible) return null

  return (
    <div className="fixed top-24 right-2 w-72 bg-surface/95 backdrop-blur-md text-text-primary p-2 rounded-xl text-[10px] z-[9999] shadow-xl border border-border font-mono">
      <div className="font-bold mb-2 border-b border-border pb-1 flex justify-between items-center">
        <span className="text-primary">🤖 AI Agent System</span>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowMetrics(!showMetrics)}
            className="text-[9px] px-2 py-0.5 rounded bg-background-primary/50 hover:bg-background-primary/80 transition-colors"
          >
            {showMetrics ? '📊' : '📈'}
          </button>
          <span className="text-[9px] text-text-secondary">v1.2</span>
        </div>
      </div>
      
      {/* Performance Metrics */}
      {showMetrics && metrics && (
        <div className="mb-2 bg-background-primary/30 p-1.5 rounded-lg border border-border/50">
          <div className="font-bold mb-1 text-text-secondary text-[9px]">性能指标 ({difficulty || '全部'}):</div>
          <div className="grid grid-cols-2 gap-1 text-[9px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">总决策:</span>
              <span className="font-bold">{metrics.totalDecisions}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">成功率:</span>
              <span className={`font-bold ${metrics.successRate > 0.9 ? 'text-success' : metrics.successRate > 0.7 ? 'text-warning' : 'text-error'}`}>
                {(metrics.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">平均耗时:</span>
              <span className="font-bold">{metrics.averageDecisionTime.toFixed(0)}ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">错误率:</span>
              <span className={`font-bold ${metrics.errorRate < 0.1 ? 'text-success' : 'text-error'}`}>
                {(metrics.errorRate * 100).toFixed(1)}%
              </span>
            </div>
          </div>
          {Object.keys(metrics.decisionTypeDistribution).length > 0 && (
            <div className="mt-1 pt-1 border-t border-border/50">
              <div className="text-[9px] text-text-secondary mb-0.5">决策类型分布:</div>
              <div className="flex flex-wrap gap-1">
                {Object.entries(metrics.decisionTypeDistribution).map(([type, count]) => (
                  <span key={type} className="px-1.5 py-0.5 bg-background-primary/50 rounded text-[8px]">
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 gap-1 mb-2">
        {displayAgents.length > 0 ? displayAgents.map(agent => (
          <div key={agent.id} className="flex flex-col bg-background-primary/50 p-1 rounded-lg">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'THINKING' ? 'bg-accent animate-pulse' : 
                    agent.status === 'IDLE' ? 'bg-success' : 'bg-error'
                  }`} />
                  <span className="font-bold text-text-primary">{agent.id}</span>
                </div>
                <span className={`text-[9px] ${agent.status === 'THINKING' ? 'text-accent' : 'text-text-secondary'}`}>
                  {agent.status}
                </span>
             </div>
             {agent.currentTask && (
                <div className="text-[9px] text-text-secondary mt-0.5 pl-4 truncate">
                  ↳ {agent.currentTask}
                </div>
             )}
          </div>
        )) : (
          <div className="text-text-secondary text-center py-2">等待 AI 初始化...</div>
        )}
      </div>

      {/* Task Log Stream */}
      <div className="border-t border-border pt-1">
        <div className="font-bold mb-1 text-text-secondary">System Logs:</div>
        <div className="h-48 overflow-y-auto flex flex-col-reverse gap-0.5 scrollbar-thin scrollbar-thumb-border">
          {logs.map((l, i) => (
            <div key={i} className="truncate hover:text-primary transition-colors leading-tight py-0.5 border-b border-border/50 last:border-0">
              <span className="text-text-secondary text-[9px] mr-1">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
              <span className={l.includes('决策') ? 'text-primary' : l.includes('错误') ? 'text-error' : 'text-text-primary'}>
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
