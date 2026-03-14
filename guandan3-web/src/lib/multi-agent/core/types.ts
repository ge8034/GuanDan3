// Core types for Multi-Agent System

export type AgentId = string;
export type TeamId = string;
export type TaskId = string;
export type MessageId = string;

export enum AgentStatus {
  IDLE = 'IDLE',
  BUSY = 'BUSY',
  OFFLINE = 'OFFLINE',
  ERROR = 'ERROR'
}

export interface Capability {
  type: string;
  level: number; // 1-10
}

export interface AgentConfig {
  id: AgentId;
  role: string;
  capabilities: Capability[];
  maxLoad: number;
}

export interface Task {
  id: TaskId;
  type: string;
  priority: number; // 1 (Low) - 10 (Critical)
  payload: any;
  dependencies: TaskId[];
  status: 'PENDING' | 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  assignedTo?: AgentId;
  result?: any;
  createdAt: number;
  estimatedDurationMs?: number;
}

export interface Message {
  id: MessageId;
  from: AgentId | 'SYSTEM';
  to: AgentId | 'BROADCAST' | TeamId;
  type: 'TASK_ASSIGN' | 'TASK_RESULT' | 'STATUS_UPDATE' | 'Handover' | 'INFO';
  payload: any;
  timestamp: number;
}

export interface IAgent {
  id: AgentId;
  status: AgentStatus;
  config: AgentConfig;
  
  receive(message: Message): Promise<void>;
  sendMessage(to: AgentId | TeamId, type: Message['type'], payload: any): Promise<void>;
  updateStatus(status: AgentStatus): void;
}

export interface IMessageBus {
  publish(message: Message): void;
  subscribe(agentId: AgentId, callback: (msg: Message) => void): void;
  unsubscribe(agentId: AgentId): void;
}
