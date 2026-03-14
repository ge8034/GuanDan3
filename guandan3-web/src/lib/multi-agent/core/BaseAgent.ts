import { IAgent, AgentId, AgentConfig, AgentStatus, Message } from './types';
import { MessageBus } from './MessageBus';

export abstract class BaseAgent implements IAgent {
  public id: AgentId;
  public status: AgentStatus;
  public config: AgentConfig;
  private messageBus: MessageBus;

  constructor(config: AgentConfig) {
    this.id = config.id;
    this.config = config;
    this.status = AgentStatus.IDLE;
    this.messageBus = MessageBus.getInstance();
    
    // Subscribe to messages for this agent
    this.messageBus.subscribe(this.id, this.handleMessage.bind(this));
  }

  // Handle incoming messages (Actor Model)
  private async handleMessage(message: Message): Promise<void> {
    if (message.type === 'TASK_ASSIGN') {
      await this.processTask(message.payload);
    } else if (message.type === 'STATUS_UPDATE') {
      // Handle status updates from other agents if needed
    }
    // ... extend message handling logic
  }

  // Send message to another agent or team
  public async sendMessage(to: AgentId | string, type: Message['type'], payload: any): Promise<void> {
    const msg: Message = {
      id: crypto.randomUUID(),
      from: this.id,
      to,
      type,
      payload,
      timestamp: Date.now()
    };
    this.messageBus.publish(msg);
  }

  // Abstract method for task processing logic (to be implemented by subclasses)
  protected abstract processTask(task: any): Promise<void>;

  public updateStatus(status: AgentStatus): void {
    this.status = status;
    this.sendMessage('SYSTEM', 'STATUS_UPDATE', { agentId: this.id, status });
  }

  public async receive(message: Message): Promise<void> {
    // Direct call for testing if needed, otherwise handled by subscription
    await this.handleMessage(message);
  }
}
