import { BaseAgent } from './BaseAgent';
import { AgentConfig, Task, AgentStatus } from './types';

interface GuanDanMove {
  type: 'pass' | 'single' | 'pair' | 'triple' | 'bomb' | 'straight' | 'plane' | 'rocket';
  cards: string[];
}

export class WorkerAgent extends BaseAgent {
  constructor(config: AgentConfig) {
    super(config);
  }

  // Implementation of task processing logic
  protected async processTask(task: Task): Promise<void> {
    this.updateStatus(AgentStatus.BUSY);
    
    try {
      let move: GuanDanMove;

      if (task.type === 'DecideMove') {
        move = this.decideMove(task.payload);
      } else {
        move = { type: 'pass', cards: [] };
      }

      const result = {
        taskId: task.id,
        status: 'COMPLETED' as const,
        output: { move }
      };

      this.updateStatus(AgentStatus.IDLE);
      await this.sendMessage('SYSTEM', 'TASK_RESULT', result);
    } catch (error) {
      const errorResult = {
        taskId: task.id,
        status: 'FAILED' as const,
        output: { move: { type: 'pass' as const, cards: [] } },
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      this.updateStatus(AgentStatus.IDLE);
      await this.sendMessage('SYSTEM', 'TASK_RESULT', errorResult);
    }
  }

  private decideMove(payload: any): GuanDanMove {
    const { hand, lastAction, levelRank, seatNo, playersCardCounts } = payload;

    if (!hand || hand.length === 0) {
      return { type: 'pass', cards: [] };
    }

    if (!lastAction || lastAction.type === 'pass') {
      return this.makeFirstMove(hand, levelRank);
    }

    const counterMove = this.findCounterMove(hand, lastAction, levelRank);
    return counterMove || { type: 'pass', cards: [] };
  }

  private makeFirstMove(hand: string[], levelRank: number): GuanDanMove {
    const sortedHand = this.sortCards(hand);
    
    const bombs = this.findBombs(sortedHand);
    if (bombs.length > 0 && Math.random() > 0.7) {
      return { type: 'bomb', cards: bombs[0] };
    }

    const straights = this.findStraights(sortedHand, 5);
    if (straights.length > 0 && Math.random() > 0.6) {
      return { type: 'straight', cards: straights[0] };
    }

    const pairs = this.findPairs(sortedHand);
    if (pairs.length > 0) {
      return { type: 'pair', cards: pairs[0] };
    }

    return { type: 'single', cards: [sortedHand[0]] };
  }

  private findCounterMove(hand: string[], lastAction: any, levelRank: number): GuanDanMove | null {
    const sortedHand = this.sortCards(hand);

    if (lastAction.type === 'single') {
      const higherCards = sortedHand.filter(card => 
        this.compareCards(card, lastAction.cards[0], levelRank) > 0
      );
      if (higherCards.length > 0) {
        return { type: 'single', cards: [higherCards[0]] };
      }
    }

    if (lastAction.type === 'pair') {
      const pairs = this.findPairs(sortedHand);
      for (const pair of pairs) {
        if (this.compareCards(pair[0], lastAction.cards[0], levelRank) > 0) {
          return { type: 'pair', cards: pair };
        }
      }
    }

    if (lastAction.type === 'bomb') {
      const bombs = this.findBombs(sortedHand);
      for (const bomb of bombs) {
        if (this.compareCards(bomb[0], lastAction.cards[0], levelRank) > 0) {
          return { type: 'bomb', cards: bomb };
        }
      }
    }

    const bombs = this.findBombs(sortedHand);
    if (bombs.length > 0 && lastAction.type !== 'rocket') {
      return { type: 'bomb', cards: bombs[0] };
    }

    return null;
  }

  private sortCards(cards: string[]): string[] {
    const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    return [...cards].sort((a, b) => {
      const rankA = a.slice(0, -1);
      const rankB = b.slice(0, -1);
      return rankOrder.indexOf(rankA) - rankOrder.indexOf(rankB);
    });
  }

  private compareCards(card1: string, card2: string, levelRank: number): number {
    const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
    const levelRanks = ['S', 'H', 'C', 'D'];
    
    const rank1 = card1.slice(0, -1);
    const rank2 = card2.slice(0, -1);
    const suit1 = card1.slice(-1);
    const suit2 = card2.slice(-1);

    const levelRankIndex = levelRanks[levelRank - 1] || 'S';
    
    if (rank1 === levelRankIndex && rank2 !== levelRankIndex) return 1;
    if (rank2 === levelRankIndex && rank1 !== levelRankIndex) return -1;
    
    return rankOrder.indexOf(rank1) - rankOrder.indexOf(rank2);
  }

  private findPairs(cards: string[]): string[][] {
    const pairs: string[][] = [];
    const cardMap = new Map<string, string[]>();

    cards.forEach(card => {
      const rank = card.slice(0, -1);
      if (!cardMap.has(rank)) {
        cardMap.set(rank, []);
      }
      cardMap.get(rank)!.push(card);
    });

    cardMap.forEach((sameRankCards) => {
      if (sameRankCards.length >= 2) {
        pairs.push(sameRankCards.slice(0, 2));
      }
    });

    return pairs;
  }

  private findBombs(cards: string[]): string[][] {
    const bombs: string[][] = [];
    const cardMap = new Map<string, string[]>();

    cards.forEach(card => {
      const rank = card.slice(0, -1);
      if (!cardMap.has(rank)) {
        cardMap.set(rank, []);
      }
      cardMap.get(rank)!.push(card);
    });

    cardMap.forEach((sameRankCards) => {
      if (sameRankCards.length === 4) {
        bombs.push(sameRankCards);
      }
    });

    return bombs;
  }

  private findStraights(cards: string[], minLength: number): string[][] {
    const rankOrder = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    const straights: string[][] = [];
    
    const rankMap = new Map<string, string[]>();
    cards.forEach(card => {
      const rank = card.slice(0, -1);
      if (!rankMap.has(rank)) {
        rankMap.set(rank, []);
      }
      rankMap.get(rank)!.push(card);
    });

    for (let i = 0; i <= rankOrder.length - minLength; i++) {
      let straightCards: string[] = [];
      let valid = true;

      for (let j = 0; j < minLength; j++) {
        const rank = rankOrder[i + j];
        if (!rankMap.has(rank) || rankMap.get(rank)!.length === 0) {
          valid = false;
          break;
        }
        straightCards.push(rankMap.get(rank)![0]);
      }

      if (valid) {
        straights.push(straightCards);
      }
    }

    return straights;
  }
}
