# AI系统质量保证长期方案

## 执行摘要

本文档提供了一套完整的质量保证体系，确保AI系统不再出现类似问题，并能在问题出现时快速发现和修复。

---

## 1. 测试驱动策略

### 1.1 测试金字塔

```
        /\
       /E2E\        ← 10% : 关键用户流程
      /------\
     /  集成  \      ← 30% : AI决策流程、前后端交互
    /----------\
   /   单元测试   \   ← 60% : 牌型判断、决策逻辑
  /--------------\
```

### 1.2 必需的测试覆盖

#### 单元测试（目标：85%+ 覆盖率）

| 模块 | 测试文件 | 覆盖内容 |
|------|---------|---------|
| 规则引擎 | `rules.test.ts` | 所有牌型判断、大小比较 |
| AI决策 | `ai-decision.test.ts` | 决策逻辑全场景覆盖 |
| AI策略 | `ai-strategy.test.ts` | 评分函数、难度调整 |
| 锁机制 | `ai-lock-mechanism.test.ts` | 并发、超时、释放 |

#### 集成测试（目标：70%+ 覆盖率）

| 场景 | 测试文件 | 关键验证点 |
|------|---------|-----------|
| 前后端一致性 | `ai-backend-validation.test.ts` | 验证逻辑同步 |
| 完整决策流程 | `ai-decision-flow.test.ts` | 从触发到提交 |
| Realtime同步 | `ai-realtime-race.test.ts` | 竞态条件处理 |

#### E2E测试（关键用户流程）

| 流程 | 测试文件 | 验证点 |
|------|---------|--------|
| 完整游戏 | `complete-practice-game.spec.ts` | AI能完成游戏 |
| 过牌序列 | `ai-pass-sequence.spec.ts` | 边缘场景处理 |
| 错误恢复 | `ai-error-recovery.spec.ts` | 异常后继续运行 |

### 1.3 回归测试策略

```bash
# 每次代码变更运行
npm run test:ai:unit

# 每次合并到主分支前运行
npm run test:ai:ci

# 每日夜间运行完整测试套件
npm run test:ai
```

---

## 2. CI/CD 集成

### 2.1 自动化测试流程

```yaml
# .github/workflows/ai-tests.yml
name: AI Tests

on:
  pull_request:
    paths:
      - 'src/lib/game/ai/**'
      - 'src/lib/hooks/ai/**'
      - 'src/test/unit/game/ai*.test.ts'
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run AI unit tests
        run: npm run test:ai:unit --coverage

      - name: Check coverage threshold
        run: |
          COVERAGE=$(npx vitest run --coverage --reporter=json | jq '.coverage')
          if (( $(echo "$COVERAGE < 85" | bc -l) )); then
            echo "Coverage $COVERAGE% is below 85% threshold"
            exit 1
          fi

      - name: Run AI integration tests
        run: npm run test:ai:integration

      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### 2.2 质量门禁

| 检查项 | 阈值 | 阻止合并 |
|--------|------|---------|
| 单元测试通过率 | 100% | ✅ |
| 测试覆盖率 | ≥85% | ✅ |
| TypeScript错误 | 0 | ✅ |
| ESLint错误 | 0 | ✅ |
| E2E测试通过率 | 100% | ✅ |

---

## 3. 代码审查流程

### 3.1 审查检查清单

#### AI相关代码必须检查：

- [ ] **前端验证逻辑变更** → 检查是否同步更新后端
- [ ] **后端验证逻辑变更** → 检查是否同步更新前端测试
- [ ] **新牌型添加** → 测试所有场景（领出、跟牌、炸弹）
- [ ] **锁机制修改** → 检查并发安全性
- [ ] **状态依赖修改** → 检查useEffect依赖数组

#### PR描述模板：

```markdown
## 变更类型
- [ ] 修复bug
- [ ] 新功能
- [ ] 重构
- [ ] 测试
- [ ] 文档

## AI相关检查
- [ ] 更新了相关测试
- [ ] 运行 `npm run test:ai:unit` 全部通过
- [ ] 运行 `npm run test:ai:ci` 全部通过
- [ ] 测试覆盖率未下降
- [ ] 前后端验证逻辑已同步

## 测试证据
- [ ] 附上测试运行结果截图
- [ ] 附上覆盖率报告
```

### 3.2 双人审查机制

对于AI核心代码，要求：
1. **第一审查人**：AI系统开发者
2. **第二审查人**：数据库或后端开发者

---

## 4. 监控和告警

### 4.1 生产环境监控指标

| 指标 | 阈值 | 告警级别 |
|------|------|---------|
| AI出牌成功率 | >95% | P2 |
| 400错误率 | <0.1% | P1 |
| AI决策延迟P99 | <500ms | P2 |
| 卡牌验证失败率 | <0.05% | P1 |
| 锁超时频率 | <1次/小时 | P2 |

### 4.2 实时监控面板

创建Supabase Dashboard监控：

```sql
-- 创建监控视图
create or replace view ai_performance_monitor as
select
  date_trunc('hour', created_at) as hour,
  count(*) filter (where error_message like '%400%') as error_400_count,
  count(*) filter (where error_message like '%invalid_move%') as invalid_move_count,
  count(*) filter (where error_message like '%turn_no_mismatch%') as turn_mismatch_count,
  count(*) as total_turns
from public.turns
where created_at > now() - interval '1 day'
group by hour
order by hour desc;
```

### 4.3 错误跟踪服务

```typescript
// src/lib/utils/error-tracking.ts
export function trackAIError(error: Error, context: {
  seatNo: number;
  turnNo: number;
  hand: Card[];
  lastAction: any;
  difficulty: string;
}) {
  // 发送到错误跟踪服务
  // 记录完整上下文用于调试
  logger.error('[AI_ERROR]', {
    error: error.message,
    stack: error.stack,
    context: {
      seatNo: context.seatNo,
      turnNo: context.turnNo,
      handSize: context.hand.length,
      difficulty: context.difficulty,
      timestamp: new Date().toISOString(),
    },
  });
}
```

---

## 5. 文档维护

### 5.1 必需文档

| 文档 | 用途 | 更新频率 |
|------|------|---------|
| AI系统架构 | 整体设计 | 架构变更时 |
| 前后端验证规范 | 验证规则一致 | 规则变更时 |
| 问题修复日志 | 历史问题记录 | 每次修复后 |
| 测试覆盖报告 | 覆盖率趋势 | 每周 |
| 性能基线 | 性能目标 | 每月 |

### 5.2 决策记录

创建 `docs/AI_DECISIONS.md`：

```markdown
# AI系统决策记录

## 2026-04-01: 前后端验证统一

**问题**: 数据库验证函数使用简单牌数比较，导致前后端不一致

**决策**: 保持前端复杂验证，后端做基本检查，通过测试确保一致性

**理由**:
1. 前端已有完整验证逻辑
2. 后端简化提升性能
3. 通过集成测试保证一致性
```

---

## 6. 技术债务管理

### 6.1 债务识别

| 债务类型 | 优先级 | 预估工作量 |
|---------|--------|------------|
| 完整的后端牌型验证 | P2 | 2天 |
| AI性能优化 | P3 | 1周 |
| 测试覆盖提升至90% | P2 | 3天 |
| 文档完善 | P3 | 2天 |

### 6.2 定期债务回顾

- 每月进行技术债务回顾
- 评估是否需要偿还高优先级债务
- 更新债务清单

---

## 7. 防错机制

### 7.1 代码级防错

```typescript
// src/lib/hooks/ai/useAIDecision.ts

// 1. 多重验证
const isValidMove = () => {
  // 前端验证
  const frontendValid = analyzeMove(move.cards, levelRank);
  // 后端验证会再次检查
  // 提交前最后验证
  const latestState = useGameStore.getState();
  if (latestState.turnNo !== turnNo) return false;
  return true;
};

// 2. 超时保护
const timeoutId = setTimeout(() => {
  if (submittingTurnRef.current === lockKey) {
    logger.warn('[AI_TIMEOUT] 决策超时，强制重置');
    submittingTurnRef.current = null;
  }
}, 15000);

// 3. 错误恢复
try {
  await submitTurn(...);
} catch (error) {
  if (isRefreshedError(error)) {
    // 自动恢复
    submittingTurnRef.current = null;
  } else {
    // 记录并上报
    trackAIError(error, context);
  }
}
```

### 7.2 配置级防错

```typescript
// vitest.config.ts
export default defineConfig({
  testTimeout: 10000, // 防止测试挂起
  hookTimeout: 10000,
  testFailureThreshold: 1, // 连续失败告警
});
```

---

## 8. 持续改进机制

### 8.1 每周回顾会议

议程：
1. 本周新增问题回顾
2. 测试覆盖率趋势
3. 性能指标审查
4. 技术债务更新

### 8.2 每月健康检查

```
第1周: 运行完整测试套件 + 生成覆盖率报告
第2周: 性能基准测试 + 生成性能报告
第3周: 代码质量审查 + 生成技术债务报告
第4周: 安全审查 + 更新安全基线
```

### 8.3 季度性复盘

每次发现新问题后：
1. 根本原因分析
2. 创建修复任务
3. 更新测试用例
4. 记录到问题日志
5. 更新本文档

---

## 9. 快速响应流程

### 9.1 问题分级

| 级别 | 响应时间 | 示例 |
|------|----------|------|
| P0 | 立即 | AI完全不出牌、系统崩溃 |
| P1 | 1小时内 | 频繁400错误、性能严重下降 |
| P2 | 24小时内 | 偶发错误、边缘场景 |
| P3 | 下个版本 | 优化建议、非关键问题 |

### 9.2 应急流程

```
发现P0/P1问题
    ↓
创建hotfix分支
    ↓
运行完整测试确认问题
    ↓
实施修复
    ↓
验证修复（单元+集成+E2E）
    ↓
代码审查（双人）
    ↓
合并到主分支
    ↓
部署到生产
    ↓
监控验证
```

---

## 10. 工具和脚本

### 10.1 自动化脚本

```bash
# scripts/ai-health-check.sh
#!/bin/bash
echo "=== AI系统健康检查 ==="

# 1. 运行所有测试
npm run test:ai:ci
TEST_RESULT=$?

# 2. 检查测试覆盖率
COVERAGE=$(npm run test:ai:coverage | grep "%")
echo "测试覆盖率: $COVERAGE"

# 3. 类型检查
npx tsc --noEmit
TYPE_RESULT=$?

# 4. Lint检查
npm run lint
LINT_RESULT=$?

# 汇总结果
if [ $TEST_RESULT -eq 0 ] && [ $TYPE_RESULT -eq 0 ] && [ $LINT_RESULT -eq 0 ]; then
  echo "✅ 所有检查通过"
  exit 0
else
  echo "❌ 有检查失败"
  exit 1
fi
```

### 10.2 开发者工具

```typescript
// scripts/debug-ai-decision.ts
import { analyzeMove, canBeat } from './src/lib/game/rules';

// 开发时调试AI决策
export function debugAIMove(hand: Card[], lastPlay: Card[], levelRank: number) {
  console.log('=== AI决策调试 ===');
  console.log('手牌:', hand);
  console.log('上家出牌:', lastPlay);

  const move = analyzeMove(hand, levelRank);
  console.log('识别的牌型:', move?.type);
  console.log('主值:', move?.primaryValue);

  if (lastPlay && lastPlay.length > 0) {
    const lastMove = analyzeMove(lastPlay, levelRank);
    const canBeatResult = canBeat(move!, lastMove!);
    console.log('能否压过:', canBeatResult);
  }

  return move;
}
```

---

## 11. 环境一致性

### 11.1 开发/测试/生产环境对齐

```bash
# .env.local.example
# 确保所有环境使用相同配置
VITE_AI_DIFFICULTY=medium
VITE_AI_TIMEOUT_MS=15000
VITE_AI_MAX_RETRIES=3
```

### 11.2 配置验证

```typescript
// src/lib/config/ai-config.ts
export const AI_CONFIG = {
  difficulty: import.meta.env.VITE_AI_DIFFICULTY as 'easy' | 'medium' | 'hard',
  timeout: parseInt(import.meta.env.VITE_AI_TIMEOUT_MS || '15000'),
  maxRetries: parseInt(import.meta.env.VITE_AI_MAX_RETRIES || '3'),

  // 运行时验证
  validate() {
    const validDifficulties = ['easy', 'medium', 'hard'];
    if (!validDifficulties.includes(this.difficulty)) {
      throw new Error(`Invalid AI difficulty: ${this.difficulty}`);
    }
    if (this.timeout < 5000 || this.timeout > 60000) {
      throw new Error(`AI timeout must be between 5s and 60s, got: ${this.timeout}`);
    }
  },
};
```

---

## 12. 知识管理

### 12.1 问题解决方案库

创建 `docs/AI_SOLUTIONS.md`：

```markdown
# AI问题解决方案库

## 问题: 400 Bad Request

### 症状
AI提交出牌时返回400错误，错误信息为"无效牌型"

### 原因
数据库验证函数使用 `turn_no - 1` 获取上家出牌，当其他玩家过牌时获取到 `pass` 而非实际出牌

### 解决方案
1. 修改查询排除pass类型
2. 添加过牌序列测试
3. 验证E2E测试通过

### 相关文件
- supabase/migrations/20260401000001_fix_last_payload_validation.sql
- src/test/unit/game/ai-pass-sequence.test.ts

### 修复日期
2026-04-01
```

### 12.2 代码注释规范

```typescript
/**
 * AI决策关键点：提交前状态验证
 *
 * 问题#32修复：在AI决策后到提交前，游戏状态可能已变化
 * 其他玩家可能已出牌，导致turn_no增加
 *
 * 修复：在提交前再次验证turnNo和currentSeat
 *
 * @param latestState - 最新游戏状态
 * @param turnNo - 决策时的轮次号
 * @param currentSeat - 决策时的当前座位
 * @returns {boolean} 是否可以继续提交
 */
function canSubmit(latestState, turnNo, currentSeat): boolean {
  return latestState.turnNo === turnNo &&
         latestState.currentSeat === currentSeat;
}
```

---

## 13. 外部验证

### 13.1 Beta测试流程

1. **内部测试** → 运行完整测试套件
2. **Beta测试** → 小范围真实用户测试
3. **灰度发布** → 10% → 50% → 100%
4. **全量发布** → 持续监控

### 13.2 A/B测试

重大AI逻辑变更时：
- 对照组：当前版本
- 实验组：新版本
- 监控指标：出牌成功率、用户满意度、错误率

---

## 14. 总结与行动计划

### 14.1 立即行动（本周）

- [ ] 设置CI/CD自动化测试
- [ ] 配置错误监控告警
- [ ] 创建健康检查脚本
- [ ] 建立问题解决方案库

### 14.2 短期行动（本月）

- [ ] 完善测试覆盖至85%+
- [ ] 建立双人代码审查机制
- [ ] 实施每周回顾会议
- [ ] 完成技术债务清单

### 14.3 长期维护（持续）

- [ ] 定期更新文档
- [ ] 持续优化性能
- [ ] 培养团队AI领域知识
- [ ] 保持与掼蛋规则同步

---

**核心原则**：通过测试、自动化、监控和持续改进，建立质量保证的闭环系统，确保AI系统长期稳定运行。

**文档版本**：v1.0
**创建日期**：2026-04-01
**维护者**：AI系统团队
