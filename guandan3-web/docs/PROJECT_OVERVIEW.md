# GuanDan3 Web 项目概览

## 项目简介

GuanDan3 是一个基于 Next.js 的在线掼蛋游戏平台，支持多人实时对战、练习模式和战绩记录。

## 技术栈

### 前端框架
- **Next.js 16** - React 框架，支持 App Router
- **React 19** - UI 库
- **TypeScript** - 类型安全
- **Tailwind CSS 4** - 样式框架

### 状态管理
- **Zustand** - 轻量级状态管理

### 数据库
- **Supabase** - PostgreSQL 数据库 + 实时订阅

### 测试
- **Vitest** - 单元测试
- **Playwright** - E2E 测试
- **Testing Library** - React 组件测试

### 部署
- **Fly.io** - 生产环境部署
- **Docker** - 容器化部署

### 监控
- **Sentry** - 错误监控和性能追踪

## 项目结构

```
guandan3-web/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   ├── components/        # React 组件
│   │   ├── game/              # 游戏页面
│   │   ├── history/           # 战绩页面
│   │   └── layout.tsx         # 根布局
│   ├── lib/
│   │   ├── store/            # Zustand 状态管理
│   │   ├── utils/            # 工具函数
│   │   └── supabase.ts        # Supabase 客户端
│   └── types/                 # TypeScript 类型定义
├── tests/
│   ├── e2e/                   # E2E 测试
│   └── unit/                  # 单元测试
├── scripts/                   # 部署脚本
├── docs/                      # 项目文档
└── supabase/                  # 数据库配置
```

## 核心功能

### 1. 游戏大厅
- 创建房间
- 加入房间
- 房间列表展示
- 实时状态更新

### 2. 游戏对局
- 四人掼蛋规则
- 实时游戏状态同步
- 出牌逻辑验证
- 计分系统

### 3. 练习模式
- 单人练习
- AI 对手
- 快速开始

### 4. 战绩系统
- 历史对局记录
- 统计数据展示
- 详细对局回放

### 5. 聊天系统
- 实时聊天
- 表情支持
- 消息历史

## 数据库设计

### 主要表结构

#### rooms
- 房间信息
- 游戏状态
- 玩家列表

#### games
- 对局记录
- 游戏结果
- 时间戳

#### game_players
- 玩家对局关联
- 得分记录
- 角色信息

#### game_actions
- 游戏动作记录
- 出牌历史
- 时间线

## API 路由

### 游戏相关
- `POST /api/rooms` - 创建房间
- `POST /api/rooms/[id]/join` - 加入房间
- `POST /api/rooms/[id]/leave` - 离开房间
- `POST /api/games/[id]/action` - 执行游戏动作

### 用户相关
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息

### 战绩相关
- `GET /api/history` - 获取历史战绩
- `GET /api/history/[id]` - 获取对局详情

## 状态管理

### Room Store
```typescript
interface RoomStore {
  currentRoom: Room | null
  players: Player[]
  gameState: GameState
  actions: {
    createRoom: () => Promise<void>
    joinRoom: (roomId: string) => Promise<void>
    leaveRoom: () => Promise<void>
  }
}
```

### Game Store
```typescript
interface GameStore {
  game: Game | null
  currentTurn: number
  actions: {
    playCards: (cards: Card[]) => Promise<void>
    passTurn: () => Promise<void>
  }
}
```

## 实时通信

### Supabase Realtime
- 房间状态订阅
- 游戏动作广播
- 聊天消息推送

### 订阅示例
```typescript
const subscription = supabase
  .channel('room-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rooms',
    filter: `id=eq.${roomId}`
  }, (payload) => {
    // 处理更新
  })
  .subscribe()
```

## 测试策略

### 单元测试
- 组件渲染测试
- 工具函数测试
- 状态管理测试

### E2E 测试
- 完整游戏流程
- 用户交互测试
- 跨浏览器测试

### 性能测试
- 负载测试 (k6)
- 响应时间测试
- 并发用户测试

## 部署流程

### 开发环境
```bash
npm run dev
```

### 生产构建
```bash
npm run build
npm start
```

### Fly.io 部署
```bash
flyctl deploy
```

## 性能优化

### 前端优化
- 代码分割
- 图片优化
- 懒加载
- 缓存策略

### 数据库优化
- 索引优化
- 查询优化
- 连接池管理

### 网络优化
- CDN 加速
- 压缩传输
- HTTP/2 支持

## 安全措施

### 认证授权
- Supabase Auth
- RLS 策略
- JWT 验证

### 数据保护
- 输入验证
- SQL 注入防护
- XSS 防护

### 错误处理
- Sentry 监控
- 错误边界
- 优雅降级

## 监控和日志

### 错误监控
- Sentry 集成
- 实时错误追踪
- 性能监控

### 日志记录
- 结构化日志
- 日志分级
- 日志聚合

## 开发指南

### 环境要求
- Node.js 18+
- npm 或 yarn
- Git

### 快速开始
```bash
# 克隆项目
git clone <repository-url>
cd guandan3-web

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local

# 启动开发服务器
npm run dev
```

### 代码规范
- ESLint 配置
- Prettier 格式化
- TypeScript 严格模式

### 提交规范
- Conventional Commits
- PR 模板
- Code Review 流程

## 常见问题

### 开发问题
- 端口冲突
- 依赖安装失败
- 热重载不工作

### 部署问题
- 构建失败
- 环境变量配置
- 数据库连接

### 性能问题
- 页面加载慢
- 内存泄漏
- 数据库查询慢

## 贡献指南

### 报告问题
- GitHub Issues
- Bug 模板
- 功能请求

### 提交代码
- Fork 项目
- 创建分支
- 提交 PR

### 代码审查
- Review 检查清单
- 测试要求
- 文档更新

## 许可证

MIT License

## 联系方式

- 项目主页: [GitHub Repository]
- 问题反馈: [GitHub Issues]
- 邮箱: [support@example.com]
