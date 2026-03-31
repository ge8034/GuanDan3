# 掼蛋 3 (GuanDan3) - Web 版

> 基于 Next.js 16 + Supabase 的实时掼蛋游戏

## 项目简介

掼蛋 3 是一款完整的 Web 版掼蛋纸牌游戏，支持实时多人对战和 AI 练习模式。

### 核心特性

- **进入即玩** - 匿名登录，无需注册
- **实时对战** - 4 人在线对战，低延迟同步
- **AI 练习** - 1v3 AI 对战模式
- **断线重连** - 自动恢复游戏状态
- **响应式设计** - 支持桌面和移动设备

### 性能目标

| 指标 | 目标值 |
|------|--------|
| 并发用户 | ≤ 20 人 |
| 首屏加载 | ≤ 2s (3G 网络) |
| 单局延迟 | ≤ 100ms (P99) |
| CPU 占用 | ≤ 30% (20 并发) |

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn 或 pnpm

### 安装依赖

```bash
npm install
```

### 环境配置

复制环境变量模板：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`，填入 Supabase 配置：

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

## 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本 |
| `npm start` | 启动生产服务器 |
| `npm run lint` | 运行 ESLint |
| `npm run typecheck` | 类型检查 |
| `npm test` | 运行单元测试 |
| `npm run test:e2e` | 运行 E2E 测试 |

## 项目结构

```
guandan3-web/
├── src/
│   ├── app/              # Next.js App Router
│   ├── lib/              # 核心业务逻辑
│   │   ├── game/         # 游戏规则和 AI
│   │   ├── store/        # Zustand 状态管理
│   │   └── utils/        # 工具函数
│   └── components/       # React 组件
├── supabase/             # 数据库迁移和函数
├── tests/                # E2E 测试
└── public/               # 静态资源
```

## 技术栈

- **前端框架**: Next.js 16.2, React 19
- **状态管理**: Zustand 5
- **样式**: Tailwind CSS 4
- **后端**: Supabase (PostgreSQL + Realtime)
- **测试**: Playwright, Vitest
- **类型系统**: TypeScript 5

## 游戏模式

### 练习房 (1v3)

- 1 个真人玩家 vs 3 个 AI
- 自动发牌开局
- AI 自动决策出牌

### 对战房 (4人)

- 4 个真人玩家
- 房主创建房间
- 其他玩家加入并准备
- 房主开始游戏

## 数据库架构

### 核心表

- `users` - 用户认证
- `profiles` - 用户资料
- `rooms` - 游戏房间
- `room_members` - 房间成员
- `games` - 牌局实例
- `game_hands` - 玩家手牌
- `turns` - 出牌记录
- `scores` - 积分记录

## 部署

### Vercel (推荐)

```bash
npm run build
vercel --prod
```

### Fly.io

```bash
npm run build
flyctl deploy
```

## 文档

- [架构文档](./ARCHITECTURE.md)
- [开发计划](./GuanDan3_Development_Plan.md)
- [迁移指南](./MIGRATION_GUIDE.md)

## 许可证

MIT
