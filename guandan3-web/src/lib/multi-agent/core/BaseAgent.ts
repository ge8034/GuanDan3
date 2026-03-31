import { IAgent, AgentId, AgentConfig, AgentStatus, Message } from './types';
import { MessageBus } from './MessageBus';

import { logger } from '@/lib/utils/logger'
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

  // Handle incoming messages from MessageBus subscription
  private async handleMessage(message: Message): Promise<void> {
    logger.debug(`[BaseAgent:${this.id}] handleMessage 收到消息: type=${message.type}, msgId=${message.id}, from=${message.from}, to=${message.to}`)
    // 委托给 receive 方法，允许子类扩展消息处理
    await this.receive(message);
  }

  // 直接接收消息（由 TeamManager 或其他调用）
  public async receive(message: Message): Promise<void> {
    // 处理 TASK_ASSIGN 消息
    if (message.type === 'TASK_ASSIGN') {
      logger.debug(`[BaseAgent:${this.id}] 准备调用 processTask`)
      await this.processTask(message.payload);
      logger.debug(`[BaseAgent:${this.id}] processTask 完成`)
    }
    // 其他消息类型由子类处理
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

  // 默认 processTask 实现 - 子类可以覆盖
  protected async processTask(task: any): Promise<void> {
    // 默认实现：子类可以覆盖
    logger.warn(`[${this.id}] processTask 未被实现，跳过任务:`, task.id);
  }

  public updateStatus(status: AgentStatus): void {
    this.status = status;
    this.sendMessage('SYSTEM', 'STATUS_UPDATE', { agentId: this.id, status });
  }
}
