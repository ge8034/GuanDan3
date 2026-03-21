import { supabase } from '../supabase/client'

export interface ChatRoom {
  room_id: string
  other_user_uid: string
  other_user_nickname: string
  other_user_avatar_url: string | null
  other_user_status: 'online' | 'offline' | 'away' | 'busy'
  last_message_content: string | null
  last_message_at: string
  unread_count: number
}

export interface ChatMessage {
  message_id: string
  room_id: string
  sender_uid: string
  receiver_uid: string
  content: string
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface SendMessageResult {
  message_id: string
  room_id: string
  sender_uid: string
  receiver_uid: string
  content: string
  is_read: boolean
  created_at: string
}

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
