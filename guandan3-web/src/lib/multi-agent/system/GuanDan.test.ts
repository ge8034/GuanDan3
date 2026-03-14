import { TeamManager } from '../system/TeamManager';
import { TaskDispatcher } from '../system/TaskDispatcher';
import { TaskPlanner } from '../system/TaskPlanner';
import { AgentConfig, AgentStatus, Task } from '../core/types';
import { MessageBus } from '../core/MessageBus';
import { describe, it, expect, beforeEach } from 'vitest';

describe('GuanDan Multi-Agent System Integration', () => {
  let teamManager: TeamManager;
  let dispatcher: TaskDispatcher;
  let planner: TaskPlanner;

  beforeEach(() => {
    teamManager = new TeamManager();
    dispatcher = new TaskDispatcher(teamManager);
    planner = new TaskPlanner();
    
    // Create GuanDan Team
    const agents: AgentConfig[] = [
      {
        id: 'ai-player-1',
        role: 'GuanDanAI',
        capabilities: [{ type: 'DecideMove', level: 10 }],
        maxLoad: 1
      },
      {
        id: 'ai-player-2',
        role: 'GuanDanAI',
        capabilities: [{ type: 'DecideMove', level: 10 }],
        maxLoad: 1
      }
    ];
    teamManager.createTeam('guandan-table-1', agents);
  });

  it('should process GuanDan turn decision', async () => {
    const turnTask: Task = {
      id: 'turn-1',
      type: 'GuanDanTurn',
      priority: 10,
      payload: {
        hand: [{ id: 1, suit: 'H', rank: '2', val: 2 }],
        lastAction: null,
        levelRank: 2,
        seatNo: 1
      },
      dependencies: [],
      status: 'PENDING',
      createdAt: Date.now()
    };

    const subtasks = planner.decompose(turnTask);
    expect(subtasks.length).toBe(1);
    expect(subtasks[0].type).toBe('DecideMove');

    await dispatcher.submitTasks(subtasks);

    // Wait for AI thinking time (>500ms) + message latency
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = dispatcher.getTaskResult('turn-1-decide');
    expect(result).toBeDefined();
    expect(result.status).toBe('COMPLETED');
    expect(result.output.move).toBeDefined();
    // Since hand has 1 card and no lastAction, should play single
    expect(result.output.move.type).toBe('play');
  });
});
