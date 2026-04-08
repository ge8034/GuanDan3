# 测试修复计划

## 修复的代码问题

### 1. calculateControlScore 函数调用不匹配

**问题描述**:
`calculateControlScore`函数在`ai-utils.ts`中定义为接受对象参数：
```typescript
export function calculateControlScore({
  cardCount,
  strongCards,
  hasJokers,
}: ControlScoreParams): number
```

但在多个地方被调用时传递了独立参数。

**修复位置**:
1. `src/lib/game/ai-strategy.ts` - `assessTeammateSituation`函数
2. `src/lib/game/ai-cooperation.ts` - `analyzeTeammate`函数
3. `src/lib/game/ai-cooperation.ts` - `evaluateCooperationStrategy`函数
4. `src/lib/game/ai-strategy.ts` - `evaluateMove`函数

**修复方式**:
将调用从独立参数改为对象参数：
```typescript
// 修复前
const controlScore = calculateControlScore(
  teammateCards.length,
  distribution.strongCards,
  distribution.hasJokers,
  levelRank
);

// 修复后
const controlScore = calculateControlScore({
  cardCount: teammateCards.length,
  strongCards: distribution.strongCards,
  hasJokers: distribution.hasJokers,
  levelRank,
});
```

### 2. assessRisk 函数调用不匹配

**问题描述**:
`assessRisk`函数在`ai-utils.ts`中定义为接受4个独立参数：
```typescript
export function assessRisk(
  moveCards: Card[],
  handCards: Card[],
  levelRank: number,
  isLeading: boolean
): number
```

但在`ai-strategy.ts`中被调用时传递了对象参数。

**修复位置**:
1. `src/lib/game/ai-strategy.ts` - `evaluateMove`函数

**修复方式**:
将调用从对象参数改为独立参数：
```typescript
// 修复前
const riskAssessment = assessRisk({
  moveCards,
  handCards: hand,
  levelRank,
  isLeading,
});

// 修复后
const riskAssessment = assessRisk(moveCards, hand, levelRank, isLeading);
```

## 待修复的测试问题

### 优先级1: 基础设施测试 (16个失败)

**文件**: `src/test/contract/health-contract.test.ts`

**问题**: 所有测试因为无法连接到开发服务器而失败

**解决方案**:
1. 选项A: 在测试前启动开发服务器
2. 选项B: 使用mock代替实际API调用
3. 选项C: 跳过这些测试直到有完整的环境

**推荐**: 选项B - 实现完整的API mock

### 优先级2: Mock设置问题 (约30个失败)

**受影响文件**:
- `src/test/integration/game-state-sync.test.ts`
- `src/test/integration/database-operations.test.ts`
- `src/test/integration/realtime-messaging.test.ts`
- `src/test/integration/security-integration.test.ts`

**问题**: Supabase mock设置不完整

**解决方案**:
1. 创建统一的Supabase mock工具
2. 确保所有链式调用正确mock
3. 添加`.in()`方法支持

### 优先级3: AI并发测试 (16个失败)

**受影响文件**:
- `src/test/integration/ai/ai-multi-concurrent.test.ts`
- `src/test/integration/ai/ai-realtime-race.test.ts`

**问题**: 复杂的并发场景测试不稳定

**解决方案**:
1. 增加测试等待时间
2. 改进时序控制
3. 使用更可靠的并发测试模式

### 优先级4: AI策略逻辑 (约6个失败)

**受影响文件**:
- `src/test/integration/ai/ai-difficulty-levels.test.ts`
- `src/test/unit/game/ai-new-issues.test.ts`

**问题**: AI实现与测试预期不一致

**解决方案**:
1. 审查AI策略实现
2. 确定是调整实现还是测试预期
3. 统一AI行为规范

## 测试覆盖建议

### 需要添加的测试

1. **函数签名测试**: 验证所有导出函数的签名正确
2. **类型安全测试**: 验证TypeScript类型定义
3. **边界条件测试**: 添加更多空值、边界值测试
4. **性能回归测试**: 添加性能基准测试

### 测试质量改进

1. **减少测试依赖**: 让每个测试独立运行
2. **提高测试速度**: 优化慢速测试
3. **增加测试可读性**: 改进测试命名和结构
4. **统一测试风格**: 使用一致的测试模式

## 验收标准

修复完成后的目标：
- [ ] 所有单元测试通过 (≥95%)
- [ ] 所有集成测试通过 (≥90%)
- [ ] API契约测试通过 (≥95%)
- [ ] E2E测试通过 (≥85%)
- [ ] 测试覆盖率 ≥85%
- [ ] 无关键功能测试失败

## 时间估算

- 优先级1修复: 1-2小时
- 优先级2修复: 3-4小时
- 优先级3修复: 2-3小时
- 优先级4修复: 2-4小时

总计: 约8-13小时
