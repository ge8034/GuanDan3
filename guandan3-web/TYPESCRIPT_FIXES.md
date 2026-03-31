# TypeScript 错误修复优先级

## 自动修复后遗留的类型错误

### 🔴 P0 - 业务核心代码（必须修复）

#### 1. store actions 文件 - 函数签名不匹配
**文件**:
- `src/lib/store/game/actions/gameActions.ts`
- `src/lib/store/game/actions/pauseActions.ts`
- `src/lib/store/game/actions/tributeActions.ts`
- `src/lib/store/game/actions/subscriptionActions.ts`

**问题**:
- `Duplicate identifier 'state'` - 重复的state变量声明
- `Cannot find name 'set'` - 缺少set参数
- `Cannot find name 'fetchGame'` 等函数引用错误

**修复方案**: 这些是重构时引入的问题，需要恢复原始的函数签名

#### 2. React purity 问题
**文件**:
- `src/components/ContextStatusBar.tsx`
- `src/components/ContextStatusBarEnhanced.tsx`
- `src/components/ContextStatusBarPro.tsx`

**问题**: `useState(Date.now())` 在渲染时调用不纯函数

**修复**:
```typescript
const [lastUpdate, setLastUpdate] = useState(() => Date.now());
```

#### 3. logger 参数问题
**文件**:
- `src/lib/utils/error-tracking.ts`
- `src/lib/hooks/useChat.ts`
- `src/lib/performance/performance-reporter.ts`

**问题**: logger 接受3个参数但只接受2个

**修复**: 将参数合并为对象

### 🟡 P1 - 迁移工具代码（可以忽略）

**文件**: `scripts/migration-core/**` 和 `scripts/smart-migrate.ts`

**问题**: 这些是辅助工具代码，不影响主业务

**修复方案**: 暂时忽略或删除这些文件

---

## 快速修复方案

1. **回滚重构的 store actions 文件** - 恢复原始版本
2. **修复 React purity 问题** - 使用函数初始化 useState
3. **暂时删除或忽略迁移工具代码**

---

## 建议行动

由于自动修复引入了一些类型错误，建议：

1. **优先修复业务核心代码**（P0）
2. **暂时禁用迁移工具**（这些不是必需的）
3. **重新运行 typecheck 验证**

是否要执行快速修复？
