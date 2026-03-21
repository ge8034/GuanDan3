import { Task, TaskId, AgentId, Capability, AgentStatus, Message } from '../core/types';
import { TeamManager } from './TeamManager';
import { MessageBus } from '../core/MessageBus';

// 3. SendMessage Task Assignment
export class TaskDispatcher {
  private taskQueue: Task[] = [];
  private completedTasks: Map<TaskId, any> = new Map();
  private teamManager: TeamManager;
  private messageBus: MessageBus;

  constructor(teamManager: TeamManager) {
    this.teamManager = teamManager;
    this.messageBus = MessageBus.getInstance();
    
    // Subscribe to task results
    this.messageBus.subscribe('SYSTEM', this.handleTaskResult.bind(this));
  }

  // Add tasks to queue and process
  public async submitTasks(tasks: Task[]): Promise<void> {
    this.taskQueue.push(...tasks);
    await this.processQueue();
  }

  // Intelligent Matching (Capability + Load)
  private async processQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return;

    // Always fetch the latest IDLE agents
    const availableAgents = Array.from(this.teamManager.getAgentsInTeam('guandan-table-1') || [])
      .concat(Array.from(this.teamManager.getAgentsInTeam('main_team') || []))
      .filter(a => a.status === AgentStatus.IDLE);

    // For demonstration, assume single capability matching for now
    // Iterate queue using a copy or index carefuly
    for (let i = 0; i < this.taskQueue.length; i++) {
      const task = this.taskQueue[i];
      
      // Check dependencies
      if (task.dependencies && task.dependencies.length > 0) {
        const allDepsMet = task.dependencies.every(depId => this.completedTasks.has(depId));
        if (!allDepsMet) continue; // Skip this task until dependencies are met
      }

      // Find best agent for this task
      const agentIndex = availableAgents.findIndex(a => 
        a.config.capabilities.some(c => c.type === task.type && c.level >= (task.priority || 1))
      );

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
      }
    }
  }

  private handleTaskResult(message: Message): void {
    if (message.type === 'TASK_RESULT') {
      const result = message.payload;
      this.completedTasks.set(result.taskId, result);
      
      // Check if more tasks can be processed now that an agent is free
      this.processQueue();
    }
  }
  
  public getTaskResult(taskId: TaskId): any {
    return this.completedTasks.get(taskId);
  }

  // Helper to subscribe to specific task completion
  public waitForTaskResult(taskId: TaskId, timeoutMs = 30000): Promise<any> {
    return new Promise((resolve, reject) => {
      const check = () => {
        const res = this.completedTasks.get(taskId);
        if (res) resolve(res);
        else return false;
        return true;
      }

      if (check()) return;

      const timer = setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Task timeout'));
      }, timeoutMs);

      // Use a more efficient polling interval or event emitter
      // For now, increasing timeout default and polling interval is a quick fix
      // Ideally, MessageBus should support once('taskId') or similar
      const interval = setInterval(() => {
        const res = this.completedTasks.get(taskId);
        if (res) {
          clearInterval(interval);
          clearTimeout(timer);
          resolve(res);
        }
      }, 100);
    });
  }
}
