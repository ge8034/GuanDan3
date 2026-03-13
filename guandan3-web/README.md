这是一个[Next.js](https://nextjs.org/)通过以下方式启动的项目[`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## 测试状态（测试待补齐）

预计补齐完成日期：2026-03-26

### 已覆盖的手动测试场景与结果摘要（2026-03-12）

- 主页匿名登录：点击“对战大厅”可进入 Lobby，异常网络下偶发超时但可重试进入
- Lobby 房间流：创建房间、列表可见、加入房间、进入 Room 页面正常
- PVP 准备与开局：4 人加入后 Ready/Cancel Ready 状态可同步，房主可 Start Game，进入 playing
- 基础出牌回合：出牌后 Last 区域更新，轮转到下一位，Pass 可用
- 游戏结束界面：出现“游戏结束”弹层，展示排名徽章与“再来一局”入口（未做自动化验证）

### 跳过的自动化测试范围（已标记 TODO-TEST）

- PVP 游戏结束与排名：E2E 稳定性不足，暂时跳过（见 tests/e2e/pvp-finish*.spec.ts）
- 断线重连/刷新恢复：需要补充专门用例覆盖（刷新后座位/手牌/回合状态一致性）
- 可靠性用例：加入房间并发、Ready 同步抖动、Start Game 竞态等

### 提交门禁（下次提交前必须完成）

- 补齐上述 TODO-TEST 自动化用例并在本地通过
- 覆盖率目标（关键模块）：lines/statements/functions ≥ 90%，branches ≥ 85%
- 通过 CI 流水线验证

### 环境变量

- 复制 `.env.example` 为 `.env.local` 并填入 Supabase 配置
- 未配置 Supabase 环境变量时，`npm run test:e2e` 会自动跳过 E2E（用于 CI/本地无环境时不阻断）

## 入门指南

首先，运行开发服务器:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

用你的浏览器打开 [http://localhost:3000](http://localhost:3000) 查看结果.

你可以通过修改来开始编辑该页面 `app/page.tsx`. 当你编辑文件时，页面会自动更新.

该项目使用 [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) 自动优化并加载 Inter 这款自定义谷歌字体.

## 了解更多

要了解更多关于Next.js的信息，请看以下资源:

-[Next.js 文档](https://nextjs.org/docs) - 了解 Next.js 的功能和 API.
- [学习 Next.js](https://nextjs.org/learn)——一个交互式的 Next.js 教程.

你可以查看[Next.js GitHub 仓库](https://github.com/vercel/next.js/)——欢迎提供你的反馈和贡献。!

##在Vercel上部署

部署你的Supabase应用最简单的方法是使用Vercel平台（https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme），它由Next.js的创建者推出。.

查看我们的[Supabase部署文档](https://nextjs.org/docs/deployment)以获取更多详细信息。
