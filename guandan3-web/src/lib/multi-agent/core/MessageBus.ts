import { IMessageBus, Message, AgentId } from './types';

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
    
    // Asynchronous dispatch (simulating network delay)
    setTimeout(() => {
      this.dispatch(message);
    }, this.latencyMs);
  }

  private dispatch(message: Message): void {
    const { to } = message;

    if (to === 'BROADCAST') {
      this.subscribers.forEach((callbacks) => {
        callbacks.forEach(cb => cb(message));
      });
    } else if (this.subscribers.has(to)) {
      const callbacks = this.subscribers.get(to);
      callbacks?.forEach(cb => cb(message));
    }
    // Handle Team Broadcast if needed (not implemented here for simplicity, assumes to is AgentId)
  }

  public subscribe(agentId: AgentId, callback: (msg: Message) => void): void {
    if (!this.subscribers.has(agentId)) {
      this.subscribers.set(agentId, []);
    }
    this.subscribers.get(agentId)?.push(callback);
  }

  public unsubscribe(agentId: AgentId): void {
    this.subscribers.delete(agentId);
  }
}
