import { Card } from '@/lib/store/game';
import { getCardValue } from '@/lib/game/rules';

export class CardCounter {
  // Map of Card Value -> Count Remaining
  // We track values, not suits, as suits don't matter much in GuanDan except for level cards
  private remainingCounts: Map<number, number> = new Map();
  private levelRank: number;

  constructor(levelRank: number) {
    this.levelRank = levelRank;
    this.reset();
  }

  public reset(): void {
    this.remainingCounts.clear();
    
    // Initialize full deck (2 decks for GuanDan)
    // 2-10, J, Q, K, A (Values 2-14) * 8 cards (2 decks * 4 suits)
    for (let v = 2; v <= 14; v++) {
      this.remainingCounts.set(v, 8);
    }
    
    // Jokers: 2 Red, 2 Black
    // In our system, Red Joker val is usually very high (e.g. 200), Black is 100
    // See rules.ts getCardValue logic.
    // Let's assume standard values for tracking: 
    // Small Joker: 100 (or similar high val)
    // Big Joker: 200
    this.remainingCounts.set(100, 2); // Small
    this.remainingCounts.set(200, 2); // Big
  }

  public recordPlayedCards(cards: Card[]): void {
    cards.forEach(c => {
      const val = this.getTrackingValue(c);
      const current = this.remainingCounts.get(val) || 0;
      if (current > 0) {
        this.remainingCounts.set(val, current - 1);
      }
    });
  }

  // Get effective value for tracking
  private getTrackingValue(card: Card): number {
    if (card.suit === 'J') {
      return card.rank === 'hr' ? 200 : 100;
    }
    // Level cards are special? 
    // Usually we just track by natural value, but level cards are critical.
    // Let's track by natural value (2..14), but logic using this counter needs to know which is level.
    return card.val;
  }

  public getRemainingCount(val: number): number {
    return this.remainingCounts.get(val) || 0;
  }

  public getLevelCardCount(): number {
    return this.remainingCounts.get(this.levelRank) || 0;
  }

  public getBigJokerCount(): number {
    return this.remainingCounts.get(200) || 0;
  }

  public getSmallJokerCount(): number {
    return this.remainingCounts.get(100) || 0;
  }
}
