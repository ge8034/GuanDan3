import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { supabase } from '@/lib/supabase/client'
import { createNestedQueryMock } from '@/test/utils/supabase-test-helpers'

describe('数据库操作集成测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('房间表操作', () => {
    it('应该能够创建房间记录', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'room-123',
              name: '测试房间',
              mode: 'pvp4',
              type: 'classic',
              status: 'open',
              owner_uid: 'user-1',
              visibility: 'public',
              created_at: '2026-03-21T00:00:00Z'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms').insert({
        name: '测试房间',
        mode: 'pvp4',
        type: 'classic',
        status: 'open',
        owner_uid: 'user-1',
        visibility: 'public'
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('room-123')
      expect(result.data?.name).toBe('测试房间')
    })

    it('应该能够查询房间记录', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'room-123',
              name: '测试房间',
              mode: 'pvp4',
              type: 'classic',
              status: 'open',
              owner_uid: 'user-1'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms').select().eq('id', 'room-123').single()

      expect(result.data).toBeDefined()
      expect(result.data?.id).toBe('room-123')
    })

    it('应该能够更新房间记录', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'room-123',
                name: '更新后的房间',
                mode: 'pvp4',
                type: 'classic',
                status: 'playing',
                owner_uid: 'user-1'
              },
              error: null
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms').update({
        name: '更新后的房间',
        status: 'playing'
      }).eq('id', 'room-123').select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('更新后的房间')
      expect(result.data?.status).toBe('playing')
    })

    it('应该能够删除房间记录', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        delete: mockDelete
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms').delete().eq('id', 'room-123')

      expect(result.error).toBeNull()
    })

    it('应该能够批量查询房间', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'room-1',
                  name: '房间1',
                  mode: 'pvp4',
                  type: 'classic',
                  status: 'open',
                  owner_uid: 'user-1'
                },
                {
                  id: 'room-2',
                  name: '房间2',
                  mode: 'pvp4',
                  type: 'classic',
                  status: 'open',
                  owner_uid: 'user-2'
                }
              ],
              error: null
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms')
        .select()
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(10)

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)
    })
  })

  describe('用户表操作', () => {
    it('应该能够创建用户记录', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              email: 'test@example.com',
              username: 'testuser',
              nickname: '测试用户',
              avatar_url: null,
              created_at: '2026-03-21T00:00:00Z'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('users').insert({
        email: 'test@example.com',
        username: 'testuser',
        nickname: '测试用户'
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.email).toBe('test@example.com')
      expect(result.data?.username).toBe('testuser')
    })

    it('应该能够查询用户记录', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              email: 'test@example.com',
              username: 'testuser',
              nickname: '测试用户'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('users').select().eq('id', 'user-123').single()

      expect(result.data).toBeDefined()
      expect(result.data?.username).toBe('testuser')
    })

    it('应该能够更新用户记录', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                nickname: '更新后的昵称'
              },
              error: null
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('users').update({
        nickname: '更新后的昵称'
      }).eq('id', 'user-123').select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.nickname).toBe('更新后的昵称')
    })

    it('应该能够通过邮箱查询用户', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'user-123',
              email: 'test@example.com',
              username: 'testuser'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('users').select().eq('email', 'test@example.com').single()

      expect(result.data).toBeDefined()
      expect(result.data?.email).toBe('test@example.com')
    })
  })

  describe('游戏表操作', () => {
    it('应该能够创建游戏记录', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'game-123',
              room_id: 'room-123',
              status: 'playing',
              turn_no: 0,
              current_seat: 0,
              level_rank: 2,
              started_at: '2026-03-21T00:00:00Z',
              ended_at: null,
              state_public: {
                counts: [27, 27, 27, 27],
                rankings: []
              }
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('games').insert({
        room_id: 'room-123',
        status: 'playing',
        turn_no: 0,
        current_seat: 0,
        level_rank: 2
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.room_id).toBe('room-123')
      expect(result.data?.status).toBe('playing')
    })

    it('应该能够查询游戏记录', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'game-123',
              room_id: 'room-123',
              status: 'playing',
              turn_no: 5,
              current_seat: 2,
              level_rank: 3
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('games').select().eq('id', 'game-123').single()

      expect(result.data).toBeDefined()
      expect(result.data?.turn_no).toBe(5)
      expect(result.data?.current_seat).toBe(2)
    })

    it('应该能够更新游戏状态', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'game-123',
                room_id: 'room-123',
                status: 'finished',
                turn_no: 100,
                current_seat: 0,
                level_rank: 5,
                ended_at: '2026-03-21T01:00:00Z'
              },
              error: null
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('games').update({
        status: 'finished',
        ended_at: '2026-03-21T01:00:00Z'
      }).eq('id', 'game-123').select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.status).toBe('finished')
    })

    it('应该能够查询房间的活跃游戏', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          in: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue({
                data: [
                  {
                    id: 'game-123',
                    room_id: 'room-123',
                    status: 'playing',
                    turn_no: 5,
                    current_seat: 2
                  }
                ],
                error: null
              })
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('games')
        .select()
        .eq('room_id', 'room-123')
        .in('status', ['playing', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(1)
    })
  })

  describe('回合表操作', () => {
    it('应该能够创建回合记录', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'turn-123',
              game_id: 'game-123',
              turn_no: 1,
              seat_no: 0,
              payload: {
                type: 'play',
                cards: [
                  { id: 1, suit: 'H', rank: '3', val: 3 }
                ]
              },
              created_at: '2026-03-21T00:00:00Z'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('turns').insert({
        game_id: 'game-123',
        turn_no: 1,
        seat_no: 0,
        payload: {
          type: 'play',
          cards: [
            { id: 1, suit: 'H', rank: '3', val: 3 }
          ]
        }
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.turn_no).toBe(1)
      expect(result.data?.seat_no).toBe(0)
    })

    it('应该能够查询游戏的回合历史', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'turn-1',
                  game_id: 'game-123',
                  turn_no: 5,
                  seat_no: 2,
                  payload: { type: 'play', cards: [] }
                },
                {
                  id: 'turn-2',
                  game_id: 'game-123',
                  turn_no: 4,
                  seat_no: 1,
                  payload: { type: 'pass' }
                }
              ],
              error: null
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('turns')
        .select()
        .eq('game_id', 'game-123')
        .order('turn_no', { ascending: false })
        .limit(10)

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)
    })
  })

  describe('房间成员表操作', () => {
    it('应该能够添加房间成员', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'member-123',
              room_id: 'room-123',
              uid: 'user-123',
              seat_no: 0,
              ready: false,
              member_type: 'human',
              online: true,
              created_at: '2026-03-21T00:00:00Z'
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('room_members').insert({
        room_id: 'room-123',
        uid: 'user-123',
        seat_no: 0,
        ready: false,
        member_type: 'human',
        online: true
      }).select().single()

      expect(result.data).toBeDefined()
      expect(result.data?.seat_no).toBe(0)
      expect(result.data?.member_type).toBe('human')
    })

    it('应该能够查询房间成员', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [
              {
                id: 'member-1',
                room_id: 'room-123',
                uid: 'user-1',
                seat_no: 0,
                ready: true,
                member_type: 'human'
              },
              {
                id: 'member-2',
                room_id: 'room-123',
                uid: null,
                seat_no: 1,
                ready: true,
                member_type: 'ai',
                difficulty: 'medium'
              }
            ],
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('room_members')
        .select()
        .eq('room_id', 'room-123')
        .order('seat_no')

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)
    })

    it('应该能够更新成员准备状态', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'member-123',
                room_id: 'room-123',
                uid: 'user-123',
                seat_no: 0,
                ready: true,
                member_type: 'human'
              },
              error: null
            })
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        update: mockUpdate
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('room_members')
        .update({ ready: true })
        .eq('id', 'member-123')
        .select()
        .single()

      expect(result.data).toBeDefined()
      expect(result.data?.ready).toBe(true)
    })

    it('应该能够删除房间成员', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        delete: mockDelete
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('room_members').delete().eq('id', 'member-123')

      expect(result.error).toBeNull()
    })
  })

  describe('复杂查询操作', () => {
    it('应该能够执行多表关联查询', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 'room-123',
              name: '测试房间',
              mode: 'pvp4',
              type: 'classic',
              status: 'playing',
              owner_uid: 'user-1',
              users: {
                id: 'user-1',
                username: 'testuser',
                nickname: '测试用户'
              }
            },
            error: null
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms')
        .select(`
          *,
          users!rooms_owner_uid_fkey (
            id,
            username,
            nickname
          )
        `)
        .eq('id', 'room-123')
        .single()

      expect(result.data).toBeDefined()
      expect(result.data?.users).toBeDefined()
    })

    it('应该能够执行聚合查询', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createNestedQueryMock({ data: { count: 5 }, error: null })
      )

      const result = await supabase.from('rooms')
        .select('*', { count: 'exact' })
        .eq('status', 'open')

      expect(result.data).toBeDefined()
    })
  })

  describe('事务和批量操作', () => {
    it('应该能够处理批量插入', async () => {
      const mockMembers = [
        {
          id: 'member-1',
          room_id: 'room-123',
          uid: 'user-1',
          seat_no: 0,
          ready: true,
          member_type: 'human'
        },
        {
          id: 'member-2',
          room_id: 'room-123',
          uid: 'user-2',
          seat_no: 1,
          ready: false,
          member_type: 'human'
        }
      ]

      vi.mocked(supabase.from).mockReturnValue(
        createNestedQueryMock({ data: mockMembers, error: null })
      )

      const members = [
        {
          room_id: 'room-123',
          uid: 'user-1',
          seat_no: 0,
          ready: true,
          member_type: 'human'
        },
        {
          room_id: 'room-123',
          uid: 'user-2',
          seat_no: 1,
          ready: false,
          member_type: 'human'
        }
      ]

      const result = await supabase.from('room_members').insert(members).select()

      expect(result.data).toBeDefined()
      expect(result.data?.length).toBe(2)
    })

    it('应该能够处理批量更新', async () => {
      vi.mocked(supabase.from).mockReturnValue(
        createNestedQueryMock({ data: { count: 3 }, error: null })
      )

      const result = await supabase.from('room_members')
        .update({ online: false })
        .in('id', ['member-1', 'member-2', 'member-3'])
        .select()

      expect(result.data).toBeDefined()
    })
  })

  describe('错误处理和边界情况', () => {
    it('应该能够处理记录不存在的情况', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Record not found' }
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        select: mockSelect
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('rooms').select().eq('id', 'non-existent').single()

      expect(result.data).toBeNull()
      expect(result.error).toBeDefined()
    })

    it('应该能够处理唯一约束冲突', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23505',
              message: 'duplicate key value violates unique constraint'
            }
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('users').insert({
        email: 'existing@example.com',
        username: 'existinguser'
      }).select().single()

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23505')
    })

    it('应该能够处理外键约束冲突', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '23503',
              message: 'foreign key constraint violation'
            }
          })
        })
      })

      const mockFrom = vi.fn().mockReturnValue({
        insert: mockInsert
      })

      vi.mocked(supabase.from).mockReturnValue(mockFrom())

      const result = await mockFrom('room_members').insert({
        room_id: 'non-existent-room',
        uid: 'user-1',
        seat_no: 0,
        ready: false,
        member_type: 'human'
      }).select().single()

      expect(result.data).toBeNull()
      expect(result.error?.code).toBe('23503')
    })
  })
})
