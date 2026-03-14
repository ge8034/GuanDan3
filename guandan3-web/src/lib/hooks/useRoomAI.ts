import { useEffect, useRef, useState } from 'react'
import { useGameStore } from '@/lib/store/game'
import { devLog } from '@/lib/utils/devLog'
import { TeamManager } from '@/lib/multi-agent/system/TeamManager'
import { TaskDispatcher } from '@/lib/multi-agent/system/TaskDispatcher'
import { TaskPlanner } from '@/lib/multi-agent/system/TaskPlanner'
import { AgentConfig, Task } from '@/lib/multi-agent/core/types'

// Singleton instance to avoid recreating agents on every render
let teamManager: TeamManager | null = null
let dispatcher: TaskDispatcher | null = null
let planner: TaskPlanner | null = null

function ensureAgentSystem(roomId: string) {
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
        maxLoad: 1
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
  getMemberBySeat: (seat: number) => any
) {
  const [debugLog, setDebugLog] = useState<string[]>([])
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const addDebugLog = (msg: string) => setDebugLog(prev => [msg, ...prev].slice(0, 5))

  const isSubmittingRef = useRef(false)

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
        try {
          const freshState = useGameStore.getState()
          // Double check state
          if (freshState.status !== 'playing' || freshState.currentSeat !== currentSeat) {
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
              seatNo: currentSeat
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
               addDebugLog(`AI 决策: ${move.type} ${move.cards?.length || 0} 张`)
               
               const submitRes = await freshState.submitTurn(move.type, move.cards)
               if (submitRes?.error) {
                 addDebugLog(`AI 提交失败: ${submitRes.error.message}`)
               } else {
                 addDebugLog('AI 提交成功')
               }
            } else {
               addDebugLog('AI 任务超时或失败')
            }
          }
        } catch (e: any) {
          addDebugLog(`AI 异常: ${e.message}`)
          devLog('AI Agent Error', e)
        } finally {
          isSubmittingRef.current = false
        }
      }

      runAI()
    }
  }, [gameStatus, currentSeat, turnNo, members, isOwner, getMemberBySeat, roomId, addDebugLog])

  return { debugLog, addDebugLog }
}
