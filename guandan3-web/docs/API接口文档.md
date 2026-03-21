# 掼蛋游戏 API 接口文档

## 目录

- [概述](#概述)
- [认证](#认证)
- [用户管理](#用户管理)
- [好友系统](#好友系统)
- [房间管理](#房间管理)
- [游戏管理](#游戏管理)
- [聊天系统](#聊天系统)
- [游戏统计](#游戏统计)
- [房间邀请](#房间邀请)
- [实时订阅](#实时订阅)
- [错误处理](#错误处理)

## 概述

本文档描述了掼蛋游戏前端应用与后端服务之间的API接口。所有接口都基于Supabase的RPC（远程过程调用）和实时订阅功能。

### 基础URL

```
https://your-project.supabase.co
```

### 请求格式

所有API请求都通过Supabase客户端进行，支持以下两种方式：

1. **RPC调用**：用于执行数据库操作和业务逻辑
2. **实时订阅**：用于接收实时数据更新

### 响应格式

所有API响应都遵循统一的格式：

```typescript
{
  data: T | null,        // 成功时返回数据，失败时为null
  error?: string         // 错误信息，成功时不存在
}
```

## 认证

### 获取当前用户

```typescript
const { data: { user } } = await supabase.auth.getUser()
```

### 登录

```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})
```

### 注册

```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})
```

### 登出

```typescript
await supabase.auth.signOut()
```

## 用户管理

### 更新用户状态

更新用户的在线状态。

**接口**：`update_user_status`

**参数**：
- `user_status` (string): 用户状态，可选值：`'online' | 'offline' | 'away' | 'busy'`

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await updateUserStatus('online')
if (result.success) {
  console.log('状态更新成功')
}
```

### 搜索用户

根据搜索词查找用户。

**接口**：`search_users`

**参数**：
- `search_term` (string): 搜索关键词
- `limit_count` (number): 返回结果数量限制，默认20

**返回**：
```typescript
{
  data: UserProfile[] | null,
  error?: string
}
```

**UserProfile类型**：
```typescript
interface UserProfile {
  uid: string
  nickname: string
  avatar_url: string | null
  status: 'online' | 'offline' | 'away' | 'busy'
  level: number
  total_games: number
  win_rate: number
}
```

**示例**：
```typescript
const result = await searchUsers('张三', 10)
if (result.data) {
  console.log(`找到 ${result.data.length} 个用户`)
}
```

## 好友系统

### 发送好友请求

向指定用户发送好友请求。

**接口**：`send_friend_request`

**参数**：
- `receiver_uid` (string): 接收者用户ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await sendFriendRequest('user-123')
if (result.success) {
  console.log('好友请求已发送')
} else if (result.error === '已经发送过好友请求') {
  console.log('请勿重复发送')
}
```

### 接受好友请求

接受好友请求。

**接口**：`accept_friend_request`

**参数**：
- `request_id` (string): 好友请求ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await acceptFriendRequest('request-123')
if (result.success) {
  console.log('已添加好友')
}
```

### 拒绝好友请求

拒绝好友请求。

**接口**：`reject_friend_request`

**参数**：
- `request_id` (string): 好友请求ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await rejectFriendRequest('request-123')
if (result.success) {
  console.log('已拒绝好友请求')
}
```

### 取消好友请求

取消已发送的好友请求。

**接口**：`cancel_friend_request`

**参数**：
- `request_id` (string): 好友请求ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await cancelFriendRequest('request-123')
if (result.success) {
  console.log('已取消好友请求')
}
```

### 删除好友

删除好友关系。

**接口**：`remove_friend`

**参数**：
- `friend_uid` (string): 好友用户ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await removeFriend('friend-123')
if (result.success) {
  console.log('已删除好友')
}
```

### 获取好友列表

获取当前用户的所有好友。

**接口**：`get_user_friends`

**参数**：无

**返回**：
```typescript
{
  data: Friend[] | null,
  error?: string
}
```

**Friend类型**：
```typescript
interface Friend {
  friend_uid: string
  nickname: string
  avatar_url: string | null
  status: 'online' | 'offline' | 'away' | 'busy'
  last_online_at: string
  level: number
  total_games: number
  win_rate: number
  created_at: string
}
```

**示例**：
```typescript
const result = await getFriends()
if (result.data) {
  console.log(`共有 ${result.data.length} 个好友`)
}
```

### 获取待处理好友请求

获取收到的好友请求列表。

**接口**：`get_pending_friend_requests`

**参数**：无

**返回**：
```typescript
{
  data: FriendRequest[] | null,
  error?: string
}
```

**FriendRequest类型**：
```typescript
interface FriendRequest {
  request_id: string
  sender_uid: string
  receiver_uid: string
  sender_nickname: string
  sender_avatar_url: string | null
  created_at: string
}
```

**示例**：
```typescript
const result = await getPendingFriendRequests()
if (result.data) {
  console.log(`收到 ${result.data.length} 个好友请求`)
}
```

### 获取已发送好友请求

获取已发送的好友请求列表。

**接口**：`get_sent_friend_requests`

**参数**：无

**返回**：
```typescript
{
  data: SentFriendRequest[] | null,
  error?: string
}
```

**SentFriendRequest类型**：
```typescript
interface SentFriendRequest {
  request_id: string
  sender_uid: string
  receiver_uid: string
  receiver_nickname: string
  receiver_avatar_url: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
}
```

**示例**：
```typescript
const result = await getSentFriendRequests()
if (result.data) {
  console.log(`已发送 ${result.data.length} 个好友请求`)
}
```

### 检查好友关系

检查与指定用户是否为好友关系。

**接口**：`are_friends`

**参数**：
- `target_uid` (string): 目标用户ID

**返回**：
```typescript
{
  data: boolean | null,
  error?: string
}
```

**示例**：
```typescript
const result = await checkAreFriends('user-123')
if (result.data === true) {
  console.log('是好友关系')
}
```

## 房间管理

### 创建房间

创建一个新的游戏房间。

**接口**：`create_room`

**参数**：
- `p_name` (string): 房间名称
- `p_type` (string): 房间类型，可选值：`'classic' | 'competitive' | 'casual'`
- `p_mode` (string): 游戏模式，可选值：`'pvp4' | 'pvp2' | 'practice'`
- `p_visibility` (string): 可见性，可选值：`'public' | 'private'`

**返回**：
```typescript
{
  data: string | null,  // 房间ID
  error?: string
}
```

**示例**：
```typescript
const result = await createRoom('我的房间', 'classic', 'pvp4', 'public')
if (result.data) {
  console.log(`房间创建成功，ID: ${result.data}`)
}
```

### 创建练习房间

创建一个AI练习房间。

**接口**：`create_practice_room`

**参数**：
- `p_visibility` (string): 可见性，可选值：`'public' | 'private'`

**返回**：
```typescript
{
  data: { room_id: string } | null,
  error?: string
}
```

**示例**：
```typescript
const result = await createPracticeRoom('private')
if (result.data) {
  console.log(`练习房间创建成功，ID: ${result.data.room_id}`)
}
```

### 加入房间

加入指定的游戏房间。

**接口**：`join_room`

**参数**：
- `p_room_id` (string): 房间ID
- `p_seat_no` (number): 座位号（0-3）

**返回**：
```typescript
{
  data: boolean | null,
  error?: string
}
```

**示例**：
```typescript
const result = await joinRoom('room-123', 0)
if (result.data) {
  console.log('成功加入房间')
}
```

### 离开房间

离开当前房间。

**接口**：`leave_room`

**参数**：
- `p_room_id` (string): 房间ID

**返回**：
```typescript
{
  data: null,
  error?: string
}
```

**示例**：
```typescript
const result = await leaveRoom('room-123')
if (!result.error) {
  console.log('已离开房间')
}
```

### 切换准备状态

切换房间内的准备状态。

**接口**：`toggle_ready`

**参数**：
- `p_room_id` (string): 房间ID
- `p_ready` (boolean): 准备状态

**返回**：
```typescript
{
  data: null,
  error?: string
}
```

**示例**：
```typescript
const result = await toggleReady('room-123', true)
if (!result.error) {
  console.log('准备状态已更新')
}
```

### 添加AI玩家

在房间中添加AI玩家。

**接口**：直接插入到`room_members`表

**参数**：
- `room_id` (string): 房间ID
- `difficulty` (string): AI难度，可选值：`'easy' | 'medium' | 'hard'`

**返回**：
```typescript
{
  data: { id: string } | null,
  error?: string
}
```

**示例**：
```typescript
const result = await addAI('room-123', 'medium')
if (result.data) {
  console.log('AI玩家已添加')
}
```

### 房间成员心跳

更新房间成员的最后活跃时间。

**接口**：`heartbeat_room_member`

**参数**：
- `p_room_id` (string): 房间ID

**返回**：
```typescript
{
  data: null,
  error?: string
}
```

**示例**：
```typescript
const result = await heartbeatRoomMember('room-123')
if (!result.error) {
  console.log('心跳已发送')
}
```

### 清理离线成员

清理长时间未活跃的房间成员。

**接口**：`sweep_offline_members`

**参数**：
- `p_room_id` (string): 房间ID
- `p_timeout_seconds` (number): 超时时间（秒）

**返回**：
```typescript
{
  data: number | null,  // 清理的成员数量
  error?: string
}
```

**示例**：
```typescript
const result = await sweepOfflineMembers('room-123', 900)
if (result.data) {
  console.log(`清理了 ${result.data} 个离线成员`)
}
```

## 游戏管理

### 开始游戏

在房间中开始游戏。

**接口**：`start_game`

**参数**：
- `p_room_id` (string): 房间ID

**返回**：
```typescript
{
  data: string | null,  // 游戏ID
  error?: string
}
```

**示例**：
```typescript
const result = await startGame('room-123')
if (result.data) {
  console.log(`游戏开始，ID: ${result.data}`)
}
```

### 提交回合

提交游戏回合操作。

**接口**：`submit_turn`

**参数**：
- `p_game_id` (string): 游戏ID
- `p_action_id` (string): 操作ID（UUID）
- `p_expected_turn_no` (number): 期望的回合号
- `p_payload` (object): 操作载荷

**载荷类型**：
```typescript
interface PlayPayload {
  type: 'play'
  cards: Card[]
}

interface PassPayload {
  type: 'pass'
  cards: []
}
```

**返回**：
```typescript
{
  data: GameUpdate[] | null,
  error?: string
}
```

**GameUpdate类型**：
```typescript
interface GameUpdate {
  turn_no: number
  current_seat: number
  status: string
  rankings: number[]
}
```

**示例**：
```typescript
const result = await submitTurn('game-123', 'action-123', 5, {
  type: 'play',
  cards: [
    { id: 1, suit: 'H', rank: '3', val: 3 },
    { id: 2, suit: 'H', rank: '3', val: 3 }
  ]
})
if (result.data) {
  console.log('回合提交成功')
}
```

### 暂停游戏

暂停当前游戏。

**接口**：`pause_game`

**参数**：
- `p_game_id` (string): 游戏ID
- `p_reason` (string): 暂停原因

**返回**：
```typescript
{
  data: null,
  error?: string
}
```

**示例**：
```typescript
const result = await pauseGame('game-123', '休息一下')
if (!result.error) {
  console.log('游戏已暂停')
}
```

### 恢复游戏

恢复暂停的游戏。

**接口**：`resume_game`

**参数**：
- `p_game_id` (string): 游戏ID

**返回**：
```typescript
{
  data: null,
  error?: string
}
```

**示例**：
```typescript
const result = await resumeGame('game-123')
if (!result.error) {
  console.log('游戏已恢复')
}
```

### 获取AI手牌

获取AI玩家的手牌（仅用于调试和测试）。

**接口**：`get_ai_hand`

**参数**：
- `p_game_id` (string): 游戏ID
- `p_seat_no` (number): AI座位号

**返回**：
```typescript
{
  data: Card[] | null,
  error?: string
}
```

**Card类型**：
```typescript
interface Card {
  id: number
  suit: 'S' | 'H' | 'C' | 'D'
  rank: string
  val: number
}
```

**示例**：
```typescript
const result = await getAIHand('game-123', 1)
if (result.data) {
  console.log(`AI手牌: ${result.data.length} 张`)
}
```

### 获取回合历史

获取指定回合号之后的所有回合。

**接口**：`get_turns_since`

**参数**：
- `p_game_id` (string): 游戏ID
- `p_since_turn_no` (number): 起始回合号

**返回**：
```typescript
{
  data: Turn[] | null,
  error?: string
}
```

**Turn类型**：
```typescript
interface Turn {
  id: string
  game_id: string
  turn_no: number
  seat_no: number
  payload: PlayPayload | PassPayload
  created_at: string
}
```

**示例**：
```typescript
const result = await getTurnsSince('game-123', 10)
if (result.data) {
  console.log(`获取到 ${result.data.length} 个回合`)
}
```

## 聊天系统

### 发送消息

向指定用户发送聊天消息。

**接口**：`send_message`

**参数**：
- `target_uid` (string): 接收者用户ID
- `message_content` (string): 消息内容

**返回**：
```typescript
{
  data: Message | null,
  error?: string
}
```

**Message类型**：
```typescript
interface Message {
  message_id: string
  room_id: string
  sender_uid: string
  receiver_uid: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
}
```

**示例**：
```typescript
const result = await sendMessage('user-123', '你好！')
if (result.data) {
  console.log('消息已发送')
}
```

### 获取聊天消息

获取与指定用户的聊天记录。

**接口**：`get_chat_messages`

**参数**：
- `room_id` (string): 聊天房间ID
- `limit_count` (number): 返回消息数量限制
- `before_timestamp` (string, 可选): 获取此时间之前的消息

**返回**：
```typescript
{
  data: Message[] | null,
  error?: string
}
```

**示例**：
```typescript
const result = await getChatMessages('room-123', 50)
if (result.data) {
  console.log(`获取到 ${result.data.length} 条消息`)
}
```

### 标记消息为已读

标记聊天房间中的所有消息为已读。

**接口**：`mark_messages_as_read`

**参数**：
- `room_id` (string): 聊天房间ID

**返回**：
```typescript
{
  data: number | null,  // 标记的消息数量
  error?: string
}
```

**示例**：
```typescript
const result = await markMessagesAsRead('room-123')
if (result.data) {
  console.log(`已标记 ${result.data} 条消息为已读`)
}
```

### 获取未读消息数量

获取当前用户的未读消息总数。

**接口**：`get_unread_message_count`

**参数**：无

**返回**：
```typescript
{
  data: number | null,
  error?: string
}
```

**示例**：
```typescript
const result = await getUnreadMessageCount()
if (result.data) {
  console.log(`未读消息: ${result.data} 条`)
}
```

### 删除消息

删除指定的聊天消息。

**接口**：`delete_message`

**参数**：
- `message_id` (string): 消息ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await deleteMessage('msg-123')
if (result.success) {
  console.log('消息已删除')
}
```

### 获取聊天房间列表

获取用户的所有聊天房间。

**接口**：`get_user_chat_rooms`

**参数**：无

**返回**：
```typescript
{
  data: ChatRoom[] | null,
  error?: string
}
```

**ChatRoom类型**：
```typescript
interface ChatRoom {
  room_id: string
  other_user_uid: string
  other_user_nickname: string
  other_user_avatar_url: string | null
  other_user_status: 'online' | 'offline' | 'away' | 'busy'
  last_message_content: string
  last_message_at: string
  unread_count: number
}
```

**示例**：
```typescript
const result = await getChatRooms()
if (result.data) {
  console.log(`共有 ${result.data.length} 个聊天房间`)
}
```

## 游戏统计

### 记录游戏统计

记录一局游戏的统计数据。

**接口**：`record_game_stats`

**参数**：
- `p_user_id` (string): 用户ID
- `p_game_id` (string, 可选): 游戏ID
- `p_room_id` (string, 可选): 房间ID
- `p_is_ai_game` (boolean): 是否为AI游戏
- `p_team_score` (number): 队伍得分
- `p_opponent_score` (number): 对手得分
- `p_result` (string): 游戏结果，可选值：`'win' | 'lose' | 'draw'`
- `p_seat_no` (number): 座位号
- `p_level_rank` (number): 级牌等级
- `p_cards_played` (number, 可选): 出牌数量
- `p_bombs_played` (number, 可选): 炸弹数量
- `p_game_duration_seconds` (number, 可选): 游戏时长（秒）

**返回**：
```typescript
{
  data: string | null,  // 统计记录ID
  error?: string
}
```

**示例**：
```typescript
const result = await recordGameStats({
  userId: 'user-123',
  gameId: 'game-123',
  roomId: 'room-123',
  isAiGame: false,
  teamScore: 10,
  opponentScore: 5,
  result: 'win',
  seatNo: 0,
  levelRank: 2,
  cardsPlayed: 20,
  bombsPlayed: 2,
  gameDurationSeconds: 600
})
if (result.data) {
  console.log('统计记录成功')
}
```

### 获取用户游戏统计

获取指定用户的游戏统计记录。

**接口**：`get_user_game_stats`

**参数**：
- `p_user_id` (string): 用户ID
- `p_limit` (number): 返回记录数量限制，默认50
- `p_offset` (number): 偏移量，默认0

**返回**：
```typescript
{
  data: GameStat[] | null,
  error?: string
}
```

**GameStat类型**：
```typescript
interface GameStat {
  stat_id: string
  game_id: string | null
  room_id: string | null
  is_ai_game: boolean
  team_score: number
  opponent_score: number
  result: 'win' | 'lose' | 'draw'
  seat_no: number
  level_rank: number
  cards_played: number
  bombs_played: number
  game_duration_seconds: number | null
  created_at: string
}
```

**示例**：
```typescript
const result = await getUserGameStats('user-123', 50, 0)
if (result.data) {
  console.log(`获取到 ${result.data.length} 条统计记录`)
}
```

### 获取用户汇总统计

获取用户的汇总统计数据。

**接口**：`get_user_summary_stats`

**参数**：
- `p_user_id` (string): 用户ID

**返回**：
```typescript
{
  data: UserSummaryStats | null,
  error?: string
}
```

**UserSummaryStats类型**：
```typescript
interface UserSummaryStats {
  total_games: number
  total_wins: number
  total_losses: number
  win_rate: number
  total_score: number
  avg_score: number
  total_bombs: number
  total_cards: number
  avg_game_duration: number
  current_streak: number
  max_streak: number
}
```

**示例**：
```typescript
const result = await getUserSummaryStats('user-123')
if (result.data) {
  console.log(`总场次: ${result.data.total_games}`)
  console.log(`胜率: ${result.data.win_rate}%`)
}
```

### 获取排行榜

获取游戏排行榜。

**接口**：`get_leaderboard`

**参数**：
- `p_limit` (number): 返回记录数量限制，默认100
- `p_offset` (number): 偏移量，默认0
- `p_sort_by` (string): 排序字段，可选值：`'win_rate' | 'total_score' | 'total_games'`

**返回**：
```typescript
{
  data: LeaderboardEntry[] | null,
  error?: string
}
```

**LeaderboardEntry类型**：
```typescript
interface LeaderboardEntry {
  rank: number
  user_id: string
  nickname: string
  avatar_url: string | null
  total_games: number
  total_wins: number
  total_losses: number
  win_rate: number
  total_score: number
  avg_score: number
  current_streak: number
  max_streak: number
  bombs_played: number
  cards_played: number
}
```

**示例**：
```typescript
const result = await getLeaderboard(100, 0, 'win_rate')
if (result.data) {
  console.log(`排行榜前 ${result.data.length} 名`)
}
```

### 获取每日统计

获取用户最近几天的每日统计。

**接口**：`get_daily_stats`

**参数**：
- `p_user_id` (string): 用户ID
- `p_days` (number): 天数，默认7

**返回**：
```typescript
{
  data: DailyStat[] | null,
  error?: string
}
```

**DailyStat类型**：
```typescript
interface DailyStat {
  date: string
  games_played: number
  games_won: number
  games_lost: number
  total_score: number
  bombs_played: number
  cards_played: number
  game_duration_seconds: number
}
```

**示例**：
```typescript
const result = await getDailyStats('user-123', 7)
if (result.data) {
  console.log(`最近7天的统计: ${result.data.length} 条记录`)
}
```

## 房间邀请

### 创建房间邀请

创建房间邀请链接。

**接口**：`create_room_invitation`

**参数**：
- `p_room_id` (string): 房间ID
- `p_target_uid` (string): 目标用户ID
- `p_expires_hours` (number): 过期时间（小时），默认24

**返回**：
```typescript
{
  data: {
    invitation_id: string
    invite_code: string
    expires_at: string
  } | null,
  error?: string
}
```

**示例**：
```typescript
const result = await createRoomInvitation('room-123', 'user-456', 24)
if (result.data) {
  console.log(`邀请码: ${result.data.invite_code}`)
}
```

### 接受房间邀请

接受房间邀请并加入房间。

**接口**：`accept_room_invitation`

**参数**：
- `p_invite_code` (string): 邀请码

**返回**：
```typescript
{
  data: {
    room_id: string
    invitation_id: string
  } | null,
  error?: string
}
```

**示例**：
```typescript
const result = await acceptRoomInvitation('ABC123')
if (result.data) {
  console.log(`已加入房间: ${result.data.room_id}`)
}
```

### 拒绝房间邀请

拒绝房间邀请。

**接口**：`reject_room_invitation`

**参数**：
- `p_invitation_id` (string): 邀请ID

**返回**：
```typescript
{
  success: boolean,
  error?: string
}
```

**示例**：
```typescript
const result = await rejectRoomInvitation('invite-123')
if (result.success) {
  console.log('已拒绝邀请')
}
```

### 获取用户邀请列表

获取用户收到的房间邀请列表。

**接口**：`get_user_invitations`

**参数**：无

**返回**：
```typescript
{
  data: RoomInvitation[] | null,
  error?: string
}
```

**RoomInvitation类型**：
```typescript
interface RoomInvitation {
  invitation_id: string
  room_id: string
  room_name: string
  inviter_nickname: string
  invite_code: string
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
  created_at: string
  expires_at: string
}
```

**示例**：
```typescript
const result = await getUserInvitations()
if (result.data) {
  console.log(`收到 ${result.data.length} 个房间邀请`)
}
```

## 实时订阅

### 订阅房间状态

订阅房间状态变化。

**接口**：Supabase Realtime

**事件类型**：
- `INSERT`: 新房间创建
- `UPDATE`: 房间状态更新
- `DELETE`: 房间删除

**示例**：
```typescript
const channel = supabase
  .channel('room-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'rooms'
  }, (payload) => {
    console.log('房间状态变化:', payload)
  })
  .subscribe()
```

### 订阅房间成员

订阅房间成员变化。

**接口**：Supabase Realtime

**事件类型**：
- `INSERT`: 新成员加入
- `UPDATE`: 成员状态更新
- `DELETE`: 成员离开

**示例**：
```typescript
const channel = supabase
  .channel('room-members-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'room_members'
  }, (payload) => {
    console.log('房间成员变化:', payload)
  })
  .subscribe()
```

### 订阅游戏状态

订阅游戏状态变化。

**接口**：Supabase Realtime

**事件类型**：
- `INSERT`: 新游戏创建
- `UPDATE`: 游戏状态更新

**示例**：
```typescript
const channel = supabase
  .channel('game-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'games'
  }, (payload) => {
    console.log('游戏状态变化:', payload)
  })
  .subscribe()
```

### 订阅聊天消息

订阅聊天消息更新。

**接口**：Supabase Realtime

**事件类型**：
- `INSERT`: 新消息
- `UPDATE`: 消息状态更新（如已读）

**示例**：
```typescript
const channel = supabase
  .channel('chat-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'chat_messages'
  }, (payload) => {
    console.log('聊天消息更新:', payload)
  })
  .subscribe()
```

### 订阅好友状态

订阅好友状态变化。

**接口**：Supabase Realtime

**事件类型**：
- `INSERT`: 新好友
- `UPDATE`: 好友状态更新
- `DELETE`: 好友删除

**示例**：
```typescript
const channel = supabase
  .channel('friends-updates')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'friends'
  }, (payload) => {
    console.log('好友状态变化:', payload)
  })
  .subscribe()
```

### 取消订阅

取消实时订阅。

**示例**：
```typescript
channel.unsubscribe()
```

## 错误处理

### 错误码

| 错误码 | 说明 |
|---------|------|
| `23505` | 唯一约束冲突 |
| `23503` | 外键约束冲突 |
| `P0001` | 业务逻辑错误 |
| `P0002` | 权限不足 |
| `P0003` | 资源不存在 |

### 常见错误

| 错误信息 | 说明 | 解决方案 |
|---------|------|---------|
| `未登录` | 用户未认证 | 调用登录接口 |
| `房间已满` | 房间人数已达上限 | 选择其他房间 |
| `不是你的回合` | 当前不是该用户的回合 | 等待轮到自己 |
| `回合号不匹配` | 回合号与服务器不一致 | 刷新游戏状态 |
| `好友关系已存在` | 已经是好友关系 | 无需重复添加 |
| `邀请码已过期` | 邀请链接已过期 | 请求新的邀请 |

### 错误处理示例

```typescript
try {
  const result = await someApiFunction()
  if (result.error) {
    console.error('操作失败:', result.error)
    // 根据错误类型进行相应处理
    if (result.error.includes('未登录')) {
      // 跳转到登录页
    } else if (result.error.includes('房间已满')) {
      // 显示房间已满提示
    }
  } else {
    console.log('操作成功:', result.data)
  }
} catch (error) {
  console.error('系统错误:', error)
  // 显示通用错误提示
}
```

## 附录

### 数据类型定义

#### Card（卡牌）

```typescript
interface Card {
  id: number          // 卡牌ID
  suit: 'S' | 'H' | 'C' | 'D'  // 花色：黑桃、红桃、梅花、方块
  rank: string        // 点数：2-10, J, Q, K, A, S, B
  val: number         // 数值：2-17
}
```

#### GameStatus（游戏状态）

```typescript
type GameStatus = 'deal' | 'playing' | 'paused' | 'finished'
```

#### RoomStatus（房间状态）

```typescript
type RoomStatus = 'open' | 'playing' | 'closed'
```

#### UserStatus（用户状态）

```typescript
type UserStatus = 'online' | 'offline' | 'away' | 'busy'
```

### 版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0.0 | 2026-03-21 | 初始版本 |

---

**文档维护者**：开发团队  
**最后更新**：2026-03-21  
**联系方式**：support@example.com
