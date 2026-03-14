import { WorkerAgent } from '../core/WorkerAgent';
import { AgentConfig, Task, AgentStatus } from '../core/types';
import { decideMove } from '@/lib/game/ai';
import { Card } from '@/lib/store/game';

interface GuanDanTaskPayload {
  hand: Card[];
  lastAction: { type: 'play' | 'pass'; cards?: Card[]; seatNo?: number } | null;
  levelRank: number;
  seatNo: number;
}

export class GuanDanAgent extends WorkerAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  protected async processTask(task: Task): Promise<void> {
    if (task.type !== 'DecideMove') {
      await super.processTask(task);
      return;
    }

    this.updateStatus(AgentStatus.BUSY);

    const payload = task.payload as GuanDanTaskPayload;
    
    // Simulate thinking time (random between 500ms and 1500ms)
    const thinkingTime = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, thinkingTime));

    try {
      // Execute existing AI logic
      const move = decideMove(payload.hand, payload.lastAction, payload.levelRank);
      
      const result = {
        taskId: task.id,
        output: {
          move,
          agentId: this.id,
          seatNo: payload.seatNo
        },
        status: 'COMPLETED'
      };

      await this.sendMessage('SYSTEM', 'TASK_RESULT', result);
    } catch (error) {
      console.error('GuanDanAgent error:', error);
      await this.sendMessage('SYSTEM', 'TASK_RESULT', {
        taskId: task.id,
        error: String(error),
        status: 'FAILED'
      });
    } finally {
      this.updateStatus(AgentStatus.IDLE);
    }
  }
}
