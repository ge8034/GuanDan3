# GuanDan3 API 参考文档

## 概述

GuanDan3 提供了一套完整的 RESTful API，用于游戏功能、用户管理和数据查询。

## 基础信息

- **Base URL**: `https://guandan3.example.com/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON
- **字符编码**: UTF-8

## 认证

### 获取 Token

所有 API 请求都需要在 Header 中包含认证 token：

```http
Authorization: Bearer <your-jwt-token>
```

Token 通过 Supabase Auth 获取，有效期为 1 小时。

## API 端点

### 健康检查

检查 API 服务状态。

**请求**:
```http
GET /api/health
```

**响应**:
```json
{
  "status": "ok",
  "timestamp": "2026-03-14T10:00:00Z"
}
```

### 用户相关

#### 获取用户信息

获取当前登录用户的信息。

**请求**:
```http
GET /api/user
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "玩家",
  "avatar_url": "https://example.com/avatar.jpg",
  "created_at": "2026-03-14T10:00:00Z"
}
```

#### 更新用户信息

更新当前用户的信息。

**请求**:
```http
PUT /api/user
Authorization: Bearer <token>
Content-Type: application/json

{
  "nickname": "新昵称",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

**响应**:
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "新昵称",
  "avatar_url": "https://example.com/new-avatar.jpg",
  "updated_at": "2026-03-14T10:00:00Z"
}
```

### 房间相关

#### 创建房间

创建一个新的游戏房间。

**请求**:
```http
POST /api/rooms
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "我的房间",
  "mode": "pvp4",
  "visibility": "public"
}
```

**参数**:
- `name` (string, 可选): 房间名称
- `mode` (string, 必需): 游戏模式 (`pvp4`, `pve1v3`)
- `visibility` (string, 可选): 可见性 (`public`, `private`)

**响应**:
```json
{
  "id": "uuid",
  "name": "我的房间",
  "mode": "pvp4",
  "visibility": "public",
  "status": "open",
  "owner_uid": "uuid",
  "created_at": "2026-03-14T10:00:00Z"
}
```

#### 获取房间列表

获取可用的房间列表。

**请求**:
```http
GET /api/rooms?mode=pvp4&visibility=public
Authorization: Bearer <token>
```

**参数**:
- `mode` (string, 可选): 过滤游戏模式
- `visibility` (string, 可选): 过滤可见性

**响应**:
```json
{
  "rooms": [
    {
      "id": "uuid",
      "name": "房间1",
      "mode": "pvp4",
      "visibility": "public",
      "status": "open",
      "member_count": 2,
      "created_at": "2026-03-14T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### 加入房间

加入指定的房间。

**请求**:
```http
POST /api/rooms/{room_id}/join
Authorization: Bearer <token>
```

**响应**:
```json
{
  "room_id": "uuid",
  "seat_no": 1,
  "joined_at": "2026-03-14T10:00:00Z"
}
```

#### 离开房间

离开当前房间。

**请求**:
```http
POST /api/rooms/{room_id}/leave
Authorization: Bearer <token>
```

**响应**:
```json
{
  "room_id": "uuid",
  "left_at": "2026-03-14T10:00:00Z"
}
```

#### 准备游戏

标记玩家为准备状态。

**请求**:
```http
POST /api/rooms/{room_id}/ready
Authorization: Bearer <token>
Content-Type: application/json

{
  "ready": true
}
```

**响应**:
```json
{
  "room_id": "uuid",
  "uid": "uuid",
  "ready": true,
  "updated_at": "2026-03-14T10:00:00Z"
}
```

#### 开始游戏

开始游戏（仅房主可用）。

**请求**:
```http
POST /api/rooms/{room_id}/start
Authorization: Bearer <token>
```

**响应**:
```json
{
  "game_id": "uuid",
  "room_id": "uuid",
  "status": "playing",
  "started_at": "2026-03-14T10:00:00Z"
}
```

### 游戏相关

#### 获取游戏信息

获取当前游戏的信息。

**请求**:
```http
GET /api/games/{game_id}
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": "uuid",
  "room_id": "uuid",
  "status": "playing",
  "turn_no": 5,
  "current_seat": 2,
  "state_public": {
    "counts": [10, 15, 20, 25],
    "rankings": []
  },
  "created_at": "2026-03-14T10:00:00Z",
  "updated_at": "2026-03-14T10:05:00Z"
}
```

#### 提交回合

提交玩家的出牌。

**请求**:
```http
POST /api/games/{game_id}/turn
Authorization: Bearer <token>
Content-Type: application/json

{
  "action_id": "uuid",
  "expected_turn_no": 5,
  "payload": {
    "type": "play",
    "cards": ["A", "K", "Q"]
  }
}
```

**参数**:
- `action_id` (string, 必需): 动作唯一标识
- `expected_turn_no` (number, 必需): 预期的回合号
- `payload` (object, 必需): 出牌数据

**响应**:
```json
{
  "turn_no": 6,
  "current_seat": 3,
  "submitted_at": "2026-03-14T10:05:00Z"
}
```

#### 获取回合历史

获取游戏的回合历史记录。

**请求**:
```http
GET /api/games/{game_id}/turns?from_turn_no=0
Authorization: Bearer <token>
```

**参数**:
- `from_turn_no` (number, 可选): 起始回合号

**响应**:
```json
{
  "turns": [
    {
      "turn_no": 1,
      "seat_no": 0,
      "payload": {
        "type": "play",
        "cards": ["A", "K", "Q"]
      },
      "created_at": "2026-03-14T10:00:00Z"
    }
  ],
  "total": 1
}
```

#### 获取手牌

获取当前玩家的手牌。

**请求**:
```http
GET /api/games/{game_id}/hand
Authorization: Bearer <token>
```

**响应**:
```json
{
  "hand": ["A", "K", "Q", "J", "10"],
  "updated_at": "2026-03-14T10:00:00Z"
}
```

### 战绩相关

#### 获取战绩列表

获取玩家的历史战绩。

**请求**:
```http
GET /api/history?page=1&limit=20
Authorization: Bearer <token>
```

**参数**:
- `page` (number, 可选): 页码，默认 1
- `limit` (number, 可选): 每页数量，默认 20

**响应**:
```json
{
  "games": [
    {
      "id": "uuid",
      "mode": "pvp4",
      "status": "finished",
      "result": "win",
      "score": 100,
      "played_at": "2026-03-14T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20
}
```

#### 获取战绩详情

获取指定游戏的详细战绩。

**请求**:
```http
GET /api/history/{game_id}
Authorization: Bearer <token>
```

**响应**:
```json
{
  "id": "uuid",
  "mode": "pvp4",
  "status": "finished",
  "result": "win",
  "score": 100,
  "turns": 20,
  "duration": 1800,
  "players": [
    {
      "uid": "uuid",
      "nickname": "玩家1",
      "seat_no": 0,
      "score": 100
    }
  ],
  "played_at": "2026-03-14T10:00:00Z"
}
```

### 统计相关

#### 获取玩家统计

获取玩家的统计数据。

**请求**:
```http
GET /api/stats
Authorization: Bearer <token>
```

**响应**:
```json
{
  "total_games": 100,
  "wins": 60,
  "losses": 40,
  "win_rate": 0.6,
  "total_score": 5000,
  "avg_score": 50,
  "best_score": 200,
  "play_time": 36000
}
```

## 错误处理

### 错误响应格式

所有错误响应都遵循以下格式：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 常见错误码

| 错误码 | HTTP 状态码 | 描述 |
|--------|------------|------|
| `UNAUTHORIZED` | 401 | 未授权或 token 无效 |
| `FORBIDDEN` | 403 | 权限不足 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 请求参数验证失败 |
| `GAME_NOT_FOUND` | 404 | 游戏不存在 |
| `ROOM_NOT_FOUND` | 404 | 房间不存在 |
| `NOT_YOUR_TURN` | 400 | 不是你的回合 |
| `INVALID_MOVE` | 400 | 无效的出牌 |
| `ROOM_FULL` | 400 | 房间已满 |
| `GAME_ALREADY_STARTED` | 400 | 游戏已开始 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

### 错误示例

**未授权**:
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {}
  }
}
```

**不是你的回合**:
```json
{
  "error": {
    "code": "NOT_YOUR_TURN",
    "message": "It's not your turn to play",
    "details": {
      "current_seat": 2,
      "your_seat": 0
    }
  }
}
```

## 速率限制

API 实施了速率限制以防止滥用：

- 每个用户每分钟最多 100 次请求
- 超过限制将返回 `429 Too Many Requests`
- 响应头包含速率限制信息：
  - `X-RateLimit-Limit`: 限制数量
  - `X-RateLimit-Remaining`: 剩余数量
  - `X-RateLimit-Reset`: 重置时间

## WebSocket

### 连接

连接到游戏实时更新：

```javascript
const ws = new WebSocket('wss://guandan3.example.com/ws');

ws.onopen = () => {
  // 发送认证消息
  ws.send(JSON.stringify({
    type: 'auth',
    token: 'your-jwt-token'
  }));
};
```

### 消息类型

#### 认证

```json
{
  "type": "auth",
  "token": "your-jwt-token"
}
```

#### 房间更新

```json
{
  "type": "room_update",
  "room_id": "uuid",
  "data": {
    "member_count": 3,
    "status": "open"
  }
}
```

#### 游戏更新

```json
{
  "type": "game_update",
  "game_id": "uuid",
  "data": {
    "turn_no": 5,
    "current_seat": 2,
    "last_play": {
      "seat_no": 1,
      "cards": ["A", "K", "Q"]
    }
  }
}
```

#### 聊天消息

```json
{
  "type": "chat",
  "room_id": "uuid",
  "data": {
    "uid": "uuid",
    "nickname": "玩家",
    "message": "你好！"
  }
}
```

## SDK

### JavaScript/TypeScript

```typescript
import { GuanDan3Client } from '@guandan3/sdk';

const client = new GuanDan3Client({
  baseUrl: 'https://guandan3.example.com/api',
  token: 'your-jwt-token'
});

// 创建房间
const room = await client.rooms.create({
  mode: 'pvp4',
  visibility: 'public'
});

// 加入房间
await client.rooms.join(room.id);

// 开始游戏
const game = await client.rooms.start(room.id);

// 提交回合
await client.games.submitTurn(game.id, {
  action_id: generateUUID(),
  expected_turn_no: 1,
  payload: {
    type: 'play',
    cards: ['A', 'K', 'Q']
  }
});
```

## 测试

### 测试环境

- **测试 URL**: `https://test.guandan3.example.com/api`
- **测试 Token**: 使用测试账号获取

### 测试工具

推荐使用以下工具进行 API 测试：

- [Postman](https://www.postman.com/)
- [Insomnia](https://insomnia.rest/)
- [curl](https://curl.se/)

### 测试示例

```bash
# 健康检查
curl https://guandan3.example.com/api/health

# 获取房间列表
curl -H "Authorization: Bearer <token>" \
  https://guandan3.example.com/api/rooms

# 创建房间
curl -X POST \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"mode":"pvp4","visibility":"public"}' \
  https://guandan3.example.com/api/rooms
```

## 版本控制

API 使用语义化版本控制：

- **当前版本**: v1.0.0
- **版本格式**: `MAJOR.MINOR.PATCH`
- **兼容性**: 向后兼容 MINOR 和 PATCH 更新

## 变更日志

### v1.0.0 (2026-03-14)
- 初始版本发布
- 用户管理 API
- 房间管理 API
- 游戏管理 API
- 战绩查询 API
- WebSocket 实时更新

## 支持

如有问题或建议，请联系：

- 邮箱: api-support@example.com
- 文档: https://docs.guandan3.example.com
- GitHub: https://github.com/guandan3/api

---

最后更新: 2026-03-14
