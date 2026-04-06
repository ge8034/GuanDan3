import { Task, TaskId, AgentId, Capability, AgentStatus, Message } from '../core/types';
import { TeamManager } from './TeamManager';
import { MessageBus } from '../core/MessageBus';
import { devLogCat, LogCategory } from '@/lib/utils/devLog';

// 3. SendMessage Task Assignment
export class TaskDispatcher {
  private taskQueue: Task[] = [];
  private completedTasks: Map<TaskId, any> = new Map();
  private teamManager: TeamManager;
  private messageBus: MessageBus;
  private isProcessing: boolean = false; // 修复问题#28: 防止并发执行
  // 修复问题#26: 存储待处理的Promise resolve/reject
  private pendingPromises: Map<TaskId, { resolve: (value: any) => void; reject: (reason: any) => void; timeout: NodeJS.Timeout }> = new Map();

  constructor(teamManager: TeamManager) {
    this.teamManager = teamManager;
    this.messageBus = MessageBus.getInstance();

    // Subscribe to task results
    this.messageBus.subscribe('SYSTEM', this.handleTaskResult.bind(this));
  }

  // Add tasks to queue and process
  public async submitTasks(tasks: Task[]): Promise<void> {
    this.taskQueue.push(...tasks);
devLogCat(LogCategory.AGENT, `[TaskDispatcher] 提交 ${tasks.length} 个任务，队列长度: ${this.taskQueue.length}`)
    await this.processQueue();
  }

  // Intelligent Matching (Capability + Seat + Load)
  private async processQueue(): Promise<void> {
    // 修复问题#28: 防止并发执行
    if (this.isProcessing) {
devLogCat(LogCategory.AGENT, `[TaskDispatcher] 队列正在处理中，跳过本次调用`);
      return;
    }
    if (this.taskQueue.length === 0) return;

    this.isProcessing = true;
    try {
      await this.processQueueInternal();
    } finally {
      this.isProcessing = false;
    }
  }

  // 内部队列处理逻辑
  private async processQueueInternal(): Promise<void> {

    // Get all idle agents from TeamManager
    const availableAgents = this.teamManager.getAllAgentsByStatus(AgentStatus.IDLE);
devLogCat(LogCategory.AGENT, `[TaskDispatcher] 可用 agents: ${availableAgents.length}`);

    // Helper to extract seat number from agent ID
    // Agent ID format: ai-agent-${roomId}-seat-${seatNo}
    const getAgentSeatNo = (agentId: string): number | null => {
      const match = agentId.match(/-seat-(\d+)$/);
      return match ? parseInt(match[1], 10) : null;
    };

    // Iterate queue using a copy or index carefully
    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i];

      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const allDepsMet = task.dependencies.every(depId => this.completedTasks.has(depId));
        if (!allDepsMet) {
          continue; // Skip this task until dependencies are met
        }
      }

      // Get target seat from task payload
      const targetSeatNo = task.payload?.seatNo;

      // Find agent for this task: first try matching seat, then fallback to capability
      let agentIndex = -1;

      if (typeof targetSeatNo === 'number') {
        // Priority 1: Match by seat number
        agentIndex = availableAgents.findIndex(a => getAgentSeatNo(a.id) === targetSeatNo);
      }

      // Priority 2: Fallback to capability matching (if seat match failed)
      if (agentIndex === -1) {
        agentIndex = availableAgents.findIndex(a =>
          a.config.capabilities.some((c: Capability) => c.type === task.type && c.level >= (task.priority || 1))
        );
      }

      if (agentIndex > -1) {
        const agent = availableAgents[agentIndex];

        // Remove task from queue and assign
        this.taskQueue.splice(i, 1);
        i--;

        // Assign task via MessageBus
        const assignMsg: Message = {
          id: crypto.randomUUID(),
          from: 'SYSTEM',
          to: agent.id,
          type: 'TASK_ASSIGN',
          payload: task,
          timestamp: Date.now()
        };

        this.messageBus.publish(assignMsg);
        agent.updateStatus(AgentStatus.BUSY); // Optimistically update status

        // Remove agent from available pool for this cycle
        availableAgents.splice(agentIndex, 1);
    devLogCat(LogCategory.AGENT, `[TaskDispatcher] 任务 ${task.id} (座位 ${targetSeatNo}) 已分配给 ${agent.id}`);
      } else {
    devLogCat(LogCategory.AGENT, `[TaskDispatcher] 未找到合适的 agent 处理任务 ${task.id} (座位 ${targetSeatNo})`);
      }
    }
  }

  private handleTaskResult(message: Message): void {
    if (message.type === 'TASK_RESULT') {
      const result = message.payload;
      this.completedTasks.set(result.taskId, result);

      // 修复问题#26: 立即resolve等待的Promise（事件驱动而非轮询）
      const pending = this.pendingPromises.get(result.taskId);
      if (pending) {
        const { resolve, timeout } = pending;
        clearTimeout(timeout);
        resolve(result);
        this.pendingPromises.delete(result.taskId);
      }

      // Check if more tasks can be processed now that an agent is free
      this.processQueue();
    }
  }

  public getTaskResult(taskId: TaskId): any {
    return this.completedTasks.get(taskId);
  }

  // 修复问题#26: Helper to subscribe to specific task completion（事件驱动）
  public waitForTaskResult(taskId: TaskId, timeoutMs = 30000): Promise<any> {
    // Check if task is already completed
    const existingResult = this.completedTasks.get(taskId);
    if (existingResult) {
      return Promise.resolve(existingResult);
    }

    return new Promise((resolve, reject) => {
      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingPromises.delete(taskId);
        reject(new Error(`Task ${taskId} timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      // 存储Promise处理器，等待handleTaskResult调用
      this.pendingPromises.set(taskId, { resolve, reject, timeout });
    });
  }
}
