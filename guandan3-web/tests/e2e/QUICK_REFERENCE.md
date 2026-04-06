# E2E测试优化快速参考

## 快速开始

### 1. 导入优化工具

```typescript
import {
  waitForGameProgress,
  waitForAIPlay,
  waitForGameEnd,
  GameProgressMonitor,
  safeClick,
  TEST_TIMEOUTS
} from './shared';
```

### 2. 常用模式

#### 等待游戏进展
```typescript
// 替代: await page.waitForTimeout(5000)
const result = await waitForGameProgress(page);
```

#### 监控游戏循环
```typescript
const monitor = new GameProgressMonitor(10);

while (!gameEnded) {
  const status = await monitor.checkProgress(page);
  if (status.isStuck) break;
  await page.waitForTimeout(2000);
}
```

#### 等待AI出牌
```typescript
// 替代: await page.waitForTimeout(10000)
const hasPlayed = await waitForAIPlay(page);
```

#### 安全点击
```typescript
// 替代: await button.click()
const clicked = await safeClick(button);
```

## 超时配置参考

| 测试类型 | 超时时间 | 适用场景 |
|---------|---------|---------|
| TEST_TIMEOUTS.FAST | 10秒 | 点击、输入等快速操作 |
| TEST_TIMEOUTS.NORMAL | 30秒 | 页面导航、组件加载 |
| TEST_TIMEOUTS.SLOW | 60秒 | AI决策、网络请求 |
| TEST_TIMEOUTS.GAME | 120秒 | 完整游戏流程 |
| TEST_TIMEOUTS.STRESS | 300秒 | 压力测试、长时间运行 |

## 最佳实践

### DO - 推荐做法

✅ 使用智能等待工具
```typescript
await waitForGameProgress(page);
```

✅ 设置合理的超时
```typescript
test.setTimeout(240000); // 4分钟，根据实际需要
```

✅ 监控游戏进展
```typescript
const monitor = new GameProgressMonitor();
```

✅ 使用安全操作
```typescript
await safeClick(button);
```

### DON'T - 避免做法

❌ 固定长时间等待
```typescript
await page.waitForTimeout(60000); // 不要这样做
```

❌ 过于严格的断言
```typescript
expect(cardCount).toBe(15); // 太严格
```

❌ 无限循环
```typescript
while (true) { // 危险
  // 没有退出条件
}
```

❌ 忽略超时配置
```typescript
// 不设置超时，使用默认值
```

## 迁移检查清单

- [ ] 检查测试超时是否合理
- [ ] 替换固定等待为智能等待
- [ ] 添加游戏进展监控
- [ ] 使用安全操作函数
- [ ] 更新断言为合理范围
- [ ] 测试验证修改有效

## 故障排查

### 问题: 测试仍然超时

**解决方案**:
1. 增加测试超时时间
2. 检查是否有网络延迟
3. 优化等待逻辑
4. 检查是否有死循环

### 问题: 测试不稳定

**解决方案**:
1. 使用智能重试
2. 增加超时缓冲
3. 检查竞态条件
4. 添加详细日志

### 问题: 测试太慢

**解决方案**:
1. 使用智能等待
2. 减少固定等待
3. 优化检查频率
4. 并行运行测试

## 相关文档

- [完整优化指南](./OPTIMIZATION_GUIDE.md)
- [修复总结](./TIMEOUT_FIX_SUMMARY.md)
- [详细报告](../TEST_TIMEOUT_FIX_REPORT.md)

## 获取帮助

如有问题，请参考：
1. 测试代码示例
2. 优化指南文档
3. Playwright官方文档
4. 团队测试专家

---

**最后更新**: 2026-04-02
**版本**: 1.0
