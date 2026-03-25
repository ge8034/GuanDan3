# 修复 AI 玩家不出牌问题

## 问题描述
游戏成功开始后，AI 玩家没有自动出牌，游戏无法进行到结束阶段。

## 根本原因
`BaseAgent.handleMessage` 直接处理消息，导致子类 `GuanDanAgent.receive()` 方法永远不会被调用，GAME_ACTION 消息无法被处理。

## 修复代码

### src/lib/multi-agent/core/BaseAgent.ts

将第 20-31 行：
```typescript
// Handle incoming messages (Actor Model)
private async handleMessage(message: Message): Promise<void> {
  console.log(`[BaseAgent] handleMessage 收到消息: type=${message.type}, from=${message.from}, to=${message.to}`)
  if (message.type === 'TASK_ASSIGN') {
    console.log(`[BaseAgent] 准备调用 processTask`)
    await this.processTask(message.payload)
    console.log(`[BaseAgent] processTask 完成`)
  } else if (message.type === 'STATUS_UPDATE') {
    // Handle status updates from other agents if needed
  }
  // ... extend message handling logic
}
```

改为：
```typescript
// Handle incoming messages (Actor Model)
private async handleMessage(message: Message): Promise<void> {
  console.log(`[BaseAgent] handleMessage 收到消息: type=${message.type}, from=${message.from}, to=${message.to}`)
  // 委托给 receive 方法，允许子类扩展消息处理
  await this.receive(message);
}

// 默认 receive 方法 - 处理 TASK_ASSIGN
public async receive(message: Message): Promise<void> {
  if (message.type === 'TASK_ASSIGN') {
    console.log(`[BaseAgent] 准备调用 processTask`)
    await this.processTask(message.payload)
    console.log(`[BaseAgent] processTask 完成`)
  }
}
```

### 同时需要将 receive 方法从 abstract 改为普通方法

将第 47 行：
```typescript
protected abstract processTask(task: any): Promise<void>;
```

改为：
```typescript
protected async processTask(task: any): Promise<void> {
  // 默认实现：子类可以覆盖
  console.warn(`[${this.id}] processTask 未被实现，跳过任务:`, task.id);
}
```

## 验证修复
运行测试后应该看到：
- ✓ [BaseAgent] handleMessage 收到消息: type=GAME_START
- ✓ [GuanDanAgent] 接收到 GAME_START 消息并初始化
- ✓ [GuanDanAgent] processTask 被调用
- ✓ AI 玩家开始出牌
- ✓ 游戏进行到结束，出现排名
