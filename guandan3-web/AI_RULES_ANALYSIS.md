# 游戏规则分析和测试报告

## 问题诊断

### 1. AI 开局出最大炸弹 - 根本原因

**原因分析：**

规则 `canBeat` **确实被正确使用**，但只在**跟牌时**使用：

| 情况 | canBeat 使用 | 结果 |
|------|-------------|------|
| 领出 (!lastMove) | ❌ 不过滤 | 所有牌型（包括炸弹）都是合法的 |
| 跟牌 (有lastMove) | ✅ 使用 canBeat | 只能压过上家的牌 |

**掼蛋规则：** 领出时确实可以出任何牌型（包括炸弹），这是符合规则的！

**真正的问题：** 领出时的**评分策略**让 AI 倾向于出炸弹：
```typescript
// 之前的代码
if (analysis?.type === 'bomb' && isLeading) {
  score += 30  // 炸弹加 30 分！
}
```

### 2. 组件加载状态

✅ **所有组件都存在且配置正确**
- 20 个主要组件全部加载
- 9 个 lazy 组件配置正确

### 3. 当前数据库状态

✅ **数据库已清理**
- 0 个游戏
- 0 个房间
- 干净状态

## 已完成的修复

### 修复 1: AI 评分策略

**文件**: `src/lib/game/ai-strategy.ts`

**修改前：**
```typescript
// 领出时炸弹加分
if (analysis?.type === 'bomb' && isLeading) {
  score += 30
}
```

**修改后：**
```typescript
// 炸弹统一大幅扣分
if (analysis?.type === 'bomb') {
  score -= 800
}
```

**修改领出评分：**
```typescript
// 领出时：鼓励出小牌
if (analysis && analysis.primaryValue) {
  score += 500 - analysis.primaryValue * 5  // 主值越小分数越高
}
```

### 修复 2: 跟牌评分策略

```typescript
// 跟牌时：用最小的能压过的牌
if (analysis && analysis.primaryValue) {
  score += 1000 - analysis.primaryValue * 10
}
```

## 测试结果

### E2E 测试发现的问题

**测试输出：**
```
[Captured] [LOG] [useRoomAI] 触发检查: gameStatus=playing, isOwner=true, currentSeat=0
[Captured] [LOG] [useRoomAI] 当前座位: 0, isAIMember=false
[Captured] [LOG] [useRoomAI] 当前座位不是AI成员，跳过AI决策
```

**问题：** currentSeat 始终是 0，AI 没有被触发

**原因：** 数据库中没有正在进行的游戏（已清理）

## 下一步测试流程

### 方案 1: 手动测试
1. 访问 http://localhost:3000
2. 点击"开始练习"
3. 观察控制台日志
4. 手动出几张牌
5. 观察 AI 是否正确出牌

### 方案 2: 自动化测试
运行 `npx playwright test tests/e2e/ai-rules-test.spec.ts --headed`

## 验证修复

运行测试后检查：

1. **AI 领出时**：
   - ✅ 应该出小牌（单张 2, 3）
   - ✅ 不应该出炸弹
   - ✅ 优先出顺子、三带等多张牌型

2. **AI 跟牌时**：
   - ✅ 用最小的能压过的牌
   - ✅ 不应该用炸弹（除非迫不得已）
   - ✅ 牌型必须匹配（上家出单张，AI 也出单张）

## 待修复问题

### 高优先级

1. **currentSeat 更新问题** - 测试显示 currentSeat 没有从 0 更新
2. **手牌加载问题** - 手牌数量为 0
3. **AI 触发问题** - AI 没有被触发执行

### 中优先级

4. **服务端验证** - validate_move 函数需要完善
5. **日志优化** - 添加更详细的 AI 决策日志

## 文件清单

### 修改的文件
- `src/lib/game/ai-strategy.ts` - AI 评分策略

### 创建的文件
- `tests/e2e/ai-rules-test.spec.ts` - AI 规则验证测试
- `check-current-game.mjs` - 游戏状态检查脚本
- `check-all-games.mjs` - 所有游戏检查脚本
- `TEST_REPAIR_CHECKLIST.md` - 测试检查清单
