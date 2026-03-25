import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import {
  getChatRooms,
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  deleteMessage,
  subscribeToChatMessages,
  subscribeToChatRooms,
  subscribeToUnreadCount
} from '@/lib/api/chat'

describe('实时消息传递集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('聊天房间管理', () => {
    it('应该能够获取聊天房间列表', async () => {
      const mockChatRooms = [
        {
          room_id: 'room-1',
          other_user_uid: 'user-2',
          other_user_nickname: '玩家2',
          other_user_avatar_url: null,
          other_user_status: 'online',
          last_message_content: '你好',
          last_message_at: '2026-03-21T00:00:00Z',
          unread_count: 2
        },
        {
          room_id: 'room-2',
          other_user_uid: 'user-3',
          other_user_nickname: '玩家3',
          other_user_avatar_url: null,
          other_user_status: 'offline',
          last_message_content: '再见',
          last_message_at: '2026-03-20T00:00:00Z',
          unread_count: 0
        }
      ]

      const mockGetChatRooms = vi.fn().mockResolvedValue({
        data: mockChatRooms,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_user_chat_rooms') {
          return mockGetChatRooms()
        }
        return { data: null, error: null }
      })

      const result = await getChatRooms()

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)
      expect(result.data?.[0].other_user_nickname).toBe('玩家2')
    })

    it('应该能够处理获取聊天房间失败', async () => {
      const mockGetChatRooms = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '获取失败' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_user_chat_rooms') {
          return mockGetChatRooms()
        }
        return { data: null, error: null }
      })

      const result = await getChatRooms()

      expect(result.data).toBeNull()
      expect(result.error).toBe('获取失败')
    })
  })

  describe('聊天消息管理', () => {
    it('应该能够获取聊天消息', async () => {
      const mockMessages = [
        {
          message_id: 'msg-1',
          room_id: 'room-1',
          sender_uid: 'user-1',
          receiver_uid: 'user-2',
          content: '你好',
          is_read: false,
          read_at: null,
          created_at: '2026-03-21T00:00:00Z'
        },
        {
          message_id: 'msg-2',
          room_id: 'room-1',
          sender_uid: 'user-2',
          receiver_uid: 'user-1',
          content: '你好呀',
          is_read: true,
          read_at: '2026-03-21T00:01:00Z',
          created_at: '2026-03-21T00:01:00Z'
        }
      ]

      const mockGetChatMessages = vi.fn().mockResolvedValue({
        data: mockMessages,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_chat_messages') {
          return mockGetChatMessages()
        }
        return { data: null, error: null }
      })

      const result = await getChatMessages('room-1', 50)

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)
      // RPC 返回按时间降序排列（最新在前），所以第一个是 '你好呀'
      expect(result.data?.[0].content).toBe('你好呀')
    })

    it('应该能够获取指定时间之前的消息', async () => {
      const mockMessages = [
        {
          message_id: 'msg-1',
          room_id: 'room-1',
          sender_uid: 'user-1',
          receiver_uid: 'user-2',
          content: '你好',
          is_read: false,
          read_at: null,
          created_at: '2026-03-20T00:00:00Z'
        }
      ]

      const mockGetChatMessages = vi.fn().mockResolvedValue({
        data: mockMessages,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_chat_messages') {
          return mockGetChatMessages()
        }
        return { data: null, error: null }
      })

      const result = await getChatMessages('room-1', 50, '2026-03-21T00:00:00Z')

      expect(result.data).toBeDefined()
      expect(mockGetChatMessages).toHaveBeenCalled()
    })

    it('应该能够处理获取消息失败', async () => {
      const mockGetChatMessages = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '获取消息失败' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_chat_messages') {
          return mockGetChatMessages()
        }
        return { data: null, error: null }
      })

      const result = await getChatMessages('room-1', 50)

      expect(result.data).toBeNull()
      expect(result.error).toBe('获取消息失败')
    })
  })

  describe('发送消息', () => {
    it('应该能够发送消息', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        data: {
          message_id: 'msg-1',
          room_id: 'room-1',
          sender_uid: 'user-1',
          receiver_uid: 'user-2',
          content: '你好',
          is_read: false,
          created_at: '2026-03-21T00:00:00Z'
        },
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'send_message') {
          return mockSendMessage()
        }
        return { data: null, error: null }
      })

      const result = await sendMessage('user-2', '你好')

      expect(result.data).toBeDefined()
      expect(result.data?.content).toBe('你好')
      expect(mockSendMessage).toHaveBeenCalled()
    })

    it('应该能够处理发送消息失败', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '发送失败' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'send_message') {
          return mockSendMessage()
        }
        return { data: null, error: null }
      })

      const result = await sendMessage('user-2', '你好')

      expect(result.data).toBeNull()
      expect(result.error).toBe('发送失败')
    })
  })

  describe('消息状态管理', () => {
    it('应该能够标记消息为已读', async () => {
      const mockMarkAsRead = vi.fn().mockResolvedValue({
        data: 5,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'mark_messages_as_read') {
          return mockMarkAsRead()
        }
        return { data: null, error: null }
      })

      const result = await markMessagesAsRead('room-1')

      expect(result.data).toBe(5)
      expect(mockMarkAsRead).toHaveBeenCalled()
    })

    it('应该能够获取未读消息数量', async () => {
      const mockGetUnreadCount = vi.fn().mockResolvedValue({
        data: 3,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_unread_message_count') {
          return mockGetUnreadCount()
        }
        return { data: null, error: null }
      })

      const result = await getUnreadMessageCount()

      expect(result.data).toBe(3)
    })

    it('应该能够删除消息', async () => {
      const mockDeleteMessage = vi.fn().mockResolvedValue({
        data: true,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'delete_message') {
          return mockDeleteMessage()
        }
        return { data: null, error: null }
      })

      const result = await deleteMessage('msg-1')

      expect(result.success).toBe(true)
      expect(mockDeleteMessage).toHaveBeenCalled()
    })

    it('应该能够处理删除消息失败', async () => {
      const mockDeleteMessage = vi.fn().mockResolvedValue({
        data: false,
        error: { message: '删除失败' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'delete_message') {
          return mockDeleteMessage()
        }
        return { data: null, error: null }
      })

      const result = await deleteMessage('msg-1')

      expect(result.success).toBe(false)
      expect(result.error).toBe('删除失败')
    })
  })

  describe('实时消息订阅', () => {
    it('应该能够订阅聊天消息', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const callback = vi.fn()
      const channel = subscribeToChatMessages('room-1', callback)

      expect(channel).toBeDefined()
      expect(typeof channel).toBe('object')
    })

    it('应该能够接收新消息', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((event, config, callback) => {
          if (event === 'postgres_changes' && config.event === 'INSERT') {
            callback({
              new: {
                message_id: 'msg-1',
                room_id: 'room-1',
                sender_uid: 'user-1',
                receiver_uid: 'user-2',
                content: '你好',
                is_read: false,
                created_at: '2026-03-21T00:00:00Z'
              }
            })
          }
          return mockChannel()
        }),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const callback = vi.fn()
      subscribeToChatMessages('room-1', callback)

      expect(callback).toHaveBeenCalled()
    })

    it('应该能够接收消息更新', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((event, config, callback) => {
          if (event === 'postgres_changes' && config.event === 'UPDATE') {
            callback({
              new: {
                message_id: 'msg-1',
                room_id: 'room-1',
                sender_uid: 'user-1',
                receiver_uid: 'user-2',
                content: '你好',
                is_read: true,
                read_at: '2026-03-21T00:01:00Z',
                created_at: '2026-03-21T00:00:00Z'
              }
            })
          }
          return mockChannel()
        }),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const callback = vi.fn()
      subscribeToChatMessages('room-1', callback)

      expect(callback).toHaveBeenCalled()
    })
  })

  describe('聊天房间订阅', () => {
    it('应该能够订阅聊天房间更新', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const callback = vi.fn()
      const channel = subscribeToChatRooms(callback)

      expect(channel).toBeDefined()
      expect(typeof channel).toBe('object')
    })

    it('应该能够接收聊天房间更新', async () => {
      const mockChatRooms = [
        {
          room_id: 'room-1',
          other_user_uid: 'user-2',
          other_user_nickname: '玩家2',
          other_user_avatar_url: null,
          other_user_status: 'online',
          last_message_content: '你好',
          last_message_at: '2026-03-21T00:00:00Z',
          unread_count: 2
        }
      ]

      const mockGetChatRooms = vi.fn().mockResolvedValue({
        data: mockChatRooms,
        error: null
      })

      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((event, config, callback) => {
          if (event === 'postgres_changes') {
            callback()
          }
          return mockChannel()
        }),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())
      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_user_chat_rooms') {
          return mockGetChatRooms()
        }
        return { data: null, error: null }
      })

      const callback = vi.fn()
      subscribeToChatRooms(callback)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(callback).toHaveBeenCalledWith(mockChatRooms)
    })
  })

  describe('未读消息订阅', () => {
    it('应该能够订阅未读消息数量', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const callback = vi.fn()
      const channel = subscribeToUnreadCount(callback)

      expect(channel).toBeDefined()
      expect(typeof channel).toBe('object')
    })

    it('应该能够接收未读消息数量更新', async () => {
      const mockGetUnreadCount = vi.fn().mockResolvedValue({
        data: 5,
        error: null
      })

      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockImplementation((event, config, callback) => {
          if (event === 'postgres_changes') {
            callback()
          }
          return mockChannel()
        }),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())
      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_unread_message_count') {
          return mockGetUnreadCount()
        }
        return { data: null, error: null }
      })

      const callback = vi.fn()
      subscribeToUnreadCount(callback)

      await new Promise(resolve => setTimeout(resolve, 0))

      expect(callback).toHaveBeenCalledWith(5)
    })
  })

  describe('完整聊天流程', () => {
    it('应该能够完成完整的聊天流程', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        data: {
          message_id: 'msg-1',
          room_id: 'room-1',
          sender_uid: 'user-1',
          receiver_uid: 'user-2',
          content: '你好',
          is_read: false,
          created_at: '2026-03-21T00:00:00Z'
        },
        error: null
      })

      const mockGetChatMessages = vi.fn().mockResolvedValue({
        data: [
          {
            message_id: 'msg-1',
            room_id: 'room-1',
            sender_uid: 'user-1',
            receiver_uid: 'user-2',
            content: '你好',
            is_read: false,
            read_at: null,
            created_at: '2026-03-21T00:00:00Z'
          }
        ],
        error: null
      })

      const mockMarkAsRead = vi.fn().mockResolvedValue({
        data: 1,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'send_message') {
          return mockSendMessage()
        } else if (name === 'get_chat_messages') {
          return mockGetChatMessages()
        } else if (name === 'mark_messages_as_read') {
          return mockMarkAsRead()
        }
        return { data: null, error: null }
      })

      const sendResult = await sendMessage('user-2', '你好')
      expect(sendResult.data).toBeDefined()
      expect(sendResult.data?.content).toBe('你好')

      const messagesResult = await getChatMessages('room-1', 50)
      expect(messagesResult.data).toBeDefined()
      expect(messagesResult.data?.length).toBe(1)

      const markResult = await markMessagesAsRead('room-1')
      expect(markResult.data).toBe(1)
    })
  })

  describe('并发消息处理', () => {
    it('应该能够处理并发发送消息', async () => {
      const mockSendMessage = vi.fn().mockResolvedValue({
        data: {
          message_id: 'msg-1',
          room_id: 'room-1',
          sender_uid: 'user-1',
          receiver_uid: 'user-2',
          content: '消息',
          is_read: false,
          created_at: '2026-03-21T00:00:00Z'
        },
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'send_message') {
          return mockSendMessage()
        }
        return { data: null, error: null }
      })

      const promises = Array.from({ length: 5 }, (_, i) =>
        sendMessage('user-2', `消息${i + 1}`)
      )

      const results = await Promise.all(promises)

      expect(results.length).toBe(5)
      results.forEach(result => {
        expect(result.data).toBeDefined()
      })
    })

    it('应该能够处理并发获取消息', async () => {
      const mockGetChatMessages = vi.fn().mockResolvedValue({
        data: [
          {
            message_id: 'msg-1',
            room_id: 'room-1',
            sender_uid: 'user-1',
            receiver_uid: 'user-2',
            content: '消息',
            is_read: false,
            read_at: null,
            created_at: '2026-03-21T00:00:00Z'
          }
        ],
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_chat_messages') {
          return mockGetChatMessages()
        }
        return { data: null, error: null }
      })

      const promises = Array.from({ length: 3 }, (_, i) =>
        getChatMessages(`room-${i + 1}`, 50)
      )

      const results = await Promise.all(promises)

      expect(results.length).toBe(3)
      results.forEach(result => {
        expect(result.data).toBeDefined()
      })
    })
  })
})
