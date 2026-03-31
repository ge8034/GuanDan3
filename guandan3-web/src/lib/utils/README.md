# 错误处理和安全工具使用指南

本文档介绍如何使用 `src/lib/utils/` 中的错误处理和安全工具。

## 目录

1. [错误消息处理](#错误消息处理)
2. [安全工具](#安全工具)
3. [错误追踪](#错误追踪)
4. [错误边界](#错误边界)

---

## 错误消息处理

### `getSafeErrorMessage(error: unknown): string`

将各种错误转换为用户友好的中文消息。

```typescript
import { getSafeErrorMessage } from '@/lib/utils';

try {
  await submitTurn(cards);
} catch (error) {
  const message = getSafeErrorMessage(error);
  toast.error(message);
  // 输出: "游戏状态已更新，请刷新页面"
}
```

### `getErrorDetails(error: unknown)`

获取详细的错误信息（用于调试）。

```typescript
import { getErrorDetails } from '@/lib/utils';

try {
  await someOperation();
} catch (error) {
  const details = getErrorDetails(error);
  console.error('错误详情:', details);
  // {
  //   message: "turn_no_mismatch",
  //   code: "turn_no_mismatch",
  //   stack: "...",
  //   details: {...}
  // }
}
```

### 错误类型判断

```typescript
import { isNetworkError, isAuthError, isRetryableError } from '@/lib/utils';

if (isNetworkError(error)) {
  // 处理网络错误
  showNetworkErrorToast();
}

if (isAuthError(error)) {
  // 处理认证错误
  redirectToLogin();
}

if (isRetryableError(error)) {
  // 可重试的错误
  retryWithBackoff();
}
```

---

## 安全工具

### 输入验证

```typescript
import {
  isValidRoomId,
  isValidNickname,
  isValidCard,
  isValidCardArray
} from '@/lib/utils';

// 验证房间 ID
if (!isValidRoomId(roomId)) {
  throw new Error('无效的房间 ID');
}

// 验证用户昵称
if (!isValidNickname(nickname)) {
  throw new Error('昵称只能包含中文、字母、数字、下划线，长度1-20');
}

// 验证卡牌数据
if (!isValidCard(card)) {
  throw new Error('无效的卡牌数据');
}

if (!isValidCardArray(cards)) {
  throw new Error('无效的卡牌数组');
}
```

### HTML 清理（防止 XSS）

```typescript
import { sanitizeHTML, stripAllHTML, sanitizeGameMessage } from '@/lib/utils';

// 保留安全的 HTML 标签
const safe = sanitizeHTML(userInput);
// "<script>alert('xss')</script>Hello" → "Hello"

// 移除所有 HTML
const plain = stripAllHTML(userInput);
// "<p>Hello <b>World</b></p>" → "Hello World"

// 清理游戏消息
const message = sanitizeGameMessage(chatInput, 200);
```

### URL 验证

```typescript
import { isSafeURL } from '@/lib/utils';

if (!isSafeURL(userProvidedURL)) {
  throw new Error('不安全的 URL');
}
```

### 日志脱敏

```typescript
import { sanitizeLog } from '@/lib/utils';

const logMessage = `User logged in with token: ${token}`;
const safeLog = sanitizeLog(logMessage);
// "User logged in with token: ***"
console.log(safeLog);
```

### 安全随机字符串生成

```typescript
import { generateSecureRandomString } from '@/lib/utils';

const roomId = generateSecureRandomString(6);
// 生成类似 "A3B7F2" 的随机字符串
```

---

## 错误追踪

### 初始化错误追踪系统

```typescript
import { initErrorTracking } from '@/lib/utils';

// 在应用的入口文件中（如 _app.tsx 或 layout.tsx）
initErrorTracking({
  enabled: true,
  sampleRate: 1.0, // 100% 采样
  verbose: process.env.NODE_ENV === 'development',
});
```

### 记录日志

```typescript
import {
  logDebug,
  logInfo,
  logWarn,
  logError,
  logFatal
} from '@/lib/utils';

// 调试信息
logDebug('游戏状态更新', { gameId: '123', state: 'playing' });

// 一般信息
logInfo('用户加入房间', { roomId: 'ABC123', userId: 'user1' });

// 警告
logWarn('内存使用率过高', { usage: '85%' });

// 错误
logError('提交牌型失败', error, {
  component: 'GameTable',
  action: 'submitTurn',
  gameId: '123',
});

// 致命错误
logFatal('数据库连接失败', error, { component: 'Database' });
```

### 记录特定事件

```typescript
import {
  logGameAction,
  logAPICall,
  logPerformanceMetric
} from '@/lib/utils';

// 记录游戏操作
logGameAction('出牌', gameId, {
  playerId: 'player1',
  cards: ['AH', 'KH'],
  turnNo: 5,
});

// 记录 API 调用
const startTime = Date.now();
try {
  await api.submitTurn(data);
  logAPICall('POST', '/api/turn', true, Date.now() - startTime);
} catch (error) {
  logAPICall('POST', '/api/turn', false, Date.now() - startTime, error);
}

// 记录性能指标
logPerformanceMetric('页面加载时间', 1200, 'ms');
logPerformanceMetric('出牌响应时间', 45, 'ms');
```

### React 错误边界

```typescript
import { useErrorTracking } from '@/lib/utils';

function MyComponent() {
  const errorTracking = useErrorTracking('MyComponent');

  componentDidCatch(error, errorInfo) {
    errorTracking.componentDidCatch(error, errorInfo);
  }
}
```

---

## 错误边界

### 使用默认错误边界

```typescript
import { GameErrorBoundary } from '@/lib/utils';

function App() {
  return (
    <GameErrorBoundary>
      <GameCanvas />
    </GameErrorBoundary>
  );
}
```

### 使用自定义错误回退组件

```typescript
import { GameErrorBoundary, GameErrorFallback } from '@/lib/utils';

function App() {
  return (
    <GameErrorBoundary fallback={GameErrorFallback}>
      <GameCanvas />
    </GameErrorBoundary>
  );
}
```

### 完全自定义的错误回退

```typescript
function CustomErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div className="error-container">
      <h1>出错了</h1>
      <p>{error.message}</p>
      <button onClick={retry}>重试</button>
    </div>
  );
}

function App() {
  return (
    <GameErrorBoundary fallback={CustomErrorFallback}>
      <GameCanvas />
    </GameErrorBoundary>
  );
}
```

### 使用加载状态组件

```typescript
import { LoadingFallback } from '@/lib/utils';

function GameTable() {
  if (isLoading) {
    return <LoadingFallback />;
  }

  return <div>游戏内容</div>;
}
```

---

## 完整示例

### 游戏房间组件

```typescript
'use client';

import { useState, useEffect } from 'react';
import {
  GameErrorBoundary,
  getSafeErrorMessage,
  logError,
  logGameAction,
  logAPICall,
  isValidCardArray,
} from '@/lib/utils';

function GameRoom({ roomId }: { roomId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<Card[]>([]);

  const handleSubmitTurn = async (selectedCards: Card[]) => {
    try {
      // 验证卡牌
      if (!isValidCardArray(selectedCards)) {
        throw new Error('无效的卡牌选择');
      }

      // 记录游戏操作
      logGameAction('提交出牌', roomId, { cardCount: selectedCards.length });

      // 提交到服务器
      const startTime = Date.now();
      await api.submitTurn(roomId, selectedCards);

      // 记录成功的 API 调用
      logAPICall('POST', '/api/turn', true, Date.now() - startTime);

      // 更新状态
      setCards(prev => prev.filter(c => !selectedCards.includes(c)));
      setError(null);

    } catch (err) {
      // 记录错误
      logError('提交出牌失败', err as Error, {
        component: 'GameRoom',
        action: 'submitTurn',
        roomId,
      });

      // 显示用户友好的错误消息
      const message = getSafeErrorMessage(err);
      setError(message);
    }
  };

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={() => setError(null)}>关闭</button>
      </div>
    );
  }

  return (
    <div>
      {/* 游戏内容 */}
    </div>
  );
}

// 使用错误边界包装
export default function GameRoomWrapper(props: { roomId: string }) {
  return (
    <GameErrorBoundary fallback={GameErrorFallback}>
      <GameRoom {...props} />
    </GameErrorBoundary>
  );
}
```

---

## 最佳实践

1. **始终使用 `getSafeErrorMessage` 处理用户可见的错误**
   ```typescript
   // ✅ 好的做法
   const message = getSafeErrorMessage(error);
   toast.error(message);

   // ❌ 坏的做法
   toast.error(error.message); // 可能暴露技术细节
   ```

2. **验证所有用户输入**
   ```typescript
   // ✅ 好的做法
   if (!isValidCardArray(cards)) {
     throw new Error('无效的卡牌');
   }

   // ❌ 坏的做法
   // 直接使用用户提供的卡牌数据
   ```

3. **脱敏日志中的敏感信息**
   ```typescript
   // ✅ 好的做法
   console.log(sanitizeLog(`Token: ${token}`));

   // ❌ 坏的做法
   console.log(`Token: ${token}`); // 泄露敏感信息
   ```

4. **使用错误边界捕获 React 组件错误**
   ```typescript
   // ✅ 好的做法
   <GameErrorBoundary>
     <GameCanvas />
   </GameErrorBoundary>

   // ❌ 坏的做法
   // 直接使用组件，没有错误边界
   ```

5. **记录关键操作的日志**
   ```typescript
   // ✅ 好的做法
   logGameAction('出牌', gameId, { cards });
   logAPICall('POST', '/api/turn', true, duration);

   // ❌ 坏的做法
   // 不记录任何日志
   ```

---

## 错误码参考

| 错误码 | 用户消息 | 场景 |
|--------|----------|------|
| `turn_no_mismatch` | 游戏状态已更新，请刷新页面 | 游戏状态不同步 |
| `not_a_member` | 您不在房间中 | 未加入房间就尝试操作 |
| `not_your_turn` | 还未轮到您出牌 | 非当前玩家出牌 |
| `invalid_cards` | 选择的牌不符合规则 | 牌型验证失败 |
| `rate_limit_exceeded` | 操作过于频繁，请稍后再试 | 触发频率限制 |
| `PGRST116` | 没有找到相关数据 | 数据库查询无结果 |
| `PGRST202` | 权限不足 | RLS 策略拒绝访问 |

---

## 相关文件

- `src/lib/utils/error-messages.ts` - 错误消息映射
- `src/lib/utils/security.ts` - 安全工具函数
- `src/lib/utils/error-tracking.ts` - 错误追踪系统
- `src/components/ErrorBoundary.tsx` - 错误边界组件
