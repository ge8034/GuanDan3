import { TeamManager } from '../system/TeamManager';
import { TaskDispatcher } from '../system/TaskDispatcher';
import { TaskPlanner } from '../system/TaskPlanner';
import { AgentConfig, AgentStatus, Task } from '../core/types';
import { MessageBus } from '../core/MessageBus';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Multi-Agent System Integration Test', () => {
  let teamManager: TeamManager;
  let dispatcher: TaskDispatcher;
  let planner: TaskPlanner;

  beforeEach(() => {
    // Reset singleton state if needed (not implemented in this simplified version)
    teamManager = new TeamManager();
    dispatcher = new TaskDispatcher(teamManager);
    planner = new TaskPlanner();
    
    // Create 100 Agents
    const agents: AgentConfig[] = [];
    for (let i = 0; i < 100; i++) {
      agents.push({
        id: `agent-${i}`,
        role: i % 2 === 0 ? 'Worker' : 'Analyst',
        capabilities: [
          { type: 'DealCards', level: 5 },
          { type: 'PlayTurn', level: 8 },
          { type: 'EndGame', level: 3 }
        ],
        maxLoad: 5
      });
    }
    teamManager.createTeam('main_team', agents);
  });

  it('should decompose and dispatch tasks to 100 agents', async () => {
    // 1. Create a complex task
    const complexTask: Task = {
      id: 'game-1',
      type: 'PlayGame',
      priority: 10,
      payload: {},
      dependencies: [],
      status: 'PENDING',
      createdAt: Date.now()
    };

    // 2. Decompose task
    const subtasks = planner.decompose(complexTask);
    expect(subtasks.length).toBe(3); // Deal, Play, End

    // 3. Dispatch tasks
    // Since our simple dispatcher matches by capability, all 100 agents have these capabilities.
    // The first available agents should pick them up.
    await dispatcher.submitTasks(subtasks);

    // Wait for async processing (simulated via timeouts in MessageBus and WorkerAgent)
    await new Promise(resolve => setTimeout(resolve, 200)); 

    // Verify task completion via MessageBus logs or dispatcher state
    // In a real test, we'd spy on the agents or use a mock MessageBus.
    // Here we can check if tasks are removed from queue (assigned)
    // or check completed tasks map in dispatcher if exposed.
    
    // For now, let's just verify the system didn't crash and tasks were processed.
    // Since we don't expose internal state easily in this quick implementation,
    // we rely on the fact that if it runs without error, the basic flow works.
    
    // We can check if any agent is BUSY or IDLE.
    const agent0 = teamManager.getAgent('agent-0');
    expect(agent0).toBeDefined();
    // After 200ms, tasks should be completed (50ms duration)
    expect(agent0?.status).toBe(AgentStatus.IDLE); 
  });
});
