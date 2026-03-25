import { IMessageBus, Message, AgentId } from './types';
import { devLog } from '@/lib/utils/devLog';

// Simple In-Memory Message Bus for demonstration
export class MessageBus implements IMessageBus {
  private subscribers: Map<AgentId, ((msg: Message) => void)[]> = new Map();
  private history: Message[] = [];
  private static instance: MessageBus;
  private latencyMs = 10; // Simulated latency < 100ms requirement

  public static getInstance(): MessageBus {
    if (!MessageBus.instance) {
      MessageBus.instance = new MessageBus();
    }
    return MessageBus.instance;
  }

  public publish(message: Message): void {
    this.history.push(message);
    devLog(`[MessageBus] 发布消息: type=${message.type}, from=${message.from}, to=${message.to}`);

    // Asynchronous dispatch (simulating network delay)
    setTimeout(() => {
      this.dispatch(message);
    }, this.latencyMs);
  }

  private dispatch(message: Message): void {
    const { to } = message;

    if (to === 'BROADCAST') {
      const subscriberCount = this.subscribers.size;
      devLog(`[MessageBus] dispatch BROADCAST to ${subscriberCount} subscribers, msgId=${message.id}`);
      this.subscribers.forEach((callbacks, agentId) => {
        callbacks.forEach(cb => cb(message));
      });
      devLog(`[MessageBus] dispatch BROADCAST complete, msgId=${message.id}`);
    } else if (this.subscribers.has(to)) {
      const callbacks = this.subscribers.get(to);
      callbacks?.forEach(cb => cb(message));
    }
  }

  public subscribe(agentId: AgentId, callback: (msg: Message) => void): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    const callbacks = this.subscribers.get(agentId);
    // 防止重复订阅同一个回调函数
    if (!callbacks?.includes(callback)) {
      callbacks?.push(callback);
    }
    devLog(`[MessageBus] subscribe: agentId=${agentId}, total=${this.subscribers.get(agentId)?.length}`)
  }

  public unsubscribe(agentId: AgentId): void {
    this.subscribers.delete(agentId);
  }
}
