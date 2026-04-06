# ai-utils 使用指南

## 概述

`ai-utils` 模块提供了 AI 决策所需的卡牌处理和分析功能。经过重构后，代码按职责分离为多个子模块，提高了可维护性和可测试性。

## 导入方式

### 方式一：从主模块导入（向后兼容）

```typescript
import {
  sortCards,
  filterSafeCards,
  countStrongCards,
  analyzeCardDistribution,
  estimateMovesToClear,
  calculateHandStrength,
  calculateControlScore,
  assessRisk
} from '@/lib/game/ai-utils';
```

### 方式二：从子模块导入（推荐）

```typescript
// 排序功能
import { sortCards } from '@/lib/game/ai-utils/sorting';

// 过滤功能
import { filterSafeCards, countStrongCards } from '@/lib/game/ai-utils/filtering';

// 分析功能
import {
  analyzeCardDistribution,
  estimateMovesToClear,
  analyzeMultipleHands
} from '@/lib/game/ai-utils/analysis';

// 评估功能
import {
  calculateHandStrength,
  calculateControlScore,
  assessRisk
} from '@/lib/game/ai-utils/evaluation';

// 共享类型和常量
import {
  CardDistribution,
  HandStrengthParams,
  ControlScoreParams,
  SUIT_ORDER,
  TYPE_BONUS
} from '@/lib/game/ai-utils';
```

## 功能说明

### 1. 卡牌排序（sorting）

```typescript
import { sortCards } from '@/lib/game/ai-utils/sorting';

const cards = [
  { id: 1, suit: 'H', rank: 'A', val: 14 },
  { id: 2, suit: 'S', rank: 'K', val: 13 },
  // ...
];

// 按掼蛋规则排序：先按牌值（大到小），牌值相同时按花色排序
const sorted = sortCards(cards, 10); // 10 是当前级牌点数
```

### 2. 卡牌过滤（filtering）

```typescript
import { filterSafeCards, countStrongCards } from '@/lib/game/ai-utils/filtering';

const cards = [ /* ... */ ];

// 过滤安全卡牌（非级牌、非王牌）
const safeCards = filterSafeCards(cards, 10);

// 统计强牌数量（J 以上，不包括王牌）
const strongCount = countStrongCards(cards, 10);
```

### 3. 手牌分析（analysis）

```typescript
import {
  analyzeCardDistribution,
  estimateMovesToClear,
  analyzeMultipleHands
} from '@/lib/game/ai-utils/analysis';

const cards = [ /* ... */ ];

// 分析卡牌分布
const distribution = analyzeCardDistribution(cards, 10);
console.log(distribution.suitCounts);   // 花色计数
console.log(distribution.valueCounts);  // 点数计数
console.log(distribution.hasJokers);    // 是否有王牌
console.log(distribution.strongCards);  // 强牌数量
console.log(distribution.weakCards);    // 弱牌数量

// 估计剩余出牌次数
const moves = estimateMovesToClear(cards, 10);

// 批量分析多手牌
const hands = [[ /* ... */ ], [ /* ... */ ]];
const results = analyzeMultipleHands(hands, 10);
```

### 4. 出牌评估（evaluation）

```typescript
import {
  calculateHandStrength,
  calculateControlScore,
  assessRisk
} from '@/lib/game/ai-utils/evaluation';

// 计算手牌强度
const strength = calculateHandStrength({
  cardCount: 5,
  playedValue: 14,
  playedType: 'pair'
});

// 计算控制分数
const controlScore = calculateControlScore({
  cardCount: 10,
  strongCards: 5,
  hasJokers: true,
  levelRank: 10
});

// 评估出牌风险
const risk = assessRisk(
  moveCards,    // 要打出的卡牌
  handCards,    // 剩余手牌
  10,           // 当前级牌点数
  true          // 是否领出
);
```

## 常量说明

```typescript
import {
  SUIT_ORDER,
  TYPE_BONUS,
  STRONG_CARD_THRESHOLD,
  WEAK_CARD_THRESHOLD,
  MAX_SAFE_CARDS
} from '@/lib/game/ai-utils';

// 花色优先级：黑桃(4) > 红桃(3) > 梅花(2) > 方片(1) > Joker(0)
SUIT_ORDER = { S: 4, H: 3, C: 2, D: 1, J: 0 };

// 牌型加成系数
TYPE_BONUS = {
  single: 1,
  pair: 2,
  triple: 3,
  bomb: 8,
  straight: 4,
  fullHouse: 5,
  sequencePair: 6,
  sequenceTriple: 7,
  sequenceTripleWithWing: 9,
};

// 强牌阈值（J 及以上）
STRONG_CARD_THRESHOLD = 11;

// 弱牌阈值（5 及以下）
WEAK_CARD_THRESHOLD = 5;

// 最大安全牌数
MAX_SAFE_CARDS = 5;
```

## 性能优化

重构后的代码包含多个性能优化：

1. **卡牌值缓存**：`createCardValueCache()` 批量计算并缓存卡牌值，避免重复计算
2. **批量过滤**：`batchFilterCards()` 一次遍历完成多个过滤条件
3. **批量分析**：`analyzeMultipleHands()` 优化批量操作性能

```typescript
import {
  createCardValueCache,
  getCardValueWithCache,
  batchFilterCards
} from '@/lib/game/ai-utils';

const cards = [ /* ... */ ];

// 创建缓存
const cache = createCardValueCache(cards, 10);

// 使用缓存获取卡牌值
const value = getCardValueWithCache(cards[0], cache);

// 批量过滤
const { safeCards, strongCards, weakCards } = batchFilterCards(cards, 10, cache);
```

## 类型定义

```typescript
import type {
  CardValueCache,
  CardDistribution,
  HandStrengthParams,
  ControlScoreParams
} from '@/lib/game/ai-utils';

// 卡牌值缓存映射
type CardValueCache = Map<number, number>;

// 卡牌分布分析结果
interface CardDistribution {
  suitCounts: Record<string, number>;
  valueCounts: Record<number, number>;
  hasJokers: boolean;
  strongCards: number;
  weakCards: number;
}

// 手牌强度计算参数
interface HandStrengthParams {
  cardCount: number;
  playedValue: number;
  playedType: string;
}

// 控制分数参数
interface ControlScoreParams {
  cardCount: number;
  strongCards: number;
  hasJokers: boolean;
  levelRank: number;
}
```

## 最佳实践

1. **优先使用子模块导入**：提高代码可读性和 tree-shaking 效果
2. **复用缓存对象**：在同一上下文中多次计算时复用缓存
3. **使用批量操作**：处理多手牌时使用批量函数提升性能
4. **关注类型安全**：充分利用 TypeScript 类型定义

## 迁移指南

如果你正在使用旧的导入方式，无需担心：

```typescript
// 旧方式仍然有效
import { assessRisk } from '@/lib/game/ai-utils';

// 推荐新方式（但不强制）
import { assessRisk } from '@/lib/game/ai-utils/evaluation';
```

两种方式完全兼容，可以根据团队偏好选择。
