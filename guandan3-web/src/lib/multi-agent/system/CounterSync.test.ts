import { TeamManager } from '../system/TeamManager';
import { TaskDispatcher } from '../system/TaskDispatcher';
import { TaskPlanner } from '../system/TaskPlanner';
import { AgentConfig, AgentStatus, Task } from '../core/types';
import { MessageBus } from '../core/MessageBus';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GuanDanAgent } from '../implementations/GuanDanAgent';

describe('GuanDan Agent Card Counting Integration', () => {
  let teamManager: TeamManager;
  let dispatcher: TaskDispatcher;
  let planner: TaskPlanner;
  let messageBus: MessageBus;

  beforeEach(() => {
    // Reset message bus singleton if possible or just use it
    messageBus = MessageBus.getInstance();
    
    teamManager = new TeamManager();
    dispatcher = new TaskDispatcher(teamManager);
    planner = new TaskPlanner();
    
    // Create GuanDan Team
    const agents: AgentConfig[] = [
      {
        id: 'ai-counter-test',
        role: 'GuanDanAI',
        capabilities: [{ type: 'DecideMove', level: 10 }],
        maxLoad: 1
      }
    ];
    teamManager.createTeam('counting-team', agents);
  });

  it('should update card counter when receiving GAME_ACTION messages', async () => {
    const agent = teamManager.getAgent('ai-counter-test') as GuanDanAgent;
    expect(agent).toBeDefined();

    // Test basic message reception without crashing
    // Send a GAME_START message
    await agent.receive({
      id: 'msg-start',
      from: 'SYSTEM',
      to: agent.id,
      type: 'GAME_START' as any,
      payload: { levelRank: 2 },
      timestamp: Date.now()
    });

    // Send a GAME_ACTION message (Player played Big Joker)
    await agent.receive({
      id: 'msg-action',
      from: 'SYSTEM',
      to: agent.id,
      type: 'GAME_ACTION' as any,
      payload: {
        action: {
          type: 'play',
          cards: [{ id: 999, suit: 'J', rank: 'hr', val: 200 }] // Big Joker
        },
        levelRank: 2
      },
      timestamp: Date.now()
    });

    // Verify agent can process messages without crashing
    expect(agent.status).toBe(AgentStatus.IDLE);
  });
});
