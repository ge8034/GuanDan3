import { Task } from '@/lib/multi-agent/core/types'
import { useEffect, useState } from 'react'
import { useGameStore } from '@/lib/store/game'

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
}

export function AIStatusPanel({ visible, logs, currentTurnSeat, turnNo, agentStatuses }: AIStatusPanelProps) {
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
    <div className="fixed top-24 right-2 w-72 bg-black/90 text-green-400 p-2 rounded text-[10px] z-[9999] shadow-xl border border-green-500/30 font-mono">
      <div className="font-bold mb-2 border-b border-gray-600 pb-1 flex justify-between items-center">
        <span>🤖 AI Agent System</span>
        <span className="text-[9px] text-gray-400">v1.1</span>
      </div>
      
      {/* Agent Status Grid */}
      <div className="grid grid-cols-1 gap-1 mb-2">
        {displayAgents.length > 0 ? displayAgents.map(agent => (
          <div key={agent.id} className="flex flex-col bg-white/5 p-1 rounded">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    agent.status === 'THINKING' ? 'bg-yellow-400 animate-pulse' : 
                    agent.status === 'IDLE' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="font-bold text-green-300">{agent.id}</span>
                </div>
                <span className={`text-[9px] ${agent.status === 'THINKING' ? 'text-yellow-200' : 'text-gray-400'}`}>
                  {agent.status}
                </span>
             </div>
             {agent.currentTask && (
                <div className="text-[9px] text-gray-400 mt-0.5 pl-4 truncate">
                  ↳ {agent.currentTask}
                </div>
             )}
          </div>
        )) : (
          <div className="text-gray-500 text-center py-2">等待 AI 初始化...</div>
        )}
      </div>

      {/* Task Log Stream */}
      <div className="border-t border-gray-600 pt-1">
        <div className="font-bold mb-1 text-gray-300">System Logs:</div>
        <div className="h-48 overflow-y-auto flex flex-col-reverse gap-0.5 scrollbar-thin scrollbar-thumb-gray-600">
          {logs.map((l, i) => (
            <div key={i} className="truncate hover:text-white transition-colors leading-tight py-0.5 border-b border-white/5 last:border-0">
              <span className="text-gray-500 text-[9px] mr-1">[{new Date().toLocaleTimeString().split(' ')[0]}]</span>
              <span className={l.includes('决策') ? 'text-blue-300' : l.includes('错误') ? 'text-red-400' : 'text-gray-300'}>
                {l}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
