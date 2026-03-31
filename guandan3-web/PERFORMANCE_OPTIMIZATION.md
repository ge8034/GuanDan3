# 性能优化指南

本文档记录了掼蛋 3 项目的性能优化现状和未来改进方向。

---

## 📊 当前性能状态

### 已实施的优化

#### 1. 代码分割 ✅

项目已使用动态导入进行代码分割：

```typescript
// 动画组件懒加载
import { GameDealAnimation } from '@/components/animations/GameDealAnimation.lazy'
import { PlayCardAnimation } from '@/components/animations/PlayCardAnimation.lazy'
import { VictoryEffect } from '@/components/animations/VictoryEffect.lazy'

// 功能组件懒加载
import { AIStatusPanel } from './AIStatusPanel.lazy'
import { EnhancedChatBox } from '@/components/chat/EnhancedChatBox.lazy'
import { RoomInvitationPanel } from '@/components/room/RoomInvitationPanel.lazy'
```

**收益**: 减少初始加载体积，按需加载功能模块

#### 2. React 性能优化 ✅

**PlayerAvatar.tsx** - 使用 `memo` 防止不必要重渲染：
```typescript
export const PlayerAvatar = memo(function PlayerAvatar({ ... }) { ... })
```

**Card3D.tsx** - 使用 `useMemo` 缓存计算：
```typescript
const targetPosition = useMemo(() => { ... }, [position, isSelected])
const suitSymbol = useMemo(() => SUIT_SYMBOLS[suit] || suit, [suit])
const cardColor = useMemo(() => { ... }, [isSelected, hovered])
```

**GameTable3D.tsx** - 3D 渲染配置优化：
```typescript
const dpr = useMemo(() => [1, capabilities.pixelRatio], [capabilities.pixelRatio])
const shadowMapSize = useMemo(() => capabilities.shadowMapSize, [capabilities.shadowMapSize])
const softShadowSamples = useMemo(() => { ... }, [capabilities.geometryDetail])
const planeSegments = useMemo(() => { ... }, [capabilities.geometryDetail])
```

#### 3. 性能监控 ✅

项目已集成性能监控系统：
- `src/lib/performance/` - 性能监控模块
- `usePerformanceMonitor` Hook
- `useFPSMonitor` Hook
- `use3DPerformance` Hook

#### 4. 组件懒加载 ✅

已使用 `next/dynamic` 进行组件懒加载：
```typescript
const AIStatusPanel = dynamic(() => import('./AIStatusPanel.lazy'))
```

---

## 🎯 性能指标

### 当前状态

| 指标 | 目标值 | 当前状态 |
|------|--------|----------|
| 首屏加载 (3G) | ≤ 2s | 🟡 待测试 |
| 单局延迟 (P99) | ≤ 100ms | 🟡 待测试 |
| 并发用户 (CPU ≤ 30%) | 20 人 | 🟡 待测试 |
| 帧率 | 60 FPS | ✅ 3D 场景流畅 |

---

## ⚡ 建议的优化方案

### 1. RoomPage 组件拆分（高优先级）

**问题**: `src/app/room/[roomId]/page.tsx` 有 26,439 行

**建议结构**:
```
RoomPage/
├── index.tsx                 # 主容器 (200 行) - 状态管理
├── components/
│   ├── RoomGameArea.tsx    # 游戏区域 (150 行)
│   ├── PlayerSeats.tsx      # 玩家座位 (200 行)
│   ├── GameControls.tsx     # 游戏控制 (150 行)
│   └── StatusPanels.tsx     # 状态面板 (200 行)
└── hooks/
    └── useRoomGameState.ts  # 状态管理 Hook (100 行)
```

**实施步骤**:
1. 提取可复用的组件
2. 创建自定义 Hook 管理复杂逻辑
3. 使用 React.memo 包装子组件
4. 添加类型定义

**预计收益**:
- 代码可维护性提升
- 减少重渲染范围
- 更容易测试

---

### 2. 3D 渲染性能优化（中优先级）

#### 2.1 添加帧率限制

```typescript
import { useFrame } from '@react-three/fiber'

let lastFrameTime = 0
const targetFPS = 60

function GameTable3D() {
  useFrame((state, delta) => {
    const now = performance.now()
    const elapsed = now - lastFrameTime

    if (elapsed < 1000 / targetFPS) return

    lastFrameTime = now
    // 更新逻辑...
  })
}
```

#### 2.2 使用 InstancedMesh 渲染卡牌

对于大量相同几何体的卡牌，使用 InstancedMesh：

```typescript
import { InstancedMesh } from '@react-three/drei'

function CardInstances({ cards }: { cards: Card[] }) {
  const meshRef = useRef<InstancedMesh>(null)

  useEffect(() => {
    if (meshRef.current) {
      // 更新所有卡牌的位置
      cards.forEach((card, i) => {
        const matrix = new THREE.Matrix4()
        matrix.setPosition(card.position[0], card.position[1], card.position[2])
        meshRef.current.setMatrixAt(i, matrix)
      })
      meshRef.current.instanceMatrix.needsUpdate = true
    }
  }, [cards])

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, cards.length]}
    />
  )
}
```

---

### 3. 状态管理优化（中优先级）

#### 3.1 使用选择器减少重渲染

```typescript
// 优化前：整个 store 变化都会导致组件重渲染
const { currentRoom, members, gameState } = useGameStore()

// 优化后：只订阅需要的状态
const currentRoom = useGameStore(state => state.currentRoom)
const members = useGameStore(state => state.members)
const isMyTurn = useGameStore(state => state.currentSeat === state.mySeat)
```

#### 3.2 使用 Zustand 的 subscribe 模式

```typescript
// 只订阅特定状态变化
useGameStore.subscribe(
  (state) => state.myHand,
  (myHand) => {
    // 只在手牌变化时更新
    updateHandDisplay(myHand)
  }
)
```

---

### 4. 网络优化（低优先级）

#### 4.1 启用 Supabase 缓存

```typescript
import { supabase } from '@/lib/supabase/client'

// 启用查询缓存
const { data } = await supabase
  .from('rooms')
  .select('*')
  .eq('status', 'open')
  .cacheOptions({ ttl: 60000 }) // 缓存 60 秒
```

#### 4.2 批量请求数据

```typescript
// 优化前：多次请求
const room = await getRoom(roomId)
const members = await getMembers(roomId)
const gameState = await getGameState(roomId)

// 优化后：一次请求获取所有数据
const { data } = await supabase
  .from('rooms')
  .select('*, room_members(*), games(*)')
  .eq('id', roomId)
  .single()
```

---

### 5. 内存优化（低优先级）

#### 5.1 清理未使用的 Effect

```typescript
useEffect(() => {
  const subscription = subscribeToUpdates()

  return () => {
    subscription.unsubscribe()
    // 清理定时器
    clearInterval(timer)
    // 清理事件监听
    window.removeEventListener('resize', handleResize)
  }
}, [])
```

#### 5.2 使用 weak引用存储大对象

```typescript
const cardCache = new WeakMap<object, Card[]>()

function cacheCards(key: object, cards: Card[]) {
  cardCache.set(key, cards)
  // 当 key 没有引用时自动清理
}
```

---

## 📈 性能监控建议

### 1. 添加 Performance API 监控

```typescript
export function trackPerformance() {
  if (typeof window === 'undefined') return

  // 监控关键操作
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'measure') {
        const measure = entry as PerformanceMeasureTiming
        if (measure.duration > 100) {
          logger.warn('Slow operation detected:', {
            name: measure.name,
            duration: measure.duration
          })
        }
      }
    }
  })

  observer.observe({ entryTypes: ['measure'] })
}
```

### 2. 添加 FPS 监控面板

```typescript
function FPSMonitor() {
  const [fps, setFPS] = useState(60)

  useEffect(() => {
    let frameCount = 0
    let lastTime = performance.now()

    function updateFPS() {
      frameCount++
      const now = performance.now()

      if (now >= lastTime + 1000) {
        setFPS(Math.round((frameCount * 1000) / (now - lastTime)))
        frameCount = 0
        lastTime = now
      }

      requestAnimationFrame(updateFPS)
    }

    const rafId = requestAnimationFrame(updateFPS)
    return () => cancelAnimationFrame(rafId)
  }, [])

  return <div>FPS: {fps}</div>
}
```

---

## 🎯 优化优先级

| 优化项 | 影响力 | 工作量 | 优先级 |
|--------|--------|--------|--------|
| RoomPage 拆分 | 高 | 高 | 🔴 P0 |
| 3D 渲染优化 | 中 | 中 | 🟡 P1 |
| 状态管理优化 | 中 | 中 | 🟡 P1 |
| 网络优化 | 低 | 低 | 🟢 P2 |
| 内存优化 | 低 | 低 | 🟢 P2 |

---

## 📚 参考资源

- [React 性能优化](https://react.dev/learn/render-and-commit)
- [Three.js 性能优化](https://threejs.org/docs/#manual/en/introduction/Performance-tips)
- [Next.js 优化](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Zustand 最佳实践](https://github.com/pmndrs/zustand#best-practices)

---

**最后更新**: 2026-03-31
**文档版本**: 1.0
