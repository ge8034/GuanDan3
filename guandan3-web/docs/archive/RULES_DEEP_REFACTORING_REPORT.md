# rules.ts 深度重构报告

## 执行时间
2026-04-02

## 重构范围
`src/lib/game/rules.ts` - 核心游戏规则模块

## 重构目标
1. 提取牌型识别逻辑为独立函数
2. 创建辅助接口和数据结构
3. 简化主函数逻辑
4. 提升代码可读性和可维护性
5. 保持完整的API兼容性

---

## 重构详情

### 新增接口和类型

#### CardValueCounts 接口
```typescript
interface CardValueCounts {
  counts: Record<number, number>    // 原始值出现次数映射
  uniqueValues: number[]             // 唯一原始值数组
  sortedValues: number[]             // 排序后的原始值数组
}
```
**用途**: 统一管理卡牌值统计信息，避免重复计算

### 新增辅助函数

#### 1. countCardValues(rawVals: number[]): CardValueCounts
**功能**: 统计卡牌值出现次数
**优化**: 一次性计算并返回所有统计信息，避免多次遍历

#### 2. isConsecutive(values: number[]): boolean
**功能**: 检查数组是否为连续序列
**复用**: 被多个牌型识别函数共用，消除重复代码

#### 3. isValidStraight(uniqueRawVals, rawVals, cardCount): boolean
**功能**: 判断是否为有效顺子
**检查项**:
- 最小长度要求（5张）
- 所有牌值唯一
- 连续性检查
- 不包含2和王

#### 4. getSequencePairsMaxValue(counts, cardCount): number | null
**功能**: 判断是否为有效连对并返回最大值
**检查项**:
- 最小长度要求（3对）
- 必须为偶数张
- 所有牌都成对出现
- 连续性检查

#### 5. getSequenceTriplesMaxValue(counts, cardCount): number | null
**功能**: 判断是否为有效连三并返回最大值
**检查项**:
- 最小长度要求（2个三张）
- 必须为3的倍数张
- 所有牌都成三张出现
- 连续性检查

#### 6. getFullHousePrimaryValue(counts, cards, levelRank): number | null
**功能**: 判断是否为有效三带二并返回主值
**检查项**:
- 恰好5张牌
- 3张相同 + 2张相同
- 只有这两种模式

---

## 代码质量改进

### 重构前 analyzeMove 函数
- **行数**: 144行
- **复杂度**: 高
- **可读性**: 中等
- **可维护性**: 中等

### 重构后 analyzeMove 函数
- **行数**: 约100行（减少30%）
- **复杂度**: 中低
- **可读性**: 高
- **可维护性**: 高

### 改进对比

| 指标 | 重构前 | 重构后 | 改进 |
|------|--------|--------|------|
| 函数总行数 | 313 | 401 | +88（含新函数） |
| analyzeMove行数 | 144 | ~100 | -30% |
| 辅助函数数量 | 0 | 6 | +6 |
| 代码重复 | 高 | 低 | 显著改善 |
| 可测试性 | 中 | 高 | 显著提升 |

---

## 性能分析

### 时间复杂度
- **重构前**: O(n) - 多次遍历数组
- **重构后**: O(n) - 单次统计 + 函数调用
- **结论**: 无性能损失

### 空间复杂度
- **重构前**: O(n) - 创建多个临时数组
- **重构后**: O(n) - 使用统一的统计对象
- **结论**: 内存使用相当

### 优化亮点
1. **消除重复计算**: countCardValues一次计算，多处使用
2. **代码复用**: isConsecutive函数被多个牌型识别共用
3. **提前返回**: 各牌型识别函数快速判断，避免无效计算

---

## 测试结果

### 单元测试
```
✓ rules.test.ts: 14个测试全部通过
✓ tributeRules.test.ts: 49个测试全部通过
总计: 63个测试通过
```

### API兼容性
✅ 所有公开API保持不变
✅ 函数签名完全兼容
✅ 返回值类型一致
✅ 零功能回归

---

## 代码示例

### 重构前（连对检测逻辑）
```typescript
// ========== 连对（飞机带翅膀）==========
if (cards.length >= 6 && cards.length % 2 === 0) {
  const pairCounts: Record<number, number> = {}
  for (const v of rawVals) pairCounts[v] = (pairCounts[v] || 0) + 1
  const pairVals = Object.keys(pairCounts)
    .map((v) => Number(v))
    .filter((v) => pairCounts[v] === 2)
    .sort((a, b) => a - b)

  if (pairVals.length >= 3 && pairVals.length * 2 === cards.length) {
    let isSeq = true
    for (let i = 1; i < pairVals.length; i++) {
      if (pairVals[i] !== pairVals[i - 1] + 1) {
        isSeq = false
        break
      }
    }
    if (isSeq) {
      return {
        type: 'sequencePairs',
        cards,
        primaryValue: pairVals[pairVals.length - 1],
      }
    }
  }
}
```

### 重构后（连对检测逻辑）
```typescript
// ========== 连对 ==========
const sequencePairsMaxValue = getSequencePairsMaxValue(counts, cards.length)
if (sequencePairsMaxValue !== null) {
  return { type: 'sequencePairs', cards, primaryValue: sequencePairsMaxValue }
}
```

**改进说明**:
- 代码行数减少 80%
- 逻辑清晰度显著提升
- 错误处理集中在辅助函数中
- 易于单独测试和调试

---

## 未来优化建议

### 短期（已完成）
- ✅ 提取牌型识别函数
- ✅ 创建辅助接口
- ✅ 简化主函数逻辑

### 中期（建议）
1. 性能优化
   - 考虑使用位运算优化卡牌值比较
   - 使用 Map 代替 Record 提升查找性能

2. 代码组织
   - 将牌型识别函数移至独立模块
   - 添加更多单元测试覆盖边界情况

### 长期（建议）
1. 架构优化
   - 考虑使用策略模式实现不同牌型的识别
   - 引入类型安全的牌型验证系统

2. 文档完善
   - 添加算法复杂度注释
   - 完善JSDoc文档和使用示例

---

## 结论

本次深度重构成功实现了以下目标：

### ✅ 代码质量提升
- 消除了代码重复
- 提升了函数可读性
- 改善了代码组织结构

### ✅ 可维护性提升
- 牌型识别逻辑模块化
- 函数职责单一
- 易于测试和调试

### ✅ 零功能回归
- 所有测试通过
- API完全兼容
- 性能无损失

重构后的代码更易于理解、测试和扩展，为未来的功能增强和性能优化奠定了坚实基础。
