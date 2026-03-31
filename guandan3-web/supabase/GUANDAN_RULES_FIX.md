# 掼蛋游戏规则修复方案

## 问题分析

经过全面检查，发现以下掼蛋规则实现问题：

### 1. 逢人配规则未实现 ❌
**掼蛋特色**：红桃级牌（如红桃2）可以配任意牌组成炸弹或其他牌型
- 当前代码没有实现这个核心规则
- 导致红桃级牌无法发挥特殊作用

### 2. 级牌值计算错误 ❌
**掼蛋规则**：级牌 > A > K > Q > J > 10 > ... > 2
- 当前代码：级牌用基础值（如2=2），导致级牌是最小的
- 应该：级牌=50，红桃级牌=60

### 3. 钢板规则未实现 ❌
**掼蛋规则**：两个连续的三张对（如333444）
- 当前代码：只有sequenceTriples，没有单独的钢板类型
- 钢板可以压三张、对子等，但不能压炸弹

### 4. 四带二被错误归类 ❌
**掼蛋规则**：四带二是独立牌型，不是炸弹
- 当前代码：将四带二归类为bomb
- 四带二只能被更大的四带二或炸弹压

### 5. 炸弹大小计算错误 ❌
**掼蛋规则**：
- 王炸（4张王）> 级牌炸弹（4张级牌）> 普通炸弹
- 同张数的炸弹：级牌炸弹 > 普通炸弹
- 当前代码：没有正确区分级牌炸弹

### 6. 顺子/连对不能含2和王 ❌
**掼蛋规则**：顺子和连对不能包含2和级牌
- 当前代码：hasJoker && hasLevel 排除，但没有排除2（当2不是级牌时）

## 修复优先级

| 优先级 | 问题 | 影响 |
|--------|------|------|
| P0 | 级牌值计算 | AI无法正确评估牌力 |
| P0 | get_ai_hand修复 | AI手牌不更新（已修复）|
| P1 | 炸弹大小计算 | 炸弹比较错误 |
| P1 | 逢人配规则 | 红桃级牌无法发挥 |
| P2 | 四带二分类 | 牌型判断错误 |
| P2 | 钢板规则 | 缺少牌型 |
| P2 | 顺子/连对规则 | 2不应该在顺子中 |

## 立即修复

### 修复1：级牌值计算
```typescript
export function getCardValue(card: Card, levelRank: number): number {
  // 大小王
  if (card.suit === 'J') {
    return card.rank === 'hr' ? 200 : 100;
  }

  // 级牌 - 大于A
  if (card.val === levelRank) {
    return card.suit === 'H' ? 60 : 50; // 红桃级牌 > 其他级牌
  }

  // 普通牌
  return card.val;
}
```

### 修复2：炸弹正确识别和比较
```typescript
// 先检测王炸（4张王）
if (cards.length === 4 && cards.every(c => c.suit === 'J')) {
  return { type: 'bomb', cards, primaryValue: 10000 };
}

// 再检测普通炸弹（4+张相同）
if (cards.length >= 4 && uniqueValues.length === 1) {
  const value = values[0];
  // 级牌炸弹加成
  const isLevelBomb = cards.some(c => c.val === levelRank);
  const bombBase = isLevelBomb ? 5000 : 1000;
  return {
    type: 'bomb',
    cards,
    primaryValue: bombBase * cards.length + value
  };
}
```

### 修复3：顺子/连对排除2
```typescript
// 顺子不能含2（除非2是级牌）
const hasNonLevelTwo = cards.some(c => c.val === 2 && c.val !== levelRank);
if (hasNonLevelTwo) return null;
```

## 验证方法

1. 级牌应该大于A
2. 红桃级牌应该大于其他级牌
3. 4张王是最大炸弹
4. 4张级牌 > 4张普通牌
5. 红桃级牌可以配任意牌
