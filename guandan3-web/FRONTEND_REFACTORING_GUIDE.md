# 掼蛋3 前端重构指南

## 概述

本文档针对掼蛋3项目当前前端代码中的问题，提供具体的重构方案和实施步骤。基于对现有代码的分析，重点解决以下问题：

1. **useEffect滥用和时序问题** - RoomPage组件中有过多useEffect
2. **组件耦合度过高** - 游戏房间组件职责不单一
3. **设计系统使用不一致** - 硬编码样式值
4. **测试覆盖率不足** - 关键组件缺乏测试

## 1. RoomPage组件重构

### 当前问题分析

`src/app/room/[roomId]/page.tsx` 组件存在以下问题：

1. **25+个useEffect**：副作用分散，时序难以控制
2. **混合关注点**：包含UI状态、游戏逻辑、音效、动画等多个职责
3. **状态管理混乱**：本地状态和全局状态混合使用
4. **可测试性差**：组件过于复杂，难以编写测试

### 重构方案

#### 1.1 提取自定义Hook

将相关逻辑提取到自定义Hook中，每个Hook负责一个明确的职责。

```typescript
// 提取游戏状态相关的Hook
const useGameStateManager = (roomId: string) => {
  const { gameState, isLoading, error } = useGameStore();
  const { subscribeToGame, unsubscribeFromGame } = useGameSubscription();

  useEffect(() => {
    subscribeToGame(roomId);
    return () => unsubscribeFromGame(roomId);
  }, [roomId]);

  return { gameState, isLoading, error };
};

// 提取音效相关的Hook
const useGameSoundEffects = () => {
  const { playSound } = useSound();
  const { isMyTurn, gameStatus } = useGameState();

  useEffect(() => {
    if (isMyTurn) {
      playSound('turn');
    }
  }, [isMyTurn, playSound]);

  useEffect(() => {
    if (gameStatus === 'finished') {
      playSound('win');
    }
  }, [gameStatus, playSound]);

  // 返回音效控制方法
  return { playCardSound: () => playSound('play') };
};

// 提取动画相关的Hook
const useGameAnimations = () => {
  const [showDealAnimation, setShowDealAnimation] = useState(false);
  const [showPlayAnimation, setShowPlayAnimation] = useState(false);
  const { gameStatus, lastAction } = useGameState();

  useEffect(() => {
    if (gameStatus === 'playing') {
      setShowDealAnimation(true);
    }
  }, [gameStatus]);

  useEffect(() => {
    if (lastAction?.type === 'play') {
      setShowPlayAnimation(true);
    }
  }, [lastAction]);

  return {
    showDealAnimation,
    showPlayAnimation,
    hideDealAnimation: () => setShowDealAnimation(false),
    hidePlayAnimation: () => setShowPlayAnimation(false),
  };
};
```

#### 1.2 拆分组件

将RoomPage拆分为多个子组件，每个组件负责特定的UI部分。

```typescript
// RoomPage重构后结构
const RoomPage = ({ roomId }: { roomId: string }) => {
  // 使用提取的Hook
  const { gameState, isLoading, error } = useGameStateManager(roomId);
  const { playCardSound } = useGameSoundEffects();
  const { showDealAnimation, showPlayAnimation } = useGameAnimations();

  if (isLoading) return <LoadingScreen />;
  if (error) return <ErrorScreen error={error} />;

  return (
    <GameLayout>
      <RoomHeader roomId={roomId} />
      <GameTableArea gameState={gameState} />
      <PlayerSeats gameState={gameState} />
      <HandArea
        gameState={gameState}
        onPlay={handlePlay}
        onPlaySound={playCardSound}
      />
      <GameEffects
        showDealAnimation={showDealAnimation}
        showPlayAnimation={showPlayAnimation}
      />
      <RoomSidebar roomId={roomId} />
    </GameLayout>
  );
};
```

#### 1.3 实施步骤

1. **第一步：创建自定义Hook**
   - 在 `src/hooks/game/` 目录下创建新的Hook文件
   - 将RoomPage中的相关逻辑移动到Hook中
   - 确保每个Hook有明确的输入和输出

2. **第二步：创建子组件**
   - 在 `src/components/game/` 目录下创建子组件
   - 按照UI区域划分组件职责
   - 确保组件props类型定义完整

3. **第三步：重构RoomPage**
   - 使用新的Hook和组件替换原有逻辑
   - 确保功能保持不变
   - 添加必要的错误边界

4. **第四步：编写测试**
   - 为每个自定义Hook编写单元测试
   - 为每个子组件编写组件测试
   - 为RoomPage编写集成测试

## 2. 设计系统统一实施

### 当前问题分析

1. **硬编码样式值**：代码中直接使用颜色、间距等值
2. **设计标记使用不一致**：部分使用设计标记，部分硬编码
3. **响应式设计不统一**：断点使用不一致

### 统一方案

#### 2.1 设计标记使用规范

```typescript
// ✅ 正确：使用设计标记
import { colors, spacing, borderRadius } from '@/lib/design-tokens';

const Button = () => {
  return (
    <button
      style={{
        backgroundColor: colors.primary[500],
        padding: spacing[4],
        borderRadius: borderRadius.md,
      }}
    >
      按钮
    </button>
  );
};

// ✅ 更好：使用Tailwind CSS类名（基于设计标记配置）
const Button = () => {
  return (
    <button className="bg-primary-500 px-4 py-2 rounded-md">
      按钮
    </button>
  );
};
```

#### 2.2 Tailwind配置统一

确保 `tailwind.config.ts` 使用设计标记中的值：

```typescript
// tailwind.config.ts
import { colors, spacing, borderRadius, typography } from './src/lib/design-tokens';

export default {
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        error: colors.error,
        warning: colors.warning,
        gray: colors.gray,
      },
      spacing: {
        ...spacing,
      },
      borderRadius: {
        ...borderRadius,
      },
      fontSize: {
        ...typography.fontSize,
      },
    },
  },
};
```

#### 2.3 实施步骤

1. **第一步：检查设计标记文件**
   - 确保 `src/lib/design-tokens.ts` 包含所有必要的值
   - 添加缺失的设计标记

2. **第二步：更新Tailwind配置**
   - 将设计标记导入Tailwind配置
   - 确保所有值正确映射

3. **第三步：修复硬编码样式**
   - 搜索并替换硬编码的颜色值
   - 搜索并替换硬编码的间距值
   - 搜索并替换硬编码的圆角值

4. **第四步：添加ESLint规则**
   - 添加禁止硬编码样式的ESLint规则
   - 配置自动修复

## 3. 状态管理优化

### 当前问题分析

1. **状态切片不够清晰**：部分store包含不相关的状态
2. **选择器使用不足**：组件直接使用整个store
3. **异步状态处理不一致**：加载、错误状态处理方式不同

### 优化方案

#### 3.1 状态切片重构

```typescript
// 当前：混合的状态
interface GameStore {
  gameState: GameState;
  roomState: RoomState;
  uiState: UIState;
  userState: UserState;
}

// 优化后：清晰的切片
// store/game.ts
interface GameStore {
  gameId: string | null;
  status: GameStatus;
  players: Player[];
  currentTurn: number;
  // 仅游戏相关状态和方法
}

// store/room.ts
interface RoomStore {
  roomId: string | null;
  members: Member[];
  settings: RoomSettings;
  // 仅房间相关状态和方法
}

// store/ui.ts
interface UIStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  notifications: Notification[];
  // 仅UI相关状态和方法
}
```

#### 3.2 选择器优化

```typescript
// 当前：直接使用整个store
const GameComponent = () => {
  const gameStore = useGameStore(); // 任何变化都会导致重渲染
  // ...
};

// 优化后：使用选择器
const GameComponent = () => {
  const currentPlayer = useGameStore((state) => state.players[state.currentTurn]);
  const gameStatus = useGameStore((state) => state.status);
  // 只有相关状态变化时才会重渲染
};
```

#### 3.3 实施步骤

1. **第一步：分析现有store**
   - 识别混合的状态
   - 确定合理的切片边界

2. **第二步：创建新的store切片**
   - 按照业务领域创建新的store文件
   - 迁移相关状态和方法

3. **第三步：更新组件使用**
   - 将组件从使用整个store改为使用选择器
   - 确保性能优化

4. **第四步：删除旧store**
   - 确认所有组件已迁移
   - 删除不再使用的store文件

## 4. 测试覆盖率提升

### 当前问题分析

1. **关键组件缺乏测试**：游戏逻辑组件测试不足
2. **测试类型不完整**：缺乏集成测试和E2E测试
3. **测试数据管理混乱**：测试数据分散，难以维护

### 提升方案

#### 4.1 测试策略

```typescript
// 测试金字塔策略
// 1. 单元测试（基础）：测试工具函数、自定义Hook
// 2. 组件测试（中间）：测试React组件
// 3. 集成测试（上层）：测试组件交互
// 4. E2E测试（顶层）：测试完整用户流程
```

#### 4.2 测试数据管理

```typescript
// 创建统一的测试数据工厂
// test/factories/game.ts
export const createMockGameState = (overrides?: Partial<GameState>): GameState => ({
  id: 'game-123',
  status: 'playing',
  players: [
    { id: 'player-1', name: '玩家1', hand: [] },
    { id: 'player-2', name: '玩家2', hand: [] },
  ],
  currentTurn: 0,
  deck: [],
  ...overrides,
});

// test/factories/card.ts
export const createMockCard = (overrides?: Partial<Card>): Card => ({
  id: 1,
  suit: 'H',
  rank: 'A',
  value: 14,
  ...overrides,
});
```

#### 4.3 实施步骤

1. **第一步：识别测试缺口**
   - 分析现有测试覆盖率
   - 识别关键但未测试的组件

2. **第二步：创建测试基础设施**
   - 创建测试数据工厂
   - 设置测试工具函数
   - 配置测试环境

3. **第三步：编写缺失的测试**
   - 为关键工具函数编写单元测试
   - 为游戏组件编写组件测试
   - 为组件交互编写集成测试

4. **第四步：建立E2E测试**
   - 识别核心用户路径
   - 编写Playwright测试
   - 配置CI/CD集成

## 5. 性能优化实施

### 当前问题分析

1. **缺乏代码分割**：所有代码打包到一个bundle中
2. **图片未优化**：直接使用img标签
3. **动画性能问题**：可能引起布局抖动

### 优化方案

#### 5.1 代码分割策略

```typescript
// 路由级代码分割
// app/lobby/page.tsx
import dynamic from 'next/dynamic';

const LobbyPage = dynamic(() => import('@/components/LobbyPage'), {
  loading: () => <LoadingSpinner />,
});

// 组件级代码分割
const HeavyGameComponent = dynamic(
  () => import('@/components/HeavyGameComponent'),
  {
    loading: () => <GameComponentPlaceholder />,
    ssr: false, // 不需要SSR的组件
  }
);
```

#### 5.2 图片优化

```typescript
// 使用Next.js Image组件
import Image from 'next/image';

const OptimizedImage = ({ src, alt }: { src: string; alt: string }) => {
  return (
    <Image
      src={src}
      alt={alt}
      width={500}
      height={300}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      quality={85}
      priority={false}
    />
  );
};
```

#### 5.3 实施步骤

1. **第一步：分析bundle大小**
   - 使用Next.js bundle分析工具
   - 识别大型依赖和组件

2. **第二步：实施代码分割**
   - 对路由页面进行代码分割
   - 对重型组件进行懒加载

3. **第三步：优化图片资源**
   - 替换所有img标签为Next.js Image
   - 配置适当的图片尺寸和质量

4. **第四步：监控性能**
   - 添加性能监控
   - 建立性能基准
   - 定期进行性能测试

## 6. 可访问性改进

### 当前问题分析

1. **对比度问题**：部分文本对比度不足
2. **键盘导航缺失**：部分交互不支持键盘
3. **屏幕阅读器支持不足**：缺乏ARIA属性

### 改进方案

#### 6.1 对比度修复

```typescript
// 使用设计标记中的合规颜色
const AccessibleText = () => {
  return (
    <div>
      {/* 正常文本：对比度 ≥ 4.5:1 */}
      <p className="text-gray-900">主要文本</p>

      {/* 大文本：对比度 ≥ 3:1 */}
      <h1 className="text-gray-800 text-2xl">大标题</h1>

      {/* 错误：对比度不足 */}
      <p className="text-gray-400">禁用文本</p> {/* 需要修复 */}
    </div>
  );
};
```

#### 6.2 键盘导航支持

```typescript
const AccessibleButton = ({ onClick, children }: ButtonProps) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      className="accessible-button"
    >
      {children}
    </button>
  );
};
```

#### 6.3 实施步骤

1. **第一步：可访问性审计**
   - 使用axe工具进行自动审计
   - 手动测试键盘导航
   - 屏幕阅读器测试

2. **第二步：修复高优先级问题**
   - 修复对比度问题
   - 添加键盘导航支持
   - 添加必要的ARIA属性

3. **第三步：建立可访问性测试**
   - 添加可访问性单元测试
   - 集成到CI/CD流程
   - 定期进行可访问性审查

## 7. 实施时间表

### 第一周：准备阶段
- [ ] 分析现有代码问题
- [ ] 制定详细重构计划
- [ ] 建立开发环境
- [ ] 创建测试基础设施

### 第二周：核心重构
- [ ] 重构RoomPage组件
- [ ] 提取自定义Hook
- [ ] 创建子组件
- [ ] 编写组件测试

### 第三周：设计系统统一
- [ ] 修复硬编码样式
- [ ] 统一设计标记使用
- [ ] 更新Tailwind配置
- [ ] 添加ESLint规则

### 第四周：状态管理优化
- [ ] 重构状态切片
- [ ] 优化选择器使用
- [ ] 统一异步状态处理
- [ ] 性能测试

### 第五周：测试覆盖率提升
- [ ] 编写缺失的单元测试
- [ ] 添加集成测试
- [ ] 建立E2E测试
- [ ] 达到85%测试覆盖率

### 第六周：性能优化
- [ ] 实施代码分割
- [ ] 优化图片资源
- [ ] 添加性能监控
- [ ] 性能测试和优化

### 第七周：可访问性改进
- [ ] 可访问性审计
- [ ] 修复对比度问题
- [ ] 添加键盘导航支持
- [ ] 屏幕阅读器测试

### 第八周：收尾和文档
- [ ] 代码审查
- [ ] 更新文档
- [ ] 培训团队
- [ ] 项目总结

## 8. 风险管理和缓解措施

### 技术风险
1. **重构引入bug**
   - 缓解：逐步重构，每个步骤都有测试
   - 缓解：保持功能不变，通过测试验证

2. **性能下降**
   - 缓解：每个优化步骤都进行性能测试
   - 缓解：建立性能基准，监控变化

3. **兼容性问题**
   - 缓解：保持API兼容性
   - 缓解：提供迁移指南

### 项目风险
1. **时间延误**
   - 缓解：制定详细的时间表
   - 缓解：优先处理高价值任务

2. **团队阻力**
   - 缓解：充分沟通重构价值
   - 缓解：提供培训和支持

3. **测试覆盖率不足**
   - 缓解：测试驱动开发
   - 缓解：自动化测试集成

## 9. 成功标准

### 技术指标
- [ ] RoomPage组件useEffect数量减少70%以上
- [ ] 测试覆盖率从当前水平提升到85%以上
- [ ] 首次内容绘制（FCP）优化20%以上
- [ ] 可访问性审计通过率100%

### 业务指标
- [ ] 代码维护成本降低
- [ ] 新功能开发速度提升
- [ ] Bug数量减少
- [ ] 团队开发体验改善

### 质量指标
- [ ] 代码审查通过率提升
- [ ] 部署成功率100%
- [ ] 用户满意度提升
- [ ] 性能监控指标达标

## 10. 参考资料

1. [FRONTEND_DEVELOPMENT_STANDARDS.md](./FRONTEND_DEVELOPMENT_STANDARDS.md) - 前端开发标准
2. [UI_DEVELOPMENT_STANDARDS.md](./UI_DEVELOPMENT_STANDARDS.md) - UI开发标准
3. [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) - 设计系统文档
4. [现有代码分析报告] - 代码质量分析

---

**版本历史**
| 版本 | 日期 | 变更说明 |
|------|------|----------|
| 1.0.0 | 2026-03-19 | 初始版本，制定前端重构指南 |

**负责人**
前端架构团队 - 负责重构计划的制定和执行

**更新频率**
- 每周更新实施进度
- 根据实际情况调整计划
- 重大变更需团队评审