import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { useRoomStore } from '@/lib/store/room'
import { createRoomInvitation, acceptRoomInvitation, rejectRoomInvitation, getUserInvitations } from '@/lib/api/roomInvitation'
import { createNestedQueryMock } from '@/test/utils/supabase-test-helpers'

describe('房间管理流程集成测试', () => {
  let mockRoomStore: ReturnType<typeof useRoomStore.getState>

  beforeEach(() => {
    // 清除 mock 调用记录，但保留实现
    vi.clearAllMocks()
    // 重置 store 状态
    useRoomStore.getState().setRoom(null)
    useRoomStore.getState().setMembers([])
    mockRoomStore = useRoomStore.getState()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('创建房间流程', () => {
    it('应该能够完整创建房间', async () => {
      const mockCreateRoom = vi.fn().mockResolvedValue({
        data: 'room-123',
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'create_room') {
          return mockCreateRoom()
        }
        return { data: null, error: null }
      })

      const result = await mockRoomStore.createRoom(
        '测试房间',
        'classic',
        'pvp4',
        'public'
      )

      expect(result).toBeDefined()
      expect(result?.id).toBe('room-123')
      expect(mockCreateRoom).toHaveBeenCalled()
    })

    it('应该能够创建练习房间', async () => {
      const mockCreatePracticeRoom = vi.fn().mockResolvedValue({
        data: [{ room_id: 'practice-room-123' }],
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'create_practice_room') {
          return mockCreatePracticeRoom()
        }
        return { data: null, error: null }
      })

      const result = await mockRoomStore.createPracticeRoom('private')

      expect(result).toBeDefined()
      expect(result?.id).toBe('practice-room-123')
      expect(mockCreatePracticeRoom).toHaveBeenCalled()
    })

    it('应该能够处理创建房间失败', async () => {
      const mockCreateRoom = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '房间已满' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'create_room') {
          return mockCreateRoom()
        }
        return { data: null, error: null }
      })

      await expect(
        mockRoomStore.createRoom('测试房间', 'classic', 'pvp4', 'public')
      ).rejects.toThrow()
    })
  })

  describe('加入房间流程', () => {
    it('应该能够完整加入房间', async () => {
      const mockJoinRoom = vi.fn().mockResolvedValue({
        data: true,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'join_room') {
          return mockJoinRoom()
        }
        return { data: null, error: null }
      })

      const result = await mockRoomStore.joinRoom('room-123', 0)

      expect(result).toBe(true)
      expect(mockJoinRoom).toHaveBeenCalled()
    })

    it('应该能够处理加入房间失败', async () => {
      const mockJoinRoom = vi.fn().mockResolvedValue({
        data: false,
        error: { message: '房间不存在' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'join_room') {
          return mockJoinRoom()
        }
        return { data: null, error: null }
      })

      await expect(
        mockRoomStore.joinRoom('room-123', 0)
      ).rejects.toThrow()
    })
  })

  describe('房间成员管理流程', () => {
    it('应该能够添加AI玩家', async () => {
      const mockMembers = [
        { uid: 'user-1', seat_no: 0, ready: true, member_type: 'human' as const }
      ]

      // Mock fetchRoom - rooms 表查询
      const mockRoom = {
        id: 'room-123',
        name: '测试房间',
        mode: 'pvp4' as const,
        type: 'classic',
        status: 'open' as const,
        visibility: 'public' as const,
        owner_uid: 'user-1',
        created_at: '2026-03-21T00:00:00Z'
      }

      // Mock fetchRoom 后的成员列表（包含新添加的 AI）
      const mockMembersAfterAdd = [
        { uid: 'user-1', seat_no: 0, ready: true, member_type: 'human' as const },
        { uid: null, seat_no: 1, ready: true, member_type: 'ai' as const, ai_key: 'ai-key-1' }
      ]

      let callCount = 0
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'rooms') {
          return createNestedQueryMock({ data: mockRoom, error: null })
        } else if (table === 'room_members') {
          // 第一次调用是 insert，第二次调用是 fetchRoom 的 order 查询
          callCount++
          if (callCount === 1) {
            // insert 返回值
            const chain = createNestedQueryMock({ data: { id: 'member-1' }, error: null })
            chain.insert = vi.fn(() => Promise.resolve({ error: null }))
            return chain
          } else {
            // fetchRoom 的 order 查询返回成员列表
            return createNestedQueryMock(
              { data: mockMembersAfterAdd, error: null },  // single/maybeSingle
              { data: mockMembersAfterAdd, error: null }  // 直接 await
            )
          }
        }
        return createNestedQueryMock({ data: null, error: null })
      })

      await mockRoomStore.addAI('room-123', 'medium')

      // 验证成员数量增加
      const state = useRoomStore.getState()
      expect(state.members.length).toBeGreaterThan(0)
    })

    it('应该能够处理房间已满的情况', async () => {
      const mockMembers = [
        { uid: 'user-1', seat_no: 0, ready: true, member_type: 'human' as const },
        { uid: 'user-2', seat_no: 1, ready: true, member_type: 'human' as const },
        { uid: 'user-3', seat_no: 2, ready: true, member_type: 'human' as const },
        { uid: 'user-4', seat_no: 3, ready: true, member_type: 'human' as const }
      ]

      useRoomStore.setState({ members: mockMembers })

      await expect(
        mockRoomStore.addAI('room-123', 'medium')
      ).rejects.toThrow('Room is full')
    })

    it('应该能够切换准备状态', async () => {
      const mockToggleReady = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const mockMembers = [
        { uid: 'user-1', seat_no: 0, ready: false, member_type: 'human' as const }
      ]

      useRoomStore.setState({ members: mockMembers })

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      } as any)

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'toggle_ready') {
          return mockToggleReady()
        }
        return { data: null, error: null }
      })

      await mockRoomStore.toggleReady('room-123', true)

      expect(mockToggleReady).toHaveBeenCalled()
    })

    it('应该能够处理切换准备状态失败', async () => {
      const mockToggleReady = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '操作失败' }
      })

      const mockMembers = [
        { uid: 'user-1', seat_no: 0, ready: false, member_type: 'human' as const }
      ]

      useRoomStore.setState({ members: mockMembers })

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      } as any)

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'toggle_ready') {
          return mockToggleReady()
        }
        return { data: null, error: null }
      })

      await expect(
        mockRoomStore.toggleReady('room-123', true)
      ).rejects.toThrow()
    })
  })

  describe('房间状态同步流程', () => {
    it('应该能够获取房间信息', async () => {
      const mockRoom = {
        id: 'room-123',
        name: '测试房间',
        mode: 'pvp4' as const,
        type: 'classic',
        status: 'open' as const,
        visibility: 'public' as const,
        owner_uid: 'user-1',
        created_at: '2026-03-21T00:00:00Z'
      }

      // 使用 createNestedQueryMock 创建完整的链式 mock
      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'rooms') {
          return createNestedQueryMock({ data: mockRoom, error: null })
        } else if (table === 'room_members') {
          return createNestedQueryMock({ data: [], error: null })
        }
        return createNestedQueryMock({ data: null, error: null })
      })

      await mockRoomStore.fetchRoom('room-123')

      // 使用最新的 store 状态
      expect(useRoomStore.getState().currentRoom).toEqual(mockRoom)
    })

    it('应该能够订阅房间状态变化', () => {
      const mockChannel = vi.fn().mockReturnValue({
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({
          unsubscribe: vi.fn()
        })
      })

      vi.mocked(supabase.channel).mockReturnValue(mockChannel())

      const unsubscribe = mockRoomStore.subscribeRoom('room-123')

      expect(unsubscribe).toBeDefined()
      expect(typeof unsubscribe).toBe('function')
    })

    it('应该能够取消订阅房间状态', () => {
      const mockRemoveChannel = vi.fn()
      const mockChannel = {
        on: vi.fn().mockReturnThis(),
        subscribe: vi.fn().mockReturnValue({})
      }

      vi.mocked(supabase.channel).mockReturnValue(mockChannel)
      vi.mocked(supabase.removeChannel).mockImplementation(mockRemoveChannel)

      const unsubscribe = mockRoomStore.subscribeRoom('room-123')
      unsubscribe()

      expect(mockRemoveChannel).toHaveBeenCalled()
    })
  })

  describe('房间邀请流程', () => {
    it('应该能够创建房间邀请', async () => {
      const mockCreateInvitation = vi.fn().mockResolvedValue({
        data: {
          invitation_id: 'invite-123',
          invite_code: 'ABC123',
          expires_at: '2026-03-22T00:00:00Z'
        },
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'create_room_invitation') {
          return mockCreateInvitation()
        }
        return { data: null, error: null }
      })

      const result = await createRoomInvitation('room-123', 'user-2', 24)

      expect(result.data).toBeDefined()
      expect(result.data?.invitation_id).toBe('invite-123')
      expect(result.data?.invite_code).toBe('ABC123')
    })

    it('应该能够接受房间邀请', async () => {
      const mockAcceptInvitation = vi.fn().mockResolvedValue({
        data: {
          room_id: 'room-123',
          invitation_id: 'invite-123'
        },
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'accept_room_invitation') {
          return mockAcceptInvitation()
        }
        return { data: null, error: null }
      })

      const result = await acceptRoomInvitation('ABC123')

      expect(result.data).toBeDefined()
      expect(result.data?.room_id).toBe('room-123')
    })

    it('应该能够拒绝房间邀请', async () => {
      const mockRejectInvitation = vi.fn().mockResolvedValue({
        data: true,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'reject_room_invitation') {
          return mockRejectInvitation()
        }
        return { data: null, error: null }
      })

      const result = await rejectRoomInvitation('invite-123')

      expect(result.success).toBe(true)
    })

    it('应该能够获取用户邀请列表', async () => {
      const mockGetInvitations = vi.fn().mockResolvedValue({
        data: [
          {
            invitation_id: 'invite-1',
            room_id: 'room-1',
            room_name: '房间1',
            inviter_nickname: '玩家1',
            invite_code: 'CODE1',
            status: 'pending'
          }
        ],
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'get_user_invitations') {
          return mockGetInvitations()
        }
        return { data: null, error: null }
      })

      const result = await getUserInvitations()

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBeGreaterThan(0)
    })
  })

  describe('离开房间流程', () => {
    it('应该能够完整离开房间', async () => {
      const mockLeaveRoom = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'leave_room') {
          return mockLeaveRoom()
        }
        return { data: null, error: null }
      })

      const mockRoom = {
        id: 'room-123',
        name: '测试房间',
        mode: 'pvp4' as const,
        type: 'classic',
        status: 'open' as const,
        owner_uid: 'user-1'
      }

      const mockMembers = [
        { uid: 'user-1', seat_no: 0, ready: true, member_type: 'human' as const }
      ]

      useRoomStore.setState({
        currentRoom: mockRoom,
        members: mockMembers
      })

      await mockRoomStore.leaveRoom('room-123')

      // 使用最新的 store 状态
      expect(useRoomStore.getState().currentRoom).toBeNull()
      expect(useRoomStore.getState().members).toEqual([])
    })

    it('应该能够处理离开房间失败', async () => {
      const mockLeaveRoom = vi.fn().mockResolvedValue({
        data: null,
        error: { message: '离开房间失败' }
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'leave_room') {
          return mockLeaveRoom()
        }
        return { data: null, error: null }
      })

      await expect(
        mockRoomStore.leaveRoom('room-123')
      ).rejects.toThrow()
    })
  })

  describe('房间心跳和清理流程', () => {
    it('应该能够发送房间成员心跳', async () => {
      const mockHeartbeat = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'heartbeat_room_member') {
          return mockHeartbeat()
        }
        return { data: null, error: null }
      })

      await mockRoomStore.heartbeatRoomMember('room-123')

      expect(mockHeartbeat).toHaveBeenCalled()
    })

    it('应该能够清理离线成员', async () => {
      const mockSweep = vi.fn().mockResolvedValue({
        data: 2,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'sweep_offline_members') {
          return mockSweep()
        }
        return { data: null, error: null }
      })

      const result = await mockRoomStore.sweepOfflineMembers('room-123', 15)

      expect(result).toBe(2)
      expect(mockSweep).toHaveBeenCalled()
    })
  })

  describe('完整房间生命周期流程', () => {
    it('应该能够完成完整的房间生命周期', async () => {
      const mockCreateRoom = vi.fn().mockResolvedValue({
        data: 'room-123',
        error: null
      })

      const mockJoinRoom = vi.fn().mockResolvedValue({
        data: true,
        error: null
      })

      const mockToggleReady = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      const mockLeaveRoom = vi.fn().mockResolvedValue({
        data: null,
        error: null
      })

      vi.mocked(supabase.rpc).mockImplementation((name) => {
        if (name === 'create_room') {
          return mockCreateRoom()
        } else if (name === 'join_room') {
          return mockJoinRoom()
        } else if (name === 'toggle_ready') {
          return mockToggleReady()
        } else if (name === 'leave_room') {
          return mockLeaveRoom()
        }
        return { data: null, error: null }
      })

      const mockRoom = {
        id: 'room-123',
        name: '测试房间',
        mode: 'pvp4' as const,
        type: 'classic',
        status: 'open' as const,
        owner_uid: 'user-1'
      }

      const mockMembers = [
        { uid: 'user-1', seat_no: 0, ready: false, member_type: 'human' as const }
      ]

      useRoomStore.setState({
        currentRoom: mockRoom,
        members: mockMembers
      })

      vi.mocked(supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user-1' } },
        error: null
      } as any)

      const createResult = await mockRoomStore.createRoom('测试房间', 'classic', 'pvp4', 'public')
      expect(createResult?.id).toBe('room-123')

      await mockRoomStore.toggleReady('room-123', true)
      expect(mockToggleReady).toHaveBeenCalled()

      await mockRoomStore.leaveRoom('room-123')
      expect(mockLeaveRoom).toHaveBeenCalled()
      expect(mockRoomStore.currentRoom).toBeNull()
    })
  })
})
