# 游戏流程问题报告

## 测试结果摘要

通过Playwright模拟真实游戏，发现以下阻止游戏正常进行到排名的问题：

### 关键问题

#### 1. 房间已有游戏 (P0001)
```
[ERROR] [AutoStart] Failed to start practice game: {
  message: 'A game is already playing in this room'
}
```
- **原因**: 练习房间中已有进行中的游戏
- **影响**: 无法开始新游戏
- **解决方案**: 需要在开始新游戏前完成或删除现有游戏

#### 2. AI决策超时
```
[ERROR] [useAIDecision] AI 异常: {
  message: 'Task turn-xxx-decide timeout after 10000ms'
}
```
- **原因**: AI决策超过10秒超时限制
- **影响**: AI座位无法正常出牌，游戏卡住
- **解决方案**: 需要优化AI性能或增加超时时间

#### 3. 回合不匹配
```
[WARN] Turn mismatch detected! Fetching fresh game state...
```
- **原因**: 客户端和服务器回合号不同步
- **影响**: 频繁重新获取状态，影响游戏流畅性
- **解决方案**: 需要修复状态同步逻辑

#### 4. AI手牌为空
```
[WARN] [useAIDecision] 座位2手牌为空，跳过决策
```
- **原因**: getAIHand返回空数组
- **影响**: AI无法做出决策
- **解决方案**: 需要修复手牌获取逻辑

### 次要问题

5. CORS错误 - 匿名登录被阻止
6. 400错误 - Start game failed

## 修复建议

### 立即修复

1. **添加房间清理逻辑**
   - 在开始新游戏前检查并清理进行中的游戏
   - 或自动完成旧游戏

2. **修复AI超时问题**
   - 增加AI决策超时时间到30秒
   - 或优化AI决策性能

3. **修复状态同步**
   - 确保回合号正确同步
   - 添加状态校验和修复机制

### 后续优化

4. 优化AI性能
5. 改进错误处理
6. 添加重试机制

## 测试文件

- `tests/e2e/observe-game-flow.spec.ts` - 观察性测试
- `tests/e2e/complete-game-with-cleanup.spec.ts` - 完整流程测试
- `tests/e2e/simple-game-debug.spec.ts` - 简单调试测试

## 截图

测试过程中的截图保存在 `tests/e2e/screenshots/` 目录。
