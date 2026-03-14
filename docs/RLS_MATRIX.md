# RLS 权限矩阵与安全策略 (BE-05)

本文档定义了 Supabase 数据库的 Row Level Security (RLS) 策略与 RPC 权限边界。
所有业务操作必须通过 **RPC (SECURITY DEFINER)** 执行，表层操作仅开放 `SELECT` 给 authenticated 用户（受 RLS 限制）。

## 1. 表级权限概览

| 表名 | SELECT (RLS) | INSERT | UPDATE | DELETE | 备注 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `rooms` | ✅ Public / Members | ❌ | ❌ | ❌ | 仅 RPC 可写 |
| `room_members` | ✅ Room Members | ❌ | ❌ | ❌ | 仅 RPC 可写 |
| `games` | ✅ Room Members | ❌ | ❌ | ❌ | 仅 RPC 可写 |
| `turns` | ✅ Room Members | ❌ | ❌ | ❌ | 仅 RPC 可写 |
| `profiles` | ✅ Public | ✅ Self | ✅ Self | ❌ | 用户资料 |

## 2. RLS 策略详情

### `rooms`
- **Enable RLS**: `true`
- **Policy: "Public rooms are viewable by everyone"**
  - `using (visibility = 'public')`
- **Policy: "Members can view their own rooms"**
  - `using (auth.uid() in (select uid from room_members where room_id = id))`

### `room_members`
- **Enable RLS**: `true`
- **Policy: "Members can view members in same room"**
  - `using (room_id in (select room_id from room_members where uid = auth.uid()))`

### `games`
- **Enable RLS**: `true`
- **Policy: "Members can view games in their room"**
  - `using (room_id in (select room_id from room_members where uid = auth.uid()))`
- **Column Security**: `REVOKE SELECT ON (state_private) FROM authenticated` (防作弊)

### `turns`
- **Enable RLS**: `true`
- **Policy: "Members can view turns in their game"**
  - `using (game_id in (select id from games where room_id in (select room_id from room_members where uid = auth.uid())))`

## 3. RPC 安全边界 (SECURITY DEFINER)

所有写操作必须通过以下 RPC 执行，函数内部强制校验权限：

| RPC 函数 | 权限校验逻辑 | 失败行为 |
| :--- | :--- | :--- |
| `create_room` | 校验参数合法性 | 抛出异常 |
| `join_room` | 校验房间状态、满员、黑名单 | 抛出异常 |
| `leave_room` | 校验是否在房间内 | 抛出异常 |
| `start_game` | 校验是否为房主 (`owner_uid`) | 抛出 `not_owner` |
| `submit_turn` | 校验：1.是否轮到该座位 2.牌型合法性 3.是否压过上家 | 抛出 `not_your_turn` / `invalid_move` |
| `heartbeat` | 校验是否在房间内 | 忽略或抛错 |

## 4. 回归测试清单 (SQL)

在 `supabase/tests/rls_test.sql` 中应包含：

1. **越权读取测试**
   - [ ] 非成员读取私有房间 -> Empty
   - [ ] 成员读取其他房间的游戏 -> Empty
   - [ ] 尝试读取 `games.state_private` -> Error

2. **越权写入测试**
   - [ ] 直接 `INSERT INTO rooms` -> Error (RLS/Grant)
   - [ ] 直接 `UPDATE games` -> Error

3. **RPC 边界测试**
   - [ ] 非房主调用 `start_game` -> Error
   - [ ] 非当前回合玩家调用 `submit_turn` -> Error
   - [ ] 尝试出不属于手牌的牌 -> Error
