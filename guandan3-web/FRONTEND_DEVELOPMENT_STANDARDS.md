# 掼蛋3 前端开发标准

## 概述

本文档定义了掼蛋3项目的前端开发标准，基于现有代码分析和最佳实践，旨在提高代码质量、可维护性和性能。标准涵盖组件架构、状态管理、性能优化、可访问性、测试和代码质量等方面。

## 1. 组件架构标准

### 1.0 问题分析与解决方案

基于项目讨论问题中提到的前端架构问题，制定以下针对性解决方案：

#### 1.0.1 GameCanvas过度复杂的异步逻辑问题
**问题**：25+个useEffect导致执行顺序混乱，setupEventListeners有10次重试循环可能导致无限循环。

**解决方案**：
1. 将复杂异步逻辑拆分为多个自定义Hook
2. 使用状态机管理异步流程
3. 避免重试循环，使用指数退避策略

```typescript
// ❌ 避免：复杂的useEffect链
useEffect(() => { /* 初始化 */ }, [])
useEffect(() => { /* 设置监听器 */ }, [])
useEffect(() => { /* 重试逻辑 */ }, [])
// ... 25+个useEffect

// ✅ 正确：使用自定义Hook封装
const useGameCanvas = (containerRef: RefObject<HTMLDivElement>) => {
  const { isInitialized, error } = useCanvasInitialization(containerRef)
  const { listenersReady } = useCanvasListeners(isInitialized)
  const { gameState } = useCanvasGameLogic(listenersReady)

  return { isInitialized, listenersReady, gameState, error }
}
```

#### 1.0.2 MainGameScene初始化流程错误
**问题**：工厂函数返回类定义而不是实例，EventBridge依赖Phaser场景但在错误时机创建。

**解决方案**：
1. 使用正确的Phaser场景初始化模式
2. 确保依赖顺序正确
3. 使用依赖注入管理组件依赖

```typescript
// ✅ 正确：Phaser场景初始化
const createGameScene = (config: GameConfig): Phaser.Scene => {
  const scene = new MainGameScene(config)

  // 在场景创建后初始化EventBridge
  scene.events.once('create', () => {
    scene.eventBridge = new EventBridge(scene)
  })

  return scene
}
```

#### 1.0.3 事件桥接循环依赖问题
**问题**：React ↔ Phaser ↔ MainGameScene ↔ EventBridge的循环依赖。

**解决方案**：
1. 使用单向数据流
2. 通过事件总线解耦
3. 避免直接组件引用

```typescript
// 使用事件总线解耦
const EventBus = {
  emit: (event: string, data?: any) => {
    // 统一事件分发
  },
  on: (event: string, handler: Function) => {
    // 事件监听
  }
}

// React组件通过EventBus与Phaser通信
const GameComponent = () => {
  useEffect(() => {
    EventBus.on('phaser-ready', () => {
      // Phaser准备就绪
    })
  }, [])
}
```

### 1.1 组件设计原则

#### 单一职责原则
每个组件应只负责一个明确的功能或UI部分。

```typescript
// ✅ 正确：职责单一的组件
interface CardViewProps {
  card: Card;
  variant: 'hand' | 'table';
  selected?: boolean;
  onClick?: () => void;
}

// ❌ 避免：职责过多的组件
interface ComplexComponentProps {
  // 包含游戏逻辑、UI状态、数据获取等多个职责
  gameState: GameState;
  userData: UserData;
  onGameAction: () => void;
  onUserAction: () => void;
  // ... 其他不相关的props
}
```

#### 组合优于继承
使用组件组合而非继承来构建复杂UI。

```typescript
// ✅ 正确：使用组合
const GameRoom = () => {
  return (
    <div className="game-room">
      <RoomHeader />
      <GameTable />
      <PlayerSeats />
      <HandArea />
      <ChatBox />
    </div>
  );
};

// ✅ 正确：通过props定制化
const Card = ({ variant, size, interactive, children }: CardProps) => {
  const baseClasses = getCardClasses(variant, size);
  return (
    <div className={clsx(baseClasses, interactive && 'cursor-pointer')}>
      {children}
    </div>
  );
};
```

### 1.2 组件类型分类

#### 展示组件 (Presentational Components)
- 只负责UI展示
- 通过props接收数据和回调
- 无内部状态（或只有UI状态）
- 可复用性高

```typescript
// 展示组件示例
interface ButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  onClick,
  children,
  ...props
}) => {
  return (
    <button
      className={buttonVariants({ variant, size })}
      disabled={isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? <LoadingSpinner /> : children}
    </button>
  );
};
```

#### 容器组件 (Container Components)
- 负责数据获取和业务逻辑
- 管理状态和副作用
- 组合展示组件
- 通常与特定页面/功能绑定

```typescript
// 容器组件示例
const GameRoomContainer: React.FC<{ roomId: string }> = ({ roomId }) => {
  const { gameState, isLoading, error } = useGameState(roomId);
  const { players } = usePlayers(roomId);
  const { handlePlay, handlePass } = useGameActions(roomId);

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <GameRoom
      gameState={gameState}
      players={players}
      onPlay={handlePlay}
      onPass={handlePass}
    />
  );
};
```

#### 布局组件 (Layout Components)
- 定义页面结构
- 处理响应式布局
- 可包含导航、页脚等通用元素

```typescript
// 布局组件示例
const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};
```

### 1.3 自定义Hook规范

#### Hook命名约定
- 以`use`前缀开头
- 使用camelCase命名
- 描述Hook的功能

```typescript
// ✅ 正确：清晰的Hook命名
const useGameState = (roomId: string) => { /* ... */ };
const usePlayerHand = (playerId: string) => { /* ... */ };
const useSoundEffects = () => { /* ... */ };

// ❌ 避免：模糊的Hook命名
const getGame = (roomId: string) => { /* ... */ }; // 缺少use前缀
const useData = () => { /* ... */ }; // 名称太泛化
```

#### Hook职责单一
每个Hook应只负责一个特定的功能或状态。

```typescript
// ✅ 正确：职责单一的Hook
const useRoomSubscription = (roomId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const channel = supabase.channel(`room:${roomId}`);
    // 订阅逻辑...
    return () => channel.unsubscribe();
  }, [roomId]);

  return { messages };
};

// ❌ 避免：职责过多的Hook
const useRoom = (roomId: string) => {
  // 包含了订阅、状态管理、游戏逻辑等多个职责
  const [messages, setMessages] = useState<Message[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [gameState, setGameState] = useState<GameState>(null);
  const [error, setError] = useState<Error>(null);
  // ... 太多职责
};
```

### 1.4 文件组织规范

#### 组件文件结构
```
src/components/
├── ui/                    # 基础UI组件
│   ├── Button/
│   │   ├── Button.tsx     # 组件实现
│   │   ├── Button.test.tsx # 单元测试
│   │   ├── Button.stories.tsx # Storybook故事
│   │   ├── index.ts       # 组件导出
│   │   └── types.ts       # 类型定义
│   ├── Card/
│   └── Modal/
├── game/                  # 游戏专用组件
│   ├── PlayingCard/
│   ├── GameTable/
│   └── PlayerSeat/
├── layout/                # 布局组件
│   ├── MainLayout/
│   └── GameLayout/
└── index.ts              # 组件库入口
```

#### Hook文件结构
```
src/hooks/
├── game/                  # 游戏相关Hook
│   ├── useGameState.ts
│   ├── useGameActions.ts
│   └── useGameSubscription.ts
├── room/                  # 房间相关Hook
│   ├── useRoomData.ts
│   ├── useRoomMembers.ts
│   └── useRoomChat.ts
├── ui/                    # UI相关Hook
│   ├── useToast.ts
│   ├── useModal.ts
│   └── useTheme.ts
└── index.ts              # Hook导出
```

## 2. 状态管理标准

### 2.1 Zustand最佳实践

#### 状态切片设计
按业务领域划分状态切片，避免单一庞大的store。

```typescript
// ✅ 正确：按领域划分切片
// store/auth.ts - 认证状态
interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => Promise<void>;
}

// store/game.ts - 游戏状态
interface GameState {
  gameId: string | null;
  status: GameStatus;
  currentPlayer: number;
  players: Player[];
  // ... 游戏相关状态和方法
}

// store/ui.ts - UI状态
interface UIState {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  // ... UI相关状态和方法
}
```

#### 选择器性能优化
使用选择器避免不必要的组件重渲染。

```typescript
// ✅ 正确：使用选择器
export const useCurrentPlayer = () =>
  useGameStore((state) => state.players[state.currentPlayer]);

export const usePlayerHand = (playerId: string) =>
  useGameStore((state) =>
    state.players.find(p => p.id === playerId)?.hand || []
  );

// ❌ 避免：直接使用整个store
const GameComponent = () => {
  const gameState = useGameStore(); // 任何状态变化都会导致重渲染
  // ...
};
```

#### 异步状态处理
统一处理异步操作的加载、错误和成功状态。

```typescript
interface AsyncState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
}

const useAsyncGameState = (roomId: string): AsyncState<GameState> => {
  const [state, setState] = useState<AsyncState<GameState>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchGame = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true }));
        const gameData = await fetchGameData(roomId);
        setState({ data: gameData, isLoading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error.message
        });
      }
    };

    fetchGame();
  }, [roomId]);

  return state;
};
```

### 2.2 副作用管理

#### useEffect使用规范
- 每个useEffect只负责一个副作用
- 明确的依赖数组
- 清理函数必须返回

```typescript
// ✅ 正确：清晰的useEffect
const useRoomSubscription = (roomId: string) => {
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room:${roomId}`);

    // 订阅事件
    channel.subscribe((status) => {
      console.log('Subscription status:', status);
    });

    // 清理函数
    return () => {
      channel.unsubscribe();
    };
  }, [roomId]); // 明确的依赖
};

// ❌ 避免：混乱的useEffect
useEffect(() => {
  // 混合了多个不相关的副作用
  fetchData();
  setupWebSocket();
  setupInterval();
  setupEventListeners();

  return () => {
    // 清理不完整
    clearInterval();
  };
}, []); // 空的依赖数组
```

#### 自定义Hook封装副作用
将复杂副作用封装到自定义Hook中。

```typescript
// 将WebSocket连接封装到Hook中
const useGameWebSocket = (gameId: string, onMessage: (msg: any) => void) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/games/${gameId}`);

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onmessage = (event) => onMessage(JSON.parse(event.data));

    return () => {
      ws.close();
    };
  }, [gameId, onMessage]);

  return { isConnected };
};
```

## 3. 性能优化标准

### 3.1 渲染性能优化

#### React.memo使用
对纯展示组件使用React.memo避免不必要的重渲染。

```typescript
// ✅ 正确：使用React.memo
interface PlayerAvatarProps {
  playerId: string;
  name: string;
  avatarUrl: string;
  isOnline: boolean;
}

const PlayerAvatar = React.memo<PlayerAvatarProps>(({
  playerId,
  name,
  avatarUrl,
  isOnline,
}) => {
  return (
    <div className="player-avatar">
      <img src={avatarUrl} alt={name} />
      <span className={isOnline ? 'online' : 'offline'} />
      <span>{name}</span>
    </div>
  );
});

// 自定义比较函数（可选）
PlayerAvatar.displayName = 'PlayerAvatar';
```

#### useCallback和useMemo
缓存回调函数和计算结果。

```typescript
// ✅ 正确：缓存回调函数
const GameTable = ({ onCardPlay }: { onCardPlay: (card: Card) => void }) => {
  const handleCardClick = useCallback((card: Card) => {
    if (isMyTurn) {
      onCardPlay(card);
    }
  }, [isMyTurn, onCardPlay]); // 依赖明确

  return (
    <div className="game-table">
      {cards.map(card => (
        <PlayingCard
          key={card.id}
          card={card}
          onClick={() => handleCardClick(card)}
        />
      ))}
    </div>
  );
};

// ✅ 正确：缓存计算结果
const PlayerHand = ({ cards }: { cards: Card[] }) => {
  const sortedCards = useMemo(() => {
    return [...cards].sort((a, b) => {
      if (a.value !== b.value) return b.value - a.value;
      return a.suit.localeCompare(b.suit);
    });
  }, [cards]); // 只有当cards变化时重新排序

  return (
    <div className="player-hand">
      {sortedCards.map(card => (
        <PlayingCard key={card.id} card={card} />
      ))}
    </div>
  );
};
```

### 3.2 代码分割

#### 路由级代码分割
使用Next.js的动态导入实现路由级代码分割。

```typescript
// pages/index.tsx
import dynamic from 'next/dynamic';

// 动态导入重型页面组件
const GameRoom = dynamic(() => import('@/components/GameRoom'), {
  loading: () => <LoadingSpinner />,
  ssr: false, // 如果需要客户端渲染
});

const HomePage = () => {
  return (
    <MainLayout>
      <GameRoom />
    </MainLayout>
  );
};
```

#### 组件级代码分割
对非关键路径组件使用懒加载。

```typescript
// 懒加载重型UI组件
const HeavyChartComponent = dynamic(
  () => import('@/components/HeavyChartComponent'),
  {
    loading: () => <ChartPlaceholder />,
  }
);

// 懒加载游戏特效
const SpecialEffects = dynamic(
  () => import('@/components/SpecialEffects'),
  {
    ssr: false, // 特效通常不需要SSR
  }
);
```

### 3.3 资源优化

#### 图片优化
使用Next.js Image组件自动优化图片。

```typescript
import Image from 'next/image';

const PlayerAvatar = ({ avatarUrl, name }: { avatarUrl: string; name: string }) => {
  return (
    <div className="player-avatar">
      <Image
        src={avatarUrl}
        alt={`${name}的头像`}
        width={64}
        height={64}
        className="rounded-full"
        priority={false} // 非首屏图片不设置priority
        sizes="(max-width: 768px) 64px, 96px"
      />
      <span>{name}</span>
    </div>
  );
};
```

#### 字体优化
使用next/font优化字体加载。

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
```

## 4. 可访问性标准

### 4.1 WCAG 2.1 AA合规性

#### 对比度要求
- 正常文本：对比度 ≥ 4.5:1
- 大文本（18px+或14px+粗体）：对比度 ≥ 3:1
- UI组件和图形：对比度 ≥ 3:1

```typescript
// 使用设计标记中的合规颜色
const accessibleColors = {
  primaryText: colors.gray[900], // 对比度 9.8:1 ✓
  secondaryText: colors.gray[700], // 对比度 4.5:1 ✓
  errorText: colors.red[600], // 对比度 5.5:1 ✓
  disabledText: colors.gray[400], // 对比度 2.9:1 ✗（需要调整）
};
```

#### 键盘导航支持
所有交互元素必须支持键盘操作。

```typescript
const AccessibleButton = ({
  onClick,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // 支持Enter和Space键激活
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      {...props}
    >
      {children}
    </button>
  );
};
```

### 4.2 ARIA属性规范

#### 必要的ARIA属性
为所有交互元素提供适当的ARIA属性。

```typescript
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
}: ModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  return isOpen ? (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      tabIndex={-1}
      className="modal"
    >
      <div className="modal-header">
        <h2 id="modal-title">{title}</h2>
        <button
          onClick={onClose}
          aria-label="关闭模态框"
        >
          ×
        </button>
      </div>
      <div className="modal-content">{children}</div>
    </div>
  ) : null;
};
```

#### 动态内容通知
使用aria-live区域通知屏幕阅读器动态内容变化。

```typescript
const ToastNotification = ({ message, type }: ToastProps) => {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={`toast toast-${type}`}
    >
      {message}
    </div>
  );
};

// 状态变化通知
const GameStatus = ({ status }: { status: GameStatus }) => {
  return (
    <div aria-live="polite" aria-atomic="true">
      <span className="sr-only">游戏状态：</span>
      <span>{getStatusText(status)}</span>
    </div>
  );
};
```

## 5. 测试标准

### 5.1 单元测试

#### 组件测试
使用React Testing Library测试组件行为。

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  test('渲染正确文本', () => {
    render(<Button>点击我</Button>);
    expect(screen.getByText('点击我')).toBeInTheDocument();
  });

  test('点击触发回调', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>点击我</Button>);

    fireEvent.click(screen.getByText('点击我'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('禁用状态不触发回调', () => {
    const handleClick = jest.fn();
    render(
      <Button disabled onClick={handleClick}>
        点击我
      </Button>
    );

    fireEvent.click(screen.getByText('点击我'));
    expect(handleClick).not.toHaveBeenCalled();
  });
});
```

#### Hook测试
使用@testing-library/react-hooks测试自定义Hook。

```typescript
// useGameState.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useGameState } from './useGameState';
import { mockGameData } from './mocks';

describe('useGameState', () => {
  test('初始状态为加载中', () => {
    const { result } = renderHook(() => useGameState('room-123'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test('成功获取游戏数据', async () => {
    // 模拟API响应
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockGameData),
    });

    const { result, waitForNextUpdate } = renderHook(() =>
      useGameState('room-123')
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual(mockGameData);
    expect(result.current.error).toBeNull();
  });
});
```

### 5.2 集成测试

#### 组件交互测试
测试多个组件之间的交互。

```typescript
// GameTable.test.tsx
describe('GameTable', () => {
  test('玩家出牌流程', async () => {
    const mockOnPlay = jest.fn();

    render(
      <GameTable
        cards={mockCards}
        currentPlayer="player1"
        onCardPlay={mockOnPlay}
      />
    );

    // 选择一张牌
    const card = screen.getByTestId('card-1');
    fireEvent.click(card);

    // 点击出牌按钮
    const playButton = screen.getByText('出牌');
    fireEvent.click(playButton);

    expect(mockOnPlay).toHaveBeenCalledWith(mockCards[0]);
  });
});
```

### 5.3 E2E测试

#### Playwright测试
使用Playwright测试核心用户路径。

```typescript
// game-flow.spec.ts
import { test, expect } from '@playwright/test';

test('完整的游戏流程', async ({ page }) => {
  // 1. 进入游戏房间
  await page.goto('/room/test-room');
  await expect(page.getByText('游戏房间')).toBeVisible();

  // 2. 准备游戏
  await page.click('button:has-text("准备")');
  await expect(page.getByText('已准备')).toBeVisible();

  // 3. 开始游戏
  await page.click('button:has-text("开始游戏")');
  await expect(page.getByText('游戏进行中')).toBeVisible();

  // 4. 出牌
  await page.click('[data-testid="card-1"]');
  await page.click('button:has-text("出牌")');

  // 5. 验证出牌成功
  await expect(page.getByText('出牌成功')).toBeVisible();
});
```

## 6. 代码质量标准

### 6.1 TypeScript配置

#### 严格模式
启用所有TypeScript严格检查。

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

#### 类型定义规范
为所有函数、组件和状态提供完整的类型定义。

```typescript
// ✅ 正确：完整的类型定义
interface GameState {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  currentTurn: number;
  deck: Card[];
}

type GameAction =
  | { type: 'START_GAME'; payload: { roomId: string } }
  | { type: 'PLAY_CARD'; payload: { playerId: string; card: Card } }
  | { type: 'PASS_TURN'; payload: { playerId: string } };

// ❌ 避免：使用any类型
const handleGameAction = (action: any) => { // 避免使用any
  // ...
};
```

### 6.2 ESLint配置

#### 规则集配置
使用严格的ESLint规则确保代码质量。

```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'next/core-web-vitals',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  rules: {
    // React规则
    'react/prop-types': 'off', // 使用TypeScript代替
    'react/react-in-jsx-scope': 'off', // Next.js不需要
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',

    // TypeScript规则
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/explicit-function-return-type': [
      'warn',
      {
        allowExpressions: true,
        allowHigherOrderFunctions: true,
      },
    ],

    // 代码质量规则
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-unused-vars': 'off', // 使用TypeScript的检查
    '@typescript-eslint/no-unused-vars': ['error'],
  },
};
```

### 6.3 提交前检查

#### Husky + lint-staged
在提交前自动运行代码检查和测试。

```json
// package.json
{
  "scripts": {
    "lint": "eslint . --ext ts,tsx --max-warnings 0",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "prepare": "husky install"
  },
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{js,jsx,json,md}": [
      "prettier --write"
    ]
  }
}
```

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx lint-staged
npm run type-check
npm run test
```

## 7. 实施路线图

### 阶段1：基础架构优化（当前）
- [ ] 重构RoomPage组件，减少useEffect数量
- [ ] 提取自定义Hook，分离关注点
- [ ] 统一设计标记使用
- [ ] 增加组件测试覆盖率

### 阶段2：性能优化
- [ ] 实施代码分割策略
- [ ] 优化图片资源加载
- [ ] 添加虚拟滚动支持
- [ ] 实施性能监控

### 阶段3：可访问性提升
- [ ] 全面审计可访问性问题
- [ ] 修复对比度问题
- [ ] 完善键盘导航支持
- [ ] 添加屏幕阅读器测试

### 阶段4：开发体验优化
- [ ] 完善组件文档
- [ ] 添加Storybook支持
- [ ] 优化开发工作流
- [ ] 实施自动化部署

## 8. 代码审查清单

### 组件设计审查
- [ ] 组件职责是否单一？
- [ ] 是否使用组合而非继承？
- [ ] Props类型定义是否完整？
- [ ] 是否有不必要的状态？

### 性能审查
- [ ] 是否避免不必要的重渲染？
- [ ] 是否使用useCallback/useMemo？
- [ ] 是否有代码分割机会？
- [ ] 图片是否优化？

### 可访问性审查
- [ ] 对比度是否符合WCAG标准？
- [ ] 是否支持键盘导航？
- [ ] 是否有适当的ARIA属性？
- [ ] 屏幕阅读器是否友好？

### 测试审查
- [ ] 是否有单元测试？
- [ ] 测试覆盖率是否达标？
- [ ] 是否有集成测试？
- [ ] 是否有E2E测试？

### 代码质量审查
- [ ] TypeScript类型是否完整？
- [ ] 是否有ESLint错误？
- [ ] 代码格式是否一致？
- [ ] 错误处理是否完善？

## 9. 参考资料

1. [React官方文档](https://react.dev/)
2. [Next.js文档](https://nextjs.org/docs)
3. [TypeScript手册](https://www.typescriptlang.org/docs/)
4. [Tailwind CSS文档](https://tailwindcss.com/docs)
5. [WCAG 2.1指南](https://www.w3.org/WAI/WCAG21/quickref/)
6. [Testing Library文档](https://testing-library.com/docs/)
7. [Playwright文档](https://playwright.dev/docs/intro)

---

**版本历史**
| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-19 | 初始版本，制定完整的前端开发标准 |

**维护者**
前端架构团队 - 负责前端开发标准的制定和维护

**更新频率**
- 每季度审查一次标准
- 根据技术发展和项目需求及时更新
- 重大变更需团队评审通过