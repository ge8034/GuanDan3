# Multi-Agent System API Documentation

## Overview
This system implements a scalable, asynchronous Multi-Agent System (MAS) based on the Actor model. It supports dynamic team creation, intelligent task decomposition, and distributed task dispatching.

## Core Components

### 1. TeamManager
Responsible for managing agent lifecycles and team structures.

**API:**
- `createTeam(teamId: string, agentConfigs: AgentConfig[]): void`
  - Creates a new team with specified agents.
- `getAgentsInTeam(teamId: string): WorkerAgent[]`
  - Retrieves all agents in a team.
- `getAgent(agentId: string): WorkerAgent | undefined`
  - Retrieves a specific agent by ID.

### 2. TaskPlanner
Decomposes high-level goals into executable atomic tasks.

**API:**
- `decompose(task: Task): Task[]`
  - Recursively breaks down a task based on its type.
  - Currently supports `PlayGame` -> `DealCards`, `PlayTurn`, `EndGame`.

### 3. TaskDispatcher
Distributes tasks to available agents based on capability matching and load balancing.

**API:**
- `submitTasks(tasks: Task[]): Promise<void>`
  - Queues tasks for execution.
- `getTaskResult(taskId: string): any`
  - Retrieves the result of a completed task.

### 4. MessageBus
Asynchronous message passing infrastructure simulating network latency (<100ms).

**API:**
- `publish(message: Message): void`
- `subscribe(agentId: string, callback: Function): void`

## Usage Example

```typescript
import { TeamManager, TaskDispatcher, TaskPlanner } from '@/lib/multi-agent';

// 1. Setup System
const teamManager = new TeamManager();
const dispatcher = new TaskDispatcher(teamManager);
const planner = new TaskPlanner();

// 2. Create Team
teamManager.createTeam('alpha-team', [
  { id: 'agent-1', role: 'Worker', capabilities: [{ type: 'DealCards', level: 5 }], maxLoad: 1 },
  { id: 'agent-2', role: 'Analyst', capabilities: [{ type: 'PlayTurn', level: 8 }], maxLoad: 1 }
]);

// 3. Submit Task
const mainTask = { id: 'task-1', type: 'PlayGame', ... };
const subtasks = planner.decompose(mainTask);
await dispatcher.submitTasks(subtasks);
```

## Performance
- **Concurrency**: Tested with 100+ concurrent agents.
- **Latency**: Simulated message latency controlled via `MessageBus` (default 10ms).
- **Scalability**: Stateless dispatcher design allows for easy horizontal scaling.
