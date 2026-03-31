import { supabase } from '../supabase/client'

/**
 * 好友信息
 *
 * 表示用户的好友关系和好友的基本资料。
 */
export interface Friend {
  /** 好友用户 ID */
  friend_uid: string
  /** 好友昵称 */
  nickname: string
  /** 好友头像 URL */
  avatar_url: string | null
  /** 好友在线状态 */
  status: 'online' | 'offline' | 'away' | 'busy'
  /** 最后在线时间 */
  last_online_at: string
  /** 好友等级 */
  level: number
  /** 好友总局数 */
  total_games: number
  /** 好友胜率 */
  win_rate: number
  /** 好友关系建立时间 */
  created_at: string
}

/**
 * 收到的好友请求
 *
 * 其他用户发送给当前用户的好友请求。
 */
export interface FriendRequest {
  /** 请求 ID */
  request_id: string
  /** 发送者用户 ID */
  sender_uid: string
  /** 接收者用户 ID */
  receiver_uid: string
  /** 发送者昵称 */
  sender_nickname: string
  /** 发送者头像 URL */
  sender_avatar_url: string | null
  /** 请求创建时间 */
  created_at: string
}

/**
 * 发送的好友请求
 *
 * 当前用户发送给其他用户的好友请求。
 */
export interface SentFriendRequest {
  /** 请求 ID */
  request_id: string
  /** 发送者用户 ID */
  sender_uid: string
  /** 接收者用户 ID */
  receiver_uid: string
  /** 接收者昵称 */
  receiver_nickname: string
  /** 接收者头像 URL */
  receiver_avatar_url: string | null
  /** 请求状态 */
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled'
  /** 请求创建时间 */
  created_at: string
}

/**
 * 用户资料摘要
 *
 * 用于搜索和展示的用户基本信息。
 */
export interface UserProfile {
  /** 用户 ID */
  uid: string
  /** 用户昵称 */
  nickname: string
  /** 用户头像 URL */
  avatar_url: string | null
  /** 用户在线状态 */
  status: 'online' | 'offline' | 'away' | 'busy'
  /** 用户等级 */
  level: number
  /** 用户总局数 */
  total_games: number
  /** 用户胜率 */
  win_rate: number
}

/**
 * 发送好友请求
 *
 * 向指定用户发送好友请求。
 *
 * @param receiverUid - 接收者用户 ID
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { success, error } = await sendFriendRequest('user-123')
 * if (success) {
 *   console.log('好友请求已发送')
 * } else if (error === '已经发送过好友请求') {
 *   console.log('请勿重复发送')
 * }
 * ```
 */
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

/**
 * 接受好友请求
 *
 * 接受指定好友请求，建立好友关系。
 *
 * @param requestId - 好友请求 ID
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { success } = await acceptFriendRequest('request-123')
 * if (success) {
 *   console.log('已成为好友')
 * }
 * ```
 */
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

/**
 * 拒绝好友请求
 *
 * 拒绝指定好友请求。
 *
 * @param requestId - 好友请求 ID
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { success } = await rejectFriendRequest('request-123')
 * ```
 */
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

/**
 * 取消好友请求
 *
 * 取消已发送但尚未被处理的好友请求。
 *
 * @param requestId - 好友请求 ID
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { success } = await cancelFriendRequest('request-123')
 * ```
 */
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

/**
 * 删除好友
 *
 * 解除与指定用户的好友关系。
 *
 * @param friendUid - 好友用户 ID
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { success } = await removeFriend('user-123')
 * if (success) {
 *   console.log('已删除好友')
 * }
 * ```
 */
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

/**
 * 获取好友列表
 *
 * 获取当前用户的所有好友及其资料。
 *
 * @returns 包含好友列表或错误信息的对象
 *
 * @example
 * ```ts
 * const { data: friends, error } = await getFriends()
 * if (friends) {
 *   friends.forEach(friend => {
 *     console.log(`${friend.nickname} - ${friend.status}`)
 *   })
 * }
 * ```
 */
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

/**
 * 获取待处理的好友请求
 *
 * 获取其他用户发送给当前用户的、尚未处理的好友请求。
 *
 * @returns 包含好友请求列表或错误信息的对象
 *
 * @example
 * ```ts
 * const { data: requests } = await getPendingFriendRequests()
 * if (requests) {
 *   console.log(`收到 ${requests.length} 个好友请求`)
 * }
 * ```
 */
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

/**
 * 获取已发送的好友请求
 *
 * 获取当前用户发送的、所有状态的好友请求。
 *
 * @returns 包含好友请求列表或错误信息的对象
 *
 * @example
 * ```ts
 * const { data: requests } = await getSentFriendRequests()
 * const pending = requests?.filter(r => r.status === 'pending')
 * console.log(`待处理: ${pending?.length} 个`)
 * ```
 */
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

/**
 * 检查是否为好友
 *
 * 检查当前用户与指定用户是否已建立好友关系。
 *
 * @param targetUid - 目标用户 ID
 * @returns 包含是否为好友的结果或错误信息的对象
 *
 * @example
 * ```ts
 * const { data: isFriend } = await checkAreFriends('user-123')
 * if (isFriend) {
 *   console.log('已是好友')
 * }
 * ```
 */
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

/**
 * 更新用户在线状态
 *
 * 更新当前用户的在线状态。
 *
 * @param status - 在线状态
 * @returns 包含操作结果或错误信息的对象
 *
 * @example
 * ```ts
 * // 设置为离开状态
 * await updateUserStatus('away')
 *
 * // 恢复在线状态
 * await updateUserStatus('online')
 * ```
 */
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

/**
 * 搜索用户
 *
 * 根据昵称搜索用户，返回匹配的用户列表。
 *
 * @param searchTerm - 搜索关键词
 * @param limit - 返回结果数量限制，默认 20
 * @returns 包含用户列表或错误信息的对象
 *
 * @example
 * ```ts
 * const { data: users } = await searchUsers('小明')
 * if (users) {
 *   users.forEach(user => {
 *     console.log(`${user.nickname} (等级 ${user.level})`)
 *   })
 * }
 * ```
 */
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

/**
 * 订阅好友列表更新
 *
 * 监听好友列表的变化，包括新增好友、好友状态变化等。
 *
 * @param callback - 好友列表更新时的回调函数
 * @returns Supabase Realtime Channel 对象
 *
 * @example
 * ```ts
 * const channel = subscribeToFriendsUpdates((friends) => {
 *   console.log('好友列表已更新:', friends.length)
 * })
 *
 * // 清理
 * supabase.removeChannel(channel)
 * ```
 */
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

/**
 * 订阅好友请求更新
 *
 * 监听收到的好友请求变化。
 *
 * @param callback - 好友请求列表更新时的回调函数
 * @returns Supabase Realtime Channel 对象
 *
 * @example
 * ```ts
 * const channel = subscribeToFriendRequests((requests) => {
 *   console.log(`收到 ${requests.length} 个好友请求`)
 * })
 *
 * // 清理
 * supabase.removeChannel(channel)
 * ```
 */
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
