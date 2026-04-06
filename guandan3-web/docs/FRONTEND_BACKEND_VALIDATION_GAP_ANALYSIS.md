# 前端与后端牌型验证逻辑对比分析

**生成日期**: 2026-04-01
**分析范围**: `analyzeMove` (前端) vs `validate_guandan_move` (后端)

---

## 📋 执行摘要

### 关键发现

| 问题类别 | 严重程度 | 描述 |
|----------|----------|------|
| **牌型识别不一致** | 🔴 HIGH | 后端只检查炸弹，其他牌型完全依赖前端 |
| **级牌值处理不一致** | 🔴 HIGH | 前端有级牌特殊值(50/60)，后端使用原始值比较 |
| **逢人配规则缺失** | 🔴 HIGH | 前端支持逢人配，后端完全不支持 |
| **顺子/连对规则** | 🟡 MEDIUM | 前端排除2和王，后端未验证 |
| **三带二规则** | 🟡 MEDIUM | 前端识别三带二，后端未验证 |
| **连三/连对** | 🟡 MEDIUM | 前端识别，后端未验证 |

---

## 1. 牌型识别对比

### 1.1 前端 (`analyzeMove` - rules.ts:110-255)

| 牌型 | 识别逻辑 | primaryValue 计算 |
|------|----------|-------------------|
| **单张** | 1张牌 | `getCardValue(card, levelRank)` |
| **对子** | 2张相同原始值 | 级牌对子用最大值，否则用getCardValue |
| **三张** | 3张相同原始值 | 级牌三张用最大值，否则用getCardValue |
| **炸弹** | 4+张相同原始值 | 王炸=10000, 级牌炸弹=5000*张数+主值, 普通=1000*张数+主值 |
| **顺子** | 5+张连续, 不含2和王 | 最大牌的原始值 |
| **连对** | 3对+连续对子 | 最大对子的原始值 |
| **连三** | 2组+连续三张 | 最大三张的原始值 |
| **三带二** | 3张相同+2张相同 | 三张的getCardValue |

### 1.2 后端 (`validate_guandan_move` - add_move_validation_fixed.sql)

| 牌型 | 识别逻辑 | 验证方式 |
|------|----------|----------|
| **炸弹** | 4+张, group by count>=4 | ✅ 检测炸弹 |
| **其他牌型** | **无** | ❌ **完全依赖前端** |

### 1.3 差异分析

```
前端: 完整牌型识别系统
  ├── 单张、对子、三张
  ├── 顺子、连对、连三
  ├── 三带二
  └── 炸弹（王炸、级牌炸弹、普通炸弹）

后端: 仅炸弹验证
  ├── 炸弹检测（4+张相同）
  └── 炸弹对炸弹比较

结论: 后端存在严重的验证盲区
```

---

## 2. 卡牌值处理对比

### 2.1 前端 `getCardValue` (rules.ts:49-63)

```typescript
export function getCardValue(card: Card, levelRank: number): number {
  // 大小王
  if (card.suit === 'J') {
    return card.rank === 'hr' ? 200 : 100
  }

  // 级牌 - 大于A（掼蛋核心规则）
  if (card.val === levelRank) {
    // 红桃级牌逢人配，值最大
    return card.suit === 'H' ? 60 : 50  // ✅ 级牌特殊值
  }

  // 普通牌：A=14, K=13, ..., 2=2
  return card.val
}
```

**前端卡牌值排序**:
```
红王(200) > 黑王(100) > 红桃级牌(60) > 其他级牌(50) > A(14) > K(13) > ... > 2(2)
```

### 2.2 后端卡牌值处理 (add_move_validation_fixed.sql:86-94)

```sql
-- 直接使用原始值进行比较
select max((card->>'val')::int)
into v_my_max_val
from jsonb_array_elements(v_cards) as card;

select max((card->>'val')::int)
into v_last_max_val
from jsonb_array_elements(v_last_cards) as card;

return v_my_max_val > v_last_max_val;
```

**后端卡牌值**: 直接使用 `card.val`，**无级牌特殊处理**

### 2.3 差异影响

| 场景 | 前端行为 | 后端行为 | 结果 |
|------|----------|----------|------|
| 级牌对子 vs A对 | 级牌(50/60) > A(14) ✅ | 使用原始值比较 ❌ | 不一致 |
| 红桃级牌 vs 其他级牌 | 红桃(60) > 其他(50) ✅ | 相同原始值 ❌ | 不一致 |
| 级牌炸弹 vs 普通炸弹 | 级牌(5000*N) > 普通(1000*N) ✅ | 相同张数比较原始值 ❌ | 不一致 |

---

## 3. 炸弹识别对比

### 3.1 前端炸弹逻辑 (rules.ts:147-165)

```typescript
// 1. 王炸（4张王，最大炸弹）
if (cards.length === 4 && hasJoker && !hasLevel) {
  return { type: 'bomb', cards, primaryValue: 10000 }
}

// 2. 级牌炸弹（4张级牌，红桃级牌+其他花色级牌）
if (cards.length >= 4 && hasLevel && uniqueRawVals.length === 1) {
  const primaryValue = 5000 * cards.length + values[values.length - 1]
  return { type: 'bomb', cards, primaryValue }
}

// 3. 普通炸弹（4张及以上相同）
if (cards.length >= 4 && uniqueRawVals.length === 1) {
  const primaryValue = 1000 * cards.length + values[values.length - 1]
  return { type: 'bomb', cards, primaryValue }
}
```

**前端炸弹比较**:
```
王炸(10000) > 6张级牌炸弹(30000+) > 5张级牌炸弹(25000+) > 4张级牌炸弹(20000+) > 6张普通炸弹(6000+) > ... > 4张普通炸弹(4000+)
```

### 3.2 后端炸弹逻辑 (add_move_validation_fixed.sql:52-98)

```sql
-- 炸弹检查（4张及以上相同点数）
v_is_bomb := v_card_count >= 4 and (
  select count(*)
  from jsonb_array_elements(v_cards) as card
  group by card->>'val'
  having count(*) >= 4
  limit 1
) > 0;

-- 炸弹对炸弹：更大的炸弹可以压更小的炸弹
if v_is_bomb and v_last_is_bomb then
  -- 张数更多的赢
  if v_card_count > v_last_card_count then
    return true;
  end if;
  -- 张数相同时，比较点数
  if v_card_count = v_last_card_count then
    -- ❌ 直接使用原始值比较，无级牌特殊处理
    return v_my_max_val > v_last_max_val;
  end if;
  return false;
end if;
```

### 3.3 差异

| 特性 | 前端 | 后端 | 一致性 |
|------|------|------|--------|
| 王炸检测 | ✅ 4张王 | ❌ 只检查4张相同 | ❌ |
| 级牌炸弹检测 | ✅ hasLevel | ❌ 无 | ❌ |
| 级牌炸弹优先级 | ✅ 5000*张数 > 1000*张数 | ❌ 相同处理 | ❌ |
| 张数不同比较 | ✅ | ✅ | ✅ |
| 同张数比较 | ✅ 使用特殊值 | ❌ 使用原始值 | ❌ |

---

## 4. 逢人配规则对比

### 4.1 前端逢人配 (rules.ts:130-136)

```typescript
// 对子：使用原始值判断是否相同（级牌对子：红桃级牌+其他花色级牌=有效对子）
if (cards.length === 2 && uniqueRawVals.length === 1) {
  // 级牌对子使用最大值（逢人配的红桃级牌）
  const isLevelPair = rawVals[0] === levelRank
  const primaryValue = isLevelPair ? values[values.length - 1] : values[0]
  return { type: 'pair', cards, primaryValue }
}
```

**前端逢人配**: 红桃级牌可以配任意牌组成有效牌型

### 4.2 后端逢人配

```sql
-- ❌ 完全没有逢人配逻辑
```

### 4.3 差异

| 场景 | 前端 | 后端 | 一致性 |
|------|------|------|--------|
| 红桃级牌+任意牌 | ✅ 可组成对子/炸弹 | ❌ 不允许 | ❌ |
| 红桃级牌替代牌 | ✅ 逢人配 | ❌ 无此规则 | ❌ |

---

## 5. 顺子/连对规则对比

### 5.1 前端规则 (rules.ts:242-252)

```typescript
// 顺子（5张及以上连续，不能包含2和王）
if (cards.length >= 5 && !hasJoker) {
  const allUnique = uniqueRawVals.length === cards.length
  const isSeq = uniqueRawVals.every((v, i) => i === 0 || v === rawVals[i - 1] + 1)
  const noTwoOrBigTwo = rawVals.every((v) => v !== 15 && v !== 17)  // ❌ 排除2和王
  if (allUnique && isSeq && noTwoOrBigTwo) {
    return { type: 'straight', cards, primaryValue: rawVals[rawVals.length - 1] }
  }
}
```

### 5.2 后端规则

```sql
-- ❌ 完全没有顺子验证逻辑
-- "同牌数出牌，前端已验证具体牌型"
return true;
```

### 5.3 差异

| 规则 | 前端 | 后端 | 一致性 |
|------|------|------|--------|
| 最小长度 | 5张 | ❌ 未验证 | ❌ |
| 连续性 | ✅ 检查 | ❌ 未验证 | ❌ |
| 排除2和王 | ✅ 排除 | ❌ 未验证 | ❌ |

---

## 6. 三带二规则对比

### 6.1 前端规则 (rules.ts:167-185)

```typescript
// 三带二（3张相同+2张相同）
if (cards.length === 5) {
  const counts: Record<number, number> = {}
  for (const v of rawVals) counts[v] = (counts[v] || 0) + 1
  const countValues = Object.values(counts)

  // 检查是否有3张相同和2张相同
  if (countValues.includes(3) && countValues.includes(2) && countValues.length === 2) {
    const tripleVal = Object.keys(counts).find((v) => counts[Number(v)] === 3)
    if (tripleVal) {
      return { type: 'fullhouse', cards, primaryValue: getCardValue(tripleCards[0], levelRank) }
    }
  }
}
```

### 6.2 后端规则

```sql
-- ❌ 完全没有三带二验证逻辑
```

---

## 7. 风险评估

### 7.1 安全风险

| 风险 | 描述 | 严重程度 |
|------|------|----------|
| **客户端绕过** | 用户可以修改前端代码提交非法牌型 | 🔴 CRITICAL |
| **数据不一致** | 前后端对同一手牌的判断可能不同 | 🔴 HIGH |
| **游戏公平性** | 作弊者可以利用后端验证漏洞 | 🔴 HIGH |

### 7.2 具体攻击场景

1. **非法牌型提交**: 修改前端代码，提交不符合掼蛋规则的牌型
   ```javascript
   // 前端: 验证失败
   // 后端: 通过（因为只检查炸弹和牌数）
   ```

2. **级牌值滥用**: 将级牌当作普通牌使用
   ```javascript
   // 前端: 级牌=50/60，大于A(14)
   // 后端: 级牌=原始值(如2)，小于A(14)
   ```

3. **顺子包含2**: 提交包含2的"顺子"
   ```javascript
   // 前端: 2不能在顺子中
   // 后端: 未验证
   ```

---

## 8. 修复建议

### 8.1 短期修复（P0）

**在后端实现完整的牌型验证**

```sql
CREATE OR REPLACE FUNCTION public.validate_guandan_move_v2(
  p_payload jsonb,
  p_last_payload jsonb,
  p_level_rank int default 2
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  -- 添加卡牌值计算逻辑
  v_my_max_val int;
  v_last_max_val int;
  v_is_level_bomb boolean;
  v_last_is_level_bomb boolean;
BEGIN
  -- 1. 基本检查保持不变
  -- ...

  -- 2. 增强的炸弹检测
  -- 检测王炸
  v_is_bomb := v_card_count = 4 AND (
    SELECT COUNT(DISTINCT card->>'suit')
    FROM jsonb_array_elements(v_cards) AS card
    WHERE card->>'suit' = 'J'
  ) = 4;

  -- 检测级牌炸弹
  IF NOT v_is_bomb AND v_card_count >= 4 THEN
    v_is_bomb := EXISTS(
      SELECT 1 FROM jsonb_array_elements(v_cards) AS card
      WHERE (card->>'val')::int = p_level_rank
      GROUP BY card->>'val'
      HAVING COUNT(*) >= 4
    );
    v_is_level_bomb := v_is_bomb;
  END IF;

  -- 3. 顺子验证
  IF v_card_count >= 5 AND NOT v_is_bomb THEN
    -- 检查是否连续
    -- 检查是否包含2或王
    -- ...
  END IF;

  -- 4. 三带二验证
  IF v_card_count = 5 AND NOT v_is_bomb THEN
    -- 检查是否为3+2模式
    -- ...
  END IF;

  -- 5. 连对验证
  IF v_card_count >= 6 AND v_card_count % 2 = 0 AND NOT v_is_bomb THEN
    -- 检查是否为连续对子
    -- ...
  END IF;

  -- 6. 增强的炸弹比较
  IF v_is_bomb AND v_last_is_bomb THEN
    -- 王炸最大
    -- 级牌炸弹 > 普通炸弹
    -- 同类型比较主值
    -- ...
  END IF;

  -- ...
END;
$$;
```

### 8.2 中期修复（P1）

1. **添加前端验证结果签名**: 前端对验证结果进行签名，后端验证签名
2. **增加审计日志**: 记录所有可疑的出牌尝试
3. **服务器端牌型识别**: 在Edge Function中实现完整的牌型识别

### 8.3 长期修复（P2）

1. **重构验证逻辑**: 将前端和后端的验证逻辑抽取为共享库
2. **添加单元测试**: 为每个牌型添加完整的测试用例
3. **性能优化**: 缓存牌型识别结果

---

## 9. 测试矩阵

### 9.1 需要测试的场景

| # | 场景 | 前端 | 后端 | 修复后 |
|---|------|------|------|--------|
| 1 | 单张 vs 单张 | ✅ | ⚠️ | ✅ |
| 2 | 对子 vs 对子 | ✅ | ⚠️ | ✅ |
| 3 | 级牌对子 vs A对 | ✅ | ❌ | ✅ |
| 4 | 三带二 vs 三带二 | ✅ | ❌ | ✅ |
| 5 | 顺子 vs 顺子 | ✅ | ❌ | ✅ |
| 6 | 顺子含2 | ❌ | ⚠️ | ❌ |
| 7 | 连对 vs 连对 | ✅ | ❌ | ✅ |
| 8 | 连三 vs 连三 | ✅ | ❌ | ✅ |
| 9 | 王炸 | ✅ | ⚠️ | ✅ |
| 10 | 级牌炸弹 vs 普通炸弹 | ✅ | ❌ | ✅ |
| 11 | 炸弹 vs 炸弹(同张数) | ✅ | ⚠️ | ✅ |
| 12 | 炸弹 vs 炸弹(不同张数) | ✅ | ✅ | ✅ |
| 13 | 逢人配对子 | ✅ | ❌ | ✅ |
| 14 | 逢人配炸弹 | ✅ | ❌ | ✅ |

---

## 10. 总结

### 当前状态

- **前端验证**: ✅ 完整实现，包含所有掼蛋规则
- **后端验证**: ❌ 严重不足，仅检查炸弹和牌数
- **一致性**: 🔴 存在多个关键不一致

### 立即行动

1. **优先级P0**: 修复后端牌型验证逻辑
2. **优先级P1**: 添加级牌特殊值处理
3. **优先级P2**: 实现逢人配规则

### 验证策略

- 修复后运行完整测试矩阵
- 确保前后端对同一手牌的判断100%一致
- 添加回归测试防止未来出现不一致
