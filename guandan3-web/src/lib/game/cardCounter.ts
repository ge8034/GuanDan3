import { Card } from '@/lib/store/game';
import { getCardValue } from '@/lib/game/rules';

export interface CardAnalysis {
  totalRemaining: number;
  strongCardsRemaining: number;
  weakCardsRemaining: number;
  levelCardsRemaining: number;
  jokersRemaining: number;
  averageValue: number;
  distribution: Map<number, number>;
}

export interface OpponentHandPrediction {
  hasStrongCards: boolean;
  hasLevelCards: boolean;
  hasJokers: boolean;
  likelyBombCount: number;
  likelyTripleCount: number;
  likelyPairCount: number;
  estimatedStrength: number;
}

export class CardCounter {
  // Map of Card Value -> Count Remaining
  // We track values, not suits, as suits don't matter much in GuanDan except for level cards
  private remainingCounts: Map<number, number> = new Map();
  private levelRank: number;
  private playedCards: Card[] = [];

  constructor(levelRank: number) {
    this.levelRank = levelRank;
    this.reset();
  }

  public reset(): void {
    this.remainingCounts.clear();
    this.playedCards = [];
    
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
    this.playedCards.push(...cards);
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

  // Enhanced: Analyze remaining cards
  public analyzeRemainingCards(): CardAnalysis {
    let totalRemaining = 0;
    let strongCardsRemaining = 0;
    let weakCardsRemaining = 0;
    let totalValue = 0;
    const distribution = new Map<number, number>();

    Array.from(this.remainingCounts.entries()).forEach(([val, count]) => {
      if (count > 0) {
        totalRemaining += count;
        totalValue += val * count;
        distribution.set(val, count);

        // Classify cards
        if (val >= 200 || val === 100 || val === this.levelRank) {
          strongCardsRemaining += count;
        } else if (val <= 5) {
          weakCardsRemaining += count;
        }
      }
    })

    return {
      totalRemaining,
      strongCardsRemaining,
      weakCardsRemaining,
      levelCardsRemaining: this.getLevelCardCount(),
      jokersRemaining: this.getBigJokerCount() + this.getSmallJokerCount(),
      averageValue: totalRemaining > 0 ? totalValue / totalRemaining : 0,
      distribution
    };
  }

  // Enhanced: Predict opponent's hand based on remaining cards and their card count
  public predictOpponentHand(opponentCardCount: number): OpponentHandPrediction {
    const analysis = this.analyzeRemainingCards();
    const prediction: OpponentHandPrediction = {
      hasStrongCards: false,
      hasLevelCards: false,
      hasJokers: false,
      likelyBombCount: 0,
      likelyTripleCount: 0,
      likelyPairCount: 0,
      estimatedStrength: 0
    };

    // Estimate probability of having strong cards
    const strongCardProbability = analysis.strongCardsRemaining / analysis.totalRemaining;
    prediction.hasStrongCards = strongCardProbability > 0.3;
    prediction.hasLevelCards = analysis.levelCardsRemaining > 0 && Math.random() < (analysis.levelCardsRemaining / 8);
    prediction.hasJokers = analysis.jokersRemaining > 0 && Math.random() < (analysis.jokersRemaining / 4);

    // Estimate likely combinations based on card count
    if (opponentCardCount >= 4) {
      // Estimate bombs (4+ cards of same value)
      Array.from(analysis.distribution.entries()).forEach(([val, count]) => {
        if (count >= 4) {
          const probability = count / 8; // 8 is max count per value
          if (Math.random() < probability) {
            prediction.likelyBombCount++;
          }
        }
      })
    }

    // Estimate triples
    if (opponentCardCount >= 3) {
      Array.from(analysis.distribution.entries()).forEach(([val, count]) => {
        if (count >= 3) {
          const probability = count / 8;
          if (Math.random() < probability) {
            prediction.likelyTripleCount++;
          }
        }
      })
    }

    // Estimate pairs
    if (opponentCardCount >= 2) {
      Array.from(analysis.distribution.entries()).forEach(([val, count]) => {
        if (count >= 2) {
          const probability = count / 8;
          if (Math.random() < probability) {
            prediction.likelyPairCount++;
          }
        }
      })
    }

    // Calculate estimated strength (0-100)
    let strength = 0;
    if (prediction.hasJokers) strength += 30;
    if (prediction.hasLevelCards) strength += 20;
    if (prediction.hasStrongCards) strength += 15;
    strength += prediction.likelyBombCount * 10;
    strength += prediction.likelyTripleCount * 5;
    strength += Math.min(prediction.likelyPairCount * 2, 10);
    prediction.estimatedStrength = Math.min(strength, 100);

    return prediction;
  }

  // Enhanced: Check if a specific card type is likely to be beaten
  public canBeBeaten(cardValue: number, opponentCardCount: number): boolean {
    const analysis = this.analyzeRemainingCards();
    
    // Count cards that can beat the target
    let beatingCards = 0;
    Array.from(analysis.distribution.entries()).forEach(([val, count]) => {
      if (val > cardValue) {
        beatingCards += count;
      }
    })

    // If opponent has enough cards to potentially have beating cards
    const probability = beatingCards / analysis.totalRemaining;
    return probability > 0.2 && opponentCardCount >= 1;
  }

  // Enhanced: Get probability of opponent having specific card type
  public getProbabilityOfCardType(cardValue: number, opponentCardCount: number): number {
    const remaining = this.getRemainingCount(cardValue);
    const analysis = this.analyzeRemainingCards();
    
    if (analysis.totalRemaining === 0) return 0;
    
    // Simple probability based on remaining cards
    const baseProbability = remaining / analysis.totalRemaining;
    
    // Adjust based on opponent's card count
    const cardCountFactor = Math.min(opponentCardCount / 10, 1);
    
    return baseProbability * cardCountFactor;
  }

  // Enhanced: Get played cards history
  public getPlayedCards(): Card[] {
    return [...this.playedCards];
  }

  // Enhanced: Get cards played by specific value
  public getPlayedCardsByValue(value: number): Card[] {
    return this.playedCards.filter(c => this.getTrackingValue(c) === value);
  }

  // Enhanced: Check if a card type has been played recently
  public hasCardTypeBeenPlayedRecently(value: number, recentTurns: number = 5): boolean {
    const recentCards = this.playedCards.slice(-recentTurns * 4); // Assume 4 cards per turn
    return recentCards.some(c => this.getTrackingValue(c) === value);
  }
}
