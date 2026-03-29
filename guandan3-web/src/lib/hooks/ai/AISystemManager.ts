import { devLog } from '@/lib/utils/devLog'
import { TeamManager } from '@/lib/multi-agent/system/TeamManager'
import { TaskDispatcher } from '@/lib/multi-agent/system/TaskDispatcher'
import { TaskPlanner } from '@/lib/multi-agent/system/TaskPlanner'
import { AgentConfig } from '@/lib/multi-agent/core/types'

/**
 * AI 游戏系统
 *
 * 封装特定房间的 AI 系统实例，包括 TeamManager、Dispatcher 和 Planner
 */
export interface AISystem {
  roomId: string
  difficulty: 'easy' | 'medium' | 'hard'
  teamManager: TeamManager
  dispatcher: TaskDispatcher
  planner: TaskPlanner
  createdAt: number
}

/**
 * AI 系统管理器
 *
 * 使用单例模式管理多个房间的 AI 系统，避免模块级变量
 */
class AISystemManager {
  private static instance: AISystemManager | null = null
  private systems: Map<string, AISystem> = new Map()

  private constructor() {}

  /**
   * 获取单例实例
   */
  static getInstance(): AISystemManager {
    if (!AISystemManager.instance) {
      AISystemManager.instance = new AISystemManager()
    }
    return AISystemManager.instance
  }

  /**
   * 获取或创建指定房间的 AI 系统
   */
  getOrCreateSystem(roomId: string, difficulty: 'easy' | 'medium' | 'hard'): AISystem {
    // 检查是否已有相同 difficulty 的系统
    const existing = this.systems.get(roomId)
    if (existing && existing.difficulty === difficulty) {
      return existing
    }

    // 如果 difficulty 改变，清理旧系统
    if (existing) {
      this.disposeSystem(roomId)
    }

    // 创建新系统
    const system = this.createSystem(roomId, difficulty)
    this.systems.set(roomId, system)
    return system
  }

  /**
   * 创建新的 AI 系统
   */
  private createSystem(roomId: string, difficulty: 'easy' | 'medium' | 'hard'): AISystem {
    devLog(`[AISystemManager] 创建房间 ${roomId} 的 AI 系统 (难度: ${difficulty})`)

    const teamManager = new TeamManager()
    const dispatcher = new TaskDispatcher(teamManager)
    const planner = new TaskPlanner()

    // 创建 4 个 AI Agent
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
      devLog(`[AISystemManager] 成功创建 ${agents.length} 个 Agents`)
    } catch (e) {
      // Team 已存在是正常情况（重渲染时）
      devLog(`[AISystemManager] Team 已存在或创建失败`)
    }

    return {
      roomId,
      difficulty,
      teamManager,
      dispatcher,
      planner,
      createdAt: Date.now()
    }
  }

  /**
   * 获取系统
   */
  getSystem(roomId: string): AISystem | undefined {
    return this.systems.get(roomId)
  }

  /**
   * 销毁指定房间的系统
   */
  disposeSystem(roomId: string): void {
    const system = this.systems.get(roomId)
    if (system) {
      devLog(`[AISystemManager] 销毁房间 ${roomId} 的 AI 系统`)
      this.systems.delete(roomId)
    }
  }

  /**
   * 销毁所有系统
   */
  disposeAll(): void {
    devLog(`[AISystemManager] 销毁所有 AI 系统`)
    this.systems.clear()
  }

  /**
   * 获取所有活跃房间 ID
   */
  getActiveRoomIds(): string[] {
    return Array.from(this.systems.keys())
  }
}

/**
 * 导出单例访问器
 */
export const aiSystemManager = AISystemManager.getInstance()
