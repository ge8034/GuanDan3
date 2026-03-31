import { supabase } from '../supabase/client'

/**
 * 聊天房间信息
 *
 * 表示用户与好友之间的私聊房间。
 */
export interface ChatRoom {
  /** 房间 ID */
  room_id: string
  /** 对方用户 ID */
  other_user_uid: string
  /** 对方用户昵称 */
  other_user_nickname: string
  /** 对方用户头像 URL */
  other_user_avatar_url: string | null
  /** 对方用户状态 */
  other_user_status: 'online' | 'offline' | 'away' | 'busy'
  /** 最后一条消息内容 */
  last_message_content: string | null
  /** 最后一条消息时间 */
  last_message_at: string
  /** 未读消息数量 */
  unread_count: number
}

/**
 * 聊天消息
 *
 * 表示私聊中的一条消息记录。
 */
export interface ChatMessage {
  /** 消息 ID */
  message_id: string
  /** 所属房间 ID */
  room_id: string
  /** 发送者用户 ID */
  sender_uid: string
  /** 接收者用户 ID */
  receiver_uid: string
  /** 消息内容 */
  content: string
  /** 是否已读 */
  is_read: boolean
  /** 已读时间 */
  read_at: string | null
  /** 创建时间 */
  created_at: string
}

/**
 * 发送消息结果
 *
 * 返回发送成功的消息信息。
 */
export interface SendMessageResult {
  /** 消息 ID */
  message_id: string
  /** 房间 ID */
  room_id: string
  /** 发送者用户 ID */
  sender_uid: string
  /** 接收者用户 ID */
  receiver_uid: string
  /** 消息内容 */
  content: string
  /** 是否已读 */
  is_read: boolean
  /** 创建时间 */
  created_at: string
}

/**
 * 获取用户的聊天房间列表
 *
 * 返回当前用户参与的所有私聊房间，包含对方用户信息和最后一条消息。
 *
 * @returns 包含聊天房间列表或错误信息的对象
 *
 * @example
 * ```ts
 * const { data, error } = await getChatRooms()
 * if (data) {
 *   data.forEach(room => {
 *     console.log(`${room.other_user_nickname}: ${room.last_message_content}`)
 *   })
 * }
 * ```
 */
export async function getChatRooms(): Promise<{ data: ChatRoom[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_chat_rooms')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取聊天列表失败' }
  }
}

/**
 * 获取聊天记录
 *
 * 获取指定房间的历史消息，支持分页加载。
 *
 * @param roomId - 聊天房间 ID
 * @param limit - 返回的消息数量限制，默认 50
 * @param beforeTimestamp - 可选，只返回此时间之前的消息
 * @returns 包含消息列表或错误信息的对象
 *
 * @example
 * ```ts
 * // 获取最近 50 条消息
 * const { data } = await getChatMessages('room-123')
 *
 * // 分页加载更早的消息
 * const { data: older } = await getChatMessages('room-123', 50, '2024-01-01T00:00:00Z')
 * ```
 */
export async function getChatMessages(
  roomId: string,
  limit: number = 50,
  beforeTimestamp?: string
): Promise<{ data: ChatMessage[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_chat_messages', {
      room_id: roomId,
      limit_count: limit,
      before_timestamp: beforeTimestamp || null
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data: data.reverse() }
  } catch (error) {
    return { data: null, error: '获取聊天记录失败' }
  }
}

/**
 * 发送私聊消息
 *
 * 向指定用户发送一条私聊消息。如果房间不存在会自动创建。
 *
 * @param targetUid - 目标用户 ID
 * @param content - 消息内容
 * @returns 包含发送结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { data, error } = await sendMessage('user-123', '你好！')
 * if (data) {
 *   console.log('消息已发送:', data.message_id)
 * }
 * ```
 */
export async function sendMessage(
  targetUid: string,
  content: string
): Promise<{ data: SendMessageResult | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('send_message', {
      target_uid: targetUid,
      message_content: content
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '发送消息失败' }
  }
}

/**
 * 标记消息为已读
 *
 * 将指定房间中的所有未读消息标记为已读。
 *
 * @param roomId - 聊天房间 ID
 * @returns 包含标记的消息数量或错误信息的对象
 *
 * @example
 * ```ts
 * const { data } = await markMessagesAsRead('room-123')
 * console.log(`已标记 ${data} 条消息为已读`)
 * ```
 */
export async function markMessagesAsRead(roomId: string): Promise<{ data: number | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('mark_messages_as_read', {
      room_id: roomId
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '标记消息已读失败' }
  }
}

/**
 * 获取未读消息总数
 *
 * 返回当前用户所有聊天房间的未读消息总数。
 *
 * @returns 包含未读消息数量或错误信息的对象
 *
 * @example
 * ```ts
 * const { data } = await getUnreadMessageCount()
 * console.log(`未读消息: ${data} 条`)
 * ```
 */
export async function getUnreadMessageCount(): Promise<{ data: number | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_unread_message_count')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取未读消息数失败' }
  }
}

/**
 * 删除消息
 *
 * 删除指定的聊天消息（仅限发送者）。
 *
 * @param messageId - 要删除的消息 ID
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { success } = await deleteMessage('msg-123')
 * if (success) {
 *   console.log('消息已删除')
 * }
 * ```
 */
export async function deleteMessage(messageId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('delete_message', {
      message_id: messageId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '删除消息失败' }
  }
}

/**
 * 订阅聊天消息更新
 *
 * 监听指定房间的新消息和消息更新。
 *
 * @param roomId - 聊天房间 ID
 * @param callback - 收到新消息时的回调函数
 * @returns Supabase Realtime Channel 对象
 *
 * @example
 * ```ts
 * const channel = subscribeToChatMessages('room-123', (message) => {
 *   console.log('新消息:', message.content)
 * })
 *
 * // 清理
 * supabase.removeChannel(channel)
 * ```
 */
export function subscribeToChatMessages(
  roomId: string,
  callback: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat-messages-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        callback(payload.new as ChatMessage)
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`
      },
      (payload) => {
        callback(payload.new as ChatMessage)
      }
    )
    .subscribe()

  return channel
}

/**
 * 订阅聊天房间列表更新
 *
 * 监听聊天房间列表的变化，包括新消息、未读数变化等。
 *
 * @param callback - 房间列表更新时的回调函数
 * @returns Supabase Realtime Channel 对象
 *
 * @example
 * ```ts
 * const channel = subscribeToChatRooms((rooms) => {
 *   console.log('房间列表已更新:', rooms.length)
 * })
 *
 * // 清理
 * supabase.removeChannel(channel)
 * ```
 */
export function subscribeToChatRooms(callback: (rooms: ChatRoom[]) => void) {
  const channel = supabase
    .channel('chat-rooms-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_rooms'
      },
      async () => {
        const { data } = await getChatRooms()
        if (data) {
          callback(data)
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      },
      async () => {
        const { data } = await getChatRooms()
        if (data) {
          callback(data)
        }
      }
    )
    .subscribe()

  return channel
}

/**
 * 订阅未读消息数更新
 *
 * 监听未读消息总数的变化。
 *
 * @param callback - 未读数更新时的回调函数
 * @returns Supabase Realtime Channel 对象
 *
 * @example
 * ```ts
 * const channel = subscribeToUnreadCount((count) => {
 *   console.log('未读消息:', count)
 * })
 *
 * // 清理
 * supabase.removeChannel(channel)
 * ```
 */
export function subscribeToUnreadCount(callback: (count: number) => void) {
  const channel = supabase
    .channel('unread-count-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_messages'
      },
      async () => {
        const { data } = await getUnreadMessageCount()
        if (data !== null) {
          callback(data)
        }
      }
    )
    .subscribe()

  return channel
}
