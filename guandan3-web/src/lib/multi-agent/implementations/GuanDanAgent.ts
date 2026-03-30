import { WorkerAgent } from '../core/WorkerAgent';
import { AgentConfig, Task, AgentStatus, Message } from '../core/types';
import { decideMove, AIDifficulty } from '@/lib/game/ai';
import { Card } from '@/lib/store/game';
import { CardCounter } from '@/lib/game/cardCounter';
import { devError } from '@/lib/utils/devLog';

interface GuanDanTaskPayload {
  hand: Card[];
  lastAction: { type: 'play' | 'pass'; cards?: Card[]; seatNo?: number } | null;
  levelRank: number;
  seatNo: number;
  playersCardCounts?: number[]; // Added optional counts from system
}

export class GuanDanAgent extends WorkerAgent {
  private cardCounter: CardCounter | null = null;
  private currentLevel: number = 2;
  private playersCardCounts: number[] = [27, 27, 27, 27];
  private difficulty: AIDifficulty = 'medium';

  constructor(config: AgentConfig) {
    super(config);
    // Set difficulty from config if provided
    if (
      config.difficulty &&
      ['easy', 'medium', 'hard'].includes(config.difficulty)
    ) {
      this.difficulty = config.difficulty as AIDifficulty;
    }
  }

  // Override to handle game events for card counting
  public async receive(message: Message): Promise<void> {
    await super.receive(message);

    // Handle TASK_ASSIGN messages (task processing)
    if (message.type === 'TASK_ASSIGN') {
      await this.processTask(message.payload);
      return; // TASK_ASSIGN handled by processTask, don't process as game event
    }

    // Listen for game events (e.g., played cards)
    if (message.type === 'GAME_ACTION') {
      const { action, levelRank } = message.payload;

      // Update level if changed
      if (levelRank && levelRank !== this.currentLevel) {
        this.currentLevel = levelRank;
        // Reset counter on level change (new game usually)
        this.cardCounter = new CardCounter(this.currentLevel);
        // Reset card counts
        this.playersCardCounts = [27, 27, 27, 27];
      }

      // Initialize counter if needed
      if (!this.cardCounter) {
        this.cardCounter = new CardCounter(this.currentLevel);
      }

      // Record played cards and update counts
      if (action && action.type === 'play' && action.cards) {
        this.cardCounter.recordPlayedCards(action.cards);

        // Update card count for the player who played
        if (
          typeof action.seatNo === 'number' &&
          action.seatNo >= 0 &&
          action.seatNo < 4
        ) {
          this.playersCardCounts[action.seatNo] = Math.max(
            0,
            this.playersCardCounts[action.seatNo] - action.cards.length
          );
        }
      }
    } else if (message.type === 'GAME_START') {
      const { levelRank } = message.payload;
      this.currentLevel = levelRank || 2;
      this.cardCounter = new CardCounter(this.currentLevel);
      this.playersCardCounts = [27, 27, 27, 27];
    }
  }

  // Helper to broadcast thinking logs
  private async logThinking(message: string): Promise<void> {
    await this.sendMessage('BROADCAST', 'AGENT_LOG', {
      agentId: this.id,
      message,
      timestamp: Date.now(),
    });
  }

  protected async processTask(task: Task): Promise<void> {
    if (task.type !== 'DecideMove') {
      await super.processTask(task);
      return;
    }

    this.updateStatus(AgentStatus.BUSY);

    const payload = task.payload as GuanDanTaskPayload;

    // Update internal card counts if provided in payload (source of truth)
    if (payload.playersCardCounts && payload.playersCardCounts.length === 4) {
      this.playersCardCounts = [...payload.playersCardCounts];
    }

    // Ensure counter is initialized (fallback)
    if (!this.cardCounter) {
      this.cardCounter = new CardCounter(payload.levelRank);
    }

    // AI思考时间：快速响应模式（测试/开发优化）
    // easy: 0.1-0.2秒, medium: 0.05-0.1秒, hard: 0-0.05秒
    let minTime = 0;
    let maxTime = 50;
    if (this.difficulty === 'easy') {
      minTime = 100;
      maxTime = 200;
    } else if (this.difficulty === 'medium') {
      minTime = 50;
      maxTime = 100;
    }
    const thinkingTime = Math.floor(
      Math.random() * (maxTime - minTime) + minTime
    );
    await new Promise((resolve) => setTimeout(resolve, thinkingTime));

    try {
      await this.logThinking(
        `收到任务: 思考出牌 (手牌: ${payload.hand.length}, 剩余: ${this.playersCardCounts.join(',')})`
      );

      // Execute existing AI logic with CardCounter and PlayerCardCounts
      const lastPlayCards =
        payload.lastAction?.type === 'play'
          ? payload.lastAction.cards || null
          : null;
      const isLeading =
        !payload.lastAction || payload.lastAction.type === 'pass';

      const move = decideMove(
        payload.hand,
        lastPlayCards,
        payload.levelRank,
        this.difficulty,
        isLeading
        // Note: teammateCards and teammateSituation are optional and not used in current implementation
      );

      await this.logThinking(
        `决策完成: ${move.type === 'pass' ? '过牌' : `出牌 (${move.cards?.length}张)`}`
      );

      const result = {
        taskId: task.id,
        output: {
          move,
          agentId: this.id,
          seatNo: payload.seatNo,
        },
        status: 'COMPLETED',
      };

      await this.sendMessage('SYSTEM', 'TASK_RESULT', result);
    } catch (error) {
      devError('[GuanDanAgent] processTask error:', error);
      await this.logThinking(`发生错误: ${String(error)}`);
      await this.sendMessage('SYSTEM', 'TASK_RESULT', {
        taskId: task.id,
        error: String(error),
        status: 'FAILED',
      });
    } finally {
      this.updateStatus(AgentStatus.IDLE);
    }
  }
}
