import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/lib/store/game'
import { devLog } from '@/lib/utils/devLog'
import { TeamManager } from '@/lib/multi-agent/system/TeamManager'
import { TaskDispatcher } from '@/lib/multi-agent/system/TaskDispatcher'
import { TaskPlanner } from '@/lib/multi-agent/system/TaskPlanner'
import { AgentConfig, Task, Message } from '@/lib/multi-agent/core/types'
import { MessageBus } from '@/lib/multi-agent/core/MessageBus'
import { AIPerformanceMonitor } from '@/lib/utils/aiPerformanceMonitor'

// Singleton instance to avoid recreating agents on every render
let teamManager: TeamManager | null = null
let dispatcher: TaskDispatcher | null = null
let planner: TaskPlanner | null = null

function ensureAgentSystem(roomId: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') {
  if (!teamManager) {
    teamManager = new TeamManager()
    dispatcher = new TaskDispatcher(teamManager)
    planner = new TaskPlanner()
    
    // Initialize Agents for the room
    // Ideally we sync this with actual room members, but for now we create static agents
    // The agent will pick up tasks based on seat number in payload
    const agents: AgentConfig[] = []
    for (let i = 0; i < 4; i++) {
      agents.push({
        id: `ai-agent-${roomId}-seat-${i}`,
        role: 'GuanDanAI',
        capabilities: [{ type: 'DecideMove', level: 10 }],
        maxLoad: 1,
        difficulty
      })
    }
    try {
      teamManager.createTeam(`room-${roomId}`, agents)
    } catch (e) {
      // Ignore if team exists
    }
  }
  return { dispatcher, planner }
}

export function useRoomAI(
  roomId: string,
  isOwner: boolean,
  gameStatus: string,
  currentSeat: number,
  turnNo: number,
  members: any[],
  getMemberBySeat: (seat: number) => any,
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) {
  const [debugLog, setDebugLog] = useState<string[]>([])
   
  const addDebugLog = useCallback((msg: string) => setDebugLog(prev => [msg, ...prev].slice(0, 5)), [])

  const [agentStatuses, setAgentStatuses] = useState<Record<string, { status: string, task?: string }>>({})
  const performanceMonitor = AIPerformanceMonitor.getInstance()

  useEffect(() => {
    if (!isOwner) return
    const bus = MessageBus.getInstance()
    const observerId = `observer-${roomId}-${crypto.randomUUID()}`

    const handler = (msg: Message) => {
      if (msg.type === 'AGENT_LOG') {
        const { agentId, message } = msg.payload
        const shortId = agentId.split('-').pop()
        
        // Update log
        addDebugLog(`[${shortId}] ${message}`)

        // Update status
        setAgentStatuses(prev => {
          let status = prev[agentId]?.status || 'IDLE'
          let task = prev[agentId]?.task

          if (message.includes('收到任务')) {
            status = 'THINKING'
            task = '思考中...'
          } else if (message.includes('决策完成')) {
            status = 'IDLE'
            task = undefined
          } else if (message.includes('发生错误')) {
            status = 'ERROR'
            task = 'Error'
          }
          
          return {
            ...prev,
            [agentId]: { status, task }
          }
        })
      }
    }

    bus.subscribe(observerId, handler)
    return () => bus.unsubscribe(observerId)
  }, [isOwner, roomId, addDebugLog])

  const isSubmittingRef = useRef(false)

  // Reinitialize agent system when difficulty changes
  useEffect(() => {
    if (!isOwner) return;
    // Reset team manager to recreate agents with new difficulty
    teamManager = null;
    dispatcher = null;
    planner = null;
    ensureAgentSystem(roomId, difficulty);
  }, [difficulty]);

  // Listen for Game Events and Broadcast to Agents
  useEffect(() => {
    if (!isOwner) return;
    ensureAgentSystem(roomId, difficulty);
    
    // Subscribe to store changes to broadcast events to agents
    const unsub = useGameStore.subscribe((state, prevState) => {
        // Check Game Start
        if (state.status === 'playing' && prevState.status !== 'playing') {
           teamManager?.broadcastToTeam(`room-${roomId}`, {
             id: crypto.randomUUID(),
             type: 'GAME_START',
             payload: { levelRank: state.levelRank },
             from: 'SYSTEM',
             to: 'BROADCAST',
             timestamp: Date.now()
           });
        }
        
        // Check Last Action
        if (state.lastAction && state.lastAction !== prevState.lastAction) {
           teamManager?.broadcastToTeam(`room-${roomId}`, {
             id: crypto.randomUUID(),
             type: 'GAME_ACTION',
             payload: {
               action: state.lastAction,
               levelRank: state.levelRank
             },
             from: 'SYSTEM',
             to: 'BROADCAST',
             timestamp: Date.now()
           });
        }
    });
    return () => unsub();
  }, [isOwner, roomId, difficulty]);

  useEffect(() => {
    if (gameStatus !== 'playing') return
    if (!isOwner) return
    if (!members || members.length === 0) return

    const currentMember = getMemberBySeat(currentSeat)
    
    if (currentMember?.member_type === 'ai') {
      const { dispatcher, planner } = ensureAgentSystem(roomId)
      if (!dispatcher || !planner) return

      // Prevent duplicate submission for same turn state
      if (isSubmittingRef.current) return
      
      const runAI = async () => {
        isSubmittingRef.current = true
        const decisionStartTime = Date.now()
        try {
          const freshState = useGameStore.getState()
          // Double check state
          if (freshState.status !== 'playing' || freshState.currentSeat !== currentSeat) {
             isSubmittingRef.current = false
             return
          }

          const currentMember = members.find(m => m.seat_no === currentSeat)
          if (!currentMember || currentMember.member_type !== 'ai') {
             isSubmittingRef.current = false
             return
          }

          addDebugLog(`AI Agent: 调度中 (座位 ${currentSeat})`)
          
          const aiHand = await freshState.getAIHand(currentSeat)
          const lastAction = freshState.lastAction

          const task: Task = {
            id: `turn-${freshState.gameId}-${freshState.turnNo}-${currentSeat}`,
            type: 'GuanDanTurn',
            priority: 10,
            payload: {
              hand: aiHand,
              lastAction,
              levelRank: freshState.levelRank,
              seatNo: currentSeat,
              playersCardCounts: freshState.counts
            },
            dependencies: [],
            status: 'PENDING',
            createdAt: Date.now()
          }

          const subtasks = planner.decompose(task)
          await dispatcher.submitTasks(subtasks)
          
          // Wait for result
          const decisionTask = subtasks.find(t => t.type === 'DecideMove')
          if (decisionTask) {
            const result = await dispatcher.waitForTaskResult(decisionTask.id)
            if (result && result.status === 'COMPLETED') {
               const move = result.output.move
               const decisionTime = Date.now() - decisionStartTime
               
               addDebugLog(`AI 决策: ${move.type} ${move.cards?.length || 0} 张 (${decisionTime}ms)`)
               
               const submitRes = await freshState.submitTurn(move.type, move.cards)
               if (submitRes?.error) {
                 addDebugLog(`AI 提交失败: ${submitRes.error.message}`)
                 performanceMonitor.recordDecision({
                   timestamp: Date.now(),
                   seatNo: currentSeat,
                   difficulty,
                   moveType: move.type,
                   cardCount: move.cards?.length || 0,
                   decisionTime,
                   success: false,
                   errorMessage: submitRes.error.message
                 })
               } else {
                 addDebugLog('AI 提交成功')
                 performanceMonitor.recordDecision({
                   timestamp: Date.now(),
                   seatNo: currentSeat,
                   difficulty,
                   moveType: move.type,
                   cardCount: move.cards?.length || 0,
                   decisionTime,
                   success: true
                 })
               }
            } else {
               addDebugLog('AI 任务超时或失败')
               const decisionTime = Date.now() - decisionStartTime
               performanceMonitor.recordDecision({
                 timestamp: Date.now(),
                 seatNo: currentSeat,
                 difficulty,
                 moveType: 'unknown',
                 cardCount: 0,
                 decisionTime,
                 success: false,
                 errorMessage: 'Task timeout or failed'
               })
            }
          }
        } catch (e: any) {
          addDebugLog(`AI 异常: ${e.message}`)
          devLog('AI Agent Error', e)
          const decisionTime = Date.now() - decisionStartTime
          performanceMonitor.recordDecision({
            timestamp: Date.now(),
            seatNo: currentSeat,
            difficulty,
            moveType: 'error',
            cardCount: 0,
            decisionTime,
            success: false,
            errorMessage: e.message
          })
        } finally {
          isSubmittingRef.current = false
        }
      }

      runAI()
    }
  }, [gameStatus, currentSeat, turnNo, isOwner, roomId, difficulty])

  return { debugLog, addDebugLog, agentStatuses }
}
