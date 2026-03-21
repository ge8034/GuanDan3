import { supabase } from '../supabase/client'

export interface Friend {
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

export interface FriendRequest {
  request_id: string
  sender_uid: string
  receiver_uid: string
  sender_nickname: string
  sender_avatar_url: string | null
  created_at: string
}

export interface SentFriendRequest {
  request_id: string
  sender_uid: string
  receiver_uid: string
  receiver_nickname: string
  receiver_avatar_url: string | null
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at: string
}

export interface UserProfile {
  uid: string
  nickname: string
  avatar_url: string | null
  status: 'online' | 'offline' | 'away' | 'busy'
  level: number
  total_games: number
  win_rate: number
}

export async function sendFriendRequest(receiverUid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: '未登录' }
    }

    const { error } = await supabase
      .from('friend_requests')
      .insert({
        sender_uid: user.id,
        receiver_uid: receiverUid,
        status: 'pending'
      })

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: '已经发送过好友请求' }
      }
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: '发送好友请求失败' }
  }
}

export async function acceptFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('accept_friend_request', {
      request_id: requestId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '接受好友请求失败' }
  }
}

export async function rejectFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('reject_friend_request', {
      request_id: requestId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '拒绝好友请求失败' }
  }
}

export async function cancelFriendRequest(requestId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('cancel_friend_request', {
      request_id: requestId
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '取消好友请求失败' }
  }
}

export async function removeFriend(friendUid: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('remove_friend', {
      friend_uid: friendUid
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '删除好友失败' }
  }
}

export async function getFriends(): Promise<{ data: Friend[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_user_friends')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取好友列表失败' }
  }
}

export async function getPendingFriendRequests(): Promise<{ data: FriendRequest[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_pending_friend_requests')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取好友请求失败' }
  }
}

export async function getSentFriendRequests(): Promise<{ data: SentFriendRequest[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('get_sent_friend_requests')

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '获取发送的好友请求失败' }
  }
}

export async function checkAreFriends(targetUid: string): Promise<{ data: boolean | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('are_friends', {
      target_uid: targetUid
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '检查好友关系失败' }
  }
}

export async function updateUserStatus(status: 'online' | 'offline' | 'away' | 'busy'): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('update_user_status', {
      user_status: status
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: data }
  } catch (error) {
    return { success: false, error: '更新状态失败' }
  }
}

export async function searchUsers(searchTerm: string, limit: number = 20): Promise<{ data: UserProfile[] | null; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('search_users', {
      search_term: searchTerm,
      limit_count: limit
    })

    if (error) {
      return { data: null, error: error.message }
    }

    return { data }
  } catch (error) {
    return { data: null, error: '搜索用户失败' }
  }
}

export function subscribeToFriendsUpdates(callback: (friends: Friend[]) => void) {
  const channel = supabase
    .channel('friends-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friends'
      },
      async () => {
        const { data } = await getFriends()
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
        table: 'profiles'
      },
      async () => {
        const { data } = await getFriends()
        if (data) {
          callback(data)
        }
      }
    )
    .subscribe()

  return channel
}

export function subscribeToFriendRequests(callback: (requests: FriendRequest[]) => void) {
  const channel = supabase
    .channel('friend-requests-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'friend_requests'
      },
      async () => {
        const { data } = await getPendingFriendRequests()
        if (data) {
          callback(data)
        }
      }
    )
    .subscribe()

  return channel
}
