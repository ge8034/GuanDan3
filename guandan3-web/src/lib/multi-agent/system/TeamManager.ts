import { AgentId, AgentConfig, AgentStatus, TeamId, TaskId, Task } from '../core/types';
import { WorkerAgent } from '../core/WorkerAgent';
import { GuanDanAgent } from '../implementations/GuanDanAgent';

export class TeamManager {
  private teams: Map<TeamId, Set<AgentId>> = new Map();
  private agents: Map<AgentId, WorkerAgent> = new Map();

  constructor() {}

  // 1. TeamCreate Functionality
  public createTeam(teamId: TeamId, agentConfigs: AgentConfig[]): void {
    if (this.teams.has(teamId)) {
      throw new Error(`Team ${teamId} already exists.`);
    }

    const teamAgents = new Set<AgentId>();
    
    for (const config of agentConfigs) {
      if (!this.agents.has(config.id)) {
        // Factory logic based on role
        let agent: WorkerAgent;
        if (config.role === 'GuanDanAI') {
          agent = new GuanDanAgent(config);
        } else {
          agent = new WorkerAgent(config);
        }
        this.agents.set(config.id, agent);
      }
      teamAgents.add(config.id);
    }

    this.teams.set(teamId, teamAgents);
  }

  public getAgentsInTeam(teamId: TeamId): WorkerAgent[] {
    const agentIds = this.teams.get(teamId);
    if (!agentIds) return [];
    
    return Array.from(agentIds).map(id => this.agents.get(id)!);
  }

  public getAgent(agentId: AgentId): WorkerAgent | undefined {
    return this.agents.get(agentId);
  }
}
