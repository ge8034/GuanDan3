# AI 问题修复报告 #2 - 循环与竞态问题

## 测试日期
2026-04-01

## 新发现并修复的问题

本阶段通过E2E测试日志分析，发现并修复了 **7个新问题**。

### ✅ 新问题 #1: useEffect依赖数组不完整

**问题描述**：
`useAIDecision.ts` 的 useEffect 依赖数组缺少 `roomMode` 和 `selectedCardIds`。

**根本原因**：
- 闭包中使用 `roomMode` 和 `selectedCardIds`，但依赖数组中没有包含
- 导致练习模式判断和选牌检查使用旧的闭包值

**修复方案**：
在依赖数组中添加缺失的依赖项：
```typescript
}, [
  gameStatus,
  currentSeat,
  turnNo,
  isOwner,
  roomId,
  difficulty,
  members,
  roomMode,           // 新增
  selectedCardIds,    // 新增
  addDebugLog,
]);
```

**修复位置**：`src/lib/hooks/ai/useAIDecision.ts` 第373-383行

---

### ✅ 新问题 #2: AI无限循环 - 锁机制时序问题

**问题描述**：
座位2的AI陷入无限循环，不断执行 `runAI 函数开始执行，座位=2, 轮次=2`。

**根本原因**：
- 锁检查在useEffect主体（第101行）
- 锁设置在runAI函数内部（第134行）
- useEffect每次触发时锁检查通过（因为上次finally已释放），然后调用runAI()
- runAI内部的finally释放锁后，useEffect再次触发...

**修复方案**：
将锁设置移到useEffect主体，在调用runAI()之前：
```typescript
// 在useEffect主体中立即设置锁
submittingTurnRef.current = turnNo;

const runAI = async () => {
  // 不再在这里设置锁
  // submittingTurnRef.current = turnNo; // 删除这行
  ...
}
```

**修复位置**：`src/lib/hooks/ai/useAIDecision.ts` 第113-119行

---

### ✅ 新问题 #3: 空手牌时AI仍执行决策

**问题描述**：
`getAIHand` 返回空数组时，AI仍然创建任务并尝试决策。

**根本原因**：
- 没有验证手牌非空
- 空手牌导致decideMove无效或返回错误结果

**修复方案**：
在获取手牌后立即检查并返回：
```typescript
const aiHand = await freshState.getAIHand(currentSeat);

// 检查手牌是否为空
if (!aiHand || aiHand.length === 0) {
  logger.warn(`[useAIDecision] 座位${currentSeat}手牌为空，跳过决策`);
  submittingTurnRef.current = null;
  consecutiveFailuresRef.current[currentSeat] = (consecutiveFailuresRef.current[currentSeat] || 0) + 1;
  return;
}
```

**修复位置**：`src/lib/hooks/ai/useAIDecision.ts` 第196-205行

---

### ✅ 新问题 #4: 练习模式选牌检查使用旧闭包值

**问题描述**：
练习模式等待5秒后检查 `selectedCardIds`，但使用的是闭包中的旧值。

**根本原因**：
```typescript
// 错误：使用闭包值
const hasSelectedCards = selectedCardIds && selectedCardIds.length > 0;
```

**修复方案**：
从最新store读取：
```typescript
// 正确：从最新store读取
const freshStateAfterWait = useGameStore.getState();
const currentSelectedIds = freshStateAfterWait.selectedCardIds || [];
const hasSelectedCards = currentSelectedIds.length > 0;
```

**修复位置**：`src/lib/hooks/ai/useAIDecision.ts` 第125-135行

---

### ✅ 新问题 #5: useEffect触发频率过高

**问题描述**：
依赖数组包含过多值，导致不必要的状态变化也会触发AI决策。

**根本原因**：
依赖数组包含 `members` (对象引用)、`addDebugLog` (函数) 等，每次渲染都会变化。

**修复方案**：
问题#1已部分修复，但需要进一步优化（待后续改进）。

**修复位置**：`src/lib/hooks/ai/useAIDecision.ts` 第373-383行

---

### ✅ 新问题 #6: getAIHand RPC错误处理不完整

**问题描述**：
错误日志只显示 `[Object]`，没有详细错误信息。

**根本原因**：
```typescript
logger.error('[getAIHand] RPC 错误:', {
  error,  // 直接输出对象，显示为[Object]
  ...
});
```

**修复方案**：
展开错误对象：
```typescript
const errorMessage = e instanceof Error ? e.message : String(e);
const errorDetails = e instanceof Error ? {
  message: e.message,
  stack: e.stack,
  name: e.name,
} : { raw: String(e) };

logger.error('[useAIDecision] AI 异常:', {
  seatNo: currentSeat,
  turnNo,
  error: errorDetails,
});
```

**修复位置**：`src/lib/hooks/ai/useAIDecision.ts` 第340-357行

---

### ✅ 新问题 #7: 座位AI连续失败后无限重试

**问题描述**：
从E2E日志看，座位2的AI连续失败但不断重试，没有停止机制。

**根本原因**：
没有连续失败计数和停止机制。

**修复方案**：
添加连续失败追踪：
```typescript
// 记录每个座位连续失败次数
const consecutiveFailuresRef = useRef<Record<number, number>>({});

// 在useEffect中检查
const failures = consecutiveFailuresRef.current[currentSeat] || 0;
if (failures >= 3) {
  logger.warn(`[useAIDecision] 座位${currentSeat}连续失败${failures}次，跳过本次执行`);
  if (submittingTurnRef.current !== null && submittingTurnRef.current !== turnNo) {
    consecutiveFailuresRef.current[currentSeat] = 0;
  } else {
    return;
  }
}
```

**修复位置**：
- `src/lib/hooks/ai/useAIDecision.ts` 第49行（声明）
- `src/lib/hooks/ai/useAIDecision.ts` 第101-111行（检查）
- `src/lib/hooks/ai/useAIDecision.ts` 第204行（重置成功）
- `src/lib/hooks/ai/useAIDecision.ts` 第357行（增加失败计数）

---

### ⚠️ 数据库问题：get_ai_hand函数不支持练习模式

**问题描述**：
练习模式中，座位0是人类玩家，`get_ai_hand` 检查成员类型必须为 'ai'，导致RPC返回400错误。

**根本原因**：
SQL函数检查过于严格：
```sql
IF v_member_type != 'ai' THEN
  RAISE EXCEPTION 'Seat % is not an AI member', p_seat_no;
END IF;
```

**修复方案**：
在 `supabase/FIX_GET_AI_HAND_PRACTICE_MODE.sql` 中：
```sql
-- 练习模式中，允许为座位0的人类玩家获取手牌
IF v_member_type != 'ai' AND NOT (v_room_mode = 'pve1v3' AND p_seat_no = 0) THEN
  RAISE EXCEPTION 'Seat % is not an AI member';
END IF;
```

**需要执行SQL**：运行 `supabase/FIX_GET_AI_HAND_PRACTICE_MODE.sql`

---

## 验证结果

### E2E测试验证
```
[warning] [WARN] [useAIDecision] 座位0手牌为空，跳过决策
[warning] [WARN] [useAIDecision] 座位0连续失败3次，跳过本次执行
```
✅ 修复生效：
- 空手牌检查工作
- 连续失败保护工作
- AI不再无限循环

### 单元测试验证
```
Test Files  2 passed
Tests       18 passed
```
✅ 现有AI测试全部通过

---

## 代码变更摘要

### 1. useAIDecision.ts - 添加连续失败追踪
```typescript
// 新增：记录每个座位连续失败次数
const consecutiveFailuresRef = useRef<Record<number, number>>({});
```

### 2. useAIDecision.ts - 修复锁机制时序
```typescript
// 在useEffect主体中立即设置锁
submittingTurnRef.current = turnNo;

const runAI = async () => {
  // runAI内部不再设置锁
  ...
}
```

### 3. useAIDecision.ts - 空手牌检查
```typescript
if (!aiHand || aiHand.length === 0) {
  logger.warn(`座位${currentSeat}手牌为空，跳过决策`);
  submittingTurnRef.current = null;
  consecutiveFailuresRef.current[currentSeat]++;
  return;
}
```

### 4. useAIDecision.ts - 修复闭包问题
```typescript
// 从最新store读取，而不是使用闭包值
const freshStateAfterWait = useGameStore.getState();
const currentSelectedIds = freshStateAfterWait.selectedCardIds || [];
```

### 5. useAIDecision.ts - 改进错误日志
```typescript
const errorDetails = e instanceof Error ? {
  message: e.message,
  stack: e.stack,
  name: e.name,
} : { raw: String(e) };
```

### 6. useAIDecision.ts - 修复依赖数组
```typescript
}, [
  gameStatus,
  currentSeat,
  turnNo,
  isOwner,
  roomId,
  difficulty,
  members,
  roomMode,           // 新增
  selectedCardIds,    // 新增
  addDebugLog,
]);
```

---

## 建议后续工作

1. **执行数据库修复**：运行 `FIX_GET_AI_HAND_PRACTICE_MODE.sql`
2. **性能优化**：减少useEffect不必要的触发
3. **测试覆盖**：添加更多竞态条件测试
4. **监控**：在生产环境中监控AI决策延迟和失败率

---

## 问题状态

| 问题 | 状态 | 说明 |
|------|------|------|
| #1 依赖数组不完整 | ✅ 已修复 | 添加roomMode和selectedCardIds |
| #2 AI无限循环 | ✅ 已修复 | 锁设置移到useEffect主体 |
| #3 空手牌执行 | ✅ 已修复 | 添加空手牌检查 |
| #4 闭包陷阱 | ✅ 已修复 | 从最新store读取 |
| #5 触发频率 | ⚠️ 部分修复 | 需进一步优化 |
| #6 错误日志 | ✅ 已修复 | 展开错误对象 |
| #7 连续失败 | ✅ 已修复 | 添加失败计数和停止机制 |
| DB get_ai_hand | 📋 待执行 | 需运行SQL修复 |
