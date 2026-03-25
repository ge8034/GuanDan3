import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGameStore } from '@/lib/store/game'
import { RoomMember } from '@/lib/store/room'
import { devLog, devError } from '@/lib/utils/devLog'
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
    devLog('[ensureAgentSystem] 初始化 Agent 系统')
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
    devLog(`[ensureAgentSystem] 创建 ${agents.length} 个 Agents`)

    try {
      teamManager.createTeam(`room-${roomId}`, agents)
      devLog('[ensureAgentSystem] Team 创建成功')
    } catch (e: any) {
      // Ignore if team exists (expected on re-renders)
      devLog('[ensureAgentSystem] Team 已存在，跳过创建')
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
  members: RoomMember[],
  difficulty: 'easy' | 'medium' | 'hard' = 'medium'
) {
  const [debugLog, setDebugLog] = useState<string[]>([])

  const addDebugLog = useCallback((msg: string) => setDebugLog(prev => [msg, ...prev].slice(0, 5)), [])

  // Use ref for tracking agent statuses internally to reduce re-renders
  const agentStatusesRef = useRef<Record<string, { status: string, task?: string }>>({})
  const [agentStatusesState, setAgentStatusesState] = useState<Record<string, { status: string, task?: string }>>({})

  // Expose current agent statuses as memoized value
  const agentStatuses = useMemo(() => ({ ...agentStatusesRef.current, ...agentStatusesState }), [agentStatusesState])

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

        // Update status (update ref for internal tracking, state for display)
        agentStatusesRef.current[agentId] = { ...agentStatusesRef.current[agentId], status: 'IDLE', task: undefined }
        let newStatus = 'IDLE'
        let newTask = undefined

        if (message.includes('收到任务')) {
          newStatus = 'THINKING'
          newTask = '思考中...'
        } else if (message.includes('决策完成')) {
          newStatus = 'IDLE'
          newTask = undefined
        } else if (message.includes('发生错误')) {
          newStatus = 'ERROR'
          newTask = 'Error'
        }

        agentStatusesRef.current[agentId] = { status: newStatus, task: newTask }

        // Debounce state updates to reduce re-renders (update at most once per 100ms)
        if (!agentStatusesDebounceRef.current) {
          agentStatusesDebounceRef.current = setTimeout(() => {
            setAgentStatusesState(prev => ({ ...prev }))
            agentStatusesDebounceRef.current = null
          }, 100)
        }
      }
    }

    bus.subscribe(observerId, handler)
    return () => bus.unsubscribe(observerId)
  }, [isOwner, roomId, addDebugLog])

  const isSubmittingRef = useRef(false)
  const agentStatusesDebounceRef = useRef<NodeJS.Timeout | null>(null)

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
  // Use module-level tracking to avoid duplicate subscriptions
  useEffect(() => {
    if (!isOwner) return;
    ensureAgentSystem(roomId, difficulty);

    // Check if we already have a subscription for this room
    const subscriptionKey = `game-sub-${roomId}`;
    if ((useRoomAI as any)[subscriptionKey]) {
      devLog('[useRoomAI] 跳过重复订阅');
      return;
    }

    (useRoomAI as any)[subscriptionKey] = true;

    // Track previous status using module-level variable
    let prevStatus = '';
    let prevLastActionStr = '';

    // Subscribe to store changes to broadcast events to agents
    const unsub = useGameStore.subscribe((state) => {
        // Check Game Start - only send once when status changes to playing
        if (state.status === 'playing' && prevStatus !== 'playing') {
           prevStatus = 'playing';
           devLog('[useRoomAI] 发送 GAME_START 消息到 AI Team');
           teamManager?.broadcastToTeam(`room-${roomId}`, {
             id: crypto.randomUUID(),
             type: 'GAME_START',
             payload: { levelRank: state.levelRank },
             from: 'SYSTEM',
             to: 'BROADCAST',
             timestamp: Date.now()
           });
        }

        // Reset when game ends
        if (state.status !== 'playing' && prevStatus === 'playing') {
          prevStatus = '';
        }

        // Check Last Action
        const lastActionStr = JSON.stringify(state.lastAction);
        if (state.lastAction && lastActionStr !== prevLastActionStr) {
           prevLastActionStr = lastActionStr;
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

    // Cleanup
    return () => {
      unsub();
      (useRoomAI as any)[subscriptionKey] = false;
    };
  }, [isOwner, roomId, difficulty]);

  useEffect(() => {
    // 前置条件检查
    const shouldRunAI = gameStatus === 'playing' &&
                        isOwner &&
                        members &&
                        members.length > 0

    if (!shouldRunAI) {
      devLog(`[useRoomAI] AI 跳过: gameStatus=${gameStatus}, isOwner=${isOwner}, members=${members?.length || 0}`)
      return
    }

    const currentMember = members.find(m => m.seat_no === currentSeat)
    const isAIMember = currentMember?.member_type === 'ai'
    const isPracticeMode = members.length === 4 && members.some(m => m.member_type === 'ai')

    devLog(`[useRoomAI] 当前座位: ${currentSeat}, isAIMember=${isAIMember}, isPracticeMode=${isPracticeMode}, members.length=${members.length}`)

    // 修复：只对AI成员运行AI决策，包括练习模式
    // 练习模式下AI应该只接管AI成员的座位，而不是人类玩家的座位
    if (!isAIMember) {
      devLog(`[useRoomAI] 当前座位不是AI成员，跳过AI决策: member_type=${currentMember?.member_type}`)
      return
    }

    // Prevent duplicate submission for same turn state
    if (isSubmittingRef.current) {
      devLog(`[useRoomAI] 正在提交中，跳过`)
      return
    }

    const runAI = async () => {
      isSubmittingRef.current = true
      const decisionStartTime = Date.now()

      devLog(`[useRoomAI runAI] 开始执行: currentSeat=${currentSeat}`)

      // 添加超时保护，防止 isSubmittingRef 永远不被重置
      const timeoutId = setTimeout(() => {
        if (isSubmittingRef.current) {
          devLog('[useRoomAI] 决策超时 (15秒)，强制重置 isSubmittingRef')
          isSubmittingRef.current = false
        }
      }, 15000)

      try {
        const { dispatcher, planner } = ensureAgentSystem(roomId)
        if (!dispatcher || !planner) {
          devLog(`[useRoomAI runAI] dispatcher 或 planner 不存在`)
          return
        }

        const freshState = useGameStore.getState()
        devLog(`[useRoomAI runAI] freshState: status=${freshState.status}, currentSeat=${freshState.currentSeat}, myHand.length=${freshState.myHand?.length || 0}`)

        // Double check state
        if (freshState.status !== 'playing' || freshState.currentSeat !== currentSeat) {
          devLog(`[useRoomAI runAI] 状态检查失败: status=${freshState.status} !== playing=${freshState.status === 'playing'}, currentSeat=${freshState.currentSeat} !== ${currentSeat}=${freshState.currentSeat === currentSeat}`)
          return
        }

        const currentMember = members.find(m => m.seat_no === currentSeat)
        // 再次确认是AI成员（防御性编程）
        if (!currentMember || currentMember.member_type !== 'ai') {
          devLog(`[useRoomAI runAI] 当前座位不是AI成员: currentSeat=${currentSeat}, member_type=${currentMember?.member_type}`)
          return
        }

        const lastAction = freshState.lastAction
        const aiHand = await freshState.getAIHand(currentSeat)
        devLog(`[useRoomAI runAI] aiHand.length=${aiHand?.length || 0}, lastAction=${JSON.stringify(lastAction)}`)

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
        devLog(`[useRoomAI runAI] 创建任务: ${task.id}`)

        const subtasks = planner.decompose(task)
        devLog(`[useRoomAI runAI] planner.decompose 返回 ${subtasks?.length || 0} 个子任务`)
        if (!subtasks || subtasks.length === 0) {
          devError('[useRoomAI] planner.decompose() 返回空数组')
          return
        }

        devLog(`[useRoomAI runAI] 准备提交 ${subtasks.length} 个任务`)
        await dispatcher.submitTasks(subtasks)
        devLog(`[useRoomAI runAI] 任务提交完成`)
        addDebugLog(`AI Agent: 调度中 (座位 ${currentSeat})`)

        // Wait for result
        const decisionTask = subtasks.find((t: Task) => t.type === 'DecideMove')
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
        devError('[useRoomAI] AI 异常:', e)
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
        clearTimeout(timeoutId)
        isSubmittingRef.current = false
        devLog(`[useRoomAI runAI] 完成，耗时: ${Date.now() - decisionStartTime}ms`)
      }
    }

    runAI()
  }, [gameStatus, currentSeat, turnNo, isOwner, roomId, difficulty, members])

  // Cleanup: Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (agentStatusesDebounceRef.current) {
        clearTimeout(agentStatusesDebounceRef.current)
      }
    }
  }, [])

  return { debugLog, addDebugLog, agentStatuses }
}
