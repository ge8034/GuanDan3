---
name: fix-ts
description: 批量修复 TypeScript 错误的自动化工作流。使用此技能时，会运行 pyright 分析类型错误，针对每个错误导航到文件进行修复，然后持续运行直到零错误，最后通过测试验证。当用户请求 "fix TypeScript errors"、"fix type errors"、"run pyright" 或类似任务时使用。
---

# /fix-ts - TypeScript 错误修复工作流

## 工作流程

执行以下 5 个步骤来系统地修复所有 TypeScript 错误：

### 步骤 1: 运行 pyright 分析错误

```bash
npx pyright --verbose
```

**目标**：获取所有 TypeScript 错误的完整列表，包括错误位置、类型信息和建议。

**注意**：
- 使用 `--verbose` 标志获取详细的错误信息
- 记录错误数量和类型分布

---

### 步骤 2: 导航到第一个错误位置

对于每个错误：

1. **识别错误**：读取 pyright 输出中的错误信息
2. **定位文件**：记录文件路径和行号
3. **读取文件**：使用 Read 工具查看上下文代码

**示例**：
```
pyright/src/app/page.tsx:42:5 - error TS2339: Property 'data' does not exist on type 'PageProps'
```

定位到：`src/app/page.tsx` 第 42 行

---

### 步骤 3: 修复类型错误

使用 Edit 工具应用修复：

1. **分析错误类型**：理解为什么存在类型不匹配
2. **选择修复方案**：
   - 添加类型注解
   - 使用类型断言（谨慎使用）
   - 修改数据结构
   - 实现缺失的类型定义
   - 添加接口/类型守卫
3. **应用修复**：使用 Edit 工具修改代码
4. **保持上下文**：确保修复不影响其他代码

**修复后验证**：代码应该消除当前错误而不引入新的错误

---

### 步骤 4: 重新运行 pyright

```bash
npx pyright --verbose
```

**检查点**：
- 确认当前错误已修复
- 检查是否引入了新的错误
- 记录剩余错误数量

**重复步骤 2-4** 直到零错误

---

### 步骤 5: 验证测试

当 pyright 显示零错误后：

```bash
npx playwright test
```

**目标**：
- 确保类型修复不影响功能
- 确保所有测试通过
- 验证测试覆盖率未受影响

**如果测试失败**：
1. 分析测试失败原因
2. 确认是类型修复导致的还是其他问题
3. 如果是类型问题，调整修复方案
4. 重新运行 pyright 和测试

---

## 最佳实践

### 错误优先级

修复顺序：
1. P0 严重错误（阻止编译、运行时崩溃）
2. P1 重要错误（影响功能、类型不安全）
3. P2 警告（代码质量问题）

### 修复策略

**类型注解优先**：
```typescript
// 修复前
const data = response.json();

// 修复后
const data: ResponseData = response.json();
```

**避免滥用 any**：
```typescript
// 修复前
const data: any = response.json();

// 修复后（推荐）
interface ResponseData { ... }
const data: ResponseData = response.json();
```

**使用类型守卫**：
```typescript
// 修复前
function handle(value: unknown) {
  if (value && typeof value === 'object') { ... }
}

// 修复后
function handle(value: unknown): void {
  if (value !== null && typeof value === 'object' && 'id' in value) {
    const obj = value as HasId;  // 更精确的断言
  }
}
```

### 上下文管理

- 每次修复后，重新读取文件以确保没有破坏其他代码
- 使用 Edit 工具时，保持原有代码风格和格式
- 记录修复的文件和行号，便于后续审查

### 批量修复

对于批量出现的相同错误类型：
1. 批量定位所有错误位置
2. 分析共同模式
3. 应用系统性的修复方案
4. 批量应用修复（逐个确认）
5. 重新运行 pyright 验证

---

## 示例会话

### 输入
```
用户："修复 TypeScript 错误"
```

### Claude 执行

1. **运行 pyright**
   ```bash
   npx pyright --verbose
   ```

2. **分析错误**
   ```
   src/app/page.tsx:42:5 - error TS2339: Property 'user' does not exist on type 'PageProps'
   src/components/UserCard.tsx:15:3 - error TS2322: Type 'string' is not assignable to type 'User'
   ```

3. **修复第一个错误**
   - 读取 `src/app/page.tsx:42`
   - 读取 `PageProps` 类型定义
   - 添加 `user?: User;` 到 `PageProps`
   - 应用修复

4. **重新运行 pyright**
   ```bash
   npx pyright --verbose
   ```

   结果：错误减少到 1 个

5. **修复第二个错误**
   - 读取 `src/components/UserCard.tsx:15`
   - 分析类型不匹配
   - 修改组件使用 `User | null` 类型
   - 应用修复

6. **最终验证**
   ```bash
   npx pyright --verbose
   npx playwright test
   ```

7. **确认完成**
   ```
   ✅ 所有 TypeScript 错误已修复
   ✅ 所有测试通过
   ```

---

## 输出报告

当技能完成后，提供简短报告：

```
✅ TypeScript 错误修复完成

统计：
- 总错误数：5
- 已修复：5
- 剩余：0

修复的文件：
- src/app/page.tsx:42 (添加类型注解)
- src/components/UserCard.tsx:15 (修复类型)
- src/lib/utils.ts:23 (接口扩展)

测试状态：
✅ npx pyright --verbose - 0 errors
✅ npx playwright test - all passed
```

---

## 注意事项

1. **避免过度修复**：只修复报错的问题，不要大规模重构
2. **保持一致性**：遵循现有代码风格和类型定义
3. **测试验证**：类型修复后必须运行测试
4. **渐进修复**：一次专注修复一个错误，避免引入新问题
5. **文档更新**：如果添加新的类型定义，考虑更新相关注释

---

## 状态检查

技能执行完成后，确认以下状态：

- [ ] pyright 显示零错误
- [ ] 所有测试通过
- [ ] 无新的编译警告
- [ ] 代码符合项目类型规范
- [ ] 测试覆盖率未受影响

---

## 失败处理

如果遇到以下情况：

1. **无法确定修复方案**：
   - 暂停并询问用户
   - 提供多个选项供选择

2. **修复引入新错误**：
   - 回滚修复
   - 尝试不同的修复方案
   - 检查上下文依赖

3. **测试无法通过**：
   - 确认类型修复是否必要
   - 评估是否需要调整测试
   - 优先确保类型安全

---

## 工具使用

**始终使用以下工具顺序**：

1. **Bash** - 运行 pyright 和测试
2. **Read** - 读取错误文件和上下文
3. **Edit** - 应用修复
4. **Bash** - 验证修复效果
5. **Bash** - 运行测试

**避免**：
- 不经读取直接编辑
- 不验证直接提交
- 一次修复多个不相关错误
