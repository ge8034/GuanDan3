import { BaseAgent } from './BaseAgent';
import { AgentConfig, Task, AgentStatus } from './types';

export class WorkerAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  // Implementation of task processing logic
  protected async processTask(task: Task): Promise<void> {
    // Simulate processing time
    this.updateStatus(AgentStatus.BUSY);
    
    // Simulate complex task processing logic (e.g., analyze hand, predict opponent)
    // For demo purposes, we just wait for a bit
    await new Promise(resolve => setTimeout(resolve, task.estimatedDurationMs || 50));

    // After processing, send result back to requester (e.g., TaskManager or another Agent)
    const result = { taskId: task.id, output: `Processed by ${this.id}`, status: 'COMPLETED' };
    
    this.updateStatus(AgentStatus.IDLE);
    
    // Send result back to the sender of the task if available, or broadcast result
    // For simplicity, we assume a 'TaskDispatcher' is listening for results on a specific channel or we reply to 'SYSTEM'
    await this.sendMessage('SYSTEM', 'TASK_RESULT', result);
  }
}
